#!/bin/bash
# QUANTUM FORGE™ SigNoz Deployment Script (No-sudo version)
# Replace OpenStatus with comprehensive observability platform

set -e

# Configuration
SIGNOZ_DIR="$HOME/signoz"
DOCKER_COMPOSE_URL="https://raw.githubusercontent.com/SigNoz/signoz/develop/deploy/docker/clickhouse-setup/docker-compose.yaml"
LOG_FILE="/tmp/signoz-deployment-$(date +%Y%m%d_%H%M%S).log"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

log "${BLUE}🚀 QUANTUM FORGE™ SigNoz DEPLOYMENT${NC}"
log "=================================="
log "Timestamp: $(date)"
log "Replacing OpenStatus with SigNoz APM"
log ""

log "${YELLOW}📋 STEP 1: System Prerequisites${NC}"
# Check Docker and Docker Compose
if ! command -v docker &> /dev/null; then
    log "${RED}❌ Docker not found${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log "${RED}❌ Docker Compose not found${NC}"
    exit 1
fi

# Test docker without sudo
if ! docker ps &> /dev/null; then
    log "${RED}❌ Docker requires sudo - user not in docker group${NC}"
    exit 1
fi

log "${GREEN}✅ Docker and Docker Compose available${NC}"

log "${YELLOW}📋 STEP 2: Creating SigNoz Directory${NC}"
mkdir -p "$SIGNOZ_DIR"
cd "$SIGNOZ_DIR"

log "${YELLOW}📋 STEP 3: Downloading SigNoz Configuration${NC}"
# Download the official SigNoz docker-compose
curl -fsSL "$DOCKER_COMPOSE_URL" -o docker-compose.yaml

# Create custom configuration for SignalCartel
tee signalcartel-config.yaml > /dev/null << 'EOF'
# QUANTUM FORGE™ SigNoz Configuration for SignalCartel
# Custom configuration for trading platform monitoring

version: '3.8'

services:
  # Override SigNoz frontend with custom port
  frontend:
    ports:
      - "3301:3301"  # Use 3301 to avoid conflicts
    environment:
      - FRONTEND_API_ENDPOINT=http://query-service:8080
      - SIGNALCARTEL_ENV=production
      - MONITORING_TARGET=signalcartel_trading_platform

  # Add custom collector configuration
  otel-collector:
    environment:
      - SIGNALCARTEL_NAMESPACE=quantum_forge
      - TRADING_METRICS_ENABLED=true
      - DATABASE_METRICS_ENABLED=true
      - AI_METRICS_ENABLED=true
    
  # Custom network for SignalCartel integration
networks:
  signalcartel-monitoring:
    external: true
EOF

log "${GREEN}✅ SigNoz configuration downloaded${NC}"

log "${YELLOW}📋 STEP 4: Creating SignalCartel Monitoring Network${NC}"
docker network create signalcartel-monitoring 2>/dev/null || log "${BLUE}ℹ️ Network already exists${NC}"

log "${YELLOW}📋 STEP 5: Starting SigNoz Services${NC}"
docker-compose up -d

# Wait for services to start
log "${BLUE}ℹ️ Waiting 60 seconds for services to start...${NC}"
sleep 60

log "${YELLOW}📋 STEP 6: Verifying SigNoz Deployment${NC}"
# Check if services are running
SERVICES=("signoz-frontend" "signoz-query-service" "signoz-otel-collector" "clickhouse" "alertmanager")
HEALTHY_COUNT=0

for service in "${SERVICES[@]}"; do
    if docker ps --format "table {{.Names}}" | grep -q "$service"; then
        log "${GREEN}✅ $service: Running${NC}"
        HEALTHY_COUNT=$((HEALTHY_COUNT + 1))
    else
        log "${RED}❌ $service: Not running${NC}"
    fi
done

log "${BLUE}📊 SigNoz Services: ${HEALTHY_COUNT}/${#SERVICES[@]} running${NC}"

log "${YELLOW}📋 STEP 7: Creating SignalCartel Integration Script${NC}"
# Create integration script for SignalCartel applications
tee /home/telgkb9/depot/signalcartel/scripts/monitoring/signoz-integration.js > /dev/null << 'EOF'
// QUANTUM FORGE™ SigNoz Integration for SignalCartel
// OpenTelemetry setup for Node.js applications

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// SignalCartel Custom Instrumentation
const signalCartelSDK = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.SERVICE_NAME || 'signalcartel-trading',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: 'production',
    'signalcartel.component': process.env.COMPONENT_NAME || 'trading-engine',
    'signalcartel.phase': process.env.TRADING_PHASE || 'phase-3',
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      // Enable comprehensive instrumentation
      '@opentelemetry/instrumentation-fs': { enabled: false }, // Disable file system (too noisy)
      '@opentelemetry/instrumentation-http': { enabled: true },
      '@opentelemetry/instrumentation-express': { enabled: true },
      '@opentelemetry/instrumentation-pg': { enabled: true }, // PostgreSQL
      '@opentelemetry/instrumentation-redis': { enabled: true },
    }),
  ],
});

