#!/bin/bash
# Test DNS and database connectivity

echo "🧪 Testing DNS Resolution..."
echo "=============================="

echo "Testing db.pixelraidersystems.com..."
if nslookup db.pixelraidersystems.com > /dev/null 2>&1; then
    echo "✅ db.pixelraidersystems.com resolves"
    IP=$(nslookup db.pixelraidersystems.com | grep "Address:" | tail -1 | awk '{print $2}')
    echo "   IP: $IP"
else
    echo "❌ db.pixelraidersystems.com does not resolve"
fi

echo ""
echo "Testing analytics.pixelraidersystems.com..."
if nslookup analytics.pixelraidersystems.com > /dev/null 2>&1; then
    echo "✅ analytics.pixelraidersystems.com resolves"
    IP=$(nslookup analytics.pixelraidersystems.com | grep "Address:" | tail -1 | awk '{print $2}')
    echo "   IP: $IP"
else
    echo "❌ analytics.pixelraidersystems.com does not resolve"
fi

echo ""
echo "🔌 Testing Database Connectivity..."
echo "=================================="

if command -v pg_isready &> /dev/null; then
    echo "Testing primary database (db.pixelraidersystems.com:5432)..."
    if pg_isready -h db.pixelraidersystems.com -p 5432; then
        echo "✅ Primary database is ready"
    else
        echo "❌ Primary database is not ready"
    fi
    
    echo "Testing replica database (db.pixelraidersystems.com:5433)..."
    if pg_isready -h db.pixelraidersystems.com -p 5433; then
        echo "✅ Replica database is ready"
    else
        echo "❌ Replica database is not ready"
    fi
    
    echo "Testing analytics database (analytics.pixelraidersystems.com:5434)..."
    if pg_isready -h analytics.pixelraidersystems.com -p 5434; then
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
    if redis-cli -h db.pixelraidersystems.com -p 6379 ping > /dev/null 2>&1; then
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
    if nc -z db.pixelraidersystems.com 6432; then
        echo "✅ Connection pool (pgBouncer) is ready"
    else
        echo "❌ Connection pool (pgBouncer) is not ready"
    fi
else
    echo "⚠️ netcat not available. Install netcat to test connection pool."
fi
