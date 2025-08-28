#!/bin/bash
# QUANTUM FORGE™ Dev Server Connection Update Script
# Updates both dev servers to use the VMS centralized database

echo "🔄 QUANTUM FORGE™ DEV SERVER CONNECTION UPDATE"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
DOMAIN="${1:-yourdomain.com}"
DB_PASSWORD="${2}"
ANALYTICS_PASSWORD="${3}"

if [[ -z "$DB_PASSWORD" || -z "$ANALYTICS_PASSWORD" ]]; then
    echo -e "${RED}❌ Database passwords required${NC}"
    echo "Usage: $0 <domain> <db_password> <analytics_password>"
    echo "Example: $0 yourdomain.com abc123def456 xyz789uvw012"
    echo ""
    echo "Get passwords from VMS server:"
    echo "cat /opt/quantum-forge-db/.env"
    exit 1
fi

echo -e "${BLUE}📋 UPDATING CONNECTION CONFIGURATION${NC}"
echo "Domain: $DOMAIN"
echo "DB Password: ${DB_PASSWORD:0:8}... (truncated)"
echo "Analytics Password: ${ANALYTICS_PASSWORD:0:8}... (truncated)"
echo ""

# Function to create/update .env file
update_env_file() {
    local env_file="$1"
    local backup_file="${env_file}.backup.$(date +%Y%m%d_%H%M%S)"
    
    echo -e "${YELLOW}🔧 Updating $env_file${NC}"
    
    # Create backup if file exists
    if [[ -f "$env_file" ]]; then
        cp "$env_file" "$backup_file"
        echo "   Backup created: $backup_file"
    fi
    
    # Create/update the .env file
    cat > "$env_file" << EOF
# QUANTUM FORGE™ VMS Database Configuration
# Updated: $(date)
# Centralized database infrastructure on VMS server

# ====================================================================
# PRIMARY DATABASE (Production Trading)
# ====================================================================
DATABASE_URL="postgresql://trading_user:${DB_PASSWORD}@db.${DOMAIN}:5432/signalcartel"

# ====================================================================
# ANALYTICS DATABASE (Cross-site Data Consolidation)
# ====================================================================
ANALYTICS_DB_URL="postgresql://analytics_user:${ANALYTICS_PASSWORD}@analytics.${DOMAIN}:5434/signalcartel_analytics"

# ====================================================================
# BACKUP & FAILOVER CONNECTIONS
# ====================================================================
# Hot standby replica (automatic failover)
BACKUP_DB_URL="postgresql://trading_user:${DB_PASSWORD}@db.${DOMAIN}:5433/signalcartel"

# High-performance connection pool (1000+ concurrent connections)
POOLED_DB_URL="postgresql://trading_user:${DB_PASSWORD}@db.${DOMAIN}:6432/signalcartel"

# ====================================================================
# CACHING LAYER
# ====================================================================
REDIS_URL="redis://db.${DOMAIN}:6379"

# ====================================================================
# QUANTUM FORGE™ CONFIGURATION
# ====================================================================
# Enable GPU acceleration
ENABLE_GPU_STRATEGIES=true

# Notification system
NTFY_TOPIC="signal-cartel"

# ====================================================================
# NEXTAUTH CONFIGURATION
# ====================================================================
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="quantum-forge-trading-secret-$(openssl rand -hex 16)"

# ====================================================================
# FAULT TOLERANCE SETTINGS
# ====================================================================
# Database connection retry settings
DB_RETRY_ATTEMPTS=3
DB_RETRY_DELAY=5000
DB_POOL_SIZE=20
DB_TIMEOUT=30000

# Emergency backup database (local SQLite fallback)
EMERGENCY_DB_PATH="/tmp/quantum-forge-emergency.db"

# Health check intervals (seconds)
DB_HEALTH_CHECK_INTERVAL=30
TRADING_HEALTH_CHECK_INTERVAL=60

# ====================================================================
# PRODUCTION SAFETY
# ====================================================================
# Maximum position size (percentage of account)
MAX_POSITION_SIZE=0.02

# Emergency stop signal file
EMERGENCY_STOP_FILE="/tmp/trading-emergency-stop"

# Maximum daily trades
MAX_DAILY_TRADES=10000

# Minimum confidence threshold
MIN_CONFIDENCE_THRESHOLD=0.10

EOF

    echo "   ✅ $env_file updated successfully"
}

# Update current directory .env
echo -e "${YELLOW}🔧 STEP 1: Updating Primary Environment File${NC}"
update_env_file ".env"

# Update production environment file
echo -e "${YELLOW}🔧 STEP 2: Updating Production Environment File${NC}"
update_env_file ".env.production"

# Create local environment file for development
echo -e "${YELLOW}🔧 STEP 3: Creating Local Development Environment${NC}"
update_env_file ".env.local"