// Custom metrics for trading performance
const { metrics } = require('@opentelemetry/api');
const meter = metrics.getMeter('signalcartel-trading');

// Business metrics
const tradesPerHour = meter.createCounter('trades_per_hour', {
  description: 'Number of trades executed per hour',
});

const winRate = meter.createHistogram('win_rate_percentage', {
  description: 'Trading win rate percentage',
});

const aiResponseTime = meter.createHistogram('ai_response_time_ms', {
  description: 'AI system response time in milliseconds',
});

const databaseLatency = meter.createHistogram('database_latency_ms', {
  description: 'Database query latency in milliseconds',
});

// Export for use in SignalCartel applications
module.exports = {
  sdk: signalCartelSDK,
  metrics: {
    tradesPerHour,
    winRate,
    aiResponseTime,
    databaseLatency,
  },
};
EOF

log "${GREEN}✅ SignalCartel integration script created${NC}"

log "${YELLOW}📋 STEP 8: Creating Package.json Dependencies${NC}"
# Create package.json for OpenTelemetry dependencies
tee /home/telgkb9/depot/signalcartel/telemetry-package.json > /dev/null << 'EOF'
{
  "name": "signalcartel-telemetry",
  "version": "1.0.0",
  "description": "OpenTelemetry integration for SignalCartel trading platform",
  "dependencies": {
    "@opentelemetry/sdk-node": "^0.45.0",
    "@opentelemetry/auto-instrumentations-node": "^0.40.0",
    "@opentelemetry/api": "^1.7.0",
    "@opentelemetry/resources": "^1.18.0",
    "@opentelemetry/semantic-conventions": "^1.18.0",
    "@opentelemetry/instrumentation-http": "^0.45.0",
    "@opentelemetry/instrumentation-express": "^0.34.0",
    "@opentelemetry/instrumentation-pg": "^0.36.0",
    "@opentelemetry/instrumentation-redis": "^0.35.0"
  }
}
EOF

log "${YELLOW}📋 STEP 9: Creating Startup Integration${NC}"
# Create startup script that includes telemetry
tee /home/telgkb9/depot/signalcartel/scripts/monitoring/start-with-signoz.sh > /dev/null << 'EOF'
#!/bin/bash
# QUANTUM FORGE™ Start SignalCartel with SigNoz Monitoring

set -e

export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4317"
export OTEL_RESOURCE_ATTRIBUTES="service.name=signalcartel-trading,service.version=1.0.0"
export SERVICE_NAME="signalcartel-trading-engine"
export COMPONENT_NAME="quantum-forge-main"

echo "🚀 Starting SignalCartel with SigNoz monitoring..."

# Install telemetry dependencies if needed
if [ ! -d "node_modules/@opentelemetry" ]; then
    echo "📦 Installing OpenTelemetry dependencies..."
    npm install --package-lock-only -f telemetry-package.json
fi

# Start trading with telemetry
node --require './scripts/monitoring/signoz-integration.js' load-database-strategies.ts
EOF

chmod +x /home/telgkb9/depot/signalcartel/scripts/monitoring/start-with-signoz.sh

log ""
log "${GREEN}✅ SIGNOZ DEPLOYMENT COMPLETE${NC}"
log ""
log "${BLUE}📊 DEPLOYMENT SUMMARY:${NC}"
log "• SigNoz Frontend: http://localhost:3301"
log "• OpenTelemetry Endpoint: http://localhost:4317"
log "• Configuration: ${SIGNOZ_DIR}"
log "• Integration Script: /home/telgkb9/depot/signalcartel/scripts/monitoring/signoz-integration.js"
log "• Startup Script: /home/telgkb9/depot/signalcartel/scripts/monitoring/start-with-signoz.sh"
log ""
log "${YELLOW}🔧 NEXT STEPS:${NC}"
log "1. Install OpenTelemetry dependencies: cd /home/telgkb9/depot/signalcartel && npm install --package-lock-only -f telemetry-package.json"
log "2. Start SignalCartel with monitoring: ./scripts/monitoring/start-with-signoz.sh"
log "3. Access SigNoz dashboard: http://localhost:3301"
log "4. Configure custom dashboards for trading workflows"
log ""
log "${BLUE}📝 Log file: ${LOG_FILE}${NC}"

echo ""
echo "SigNoz deployment completed! Ready to replace OpenStatus with comprehensive observability."