# SignalCartel Trading Platform - Claude Context

## Project Overview
SignalCartel is a cryptocurrency trading platform that executes automated trading strategies using Pine Script parameters stored in a database, with paper trading through Alpaca Markets API.

## Current State (As of Last Session)
- ✅ All Docker containers building successfully (~1m20s each on dev server)
- ✅ Alpaca Paper Trading connected and verified working
- ✅ 4 active strategies in database (RSI, Quantum Oscillator, Neural, Bollinger)
- ✅ Trade execution verified - test trade executed successfully
- ✅ Complete verification system documented and tested

## Architecture

### Core Components
1. **Database (SQLite/Prisma)** - Stores strategies and parameters
2. **Strategy Execution Engine** - Processes signals and executes trades
3. **Market Data Service** - Real-time data from Kraken
4. **Alpaca Paper Trading** - Executes paper trades for crypto
5. **Web Interface** - Next.js dashboard at port 3001

### Key Files
- `load-database-strategies.ts` - Main entry point for running strategies
- `src/lib/strategy-execution-engine.ts` - Core trading logic
- `src/lib/alpaca-paper-trading-service.ts` - Alpaca integration
- `prisma/schema.prisma` - Database schema

## Recent Work Completed

### Container Fixes
- Fixed monitoring container permission issues (logging paths)
- Fixed website container import/export mismatches
- Fixed market-data container env file copying
- All containers now build successfully

### Verification System
Created comprehensive verification tools:
- `verify-strategy-signals.ts` - Proves Pine Script parameters are used
- `trace-signal-flow.ts` - Traces complete pipeline flow
- `force-test-trade.ts` - Tests trade execution (0.0001 BTC)
- `test-trading-pipeline.ts` - Tests with relaxed thresholds

### Documentation
- `SETUP.md` - Complete setup guide for new environments
- `VERIFICATION.md` - How to verify system is working
- `docs/TESTING-TOOLS.md` - All testing scripts reference

## Current Issues & Notes

### Working
- Database strategy loading ✅
- Pine Script parameter usage ✅
- Signal generation based on parameters ✅
- Alpaca paper trading execution ✅
- Docker containerization ✅

### Important Details
- Crypto orders require `time_in_force: 'gtc'` not 'day'
- GTX 1080 GPU supports CUDA 11.8 max (not 12+)
- Strategies wait for specific market conditions (RSI < 30 or > 70)
- Paper trading account has ~$1M in paper money

## Environment Variables Required
```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secret"

# Alpaca Paper Trading (REQUIRED)
ALPACA_PAPER_API_KEY="your-key"
ALPACA_PAPER_API_SECRET="your-secret"
```

## Quick Commands

### Check System Health
```bash
npx tsx -r dotenv/config quick-system-check.ts
```

### Test Trade Execution
```bash
npx tsx -r dotenv/config force-test-trade.ts
```

### Verify Strategies Use Parameters
```bash
npx tsx -r dotenv/config verify-strategy-signals.ts
```

### Start Trading System
```bash
npx tsx -r dotenv/config load-database-strategies.ts
```

### Build Docker Containers
```bash
docker compose -f containers/website/docker-compose.yml build --no-cache website
```

## Development Workflow
1. Dev server for heavy lifting (building, testing)
2. Git push changes
3. Production server pulls and deploys
4. All containers use same codebase

## Strategy Logic Flow
```
Database (PineStrategy) 
→ Parameters (StrategyParameter)
→ load-database-strategies.ts
→ StrategyExecutionEngine
→ Strategy Implementation (RSI/Bollinger/etc)
→ Market Data Analysis
→ Signal Generation
→ Alpaca Paper Trading API
→ Trade Executed
```

## Testing Approach
- Use `force-test-trade.ts` to verify Alpaca works
- Use `test-trading-pipeline.ts` with relaxed thresholds for quicker signals
- Normal strategies need specific conditions (RSI < 30 or > 70)
- All tests use small amounts (0.0001 BTC = ~$10-15)

## What We Proved Works
1. Strategies load from database with their parameters ✅
2. Pine Script parameters control trading decisions ✅
3. Signals are generated based on those parameters ✅
4. Trades execute through Alpaca when signals trigger ✅
5. Complete pipeline from database → trade is verified ✅

## Next Time Reminders
- Always use `-r dotenv/config` when running TypeScript files
- Check `.env.local` for credentials (not just .env)
- Rebuild Docker containers after code changes
- Strategies may take time to trigger (market conditions)
- Use verification scripts to prove system is working

## Project Structure
```
/
├── src/
│   ├── lib/                 # Core libraries
│   ├── app/                 # Next.js pages
│   └── components/          # React components
├── containers/              # Docker containers
│   ├── website/
│   ├── trading-engine/
│   ├── market-data/
│   └── monitoring/
├── scripts/
│   └── engines/            # Background processes
├── prisma/
│   └── schema.prisma      # Database schema
└── [verification scripts]  # Testing tools
```

## Contact & Repository
- GitHub: https://github.com/ninjahangover/signalcartel
- Main branch is production
- All changes should be tested on dev server first