echo -e "${YELLOW}🔧 STEP 4: Creating Connection Test Script${NC}"
# Create connection test script
cat > test-vms-connection.sh << 'EOF'
#!/bin/bash
# Test VMS database connections

echo "🧪 TESTING VMS DATABASE CONNECTIONS"
echo "==================================="

# Load environment variables
if [[ -f .env ]]; then
    export $(grep -v '^#' .env | xargs)
fi

echo "Testing connections from: $(hostname)"
echo "Timestamp: $(date)"
echo ""

# Test primary database
echo "🔌 Testing Primary Database..."
if command -v npx &> /dev/null; then
    npx tsx -e "
    import { PrismaClient } from '@prisma/client';
    const prisma = new PrismaClient();
    (async () => {
      try {
        await prisma.\$queryRaw\`SELECT 1 as test\`;
        console.log('✅ Primary database connection successful');
        const tradeCount = await prisma.managedTrade.count();
        console.log(\`   📊 ManagedTrade records: \${tradeCount}\`);
        await prisma.\$disconnect();
      } catch (error) {
        console.log('❌ Primary database connection failed:', error.message);
      }
    })();
    "
else
    echo "❌ npx not available - install Node.js to test Prisma connections"
fi

echo ""

# Test Redis connection
echo "🔌 Testing Redis Cache..."
if command -v redis-cli &> /dev/null; then
    REDIS_HOST=$(echo $REDIS_URL | sed 's/redis:\/\///' | cut -d: -f1)
    REDIS_PORT=$(echo $REDIS_URL | sed 's/redis:\/\///' | cut -d: -f2)
    
    if redis-cli -h $REDIS_HOST -p $REDIS_PORT ping > /dev/null 2>&1; then
        echo "✅ Redis cache connection successful"
        echo "   📊 Redis info: $(redis-cli -h $REDIS_HOST -p $REDIS_PORT info memory | grep used_memory_human)"
    else
        echo "❌ Redis cache connection failed"
    fi
else
    echo "❌ redis-cli not available - install redis-tools to test Redis"
fi

echo ""

# Test backup database
echo "🔌 Testing Backup Database..."
if command -v pg_isready &> /dev/null; then
    BACKUP_HOST=$(echo $BACKUP_DB_URL | sed 's/.*@//' | cut -d: -f1)
    BACKUP_PORT=$(echo $BACKUP_DB_URL | sed 's/.*://' | cut -d/ -f1)
    
    if pg_isready -h $BACKUP_HOST -p $BACKUP_PORT; then
        echo "✅ Backup database is ready"
    else
        echo "❌ Backup database is not ready"
    fi
else
    echo "❌ pg_isready not available - install postgresql-client"
fi

echo ""
echo "🎯 Connection test complete!"
EOF

chmod +x test-vms-connection.sh

echo -e "${YELLOW}🔧 STEP 5: Creating Failover Configuration${NC}"
# Create failover configuration
cat > failover-config.json << EOF
{
  "databases": [
    {
      "name": "primary",
      "url": "postgresql://trading_user:${DB_PASSWORD}@db.${DOMAIN}:5432/signalcartel",
      "priority": 1,
      "healthCheckInterval": 30
    },
    {
      "name": "replica", 
      "url": "postgresql://trading_user:${DB_PASSWORD}@db.${DOMAIN}:5433/signalcartel",
      "priority": 2,
      "healthCheckInterval": 30
    },
    {
      "name": "pooled",
      "url": "postgresql://trading_user:${DB_PASSWORD}@db.${DOMAIN}:6432/signalcartel", 
      "priority": 3,
      "healthCheckInterval": 60
    }
  ],
  "emergencyDatabase": "/tmp/quantum-forge-emergency.db",
  "maxRetries": 3,
  "retryDelay": 5000,
  "emergencyStopFile": "/tmp/trading-emergency-stop"
}
EOF

echo -e "${GREEN}✅ DEV SERVER CONNECTION UPDATE COMPLETE!${NC}"
echo ""
echo -e "${BLUE}📋 FILES CREATED/UPDATED:${NC}"
echo "• .env (primary configuration)"
echo "• .env.production (production settings)"
echo "• .env.local (local development)"
echo "• test-vms-connection.sh (connection testing)"
echo "• failover-config.json (fault tolerance config)"
echo ""
echo -e "${YELLOW}🧪 NEXT STEPS:${NC}"
echo "1. Test connections: ./test-vms-connection.sh"
echo "2. Restart any running trading processes"
echo "3. Monitor logs for successful database connections"
echo "4. Test trading functionality"
echo ""
echo -e "${RED}⚠️ IMPORTANT:${NC}"
echo "• All passwords are stored in .env files (review security)"
echo "• Backup files created with timestamps"
echo "• Test thoroughly before live trading"
echo "• Emergency stop file: /tmp/trading-emergency-stop"