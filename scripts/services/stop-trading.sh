#!/bin/bash

# Stop SignalCartel Trading Engine Service

SERVICE_NAME="trading-engine"
PID_FILE="/tmp/signalcartel-trading.pid"

echo "🛑 Stopping SignalCartel Trading Engine Service..."

# Check PID file
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        kill "$PID"
        echo "✅ Sent stop signal to trading engine (PID: $PID)"
        
        # Wait for graceful shutdown
        sleep 3
        
        # Force kill if still running
        if ps -p "$PID" > /dev/null 2>&1; then
            kill -9 "$PID"
            echo "⚠️  Force killed trading engine"
        fi
    else
        echo "⚠️  Trading engine not running (stale PID file)"
    fi
    rm -f "$PID_FILE"
else
    echo "⚠️  No PID file found"
fi

# Clean up any orphaned processes
pkill -f "strategy-execution-engine" 2>/dev/null || true

echo "✅ Trading engine service stopped"