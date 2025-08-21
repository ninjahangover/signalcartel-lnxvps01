# Signal Cartel Trading System - Testing & Verification Suite

This README provides comprehensive documentation for all testing and verification scripts available in the Signal Cartel trading system.

## 📋 Table of Contents

- [Available Test Scripts](#available-test-scripts)
- [Quick Start Guide](#quick-start-guide)
- [Detailed Test Descriptions](#detailed-test-descriptions)
- [Running Tests](#running-tests)
- [Test Results & Interpretation](#test-results--interpretation)
- [Troubleshooting](#troubleshooting)
- [Adding New Tests](#adding-new-tests)

---

## 🚀 Available Test Scripts

| Script | Purpose | Critical | Run Time |
|--------|---------|----------|----------|
| [`verify-paper-trading-system.ts`](#1-paper-trading-verification) | Complete paper trading system verification | ✅ Yes | 2-3 min |
| [`test-unified-strategies.ts`](#2-strategy-system-testing) | Test all strategies and their functionality | ✅ Yes | 1-2 min |
| [`transition-to-live-trading.ts`](#3-live-trading-transition) | Safety checks before enabling live trading | ✅ Yes | 1-2 min |
| [`test-status-monitors.ts`](#4-status-monitor-verification) | Verify status monitors show real data | 🔧 Utility | 30 sec |

---

## ⚡ Quick Start Guide

### 🚀 Automated Server Management (Recommended)
```bash
# Start entire trading system
./start-server.sh

# Check system status  
./check-server-status.sh

# Stop all services
./stop-server.sh
```

### Prerequisites
```bash
# Ensure you have Node.js and tsx installed
npm install -g tsx

# Install dependencies if not already done
npm install
```

### Run All Critical Tests (Recommended)
```bash
# 1. Test market data collection (if having startup issues)
npx tsx test-market-data-collection.ts

# 2. Test Next.js server (if having web access issues) 
npx tsx test-nextjs-server.ts

# 3. Verify paper trading system is working
npx tsx verify-paper-trading-system.ts

# 4. Test all strategies
npx tsx test-unified-strategies.ts

# 5. Verify status monitors show real data
npx tsx test-status-monitors.ts

# 6. Only run when ready for live trading
npx tsx transition-to-live-trading.ts
```

---

## 📖 Detailed Test Descriptions

### 1. Paper Trading Verification
**File:** `verify-paper-trading-system.ts`
**Purpose:** Complete end-to-end verification of the paper trading system

#### What It Tests:
- ✅ **API Connections**: Alpaca Paper Trading API connectivity
- ✅ **Market Data**: Real-time price feeds from multiple sources
- ✅ **Strategy Registry**: All strategies loaded and available
- ✅ **Execution Engine**: Trading engine startup and operation
- ✅ **Signal Generation**: Strategy signal creation and monitoring
- ✅ **Risk Management**: Position sizing and stop loss compliance
- ✅ **Performance Tracking**: Real-time metrics and data accuracy

#### When to Run:
- Before first use of the system
- After system updates or changes
- When troubleshooting trading issues
- Before transitioning to live trading

#### Example Output:
```
🔍 SYSTEM READINESS VERIFICATION
==================================================

📡 API Connections:
✅ Alpaca Connection: Connected - $1,000,000 equity

📊 Market Data:
✅ BTCUSD Price Feed: Real-time price: $43,250
✅ ETHUSD Price Feed: Real-time price: $2,640

🎯 Strategy System:
✅ Strategy Registry: 4 strategies loaded
✅ Paper Trading Ready: 3 strategies ready for paper trading
```

---

### 2. Strategy System Testing
**File:** `test-unified-strategies.ts`
**Purpose:** Test unified strategy system functionality and consistency

#### What It Tests:
- ✅ **Strategy Registry**: All strategies properly loaded
- ✅ **Naming Consistency**: Same names across all pages
- ✅ **Enable/Disable**: Activation and deactivation functionality
- ✅ **Execution Integration**: Connection to trading engine
- ✅ **Market Data Flow**: Real-time data reaching strategies
- ✅ **Performance Tracking**: Real vs fake data indicators
- ✅ **AI Optimization**: Strategy optimization status

#### When to Run:
- After adding new strategies
- When strategy names or parameters change
- To verify all strategies work end-to-end
- During system maintenance

#### Example Output:
```
🎯 Testing Unified Strategy System

📋 STEP 1: Strategy Registry Check
────────────────────────────────────────────────────────────
Found 4 strategies in registry:
1. RSI Pullback Pro (rsi-pullback-pro)
   Type: RSI
   Symbol: BTCUSD
   Enabled: ❌
   Status: inactive
   Can Execute Paper: ✅
   Real Performance: ✅
```

---

### 4. Status Monitor Verification
**File:** `test-status-monitors.ts`
**Purpose:** Verify that all status monitors display real system data instead of simulated

#### What It Tests:
- ✅ **Stratus Engine Status**: Real persistent engine running state
- ✅ **Strategy Counts**: Actual loaded and enabled strategy counts
- ✅ **Market Data Status**: Real market data collection system status
- ✅ **AI Optimization**: Actual Pine Script input optimizer activity
- ✅ **Alert System**: Real alert generation engine and dynamic triggers
- ✅ **Performance Tracking**: Real vs placeholder data indicators

#### When to Run:
- After dashboard updates or changes
- When troubleshooting status display issues
- To verify real-time data connections
- During system maintenance

#### Example Output:
```
🔍 Testing Stratus Engine Status
──────────────────────────────────────────────────
✅ Engine Running Status: Engine is ACTIVE (real persistent engine state)
✅ Market Data Status: Market data ACTIVE, monitoring 5 symbols with 80.0% confidence
✅ Strategy Count: 4 strategies loaded from registry
ℹ️ AI Optimization: AI optimization is INACTIVE with 12 optimizations recorded
✅ Alert System: 8 system events/alerts tracked (real data from alert generation engine)
```

---

### 3. Live Trading Transition
**File:** `transition-to-live-trading.ts`
**Purpose:** Comprehensive safety verification before enabling live trading

#### What It Tests:
- ✅ **Paper Trading Results**: Performance validation (60%+ win rate, 20+ trades)
- ✅ **Safety Checks**: All critical safety systems
- ✅ **API Configuration**: Kraken API credentials
- ✅ **Risk Parameters**: Stop losses and position limits
- ✅ **Monitoring Systems**: Real-time monitoring and alerts
- ✅ **Emergency Procedures**: Emergency stop mechanisms

#### When to Run:
- **ONLY** when ready to transition from paper to live trading
- After achieving consistent profits in paper trading
- Before enabling real money trading
- When updating live trading parameters

#### Example Output:
```
🚀 LIVE TRADING TRANSITION PROCESS
======================================================================

📊 Verifying Paper Trading Results
==================================================

RSI Pullback Pro:
  Total Trades: 45
  Win Rate: 73.3%
  Total P&L: $2,847.50
  Status: ✅ READY FOR LIVE TRADING

✅ PAPER TRADING VERIFICATION PASSED
```

---

## 🏃‍♂️ Running Tests

### Individual Test Execution

```bash
# Paper trading verification
npx tsx verify-paper-trading-system.ts

# Strategy system testing
npx tsx test-unified-strategies.ts

# Live trading transition (only when ready)
npx tsx transition-to-live-trading.ts
```

### Test Flags & Options

All tests support these environment variables:
```bash
# Run with debug output
DEBUG=true npx tsx verify-paper-trading-system.ts

# Skip certain checks (not recommended)
SKIP_MARKET_DATA=true npx tsx test-unified-strategies.ts
```

### Automated Testing (Future)

```bash
# Run all tests in sequence (coming soon)
npm run test:all

# Run only critical tests
npm run test:critical

# Run tests with reporting
npm run test:report
```

---

## 📊 Test Results & Interpretation

### Status Indicators

| Symbol | Meaning | Action Required |
|--------|---------|-----------------|
| ✅ **PASS** | Test passed successfully | None - continue |
| ⚠️ **WARNING** | Non-critical issue detected | Monitor, fix when possible |
| ❌ **FAIL** | Test failed | Must fix before proceeding |
| 🚨 **CRITICAL FAIL** | Critical system failure | Stop immediately, fix required |

### Success Criteria

#### Paper Trading Verification
- All API connections working
- Market data flowing for all symbols
- At least 1 strategy ready for paper trading
- Execution engine starts successfully

#### Strategy System Testing  
- All strategies load correctly
- Enable/disable works for all strategies
- Market data reaches all strategies
- Performance tracking active

#### Live Trading Transition
- **CRITICAL**: Paper trading shows 60%+ win rate
- **CRITICAL**: Minimum 20 total trades completed
- **CRITICAL**: At least 1 profitable strategy
- **CRITICAL**: All safety checks pass

---

## 🔧 Troubleshooting

### Common Issues & Solutions

#### ❌ "Alpaca Connection Failed"
```bash
# Check environment variables
echo $ALPACA_API_KEY_PAPER
echo $ALPACA_SECRET_KEY_PAPER

# Verify API keys in .env file
grep ALPACA .env
```

#### ❌ "No Market Data Received"
- Check internet connection
- Verify market is open (crypto trades 24/7)
- Check for API rate limits
- Restart the test after 30 seconds

#### ❌ "Strategy Not Found"
```bash
# Regenerate strategy registry
npx tsx -e "
import { unifiedStrategySystem } from './src/lib/unified-strategy-system';
console.log(unifiedStrategySystem.getAllStrategies());
"
```

#### ❌ "Safety Checks Failed"
- Review each failed check individually
- Verify all API credentials are set
- Check risk management parameters
- Ensure emergency stop procedures are tested

### Test Logs & Debugging

```bash
# Enable verbose logging
export DEBUG=true
export LOG_LEVEL=debug

# Run test with full output
npx tsx verify-paper-trading-system.ts 2>&1 | tee test-results.log

# Check specific test section
grep -A 10 -B 5 "FAIL\|ERROR" test-results.log
```

---

## ➕ Adding New Tests

### Creating a New Test Script

1. **Create the test file:**
```typescript
#!/usr/bin/env tsx

/**
 * New Test Script
 * Description of what this test does
 */

import { unifiedStrategySystem } from './src/lib/unified-strategy-system';

class NewTestScript {
  async runTest(): Promise<boolean> {
    console.log('🧪 Running New Test');
    
    try {
      // Your test logic here
      console.log('✅ Test passed');
      return true;
    } catch (error) {
      console.log('❌ Test failed:', error.message);
      return false;
    }
  }
}

async function main() {
  const test = new NewTestScript();
  const result = await test.runTest();
  process.exit(result ? 0 : 1);
}

main().catch(console.error);
```

2. **Make it executable:**
```bash
chmod +x new-test-script.ts
```

3. **Add to this README:**
Update the [Available Test Scripts](#available-test-scripts) table and add detailed description.

4. **Test the new script:**
```bash
npx tsx new-test-script.ts
```

### Test Script Best Practices

- ✅ Use clear, descriptive console output
- ✅ Return proper exit codes (0 = success, 1 = failure)
- ✅ Include timing information
- ✅ Provide actionable error messages
- ✅ Test one specific area thoroughly
- ✅ Include both positive and negative test cases

### Integration with Existing System

```typescript
// Import existing test utilities
import { unifiedStrategySystem } from './src/lib/unified-strategy-system';
import { alpacaPaperTradingService } from './src/lib/alpaca-paper-trading-service';
import StrategyExecutionEngine from './src/lib/strategy-execution-engine';

// Follow existing patterns for consistency
interface TestResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string;
  critical: boolean;
}
```

---

## 📞 Support & Contact

If you encounter issues with tests:

1. **Check this README** for common solutions
2. **Review test logs** for specific error messages  
3. **Verify system requirements** are met
4. **Run tests in isolation** to identify specific failures
5. **Contact support** with detailed error logs and system information

---

## 📝 Test Development Roadmap

### Planned Additions:
- [ ] Integration tests for webhook system
- [ ] Performance benchmark tests
- [ ] Load testing for high-frequency trading
- [ ] Database consistency tests
- [ ] API rate limit tests
- [ ] Network connectivity tests
- [ ] Memory usage monitoring
- [ ] Automated test scheduling

### Test Automation Goals:
- [ ] Continuous integration pipeline
- [ ] Automated test reports
- [ ] Slack/email notifications for test failures
- [ ] Test result dashboard
- [ ] Historical test data tracking

---

## Recent Updates ✅

### Status Monitor Real Data Integration (Fixed)
All status monitors at the bottom of dashboard pages now show **real data** instead of simulated:

- **🟢 Stratus Engine Status**: Real engine running state from persistent engine manager
- **📊 Active Strategies**: Actual count of enabled strategies with execution capability checks  
- **🚨 System Alerts**: Connected to real alert generation engine and dynamic triggers API
- **🧠 AI Optimization**: Shows actual Pine Script input optimizer activity, not placeholder
- **📊 Market Data**: Connected to real market data collector with symbol monitoring
- **⏰ Live Updates**: Status updates every 5-10 seconds with real system metrics

### Status Bar Indicators:
- 🟢 Active / 🔴 Stopped - Real engine states
- 📊 Active strategies / ⏸️ No strategies - Visual activity indicators  
- 🚨 Alerts present / 🔕 No alerts - Real alert system status
- 🧠 AI Optimizing... - Only shows when optimization is actually running

---

## 🤖 Automated Server Management

**NEW**: Complete server automation - never forget which services to run!

### Quick Commands:
- **`./start-server.sh`** - Starts all trading system services automatically
- **`./check-server-status.sh`** - Quick health check of all services  
- **`./stop-server.sh`** - Gracefully stops all services

### What Gets Automated:
✅ Environment verification (Node.js, dependencies)  
✅ Database setup and migrations  
✅ Market data collection startup  
✅ AI optimization engine  
✅ Strategy execution engine  
✅ Alert generation system  
✅ Stratus engine coordination  
✅ Next.js web server  
✅ System verification tests  
✅ Graceful shutdown with cleanup  

**📖 Full Documentation**: See [`SERVER-AUTOMATION.md`](SERVER-AUTOMATION.md)

---

**⚠️ Important:** Always run paper trading verification before enabling live trading with real money!