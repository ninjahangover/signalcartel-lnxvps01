#!/bin/bash

# SignalCartel Website Service
# Independent service launcher for the Next.js website

SERVICE_NAME="website"
LOG_FILE="logs/website.log"
PID_FILE="/tmp/signalcartel-website.pid"
PORT=3001

echo "🌐 Starting SignalCartel Website Service..."

# Check if already running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "⚠️  Website already running (PID: $OLD_PID)"
        exit 1
    else
        echo "🧹 Cleaning up stale PID file"
        rm -f "$PID_FILE"
    fi
fi

# Check port availability
if lsof -i :$PORT > /dev/null 2>&1; then
    echo "❌ Port $PORT is already in use"
    echo "Run: lsof -i :$PORT to see what's using it"
    exit 1
fi

# Start the service
cd /home/telgkb9/depot/dev-signalcartel
nohup npm run dev > "$LOG_FILE" 2>&1 &
PID=$!

# Save PID
echo $PID > "$PID_FILE"

# Wait for startup
echo "⏳ Waiting for Next.js to compile..."
sleep 20

# Verify it's running
if ps -p "$PID" > /dev/null 2>&1; then
    echo "✅ Website started successfully (PID: $PID)"
    echo "📊 Monitor: tail -f $LOG_FILE"
    echo "🌐 Access: http://localhost:$PORT"
else
    echo "❌ Failed to start website"
    rm -f "$PID_FILE"
    exit 1
fi