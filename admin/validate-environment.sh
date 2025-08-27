#!/bin/bash

# SignalCartel Environment Validation Script
# Quick pre-deployment environment check

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo -e "${BLUE}🔍 SignalCartel Environment Validation${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check Docker
if command -v docker &> /dev/null && docker ps &> /dev/null; then
    log_success "Docker is available and running"
else
    log_error "Docker is not available or not running"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    log_success "Node.js $(node --version) is available"
else
    log_error "Node.js is not installed"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    log_success "npm $(npm --version) is available"
else
    log_error "npm is not available"
    exit 1
fi

# Check disk space (need at least 10GB)
available_space=$(df . | tail -1 | awk '{print $4}')
available_gb=$((available_space / 1024 / 1024))
if [[ ${available_gb} -lt 10 ]]; then
    log_error "Insufficient disk space. Need at least 10GB, have ${available_gb}GB"
    exit 1
else
    log_success "Sufficient disk space: ${available_gb}GB available"
fi

# Check memory
total_memory=$(free -g | awk '/^Mem:/{print $2}')
if [[ ${total_memory} -lt 8 ]]; then
    log_warning "Low memory detected: ${total_memory}GB (recommended: 8GB+)"
else
    log_success "Sufficient memory: ${total_memory}GB"
fi

# Check if .env.local exists
if [[ -f ".env.local" ]]; then
    log_success ".env.local file exists"
else
    log_warning ".env.local file not found - will be created during deployment"
fi

# Check required ports
required_ports=(3001 5432 5433)
for port in "${required_ports[@]}"; do
    if netstat -tuln 2>/dev/null | grep -q ":${port} "; then
        log_warning "Port ${port} is in use"
    else
        log_success "Port ${port} is available"
    fi
done

# Check project structure
required_files=(
    "package.json"
    "prisma/schema-postgres.prisma"
    "load-database-strategies.ts"
)

for file in "${required_files[@]}"; do
    if [[ -f "${file}" ]]; then
        log_success "Required file exists: ${file}"
    else
        log_error "Required file missing: ${file}"
        exit 1
    fi
done

echo ""
log_success "🎯 Environment validation completed successfully!"
log_info "Ready to run: ./scripts/deploy-complete-system.sh"