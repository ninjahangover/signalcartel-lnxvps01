# Alpaca Paper Trading Credentials Setup

Since you already have an Alpaca account, here's how to get your paper trading API credentials:

## Step 1: Get Your Alpaca Paper Trading API Keys

1. **Log into your Alpaca account:**
   - Go to [https://alpaca.markets/](https://alpaca.markets/)
   - Log in with your existing credentials: `telgkb9@riseup.net`

2. **Navigate to API Management:**
   - Go to your dashboard
   - Click on "Your API Keys" or "API" in the navigation
   - Look for "Paper Trading" section

3. **Generate Paper Trading Keys:**
   - Click "Generate New Key" in the Paper Trading section
   - **Important:** Make sure you're generating **Paper Trading** keys, not Live Trading keys
   - Copy both the API Key and Secret Key

## Step 2: Configure Environment Variables

1. **Create or update your `.env.local` file:**
   ```bash
   # Copy the example and edit
   cp .env.example .env.local
   ```

2. **Add your Alpaca paper trading credentials to `.env.local`:**
   ```bash
   # Alpaca Paper Trading API (for risk-free testing)
   ALPACA_PAPER_API_KEY="PKxxxxxxxxxxxxxxxxxx"
   ALPACA_PAPER_API_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   
   # Also add as public variables for client-side access
   NEXT_PUBLIC_ALPACA_PAPER_API_KEY="PKxxxxxxxxxxxxxxxxxx"
   NEXT_PUBLIC_ALPACA_PAPER_API_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```

## Step 3: Verify Setup

1. **Run the verification script:**
   ```bash
   node verify-paper-trading-setup.js
   ```

2. **Test the API connection:**
   ```bash
   curl http://localhost:3000/api/paper-trading/test
   ```

## Step 4: Start Using Paper Trading

1. **Add the dashboard to your app:**
   ```typescript
   import PaperTradingDashboard from '@/components/paper-trading-dashboard';
   
   // In your dashboard component
   <PaperTradingDashboard userId={user.id} />
   ```

2. **Initialize your paper trading account:**
   - Navigate to the paper trading dashboard
   - Click "Initialize Paper Trading"
   - Start trading with $100,000 virtual money!

## Security Notes

- ✅ **These are paper trading credentials** - no real money at risk
- ✅ **Keep credentials secure** - don't commit .env.local to git
- ✅ **Paper trading only** - these keys cannot access real money
- ✅ **Separate from live trading** - completely isolated from your Kraken account

## Troubleshooting

### "Invalid API credentials"
- Double-check you're using Paper Trading keys (not Live Trading)
- Ensure there are no extra spaces in the .env.local file
- API keys should start with "PK" for paper trading

### "API connection failed"
- Verify your internet connection
- Check if Alpaca's API is operational
- Ensure you're not hitting rate limits

### "Database error"
- Run: `npx prisma migrate dev`
- Check database file permissions

## Features You'll Get

✅ **Real Market Data** - Live prices from Alpaca
✅ **$100k Virtual Balance** - Fresh money for each account cycle
✅ **Automated Cycling** - Accounts reset automatically based on your settings
✅ **Performance Tracking** - Complete historical analysis
✅ **Risk-Free Testing** - No real money involved
✅ **Easy Migration** - Same API for live trading later

Once configured, you'll have a completely separate paper trading environment that cycles automatically, giving you fresh testing accounts whenever needed while preserving all historical performance data for analysis.