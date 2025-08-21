# Signal Cartel Trading System - Server Automation

Complete server management automation for the Signal Cartel trading platform. Never forget which services to start or stop!

## 🚀 Quick Commands

```bash
# Start all services
./start-server.sh

# Check system status
./check-server-status.sh

# Stop all services  
./stop-server.sh
```

---

## 📋 Available Scripts

### 🟢 `start-server.sh` - Complete System Startup
**Purpose**: Starts all trading system services in the correct order

**What it does:**
1. **Environment Verification** - Checks Node.js, npm, tsx, dependencies
2. **Database Setup** - Runs Prisma migrations and generates client
3. **Market Data Collection** - Starts real-time data collection from multiple sources
4. **AI Optimization Engine** - Starts Pine Script input optimization
5. **Strategy Execution Engine** - Starts paper trading execution system
6. **Alert Generation System** - Starts trading alert generation
7. **Stratus Engine** - Starts main AI trading engine
8. **Next.js Server** - Starts web dashboard on port 3000
9. **System Verification** - Runs automated tests to verify everything works
10. **Status Summary** - Shows all running services and access points

**Estimated time**: 2-3 minutes
**Services started**: 6 core services + web server
**Verification**: Automatic testing of all systems

### 🔍 `check-server-status.sh` - System Status Check
**Purpose**: Quick health check of all services without starting/stopping

**What it shows:**
- ✅/❌ Status of each service (running/stopped)
- 🌐 Port usage (3000, 3001, 8080)
- 📊 API endpoint availability
- 📁 Log file sizes and last entries
- 💾 Database status
- 📊 Summary with quick action suggestions

**Use cases:**
- Quick system health check
- Troubleshooting service issues
- Before/after startup verification
- Monitoring during development

### 🛑 `stop-server.sh` - Complete System Shutdown  
**Purpose**: Gracefully stops all trading system services

**What it does:**
1. **Service Status Check** - Identifies running services
2. **Graceful Shutdown** - Sends SIGTERM to allow clean shutdown
3. **Force Cleanup** - SIGKILL for stuck processes
4. **Process Cleanup** - Removes any remaining related processes
5. **Database Cleanup** - Closes database connections
6. **Port Cleanup** - Frees up used ports (3000, 3001, 8080, etc.)
7. **File Cleanup** - Removes PID files, rotates large logs
8. **Final Verification** - Ensures all processes stopped
9. **Status Update** - Updates system status file

**Safety features:**
- Graceful shutdown with 20-second timeout
- Force kill only as last resort
- Preserves all data and logs
- Creates shutdown log for debugging

---

## 🏗️ System Architecture

### Services Started (in order):
1. **Market Data Collector** → Real-time price feeds
2. **AI Optimization Engine** → Pine Script parameter optimization  
3. **Strategy Execution Engine** → Paper/live trading execution
4. **Alert Generation System** → Trading signal alerts
5. **Stratus Engine** → Main AI coordination
6. **Next.js Server** → Web dashboard

### Dependencies:
- Node.js & npm
- tsx (TypeScript execution)
- Prisma (database)
- All npm dependencies

### Data Flow:
```
Market Data → AI Analysis → Strategy Execution → Alerts → Dashboard
     ↓              ↓              ↓             ↓         ↓
  Database     Optimization    Paper/Live     Webhooks   Status
```

---

## 📊 Monitoring & Logging

### Log Files Created:
- `server-startup.log` - Complete startup sequence
- `server-shutdown.log` - Complete shutdown sequence  
- `market-data-collector.log` - Market data collection
- `ai-optimization-engine.log` - AI optimization activity
- `strategy-execution-engine.log` - Trading execution
- `alert-generation-engine.log` - Alert system
- `stratus-engine.log` - Main engine activity
- `nextjs-server.log` - Web server

### Status Tracking:
- `.server-status` - Current system state
- `*.pid` files - Process IDs for running services
- Real-time status via `check-server-status.sh`

---

## 🔧 Troubleshooting

### Common Issues:

#### ❌ "Next.js server startup timeout"
```bash
# Test Next.js server directly
npx tsx test-nextjs-server.ts

# Check if server is still compiling
cat nextjs-server.log

# Next.js often takes 30-60 seconds for first compile
# Wait and check again
sleep 30 && npx tsx test-nextjs-server.ts
```

#### ❌ "Port 3001 already in use"
```bash
# Check what's using the port
lsof -i:3001

# Stop all services and restart
./stop-server.sh
./start-server.sh
```

#### ❌ "Database connection failed"
```bash
# Regenerate Prisma client
npx prisma generate
npx prisma migrate deploy

# Restart services
./stop-server.sh
./start-server.sh
```

