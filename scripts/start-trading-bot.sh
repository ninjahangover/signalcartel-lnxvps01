#!/bin/bash

echo "🚀 Starting Trading Bot System..."
echo "=================================="

# Kill any existing processes
echo "Cleaning up old processes..."
pkill -f "tsx" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 2

# Start Next.js server
echo "1. Starting Next.js server..."
npm run dev > nextjs-server.log 2>&1 &
echo "   ✓ Next.js server started"
sleep 5

# Start Market Data Collector
echo "2. Starting Market Data Collector..."
npx tsx src/scripts/start-market-data.ts > market-data-collector.log 2>&1 &
echo "   ✓ Market data collector started"
sleep 2

# Start Strategy Execution Engine
echo "3. Starting Strategy Execution Engine..."
npx tsx src/scripts/start-strategy-engine.ts > strategy-execution-engine.log 2>&1 &
echo "   ✓ Strategy engine started"
sleep 2

# Start Alert Generation Engine
echo "4. Starting Alert Generation Engine..."
npx tsx src/scripts/start-alert-engine.ts > alert-generation-engine.log 2>&1 &
echo "   ✓ Alert engine started"
sleep 2

# Start AI Optimization Engine
echo "5. Starting AI Optimization Engine..."
npx tsx src/scripts/start-ai-optimizer.ts > ai-optimization-engine.log 2>&1 &
echo "   ✓ AI optimizer started"
sleep 2

# Start Stratus Master Engine
echo "6. Starting Stratus Engine..."
npx tsx src/scripts/start-stratus-engine.ts > stratus-engine.log 2>&1 &
echo "   ✓ Stratus engine started"

echo ""
echo "✅ All services started successfully!"
echo "=================================="

# Ask user if they want real-time monitoring
echo ""
echo "🔄 Choose monitoring mode:"
echo "  1) Background mode (services run in background)"
echo "  2) Interactive mode (show real-time activity in terminal)"
echo ""
read -p "Enter choice (1-2) or press Enter for background: " choice

case $choice in
    2)
        echo ""
        echo "🚀 Starting Interactive Real-Time Monitor..."
        echo "📊 Press Ctrl+C to stop all services gracefully"
        echo "=================================="
        echo ""
        
        # Colors for monitoring
        GREEN='\033[0;32m'
        YELLOW='\033[1;33m'
        BLUE='\033[0;34m'
        PURPLE='\033[0;35m'
        CYAN='\033[0;36m'
        RED='\033[0;31m'
        WHITE='\033[1;37m'
        NC='\033[0m'
        
        # Function to print colored status
        print_activity() {
            local color=$1
            local service=$2
            local message=$3
            echo -e "${color}[$(date '+%H:%M:%S')] $service: $message${NC}"
        }
        
        # Trap Ctrl+C for graceful shutdown
        trap 'echo ""; echo "🛑 Stopping all services..."; ./scripts/stop-trading-bot.sh; exit 0' SIGINT SIGTERM
        
        # Give services time to initialize
        sleep 3
        
        echo "📈 Real-time Activity Monitor Active:"
        echo "====================================="
        
        # Monitor loop
        tail -f strategy-execution-engine.log market-data-collector.log alert-generation-engine.log ai-optimization-engine.log 2>/dev/null | while read line; do
            # Filter and colorize different types of activity
            if echo "$line" | grep -q "Successfully fetched.*BTCUSD"; then
                price=$(echo "$line" | grep -o '\$[0-9,]*[0-9.]*')
                print_activity "$YELLOW" "₿ BTC" "$price"
            elif echo "$line" | grep -q "Successfully fetched.*ETHUSD"; then
                price=$(echo "$line" | grep -o '\$[0-9,]*[0-9.]*')
                print_activity "$BLUE" "Ξ ETH" "$price"
            elif echo "$line" | grep -q "Successfully fetched.*SOLUSD"; then
                price=$(echo "$line" | grep -o '\$[0-9,]*[0-9.]*')
                print_activity "$PURPLE" "◎ SOL" "$price"
            elif echo "$line" | grep -qE "(BUY|SELL|Signal|Entry|Exit)"; then
                print_activity "$GREEN" "⚡ TRADE" "${line:0:80}..."
            elif echo "$line" | grep -q "Alert"; then
                print_activity "$RED" "🚨 ALERT" "${line:0:80}..."
            elif echo "$line" | grep -q "optimization"; then
                print_activity "$CYAN" "🧠 AI-OPT" "${line:0:80}..."
            elif echo "$line" | grep -q "Engine: RUNNING"; then
                print_activity "$WHITE" "📊 STATUS" "Strategy Engine is running"
            fi
        done
        ;;
    *)
        echo ""
        echo "📋 Background Mode Selected"
        echo "=========================="
        echo ""
        echo "📊 Check status: ./scripts/status.sh"
        echo "📈 Live dashboard: ./scripts/live-dashboard.sh"
        echo "📝 Monitor logs: tail -f *.log"
        echo "🛑 Stop all: ./scripts/stop-trading-bot.sh"
        echo ""
        ;;
esac