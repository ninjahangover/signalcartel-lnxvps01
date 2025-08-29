#!/bin/bash
# SigNoz API-Based Setup for SignalCartel
# Uses curl to interact with SigNoz API

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SIGNOZ_BASE_URL="http://localhost:3301"
API_BASE="${SIGNOZ_BASE_URL}/api/v1"

echo -e "${BLUE}🚀 SigNoz API-Based Setup for SignalCartel${NC}"
echo "============================================="
echo ""

# Function to make API calls
api_call() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local description="$4"
    
    echo -e "${YELLOW}📡 ${description}${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" "${API_BASE}${endpoint}")
    else
        response=$(curl -s -X "$method" -w "HTTPSTATUS:%{http_code}" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "${API_BASE}${endpoint}")
    fi
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "   ${GREEN}✅ Success (${http_code})${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "   ${RED}❌ Failed (${http_code})${NC}"
        echo "$body"
    fi
    
    echo ""
}

# Check SigNoz health
echo -e "${YELLOW}🔍 Checking SigNoz API health...${NC}"
api_call "GET" "/health" "" "Health check"

# Check version
api_call "GET" "/version" "" "Version check"

# Try to get services (might need auth)
api_call "GET" "/services" "" "Getting services list"

# Try to get dashboards (might need auth)  
api_call "GET" "/dashboards" "" "Getting dashboards list"

# Create configuration directory
CONFIG_DIR="scripts/monitoring/signoz-configs"
mkdir -p "$CONFIG_DIR"

# Generate dashboard configurations
echo -e "${BLUE}📊 Generating dashboard configurations...${NC}"

cat > "${CONFIG_DIR}/quantum-forge-dashboard.json" << 'EOF'
{
  "title": "QUANTUM FORGE™ Trading Performance",
  "description": "SignalCartel main trading dashboard",
  "tags": ["signalcartel", "trading", "quantum-forge"],
  "time": {
    "from": "now-1h",
    "to": "now"
  },
  "panels": [
    {
      "id": 1,
      "title": "Current Trading Phase",
      "type": "stat",
      "targets": [
        {
          "expr": "current_trading_phase",
          "legendFormat": "Phase"
        }
      ],
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 0,
        "y": 0
      }
    },
    {
      "id": 2,
      "title": "Trades Per Hour",
      "type": "graph",
      "targets": [
        {
          "expr": "rate(trades_executed_total[1h]) * 3600",
          "legendFormat": "{{strategy}}"
        }
      ],
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 12,
        "y": 0
      }
    },
    {
      "id": 3,
      "title": "Win Rate by Strategy",
      "type": "piechart",
      "targets": [
        {
          "expr": "avg(win_rate_percentage) by (strategy)",
          "legendFormat": "{{strategy}}"
        }
      ],
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 0,
        "y": 8
      }
    },
    {
      "id": 4,
      "title": "Cumulative P&L",
      "type": "stat",
      "targets": [
        {
          "expr": "sum(profit_loss_usd)",
          "legendFormat": "Total P&L USD"
        }
      ],
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 12,
        "y": 8
      }
    }
  ]
}
EOF

cat > "${CONFIG_DIR}/ai-systems-dashboard.json" << 'EOF'
{
  "title": "AI Systems Performance",
  "description": "SignalCartel AI monitoring dashboard",
  "tags": ["signalcartel", "ai", "intelligence"],
  "panels": [
    {
      "id": 1,
      "title": "AI Response Times (P95)",
      "type": "graph",
      "targets": [
        {
          "expr": "histogram_quantile(0.95, ai_response_time_ms) by (ai_system)",
          "legendFormat": "{{ai_system}}"
        }
      ]
    },
    {
      "id": 2,
      "title": "AI Confidence Levels",
      "type": "gauge",
      "targets": [
        {
          "expr": "avg(ai_confidence_level) by (ai_system)",
          "legendFormat": "{{ai_system}}"
        }
      ]
    },
    {
      "id": 3,
      "title": "Sentiment Score Timeline",
      "type": "graph",
      "targets": [
        {
          "expr": "ai_sentiment_score",
          "legendFormat": "Market Sentiment"
        }
      ]
    }
  ]
}
EOF

