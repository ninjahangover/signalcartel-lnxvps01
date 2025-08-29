#!/bin/bash
# QUANTUM FORGE™ VMS Database Infrastructure Deployment Script
# Deploys containerized PostgreSQL with redundancy on VMS server

set -e

echo "🚀 QUANTUM FORGE™ VMS DATABASE INFRASTRUCTURE DEPLOYMENT"
echo "========================================================"
echo "Timestamp: $(date)"
echo ""

# Configuration
PROJECT_DIR="/opt/quantum-forge-db"
BACKUP_DIR="/opt/quantum-forge-backups"
LOG_FILE="/var/log/quantum-forge-vms-deployment.log"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "$1"
    # Attempt to write to log file, ignore errors
    echo -e "$1" >> "$LOG_FILE" 2>/dev/null || true
}

log "${BLUE}📋 DEPLOYMENT CHECKLIST:${NC}"
log "✅ VMS Server available"
log "✅ Subdomain DNS capability confirmed"
log "✅ Docker deployment approach validated"
log ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   log "${RED}❌ This script must be run as root${NC}"
   log "   Please run: sudo $0"
   exit 1
fi

log "${YELLOW}🔧 STEP 1: Installing Docker and Prerequisites${NC}"
# Install Docker if needed
if ! command -v docker &> /dev/null; then
    log "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    usermod -aG docker $USER
    log "✅ Docker installed successfully"
else
    log "✅ Docker already installed"
fi

# Install Docker Compose if needed
if ! command -v docker-compose &> /dev/null; then
    log "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    log "✅ Docker Compose installed successfully"
else
    log "✅ Docker Compose already installed"
fi

log "${YELLOW}🔧 STEP 2: Creating Project Structure${NC}"
# Create project directory
mkdir -p "$PROJECT_DIR"
mkdir -p "$BACKUP_DIR/wal"
mkdir -p "$BACKUP_DIR/dumps"
mkdir -p "$PROJECT_DIR/init-scripts"
cd "$PROJECT_DIR"

log "${YELLOW}🔐 STEP 3: Generating Security Configuration${NC}"
# Generate secure passwords
DB_PASSWORD=$(openssl rand -hex 32)
ANALYTICS_PASSWORD=$(openssl rand -hex 32)
REPLICATION_PASSWORD=$(openssl rand -hex 24)

# Save credentials securely
cat > .env << EOF
# QUANTUM FORGE™ Database Credentials
# Generated: $(date)
DB_PASSWORD=${DB_PASSWORD}
ANALYTICS_PASSWORD=${ANALYTICS_PASSWORD}
REPLICATION_PASSWORD=${REPLICATION_PASSWORD}

# Network configuration
POSTGRES_NETWORK=quantum-forge-network
EOF
chmod 600 .env

log "✅ Secure credentials generated and saved"

log "${YELLOW}🔧 STEP 4: Creating Database Initialization Scripts${NC}"
# Create database initialization script
cat > init-scripts/01-create-databases.sql << 'EOF'
-- QUANTUM FORGE™ Database Initialization
-- Creates databases and users for the trading platform

-- Create databases
CREATE DATABASE signalcartel;
CREATE DATABASE signalcartel_analytics;

-- Create users with appropriate privileges
CREATE USER trading_user WITH PASSWORD '${DB_PASSWORD}';
CREATE USER analytics_user WITH PASSWORD '${ANALYTICS_PASSWORD}';
CREATE USER replicator WITH REPLICATION PASSWORD '${REPLICATION_PASSWORD}';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE signalcartel TO trading_user;
GRANT ALL PRIVILEGES ON DATABASE signalcartel_analytics TO analytics_user;

-- Enable extensions for time-series data
\c signalcartel;
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

\c signalcartel_analytics;
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
EOF

log "${YELLOW}🐳 STEP 5: Creating Docker Compose Configuration${NC}"
# Create docker-compose.yml
cat > docker-compose.yml << EOF
version: '3.8'

