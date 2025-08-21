# SignalCartel Trading System Verification Guide

## 🔍 Overview

This document explains how to verify that the SignalCartel trading system is correctly using database strategies, Pine Script parameters, and executing trades through the complete pipeline.

## 🎯 Verification Components

### 1. System Health Check
Quick overview of all system components.

```bash
npx tsx -r dotenv/config quick-system-check.ts
```

**What it verifies:**
- ✅ Database strategies loaded
- ✅ Alpaca API connection
- ✅ Key system files present
- ✅ Trading pipeline configuration

### 2. Trading Activity Monitor
Check current positions and recent trades.

```bash
npx tsx -r dotenv/config check-trading-activity.ts
```

**What it shows:**
- Current account balance and buying power
- Open positions
- Recent orders (last 10)
- Today's trading activity

### 3. Strategy Signal Verification
Proves strategies use their Pine Script parameters.

```bash
npx tsx -r dotenv/config verify-strategy-signals.ts
```

**What it verifies:**
- ✅ Database parameters are loaded correctly
- ✅ Pine Script logic is analyzed
- ✅ Signals are generated based on parameters
- ✅ Different market conditions produce expected signals
- ✅ Parameters control trading decisions

**Output includes:**
- Database parameters for each strategy
- Pine Script indicators and conditions
- Simulated signals for different market scenarios
- Exact trigger conditions from Pine Script
- Parameter usage verification

### 4. Signal Flow Tracer
Traces the complete flow from database to trade execution.

```bash
npx tsx -r dotenv/config trace-signal-flow.ts
```

**What it traces:**
1. **Database Loading** - Strategy and parameters from database
2. **Parameter Conversion** - Database values to strategy configuration
3. **Pine Script Logic** - Trading rules and conditions
4. **Strategy Implementation** - Creation with parameters
5. **Market Data Processing** - How data is analyzed
6. **Signal Generation** - What triggers buy/sell signals
7. **Parameter Verification** - Proof parameters are used
8. **Execution Path** - How signals become trades

## 🧪 Testing the Pipeline

### Test 1: Force a Test Trade
Immediately execute a small trade to verify Alpaca connection.

```bash
npx tsx -r dotenv/config force-test-trade.ts
```

**What happens:**
- Buys 0.0001 BTC (about $10-15)
- Verifies order placement
- Confirms execution
- Optionally closes position

### Test 2: Run with Relaxed Thresholds
Test strategies with easier trigger conditions.

```bash
npx tsx -r dotenv/config test-trading-pipeline.ts
```

**What it does:**
- Loads strategies with relaxed parameters
- RSI triggers at 45-55 instead of 30-70
- Monitors for 10 minutes
- Reports any trades executed

## 📊 Understanding the Signal Flow

```
Database Strategy
    ↓
Parameters (RSI period, thresholds, etc.)
    ↓
Pine Script Logic (crossovers, conditions)
    ↓
Strategy Implementation (TypeScript)
    ↓
Market Data Analysis
    ↓
Signal Generation (BUY/SELL/HOLD)
    ↓
Execution Engine
    ↓
Alpaca Paper Trading API
    ↓
Trade Executed
```

## ✅ Verification Checklist

Use this checklist to confirm your system is working:

- [ ] **Database Strategies**
  ```bash
  npx tsx -r dotenv/config quick-system-check.ts
  ```
  - Should show 4 active strategies

- [ ] **Alpaca Connection**
  ```bash
  npx tsx -r dotenv/config test-alpaca-connection.ts
  ```
  - Should connect and show account info

- [ ] **Trade Execution**
  ```bash
  npx tsx -r dotenv/config force-test-trade.ts
  ```
  - Should execute a small BTC trade

- [ ] **Strategy Parameters**
  ```bash
  npx tsx -r dotenv/config verify-strategy-signals.ts
  ```
  - Should show parameters control signals

- [ ] **Signal Flow**
  ```bash
  npx tsx -r dotenv/config trace-signal-flow.ts
  ```
  - Should trace complete pipeline

## 🔧 Troubleshooting

### No Trades Executing?

1. **Check market conditions** - Strategies wait for specific conditions
2. **Verify parameters** - Run `verify-strategy-signals.ts`
3. **Test with relaxed thresholds** - Run `test-trading-pipeline.ts`
4. **Force a test trade** - Run `force-test-trade.ts`

### Alpaca Connection Issues?

1. **Verify credentials** - Check `.env` or `.env.local`
2. **Test connection** - Run `test-alpaca-connection.ts`
3. **Check API keys** - Must be Paper Trading keys, not Live

### Strategies Not Loading?

1. **Check database** - Run `quick-system-check.ts`
2. **Verify active strategies** - Should have `isActive: true`
3. **Load strategies** - Run `load-database-strategies.ts`

## 📈 Monitoring Live Operation

To monitor the system in real-time:

```bash
# Start the strategy execution engine
npx tsx -r dotenv/config load-database-strategies.ts

# In another terminal, monitor activity
watch -n 10 'npx tsx -r dotenv/config check-trading-activity.ts'
```

## 🎯 Key Verification Points

The system is working correctly when:

1. **Strategies load from database** ✅
2. **Parameters control signal generation** ✅
3. **Pine Script logic is evaluated** ✅
4. **Market conditions trigger appropriate signals** ✅
5. **Signals execute trades through Alpaca** ✅

## 📝 Summary

The verification system proves:
- Database strategies are loaded with their parameters
- Pine Script logic controls trading decisions
- Parameters from the database directly affect signals
- The complete pipeline from database to trade execution works

Run any of the verification scripts to confirm your trading system is operating correctly with your configured strategies and parameters.