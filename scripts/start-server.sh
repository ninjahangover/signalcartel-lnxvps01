#!/bin/bash

# SignalCartel Server Startup Script
# Main entry point for starting the trading platform
# Supports multiple modes: normal, limited, production

# Parse command line arguments
MODE=${1:-normal}  # normal, limited, or production
CLEANUP=${2:-yes}  # yes or no

echo "🚀 SignalCartel Trading Platform Startup"
echo "========================================="
echo "Mode: $MODE"
echo "Cleanup: $CLEANUP"
echo ""

# Set working directory
cd /home/telgkb9/depot/dev-signalcartel

# Suppress npm warnings about invalid config dates
export NPM_CONFIG_FUND=false
export NPM_CONFIG_AUDIT=false
export NPM_CONFIG_OPTIONAL=false

# Function to find process by service name with multiple patterns
find_service_pid() {
    local service_name="$1"
    local pid=""
    
    case "$service_name" in
        "market-data")
            pid=$(pgrep -f "market.*data.*collector\|src/lib/market-data" | head -1)
            if [ -z "$pid" ]; then
                pid=$(ps aux | grep -E "(market.*data|tsx.*market)" | grep -v grep | awk '{print $2}' | head -1)
            fi
            ;;
        "ai-optimizer")
            pid=$(pgrep -f "pine.*script.*optimizer\|input.*optimizer\|src/lib/pine-script" | head -1)
            if [ -z "$pid" ]; then
                pid=$(ps aux | grep -E "(pine.*script|input.*optimizer|tsx.*pine)" | grep -v grep | awk '{print $2}' | head -1)
            fi
            ;;
        "strategy-engine")
            pid=$(pgrep -f "strategy.*execution\|src/lib/strategy.*execution" | head -1)
            if [ -z "$pid" ]; then
                pid=$(ps aux | grep -E "(strategy.*execution|tsx.*strategy)" | grep -v grep | awk '{print $2}' | head -1)
            fi
            ;;
        "alert-engine")
            pid=$(pgrep -f "alert.*generation\|src/lib/alert.*generation" | head -1)
            if [ -z "$pid" ]; then
                pid=$(ps aux | grep -E "(alert.*generation|tsx.*alert)" | grep -v grep | awk '{print $2}' | head -1)
            fi
            ;;
        "stratus-engine")
            pid=$(pgrep -f "global.*stratus.*engine\|src/lib/global-stratus" | head -1)
            if [ -z "$pid" ]; then
                pid=$(ps aux | grep -E "(global.*stratus|stratus.*engine|tsx.*stratus)" | grep -v grep | awk '{print $2}' | head -1)
            fi
            ;;
        "resource-monitor")
            pid=$(pgrep -f "resource.*monitor\|src/lib/resource-monitor" | head -1)
            if [ -z "$pid" ]; then
                pid=$(ps aux | grep -E "(resource.*monitor|tsx.*resource)" | grep -v grep | awk '{print $2}' | head -1)
            fi
            ;;
        "next-server")
            pid=$(pgrep -f "next.*dev.*3001\|npm.*run.*dev" | head -1)
            ;;
    esac
    
    echo "$pid"
}

# Function to check system resources
check_resources() {
    echo "📊 System Resource Check:"
    echo "-------------------------"
    
    # Memory check
    mem_total=$(free -m | awk 'NR==2{print $2}')
    mem_available=$(free -m | awk 'NR==2{print $7}')
    mem_percent=$((100 - (mem_available * 100 / mem_total)))
    echo "Memory: ${mem_available}MB available of ${mem_total}MB (${mem_percent}% used)"
    
    # CPU check
    cpu_count=$(nproc)
    load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | tr -d ',')
    echo "CPU: ${cpu_count} cores, load average: ${load_avg}"
    
    # Disk check
    disk_usage=$(df -h / | awk 'NR==2{print $5}' | tr -d '%')
    echo "Disk: ${disk_usage}% used"
    echo ""
    
    # Determine if we should use limited mode
    if [ "$MODE" = "auto" ]; then
        if [ "$mem_percent" -gt 70 ] || [ $(echo "$load_avg > $cpu_count" | bc) -eq 1 ]; then
            MODE="limited"
            echo "⚠️  High resource usage detected, switching to LIMITED mode"
        else
            MODE="normal"
        fi
    fi
}

