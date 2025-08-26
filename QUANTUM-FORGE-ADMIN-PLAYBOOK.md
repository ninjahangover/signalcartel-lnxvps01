# QUANTUM FORGE™ Administration Playbook

**Version**: 1.0 - August 26, 2025  
**Last Updated**: Phase 4 Order Book Intelligence™ Integration Complete

## 📋 SCRIPT & TEST QUICK REFERENCE

### Core Trading Scripts
```bash
# Primary Trading Engines
load-database-strategies.ts                    # MAIN: Multi-layer AI trading with Order Book Intelligence™
custom-paper-trading.ts                       # LEGACY: Basic paper trading without AI layers

# Trading Tests & Validation
test-multi-layer-ai.ts                       # Test complete 4-layer AI integration
test-order-book-validation.ts                # Test order book intelligence specifically
test-quantum-forge-sentiment.ts              # Test sentiment analysis integration
test-conflict-detection.ts                   # Test cross-layer conflict detection
test-extreme-conflict.ts                     # Test extreme conflict scenarios
```

### System Health & Monitoring
```bash
# Health Checks
system-health-check.ts                       # Comprehensive system status
test-all-monitoring-endpoints.ts             # Validate all monitoring endpoints
openstatus-monitor-runner.ts                # Manual monitoring check

# Service Management Scripts
scripts/monitoring/openstatus-monitor-service.sh    # start|stop|status|logs|restart
scripts/backup/simple-db-backup.sh                  # Manual database backup
```

### Strategy Testing & Optimization
```bash
# Individual Strategy Tests  
test-gpu-strategy-fast.ts                    # Quick GPU strategy validation
test-trading-pipeline.ts                     # Full trading pipeline test
test-strategies-simple.ts                    # Simple strategy execution test
verify-all-strategies.ts                     # Comprehensive strategy validation

# Performance & Analysis
test-position-management.ts                  # Position lifecycle testing
test-mathematical-intuition.ts               # Mathematical intuition engine test
```

### API & Data Tests
```bash
# Market Data Tests
test-real-prices.html                        # Visual market data test (browser)
test-real-price/route.ts                     # API endpoint for real price testing

# Database & Migration
test-restore.sh                              # Database restore testing
database-backup.sh                           # Database backup utility
```

### Development & Debugging
```bash
# Quick Debug Commands
npx tsx system-health-check.ts                                    # System overview
DATABASE_URL="..." npx tsx -e "import {prisma} from './src/lib/prisma.ts'; prisma.paperTrade.count().then(console.log);"  # DB query
ENABLE_GPU_STRATEGIES=true timeout 30s npx tsx -r dotenv/config test-multi-layer-ai.ts    # AI test
```

## 🔄 COMMON ADMIN WORKFLOWS

### "Something's Wrong, Where Do I Start?"
```bash
# 1. Quick health overview
npx tsx system-health-check.ts

# 2. Check if core services are running  
pgrep -f "load-database-strategies.ts" && echo "Trading ✅" || echo "Trading ❌"
curl -s http://localhost:3001/api/health >/dev/null && echo "Website ✅" || echo "Website ❌"
docker ps | grep postgres >/dev/null && echo "Database ✅" || echo "Database ❌"

# 3. Check recent alerts
tail -10 /tmp/signalcartel-alerts.log

# 4. If trading engine is down, restart it
ENABLE_GPU_STRATEGIES=true NTFY_TOPIC="signal-cartel" npx tsx -r dotenv/config load-database-strategies.ts
```

### "I Want to See If Trading Is Working"
```bash
# 1. Check trading engine status
pgrep -f "load-database-strategies.ts" && echo "Engine running" || echo "Engine stopped"

# 2. Test multi-layer AI quickly (30 second timeout)
ENABLE_GPU_STRATEGIES=true timeout 30s npx tsx -r dotenv/config test-multi-layer-ai.ts

# 3. Check recent trading activity  
DATABASE_URL="postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/signalcartel?schema=public" npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.paperTrade.count({where:{timestamp:{gte:new Date(Date.now()-60*60*1000)}}}).then(c => console.log('Last hour trades:', c));
"

# 4. Check API status
curl http://localhost:3001/api/quantum-forge/status | jq
```

