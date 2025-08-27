# 🚀 QUANTUM FORGE™ Phase 4 Live Trading Checklist

## Pre-Launch Requirements

### ✅ Phase 4 Achievement
- [ ] **2000+ completed trades** in paper trading
- [ ] All AI systems activated (Sentiment, Order Book, Markov, Mathematical Intuition, Multi-Layer)
- [ ] 70% confidence threshold active
- [ ] Multi-layer consensus validation enabled

### ✅ Performance Metrics (from Paper Trading)
- [ ] **Win Rate**: ≥ 45%
- [ ] **Profit Factor**: ≥ 1.2:1
- [ ] **Sharpe Ratio**: > 0.5
- [ ] **Maximum Drawdown**: < 20%
- [ ] Consistent profitability over last 30 days

## 🛡️ Data Protection Systems

### 1. Graceful Shutdown Protection
```bash
# Test on replica system first
cd /path/to/replica
npm install
npx tsx admin/test-data-protection.ts

# Expected output: ALL TESTS PASSED
```

- [ ] Graceful shutdown manager tested
- [ ] Transaction rollback verified
- [ ] Emergency data backup working
- [ ] Connection pooling active
- [ ] Retry logic functioning

### 2. Backup Systems
```bash
# Verify backups are running
ls -la /home/telgkb9/signalcartel-enterprise-backups/
tail -f /tmp/signalcartel-backup*.log
```

- [ ] PostgreSQL automated backups active
- [ ] Hourly backups running
- [ ] Daily backups running  
- [ ] Weekly backups running
- [ ] Backup integrity verified

## 🔌 Kraken Live API Integration

### 1. API Credentials
```bash
# Create .env.live-trading
cp .env.live-trading.example .env.live-trading
# Add your Kraken API credentials
```

- [ ] Kraken API Key configured
- [ ] Kraken API Secret configured
- [ ] API permissions: **Trade** enabled
- [ ] API permissions: **Query Funds** enabled
- [ ] API permissions: **Query Orders** enabled

### 2. Test Kraken Connection
```bash
# Run validation test
npx tsx admin/test-kraken-validation.ts
```

- [ ] Connection successful
- [ ] Balance query working
- [ ] Order placement test passed (small test order)
- [ ] Order cancellation working
- [ ] WebSocket streaming active

## 💰 Risk Management Settings

### Position Sizing
```javascript
// Recommended initial settings
const LIVE_TRADING_CONFIG = {
  maxPositionSize: 0.01,        // 1% per trade initially
  maxOpenPositions: 5,          // Maximum 5 concurrent positions
  totalRiskLimit: 0.05,         // 5% total portfolio risk
  dailyLossLimit: 0.02,         // 2% daily loss limit
  emergencyStopLoss: 0.10       // 10% emergency stop
};
```

- [ ] Position sizing configured (start with 1%)
- [ ] Maximum positions limit set
- [ ] Daily loss limit implemented
- [ ] Emergency stop loss active
- [ ] Trailing stop configuration ready

## 🚀 Go-Live Procedure

### Step 1: Final System Check
```bash
# Check current phase status
npx tsx -e "
  const phaseModule = await import('./src/lib/quantum-forge-phase-config.ts');
  const phase = await phaseModule.default.phaseManager.getCurrentPhase();
  console.log('Current Phase:', phase.phase, '-', phase.name);
  console.log('Ready for live:', phase.phase === 4 ? 'YES' : 'NO');
"
```

### Step 2: Switch to Protected Trading System
```bash
# Stop current paper trading
pkill -f "load-database-strategies"

# Start protected system with live trading flag
ENABLE_LIVE_TRADING=true ENABLE_GPU_STRATEGIES=true \
  npx tsx load-database-strategies-protected.ts
```

### Step 3: Enable Live Trading Manager
```bash
# In separate terminal
npx tsx admin/live-trading-manager.ts

# Monitor live trades
npx tsx admin/quantum-forge-live-monitor.ts
```

### Step 4: Initial Live Trading Configuration
```javascript
// admin/live-trading-config.json
{
  "mode": "CAUTIOUS",           // Start cautious
  "initialCapital": 1000,        // Start with $1000
  "strategies": [
    "gpu-rsi",                   // Start with proven strategies
    "gpu-bollinger"
  ],
  "symbols": ["BTCUSD"],        // Start with BTC only
  "webhooks": {
    "trades": "https://your-webhook-url",
    "alerts": "https://your-alert-webhook"
  }
}
```

## 📊 Live Monitoring

### Real-Time Dashboards
- [ ] Live trading dashboard active: http://localhost:3001/live-trading
- [ ] Position monitor running
- [ ] P&L tracking operational
- [ ] Risk metrics visible

### Alert Systems
```bash
# Configure alerts
export NTFY_TOPIC="signal-cartel-live"
export ALERT_EMAIL="your-email@example.com"
export ALERT_THRESHOLD_LOSS=50  # Alert on $50 loss
```

- [ ] NTFY notifications configured
- [ ] Email alerts set up
- [ ] Webhook notifications active
- [ ] Emergency contact configured

## 🚨 Emergency Procedures

### Quick Stop Commands
```bash
# EMERGENCY STOP - Stops all trading immediately
pkill -f "load-database-strategies-protected"

# Close all positions
npx tsx admin/emergency-close-all-positions.ts

# Disable live trading
echo "ENABLE_LIVE_TRADING=false" > .env.override
```

### Recovery Procedures
```bash
# Check emergency data
ls -la /tmp/signalcartel-emergency/

# Restore from emergency backup
npx tsx admin/restore-from-emergency.ts

# Verify system state
npx tsx admin/system-health-check.ts
```

## 📋 Day 1 Live Trading Plan

### Morning (Market Open)
1. [ ] Start with minimum position size (0.5-1%)
2. [ ] Monitor first 5 trades manually
3. [ ] Verify P&L calculations are accurate
4. [ ] Check risk limits are enforced

### Afternoon
1. [ ] Review morning performance
2. [ ] Adjust parameters if needed
3. [ ] Increase to normal position size if stable

### Evening
1. [ ] Full performance review
2. [ ] Check all logs for errors
3. [ ] Backup live trading data
4. [ ] Plan for Day 2

## 🎯 Success Criteria (First Week)

- [ ] No system crashes or data loss
- [ ] All trades executed as expected
- [ ] Risk limits never breached
- [ ] Positive or break-even P&L
- [ ] < 5% maximum drawdown
- [ ] All monitoring systems operational

## 📞 Support Contacts

- **System Issues**: Check logs at `/tmp/signalcartel-logs/`
- **Database Issues**: PostgreSQL logs at `/var/log/postgresql/`
- **Trading Issues**: Kraken support
- **Emergency**: Have manual trading access ready

## Final Checklist Before Go-Live

- [ ] All paper trading tests passed
- [ ] Data protection systems verified
- [ ] Backup systems operational
- [ ] Live API credentials configured
- [ ] Risk management configured
- [ ] Monitoring dashboards ready
- [ ] Emergency procedures documented
- [ ] Team briefed on procedures
- [ ] Initial capital transferred
- [ ] **READY FOR LIVE TRADING!** 🚀

---

*Remember: Start small, monitor closely, and scale gradually. The goal for Day 1 is stability, not profit.*