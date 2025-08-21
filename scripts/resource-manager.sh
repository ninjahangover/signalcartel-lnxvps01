#!/bin/bash

# Resource Management Script
# Monitors and limits CPU/memory usage for all trading system processes

# Configuration
MAX_CPU_PER_PROCESS=50      # Max CPU % per process (50% = 0.5 cores)
MAX_MEMORY_PER_PROCESS=512  # Max memory in MB per process
MAX_TOTAL_CPU=150           # Max total CPU % for all processes (150% = 1.5 cores)
CHECK_INTERVAL=10           # Check every 10 seconds
LOG_FILE="/home/telgkb9/depot/dev-signalcartel/logs/resource-manager.log"

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to get CPU usage for a process
get_cpu_usage() {
    local pid=$1
    ps -p $pid -o %cpu= 2>/dev/null | tr -d ' '
}

# Function to get memory usage for a process (in MB)
get_memory_usage() {
    local pid=$1
    ps -p $pid -o rss= 2>/dev/null | awk '{print int($1/1024)}'
}

# Function to throttle a process using cpulimit
throttle_process() {
    local pid=$1
    local cpu_limit=$2
    
    # Check if cpulimit is installed
    if ! command -v cpulimit &> /dev/null; then
        log_message "WARNING: cpulimit not installed. Installing..."
        sudo apt-get install -y cpulimit 2>/dev/null || log_message "Failed to install cpulimit"
        return
    fi
    
    # Check if already limited
    if pgrep -f "cpulimit.*-p $pid" > /dev/null; then
        return
    fi
    
    log_message "Throttling process $pid to ${cpu_limit}% CPU"
    cpulimit -p $pid -l $cpu_limit -b > /dev/null 2>&1
}

# Function to kill high-resource processes
kill_runaway_process() {
    local pid=$1
    local reason=$2
    
    log_message "KILLING runaway process $pid: $reason"
    
    # Try graceful shutdown first
    kill -TERM $pid 2>/dev/null
    sleep 2
    
    # Force kill if still running
    if kill -0 $pid 2>/dev/null; then
        kill -KILL $pid 2>/dev/null
    fi
}

# Function to check and manage Node.js/npm processes
check_nodejs_processes() {
    local total_cpu=0
    local process_count=0
    
    # Find all Node.js and npm processes
    for pid in $(pgrep -f "node|npm|tsx" | grep -v $$); do
        if [ -z "$pid" ]; then continue; fi
        
        process_count=$((process_count + 1))
        
        # Get process info
        local cmd=$(ps -p $pid -o comm= 2>/dev/null)
        local cpu=$(get_cpu_usage $pid)
        local mem=$(get_memory_usage $pid)
        
        # Skip if we can't get stats
        if [ -z "$cpu" ] || [ -z "$mem" ]; then continue; fi
        
        # Convert CPU to integer for comparison
        cpu_int=$(echo "$cpu" | cut -d. -f1)
        total_cpu=$(echo "$total_cpu + $cpu" | bc)
        
        # Check CPU limit
        if [ "$cpu_int" -gt "$MAX_CPU_PER_PROCESS" ]; then
            log_message "Process $pid ($cmd) using ${cpu}% CPU (limit: ${MAX_CPU_PER_PROCESS}%)"
            throttle_process $pid $MAX_CPU_PER_PROCESS
        fi
        
        # Check memory limit
        if [ "$mem" -gt "$MAX_MEMORY_PER_PROCESS" ]; then
            log_message "Process $pid ($cmd) using ${mem}MB memory (limit: ${MAX_MEMORY_PER_PROCESS}MB)"
            
            # For memory, we might need to kill if it's really excessive
            if [ "$mem" -gt $((MAX_MEMORY_PER_PROCESS * 2)) ]; then
                kill_runaway_process $pid "Excessive memory usage: ${mem}MB"
            fi
        fi
    done
    
    # Check total CPU usage
    total_cpu_int=$(echo "$total_cpu" | cut -d. -f1)
    if [ "$total_cpu_int" -gt "$MAX_TOTAL_CPU" ]; then
        log_message "WARNING: Total CPU usage is ${total_cpu}% (limit: ${MAX_TOTAL_CPU}%)"
        log_message "Active Node.js processes: $process_count"
        
        # Find and throttle the highest CPU consumers
        pgrep -f "node|npm|tsx" | while read pid; do
            cpu=$(get_cpu_usage $pid)
            cpu_int=$(echo "$cpu" | cut -d. -f1)
            if [ "$cpu_int" -gt 30 ]; then
                throttle_process $pid 30
            fi
        done
    fi
}

# Function to clean up zombie processes
cleanup_zombies() {
    local zombies=$(ps aux | grep '<defunct>' | grep -v grep | awk '{print $2}')
    
    if [ -n "$zombies" ]; then
        log_message "Found zombie processes, cleaning up..."
        for pid in $zombies; do
            kill -9 $pid 2>/dev/null
        done
    fi
}

# Function to monitor esbuild processes (they can be resource-heavy)
check_esbuild_processes() {
    for pid in $(pgrep -f "esbuild"); do
        local cpu=$(get_cpu_usage $pid)
        local cpu_int=$(echo "$cpu" | cut -d. -f1)
        
        if [ "$cpu_int" -gt 80 ]; then
            log_message "esbuild process $pid using ${cpu}% CPU, throttling..."
            throttle_process $pid 50
        fi
    done
}

# Main monitoring loop
log_message "Starting resource manager with limits: CPU=${MAX_CPU_PER_PROCESS}% per process, Memory=${MAX_MEMORY_PER_PROCESS}MB"
log_message "Total CPU limit: ${MAX_TOTAL_CPU}%"

while true; do
    # Check Node.js processes
    check_nodejs_processes
    
    # Check esbuild processes
    check_esbuild_processes
    
    # Clean up zombies
    cleanup_zombies
    
    # Sleep before next check
    sleep $CHECK_INTERVAL
done