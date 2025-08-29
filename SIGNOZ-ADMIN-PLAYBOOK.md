# 🚀 QUANTUM FORGE™ SigNoz Admin Playbook
## Comprehensive Observability Platform for SignalCartel Trading

**Date Created:** August 28, 2025  
**Purpose:** Replace OpenStatus with enterprise-grade observability  
**Target:** Pre-Go-Live monitoring setup for high-velocity trading  

---

## 🎯 Executive Summary

**Why SigNoz > OpenStatus:**
- ❌ **OpenStatus:** Basic ping monitoring, unreliable, can't see cascading failures
- ✅ **SigNoz:** Full application performance monitoring, distributed tracing, business metrics
- 🎪 **Go-Live Ready:** Catch invisible problems before they kill trading performance

**What You Get:**
- **Real-time trading dashboards** showing trades/hour, win rates, AI performance
- **Database performance monitoring** for your VMS infrastructure
- **Smart alerts** for business-critical issues (not just "up/down")
- **Root cause analysis** when something breaks

---

## 📋 Quick Start Guide

### STEP 1: Deploy SigNoz (5 minutes)
```bash
cd /home/telgkb9/depot/signalcartel
sudo ./scripts/monitoring/deploy-signoz.sh
```

**What this does:**
- Downloads and installs SigNoz
- Sets up monitoring network
- Creates SignalCartel-specific configuration
- Installs at `http://localhost:3301`

### STEP 2: Install Monitoring Dependencies (2 minutes)
```bash
cd /home/telgkb9/depot/signalcartel
npm install --package-lock-only -f telemetry-package.json
```

### STEP 3: Start SignalCartel with Monitoring (1 minute)
```bash
# Instead of your usual startup command, use this:
./scripts/monitoring/start-with-signoz.sh
```

### STEP 4: Access Dashboard
- Open browser: `http://localhost:3301`
- Username: `admin@signoz.io`
- Password: `admin` (change this immediately)

---

## 🎪 Go-Live Monitoring Checklist

### Pre-Launch Verification
```bash
# 1. Check all SigNoz services are running
docker ps | grep signoz

# 2. Verify SignalCartel telemetry is working
curl http://localhost:3301/api/v1/version

# 3. Start trading with full monitoring
./scripts/monitoring/start-with-signoz.sh

# 4. Verify data is flowing (wait 2-3 minutes)
# Check SigNoz dashboard for incoming traces
```

### Critical Metrics to Watch Pre-Launch
- ✅ **Trading Volume:** 125+ trades/hour (Phase 3 target)
- ✅ **Database Latency:** <100ms average query time
- ✅ **AI Response Time:** <500ms for sentiment analysis
- ✅ **Memory Usage:** <80% on all services
- ✅ **Replica Lag:** <5 seconds replication delay

---

## 📊 Dashboard Configuration

### 1. Trading Performance Dashboard
**Access:** SigNoz → Dashboards → Create New → "SignalCartel Trading"

**Key Metrics:**
```
• Trades Per Hour: tradesPerHour counter
• Win Rate: winRatePercentage histogram  
• P&L Tracking: profitLoss gauge
• Phase Status: currentPhase info
• AI Confidence: aiConfidence histogram
```

### 2. Infrastructure Health Dashboard  
**Access:** SigNoz → Dashboards → Create New → "Infrastructure"

**Key Metrics:**
```
• Database Queries/sec: pg.queries.rate
• Redis Hit Rate: redis.hit_rate
• VMS Replication Lag: pg.replication.lag
• Container Health: docker.container.health
• Network Latency: network.latency
```

### 3. Business Intelligence Dashboard
**Access:** SigNoz → Dashboards → Create New → "Business KPIs"

**Key Metrics:**
```
• Revenue Per Hour: revenue.hourly
• Strategy Performance: strategy.win_rate by strategy_name
• Market Sentiment Score: sentiment.composite_score  
• Risk Exposure: position.total_exposure
• System Uptime: system.availability
```

