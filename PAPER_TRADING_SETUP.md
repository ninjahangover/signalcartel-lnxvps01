# Paper Trading Setup Guide

This guide explains how to set up the automated paper trading system using Alpaca's API, which is completely separate from your live Kraken trading.

## Overview

The paper trading system provides:
- ✅ **Automated account cycling** - Fresh accounts automatically or on-demand
- ✅ **Real market data** - Live prices via Alpaca's API
- ✅ **Historical performance tracking** - All data stored in database
- ✅ **Multi-user support** - Separate accounts per user
- ✅ **Zero risk** - No real money involved
- ✅ **Easy migration path** - Same API structure as live trading

## Architecture

```
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│   Paper Trading │    │    Alpaca Paper      │    │   Live Trading  │
│    Dashboard     │────│    Trading API       │    │   (Kraken)      │
│                 │    │                      │    │                 │
│ • Account Mgmt  │    │ • Real market data   │    │ • Real money    │
│ • Order placing │    │ • Paper positions    │    │ • Live positions│
│ • Performance   │    │ • $100k virtual $    │    │ • Real profits  │
└─────────────────┘    └──────────────────────┘    └─────────────────┘
         │                         │                         │
         └─────────────────────────┼─────────────────────────┘
                                   │
                        ┌──────────▼──────────┐
                        │    Database         │
                        │                     │
                        │ • Paper accounts    │
                        │ • Trading sessions  │
                        │ • Performance data  │
                        │ • Historical trades │
                        └─────────────────────┘
```

## Setup Instructions

### 1. Alpaca Account Setup

1. **Get your Alpaca Paper Trading API keys:**
   - Go to [Alpaca Dashboard](https://alpaca.markets/)
   - Log in to your existing account
   - Navigate to "Your API Keys" section
   - Copy your **Paper Trading** API Key and Secret (not live trading keys)

2. **Configure Environment Variables:**
   ```bash
   # Copy the example environment file
   cp .env.example .env.local
   
   # Edit .env.local and add your Alpaca paper trading credentials:
   ALPACA_PAPER_API_KEY="your-paper-api-key"
   ALPACA_PAPER_API_SECRET="your-paper-api-secret"
   NEXT_PUBLIC_ALPACA_PAPER_API_KEY="your-paper-api-key"
   NEXT_PUBLIC_ALPACA_PAPER_API_SECRET="your-paper-api-secret"
   ```

### 2. Database Setup

1. **Run Prisma migrations to add paper trading tables:**
   ```bash
   npx prisma migrate dev --name "add-paper-trading"
   npx prisma generate
   ```

2. **Verify database tables were created:**
   ```bash
   npx prisma studio
   ```
   Check for these new tables:
   - `PaperAccount`
   - `PaperTradingSession`
   - `PaperPosition`
   - `PaperOrder`
   - `PaperTrade`
   - `PaperPerformanceSnapshot`

### 3. Add Paper Trading to Navigation

1. **Update your main dashboard to include paper trading:**
   ```typescript
   // In your main dashboard component
   import PaperTradingDashboard from '../components/paper-trading-dashboard';
   
   // Add a new tab or route for paper trading
   <TabsContent value="paper-trading">
     <PaperTradingDashboard userId={user.id} />
   </TabsContent>
   ```

## Configuration Options

### Account Cycling Settings

```typescript
// Configure when accounts automatically reset
const cyclingConfig = {
  maxAccountAge: 168,        // 7 days in hours
  maxTrades: 1000,           // Reset after 1000 trades
  maxDrawdown: 50,           // Reset if 50% drawdown
  minWinRate: 20,            // Reset if win rate falls below 20%
  maxInactivityHours: 72,    // Reset if inactive for 3 days
  resetOnUserRequest: true,  // Allow manual resets
  preserveHistoryDays: 90    // Keep performance data for 90 days
};
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PAPER_TRADING_AUTO_CYCLE` | Enable automatic cycling | `true` |
| `PAPER_TRADING_MAX_ACCOUNT_AGE_HOURS` | Max account age before reset | `168` (7 days) |
| `PAPER_TRADING_MAX_TRADES` | Max trades before reset | `1000` |
| `PAPER_TRADING_MAX_DRAWDOWN_PERCENT` | Max drawdown before reset | `50` |
| `PAPER_TRADING_PRESERVE_HISTORY_DAYS` | How long to keep archived data | `90` |

## Usage

### Starting Paper Trading

1. **Navigate to Paper Trading Dashboard**
2. **Click "Initialize Paper Trading"**
3. **System will:**
   - Create Alpaca paper account connection
   - Set up $100,000 virtual balance
   - Start monitoring for cycling triggers
   - Begin real-time data feed

### Placing Orders

1. **Use the Trading Tab:**
   - Enter symbol (e.g., AAPL, TSLA, BTC)
   - Choose quantity and order type
   - Select buy/sell
   - Submit order

2. **Order Types Supported:**
   - Market orders (immediate execution)
   - Limit orders (specific price)
   - Stop orders (risk management)
   - Day/GTC time in force

### Monitoring Performance

1. **Real-time Metrics:**
   - Account balance
   - Daily P&L
   - Win rate
   - Open positions
   - Order status

2. **Historical Analysis:**
   - Performance snapshots
   - Trade history
   - Drawdown analysis
   - Sharpe ratio calculations

### Account Cycling

1. **Automatic Cycling Triggers:**
   - Time-based (daily/weekly resets)
   - Performance-based (max trades, drawdown)
   - Inactivity-based (no trading for X days)

2. **Manual Cycling:**
   - Click "Reset Account" in Settings
   - Closes all positions
   - Resets balance to $100,000
   - Archives performance data

## API Endpoints

The system includes several API endpoints for integration:

### Paper Trading Routes

```
GET  /api/paper-trading/positions     # Get current positions
POST /api/paper-trading/positions     # Close positions
GET  /api/paper-trading/performance   # Get performance metrics
POST /api/paper-trading/cycle         # Manually cycle account
```

## Troubleshooting

### Common Issues

1. **"Failed to initialize paper trading account"**
   - Check Alpaca API credentials in .env.local
   - Verify you're using paper trading keys (not live)
   - Ensure environment variables are properly loaded

2. **"No market data available"**
   - Check if markets are open (9:30 AM - 4:00 PM ET)
   - Verify symbol format (use AAPL not Apple)
   - Check Alpaca API status

3. **Orders not executing**
   - Verify sufficient buying power
   - Check order parameters (price, quantity)
   - Ensure markets are open for the symbol

### Debug Mode

Enable detailed logging:
```bash
ENABLE_API_LOGGING=true
ENABLE_PERFORMANCE_LOGGING=true
```

### Database Issues

Reset paper trading tables:
```bash
npx prisma db push --force-reset
npx prisma migrate deploy
```

## Security Notes

1. **API Keys:**
   - Only use paper trading API keys
   - Never commit .env files to git
   - Rotate keys periodically

2. **Data Isolation:**
   - Paper trading data is completely separate from live trading
   - No cross-contamination of live and paper accounts
   - Safe to reset/delete paper trading data

## Migration Path

When ready to move to live trading:

1. **Test strategies thoroughly in paper trading**
2. **Analyze performance metrics**
3. **Get live trading API keys**
4. **Update configuration to use live endpoints**
5. **Start with small positions**

The Alpaca API structure is identical between paper and live trading, making migration seamless.

## Support

For issues or questions:
1. Check logs in browser console
2. Verify environment variables
3. Test API connectivity
4. Review database schema

The paper trading system is designed to be completely independent and safe for testing strategies without any risk to your live trading accounts.