### "Dashboard Shows No Data"
```bash
# 1. Check if website is running
lsof -i :3001 || echo "Website not running on 3001"

# 2. Test API endpoints
curl http://localhost:3001/api/quantum-forge/status
curl http://localhost:3001/api/quantum-forge/portfolio

# 3. Check database connectivity
DATABASE_URL="postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/signalcartel?schema=public" npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
Promise.all([
  prisma.paperTrade.count(),
  prisma.enhancedTradingSignal.count()
]).then(([trades, signals]) => console.log('DB Data - Trades:', trades, 'Signals:', signals));
"

# 4. If database is empty, check if data is in the right place
docker exec signalcartel-warehouse psql -U warehouse_user -d signalcartel -c "SELECT COUNT(*) FROM \"PaperTrade\";"
```

### "Test Everything Quickly"
```bash
# 1. System health
npx tsx system-health-check.ts

# 2. All monitoring endpoints  
npx tsx test-all-monitoring-endpoints.ts

# 3. Quick AI test
ENABLE_GPU_STRATEGIES=true timeout 30s npx tsx -r dotenv/config test-multi-layer-ai.ts

# 4. Order book intelligence
timeout 15s npx tsx -r dotenv/config test-order-book-validation.ts

# 5. Check monitoring service
scripts/monitoring/openstatus-monitor-service.sh status
```

### "Deploy New Changes"
```bash
# 1. Stop trading engine (if running)
pkill -f "load-database-strategies.ts"

# 2. Pull latest code
git pull origin main

# 3. Restart website (if needed for code changes)
sudo fuser -k 3001/tcp
PORT=3001 npm run dev &

# 4. Restart trading engine
ENABLE_GPU_STRATEGIES=true NTFY_TOPIC="signal-cartel" npx tsx -r dotenv/config load-database-strategies.ts &

# 5. Verify everything is working
sleep 10 && npx tsx system-health-check.ts
```

### "Weekly Maintenance"
```bash
# 1. Backup database
/home/telgkb9/depot/dev-signalcartel/scripts/backup/simple-db-backup.sh

# 2. Check system performance
top -bn1 | head -20
df -h
free -h

# 3. Verify all tests pass
ENABLE_GPU_STRATEGIES=true timeout 60s npx tsx -r dotenv/config verify-all-strategies.ts

# 4. Check monitoring logs
scripts/monitoring/openstatus-monitor-service.sh logs | tail -50

# 5. Update playbook if needed (this file!)
```

## 🚨 EMERGENCY QUICK REFERENCE

### Critical Services Status Check
```bash
# 1. Check if trading engine is running
pgrep -f "load-database-strategies.ts"

# 2. Check website status
curl -s http://localhost:3001/api/health | jq

# 3. Check PostgreSQL database
docker ps | grep postgres

# 4. Check monitoring service
scripts/monitoring/openstatus-monitor-service.sh status

# 5. Quick system health
npx tsx system-health-check.ts
```

### Emergency Recovery Commands
```bash
# EMERGENCY: Restart everything
pkill -f "load-database-strategies.ts"  # Stop trading
PORT=3001 npm run dev &                 # Restart website
ENABLE_GPU_STRATEGIES=true NTFY_TOPIC="signal-cartel" npx tsx -r dotenv/config load-database-strategies.ts &  # Restart trading
```

## 📊 SYSTEM ARCHITECTURE OVERVIEW

### Core Services
1. **QUANTUM FORGE™ Trading Engine** - Multi-layer AI trading with 4-layer fusion
2. **Next.js Website** - Dashboard interface (Port 3001)
3. **PostgreSQL Database** - Trade data, signals, positions (Port 5433)
4. **Market Data Collector** - Real-time price feeds
5. **Monitoring System** - OpenStatus with ntfy alerts
6. **Order Book Intelligence™** - Real-time market microstructure analysis

### Service Dependencies
```
Website (3001) 
    ↓
PostgreSQL (5433) ← Trading Engine ← Market Data APIs
    ↓                      ↓
Order Book APIs    Sentiment APIs
    ↓                      ↓
Monitoring System ← All Services
```

## 🔧 SERVICE MANAGEMENT

### 1. QUANTUM FORGE™ Trading Engine

**Check Status:**
```bash
# Check if trading engine is running
pgrep -f "load-database-strategies.ts"
ps aux | grep "load-database-strategies"

# Check recent trades
DATABASE_URL="postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/signalcartel?schema=public" npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.enhancedTradingSignal.count().then(c => console.log('Recent signals:', c));
prisma.paperTrade.count().then(c => console.log('Total trades:', c));
"
```

