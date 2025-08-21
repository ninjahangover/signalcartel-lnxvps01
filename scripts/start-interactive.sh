#!/bin/bash

# Interactive startup script with real-time monitoring
# Use Ctrl+C to gracefully stop all services

echo "🚀 SignalCartel Trading System - Interactive Mode"
echo "================================================="
echo "📊 Real-time monitoring enabled"
echo "🛑 Press Ctrl+C to stop all services gracefully"
echo ""

# Colors for better visibility
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local service=$2
    local message=$3
    echo -e "${color}[$(date '+%H:%M:%S')] $service: $message${NC}"
}

# Trap Ctrl+C and cleanup
cleanup() {
    echo ""
    echo -e "${RED}🛑 Interrupt received, shutting down gracefully...${NC}"
    echo ""
    
    # Use our elegant shutdown script
    ./scripts/stop-trading-bot.sh
    
    echo ""
    echo -e "${GREEN}✅ All services stopped. Goodbye!${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Function to monitor a service in background
monitor_service() {
    local service_name=$1
    local log_file=$2
    local color=$3
    local filter_pattern=${4:-".*"}
    
    if [ -f "$log_file" ]; then
        tail -f "$log_file" 2>/dev/null | while read line; do
            if echo "$line" | grep -qE "$filter_pattern"; then
                print_status "$color" "$service_name" "$line"
            fi
        done &
    fi
}

# Clear any existing services
echo "🧹 Cleaning up any existing processes..."
pkill -f "tsx" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 2

# Start services with staggered timing
print_status "$BLUE" "STARTUP" "Starting Next.js server..."
npm run dev > nextjs-server.log 2>&1 &
sleep 3

print_status "$CYAN" "STARTUP" "Starting Market Data Collector..."
npx tsx src/scripts/start-market-data.ts > market-data-collector.log 2>&1 &
sleep 2

print_status "$PURPLE" "STARTUP" "Starting Strategy Execution Engine..."
npx tsx src/scripts/start-strategy-engine-simple.ts > strategy-execution-engine.log 2>&1 &
sleep 2

print_status "$YELLOW" "STARTUP" "Starting Alert Generation Engine..."
npx tsx src/scripts/start-alert-engine.ts > alert-generation-engine.log 2>&1 &
sleep 2

print_status "$GREEN" "STARTUP" "Starting AI Optimization Engine..."
npx tsx src/scripts/start-ai-optimizer.ts > ai-optimization-engine.log 2>&1 &
sleep 2

print_status "$WHITE" "STARTUP" "Starting Stratus Engine..."
npx tsx src/scripts/start-stratus-engine.ts > stratus-engine.log 2>&1 &
sleep 3

print_status "$GREEN" "SYSTEM" "All services started! Monitoring activity..."
echo ""
echo "📈 Real-time Activity Monitor:"
echo "================================"

# Give services time to initialize
sleep 3

# Start monitoring all services with different colors and filters
monitor_service "💰 PRICE" "market-data-collector.log" "$GREEN" "(Successfully fetched|Real price|Stored data)"
monitor_service "⚡ STRATEGY" "strategy-execution-engine.log" "$YELLOW" "(BUY|SELL|Signal|Entry|Exit|Engine: RUNNING|Added strategy)"
monitor_service "🚨 ALERTS" "alert-generation-engine.log" "$RED" "(Alert|Signal|Generated)"
monitor_service "🧠 AI-OPT" "ai-optimization-engine.log" "$PURPLE" "(optimization|recommendation|ACTIVE)"
monitor_service "🎯 STRATUS" "stratus-engine.log" "$CYAN" "(Stratus|Engine|components)"

# Main monitoring loop
while true; do
    sleep 5
    
    # Check if all services are still running
    tsx_count=$(ps aux | grep tsx | grep -v grep | wc -l)
    next_count=$(ps aux | grep 'next dev' | grep -v grep | wc -l)
    
    if [ $tsx_count -lt 5 ] || [ $next_count -eq 0 ]; then
        print_status "$RED" "WARNING" "Some services may have stopped! TSX: $tsx_count, Next: $next_count"
    fi
    
    # System health check every 30 seconds
    if [ $(($(date +%s) % 30)) -eq 0 ]; then
        memory_used=$(free | grep Mem: | awk '{printf "%.1f", $3/$2*100}')
        cpu_load=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | tr -d ',')
        
        print_status "$BLUE" "HEALTH" "Memory: ${memory_used}% | CPU Load: $cpu_load | Services: $((tsx_count + next_count))"
    fi
done