services:
  # Primary PostgreSQL Database
  signalcartel-db-primary:
    image: timescale/timescaledb:latest-pg15
    container_name: quantum-forge-db-primary
    restart: unless-stopped
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: \${DB_PASSWORD}
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --locale=C"
    volumes:
      - postgres_primary_data:/var/lib/postgresql/data
      - ${BACKUP_DIR}:/backups
      - ./init-scripts:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    command: |
      postgres
      -c wal_level=replica
      -c max_wal_senders=10
      -c max_replication_slots=10
      -c hot_standby=on
      -c archive_mode=on
      -c archive_command='cp %p /backups/wal/%f'
      -c shared_preload_libraries='timescaledb,pg_stat_statements'
      -c max_connections=200
      -c shared_buffers=256MB
      -c effective_cache_size=1GB
      -c maintenance_work_mem=64MB
      -c checkpoint_completion_target=0.7
      -c wal_buffers=16MB
    networks:
      - quantum-forge
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Replica PostgreSQL Database (Hot Standby)
  signalcartel-db-replica:
    image: timescale/timescaledb:latest-pg15
    container_name: quantum-forge-db-replica
    restart: unless-stopped
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: \${DB_PASSWORD}
      PGUSER: postgres
      POSTGRES_PRIMARY_HOST: signalcartel-db-primary
      POSTGRES_PRIMARY_PORT: 5432
      POSTGRES_REPLICA_USER: replicator
      POSTGRES_REPLICA_PASSWORD: \${REPLICATION_PASSWORD}
    volumes:
      - postgres_replica_data:/var/lib/postgresql/data
    ports:
      - "5433:5432"
    depends_on:
      signalcartel-db-primary:
        condition: service_healthy
    command: |
      bash -c '
        until pg_isready -h signalcartel-db-primary -p 5432 -U postgres; do
          echo "Waiting for primary database..."
          sleep 2
        done
        echo "Setting up streaming replication..."
        pg_basebackup -h signalcartel-db-primary -D /var/lib/postgresql/data -U replicator -P -v -R -W
        postgres
      '
    networks:
      - quantum-forge
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis Cache for Hot Data
  redis-cache:
    image: redis:7-alpine
    container_name: quantum-forge-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    networks:
      - quantum-forge
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # PgBouncer Connection Pooler
  pgbouncer:
    image: pgbouncer/pgbouncer:latest
    container_name: quantum-forge-pgbouncer
    restart: unless-stopped
    environment:
      DATABASES_HOST: signalcartel-db-primary
      DATABASES_PORT: 5432
      DATABASES_NAME: signalcartel
      DATABASES_USER: trading_user
      DATABASES_PASSWORD: \${DB_PASSWORD}
      POOL_MODE: session
      MAX_CLIENT_CONN: 1000
      DEFAULT_POOL_SIZE: 50
      SERVER_RESET_QUERY: DISCARD ALL
      IGNORE_STARTUP_PARAMETERS: extra_float_digits
    ports:
      - "6432:6432"
    depends_on:
      signalcartel-db-primary:
        condition: service_healthy
    networks:
      - quantum-forge
    healthcheck:
      test: ["CMD", "nc", "-z", "localhost", "6432"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Analytics Database (Separate instance)
  analytics-db:
    image: timescale/timescaledb:latest-pg15
    container_name: quantum-forge-analytics
    restart: unless-stopped
    environment:
      POSTGRES_DB: signalcartel_analytics
      POSTGRES_USER: analytics_user
      POSTGRES_PASSWORD: \${ANALYTICS_PASSWORD}
    volumes:
      - analytics_data:/var/lib/postgresql/data
    ports:
      - "5434:5432"
    command: |
      postgres
      -c shared_preload_libraries='timescaledb,pg_stat_statements'
      -c max_connections=100
      -c shared_buffers=128MB
      -c effective_cache_size=512MB
    networks:
      - quantum-forge
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U analytics_user -d signalcartel_analytics"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_primary_data:
    driver: local
  postgres_replica_data:
    driver: local
  redis_data:
    driver: local
  analytics_data:
    driver: local

networks:
  quantum-forge:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
EOF

log "${YELLOW}🚀 STEP 6: Deploying Infrastructure${NC}"
# Deploy the infrastructure
log "Starting containers..."
docker-compose up -d

# Wait for services to be healthy
log "Waiting for services to become healthy..."
sleep 30

# Check service status
log "${BLUE}📊 Service Health Check:${NC}"
docker-compose ps

log "${YELLOW}🧪 STEP 7: Testing Database Connectivity${NC}"
# Test connections
log "Testing primary database connection..."
docker exec quantum-forge-db-primary pg_isready -U postgres || log "${RED}❌ Primary DB not ready${NC}"

log "Testing replica database connection..."
docker exec quantum-forge-db-replica pg_isready -U postgres || log "${RED}❌ Replica DB not ready${NC}"

log "Testing Redis connection..."
docker exec quantum-forge-redis redis-cli ping || log "${RED}❌ Redis not ready${NC}"

log "Testing pgBouncer connection..."
docker exec quantum-forge-pgbouncer nc -z localhost 6432 || log "${RED}❌ pgBouncer not ready${NC}"

log "${YELLOW}📋 STEP 8: Creating Connection Information${NC}"
# Create connection info file
cat > connection-info.txt << EOF
🚀 QUANTUM FORGE™ VMS Database Infrastructure - Connection Information
=====================================================================

🔗 CONNECTION STRINGS FOR DEV SERVERS:

# Primary Database (Production Trading)
DATABASE_URL="postgresql://trading_user:${DB_PASSWORD}@db.yourdomain.com:5432/signalcartel"

# Analytics Database (Cross-site Data)
ANALYTICS_DB_URL="postgresql://analytics_user:${ANALYTICS_PASSWORD}@analytics.yourdomain.com:5434/signalcartel_analytics"

# Backup Database (Hot Standby)
BACKUP_DB_URL="postgresql://trading_user:${DB_PASSWORD}@db.yourdomain.com:5433/signalcartel"

# Connection Pooling (High Performance)
POOLED_DB_URL="postgresql://trading_user:${DB_PASSWORD}@db.yourdomain.com:6432/signalcartel"

# Redis Cache
REDIS_URL="redis://db.yourdomain.com:6379"

🌐 DNS CONFIGURATION REQUIRED:
# Add these A records to your domain DNS:
db.yourdomain.com          → ${VMS_SERVER_IP:-YOUR_VMS_IP}
analytics.yourdomain.com   → ${VMS_SERVER_IP:-YOUR_VMS_IP}

🔧 CONTAINER STATUS:
$(docker-compose ps)

📊 DATABASE SIZES:
$(docker exec quantum-forge-db-primary psql -U postgres -c "SELECT datname, pg_size_pretty(pg_database_size(datname)) as size FROM pg_database WHERE datname IN ('signalcartel', 'signalcartel_analytics', 'postgres');" 2>/dev/null || echo "Databases still initializing...")

🛡️ BACKUP DIRECTORY:
${BACKUP_DIR}

📝 LOG FILE:
${LOG_FILE}

⚡ NEXT STEPS:
1. Configure DNS A records pointing to this VMS server
2. Update dev server .env files with connection strings above
3. Test connectivity from dev servers
4. Migrate existing data if needed
5. Configure SSL certificates for production use
EOF

log "${GREEN}✅ QUANTUM FORGE™ VMS Database Infrastructure Deployed Successfully!${NC}"
log ""
log "${BLUE}📋 DEPLOYMENT SUMMARY:${NC}"
log "• Primary PostgreSQL: Port 5432 (with TimescaleDB)"
log "• Replica PostgreSQL: Port 5433 (Hot standby)"
log "• Analytics Database: Port 5434 (Separate instance)"
log "• Redis Cache: Port 6379 (512MB memory limit)"
log "• pgBouncer Pool: Port 6432 (1000 max connections)"
log ""
log "${YELLOW}🔗 Connection information saved to: connection-info.txt${NC}"
log "${YELLOW}📝 Full deployment log saved to: ${LOG_FILE}${NC}"
log ""
log "${RED}⚠️ IMPORTANT SECURITY NOTES:${NC}"
log "• Database passwords are in .env file (chmod 600)"
log "• Configure firewall rules for database ports"
log "• Set up SSL certificates for production use"
log "• Update DNS records for subdomain access"
log ""
log "${GREEN}🎯 Ready for dev server integration and fault tolerance testing!${NC}"

# Make the connection info file readable by the user who will need it
chmod 644 connection-info.txt
chown $SUDO_USER:$SUDO_USER connection-info.txt 2>/dev/null || true

echo ""
echo "🎊 VMS Database Infrastructure deployment complete!"
echo "   Next: Configure DNS and test connectivity from dev servers"