**Start Trading Engine:**
```bash
# Full multi-layer AI trading with all intelligence layers
ENABLE_GPU_STRATEGIES=true NTFY_TOPIC="signal-cartel" npx tsx -r dotenv/config load-database-strategies.ts

# Run in background with logging
nohup ENABLE_GPU_STRATEGIES=true NTFY_TOPIC="signal-cartel" npx tsx -r dotenv/config load-database-strategies.ts > /tmp/trading-engine.log 2>&1 &
echo $! > /tmp/trading-engine.pid
```

**Stop Trading Engine:**
```bash
# Stop gracefully
pkill -f "load-database-strategies.ts"

# Force stop if needed
pkill -9 -f "load-database-strategies.ts"

# Check if stopped
pgrep -f "load-database-strategies.ts" || echo "Trading engine stopped"
```

**Troubleshooting:**
- **No trades being generated**: Check GPU availability, sentiment API status, database connection
- **High error rate**: Check API rate limits, network connectivity, database constraints
- **Memory issues**: Restart trading engine, check for memory leaks in GPU strategies

### 2. Next.js Website Dashboard

**Check Status:**
```bash
# Check if website is running
lsof -i :3001
curl -s http://localhost:3001/api/health

# Check build status
npm run build  # Should complete without errors
```

**Start Website:**
```bash
# Development mode
PORT=3001 npm run dev

# Production mode
npm run build && npm run start

# Background with logging
nohup PORT=3001 npm run dev > /tmp/website.log 2>&1 &
echo $! > /tmp/website.pid
```

**Stop Website:**
```bash
# Find and kill process on port 3001
sudo fuser -k 3001/tcp

# Or kill by process
pkill -f "npm run dev"
```

**Troubleshooting:**
- **Port 3001 in use**: Kill existing process, check for zombie processes
- **Build failures**: Check TypeScript errors, missing dependencies
- **Dashboard not loading data**: Check API endpoints, database connection

### 3. PostgreSQL Database

**Check Status:**
```bash
# Check PostgreSQL container
docker ps | grep postgres
docker logs signalcartel-warehouse

# Test database connection
DATABASE_URL="postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/signalcartel?schema=public" npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.\$connect().then(() => console.log('DB connected')).catch(e => console.error('DB error:', e.message));
"
```

**Start PostgreSQL:**
```bash
# Start warehouse container
docker compose -f containers/website/docker-compose.yml up -d

# Check if healthy
docker ps | grep healthy
```

**Stop PostgreSQL:**
```bash
# Stop container
docker compose -f containers/website/docker-compose.yml down
```

**Database Maintenance:**
```bash
# Manual backup
/home/telgkb9/depot/dev-signalcartel/scripts/backup/simple-db-backup.sh

# Check backup location
ls -la /home/telgkb9/signalcartel-db-backups/

# Restore from backup (example)
# pg_restore -h localhost -p 5433 -U warehouse_user -d signalcartel /path/to/backup.sql
```

**Troubleshooting:**
- **Connection refused**: Check container status, port 5433 availability
- **Disk space full**: Clean old backups, check container logs
- **Data inconsistency**: Check Prisma schema, run database migrations

### 4. Monitoring System

**Check Status:**
```bash
# Check monitoring service
scripts/monitoring/openstatus-monitor-service.sh status

# View live logs
scripts/monitoring/openstatus-monitor-service.sh logs

# Manual health check
npx tsx openstatus-monitor-runner.ts
```

**Start Monitoring:**
```bash
# Start with ntfy alerts
NTFY_TOPIC="signal-cartel" scripts/monitoring/openstatus-monitor-service.sh start

# Check all endpoints manually
npx tsx test-all-monitoring-endpoints.ts
```

**Stop Monitoring:**
```bash
scripts/monitoring/openstatus-monitor-service.sh stop
```

**Troubleshooting:**
- **No alerts received**: Check ntfy topic, network connectivity
- **False positives**: Adjust monitoring intervals, check endpoint timeouts
- **Log spam**: Check alert thresholds, disable verbose logging

## 🚨 COMMON ISSUES & SOLUTIONS

### Issue 1: "Trading Engine Not Generating Signals"

**Symptoms:**
- Dashboard shows 0 recent trades
- No trading activity in logs
- System health shows warnings

**Diagnosis:**
```bash
# Check if engine is running
pgrep -f "load-database-strategies.ts"

# Check GPU availability
nvidia-smi

# Check sentiment API status
npx tsx -e "import { twitterSentiment } from './src/lib/sentiment/simple-twitter-sentiment.ts'; twitterSentiment.getBTCSentiment().then(console.log);"

# Check database connectivity
DATABASE_URL="postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/signalcartel?schema=public" npx tsx -e "console.log('Testing DB...'); import('./src/lib/prisma.ts').then(m => m.prisma.enhancedTradingSignal.count().then(console.log));"
```

