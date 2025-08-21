#!/bin/bash

# SignalCartel Complete Shutdown Script
# Ensures ALL processes are stopped

echo "🛑 Stopping SignalCartel Trading Platform..."
echo "========================================="

# Track what we're killing
KILLED_COUNT=0
FORCE_KILLED_COUNT=0

# Function to log kills
log_kill() {
    echo "  ✓ $1"
    KILLED_COUNT=$((KILLED_COUNT + 1))
}

# Function to find process by service name with multiple patterns (same as start script)
find_service_pids() {
    local service_name="$1"
    local pids=""
    
    case "$service_name" in
        "market-data")
            pids=$(pgrep -f "market.*data.*collector\|src/lib/market-data" 2>/dev/null)
            if [ -z "$pids" ]; then
                pids=$(ps aux | grep -E "(market.*data|tsx.*market)" | grep -v grep | awk '{print $2}')
            fi
            ;;
        "ai-optimizer")
            pids=$(pgrep -f "pine.*script.*optimizer\|input.*optimizer\|src/lib/pine-script" 2>/dev/null)
            if [ -z "$pids" ]; then
                pids=$(ps aux | grep -E "(pine.*script|input.*optimizer|tsx.*pine)" | grep -v grep | awk '{print $2}')
            fi
            ;;
        "strategy-engine")
            pids=$(pgrep -f "strategy.*execution\|src/lib/strategy.*execution" 2>/dev/null)
            if [ -z "$pids" ]; then
                pids=$(ps aux | grep -E "(strategy.*execution|tsx.*strategy)" | grep -v grep | awk '{print $2}')
            fi
            ;;
        "alert-engine")
            pids=$(pgrep -f "alert.*generation\|src/lib/alert.*generation" 2>/dev/null)
            if [ -z "$pids" ]; then
                pids=$(ps aux | grep -E "(alert.*generation|tsx.*alert)" | grep -v grep | awk '{print $2}')
            fi
            ;;
        "stratus-engine")
            pids=$(pgrep -f "global.*stratus.*engine\|src/lib/global-stratus" 2>/dev/null)
            if [ -z "$pids" ]; then
                pids=$(ps aux | grep -E "(global.*stratus|stratus.*engine|tsx.*stratus)" | grep -v grep | awk '{print $2}')
            fi
            ;;
        "resource-monitor")
            pids=$(pgrep -f "resource.*monitor\|src/lib/resource-monitor" 2>/dev/null)
            if [ -z "$pids" ]; then
                pids=$(ps aux | grep -E "(resource.*monitor|tsx.*resource)" | grep -v grep | awk '{print $2}')
            fi
            ;;
        "unified-strategy")
            pids=$(pgrep -f "unified.*strategy\|src/lib/unified-strategy" 2>/dev/null)
            if [ -z "$pids" ]; then
                pids=$(ps aux | grep -E "(unified.*strategy|tsx.*unified)" | grep -v grep | awk '{print $2}')
            fi
            ;;
        "next-server")
            pids=$(pgrep -f "next.*dev.*3001\|next.*start.*3001\|npm.*run.*dev" 2>/dev/null)
            ;;
    esac
    
    echo "$pids"
}

# Enhanced function to kill services by name with robust detection
kill_service() {
    local service_name="$1"
    local description="$2"
    local force="${3:-false}"
    
    local pids=$(find_service_pids "$service_name")
    
    if [ -n "$pids" ]; then
        echo "Stopping $description..."
        for pid in $pids; do
            if [ -n "$pid" ] && [ "$pid" != "" ]; then
                local cmd=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
                
                if [ "$force" = "true" ]; then
                    kill -9 $pid 2>/dev/null && log_kill "Force killed $description PID $pid ($cmd)"
                    FORCE_KILLED_COUNT=$((FORCE_KILLED_COUNT + 1))
                else
                    kill -TERM $pid 2>/dev/null && log_kill "Terminated $description PID $pid ($cmd)"
                    sleep 0.5
                    
                    # Force kill if still running after grace period
                    if kill -0 $pid 2>/dev/null; then
                        kill -9 $pid 2>/dev/null && log_kill "Force killed stubborn $description PID $pid"
                        FORCE_KILLED_COUNT=$((FORCE_KILLED_COUNT + 1))
                    fi
                fi
            fi
        done
    else
        echo "  ℹ️  $description: not running"
    fi
}

