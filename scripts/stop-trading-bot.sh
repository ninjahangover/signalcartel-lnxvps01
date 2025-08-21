#!/bin/bash

echo "🛑 Shutting Down SignalCartel Trading System..."
echo "=============================================="

# Function to gracefully stop a service
stop_service() {
    local name=$1
    local pattern=$2
    local timeout=${3:-10}
    
    echo "🔹 Stopping $name..."
    
    # Get PIDs matching the pattern
    local pids=$(ps aux | grep "$pattern" | grep -v grep | awk '{print $2}')
    
    if [ -z "$pids" ]; then
        echo "   ✓ $name is not running"
        return 0
    fi
    
    # Send SIGTERM first (graceful shutdown)
    for pid in $pids; do
        if kill -0 $pid 2>/dev/null; then
            echo "   📤 Sending SIGTERM to $name (PID: $pid)"
            kill -TERM $pid
        fi
    done
    
    # Wait for graceful shutdown
    local count=0
    while [ $count -lt $timeout ]; do
        local remaining_pids=$(ps aux | grep "$pattern" | grep -v grep | awk '{print $2}')
        if [ -z "$remaining_pids" ]; then
            echo "   ✅ $name stopped gracefully"
            return 0
        fi
        sleep 1
        count=$((count + 1))
        echo -n "."
    done
    
    echo ""
    
    # Force kill if still running
    local remaining_pids=$(ps aux | grep "$pattern" | grep -v grep | awk '{print $2}')
    if [ ! -z "$remaining_pids" ]; then
        echo "   ⚠️  $name didn't stop gracefully, force killing..."
        for pid in $remaining_pids; do
            if kill -0 $pid 2>/dev/null; then
                kill -KILL $pid
                echo "   💥 Force killed PID: $pid"
            fi
        done
        echo "   ✅ $name force stopped"
    fi
}

# Save final status before shutdown
echo "📊 Saving final system status..."
{
    echo "=== SHUTDOWN REPORT $(date) ==="
    echo "Process Count: $(ps aux | grep -E '(tsx|next)' | grep -v grep | wc -l)"
    echo "Memory Usage: $(free -h | grep Mem:)"
    echo "Disk Usage: $(df -h / | tail -1)"
    echo "Uptime: $(uptime)"
    echo ""
    
    if [ -f strategy-execution-engine.log ]; then
        echo "Last Strategy Engine Status:"
        tail -5 strategy-execution-engine.log | grep -E "(RUNNING|STOPPED|Engine)" || echo "No status found"
        echo ""
    fi
    
    if [ -f alert-generation-engine.log ]; then
        echo "Last Alert Engine Status:"
        tail -5 alert-generation-engine.log | grep -E "(Alert Engine|RUNNING)" || echo "No status found"
        echo ""
    fi
    
    echo "==============================================="
} >> shutdown-report.log

# Archive current logs before stopping
echo "📁 Archiving current session logs..."
timestamp=$(date +%Y%m%d_%H%M%S)
mkdir -p logs/sessions/$timestamp
cp *.log logs/sessions/$timestamp/ 2>/dev/null
echo "   ✓ Logs archived to logs/sessions/$timestamp/"

# Stop services in reverse order (opposite of startup)
echo ""
echo "🔄 Stopping services in shutdown sequence..."

# 1. Stop Stratus Engine (Master Controller)
stop_service "🎯 Stratus Engine" "start-stratus-engine" 15

# 2. Stop AI Optimization Engine
stop_service "🧠 AI Optimization Engine" "start-ai-optimizer" 10

# 3. Stop Alert Generation Engine
stop_service "🚨 Alert Generation Engine" "start-alert-engine" 10

# 4. Stop Strategy Execution Engine
stop_service "⚡ Strategy Execution Engine" "start-strategy-engine" 15

# 5. Stop Market Data Collector
stop_service "📊 Market Data Collector" "start-market-data" 10

# 6. Stop Next.js Server (last, as others depend on it)
stop_service "📱 Next.js Server" "next dev" 15

# Clean up any remaining tsx processes
echo ""
echo "🧹 Cleaning up remaining processes..."
remaining=$(ps aux | grep tsx | grep -v grep | wc -l)
if [ $remaining -gt 0 ]; then
    echo "   ⚠️  Found $remaining remaining tsx processes"
    ps aux | grep tsx | grep -v grep | awk '{print $2}' | xargs -r kill -KILL
    echo "   ✅ Cleaned up remaining processes"
else
    echo "   ✓ No remaining processes to clean"
fi

# Final system status
echo ""
echo "📋 Final System Status:"
echo "   - Active tsx processes: $(ps aux | grep tsx | grep -v grep | wc -l)"
echo "   - Active next processes: $(ps aux | grep 'next dev' | grep -v grep | wc -l)"
echo "   - Memory available: $(free -h | grep Mem: | awk '{print $7}')"

# Rotate logs one final time
if [ -f scripts/rotate-logs.sh ]; then
    echo ""
    echo "🔄 Final log rotation..."
    ./scripts/rotate-logs.sh
fi

echo ""
echo "✅ SignalCartel Trading System Shutdown Complete!"
echo "=============================================="
echo ""
echo "📈 Session Report: shutdown-report.log"
echo "📁 Logs Archived: logs/sessions/$timestamp/"
echo "🚀 Restart with: ./scripts/start-trading-bot.sh"
echo ""