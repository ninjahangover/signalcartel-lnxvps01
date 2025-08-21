#!/bin/bash

echo "🔄 Restarting strategy execution engine with Telegram alerts..."

# Kill any existing strategy engine processes
pkill -f "strategy-execution-engine" || true
sleep 2

# Start strategy engine with environment variables
cd /home/telgkb9/depot/dev-signalcartel

export TELEGRAM_BOT_TOKEN="7271136211:AAGE248w3_N7JwtHnLpWn9Cp-GpXx3hBEMM"
export TELEGRAM_CHAT_ID="1370390999"

echo "📱 Telegram credentials loaded"
echo "🚀 Starting strategy execution engine..."

# Run the strategy engine
npx tsx scripts/engines/strategy-execution-engine.ts > strategy-execution-engine.log 2>&1 &

echo "✅ Strategy execution engine started with Telegram alerts!"
echo "📊 Monitor with: tail -f strategy-execution-engine.log"
echo "📱 You should start receiving trade notifications on Telegram!"

# Show the process
ps aux | grep strategy-execution-engine | grep -v grep || echo "Process not found"