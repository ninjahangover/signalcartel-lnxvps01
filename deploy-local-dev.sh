#!/bin/bash

# SignalCartel Local Dev Environment Deployment Script
# For Alienware Aurora R6 with CUDA support

set -e

echo "🚀 SignalCartel Local Dev Deployment"
echo "=================================="

# Configuration
PROJECT_DIR="$HOME/signalcartel-local-dev"
REPO_URL="https://github.com/your-username/dev-signalcartel.git"  # Update with your repo
COMPOSE_PROJECT="signalcartel-local"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR:${NC} $1"
}

# Step 1: Clean existing deployment if it exists
if [ -d "$PROJECT_DIR" ]; then
    log "Cleaning existing deployment..."
    cd "$PROJECT_DIR"
    docker-compose -p "$COMPOSE_PROJECT" down --volumes --remove-orphans 2>/dev/null || true
    cd ..
    rm -rf "$PROJECT_DIR"
fi

# Also clean any existing SignalCartel containers from current directory
log "Cleaning any existing SignalCartel containers..."
docker-compose down --volumes --remove-orphans 2>/dev/null || true
docker container prune -f 2>/dev/null || true

# Step 2: Fresh clone
log "Cloning latest repository..."
git clone "$REPO_URL" "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Step 3: Environment setup
log "Setting up environment..."
if [ ! -f .env.local ]; then
    if [ -f .env ]; then
        cp .env .env.local
        log "Copied .env to .env.local"
    else
        warn "No .env file found - you'll need to configure environment variables"
    fi
fi

# Step 4: Create necessary directories
log "Creating directories..."
mkdir -p logs
mkdir -p data/redis
mkdir -p data/postgres
mkdir -p monitoring/prometheus
mkdir -p monitoring/grafana

# Step 5: Docker network setup
log "Setting up Docker networks..."
docker network create signalcartel-local-network 2>/dev/null || log "Network already exists"

# Step 6: Build all containers
log "Building all containers..."
docker-compose -p "$COMPOSE_PROJECT" build --no-cache

# Step 7: Start core services first
log "Starting core services (database, redis)..."
docker-compose -p "$COMPOSE_PROJECT" up -d postgres redis

# Wait for database
log "Waiting for database to be ready..."
sleep 10

# Step 8: Run database setup
log "Setting up database..."
docker-compose -p "$COMPOSE_PROJECT" exec -T postgres psql -U signalcartel -d signalcartel -c "SELECT 1;" || {
    warn "Database not ready, waiting longer..."
    sleep 15
}

# Generate Prisma client and run migrations
log "Running Prisma setup..."
npm install
npx prisma generate
npx prisma db push

# Step 9: Start all services
log "Starting all services..."
docker-compose -p "$COMPOSE_PROJECT" up -d

# Step 10: Wait for services to be ready
log "Waiting for services to start..."
sleep 30

# Step 11: Run verification
log "Running system verification..."
npx tsx -r dotenv/config quick-system-check.ts || warn "System check failed - check logs"

# Step 12: Display status
echo ""
echo -e "${BLUE}=== DEPLOYMENT COMPLETE ===${NC}"
echo ""
echo "🌐 Services available at:"
echo "  - Website: http://localhost:3001"
echo "  - Grafana: http://localhost:3000"
echo "  - Prometheus: http://localhost:9090"
echo ""
echo "📊 Container status:"
docker-compose -p "$COMPOSE_PROJECT" ps

echo ""
echo "🔧 Useful commands:"
echo "  - View logs: docker-compose -p $COMPOSE_PROJECT logs -f [service]"
echo "  - Stop all: docker-compose -p $COMPOSE_PROJECT down"
echo "  - Restart: docker-compose -p $COMPOSE_PROJECT restart [service]"
echo ""
echo "🧪 Verification commands:"
echo "  - System check: npx tsx -r dotenv/config quick-system-check.ts"
echo "  - Test trade: npx tsx -r dotenv/config force-test-trade.ts"
echo "  - Verify strategies: npx tsx -r dotenv/config verify-strategy-signals.ts"
echo ""

# Step 13: CUDA verification (if available)
if command -v nvidia-smi &> /dev/null; then
    log "CUDA detected - checking GPU status..."
    nvidia-smi --query-gpu=gpu_name,memory.total,memory.used --format=csv,noheader
    echo ""
    echo "🎮 CUDA setup guide: docs/CUDA-SETUP.md"
else
    warn "NVIDIA drivers not detected"
fi

log "Local dev environment deployed successfully!"
log "Check the services above and run verification scripts to confirm everything works."