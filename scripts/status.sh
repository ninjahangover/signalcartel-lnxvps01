#!/bin/bash

echo "📊 SignalCartel Trading System Status"
echo "====================================="
echo ""

# System resources
echo "🖥️  System Resources:"
echo "   Memory: $(free -h | grep Mem: | awk '{print "Used: " $3 " / " $2 " (" $5 " available)"}')"
echo "   CPU Load: $(uptime | awk -F'load average:' '{print $2}')"
echo "   Disk: $(df -h / | tail -1 | awk '{print "Used: " $3 " / " $2 " (" $5 " full)"}')"
echo ""

# Process counts
echo "⚙️  Process Status:"
tsx_count=$(ps aux | grep tsx | grep -v grep | wc -l)
next_count=$(ps aux | grep 'next dev' | grep -v grep | wc -l)
total_count=$((tsx_count + next_count))

echo "   Total Trading Processes: $total_count"
echo "   TSX Processes: $tsx_count"
echo "   Next.js Processes: $next_count"
echo ""

# Service status
echo "🔧 Service Status:"

services=(
    "Next.js Server:next dev"
    "Market Data Collector:start-market-data"
    "Strategy Engine:start-strategy-engine"
    "Alert Engine:start-alert-engine"
    "AI Optimizer:start-ai-optimizer"
    "Stratus Engine:start-stratus-engine"
)

for service in "${services[@]}"; do
    name="${service%%:*}"
    pattern="${service##*:}"
    
    if ps aux | grep "$pattern" | grep -v grep > /dev/null; then
        pid=$(ps aux | grep "$pattern" | grep -v grep | awk '{print $2}' | head -1)
        echo "   ✅ $name (PID: $pid)"
    else
        echo "   ❌ $name (Not Running)"
    fi
done

echo ""

# API Health Check
echo "🌐 API Health:"
if curl -s http://127.0.0.1:3001/api/alpaca/account > /dev/null 2>&1; then
    echo "   ✅ Alpaca API (localhost:3001)"
else
    echo "   ❌ Alpaca API (localhost:3001)"
fi

echo ""

# Recent log activity
echo "📝 Recent Activity:"
if [ -f strategy-execution-engine.log ]; then
    echo "   Strategy Engine: $(tail -3 strategy-execution-engine.log | grep -E "(Engine|RUNNING|STOPPED)" | tail -1 | cut -c1-60)..."
fi

if [ -f alert-generation-engine.log ]; then
    echo "   Alert Engine: $(tail -3 alert-generation-engine.log | grep -E "(Alert Engine|RUNNING)" | tail -1 | cut -c1-60)..."
fi

if [ -f market-data-collector.log ]; then
    echo "   Market Data: $(tail -3 market-data-collector.log | grep -E "(Real price|Stored)" | tail -1 | cut -c1-60)..."
fi

echo ""

# Trading status
echo "💰 Trading Status:"
if curl -s http://127.0.0.1:3001/api/alpaca/account 2>/dev/null | grep -q "buying_power"; then
    buying_power=$(curl -s http://127.0.0.1:3001/api/alpaca/account 2>/dev/null | grep -o '"buying_power":[0-9.]*' | cut -d: -f2)
    position_count=$(curl -s http://127.0.0.1:3001/api/alpaca/positions 2>/dev/null | grep -o '\[.*\]' | tr ',' '\n' | wc -l)
    echo "   💵 Buying Power: \$$(printf "%.2f" $buying_power 2>/dev/null || echo "N/A")"
    echo "   📈 Active Positions: $((position_count - 1))"
else
    echo "   ❌ Unable to connect to trading account"
fi

echo ""
echo "🔄 Commands:"
echo "   Start: ./scripts/start-trading-bot.sh"
echo "   Stop:  ./scripts/stop-trading-bot.sh"
echo "   Logs:  tail -f *.log"
echo ""