# Function to clean up existing processes
cleanup_existing() {
    if [ "$CLEANUP" = "yes" ]; then
        echo "🧹 Cleaning up existing processes..."
        
        # Stop all services gracefully
        if [ -f ./scripts/stop-all.sh ]; then
            ./scripts/stop-all.sh > /dev/null 2>&1
        fi
        
        # Run cleanup script
        if [ -f ./scripts/cleanup-processes.sh ]; then
            ./scripts/cleanup-processes.sh > /dev/null 2>&1
        fi
        
        # Clear old logs if they're too large
        find logs -name "*.log" -size +100M -delete 2>/dev/null
        
        echo "✅ Cleanup complete"
        echo ""
    fi
}

# Function to create required directories
setup_directories() {
    mkdir -p logs
    mkdir -p data
    mkdir -p .cache
}

# Function to start services based on mode
start_services() {
    case "$MODE" in
        "limited")
            echo "🔒 Starting in RESOURCE-LIMITED mode..."
            echo "  - CPU limits: 20-50% per process"
            echo "  - Memory limits: 128-768MB per process"
            echo "  - Reduced service count"
            echo ""
            
            # Start resource manager first
            nohup ./scripts/resource-manager.sh > logs/resource-manager.log 2>&1 &
            echo "✅ Resource manager started"
            sleep 2
            
            # Use limited startup script
            ./scripts/start-all-limited.sh
            ;;
            
        "production")
            echo "🏭 Starting in PRODUCTION mode..."
            echo "  - Full optimization enabled"
            echo "  - Auto-restart on crash"
            echo "  - Monitoring and alerts active"
            echo ""
            
            # Build Next.js for production
            echo "Building Next.js application..."
            npm run build
            
            # Set production environment
            export NODE_ENV=production
            
            # Start with PM2 if available
            if command -v pm2 &> /dev/null; then
                echo "Starting with PM2 process manager..."
                pm2 start ecosystem.config.js
                pm2 save
            else
                # Fallback to regular start with monitoring
                ./scripts/start-all.sh
            fi
            
            # Start monitoring
            nohup ./scripts/monitor-website.sh > logs/monitor-website.log 2>&1 &
            nohup ./scripts/resource-manager.sh > logs/resource-manager.log 2>&1 &
            
            # Start resource monitoring
            echo "🔍 Starting resource monitoring..."
            nohup npx tsx scripts/engines/resource-monitor.ts > logs/resource-monitor.log 2>&1 &
            
            echo "✅ Production services started (with resource monitoring)"
            ;;
            
        "normal"|*)
            echo "🚀 Starting in NORMAL mode..."
            echo "  - Standard resource usage"
            echo "  - All services enabled"
            echo "  - Stable single Next.js instance for website"
            echo ""
            
            # Check if resource manager should run
            mem_available=$(free -m | awk 'NR==2{print $7}')
            if [ "$mem_available" -lt 2000 ]; then
                echo "⚠️  Low memory detected, starting resource manager..."
                nohup ./scripts/resource-manager.sh > logs/resource-manager.log 2>&1 &
                sleep 2
            fi
            
            # Set up Telegram alerts for notifications
            if [ -f ".env.local" ]; then
                source .env.local
                echo "📱 Telegram alerts enabled for system notifications"
            else
                echo "⚠️ .env.local not found - Telegram alerts disabled"
            fi
            
            # Start trading engines first
            echo "🚀 Starting trading engines..."
            ./scripts/start-all.sh
            
            # Wait for engines to stabilize
            echo "⏳ Waiting for trading engines to stabilize..."
            sleep 10
            
            # Start resource monitoring
            echo "🔍 Starting resource monitoring..."
            nohup npx tsx scripts/engines/resource-monitor.ts > logs/resource-monitor.log 2>&1 &
            
            # Wait a bit more for resource monitor
            sleep 5
            
            # Start simple Next.js server LAST (stable single-instance approach)
            echo "🚀 Starting Next.js website server..."
            nohup npm run dev > logs/website.log 2>&1 &
            
            # Give web server time to start and compile
            echo "⏳ Waiting for Next.js to compile and be ready..."
            sleep 25
            
            echo "✅ All services started with stable Next.js website"
            echo "📱 Telegram notifications are active - you should receive startup confirmation!"
            ;;
    esac
}