**Solutions:**
1. **Restart Trading Engine:**
   ```bash
   pkill -f "load-database-strategies.ts"
   ENABLE_GPU_STRATEGIES=true NTFY_TOPIC="signal-cartel" npx tsx -r dotenv/config load-database-strategies.ts
   ```

2. **Check API Rate Limits:**
   - Wait 5-10 minutes for rate limits to reset
   - Check sentiment API responses for 429 errors

3. **Verify GPU Strategies:**
   - Check CUDA availability
   - Run CPU fallback if GPU unavailable

### Issue 2: "Dashboard Shows No Data"

**Symptoms:**
- Dashboard loads but shows 0 trades
- API endpoints return empty results
- Database connection issues

**Diagnosis:**
```bash
# Check API endpoints
curl http://localhost:3001/api/quantum-forge/status
curl http://localhost:3001/api/quantum-forge/portfolio

# Check database data
DATABASE_URL="postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/signalcartel?schema=public" npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.paperTrade.count().then(c => console.log('Trades:', c));
prisma.enhancedTradingSignal.count().then(c => console.log('Signals:', c));
"
```

**Solutions:**
1. **Check Database Connection:**
   - Verify PostgreSQL container is running
   - Test database connectivity
   - Check if data exists in database

2. **Restart Website:**
   ```bash
   sudo fuser -k 3001/tcp
   PORT=3001 npm run dev
   ```

3. **Clear Browser Cache:**
   - Hard refresh (Ctrl+F5)
   - Clear application data in DevTools

### Issue 3: "Order Book Intelligence Not Working"

**Symptoms:**
- Order Book Intelligence™ tab shows errors
- No market microstructure data
- External API failures

**Diagnosis:**
```bash
# Test order book API
curl "http://localhost:3001/api/order-book?symbol=BTCUSDT"

# Test external APIs manually
curl "https://api.binance.us/api/v3/depth?symbol=BTCUSDT&limit=20"
curl "https://api.kraken.com/0/public/Depth?pair=XXBTZUSD&count=20"
```

**Solutions:**
1. **Check API Rate Limits:**
   - Wait for rate limit reset
   - Verify API keys if required

2. **Fallback to Alternative APIs:**
   - System should auto-fallback to Kraken if Binance fails
   - Check CoinGecko integration

3. **Restart Order Book Service:**
   - Restart website to reset API connections
   - Check network connectivity

### Issue 4: "High Memory Usage / System Slow"

**Symptoms:**
- System becomes unresponsive
- High CPU/memory usage
- Trading engine stops responding

**Diagnosis:**
```bash
# Check system resources
top -p $(pgrep -f "load-database-strategies.ts")
nvidia-smi  # Check GPU memory
df -h       # Check disk space
free -h     # Check RAM usage
```

**Solutions:**
1. **Restart Trading Engine:**
   ```bash
   pkill -f "load-database-strategies.ts"
   sleep 5
   ENABLE_GPU_STRATEGIES=true NTFY_TOPIC="signal-cartel" npx tsx -r dotenv/config load-database-strategies.ts
   ```

2. **Clean System Resources:**
   ```bash
   # Clear logs
   sudo journalctl --vacuum-size=100M
   
   # Clean Docker
   docker system prune -f
   
   # Clear Node.js cache
   npm cache clean --force
   ```

3. **Check for Memory Leaks:**
   - Monitor memory usage over time
   - Restart services periodically if needed

## 🔄 DAILY MAINTENANCE PROCEDURES

### Morning Checklist (5 minutes)
```bash
# 1. Check system health
npx tsx system-health-check.ts

# 2. Verify trading engine is running
pgrep -f "load-database-strategies.ts" && echo "✅ Trading engine running" || echo "❌ Trading engine stopped"

# 3. Check website status
curl -s http://localhost:3001/api/health | jq '.status' || echo "❌ Website down"

# 4. Check recent trade activity
DATABASE_URL="postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/signalcartel?schema=public" npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.paperTrade.count({where:{timestamp:{gte:new Date(Date.now()-24*60*60*1000)}}}).then(c => console.log('24h trades:', c));
"

# 5. Check monitoring alerts
tail -20 /tmp/signalcartel-alerts.log
```

