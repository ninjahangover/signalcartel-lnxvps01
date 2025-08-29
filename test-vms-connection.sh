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
