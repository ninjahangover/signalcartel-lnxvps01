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
