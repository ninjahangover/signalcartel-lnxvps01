#!/bin/bash

# QUANTUM FORGE™ CUDA Environment Configuration Script
# Ensures proper environment variables are set for trading engine

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
CUDA_ENV_FILE="$PROJECT_DIR/.env.cuda"

echo "🔧 QUANTUM FORGE™ CUDA Environment Configuration"
echo "=" "50"

# Check if .env.cuda exists
if [ -f "$CUDA_ENV_FILE" ]; then
    echo "📋 Found existing .env.cuda file"
    echo "   📁 Location: $CUDA_ENV_FILE"
    
    # Show current contents
    echo ""
    echo "📄 Current configuration:"
    echo "------------------------"
    cat "$CUDA_ENV_FILE"
    echo "------------------------"
else
    echo "📄 Creating new .env.cuda file..."
    
    # Create default .env.cuda file
    cat > "$CUDA_ENV_FILE" << 'EOF'
# QUANTUM FORGE™ Trading Engine Environment Variables
# GPU and Trading Configuration

# Enable GPU acceleration for all strategies
ENABLE_GPU_STRATEGIES=true

# CUDA device configuration (0 = first GPU, 1 = second GPU, etc.)
CUDA_VISIBLE_DEVICES=0

# Notification system
NTFY_TOPIC=signal-cartel

# Database configuration
DATABASE_URL="file:./dev.db"

# Development vs Production mode
NODE_ENV=development
EOF
    
    echo "✅ Created default .env.cuda configuration"
fi

# Verify GPU availability
echo ""
echo "🔍 Verifying GPU setup..."
if command -v nvidia-smi >/dev/null 2>&1; then
    GPU_COUNT=$(nvidia-smi --list-gpus | wc -l)
    GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader,nounits 2>/dev/null | head -1 || echo "Unknown")
    GPU_MEMORY=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits 2>/dev/null | head -1 || echo "Unknown")
    CUDA_VERSION=$(nvidia-smi 2>/dev/null | grep "CUDA Version" | awk '{print $9}' || echo "Unknown")
    
    echo "   ✅ GPU detected: $GPU_NAME"
    echo "   ✅ GPU memory: ${GPU_MEMORY}MiB"
    echo "   ✅ CUDA version: $CUDA_VERSION"
    echo "   ✅ GPU count: $GPU_COUNT"
    
    if [ "$GPU_COUNT" -gt 1 ]; then
        echo "   💡 Multiple GPUs detected. Consider updating CUDA_VISIBLE_DEVICES if needed."
    fi
else
    echo "   ⚠️  nvidia-smi not found. GPU acceleration may not work."
    echo "   💡 Install NVIDIA drivers and CUDA toolkit for full performance"
fi

# Check Node.js version
echo ""
echo "🔍 Verifying Node.js setup..."
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    echo "   ✅ Node.js version: $NODE_VERSION"
    
    if node -e "console.log('Node.js working')"; then
        echo "   ✅ Node.js execution test passed"
    else
        echo "   ⚠️  Node.js execution test failed"
    fi
else
    echo "   ❌ Node.js not found. Please install Node.js"
    exit 1
fi

# Test environment loading
echo ""
echo "🧪 Testing environment variable loading..."
if [ -f "$CUDA_ENV_FILE" ]; then
    # Load and test variables
    source "$CUDA_ENV_FILE" 2>/dev/null || echo "   ⚠️  Some environment variables may not be valid shell syntax"
    
    echo "   📋 Loaded environment variables:"
    echo "      ENABLE_GPU_STRATEGIES: ${ENABLE_GPU_STRATEGIES:-'not set'}"
    echo "      CUDA_VISIBLE_DEVICES: ${CUDA_VISIBLE_DEVICES:-'not set'}"
    echo "      NTFY_TOPIC: ${NTFY_TOPIC:-'not set'}"
    echo "      NODE_ENV: ${NODE_ENV:-'not set'}"
else
    echo "   ❌ .env.cuda file not found after creation"
    exit 1
fi

# Set up systemd service configuration (if running with systemd)
echo ""
echo "🔧 System integration setup..."

SYSTEMD_SERVICE_FILE="$PROJECT_DIR/scripts/trading/quantum-forge-trading.service"
if [ -f "$SYSTEMD_SERVICE_FILE" ]; then
    echo "   ✅ Found systemd service file: quantum-forge-trading.service"
    echo "   💡 To install systemd service:"
    echo "      sudo cp scripts/trading/quantum-forge-trading.service /etc/systemd/system/"
    echo "      sudo systemctl daemon-reload"
    echo "      sudo systemctl enable quantum-forge-trading"
    echo "      sudo systemctl start quantum-forge-trading"
else
    echo "   ℹ️  No systemd service file found"
fi

echo ""
echo "✅ QUANTUM FORGE™ CUDA Environment Configuration Complete!"
echo ""
echo "🚀 Ready to start trading engine:"
echo "   Manual start: ./scripts/trading/start-quantum-forge.sh"
echo "   Background service: systemctl start quantum-forge-trading"
echo ""
echo "📊 Monitor status:"
echo "   Engine logs: tail -f /var/log/quantum-forge-trading.log"
echo "   Dashboard: http://localhost:3001"
echo ""