# 📱 Telegram Bot Alert Summary

Your unified strategy system will send comprehensive alerts to your Telegram bot for all important events.

## 🎯 **Trading Alerts**

### **Paper Trading (Alpaca)**
- **PAPER_TRADE_EXECUTED**: Every paper trade execution
  - Strategy name, symbol, action, price, quantity
  - RSI value, confidence level
  - Platform: "Alpaca"

### **Live Trading (Kraken)**
- **LIVE_TRADE_SIGNAL**: Every live trade signal generated
  - Strategy name, symbol, action, price, quantity
  - Webhook URL confirmation
  - RSI value, confidence level
  - Platform: "Kraken via webhook"

## 📊 **Performance Alerts**

### **Individual Trade Results**
- **TRADE_WIN**: Every winning trade
  - Entry/exit prices, profit amount
  - Current win rate, total trades
  - Consecutive wins counter

- **TRADE_LOSS**: Every losing trade
  - Entry/exit prices, loss amount
  - Current win rate, total trades
  - Consecutive losses counter

### **Performance Milestones**
- **MILESTONE_REACHED**: Every 10 trades completed
  - Total trades, current win rate
  - Total P&L performance
  - Trading mode (Paper/Live)

### **Performance Warnings**
- **POOR_PERFORMANCE_ALERT**: After 3 consecutive losses
  - Number of consecutive losses
  - Current win rate
  - Action: "Queuing optimization"

### **Performance Celebrations**
- **WINNING_STREAK**: After 5+ consecutive wins
  - Number of consecutive wins
  - Current win rate, total P&L
  - Trading mode

## 🧠 **AI & Optimization Alerts**

### **Strategy Optimization**
- **STRATEGY_OPTIMIZED**: When AI optimizes parameters
  - Old vs new parameters
  - Expected improvement percentage
  - AI reasoning for changes
  - Confidence level

### **Market Analysis**
- **MARKET_CONDITION_CHANGE**: When market regime changes
  - Previous vs new market regime
  - Volatility percentage, volume level
  - Trend direction
  - "Auto-adjusting strategy parameters"

## ⚙️ **System Alerts**

### **Trading Mode Changes**
- **LIVE_TRADING_ENABLED**: When switching to live mode
  - Strategy name
  - Platform: "Kraken"
  - Risk warning

- **PAPER_TRADING_ENABLED**: When switching to paper mode
  - Strategy name
  - Platform: "Alpaca"
  - Safety confirmation

## 📋 **Alert Format Example**

```
🎯 RSI Pullback Pro (LIVE): BUY signal at $45,234
💰 Profit: +$127.50 | Win Rate: 68.2%
🔴 Platform: Kraken via webhook
📊 RSI: 28 | Confidence: 85%
⏰ 2025-01-17 14:23:45
```

## 🔧 **Alert Frequency**

- **High Frequency**: Trade executions, wins/losses
- **Medium Frequency**: Optimizations, milestones
- **Low Frequency**: Market regime changes, mode switches

## 🎚️ **Customization**

All alerts include:
- **Strategy name** for identification
- **Trading mode** (Paper/Live) with platform
- **Performance metrics** (win rate, P&L)
- **Technical data** (RSI, confidence)
- **Timestamps** for tracking

Your Telegram bot will keep you informed of every aspect of your automated trading system's performance!