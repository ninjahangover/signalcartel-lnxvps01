# Testing Guide - Signal Cartel Trading System

This guide lists all available tests and verification scripts to ensure your trading system is working properly.

## Paper Trading System Tests

### 1. Complete Paper Trading Verification
**File:** `verify-paper-trading-system.ts`
**Command:** `npx tsx verify-paper-trading-system.ts`
**Purpose:** Comprehensive end-to-end verification of the entire paper trading system
**Tests:**
- ✅ API connections (Alpaca Paper Trading)
- ✅ Real-time market data feeds
- ✅ Strategy system initialization
- ✅ Trading execution engine
- ✅ Signal generation and monitoring
- ✅ Risk management compliance
- ✅ Performance tracking accuracy
- ✅ Stop loss implementation

**When to Run:** Before enabling live trading, after system changes, or when troubleshooting

---

### 2. Unified Strategy System Test  
**File:** `test-unified-strategies.ts`
**Command:** `npx tsx test-unified-strategies.ts`
**Purpose:** Test strategy consistency, activation/deactivation, and end-to-end functionality
**Tests:**
- ✅ Strategy registry and naming consistency
- ✅ Enable/disable functionality for all strategies
- ✅ Market data flow to strategies
- ✅ Alpaca connection and account status
- ✅ Performance tracking for each strategy
- ✅ Signal generation monitoring

**When to Run:** After strategy changes, when adding new strategies, or verifying strategy behavior

---

## Live Trading Transition Tests

### 3. Live Trading Safety Checks
**File:** `transition-to-live-trading.ts`
**Command:** `npx tsx transition-to-live-trading.ts`
**Purpose:** Safe transition from paper trading to live trading with comprehensive safety checks
**Tests:**
- ✅ Paper trading performance validation
- ✅ Strategy profitability requirements (60%+ win rate, 10+ trades)
- ✅ Critical safety system checks
- ✅ Risk parameter configuration
- ✅ Monitoring system setup
- ✅ Emergency stop procedures

**When to Run:** When ready to transition from paper to live trading (run BEFORE enabling real money)

---

## Quick Reference Commands

```bash
# Complete paper trading system verification
npx tsx verify-paper-trading-system.ts

# Test all strategies and their functionality  
npx tsx test-unified-strategies.ts

# Prepare for live trading transition (safety checks)
npx tsx transition-to-live-trading.ts
```

---

## Test Results Interpretation

### ✅ PASS
- System is working correctly
- Safe to proceed

### ⚠️ WARNING  
- System is functional but has non-critical issues
- Monitor closely, consider addressing before live trading

### ❌ FAIL
- Critical issue that must be fixed
- DO NOT proceed to live trading until resolved

### 🚨 CRITICAL FAIL
- Severe issue that prevents system operation
- Fix immediately before continuing

---

## Recommended Testing Sequence

### Before First Use:
1. Run `verify-paper-trading-system.ts` - Ensure all systems are operational
2. Run `test-unified-strategies.ts` - Verify all strategies work end-to-end
3. Let paper trading run for 24-48 hours
4. Monitor performance and AI optimization

### Before Live Trading:
1. Run `verify-paper-trading-system.ts` - Confirm paper trading is stable
2. Run `test-unified-strategies.ts` - Ensure strategies are profitable
3. Run `transition-to-live-trading.ts` - Complete safety verification
4. Only proceed if ALL critical tests pass

### Regular Maintenance:
- Run `verify-paper-trading-system.ts` weekly
- Run `test-unified-strategies.ts` after any strategy changes
- Run `transition-to-live-trading.ts` before increasing live trading limits

---

## System Architecture Overview

### Paper Trading Flow:
```
Market Data → Strategy Analysis → Signal Generation → Alpaca Paper API → Performance Tracking
```

### Live Trading Flow:
```
Market Data → Strategy Analysis → AI Confidence Check → Webhook → Kraken API → Real Money Trades
```

---

## Recent Updates ✅

### Tab Confusion Resolution (Fixed)
- **Paper Trading** tab now clearly shows Alpaca simulated trading only
- **Live Trading** tab now clearly shows Kraken real money trading only  
- **Trading Charts** tab separated for market analysis
- Clear warnings and explanations added to prevent confusion
- Unified strategy system now properly handles both paper and live modes

---

## Troubleshooting

### Common Issues:

**No market data received:**
- Check internet connection
- Verify API keys are configured
- Ensure market is open (crypto trades 24/7)

**Strategies not generating signals:**
- Markets may be stable (normal)
- Check strategy parameters
- Verify market data is flowing

**Paper trades not executing:**
- Check Alpaca paper trading API keys
- Verify account has sufficient paper balance
- Check for API rate limits

**Failed safety checks:**
- Address all critical failures before proceeding
- Verify Kraken API credentials
- Check risk management settings

---

## Support

If tests fail or you encounter issues:

1. Check error messages carefully
2. Verify all API keys are configured
3. Ensure sufficient account balances
4. Run tests in sequence (paper → strategies → live transition)
5. Contact support if critical systems fail

---

**⚠️ IMPORTANT:** Never enable live trading without passing ALL critical safety checks!