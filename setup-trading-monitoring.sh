#!/bin/bash
# QUANTUM FORGE™ Trading System Service Points Setup
# Sets up meaningful business metrics and service monitoring

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SIGNOZ_API="http://localhost:8080/api/v1"

echo -e "${BLUE}🚀 QUANTUM FORGE™ Trading System Monitoring Setup${NC}"
echo "===================================================="
echo ""

# Function to make API calls
api_call() {
    local method="$1"
    local endpoint="$2"  
    local data="$3"
    local description="$4"
    
    echo -e "${YELLOW}📡 ${description}${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" "${SIGNOZ_API}${endpoint}")
    else
        response=$(curl -s -X "$method" -w "HTTPSTATUS:%{http_code}" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "${SIGNOZ_API}${endpoint}")
    fi
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "   ${GREEN}✅ Success (${http_code})${NC}"
    else
        echo -e "   ${RED}❌ Failed (${http_code})${NC}"
        echo "   Response: $body"
    fi
    echo ""
}

echo -e "${BLUE}🎯 STEP 1: Creating Service Points for Trading Components${NC}"

# 1. Trading Engine Service Point
api_call "POST" "/services" '{
  "serviceName": "quantum-forge-trading-engine",
  "description": "Main QUANTUM FORGE™ trading engine with position management",
  "version": "4.0.0",
  "environment": "production",
  "tags": {
    "component": "trading-core",
    "phase": "Phase-3-OrderBook",
    "type": "critical-business-process"
  }
}' "Creating Trading Engine service point"

# 2. Mathematical Intuition Engine Service Point  
api_call "POST" "/services" '{
  "serviceName": "mathematical-intuition-engine",
  "description": "AI-powered Mathematical Intuition Engine for trade analysis",
  "version": "3.1.0", 
  "environment": "production",
  "tags": {
    "component": "ai-analysis",
    "type": "machine-learning",
    "criticality": "high"
  }
}' "Creating Mathematical Intuition Engine service point"

# 3. Position Management Service Point
api_call "POST" "/services" '{
  "serviceName": "position-management-service",
  "description": "Complete position lifecycle management with exit strategies",
  "version": "2.5.0",
  "environment": "production", 
  "tags": {
    "component": "risk-management",
    "type": "financial-control",
    "criticality": "critical"
  }
}' "Creating Position Management service point"

# 4. Multi-Source Sentiment Engine Service Point
api_call "POST" "/services" '{
  "serviceName": "multi-source-sentiment-engine", 
  "description": "12+ source sentiment analysis with 98% confidence",
  "version": "3.0.0",
  "environment": "production",
  "tags": {
    "component": "market-intelligence", 
    "sources": "12+",
    "type": "data-aggregation"
  }
}' "Creating Multi-Source Sentiment Engine service point"

# 5. Database Services
api_call "POST" "/services" '{
  "serviceName": "signalcartel-postgresql",
  "description": "Primary PostgreSQL database for trading data",
  "version": "15.0",
  "environment": "production",
  "tags": {
    "component": "data-storage",
    "type": "database",
    "criticality": "critical"
  }
}' "Creating PostgreSQL Database service point"

api_call "POST" "/services" '{
  "serviceName": "signalcartel-analytics-db", 
  "description": "Cross-site analytics database for AI insights",
  "version": "15.0",
  "environment": "production",
  "tags": {
    "component": "data-analytics",
    "type": "database",
    "purpose": "multi-instance-ai"
  }
}' "Creating Analytics Database service point"

echo -e "${BLUE}📊 STEP 2: Creating Business Metrics Dashboard${NC}"

