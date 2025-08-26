#!/bin/bash

# QUANTUM FORGE™ Trading Engine Stop Script

echo "🛑 Stopping QUANTUM FORGE™ Trading Engine..."

# Find and kill the trading process
PIDS=$(pgrep -f "load-database-strategies.ts" || true)

if [ -z "$PIDS" ]; then
    echo "   ℹ️  No QUANTUM FORGE™ trading processes found running"
    exit 0
fi

echo "   📋 Found trading processes: $PIDS"

# Gracefully terminate processes
for pid in $PIDS; do
    echo "   🔄 Stopping process $pid..."
    kill -TERM "$pid" 2>/dev/null || true
done

# Wait a moment for graceful shutdown
sleep 3

# Force kill if still running
for pid in $PIDS; do
    if kill -0 "$pid" 2>/dev/null; then
        echo "   💥 Force killing process $pid..."
        kill -9 "$pid" 2>/dev/null || true
    fi
done

echo "   ✅ QUANTUM FORGE™ Trading Engine stopped"