#### ❌ "Service failed to start"
```bash
# Check service logs
cat [service-name].log

# Check system status
./check-server-status.sh

# Force cleanup and restart
./stop-server.sh
./start-server.sh
```

#### ❌ "Market data collector failed to start"
```bash
# Test market data collection directly
npx tsx test-market-data-collection.ts

# Check database connectivity
npx prisma db push

# Check logs for specific errors
cat market-data-collector.log

# Manual restart with detailed logging
./stop-server.sh
DEBUG=true ./start-server.sh
```

#### ❌ "Market data not updating"
```bash
# Check market data status
curl http://localhost:3001/api/market-data/status

# Test market data collection
npx tsx test-market-data-collection.ts

# Restart market data service
./stop-server.sh
./start-server.sh
```

### Advanced Troubleshooting:

#### Process Management:
```bash
# Find all trading system processes
ps aux | grep -E "market-data|stratus|strategy|alert|next"

# Kill specific process
kill -TERM <PID>

# Force kill stuck processes  
kill -KILL <PID>
```

#### Log Analysis:
```bash
# View real-time logs
tail -f server-startup.log

# Search for errors
grep -i error *.log

# Check last 50 lines of all logs
tail -n50 *.log
```

#### Port Management:
```bash
# Check all ports in use
netstat -tulpn | grep LISTEN

# Kill process on specific port
lsof -ti:3001 | xargs kill
```

---

## 🎯 Best Practices

### Daily Workflow:
1. **Start**: `./start-server.sh` (once per session)
2. **Check**: `./check-server-status.sh` (when needed)
3. **Develop**: Use the running system
4. **Stop**: `./stop-server.sh` (end of session)

### Development Tips:
- Always check status before making changes
- Monitor logs during active development  
- Use status checker to verify fixes
- Full restart after major changes

### Production Considerations:
- Set up log rotation for long-running systems
- Monitor disk space for log files
- Consider systemd services for production deployment
- Add external monitoring for critical services

---

## 🚀 Advanced Usage

### Selective Service Control:
```bash
# Start only specific service
npx tsx -e "import { marketDataCollector } from './src/lib/market-data-collector.ts'; marketDataCollector.startCollection();"

# Stop specific service  
kill -TERM $(cat market-data-collector.pid)
```

### Custom Configuration:
```bash
# Set environment variables before starting
export NODE_ENV=development
export DEBUG=true
./start-server.sh
```

### Integration with IDE:
- Add scripts to package.json for IDE integration
- Use VS Code tasks for one-click start/stop
- Set up debug configurations

---

## 📈 Performance Monitoring

### System Health Indicators:
- ✅ All services running
- 🌐 Web dashboard accessible
- 📊 APIs responding
- 💾 Database accessible
- 📁 Log files growing (activity)

### Resource Usage:
```bash
# Check memory usage
free -h

# Check CPU usage
top

# Check disk usage
df -h
```

### Automated Testing Integration:
```bash
# Run after startup
./start-server.sh && npx tsx verify-paper-trading-system.ts

# Status verification
./check-server-status.sh && npx tsx test-status-monitors.ts
```

---

## 🔐 Security Considerations

- Scripts preserve all API keys and sensitive data
- No credentials logged in startup/shutdown logs
- PID files cleaned up properly
- Graceful shutdown prevents data corruption
- Log files may contain sensitive information (review before sharing)

---

## 📞 Support

If automation scripts fail:

1. **Check Prerequisites**: Node.js, npm, tsx installed
2. **Review Logs**: Check startup/shutdown logs for errors  
3. **Manual Cleanup**: Stop all processes manually if needed
4. **Fresh Start**: Remove all .pid files and restart
5. **System Reboot**: Last resort for stuck processes

---

## 🎉 Success Indicators

### ✅ Successful Startup:
```
🎉 SERVER STARTUP COMPLETE!
All services have been started

📊 Service Status:
✅ Market Data Collection  
✅ AI Optimization Engine
✅ Strategy Execution Engine
✅ Alert Generation System
✅ Stratus Engine
✅ Next.js Development Server

🌐 Dashboard: http://localhost:3001
```

### ✅ Successful Status Check:
```
🎉 All systems operational!
🌐 Dashboard: http://localhost:3001
Services: 6/6 running
```

### ✅ Successful Shutdown:
```
🛑 SERVER SHUTDOWN COMPLETE!
All services have been stopped
✅ Signal Cartel Trading System has been safely shut down
```

---

**🎯 Never forget which services to run - just use the automation scripts!**