# Create a comprehensive business dashboard
dashboard_json='{
  "title": "QUANTUM FORGE™ Trading Business Metrics",
  "description": "Real-time business performance monitoring for SignalCartel trading system",
  "tags": ["trading", "business", "quantum-forge"],
  "layout": {
    "type": "grid",
    "panels": [
      {
        "title": "Trading Volume (Trades/Hour)",
        "type": "stat",
        "targets": [
          {
            "queryType": "metrics",
            "query": "rate(quantum_forge_trades_total[1h]) * 3600",
            "legend": "Current Rate"
          }
        ]
      },
      {
        "title": "Win Rate %",
        "type": "stat", 
        "targets": [
          {
            "queryType": "metrics",
            "query": "(quantum_forge_winning_trades / quantum_forge_total_trades) * 100",
            "legend": "Win Rate"
          }
        ]
      },
      {
        "title": "Real-time P&L",
        "type": "stat",
        "targets": [
          {
            "queryType": "metrics", 
            "query": "quantum_forge_portfolio_value",
            "legend": "Portfolio Value"
          }
        ]
      },
      {
        "title": "Active Positions",
        "type": "stat",
        "targets": [
          {
            "queryType": "metrics",
            "query": "quantum_forge_open_positions",
            "legend": "Open Positions"
          }
        ]
      },
      {
        "title": "AI Confidence Levels",
        "type": "graph",
        "targets": [
          {
            "queryType": "metrics",
            "query": "avg(quantum_forge_ai_confidence)",
            "legend": "Average AI Confidence"
          }
        ]
      },
      {
        "title": "Database Performance",
        "type": "graph", 
        "targets": [
          {
            "queryType": "metrics",
            "query": "histogram_quantile(0.99, database_query_duration_seconds)",
            "legend": "P99 Query Time"
          }
        ]
      }
    ]
  }
}'

api_call "POST" "/dashboards" "$dashboard_json" "Creating business metrics dashboard"

echo -e "${BLUE}🚨 STEP 3: Setting Up Business-Critical Alerts${NC}"

# Critical business alerts
api_call "POST" "/rules" '{
  "alert": "TradingVolumeDropCritical",
  "expr": "rate(quantum_forge_trades_total[5m]) * 60 < 50",
  "for": "2m",
  "labels": {
    "severity": "critical",
    "component": "trading-engine"
  },
  "annotations": {
    "summary": "Trading volume dropped below 50 trades/hour",
    "description": "QUANTUM FORGE trading engine may have stalled - immediate attention required"
  }
}' "Creating critical trading volume alert"

api_call "POST" "/rules" '{
  "alert": "PositionManagementFailure", 
  "expr": "increase(position_management_errors_total[5m]) > 0",
  "for": "1m",
  "labels": {
    "severity": "critical",
    "component": "position-management"
  },
  "annotations": {
    "summary": "Position management system errors detected",
    "description": "Critical: Position management failures could result in stuck positions and losses"
  }
}' "Creating position management failure alert"

api_call "POST" "/rules" '{
  "alert": "DatabaseLatencyHigh",
  "expr": "histogram_quantile(0.95, database_query_duration_seconds) > 0.5",
  "for": "3m", 
  "labels": {
    "severity": "warning",
    "component": "database"
  },
  "annotations": {
    "summary": "Database query latency high",
    "description": "P95 database latency above 500ms - may impact trading performance"
  }
}' "Creating database latency alert"

api_call "POST" "/rules" '{
  "alert": "WinRateBelowTarget",
  "expr": "(quantum_forge_winning_trades / quantum_forge_total_trades) * 100 < 45",
  "for": "10m",
  "labels": {
    "severity": "warning", 
    "component": "trading-performance"
  },
  "annotations": {
    "summary": "Win rate dropped below 45%",
    "description": "Trading performance degraded - review strategy parameters"
  }
}' "Creating win rate degradation alert"

echo -e "${GREEN}✅ QUANTUM FORGE™ monitoring setup complete!${NC}"
echo ""
echo -e "${BLUE}📊 Access your trading dashboard at:${NC}"
echo "http://localhost:8080/dashboard"
echo ""
echo -e "${BLUE}🎯 Service monitoring includes:${NC}"
echo "• Trading Engine (business-critical)"
echo "• Mathematical Intuition Engine (AI performance)"  
echo "• Position Management (risk control)"
echo "• Multi-Source Sentiment (market intelligence)"
echo "• Database Performance (infrastructure)"
echo ""
echo -e "${BLUE}🚨 Business alerts configured for:${NC}"
echo "• Trading volume drops (critical business impact)"
echo "• Position management failures (financial risk)"
echo "• Database performance issues (system reliability)"
echo "• Win rate degradation (trading performance)"