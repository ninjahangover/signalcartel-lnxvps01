#!/bin/bash

# SignalCartel Decoupled Services Startup
# Each service runs independently with its own lifecycle

echo "🚀 SignalCartel Decoupled Services Startup"
echo "=========================================="
echo ""

# Set working directory
cd /home/telgkb9/depot/dev-signalcartel

# Check if services directory exists
if [ ! -d "scripts/services" ]; then
    echo "❌ Services directory not found. Creating..."
    mkdir -p scripts/services
fi

# Make service scripts executable
chmod +x scripts/services/*.sh 2>/dev/null

# Parse command line arguments
MODE=${1:-minimal}  # minimal, standard, or full

echo "📋 Startup Mode: $MODE"
echo ""

case "$MODE" in
    "minimal")
        echo "🚀 Starting MINIMAL services (website + trading only)..."
        echo ""
        
        # Start trading engine
        echo "1️⃣ Starting Trading Engine..."
        ./scripts/services/start-trading.sh
        if [ $? -ne 0 ]; then
            echo "❌ Failed to start trading engine"
            exit 1
        fi
        
        echo ""
        
        # Start website
        echo "2️⃣ Starting Website..."
        ./scripts/services/start-website.sh
        if [ $? -ne 0 ]; then
            echo "❌ Failed to start website"
            exit 1
        fi
        ;;
        
    "standard")
        echo "🚀 Starting STANDARD services..."
        echo "(Trading, Website, Market Data as separate service)"
        echo ""
        
        # Start market data collector separately
        echo "1️⃣ Starting Market Data Collector..."
        nohup npx tsx scripts/engines/market-data-collector.ts > logs/market-data.log 2>&1 &
        echo "✅ Market data collector started (PID: $!)"
        sleep 5
        
        # Start trading engine
        echo "2️⃣ Starting Trading Engine..."
        ./scripts/services/start-trading.sh
        if [ $? -ne 0 ]; then
            echo "❌ Failed to start trading engine"
            exit 1
        fi
        
        echo ""
        
        # Start website
        echo "3️⃣ Starting Website..."
        ./scripts/services/start-website.sh
        if [ $? -ne 0 ]; then
            echo "❌ Failed to start website"
            exit 1
        fi
        ;;
        
    "full")
        echo "⚠️  FULL mode starts all engines (not recommended - use Docker instead)"
        echo "This mode is prone to crashes due to resource conflicts"
        echo ""
        read -p "Are you sure? (y/N): " confirm
        if [ "$confirm" != "y" ]; then
            echo "Aborted."
            exit 0
        fi
        
        # Fall back to old start-all.sh behavior
        ./scripts/start-all.sh
        ;;
        
    *)
        echo "❌ Invalid mode: $MODE"
        echo "Usage: $0 [minimal|standard|full]"
        exit 1
        ;;
esac

echo ""
echo "============================================"
echo "✅ Services started successfully!"
echo ""
echo "📊 Check status: ./scripts/services/status.sh"
echo "🛑 Stop all:     ./scripts/stop-server.sh"
echo ""
echo "📱 Individual service control:"
echo "  Start: ./scripts/services/start-[website|trading].sh"
echo "  Stop:  ./scripts/services/stop-[website|trading].sh"
echo ""
echo "🐳 For production, use: docker-compose up -d"
echo "============================================"