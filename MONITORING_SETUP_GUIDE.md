# 🔭 **SignalCartel SigNoz Monitoring Setup Guide**

## 🎯 **Overview**
Complete step-by-step guide to enable full observability for your QUANTUM FORGE™ trading system using SigNoz.

---

## 📋 **STEP 1: Verify SigNoz Status**

```bash
# Check if SigNoz is running properly
./scripts/monitoring/check-signoz-status.sh
```

**What this does:**
- ✅ Checks all SigNoz containers are running
- ✅ Tests API endpoints (3301, 4317, 4318)
- ✅ Verifies OpenTelemetry dependencies
- ✅ Shows quick start commands

**Expected Output:** All systems ready - SigNoz monitoring active

---

## 📊 **STEP 2: Import Dashboards & Alerts**

### 2A. Access SigNoz Dashboard
- **URL:** https://monitor.pixelraidersystems.com (after DNS update)
- **OR:** http://localhost:3301 (local access)
- **Login:** gaylen@signalcartel.io / admin123

### 2B. Import Pre-Built Dashboards

```bash
# Review the import guide
cat scripts/monitoring/signoz-configs/IMPORT_GUIDE.md
```

**Import these dashboards in SigNoz UI:**
- `scripts/monitoring/signoz-configs/quantum-forge-dashboard.json` - Trading performance
- `scripts/monitoring/signoz-configs/ai-systems-dashboard.json` - AI monitoring
- `scripts/monitoring/signoz-configs/infrastructure-dashboard.json` - System health

### 2C. Set Up Alerts

```bash
# View alert configurations
cat scripts/monitoring/signoz-configs/alerts.json
```

**Copy these alert rules into SigNoz:**
- Low Trading Volume (Critical)
- High Database Latency (High)
- AI System Performance (High) 
- Win Rate Below Target (High)
- Memory Usage (Medium)

---

## 🚀 **STEP 3: Start SignalCartel with Monitoring**

### Option A: Use the Enhanced Startup Script (Recommended)

```bash
# This starts trading with full telemetry
./scripts/monitoring/start-with-signoz.sh
```

**What this does:**
- ✅ Checks SigNoz is running
- ✅ Sets OpenTelemetry environment variables
- ✅ Installs telemetry dependencies if needed
- ✅ Starts QUANTUM FORGE with full monitoring
- ✅ Logs to `/tmp/signalcartel-logs/`

### Option B: Manual Trading Start with Monitoring

```bash
# Set environment variables
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4317"
export SERVICE_NAME="signalcartel-trading-engine"
export COMPONENT_NAME="quantum-forge-main"
export ENABLE_GPU_STRATEGIES=true

# Start with monitoring
npx tsx -r dotenv/config load-database-strategies.ts
```

---

## 🧪 **STEP 4: Test the Integration**

### 4A. Basic Connectivity Test

```bash
# Test SigNoz connectivity without complex dependencies
npx tsx scripts/monitoring/test-basic-telemetry.ts
```

### 4B. Service Health Check

```bash
# Check all SignalCartel services
./scripts/monitoring/signoz-configs/health-check.sh
```

### 4C. Send Sample Metrics (Optional)

```bash
# Send test data to SigNoz to verify dashboards work
# (Only if you have OpenTelemetry packages installed)
npx tsx scripts/monitoring/test-signoz-integration.ts
```

---

## 📊 **STEP 5: Verify Everything Works**

### 5A. Check SigNoz Dashboard
1. Go to https://monitor.pixelraidersystems.com
2. Login with your credentials
3. Navigate to **Services** tab
4. Look for `signalcartel-trading` service
5. Check if traces and metrics are flowing

### 5B. View Live Metrics
In SigNoz **Metrics Explorer**, try these queries:
```
# Trading activity
rate(trades_executed_total[1h]) * 3600

# Database performance
histogram_quantile(0.99, database_query_latency_ms)

# AI response times
histogram_quantile(0.95, ai_response_time_ms)
```

### 5C. Test Alerts
- Alerts should appear in SigNoz **Alerts** section
- Set up notification channels (email, Slack, etc.)

---

## 🔧 **TROUBLESHOOTING**

### Issue: OpenTelemetry Dependencies Missing

```bash
# Install the required packages
npm install --save-dev @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/api
```

### Issue: SigNoz Not Accessible

```bash
# Check container status
docker ps | grep signoz

# Restart if needed
cd /home/telgkb9/signoz && docker-compose restart
```

### Issue: No Telemetry Data

```bash
# Check if OTEL endpoints are working
curl http://localhost:4317  # gRPC endpoint
curl http://localhost:4318  # HTTP endpoint

# Check environment variables
echo $OTEL_EXPORTER_OTLP_ENDPOINT
echo $SERVICE_NAME
```

### Issue: Trading Engine Won't Start

```bash
# Use the production trading script instead
DATABASE_URL="postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/signalcartel?schema=public" \
ENABLE_GPU_STRATEGIES=true \
npx tsx -r dotenv/config production-trading-with-positions.ts
```

---

## 📈 **MONITORING CAPABILITIES YOU'LL GET**

### 🎯 **Trading Metrics**
- Trades per hour by strategy
- Win rate trends and comparisons
- Real-time P&L tracking
- Current QUANTUM FORGE phase
- Position sizes and risk metrics

### 🧠 **AI Performance**
- Multi-source sentiment analysis response times
- Mathematical Intuition Engine accuracy
- Order Book Intelligence confidence levels
- AI system health and availability

### 🗄️ **Infrastructure Health**
- Database query performance (P95, P99)
- Connection pool status
- Memory and CPU usage
- Redis cache performance
- Replication lag monitoring

### 🚨 **Smart Alerting**
- Business-critical alerts (not just up/down)
- Trading volume anomalies
- Performance degradation detection
- Resource exhaustion warnings
- AI system failures

---

## 🎪 **QUICK START SUMMARY**

For the fastest setup:

```bash
# 1. Check status
./scripts/monitoring/check-signoz-status.sh

# 2. Start monitoring
./scripts/monitoring/start-with-signoz.sh

# 3. Import dashboards (manual step in SigNoz UI)
# Follow: scripts/monitoring/signoz-configs/IMPORT_GUIDE.md

# 4. Test connectivity  
./scripts/monitoring/signoz-configs/health-check.sh
```

**Access:** https://monitor.pixelraidersystems.com  
**Login:** gaylen@signalcartel.io / admin123

---

🎉 **Your SignalCartel trading system will now have enterprise-grade observability!**