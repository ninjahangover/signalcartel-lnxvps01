#!/bin/bash
# Check SigNoz monitoring status for SignalCartel

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}       🔭 SIGNOZ MONITORING STATUS FOR SIGNALCARTEL${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Check Docker containers
echo -e "${YELLOW}📦 Docker Services Status:${NC}"
echo "─────────────────────────────────"

check_service() {
    local service=$1
    local display_name=$2
    if docker ps --format "{{.Names}}" | grep -q "$service"; then
        echo -e "  ${GREEN}✅${NC} $display_name"
    else
        echo -e "  ${RED}❌${NC} $display_name"
    fi
}

check_service "signoz-frontend" "SigNoz Frontend (UI)"
check_service "signoz-otel-collector" "OTEL Collector"
check_service "signoz-query-service" "Query Service"
check_service "signoz-clickhouse" "ClickHouse Database"
check_service "signoz-alertmanager" "Alert Manager"
check_service "signoz-zookeeper" "Zookeeper"
echo ""

# Check endpoints
echo -e "${YELLOW}🌐 Endpoint Availability:${NC}"
echo "─────────────────────────────────"

check_endpoint() {
    local url=$1
    local name=$2
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|404"; then
        echo -e "  ${GREEN}✅${NC} $name: $url"
    else
        echo -e "  ${RED}❌${NC} $name: $url"
    fi
}

check_endpoint "http://localhost:3301" "SigNoz Dashboard"
check_endpoint "http://localhost:4317" "OTEL gRPC"
check_endpoint "http://localhost:4318" "OTEL HTTP"
echo ""

# Check OpenTelemetry installation
echo -e "${YELLOW}📚 OpenTelemetry Dependencies:${NC}"
echo "─────────────────────────────────"
if npm list @opentelemetry/sdk-node 2>/dev/null | grep -q "@opentelemetry/sdk-node"; then
    echo -e "  ${GREEN}✅${NC} OpenTelemetry SDK installed"
else
    echo -e "  ${RED}❌${NC} OpenTelemetry SDK not installed"
fi

if [ -f "src/lib/telemetry/signoz-telemetry.ts" ]; then
    echo -e "  ${GREEN}✅${NC} Telemetry module created"
else
    echo -e "  ${RED}❌${NC} Telemetry module missing"
fi

if [ -f "scripts/monitoring/start-with-signoz.sh" ]; then
    echo -e "  ${GREEN}✅${NC} Monitoring startup script ready"
else
    echo -e "  ${RED}❌${NC} Monitoring startup script missing"
fi
echo ""

# Display quick start commands
echo -e "${BLUE}🚀 Quick Start Commands:${NC}"
echo "─────────────────────────────────"
echo -e "${GREEN}1. Access SigNoz Dashboard:${NC}"
echo "   firefox http://localhost:3301"
echo "   Login: gaylen@signalcartel.io / admin123"
echo ""
echo -e "${GREEN}2. Test Telemetry Integration:${NC}"
echo "   npx tsx scripts/monitoring/test-signoz-integration.ts"
echo ""
echo -e "${GREEN}3. Start Trading with Monitoring:${NC}"
echo "   ./scripts/monitoring/start-with-signoz.sh"
echo ""
echo -e "${GREEN}4. View Setup Guide:${NC}"
echo "   cat scripts/monitoring/signoz-setup-helper.md"
echo ""

# Check if everything is ready
all_ready=true
if ! docker ps | grep -q "signoz-frontend"; then
    all_ready=false
fi
if ! docker ps | grep -q "signoz-otel-collector"; then
    all_ready=false
fi
if ! npm list @opentelemetry/sdk-node 2>/dev/null | grep -q "@opentelemetry/sdk-node"; then
    all_ready=false
fi

if [ "$all_ready" = true ]; then
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}     ✅ ALL SYSTEMS READY - SIGNOZ MONITORING ACTIVE!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
else
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}     ⚠️  SOME COMPONENTS NEED ATTENTION${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
fi