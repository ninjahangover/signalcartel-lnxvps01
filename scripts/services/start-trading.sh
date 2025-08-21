#!/bin/bash

# SignalCartel Trading Engine Service
# Independent service launcher for the trading/strategy execution engine

SERVICE_NAME="trading-engine"
LOG_FILE="strategy-execution-engine.log"
PID_FILE="/tmp/signalcartel-trading.pid"

echo "💹 Starting SignalCartel Trading Engine Service..."

# Check if already running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "⚠️  Trading engine already running (PID: $OLD_PID)"
        exit 1
    else
        echo "🧹 Cleaning up stale PID file"
        rm -f "$PID_FILE"
    fi
fi

# Load environment variables
cd /home/telgkb9/depot/dev-signalcartel
if [ -f ".env.local" ]; then
    source .env.local
    echo "📱 Telegram alerts configured"
fi

# Start the service
npx tsx scripts/engines/strategy-execution-engine.ts > "$LOG_FILE" 2>&1 &
PID=$!

# Save PID
echo $PID > "$PID_FILE"

# Wait for startup
sleep 5

# Verify it's running
if ps -p "$PID" > /dev/null 2>&1; then
    echo "✅ Trading engine started successfully (PID: $PID)"
    echo "📊 Monitor: tail -f $LOG_FILE"
    echo "📱 Telegram alerts: ${TELEGRAM_CHAT_ID:-Not configured}"
else
    echo "❌ Failed to start trading engine"
    rm -f "$PID_FILE"
    exit 1
fi