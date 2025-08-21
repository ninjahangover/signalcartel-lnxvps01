#!/bin/bash

# SignalCartel Services Status Check

echo "📊 SignalCartel Services Status"
echo "================================"

# Check Website
WEBSITE_PID_FILE="/tmp/signalcartel-website.pid"
if [ -f "$WEBSITE_PID_FILE" ]; then
    PID=$(cat "$WEBSITE_PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "✅ Website:        Running (PID: $PID)"
        echo "   URL:           http://localhost:3001"
    else
        echo "⚠️  Website:        Stopped (stale PID)"
    fi
else
    echo "⭕ Website:        Not running"
fi

# Check Trading Engine
TRADING_PID_FILE="/tmp/signalcartel-trading.pid"
if [ -f "$TRADING_PID_FILE" ]; then
    PID=$(cat "$TRADING_PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "✅ Trading Engine: Running (PID: $PID)"
        # Check recent activity
        if [ -f "strategy-execution-engine.log" ]; then
            LAST_LINE=$(tail -1 strategy-execution-engine.log)
            echo "   Last activity: ${LAST_LINE:0:50}..."
        fi
    else
        echo "⚠️  Trading Engine: Stopped (stale PID)"
    fi
else
    echo "⭕ Trading Engine: Not running"
fi

echo ""
echo "Quick Commands:"
echo "  Start website:  ./scripts/services/start-website.sh"
echo "  Start trading:  ./scripts/services/start-trading.sh"
echo "  Stop website:   ./scripts/services/stop-website.sh"
echo "  Stop trading:   ./scripts/services/stop-trading.sh"