# Function to kill processes by pattern with confirmation
kill_pattern() {
    local pattern="$1"
    local description="$2"
    local force="${3:-false}"
    
    # Find PIDs matching pattern
    local pids=$(pgrep -f "$pattern" 2>/dev/null)
    
    if [ -n "$pids" ]; then
        echo "Stopping $description..."
        for pid in $pids; do
            # Get process command for logging
            local cmd=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
            
            if [ "$force" = "true" ]; then
                kill -9 $pid 2>/dev/null && log_kill "Force killed PID $pid ($cmd)"
                FORCE_KILLED_COUNT=$((FORCE_KILLED_COUNT + 1))
            else
                kill -TERM $pid 2>/dev/null && log_kill "Terminated PID $pid ($cmd)"
            fi
        done
        
        # Wait a moment for graceful shutdown
        if [ "$force" != "true" ]; then
            sleep 1
            
            # Force kill any remaining
            for pid in $pids; do
                if kill -0 $pid 2>/dev/null; then
                    kill -9 $pid 2>/dev/null && log_kill "Force killed stubborn PID $pid"
                    FORCE_KILLED_COUNT=$((FORCE_KILLED_COUNT + 1))
                fi
            done
        fi
    fi
}

# Function to kill by port
kill_port() {
    local port="$1"
    local description="$2"
    
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$pids" ]; then
        echo "Stopping $description on port $port..."
        for pid in $pids; do
            kill -TERM $pid 2>/dev/null && log_kill "Terminated PID $pid (port $port)"
        done
        sleep 1
        for pid in $pids; do
            if kill -0 $pid 2>/dev/null; then
                kill -9 $pid 2>/dev/null && log_kill "Force killed PID $pid (port $port)"
                FORCE_KILLED_COUNT=$((FORCE_KILLED_COUNT + 1))
            fi
        done
    fi
}

# Function to stop PM2 processes
stop_pm2() {
    if command -v pm2 &> /dev/null; then
        echo "Stopping PM2 processes..."
        pm2 stop all 2>/dev/null && log_kill "PM2 processes"
        pm2 kill 2>/dev/null
    fi
}

# 1. Stop SignalCartel services using robust detection
echo ""
echo "🎯 Stopping SignalCartel Trading Services..."
echo "============================================"

# Stop services in reverse order of startup for clean shutdown
kill_service "stratus-engine" "🎯 Stratus Engine with Neural Predictor"
kill_service "alert-engine" "🚨 Alert Generation Engine"
kill_service "strategy-engine" "⚡ Strategy Execution Engine"
kill_service "ai-optimizer" "🧠 AI Optimization Engine"
kill_service "unified-strategy" "🎯 Unified Strategy Controller"
kill_service "market-data" "📊 Market Data Collector"
kill_service "resource-monitor" "🔍 Resource Monitor"

# Stop monitoring and management scripts
echo ""
echo "📊 Stopping monitoring services..."
kill_pattern "monitor-website.sh" "Website monitor"
kill_pattern "resource-manager.sh" "Resource manager"
kill_pattern "cpulimit" "CPU limiters"

# Stop Next.js and web servers
echo ""
echo "🌐 Stopping web servers..."
kill_service "next-server" "📱 Next.js Website Server"
kill_port 3001 "Next.js server (port check)"
kill_port 3000 "Alternative web server"

# 4. Stop remaining TSX and NPM processes
echo ""
echo "⚡ Stopping remaining TSX and NPM processes..."
kill_pattern "npx tsx.*-e" "TSX inline execution processes"
kill_pattern "tsx.*--service" "TSX service workers"
kill_pattern "npx tsx" "TSX executors"
kill_pattern "node.*tsx" "Node TSX processes"
kill_pattern "npm run" "NPM run scripts"
kill_pattern "npm exec" "NPM exec commands"

# 5. Stop esbuild processes
echo ""
echo "🔧 Stopping build processes..."
kill_pattern "esbuild" "ESBuild processes"
kill_pattern "webpack" "Webpack processes"
kill_pattern "turbopack" "Turbopack processes"

# 6. Stop any remaining build and development processes
echo ""
echo "🔧 Final cleanup of development processes..."
kill_pattern "npm start" "NPM start commands"

# 7. Kill any remaining Node processes from our directory
echo ""
echo "🔍 Cleaning up remaining processes..."
# Find all node processes running from our directory
for pid in $(pgrep node); do
    if [ -n "$pid" ]; then
        # Check if process is running from our directory
        cwd=$(readlink /proc/$pid/cwd 2>/dev/null)
        if [[ "$cwd" == *"dev-signalcartel"* ]]; then
            kill -TERM $pid 2>/dev/null && log_kill "Node process PID $pid from our directory"
            sleep 0.5
            if kill -0 $pid 2>/dev/null; then
                kill -9 $pid 2>/dev/null && log_kill "Force killed Node PID $pid"
                FORCE_KILLED_COUNT=$((FORCE_KILLED_COUNT + 1))
            fi
        fi
    fi
