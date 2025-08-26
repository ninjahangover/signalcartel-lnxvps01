#!/bin/bash

# QUANTUM FORGE™ Trading Engine Startup Script
# Ensures proper CUDA environment and automatic restart capabilities

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
CUDA_ENV_FILE="$PROJECT_DIR/.env.cuda"

echo "🚀 Starting QUANTUM FORGE™ Trading Engine with CUDA"
echo "=" "50"

# Load CUDA environment variables
if [ -f "$CUDA_ENV_FILE" ]; then
    echo "📋 Loading CUDA environment from .env.cuda"
    export $(grep -v '^#' "$CUDA_ENV_FILE" | xargs)
    echo "   ✅ ENABLE_GPU_STRATEGIES=$ENABLE_GPU_STRATEGIES"
    echo "   ✅ CUDA_VISIBLE_DEVICES=$CUDA_VISIBLE_DEVICES"
    echo "   ✅ NTFY_TOPIC=$NTFY_TOPIC"
else
    echo "⚠️  Warning: .env.cuda not found, using defaults"
    export ENABLE_GPU_STRATEGIES=true
    export CUDA_VISIBLE_DEVICES=0
    export NTFY_TOPIC=signal-cartel
fi

# Verify CUDA is available
echo ""
echo "🔍 Verifying CUDA setup..."
if command -v nvidia-smi >/dev/null 2>&1; then
    GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader,nounits 2>/dev/null | head -1 || echo "Unknown")
    echo "   ✅ GPU detected: $GPU_NAME"
else
    echo "   ⚠️  nvidia-smi not found, GPU acceleration may not work"
fi

# Check if process is already running
if pgrep -f "load-database-strategies.ts" > /dev/null; then
    echo ""
    echo "⚠️  QUANTUM FORGE™ trading process already running!"
    echo "   Use 'scripts/trading/stop-quantum-forge.sh' to stop it first"
    exit 1
fi

# Change to project directory
cd "$PROJECT_DIR"

echo ""
echo "🧠 Starting QUANTUM FORGE™ Trading Engine..."
echo "   📊 Sentiment Intelligence: ENABLED"
echo "   🎮 GPU Acceleration: $ENABLE_GPU_STRATEGIES"
echo "   📱 Notifications: $NTFY_TOPIC"
echo ""

# Start the trading engine with all environment variables
exec npx tsx -r dotenv/config load-database-strategies.ts