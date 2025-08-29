#!/bin/bash
# Debug services status

echo "🔍 Service Status Debug"
echo "======================="
echo

echo "📊 SigNoz Status:"
echo "curl -s http://localhost:3301 | grep -q 'SigNoz' && echo '✅ SigNoz UP' || echo '❌ SigNoz DOWN'"
curl -s http://localhost:3301 | grep -q 'SigNoz' && echo "✅ SigNoz UP" || echo "❌ SigNoz DOWN"
echo

echo "🗄️ Redis Status:"
echo "redis-cli -h localhost -p 6379 ping"
redis-cli -h localhost -p 6379 ping
echo

echo "🐳 Docker Containers:"
echo "docker ps --format 'table {{.Names}}\t{{.Status}}' | head -10"
docker ps --format 'table {{.Names}}\t{{.Status}}' | head -10
echo

echo "🌐 Network Connectivity:"
echo "nc -z localhost 3301 && echo '✅ SigNoz port 3301: OPEN' || echo '❌ SigNoz port 3301: CLOSED'"
nc -z localhost 3301 && echo "✅ SigNoz port 3301: OPEN" || echo "❌ SigNoz port 3301: CLOSED"

echo "nc -z localhost 6379 && echo '✅ Redis port 6379: OPEN' || echo '❌ Redis port 6379: CLOSED'"
nc -z localhost 6379 && echo "✅ Redis port 6379: OPEN" || echo "❌ Redis port 6379: CLOSED"

echo
echo "✅ Services Status Complete!"