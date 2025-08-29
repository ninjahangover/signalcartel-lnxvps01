#!/bin/bash
# QUANTUM FORGE™ Start with SigNoz Monitoring
# Complete monitoring-enabled startup script

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 QUANTUM FORGE™ WITH SIGNOZ MONITORING${NC}"
echo "========================================="
echo ""

# Set environment variables for OpenTelemetry
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4317"
export OTEL_RESOURCE_ATTRIBUTES="service.name=signalcartel-trading,service.version=1.0.0"
export SERVICE_NAME="signalcartel-trading-engine"
export COMPONENT_NAME="quantum-forge-main"
export NODE_ENV="production"
export INSTANCE_ID="primary-$(date +%s)"

# Trading configuration
export ENABLE_GPU_STRATEGIES=true
export NTFY_TOPIC="signal-cartel"
export DATABASE_URL="postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/signalcartel?schema=public"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "  • Service: $SERVICE_NAME"
echo "  • OTEL Endpoint: $OTEL_EXPORTER_OTLP_ENDPOINT"
echo "  • Instance ID: $INSTANCE_ID"
echo "  • GPU Strategies: $ENABLE_GPU_STRATEGIES"
echo ""

# Check if SigNoz is running
echo -e "${YELLOW}🔍 Checking SigNoz services...${NC}"
if docker ps | grep -q "signoz-frontend"; then
    echo -e "${GREEN}✅ SigNoz frontend is running${NC}"
else
    echo -e "${RED}❌ SigNoz frontend not running!${NC}"
    echo -e "${YELLOW}Starting SigNoz services...${NC}"
    cd /home/telgkb9/signoz && docker-compose up -d
    sleep 30
fi

if docker ps | grep -q "signoz-otel-collector"; then
    echo -e "${GREEN}✅ OTEL Collector is running${NC}"
else
    echo -e "${RED}❌ OTEL Collector not running!${NC}"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules/@opentelemetry" ]; then
    echo -e "${YELLOW}📦 Installing OpenTelemetry dependencies...${NC}"
    npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/api @opentelemetry/resources @opentelemetry/semantic-conventions @opentelemetry/exporter-trace-otlp-grpc @opentelemetry/exporter-metrics-otlp-grpc @opentelemetry/sdk-metrics --save-dev
fi

# Create log directory
mkdir -p /tmp/signalcartel-logs

echo ""
echo -e "${GREEN}✅ All systems ready!${NC}"
echo ""
echo -e "${BLUE}📊 MONITORING DASHBOARDS:${NC}"
echo "  • SigNoz: http://localhost:3301"
echo "  • Login: gaylen@signalcartel.io / admin123"
echo "  • Quantum Forge Monitor: Run ./admin/quantum-forge-live-monitor.ts in another terminal"
echo ""
echo -e "${YELLOW}🚀 Starting QUANTUM FORGE™ Trading Engine with Full Observability...${NC}"
echo ""

# Start the monitored trading engine
npx tsx -r dotenv/config load-database-strategies-monitored.ts 2>&1 | tee /tmp/signalcartel-logs/monitored-trading-$(date +%Y%m%d_%H%M%S).log