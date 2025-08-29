#!/bin/bash
# QUANTUM FORGE™ Start with SigNoz - Simple Version (No Complex Dependencies)

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 QUANTUM FORGE™ SIMPLE SIGNOZ STARTUP${NC}"
echo "========================================"
echo ""

# Trading configuration
export ENABLE_GPU_STRATEGIES=true
export NTFY_TOPIC="signal-cartel"
export DATABASE_URL="postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/signalcartel?schema=public"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "  • GPU Strategies: $ENABLE_GPU_STRATEGIES"
echo "  • Database: signalcartel"
echo "  • Topic: $NTFY_TOPIC"
echo ""

# Check if SigNoz is running
echo -e "${YELLOW}🔍 Checking SigNoz services...${NC}"
if docker ps | grep -q "signoz-frontend" && docker ps | grep -q "signoz-otel-collector"; then
    echo -e "${GREEN}✅ SigNoz is running${NC}"
    echo -e "${GREEN}✅ Access: https://monitor.pixelraidersystems.com${NC}"
    echo -e "${GREEN}✅ Login: gaylen@signalcartel.io / admin123${NC}"
else
    echo -e "${RED}❌ SigNoz not fully running!${NC}"
    echo -e "${YELLOW}Starting SigNoz services...${NC}"
    cd /home/telgkb9/signoz && docker-compose up -d
    echo -e "${YELLOW}Waiting for services to start...${NC}"
    sleep 30
fi

# Create log directory
mkdir -p /tmp/signalcartel-logs

echo ""
echo -e "${GREEN}✅ Starting QUANTUM FORGE™ Trading Engine${NC}"
echo -e "${BLUE}📊 Monitor SigNoz: https://monitor.pixelraidersystems.com${NC}"
echo -e "${YELLOW}📝 Live Monitor: Run './admin/terminal-dashboard.sh' in another terminal${NC}"
echo ""

# Start the regular trading engine (without complex telemetry for now)
echo -e "${YELLOW}🚀 Launching trading system...${NC}"

# Use the production trading script that works
DATABASE_URL="postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/signalcartel?schema=public" \
ENABLE_GPU_STRATEGIES=true \
NTFY_TOPIC="signal-cartel" \
npx tsx -r dotenv/config production-trading-with-positions.ts 2>&1 | tee /tmp/signalcartel-logs/trading-$(date +%Y%m%d_%H%M%S).log