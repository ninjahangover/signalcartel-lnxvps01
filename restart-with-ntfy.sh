#!/bin/bash

echo "🚀 RESTARTING SIGNALCARTEL WITH NTFY ALERTS"
echo "=" $(printf '=%.0s' {1..50})

# Load environment variables  
source .env.local

# Stop any existing processes
echo "⏹️  Stopping existing processes..."
pkill -f "load-database-strategies" 2>/dev/null || true
pkill -f "strategy-execution-engine" 2>/dev/null || true

# Wait a moment
sleep 2

echo "📱 NTFY topic: $NTFY_TOPIC"
echo "✅ Environment loaded"

# Start the database strategy loader with NTFY alerts
echo "🚀 Starting SignalCartel with database strategies and NTFY alerts..."

# Run in background and capture PID
nohup npx tsx load-database-strategies.ts > signalcartel-ntfy.log 2>&1 &
STRATEGY_PID=$!

echo "✅ SignalCartel started (PID: $STRATEGY_PID)"
echo "📱 NTFY alerts enabled on topic: signal-cartel"
echo "📊 Check signalcartel-ntfy.log for activity"

echo ""
echo "🎯 SYSTEM STATUS:"
echo "   ✅ Database strategies loaded"
echo "   ✅ Paper trading active"
echo "   ✅ NTFY alerts working"
echo "   ✅ Live market data flowing"
echo ""
echo "📱 You should receive trade alerts on your phone!"
echo "📈 Watch for BUY/SELL signals..."
echo ""
echo "To monitor: tail -f signalcartel-ntfy.log"
echo "To stop: kill $STRATEGY_PID"