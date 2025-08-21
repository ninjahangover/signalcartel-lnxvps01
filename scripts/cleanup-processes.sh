#!/bin/bash

# Process Cleanup Script
# Kills runaway processes and frees up system resources

echo "🧹 Cleaning up runaway processes..."

# Function to kill processes by pattern
kill_by_pattern() {
    local pattern=$1
    local signal=${2:-TERM}
    
    pids=$(pgrep -f "$pattern" 2>/dev/null)
    
    if [ -n "$pids" ]; then
        echo "Killing processes matching: $pattern"
        for pid in $pids; do
            echo "  - Killing PID $pid"
            kill -$signal $pid 2>/dev/null
        done
        sleep 2
        
        # Force kill if still running
        for pid in $pids; do
            if kill -0 $pid 2>/dev/null; then
                echo "  - Force killing PID $pid"
                kill -9 $pid 2>/dev/null
            fi
        done
    fi
}

# 1. Kill zombie/defunct processes
echo "Cleaning up zombie processes..."
ps aux | grep '<defunct>' | grep -v grep | awk '{print $2}' | xargs -r kill -9 2>/dev/null

# 2. Kill stuck esbuild processes
echo "Checking for stuck esbuild processes..."
for pid in $(pgrep -f "esbuild"); do
    # Check if process has been running for more than 5 minutes
    runtime=$(ps -o etimes= -p $pid 2>/dev/null | tr -d ' ')
    if [ -n "$runtime" ] && [ "$runtime" -gt 300 ]; then
        echo "Killing stuck esbuild process $pid (running for ${runtime}s)"
        kill -9 $pid 2>/dev/null
    fi
done

# 3. Kill excessive Node.js processes
echo "Checking for excessive Node.js processes..."
node_count=$(pgrep -c "node")
if [ "$node_count" -gt 10 ]; then
    echo "Found $node_count Node.js processes (limit: 10)"
    
    # Kill the oldest ones first
    ps aux | grep node | grep -v grep | sort -k9 | head -n -10 | awk '{print $2}' | while read pid; do
        echo "Killing excess Node.js process $pid"
        kill -TERM $pid 2>/dev/null
    done
fi

# 4. Kill processes using too much memory (>1GB)
echo "Checking for memory-hungry processes..."
ps aux | awk '$6 > 1048576 {print $2, $11, $6}' | while read pid cmd mem; do
    # Skip essential processes
    if [[ "$cmd" =~ (systemd|kernel|chrome|firefox) ]]; then
        continue
    fi
    
    mem_gb=$(echo "scale=2; $mem / 1048576" | bc)
    echo "Process $pid ($cmd) using ${mem_gb}GB memory"
    
    if [ $(echo "$mem_gb > 2" | bc) -eq 1 ]; then
        echo "  - Killing high-memory process $pid"
        kill -TERM $pid 2>/dev/null
    fi
done

# 5. Clean up orphaned tsx processes
echo "Cleaning up orphaned tsx processes..."
kill_by_pattern "tsx.*--service"

# 6. Clean up cpulimit processes
echo "Cleaning up cpulimit processes..."
pkill -f "cpulimit" 2>/dev/null

# 7. Clear npm cache if it's too large
npm_cache_size=$(du -sm ~/.npm 2>/dev/null | cut -f1)
if [ -n "$npm_cache_size" ] && [ "$npm_cache_size" -gt 500 ]; then
    echo "NPM cache is ${npm_cache_size}MB, clearing..."
    npm cache clean --force 2>/dev/null
fi

# 8. Clear Next.js cache if needed
nextjs_cache="/home/telgkb9/depot/dev-signalcartel/.next"
if [ -d "$nextjs_cache" ]; then
    cache_size=$(du -sm "$nextjs_cache" 2>/dev/null | cut -f1)
    if [ -n "$cache_size" ] && [ "$cache_size" -gt 1000 ]; then
        echo "Next.js cache is ${cache_size}MB, clearing old files..."
        find "$nextjs_cache" -type f -mtime +1 -delete 2>/dev/null
    fi
fi

# 9. Report system status
echo ""
echo "System status after cleanup:"
echo "=========================="
free -h | head -2
echo ""
echo "CPU Load: $(uptime | awk -F'load average:' '{print $2}')"
echo "Node processes: $(pgrep -c node)"
echo "NPM processes: $(pgrep -c npm)"
echo "TSX processes: $(pgrep -c tsx)"
echo ""
echo "✅ Cleanup complete!"