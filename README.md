# Signal Cartel Trading Platform

A real-time cryptocurrency trading platform built with Next.js, featuring live market data and trading capabilities via Kraken API.

## 🔥 Real Data Mode Enabled

This platform is configured to use **REAL LIVE DATA ONLY** from Kraken API. No mock or demo data is used.

## Prerequisites

1. **Kraken Account**: You need a Kraken account and API credentials
2. **API Credentials**: Generate API keys at https://www.kraken.com/u/security/api

## Setup

### 1. Environment Configuration

Copy the example environment file and configure your API credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Kraken API credentials:
```env
KRAKEN_API_KEY=your_actual_kraken_api_key
KRAKEN_API_SECRET=your_actual_kraken_api_secret
NODE_ENV=development
```

### 2. Install Dependencies

```bash
bun install
# or npm install
```

### 3. Run Development Server

```bash
bun dev
# or npm run dev
# or yarn dev
```

The development server runs on [http://localhost:3001](http://localhost:3001)

## ⚠️ Important Notes

### Real Data Only
- **No Mock Data**: All market prices and account data come from real Kraken API calls
- **API Credentials Required**: The platform won't work without valid Kraken API credentials
- **Rate Limiting**: API calls are rate-limited to comply with Kraken's requirements (200ms between calls)

### Features
- ✅ **Real-time Market Data**: Live cryptocurrency prices via Kraken API
- ✅ **Account Integration**: Real account balances, orders, and trading history
- ✅ **Trading Interface**: Place real orders (use with caution!)
- ✅ **Portfolio Tracking**: Real-time portfolio valuation
- ✅ **Trading Dashboard**: Live trading performance metrics

### Security
- 🔒 **API Keys**: Store API credentials in `.env.local` (never commit to git)
- 🔒 **Permissions**: Use limited API permissions for safety
- 🔒 **Rate Limiting**: Built-in request queuing to prevent API limits

### Troubleshooting

**No data showing?**
- Check your API credentials in `.env.local`
- Verify Kraken API key has proper permissions
- Check browser console for API errors

**API errors?**
- Ensure API key permissions include "Query Funds", "Query Orders", etc.
- Check if you've exceeded rate limits
- Verify API secret is base64 encoded properly

## Production Deployment

For production deployment, ensure:
1. Set production API credentials
2. Configure `NODE_ENV=production`
3. Use secure credential storage (not `.env` files)

## 🔍 System Verification

To verify the trading system is working correctly:
- **Quick Setup**: See [SETUP.md](SETUP.md) for installation guide
- **Verification Guide**: See [VERIFICATION.md](VERIFICATION.md) for testing the complete pipeline
- **Health Checks**: Run `npx tsx quick-system-check.ts`
- **Trade Testing**: Run `npx tsx force-test-trade.ts`

## 🛡️ Professional PostgreSQL Backup System

The QUANTUM FORGE™ platform includes enterprise-grade backup protection for all trading data using proper PostgreSQL tools.

### 🎯 What Gets Backed Up
- **21,830+ Historical Market Data Points** - Essential for backtesting and analysis
- **Trading Signals & AI Data** - All multi-layer AI analysis and sentiment data
- **Position Management** - Complete trade lifecycle with P&L tracking
- **User Accounts & Configuration** - Phase settings and strategy parameters

### 🚀 Quick Backup Commands
```bash
# Manual backup using professional PostgreSQL tools
./scripts/backup/postgresql-professional-backup.sh

# Setup automated backup scheduling (hourly/daily/weekly)
./scripts/backup/setup-automated-postgresql-backups.sh

# Check backup status
ls -la /home/telgkb9/signalcartel-enterprise-backups/

# Monitor backup logs
tail -f /tmp/signalcartel-backup*.log
```

### 🔄 Data Recovery
```bash
# Restore individual database (custom format)
docker exec signalcartel-warehouse pg_restore -U warehouse_user -d signalcartel --clean backup.dump

# Restore from SQL backup
gunzip -c backup.sql.gz | docker exec -i signalcartel-warehouse psql -U warehouse_user -d signalcartel

# Full cluster recovery
gunzip -c cluster_backup.sql.gz | docker exec -i signalcartel-warehouse psql -U warehouse_user -d postgres
```

### 📊 Backup Features
- ✅ **Proper PostgreSQL Tools** - Uses pg_dump, pg_dumpall, pg_basebackup
- ✅ **Multiple Formats** - Both custom (.dump) and SQL (.sql.gz) formats
- ✅ **Automated Scheduling** - Cron-based hourly/daily/weekly backups
- ✅ **30-Day Retention** - Automatic cleanup of old backups
- ✅ **Integrity Verification** - Automatic size and format checks
- ✅ **Recovery Instructions** - Auto-generated recovery scripts

### 📁 Backup Location
```
/home/telgkb9/signalcartel-enterprise-backups/
├── 2025-08-26/
│   ├── logical/           # Individual database backups
│   ├── cluster/           # Complete cluster backups
│   └── BACKUP_REPORT_*.txt # Recovery instructions
```

## Support

For issues with:
- **Setup Problems**: Check [SETUP.md](SETUP.md)
- **Verification Issues**: Check [VERIFICATION.md](VERIFICATION.md)
- **Backup System**: All backup commands documented above
- **Kraken API**: Check [Kraken API Documentation](https://docs.kraken.com/rest/)
- **Alpaca API**: Check [Alpaca Documentation](https://alpaca.markets/docs/)
- **Platform Issues**: Check console logs and network requests
