#!/bin/bash
# QUANTUM FORGE™ DNS Configuration Helper for VMS Database Infrastructure
# Provides DNS setup instructions and validation tools

echo "🌐 QUANTUM FORGE™ VMS DNS CONFIGURATION HELPER"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Get VMS server IP (you'll need to update this)
VMS_IP="${1:-YOUR_VMS_SERVER_IP}"
DOMAIN="${2:-yourdomain.com}"

if [[ "$VMS_IP" == "YOUR_VMS_SERVER_IP" ]]; then
    echo -e "${RED}❌ VMS IP address required${NC}"
    echo "Usage: $0 <VMS_SERVER_IP> [domain.com]"
    echo "Example: $0 192.168.1.100 yourdomain.com"
    exit 1
fi

echo -e "${BLUE}📋 DNS CONFIGURATION FOR QUANTUM FORGE™ DATABASE ACCESS${NC}"
echo "VMS Server IP: $VMS_IP"
echo "Domain: $DOMAIN"
echo ""

echo -e "${YELLOW}🔧 STEP 1: DNS A RECORDS TO CREATE${NC}"
echo "Add these A records to your DNS provider:"
echo ""
echo "Record Type | Subdomain      | Points To     | TTL"
echo "-----------|----------------|---------------|----"
echo "A          | db             | $VMS_IP       | 300"
echo "A          | analytics      | $VMS_IP       | 300" 
echo "A          | db-backup      | $VMS_IP       | 300"
echo ""

echo -e "${YELLOW}🔧 STEP 2: RESULTING DNS NAMES${NC}"
echo "After DNS propagation, these will resolve to your VMS server:"
echo "• db.$DOMAIN:5432 (Primary Database)"
echo "• analytics.$DOMAIN:5434 (Analytics Database)" 
echo "• db.$DOMAIN:5433 (Replica Database)"
echo "• db.$DOMAIN:6379 (Redis Cache)"
echo "• db.$DOMAIN:6432 (Connection Pool)"
echo ""

echo -e "${YELLOW}🔧 STEP 3: TESTING DNS RESOLUTION${NC}"
echo "Test DNS resolution with these commands:"
echo ""
echo "# Test if DNS records are working"
echo "nslookup db.$DOMAIN"
echo "nslookup analytics.$DOMAIN"
echo ""
echo "# Test database connectivity"
echo "pg_isready -h db.$DOMAIN -p 5432"
echo "pg_isready -h analytics.$DOMAIN -p 5434"
echo ""

# Create DNS test script
cat > test-dns-connectivity.sh << EOF
#!/bin/bash
# Test DNS and database connectivity

echo "🧪 Testing DNS Resolution..."
echo "=============================="

echo "Testing db.$DOMAIN..."
if nslookup db.$DOMAIN > /dev/null 2>&1; then
    echo "✅ db.$DOMAIN resolves"
    IP=\$(nslookup db.$DOMAIN | grep "Address:" | tail -1 | awk '{print \$2}')
    echo "   IP: \$IP"
else
    echo "❌ db.$DOMAIN does not resolve"
fi

echo ""
echo "Testing analytics.$DOMAIN..."
if nslookup analytics.$DOMAIN > /dev/null 2>&1; then
    echo "✅ analytics.$DOMAIN resolves"
    IP=\$(nslookup analytics.$DOMAIN | grep "Address:" | tail -1 | awk '{print \$2}')
    echo "   IP: \$IP"
else
    echo "❌ analytics.$DOMAIN does not resolve"
fi

echo ""
echo "🔌 Testing Database Connectivity..."
echo "=================================="

if command -v pg_isready &> /dev/null; then
    echo "Testing primary database (db.$DOMAIN:5432)..."
    if pg_isready -h db.$DOMAIN -p 5432; then
        echo "✅ Primary database is ready"
    else
        echo "❌ Primary database is not ready"
    fi
    
    echo "Testing replica database (db.$DOMAIN:5433)..."
    if pg_isready -h db.$DOMAIN -p 5433; then
        echo "✅ Replica database is ready"
    else
        echo "❌ Replica database is not ready"
    fi
    
    echo "Testing analytics database (analytics.$DOMAIN:5434)..."
    if pg_isready -h analytics.$DOMAIN -p 5434; then
        echo "✅ Analytics database is ready"
    else
        echo "❌ Analytics database is not ready"
    fi
else
    echo "⚠️ pg_isready not available. Install postgresql-client to test database connectivity."
fi

echo ""
echo "🧪 Testing Redis Connectivity..."
echo "==============================="

if command -v redis-cli &> /dev/null; then
    if redis-cli -h db.$DOMAIN -p 6379 ping > /dev/null 2>&1; then
        echo "✅ Redis cache is ready"
    else
        echo "❌ Redis cache is not ready"
    fi
else
    echo "⚠️ redis-cli not available. Install redis-tools to test Redis connectivity."
fi

echo ""
echo "🔧 Testing Connection Pool..."
echo "============================"

if command -v nc &> /dev/null; then
    if nc -z db.$DOMAIN 6432; then
        echo "✅ Connection pool (pgBouncer) is ready"
    else
        echo "❌ Connection pool (pgBouncer) is not ready"
    fi
else
    echo "⚠️ netcat not available. Install netcat to test connection pool."
fi
EOF

chmod +x test-dns-connectivity.sh

echo -e "${YELLOW}🔧 STEP 4: CONNECTION STRING TEMPLATES${NC}"
echo "Use these connection strings in your dev servers' .env files:"
echo ""
echo "# Production Database (Primary)"
echo 'DATABASE_URL="postgresql://trading_user:PASSWORD@db.'$DOMAIN':5432/signalcartel"'
echo ""
echo "# Analytics Database"  
echo 'ANALYTICS_DB_URL="postgresql://analytics_user:PASSWORD@analytics.'$DOMAIN':5434/signalcartel_analytics"'
echo ""
echo "# Backup Database (Replica)"
echo 'BACKUP_DB_URL="postgresql://trading_user:PASSWORD@db.'$DOMAIN':5433/signalcartel"'
echo ""
echo "# High-Performance Pool"
echo 'POOLED_DB_URL="postgresql://trading_user:PASSWORD@db.'$DOMAIN':6432/signalcartel"'
echo ""
echo "# Redis Cache"
echo 'REDIS_URL="redis://db.'$DOMAIN':6379"'
echo ""

echo -e "${YELLOW}🔧 STEP 5: FIREWALL CONFIGURATION${NC}"
echo "Configure your VMS server firewall to allow these ports:"
echo "• Port 5432 (PostgreSQL Primary)"
echo "• Port 5433 (PostgreSQL Replica)" 
echo "• Port 5434 (Analytics Database)"
echo "• Port 6379 (Redis Cache)"
echo "• Port 6432 (Connection Pool)"
echo ""
echo "Example UFW commands:"
echo "sudo ufw allow 5432/tcp comment 'PostgreSQL Primary'"
echo "sudo ufw allow 5433/tcp comment 'PostgreSQL Replica'"
echo "sudo ufw allow 5434/tcp comment 'Analytics DB'"
echo "sudo ufw allow 6379/tcp comment 'Redis Cache'"
echo "sudo ufw allow 6432/tcp comment 'Connection Pool'"
echo ""

echo -e "${GREEN}✅ DNS Configuration Helper Complete!${NC}"
echo ""
echo -e "${BLUE}📋 NEXT STEPS:${NC}"
echo "1. Add the A records to your DNS provider"
echo "2. Wait 5-15 minutes for DNS propagation"
echo "3. Run: ./test-dns-connectivity.sh"
echo "4. Update your dev servers with the connection strings"
echo "5. Test database connectivity from dev servers"
echo ""
echo -e "${YELLOW}📝 DNS test script created: test-dns-connectivity.sh${NC}"