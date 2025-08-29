# 📊 SigNoz Dashboard Setup Guide for SignalCartel

## Quick Access
- **URL:** http://localhost:3301
- **Login:** gaylen@signalcartel.io
- **Password:** admin123

## 🎯 Essential Dashboards to Create

### 1. Trading Performance Dashboard
Navigate to: Dashboards → Create New → Name: "QUANTUM FORGE Trading"

**Add these panels:**

1. **Trades Per Hour** (Line Chart)
   - Query: `rate(trades_executed_total[1h])`
   - Group by: strategy
   - Title: "Trading Velocity"

2. **Win Rate** (Gauge)
   - Query: `avg(win_rate_percentage)`
   - Title: "Overall Win Rate %"
   - Thresholds: Red < 50%, Yellow 50-70%, Green > 70%

3. **Profit/Loss** (Bar Chart)
   - Query: `sum(profit_loss_usd) by (strategy)`
   - Title: "P&L by Strategy"

4. **Current Phase** (Single Stat)
   - Query: `current_trading_phase`
   - Title: "QUANTUM FORGE Phase"

### 2. AI Systems Dashboard
Navigate to: Dashboards → Create New → Name: "AI Performance"

**Add these panels:**

1. **AI Response Times** (Histogram)
   - Query: `histogram_quantile(0.95, ai_response_time_ms)`
   - Title: "AI System Latency (95th percentile)"

2. **Sentiment Score** (Time Series)
   - Query: `avg(ai_sentiment_score)`
   - Title: "Market Sentiment"

3. **AI Confidence Levels** (Gauge)
   - Query: `avg(ai_confidence_level) by (ai_system)`
   - Title: "AI Confidence by System"

### 3. Infrastructure Dashboard
Navigate to: Dashboards → Create New → Name: "System Health"

**Add these panels:**

1. **Database Latency** (Line Chart)
   - Query: `histogram_quantile(0.99, database_query_latency_ms)`
   - Title: "Database Performance"

2. **Memory Usage** (Area Chart)
   - Query: `system_memory_usage_percent`
   - Title: "Memory Usage %"

3. **CPU Usage** (Area Chart)
   - Query: `system_cpu_usage_percent`
   - Title: "CPU Usage %"

## 🚨 Critical Alerts to Configure

Navigate to: Alerts → Create Rule

### Alert 1: Low Trading Volume
```yaml
Name: "Low Trading Volume"
Query: rate(trades_executed_total[10m]) < 2
For: 10m
Severity: Critical
Description: "Trading volume dropped below 2 trades per 10 minutes"
```

### Alert 2: High Database Latency
```yaml
Name: "Database Slow"
Query: histogram_quantile(0.95, database_query_latency_ms) > 1000
For: 5m
Severity: High
Description: "Database queries taking > 1 second"
```

### Alert 3: AI System Degraded
```yaml
Name: "AI Performance Degraded"
Query: histogram_quantile(0.95, ai_response_time_ms) > 2000
For: 5m
Severity: High
Description: "AI systems responding slowly"
```

### Alert 4: Memory Pressure
```yaml
Name: "High Memory Usage"
Query: system_memory_usage_percent > 85
For: 15m
Severity: Medium
Description: "System memory usage above 85%"
```

### Alert 5: Win Rate Drop
```yaml
Name: "Win Rate Below Target"
Query: avg(win_rate_percentage) < 60
For: 30m
Severity: High
Description: "Win rate dropped below 60% target"
```

## 🔍 Service Map & Traces

1. Go to **Services** tab
2. Look for `signalcartel-trading` service
3. Click to see:
   - Request rate
   - Error rate
   - P99 latency
   - Dependencies

## 📈 Metrics Explorer

Navigate to: Metrics → Explorer

**Useful queries:**

1. **Total trades today:**
   ```
   sum(increase(trades_executed_total[24h]))
   ```

2. **Average position size:**
   ```
   avg(position_size_usd)
   ```

3. **AI systems comparison:**
   ```
   avg(ai_confidence_level) by (ai_system)
   ```

4. **Database query types:**
   ```
   sum(rate(database_query_latency_ms_count[5m])) by (query_type)
   ```

## 🎪 Go-Live Monitoring Checklist

- [ ] Trading Performance dashboard created
- [ ] AI Systems dashboard created  
- [ ] Infrastructure dashboard created
- [ ] All 5 critical alerts configured
- [ ] Alert notification channel set up
- [ ] Service dependencies mapped
- [ ] Baseline metrics recorded
- [ ] Test alert triggers work
- [ ] Dashboard bookmarked
- [ ] Team access configured

## 📝 Notes

- Dashboards auto-refresh every 30 seconds
- Data retention: 15 days by default
- Export dashboards as JSON for backup
- Use variables for dynamic filtering
- Pin important dashboards to homepage

---

**After setup, run the test to verify:**
```bash
npx tsx scripts/monitoring/test-signoz-integration.ts
```

Then check the dashboards to see your metrics flowing!