---

## 🚨 Critical Alerts Configuration

### 1. Trading Volume Alert
```yaml
Alert Name: "Low Trading Volume"
Condition: tradesPerHour < 100 for 10 minutes
Severity: CRITICAL
Action: "Trading system may be stuck - check logs immediately"
```

### 2. Database Performance Alert
```yaml
Alert Name: "Database Slow Queries"
Condition: pg.query.duration > 1000ms for 5 minutes
Severity: HIGH  
Action: "Database performance degraded - check VMS infrastructure"
```

### 3. AI System Alert
```yaml
Alert Name: "AI Response Timeout"
Condition: ai.response_time > 2000ms for 5 minutes
Severity: HIGH
Action: "AI systems degraded - check sentiment sources"
```

### 4. Memory Pressure Alert
```yaml
Alert Name: "High Memory Usage"
Condition: memory.usage > 85% for 15 minutes
Severity: MEDIUM
Action: "System memory pressure - consider scaling"
```

### 5. Replica Lag Alert
```yaml
Alert Name: "Database Replica Lag"
Condition: pg.replication.lag > 30 seconds
Severity: HIGH
Action: "Replication falling behind - check VMS network"
```

---

## 🔧 Daily Operations

### Morning Routine (5 minutes)
1. **Check overnight performance:**
   ```bash
   # Quick system health check
   curl -s http://localhost:3301/api/v1/health
   ```

2. **Review key metrics:**
   - Total trades last 24h
   - Average win rate
   - System errors/alerts
   - Database performance

3. **Verify all services healthy:**
   ```bash
   docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(signoz|quantum-forge)"
   ```

### Weekly Review (15 minutes)
1. **Performance trends analysis**
2. **Alert fine-tuning** (reduce false positives)
3. **Dashboard optimization** based on usage patterns
4. **Backup monitoring data** (optional)

---

## 🛠️ Troubleshooting Guide

### Problem: "SigNoz dashboard won't load"
**Symptoms:** Browser shows connection error at localhost:3301
**Solution:**
```bash
# Check if services are running
docker ps | grep signoz-frontend

# Restart if needed  
cd /opt/signoz && sudo docker-compose restart frontend
```

### Problem: "No telemetry data showing"
**Symptoms:** Dashboard shows no traces or metrics
**Solution:**
```bash
# Verify SignalCartel is sending data
export OTEL_LOG_LEVEL=debug
./scripts/monitoring/start-with-signoz.sh

# Check for telemetry errors in logs
tail -f /tmp/signalcartel-logs/production-trading.log | grep -i "otel\|telemetry"
```

### Problem: "Too many alerts firing"
**Symptoms:** Alert fatigue from false positives
**Solution:**
- Increase alert thresholds by 20-30%
- Add longer time windows (5 min → 10 min)
- Use composite conditions (memory + CPU together)

### Problem: "Dashboard is slow"
**Symptoms:** SigNoz interface taking >5 seconds to load
**Solution:**
```bash
# Check ClickHouse database performance
docker exec -it signoz-clickhouse clickhouse-client --query "SELECT count() FROM signoz_traces.distributed_signoz_index_v2"

# Restart services if needed
cd /opt/signoz && sudo docker-compose restart
```

---

## 📈 Advanced Configuration

### Custom Business Metrics
Add these to your SignalCartel applications:

```javascript
// In your trading engine files
const { metrics } = require('./scripts/monitoring/signoz-integration.js');

// Track custom business metrics
metrics.tradesPerHour.add(1, { strategy: 'quantum-oscillator' });
metrics.winRate.record(0.73, { timeframe: '1h' });  
metrics.aiResponseTime.record(245, { system: 'sentiment' });
```

