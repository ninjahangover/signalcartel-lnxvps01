#!/bin/bash
# SignalCartel Service Health Check

SERVICES=(
  "signalcartel-trading-engine:http://localhost:3001/api/health"
  "signalcartel-webapp:http://localhost:3001/api/health" 
  "signalcartel-database:http://localhost:3001/api/quantum-forge/database-health"
)

echo "🏥 SignalCartel Service Health Check"
echo "===================================="

for service in "${SERVICES[@]}"; do
  name=$(echo $service | cut -d: -f1)
  url=$(echo $service | cut -d: -f2-)
  
  echo -n "Checking $name... "
  
  if curl -sf "$url" > /dev/null 2>&1; then
    echo "✅ Healthy"
  else
    echo "❌ Unhealthy"
  fi
done

echo ""
echo "📊 SigNoz Dashboard: http://localhost:3301"
echo "🔑 Login: gaylen@signalcartel.io / admin123"
