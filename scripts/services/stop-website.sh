#!/bin/bash

# Stop SignalCartel Website Service

SERVICE_NAME="website"
PID_FILE="/tmp/signalcartel-website.pid"

echo "🛑 Stopping SignalCartel Website Service..."

# Check PID file
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        kill "$PID"
        echo "✅ Sent stop signal to website (PID: $PID)"
        
        # Wait for graceful shutdown
        sleep 3
        
        # Force kill if still running
        if ps -p "$PID" > /dev/null 2>&1; then
            kill -9 "$PID"
            echo "⚠️  Force killed website"
        fi
    else
        echo "⚠️  Website not running (stale PID file)"
    fi
    rm -f "$PID_FILE"
else
    echo "⚠️  No PID file found"
fi

# Clean up any orphaned processes
pkill -f "npm.*run.*dev" 2>/dev/null || true
pkill -f "next.*dev.*3001" 2>/dev/null || true

echo "✅ Website service stopped"