cat > "${CONFIG_DIR}/infrastructure-dashboard.json" << 'EOF'
{
  "title": "Infrastructure Health",
  "description": "SignalCartel infrastructure monitoring",
  "tags": ["signalcartel", "infrastructure", "health"],
  "panels": [
    {
      "id": 1,
      "title": "Database Latency (P99)",
      "type": "graph",
      "targets": [
        {
          "expr": "histogram_quantile(0.99, database_query_latency_ms) by (query_type)",
          "legendFormat": "{{query_type}}"
        }
      ]
    },
    {
      "id": 2,
      "title": "System Resources",
      "type": "graph",
      "targets": [
        {
          "expr": "system_memory_usage_percent",
          "legendFormat": "Memory %"
        },
        {
          "expr": "system_cpu_usage_percent",
          "legendFormat": "CPU %"
        }
      ]
    },
    {
      "id": 3,
      "title": "Active Strategies",
      "type": "stat",
      "targets": [
        {
          "expr": "active_strategies_count",
          "legendFormat": "Strategies"
        }
      ]
    }
  ]
}
EOF

echo -e "${GREEN}✅ Dashboard configurations created${NC}"

# Generate alert rules
echo -e "${BLUE}🚨 Generating alert configurations...${NC}"

cat > "${CONFIG_DIR}/alerts.json" << 'EOF'
[
  {
    "alert": "SignalCartel_Low_Trading_Volume",
    "expr": "rate(trades_executed_total[10m]) < 2",
    "for": "10m",
    "labels": {
      "severity": "critical",
      "service": "signalcartel-trading",
      "team": "quantum-forge"
    },
    "annotations": {
      "summary": "SignalCartel trading volume is critically low",
      "description": "Trading volume has dropped below 2 trades per 10 minutes. The QUANTUM FORGE system may be stalled.",
      "runbook_url": "https://docs.signalcartel.io/runbooks/low-trading-volume"
    }
  },
  {
    "alert": "SignalCartel_High_Database_Latency",
    "expr": "histogram_quantile(0.95, database_query_latency_ms) > 1000",
    "for": "5m",
    "labels": {
      "severity": "high",
      "service": "signalcartel-database",
      "team": "infrastructure"
    },
    "annotations": {
      "summary": "SignalCartel database performance degraded",
      "description": "Database queries are taking longer than 1 second at the 95th percentile."
    }
  },
  {
    "alert": "SignalCartel_AI_System_Slow",
    "expr": "histogram_quantile(0.95, ai_response_time_ms) > 2000",
    "for": "5m",
    "labels": {
      "severity": "high",
      "service": "signalcartel-ai",
      "team": "ai-systems"
    },
    "annotations": {
      "summary": "SignalCartel AI systems responding slowly",
      "description": "AI systems (sentiment, mathematical intuition, order book) are responding slower than expected."
    }
  },
  {
    "alert": "SignalCartel_Win_Rate_Below_Target",
    "expr": "avg(win_rate_percentage) < 60",
    "for": "30m",
    "labels": {
      "severity": "high",
      "service": "signalcartel-trading",
      "team": "trading"
    },
    "annotations": {
      "summary": "SignalCartel win rate below target",
      "description": "Trading win rate has dropped below 60% target for more than 30 minutes."
    }
  },
  {
    "alert": "SignalCartel_High_Memory_Usage",
    "expr": "system_memory_usage_percent > 85",
    "for": "15m",
    "labels": {
      "severity": "medium",
      "service": "signalcartel-system",
      "team": "infrastructure"
    },
    "annotations": {
      "summary": "SignalCartel system memory usage high",
      "description": "System memory usage has been above 85% for 15 minutes."
    }
  }
]
EOF

echo -e "${GREEN}✅ Alert configurations created${NC}"

# Generate service registration
cat > "${CONFIG_DIR}/services.json" << 'EOF'
[
  {
    "serviceName": "signalcartel-trading-engine",
    "description": "QUANTUM FORGE™ Main Trading Engine",
    "version": "1.0.0",
    "environment": "production",
    "endpoints": [
      {"name": "health", "path": "/api/health"},
      {"name": "metrics", "path": "/api/metrics"},
      {"name": "status", "path": "/api/quantum-forge/status"}
    ],
    "expectedMetrics": [
      "trades_executed_total",
      "win_rate_percentage",
      "profit_loss_usd",
      "current_trading_phase"
    ]
  },
  {
    "serviceName": "signalcartel-ai-systems",
    "description": "AI Performance Monitoring",
    "version": "1.0.0",
    "environment": "production",
    "endpoints": [
      {"name": "sentiment", "path": "/api/multi-source-sentiment"},
      {"name": "intuition", "path": "/api/intuition-analysis"},
      {"name": "orderbook", "path": "/api/order-book"}
    ],
    "expectedMetrics": [
      "ai_response_time_ms",
      "ai_confidence_level",
      "ai_sentiment_score"
    ]
  }
]
EOF