done

# 8. Clean up any zombie processes
echo ""
echo "☠️ Cleaning zombie processes..."
zombies=$(ps aux | grep '<defunct>' | grep -v grep | awk '{print $2}')
if [ -n "$zombies" ]; then
    for pid in $zombies; do
        kill -9 $pid 2>/dev/null && log_kill "Zombie process PID $pid"
    done
fi

# 9. Final sweep - kill anything else that might be related
echo ""
echo "🧹 Final cleanup sweep..."
kill_pattern "/home/telgkb9/depot/dev-signalcartel" "Any remaining project processes" true

# 10. Clean up lock files and temp files
echo ""
echo "🗑️ Cleaning up lock files..."
rm -f /home/telgkb9/depot/dev-signalcartel/.next/cache/webpack/*.lock 2>/dev/null
rm -f /home/telgkb9/depot/dev-signalcartel/node_modules/.cache/*.lock 2>/dev/null
rm -f /home/telgkb9/depot/dev-signalcartel/*.pid 2>/dev/null

# 11. Verify everything is stopped
echo ""
echo "🔍 Verification..."
echo "========================================="

# Check for any remaining processes
remaining_node=$(pgrep -c node 2>/dev/null || echo 0)
remaining_npm=$(pgrep -c npm 2>/dev/null || echo 0)
remaining_tsx=$(pgrep -c tsx 2>/dev/null || echo 0)

# Check our specific ports
port_3001=$(lsof -ti:3001 2>/dev/null | wc -l)
port_3000=$(lsof -ti:3000 2>/dev/null | wc -l)

# Check for SignalCartel services specifically
echo "🔍 Verifying all SignalCartel services are stopped..."
services_still_running=0
services_list=("market-data" "ai-optimizer" "strategy-engine" "alert-engine" "stratus-engine" "resource-monitor" "unified-strategy" "next-server")

for service in "${services_list[@]}"; do
    pids=$(find_service_pids "$service")
    if [ -n "$pids" ]; then
        services_still_running=$((services_still_running + 1))
        echo "⚠️  $service still running: PIDs $pids"
    fi
done

# Check for processes in our directory
our_processes=0
for pid in $(pgrep node 2>/dev/null); do
    if [ -n "$pid" ]; then
        cwd=$(readlink /proc/$pid/cwd 2>/dev/null)
        if [[ "$cwd" == *"dev-signalcartel"* ]]; then
            our_processes=$((our_processes + 1))
            echo "⚠️  Node process still running: PID $pid in $cwd"
        fi
    fi
done

# Report results
echo ""
echo "📊 Shutdown Summary:"
echo "  Processes terminated: $KILLED_COUNT"
echo "  Processes force-killed: $FORCE_KILLED_COUNT"
echo ""

if [ "$remaining_node" -eq 0 ] && [ "$remaining_npm" -eq 0 ] && [ "$remaining_tsx" -eq 0 ] && \
   [ "$port_3001" -eq 0 ] && [ "$port_3000" -eq 0 ] && [ "$our_processes" -eq 0 ] && [ "$services_still_running" -eq 0 ]; then
    echo "✅ All SignalCartel services successfully stopped!"
    echo ""
    
    # Show memory freed
    echo "💾 System Resources:"
    free -h | head -2
    echo ""
    echo "To restart, run: ./scripts/start-server.sh"
else
    echo "⚠️  Warning: Some processes may still be running:"
    [ "$services_still_running" -gt 0 ] && echo "  - SignalCartel services: $services_still_running still running"
    [ "$remaining_node" -gt 0 ] && echo "  - Node.js processes: $remaining_node"
    [ "$remaining_npm" -gt 0 ] && echo "  - NPM processes: $remaining_npm"
    [ "$remaining_tsx" -gt 0 ] && echo "  - TSX processes: $remaining_tsx"
    [ "$port_3001" -gt 0 ] && echo "  - Port 3001 still in use"
    [ "$port_3000" -gt 0 ] && echo "  - Port 3000 still in use"
    [ "$our_processes" -gt 0 ] && echo "  - Processes in project directory: $our_processes"
    echo ""
    echo "Run with force flag to kill all: $0 --force"
fi

# Handle force flag
if [ "$1" = "--force" ] && [ "$our_processes" -gt 0 ]; then
    echo ""
    echo "🔨 FORCE MODE: Killing all remaining processes..."
    pkill -9 -f "dev-signalcartel"
    pkill -9 node
    pkill -9 npm
    pkill -9 tsx
    echo "✅ Force kill complete!"
fi

echo "========================================="