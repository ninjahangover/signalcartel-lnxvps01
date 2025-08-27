#!/bin/bash

# SignalCartel Container Build Fix Script
# Applies all discovered fixes to container Dockerfiles

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "🔧 Applying container build fixes..."

# Fix market-data container
MARKET_DATA_DOCKERFILE="${PROJECT_ROOT}/containers/market-data/Dockerfile"
if [[ -f "${MARKET_DATA_DOCKERFILE}" ]]; then
    echo "  📦 Fixing market-data Dockerfile..."
    
    # Replace npm ci with npm install --production
    sed -i 's/npm ci --only=production/npm install --production/g' "${MARKET_DATA_DOCKERFILE}"
    
    echo "  ✅ Fixed market-data container build"
fi

# Fix ai-ml container if it exists
AI_ML_DOCKERFILE="${PROJECT_ROOT}/containers/ai-ml/Dockerfile"
if [[ -f "${AI_ML_DOCKERFILE}" ]]; then
    echo "  📦 Fixing ai-ml Dockerfile..."
    
    # Replace npm ci with npm install --production
    sed -i 's/npm ci --only=production/npm install --production/g' "${AI_ML_DOCKERFILE}"
    sed -i 's/npm ci/npm install --production/g' "${AI_ML_DOCKERFILE}"
    
    echo "  ✅ Fixed ai-ml container build"
fi

# Fix any other containers with npm ci
find "${PROJECT_ROOT}/containers" -name "Dockerfile" -exec grep -l "npm ci" {} \; | while read dockerfile; do
    echo "  📦 Fixing $(basename $(dirname ${dockerfile})) Dockerfile..."
    sed -i 's/npm ci --only=production/npm install --production/g' "${dockerfile}"
    sed -i 's/npm ci/npm install --production/g' "${dockerfile}"
done

echo "✅ All container build fixes applied!"
echo ""
echo "📝 Applied fixes:"
echo "  • Changed 'npm ci' to 'npm install --production' in all Dockerfiles"
echo "  • This resolves package-lock.json sync issues with new dependencies"
echo ""
echo "🚀 Ready for clean container builds!"