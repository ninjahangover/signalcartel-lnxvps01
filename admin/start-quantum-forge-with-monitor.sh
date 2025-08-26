#!/bin/bash
# QUANTUM FORGE™ Trading Engine with Live Monitor
# Starts trading and monitoring in parallel

echo "🚀 QUANTUM FORGE™ STARTUP SEQUENCE"
echo "=================================="

# Create log directory
mkdir -p /tmp/signalcartel-logs

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down QUANTUM FORGE™..."
    kill 0  # Kill all background processes in this group
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

# Start the trading engine in background
echo "🎯 Starting QUANTUM FORGE™ Trading Engine..."
ENABLE_GPU_STRATEGIES=true NTFY_TOPIC="signal-cartel" npx tsx -r dotenv/config load-database-strategies.ts > /tmp/signalcartel-logs/trading-engine.log 2>&1 &
TRADING_PID=$!

# Give trading engine a moment to initialize
sleep 3

# Start the live monitor in foreground (this is what you'll see)
echo "📊 Starting Live Monitor Dashboard..."
echo "💡 Trading engine running in background (PID: $TRADING_PID)"
echo "📁 All logs available in /tmp/signalcartel-logs/"
echo ""
echo "Press Ctrl+C to stop both trading and monitoring"
echo ""
sleep 2

# Run the live monitor (this keeps the terminal busy)
npx tsx -r dotenv/config quantum-forge-live-monitor.ts

# If monitor exits, cleanup
cleanup