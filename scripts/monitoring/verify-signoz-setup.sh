#!/bin/bash
# Comprehensive SigNoz Setup Verification Script

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 SigNoz Setup Verification${NC}"
echo "============================="
echo

# Check if SigNoz containers are running
echo -e "${YELLOW}📦 Docker Container Status:${NC}"
echo "=============================="
CONTAINERS=("signoz-otel-collector" "signoz-clickhouse" "signoz-query-service" "signoz-frontend")

for container in "${CONTAINERS[@]}"; do
    if docker ps --format "table {{.Names}}" | grep -q "$container"; then
        echo -e "✅ $container: ${GREEN}Running${NC}"
    else
        echo -e "❌ $container: ${RED}Not Running${NC}"
    fi
done
echo

# Check SigNoz endpoints
echo -e "${YELLOW}🌐 Endpoint Connectivity:${NC}"
echo "=========================="

# Test SigNoz UI (port 3301)
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3301 | grep -q "200\|302\|301"; then
    echo -e "✅ SigNoz UI (3301): ${GREEN}Accessible${NC}"
else
    echo -e "❌ SigNoz UI (3301): ${RED}Not Accessible${NC}"
fi

# Test OTEL gRPC endpoint (port 4317)
if nc -z localhost 4317 2>/dev/null; then
    echo -e "✅ OTEL gRPC (4317): ${GREEN}Open${NC}"
else
    echo -e "❌ OTEL gRPC (4317): ${RED}Closed${NC}"
fi

# Test OTEL HTTP endpoint (port 4318)
if nc -z localhost 4318 2>/dev/null; then
    echo -e "✅ OTEL HTTP (4318): ${GREEN}Open${NC}"
else
    echo -e "❌ OTEL HTTP (4318): ${RED}Closed${NC}"
fi
echo

# Check external domain access
echo -e "${YELLOW}🌍 External Domain Access:${NC}"
echo "=========================="
if curl -s -I https://monitor.pixelraidersystems.com | head -n 1 | grep -q "200\|302"; then
    echo -e "✅ monitor.pixelraidersystems.com: ${GREEN}Accessible${NC}"
else
    echo -e "❌ monitor.pixelraidersystems.com: ${RED}Not Accessible${NC}"
    echo -e "   ${YELLOW}Note: DNS may still be propagating${NC}"
fi
echo

# Check dashboard files exist
echo -e "${YELLOW}📊 Dashboard Files:${NC}"
echo "==================="
DASHBOARDS=("quantum-forge-dashboard.json" "ai-systems-dashboard.json" "infrastructure-dashboard.json")

for dashboard in "${DASHBOARDS[@]}"; do
    if [ -f "scripts/monitoring/signoz-configs/$dashboard" ]; then
        echo -e "✅ $dashboard: ${GREEN}Found${NC}"
    else
        echo -e "❌ $dashboard: ${RED}Missing${NC}"
    fi
done
echo

# Test basic telemetry sending
echo -e "${YELLOW}🔬 Test Telemetry Integration:${NC}"
echo "=============================="

# Create a simple test script that doesn't require complex dependencies
cat > /tmp/test-signoz-simple.js << 'EOF'
const http = require('http');

// Simple test metric data
const testData = {
    resourceSpans: [{
        resource: {
            attributes: [{
                key: "service.name",
                value: { stringValue: "signalcartel-test" }
            }]
        },
        scopeSpans: [{
            spans: [{
                traceId: "12345678901234567890123456789012",
                spanId: "1234567890123456",
                name: "test-span",
                kind: 1,
                startTimeUnixNano: Date.now() * 1000000,
                endTimeUnixNano: (Date.now() + 1000) * 1000000,
                attributes: [{
                    key: "test.metric",
                    value: { stringValue: "setup-verification" }
                }]
            }]
        }]
    }]
};

const postData = JSON.stringify(testData);

const options = {
    hostname: 'localhost',
    port: 4318,
    path: '/v1/traces',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
        console.log('✅ Telemetry test: SUCCESS');
    } else {
        console.log(`❌ Telemetry test: FAILED (${res.statusCode})`);
    }
});

req.on('error', (e) => {
    console.log(`❌ Telemetry test: ERROR - ${e.message}`);
});

req.write(postData);
req.end();
EOF

# Run the test
node /tmp/test-signoz-simple.js 2>/dev/null || echo -e "❌ Telemetry test: ${RED}Node.js not available${NC}"
rm -f /tmp/test-signoz-simple.js
echo

# Next steps guidance
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "=============="
echo "1. Access SigNoz UI:"
echo "   🌐 https://monitor.pixelraidersystems.com"
echo "   📧 Email: gaylen@signalcartel.io"
echo "   🔑 Password: admin123"
echo ""
echo "2. Import dashboards:"
echo "   📁 Follow guide: scripts/monitoring/HOW_TO_IMPORT_DASHBOARDS.md"
echo ""
echo "3. Start monitoring:"
echo "   🚀 ./scripts/monitoring/start-with-signoz.sh"
echo ""
echo "4. View imported dashboards:"
echo "   📊 Look for 'QUANTUM FORGE™', 'AI Systems', 'Infrastructure' dashboards"

echo
echo -e "${GREEN}🎉 SigNoz verification complete!${NC}"