### Database Performance Tracking
```javascript
// Add to database query wrappers
const startTime = Date.now();
// ... your database query ...
const duration = Date.now() - startTime;
metrics.databaseLatency.record(duration, { 
  query_type: 'trading_signal_insert',
  database: 'primary' 
});
```

---

## 🎪 Pre-Go-Live Final Checklist

### Infrastructure Readiness
- [ ] SigNoz dashboard accessible and responsive
- [ ] All critical alerts configured and tested
- [ ] Trading performance dashboard showing live data
- [ ] Database monitoring active for VMS infrastructure
- [ ] AI system performance tracking operational

### Monitoring Validation  
- [ ] Generate test trades and verify they appear in SigNoz
- [ ] Simulate database slowness and confirm alerts fire
- [ ] Test AI system timeout scenarios
- [ ] Verify memory/CPU alerts work correctly
- [ ] Confirm replica lag monitoring functional

### Business Metrics
- [ ] Trades per hour tracking correctly
- [ ] Win rate calculations accurate
- [ ] P&L tracking operational  
- [ ] Strategy performance comparison working
- [ ] Phase transition monitoring active

### Emergency Procedures
- [ ] Know how to quickly disable trading via SigNoz alerts
- [ ] Emergency contact list updated
- [ ] Runbook for common failure scenarios
- [ ] Backup monitoring via VMS database logs
- [ ] Manual trading halt procedures documented

---

## 🚀 Go-Live Day Monitoring Protocol

### Hour 0-1: Launch Phase
- **Monitor every 5 minutes**
- Watch for: Initial trade generation, database connections, AI system startup
- Expected: 50-100 trades in first hour (system warming up)

### Hour 1-6: Stabilization Phase  
- **Monitor every 15 minutes**
- Watch for: Trading velocity reaching 125+/hour, win rate stabilizing
- Expected: Full Phase 3 performance, all systems green

### Hour 6-24: Production Phase
- **Monitor every 30-60 minutes**
- Watch for: Sustained performance, no memory leaks, database stability
- Expected: Consistent high-velocity trading, <5 alerts total

### Day 2-7: Optimization Phase
- **Daily morning/evening checks**
- Focus on: Performance trends, alert tuning, dashboard optimization
- Goal: Zero false alarms, proactive issue detection

---

## 📞 Emergency Contacts & Escalation

### Alert Severity Levels
- **🚨 CRITICAL:** Immediate action required (trading stopped)
- **🔥 HIGH:** Action within 15 minutes (performance degraded)  
- **⚠️ MEDIUM:** Action within 1 hour (potential issues)
- **📝 LOW:** Daily review (informational)

### Escalation Matrix
1. **First Alert:** Check SigNoz dashboard for root cause
2. **Multiple Alerts:** Review infrastructure health (VMS, databases)
3. **System Down:** Execute emergency stop procedures
4. **Data Loss Risk:** Activate backup/recovery procedures

---

## 🎯 Success Metrics

**Week 1 Goals:**
- [ ] 99.5%+ system uptime
- [ ] <5 false positive alerts total
- [ ] Mean time to resolution <10 minutes
- [ ] All business KPIs tracking accurately

**Month 1 Goals:**  
- [ ] 99.9%+ system uptime
- [ ] Predictive alerting preventing 90%+ of issues
- [ ] Complete visibility into all system components
- [ ] Automated response to 50%+ of common issues

**Go-Live Success Definition:**
✅ **High-velocity trading** (3000+ trades/day sustained)  
✅ **Proactive problem detection** (issues caught before impact)  
✅ **Complete system visibility** (no blind spots)  
✅ **Zero revenue-impacting outages** in first 30 days

---

*🎪 **You're about to go live with the most sophisticated cryptocurrency trading infrastructure ever built.** SigNoz gives you the observability to ensure it runs flawlessly. Get some sleep - your system will be watching itself! 🚀*

---

**Generated with QUANTUM FORGE™ Intelligence**  
**For SignalCartel Trading Platform - Enterprise Deployment**