# Function to display status after startup
show_status() {
    echo ""
    echo "📊 Service Status:"
    echo "==================="
    
    # Check website
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001" | grep -q "200\|503\|404"; then
        echo "✅ Website: Running on http://localhost:3001 (stable Next.js)"
    else
        echo "⚠️  Website: Starting up..."
    fi
    
    # Count running services
    node_count=$(pgrep -c node)
    npm_count=$(pgrep -c npm)
    tsx_count=$(pgrep -c tsx)
    
    echo "📦 Processes: $node_count Node.js, $npm_count NPM, $tsx_count TSX"
    
    # Show resource usage
    echo ""
    echo "💻 Current Resource Usage:"
    free -h | grep "^Mem:" | awk '{print "   Memory: " $3 " used of " $2}'
    echo "   CPU Load: $(uptime | awk -F'load average:' '{print $2}')"
    
    echo ""
    echo "📝 Useful Commands:"
    echo "   Monitor logs:     tail -f logs/*.log"
    echo "   Check status:     ./scripts/status.sh"
    echo "   Stop all:         ./scripts/stop-all.sh"
    echo "   Cleanup:          ./scripts/cleanup-processes.sh"
    
    if [ "$MODE" = "limited" ]; then
        echo "   Switch to normal: ./scripts/start-server.sh normal"
    else
        echo "   Switch to limited: ./scripts/start-server.sh limited"
    fi
    
    echo ""
    echo "✨ SignalCartel Trading Platform is ready!"
}

# Function to setup signal handlers
setup_signals() {
    trap 'echo "Received shutdown signal, stopping services..."; ./scripts/stop-all.sh; exit 0' SIGTERM SIGINT
}

# Main execution
main() {
    # Setup signal handlers
    setup_signals
    
    # Setup directories
    setup_directories
    
    # Check system resources
    check_resources
    
    # Clean up if requested
    cleanup_existing
    
    # Start services
    start_services
    
    # Wait a bit for services to start
    sleep 5
    
    # Show status
    show_status
    
    # Show real-time verbose output from all services
    echo ""
    echo "🔍 Showing real-time service output... (Press Ctrl+C to stop)"
    echo "============================================================="
    echo "✨ All API calls, trading activity, and system events will appear below:"
    echo ""
    
    # Function to tail all service logs with prefixes for identification
    show_realtime_logs() {
        # Create a list of log files to monitor
        local log_files=()
        
        # Add service logs if they exist
        [ -f "market-data-collector.log" ] && log_files+=("market-data-collector.log")
        [ -f "strategy-execution-engine.log" ] && log_files+=("strategy-execution-engine.log")
        [ -f "alert-generation-engine.log" ] && log_files+=("alert-generation-engine.log")
        [ -f "ai-optimization-engine.log" ] && log_files+=("ai-optimization-engine.log")
        [ -f "stratus-engine.log" ] && log_files+=("stratus-engine.log")
        [ -f "logs/resource-monitor.log" ] && log_files+=("logs/resource-monitor.log")
        [ -f "logs/fast-server.log" ] && log_files+=("logs/fast-server.log")
        [ -f "logs/nextjs-server.log" ] && log_files+=("logs/nextjs-server.log")
        
        if [ ${#log_files[@]} -gt 0 ]; then
            echo "📊 Monitoring ${#log_files[@]} service log files in real-time..."
            echo "🔄 Real-time output (newest entries appear below):"
            echo "=================================================="
            
            # Use multitail or tail -f with labels
            if command -v multitail >/dev/null 2>&1; then
                multitail "${log_files[@]}"
            else
                # Fallback to tail with labels
                for log in "${log_files[@]}"; do
                    echo "Starting tail for $log..." >&2
                    tail -f "$log" 2>/dev/null | sed "s/^/[$(basename "$log" .log)] /" &
                done
                
                # Keep the script running
                wait
            fi
        else
            echo "⚠️  No service log files found yet. Services may still be starting..."
            echo "💡 Waiting for services to create log files..."
            
            # Wait for log files to appear
            while [ ${#log_files[@]} -eq 0 ]; do
                sleep 2
                log_files=()
                [ -f "market-data-collector.log" ] && log_files+=("market-data-collector.log")
                [ -f "strategy-execution-engine.log" ] && log_files+=("strategy-execution-engine.log")
                [ -f "alert-generation-engine.log" ] && log_files+=("alert-generation-engine.log")
                [ -f "ai-optimization-engine.log" ] && log_files+=("ai-optimization-engine.log")
                [ -f "stratus-engine.log" ] && log_files+=("stratus-engine.log")
                echo "Checking for log files... (found ${#log_files[@]})"
            done
            
            # Recursive call once files exist
            show_realtime_logs
        fi
    }
    
    # Start real-time log monitoring
    show_realtime_logs
}

# Run main function
main