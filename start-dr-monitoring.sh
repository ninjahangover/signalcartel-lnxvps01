#!/bin/bash
# Start QUANTUM FORGE™ DR Monitoring Service
# Runs in background and sends services to monitor.pixelraidersystems.com

echo "🚀 Starting QUANTUM FORGE™ DR Monitoring Service"
echo "📡 Target: monitor.pixelraidersystems.com"
echo "🖥️  Hostname: $(hostname)"

# Kill any existing instances
pkill -f "send-to-dr-signoz.ts" 2>/dev/null || true

# Start the DR monitoring service in background
nohup npx tsx send-to-dr-signoz.ts > /tmp/dr-signoz.log 2>&1 &
DR_PID=$!

echo "✅ DR monitoring started (PID: $DR_PID)"
echo "📊 8 services now reporting to SigNoz Services tab"
echo "📝 Logs: tail -f /tmp/dr-signoz.log"
echo ""
echo "🎯 Services being reported:"
echo "  • quantum-forge-trading-engine @ $(hostname):3001"
echo "  • position-management-service @ $(hostname):3002" 
echo "  • mathematical-intuition-engine @ $(hostname):3003"
echo "  • multi-source-sentiment-engine @ $(hostname):3004"
echo "  • order-book-intelligence @ $(hostname):3005"
echo "  • signalcartel-postgresql-primary @ $(hostname):5433"
echo "  • signalcartel-analytics-db @ $(hostname):5434"
echo "  • quantum-forge-system-monitor @ $(hostname):3006"
echo ""
echo "📈 Check Services tab at: https://monitor.pixelraidersystems.com"

# Wait a moment for initial registration
sleep 10

echo ""
echo "📊 Initial registration complete - services should now appear in Services tab"
echo "🔄 Continuous metrics reporting every 30 seconds"
echo ""
echo "To stop: pkill -f 'send-to-dr-signoz.ts'"