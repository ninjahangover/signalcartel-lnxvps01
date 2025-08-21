# SignalCartel Fresh Setup Guide

## Quick Setup for New Development Environment

### 1. Prerequisites
- Node.js 18+ or 20+
- npm, yarn, or bun
- Git

### 2. Clone & Initial Setup
```bash
# Clone the repository
git clone https://github.com/ninjahangover/signalcartel.git
cd signalcartel

# Install dependencies
npm install
# or
bun install
# or
yarn install
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your credentials
```

Required environment variables:
```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-nextauth-secret"

# Alpaca Paper Trading (required for trading functionality)
ALPACA_PAPER_API_KEY="your-alpaca-paper-api-key"
ALPACA_PAPER_API_SECRET="your-alpaca-paper-api-secret"
NEXT_PUBLIC_ALPACA_PAPER_API_KEY="your-alpaca-paper-api-key"
NEXT_PUBLIC_ALPACA_PAPER_API_SECRET="your-alpaca-paper-api-secret"

# Optional: Telegram notifications
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
TELEGRAM_CHAT_ID="your-telegram-chat-id"
```

### 4. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Create and seed database
npx prisma db push
npx prisma db seed
```

### 5. Build & Run
```bash
# Development mode
npm run dev

# Or production build
npm run build
npm start
```

## Common Build Issues & Solutions

### Issue 1: Prisma Client Not Generated
**Error**: `Cannot find module '@prisma/client'`
**Solution**:
```bash
npx prisma generate
```

### Issue 2: Database Not Created
**Error**: `SQLITE_CANTOPEN: unable to open database file`
**Solution**:
```bash
npx prisma db push
```

### Issue 3: Missing Environment Variables
**Error**: `TypeError: Cannot read property 'NEXTAUTH_SECRET'`
**Solution**: Copy `.env.example` to `.env.local` and configure

### Issue 4: TypeScript Errors
**Error**: Various TypeScript compilation errors
**Solution**: The build is configured to ignore TypeScript errors, but you can fix them:
```bash
npx tsc --noEmit
```

### Issue 5: Node Version Compatibility
**Error**: `engine "node": wanted ">=18.0.0"`
**Solution**: Upgrade to Node.js 18+ or use nvm:
```bash
nvm install 20
nvm use 20
```

### Issue 6: Port Already in Use
**Error**: `EADDRINUSE: address already in use :::3001`
**Solution**: Kill process or use different port:
```bash
# Kill process on port 3001
npx kill-port 3001

# Or set different port
PORT=3002 npm run dev
```

### Issue 7: Alpaca API Connection Issues
**Error**: Paper trading not working
**Solution**: 
1. Get API keys from https://app.alpaca.markets/paper/dashboard/overview
2. Add to `.env.local`
3. Test connection:
```bash
npx tsx test-alpaca-connection.ts
```

## Development Workflow

### Starting the System
```bash
# 1. Start the web interface
npm run dev

# 2. (Optional) Start trading strategies
npx tsx load-database-strategies.ts

# 3. (Optional) Check system health
npx tsx quick-system-check.ts
```

### Container Development
```bash
# Build and run all services
docker compose up -d

# Or specific services
docker compose -f containers/monitoring/docker-compose.yml up -d
```

## Verification Commands

Test if everything is working:
```bash
# Check system status
npx tsx quick-system-check.ts

# Test database connection
npx prisma db pull

# Test API connections
npx tsx test-alpaca-connection.ts

# Check trading activity
npx tsx check-trading-activity.ts
```

## Get Help

If you're still having issues:
1. Check the browser console for errors
2. Check the terminal output for specific error messages
3. Verify all environment variables are set
4. Make sure Node.js version is 18+
5. Try deleting `node_modules` and reinstalling:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

The system should be accessible at http://localhost:3001 after successful setup.