# Create import guide
cat > "${CONFIG_DIR}/IMPORT_GUIDE.md" << 'EOF'
# SigNoz Configuration Import Guide

## 🚀 Quick Setup

1. **Access SigNoz Dashboard:**
   ```
   http://localhost:3301
   Login: gaylen@signalcartel.io / admin123
   ```

2. **Import Dashboards:**
   - Go to Dashboards → Import
   - Upload each .json file from this directory:
     - `quantum-forge-dashboard.json` - Main trading dashboard
     - `ai-systems-dashboard.json` - AI performance monitoring
     - `infrastructure-dashboard.json` - System health monitoring

3. **Set Up Alerts:**
   - Go to Alerts → Rules → Create Rule
   - Copy configurations from `alerts.json`
   - Set up notification channels (email, Slack, etc.)

## 📊 Available Dashboards

### QUANTUM FORGE™ Trading Performance
- Current trading phase indicator
- Trades per hour by strategy
- Win rate breakdown
- Cumulative P&L tracking

### AI Systems Performance  
- AI response time monitoring
- Confidence level gauges
- Market sentiment timeline

### Infrastructure Health
- Database performance metrics
- System resource usage
- Active strategy monitoring

## 🚨 Alert Rules

All alerts are pre-configured for SignalCartel:
- **Critical**: Low trading volume
- **High**: Database latency, AI performance, win rate
- **Medium**: Memory usage

## 🔍 Useful Queries

Access these in Metrics Explorer:

```
# Trading velocity
rate(trades_executed_total[1h]) * 3600

# Win rate trend
avg_over_time(win_rate_percentage[24h])

# AI performance
histogram_quantile(0.95, ai_response_time_ms) by (ai_system)

# Database health
histogram_quantile(0.99, database_query_latency_ms)
```

## 🎯 Next Steps

1. Import all dashboards and alerts
2. Configure notification channels
3. Start SignalCartel with telemetry enabled
4. Monitor metrics flowing into the dashboards
5. Tune alert thresholds based on your system behavior
EOF

# Create health check script
cat > "${CONFIG_DIR}/health-check.sh" << 'EOF'
#!/bin/bash
# SignalCartel Service Health Check

SERVICES=(
  "signalcartel-trading-engine:http://localhost:3001/api/health"
  "signalcartel-webapp:http://localhost:3001/api/health" 
  "signalcartel-database:http://localhost:3001/api/quantum-forge/database-health"
)

echo "🏥 SignalCartel Service Health Check"
echo "===================================="

for service in "${SERVICES[@]}"; do
  name=$(echo $service | cut -d: -f1)
  url=$(echo $service | cut -d: -f2-)
  
  echo -n "Checking $name... "
  
  if curl -sf "$url" > /dev/null 2>&1; then
    echo "✅ Healthy"
  else
    echo "❌ Unhealthy"
  fi
done

echo ""
echo "📊 SigNoz Dashboard: http://localhost:3301"
echo "🔑 Login: gaylen@signalcartel.io / admin123"
EOF

chmod +x "${CONFIG_DIR}/health-check.sh"

echo -e "${GREEN}✅ Health check script created${NC}"

# Summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}           🎉 SIGNOZ API SETUP COMPLETE!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}📁 Configuration Directory: ${CONFIG_DIR}${NC}"
echo ""
echo -e "${YELLOW}📋 Files Created:${NC}"
echo "   • quantum-forge-dashboard.json - Main trading dashboard"
echo "   • ai-systems-dashboard.json - AI performance monitoring"  
echo "   • infrastructure-dashboard.json - System health dashboard"
echo "   • alerts.json - Alert rule configurations"
echo "   • services.json - Service definitions"
echo "   • IMPORT_GUIDE.md - Step-by-step import instructions"
echo "   • health-check.sh - Service health monitoring"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "1. Access SigNoz: http://localhost:3301"
echo "2. Login: gaylen@signalcartel.io / admin123"
echo "3. Follow: ${CONFIG_DIR}/IMPORT_GUIDE.md"
echo "4. Test health: ${CONFIG_DIR}/health-check.sh"
echo ""
echo -e "${GREEN}✨ Your SignalCartel monitoring is ready to import!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"