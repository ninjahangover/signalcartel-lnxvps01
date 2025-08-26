#!/bin/bash

# QUANTUM FORGE™ Quick Start Script
# One-command setup for trading engine with CUDA support

set -e

echo "🚀 QUANTUM FORGE™ Trading Engine - Quick Start"
echo "============================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_DIR"

echo "📋 Step 1: Configure CUDA Environment..."
"$SCRIPT_DIR/configure-cuda-environment.sh"

echo ""
echo "📦 Step 2: Install Dependencies..."
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "   Installing npm dependencies..."
    npm install
else
    echo "   ✅ Dependencies already installed"
fi

echo ""
echo "🗄️ Step 3: Database Setup..."
if [ -f "prisma/schema.prisma" ]; then
    echo "   Generating Prisma client..."
    npx prisma generate --schema=prisma/schema.prisma
    echo "   ✅ Database client ready"
else
    echo "   ⚠️  Prisma schema not found, skipping database setup"
fi

echo ""
echo "🧪 Step 4: System Health Check..."
if npx tsx --version >/dev/null 2>&1; then
    echo "   ✅ TypeScript execution engine ready"
else
    echo "   ❌ TypeScript execution engine not available"
    exit 1
fi

echo ""
echo "🎯 Step 5: Trading Engine Status..."
if pgrep -f "load-database-strategies.ts" > /dev/null; then
    echo "   ✅ QUANTUM FORGE™ Trading Engine is already running"
    echo "   💡 Use 'scripts/trading/stop-quantum-forge.sh' to stop it"
else
    echo "   🔄 Trading Engine is not running"
    echo "   💡 Ready to start with 'scripts/trading/start-quantum-forge.sh'"
fi

echo ""
echo "✅ QUANTUM FORGE™ Quick Start Complete!"
echo "========================================="
echo ""
echo "🚀 Available Commands:"
echo "   Start Trading Engine:    ./scripts/trading/start-quantum-forge.sh"
echo "   Stop Trading Engine:     ./scripts/trading/stop-quantum-forge.sh" 
echo "   Monitor Service:         scripts/monitoring/openstatus-monitor-service.sh start"
echo "   Dashboard:               http://localhost:3001"
echo "   GPU Test:                ENABLE_GPU_STRATEGIES=true timeout 10s npx tsx -r dotenv/config test-gpu-strategy-fast.ts"
echo ""
echo "📊 System Status:"
echo "   GPU Acceleration:        $([ "${ENABLE_GPU_STRATEGIES:-false}" = "true" ] && echo "ENABLED" || echo "disabled")"
echo "   CUDA Device:             ${CUDA_VISIBLE_DEVICES:-"not set"}"
echo "   Notifications:           ${NTFY_TOPIC:-"not configured"}"
echo ""
echo "🎯 Next Steps:"
echo "   1. Start the trading engine: ./scripts/trading/start-quantum-forge.sh"
echo "   2. Open dashboard: http://localhost:3001" 
echo "   3. Monitor notifications: https://ntfy.sh/${NTFY_TOPIC:-signal-cartel}"
echo ""