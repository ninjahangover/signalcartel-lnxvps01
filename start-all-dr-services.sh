#!/bin/bash
# Start all QUANTUM FORGE services as individual endpoints for DR monitoring

echo "🚀 Starting all QUANTUM FORGE™ services for DR monitoring"
echo "📡 Each service will appear individually in monitor.pixelraidersystems.com"
echo ""

services=(
    "quantum-forge-trading-engine"
    "position-management-service" 
    "mathematical-intuition-engine"
    "multi-source-sentiment-engine"
    "order-book-intelligence"
    "signalcartel-postgresql-primary"
    "signalcartel-analytics-db"
    "quantum-forge-system-monitor"
)

# Start each service in background
for service in "${services[@]}"; do
    echo "📊 Starting: $service"
    npx tsx "start-${service}.ts" > "logs/${service}.log" 2>&1 &
    echo "✅ $service started (PID: $!)"
done

echo ""
echo "🎯 All services started and reporting to DR monitoring"
echo "📈 Check monitor.pixelraidersystems.com Services tab"
echo "📝 Logs in: logs/ directory"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'echo "🛑 Stopping all services..."; jobs -p | xargs -r kill; exit 0' INT
wait