### Weekly Maintenance (15 minutes)
```bash
# 1. Database backup
/home/telgkb9/depot/dev-signalcartel/scripts/backup/simple-db-backup.sh

# 2. Check backup integrity
ls -la /home/telgkb9/signalcartel-db-backups/

# 3. Update system packages (optional)
sudo apt update && sudo apt list --upgradable

# 4. Check disk space
df -h

# 5. Review monitoring logs
scripts/monitoring/openstatus-monitor-service.sh logs | tail -100

# 6. Performance check
ENABLE_GPU_STRATEGIES=true timeout 30s npx tsx -r dotenv/config test-multi-layer-ai.ts
```

## 📱 ALERT INTERPRETATION

### ntfy Alert Types

**🚀 QUANTUM FORGE Trading Engine**: 
- **UP**: Trading engine responding, generating signals
- **DOWN**: Engine stopped or not responding - restart trading engine

**📊 Trading Portfolio**:
- **UP**: Portfolio API working, recent trades found
- **DOWN**: No recent trading activity - check trading engine

**📈 Market Data Collector**:
- **UP**: Market data APIs responding
- **DOWN**: External API issues - check network, wait for recovery

**🌐 Website Dashboard**:
- **UP**: Website accessible on port 3001
- **DOWN**: Website crashed - restart Next.js

**🎮 GPU Strategy Engine**:
- **UP**: GPU acceleration available and working
- **DOWN**: GPU issues - fallback to CPU automatically

**🗄️ PostgreSQL Database**:
- **UP**: Database connection successful
- **DOWN**: Database down - restart PostgreSQL container

**🧠 Sentiment Intelligence**:
- **UP**: All sentiment APIs responding
- **DOWN**: Sentiment API rate limits - wait 5-10 minutes

## 🔧 PERFORMANCE TUNING

### Trading Engine Optimization
```bash
# Check strategy performance
DATABASE_URL="postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/signalcartel?schema=public" npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.\$queryRaw\`SELECT strategy, COUNT(*) as trades, AVG(CASE WHEN \"finalPnL\" > 0 THEN 1.0 ELSE 0.0 END) as win_rate FROM \"PaperTrade\" WHERE timestamp > NOW() - INTERVAL '7 days' GROUP BY strategy\`.then(console.table);
"

# Adjust strategy confidence thresholds if needed (currently optimized)
# Monitor GPU memory usage
nvidia-smi -l 5
```

### Database Performance
```bash
# Check database size
DATABASE_URL="postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/signalcartel?schema=public" npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
Promise.all([
  prisma.paperTrade.count(),
  prisma.enhancedTradingSignal.count(),
  prisma.pineStrategy.count()
]).then(([trades, signals, strategies]) => console.log({trades, signals, strategies}));
"

# Clean old data if needed (keep 30 days)
# Only run if database is getting too large (>1GB)
```

## 📞 ESCALATION PROCEDURES

### Level 1: Automated Recovery
- System automatically attempts to recover from API failures
- GPU strategies fallback to CPU if GPU unavailable
- Sentiment APIs use cached data if external APIs fail

### Level 2: Manual Intervention Required
1. **Trading Engine Down**: Restart using emergency commands above
2. **Database Issues**: Check container status, restart if needed  
3. **Website Crashed**: Restart Next.js application
4. **Multiple Service Failures**: Run full system restart procedure

### Level 3: Critical System Issues
- **Data Corruption**: Restore from latest backup
- **Security Breach**: Stop all services, investigate logs
- **Hardware Failure**: Document issue, migrate to backup hardware

## 📝 LOG LOCATIONS

```bash
# Trading Engine Logs
tail -f /tmp/trading-engine.log

# Website Logs
tail -f /tmp/website.log

# Monitoring Logs
tail -f /tmp/openstatus-monitor.log

# Alert Logs
tail -f /tmp/signalcartel-alerts.log

# Docker Logs
docker logs signalcartel-warehouse
docker logs signalcartel-website
```

## 🔒 SECURITY CHECKLIST

### Daily Security Check
- [ ] No unauthorized access in logs
- [ ] API keys not exposed in logs
- [ ] Database access properly secured
- [ ] Monitoring alerts working

### Weekly Security Review
- [ ] Update dependencies with security patches
- [ ] Review database access patterns
- [ ] Check for unusual trading patterns
- [ ] Verify backup integrity

---

## 📧 SUPPORT CONTACTS

**Emergency Contact**: System Administrator  
**Monitoring**: ntfy topic "signal-cartel"  
**Documentation**: This playbook + CLAUDE.md  
**Repository**: https://github.com/ninjahangover/signalcartel

---

*Keep this playbook updated as new services are added or system architecture changes. Version control all updates.*

**Last Updated**: August 26, 2025 - Phase 4 Order Book Intelligence™ Complete