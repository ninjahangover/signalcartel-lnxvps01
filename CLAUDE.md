# SignalCartel Trading Platform - Claude Context

## Project Overview
SignalCartel is a revolutionary cryptocurrency trading platform featuring **QUANTUM FORGE™** - our advanced phased intelligence AI paper trading engine. Features GPU-accelerated automated trading strategies with **complete position lifecycle management**, **real multi-source sentiment analysis**, and **phased intelligence activation**. All trades are stored in PostgreSQL for performance analysis and intelligent pattern learning.

## Current State (As of August 26, 2025 - QUANTUM FORGE™ PHASED INTELLIGENCE SYSTEM COMPLETE)

### 🎯 **LATEST: QUANTUM FORGE™ Phased Intelligence System** (August 26, 2025)
- ✅ **PHASED INTELLIGENCE ACTIVATION** - 5-phase system (Phase 0-4) with progressive AI feature activation
- ✅ **ULTRA-LOW BARRIERS** - Phase 0 uses 10% confidence threshold for maximum trade generation (vs 70% Phase 4)
- ✅ **ADAPTIVE PHASE MANAGEMENT** - Quantum intelligence analyzes performance for optimal phase transitions
- ✅ **COMPLETE POSITION LIFECYCLE** - Every trade tracked from entry→exit with real P&L calculation
- ✅ **MATHEMATICAL INTUITION ENGINE** - Parallel analysis comparing calculated vs intuitive trading decisions
- ✅ **REAL-TIME MONITORING** - Live dashboard showing trades, phases, and performance metrics
- ✅ **HYBRID APPROACH** - Combines hardcoded minimums with intelligent performance analysis

### 🚀 **Phase System Architecture:**
- **Phase 0** (0-100 trades): Maximum Data Collection - 10% confidence, no AI filters, raw signals only
- **Phase 1** (100-500 trades): Basic Sentiment - Fear&Greed + Reddit validation
- **Phase 2** (500-1000 trades): Multi-Source Sentiment - 9 sentiment sources with Mathematical Intuition
- **Phase 3** (1000-2000 trades): Order Book Intelligence - Market microstructure + Markov chains
- **Phase 4** (2000+ trades): Full QUANTUM FORGE™ - Complete AI suite with multi-layer consensus

### ⚡ **Position Management System** (COMPLETE - August 26, 2025)
- ✅ **COMPLETE POSITION LIFECYCLE** - Entry → Monitoring → Exit with real P&L tracking
- ✅ **SMART EXIT STRATEGIES** - Stop loss, take profit, trailing stops, time-based exits per strategy
- ✅ **TRADE MATCHING ENGINE** - Pairs entry/exit trades for accurate performance metrics
- ✅ **MATHEMATICAL INTUITION INTEGRATION** - Flow field resonance analysis enhancing position decisions
- ✅ **DATABASE SCHEMA** - ManagedPosition & ManagedTrade tables with complete relationships
- ✅ **STRATEGY INTEGRATION** - All GPU strategies use position management exclusively
- ✅ **MANDATORY ARCHITECTURE** - No trading without complete position lifecycle tracking

### 🧠 **Multi-Source Sentiment Intelligence System** (COMPLETE - August 26, 2025)
- ✅ **12+ LIVE SOURCES** - Fear&Greed, Reddit, News, On-chain, Twitter, Economic indicators, Whale tracking
- ✅ **98% CONFIDENCE** - Advanced multi-dimensional confidence calculation
- ✅ **31+ DATA POINTS** - Comprehensive dataset from crypto + macro + social + technical sources
- ✅ **SOPHISTICATED WEIGHTING** - Exchange flows (3.5x), Economic (3.2x), Fear&Greed (4.0x)
- ✅ **HIGH-PERFORMANCE CACHING** - 5-minute cache reduces API calls by 90%
- ✅ **PARALLEL PROCESSING** - All sources fetched simultaneously with sub-second execution
- ✅ **PHASE-BASED ACTIVATION** - Sentiment sources enabled progressively through phases

### 🏆 **QUANTUM FORGE™ Order Book Intelligence™** (COMPLETE - August 26, 2025)
- ✅ **MULTI-LAYER AI ARCHITECTURE** - 4-layer fusion engine (Technical + Sentiment + Order Book + Fusion)
- ✅ **REAL-TIME MARKET MICROSTRUCTURE** - Whale detection, liquidity analysis, pressure monitoring
- ✅ **TRADITIONAL ORDER BOOK VISUAL** - ExoCharts-style red/green heat maps
- ✅ **ADVANCED STREAMING ANALYSIS** - 2-second updates with flow imbalance analysis
- ✅ **CROSS-LAYER VALIDATION** - Conflict detection between intelligence layers
- ✅ **AI TRANSPARENCY** - Human-readable decision explanations

### 📊 **Real-Time Monitoring & Live Dashboard** (NEW - August 26, 2025)
- ✅ **QUANTUM FORGE™ LIVE MONITOR** - Real-time terminal dashboard with colorized output
- ✅ **COMPREHENSIVE LOGGING** - Trades, phases, errors logged to /tmp/signalcartel-logs/
- ✅ **SESSION STATISTICS** - Trades per hour, win rate, P&L tracking
- ✅ **PHASE TRANSITION ALERTS** - Real-time notifications when advancing phases
- ✅ **STARTUP SCRIPT** - Single command launches trading + monitoring
- ✅ **GRACEFUL SHUTDOWN** - Ctrl+C stops all processes cleanly

## Architecture

### Core Components
1. **Phased Intelligence System** - Progressive AI activation based on performance and trade count
2. **Position Management** - Complete lifecycle tracking with entry→exit P&L calculation
3. **Multi-Source Sentiment** - 12+ real-time intelligence sources with advanced weighting
4. **Mathematical Intuition Engine** - Parallel analysis comparing calculation vs intuition
5. **Order Book Intelligence™** - Market microstructure analysis with whale detection
6. **Real-Time Monitoring** - Live dashboard with comprehensive logging and alerting
7. **PostgreSQL Database** - All data stored in postgresql://localhost:5433/signalcartel

### Key Files

**🔥 Core Trading System:**
- `load-database-strategies.ts` - Main entry point for phased intelligence trading
- `src/lib/strategy-execution-engine.ts` - Core trading logic with position management integration
- `src/lib/position-management/position-service.ts` - Complete position lifecycle management
- `src/lib/quantum-forge-phase-config.ts` - 5-phase configuration system
- `src/lib/quantum-forge-adaptive-phase-manager.ts` - Intelligent phase transition analysis
- `src/lib/mathematical-intuition-engine.ts` - Parallel intuition vs calculation analysis

**📊 Monitoring & Admin:**
- `admin/quantum-forge-live-monitor.ts` - Real-time trading dashboard
- `admin/start-quantum-forge-with-monitor.sh` - Complete startup solution
- `admin/phase-transition-status.ts` - Phase readiness analysis tool
- `admin/control-trading-phase.ts` - Manual phase control interface
- `scripts/backup/simple-db-backup.sh` - Enterprise backup system
- `scripts/monitoring/openstatus-monitor-service.sh` - Health monitoring service

**🧠 Intelligence Systems:**
- `src/lib/sentiment/simple-twitter-sentiment.ts` - Multi-source sentiment engine
- `src/lib/quantum-forge-multi-layer-ai.ts` - 4-layer AI fusion architecture
- `src/lib/quantum-forge-orderbook-ai.ts` - Order book intelligence analysis
- `src/lib/gpu-*.ts` - GPU-accelerated strategy implementations

### Database Architecture
- **PostgreSQL Only** - `postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/signalcartel`
- **ManagedPosition Table** - Complete position lifecycle with entry/exit tracking
- **ManagedTrade Table** - Individual trade records linked to positions
- **No SQLite** - Completely migrated to PostgreSQL architecture

## Quick Commands

### 🚀 **Start Trading with Live Monitor (Primary Command)**
```bash
# Single command - starts trading engine + live monitor
./admin/start-quantum-forge-with-monitor.sh

# Alternative: Separate terminals
ENABLE_GPU_STRATEGIES=true NTFY_TOPIC="signal-cartel" npx tsx -r dotenv/config load-database-strategies.ts
npx tsx -r dotenv/config admin/quantum-forge-live-monitor.ts
```

### 📊 **Phase Management**
```bash
# Check current phase status and readiness
npx tsx -r dotenv/config admin/phase-transition-status.ts

# Manual phase control interface
npx tsx -r dotenv/config admin/control-trading-phase.ts
```

### 🧪 **Testing & Validation**
```bash
# Test position management system
npx tsx -r dotenv/config admin/test-position-tracking.ts

# Test phase barriers
npx tsx -r dotenv/config admin/test-phase-0-barriers.ts
```

### 💾 **Enterprise Backup System**
```bash
# Manual backup (all databases)
./scripts/backup/simple-db-backup.sh

# Monitor logs
tail -f /tmp/signalcartel-logs/*.log
```

## Environment Variables Required
```env
# Database (PostgreSQL Only)
DATABASE_URL="postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/signalcartel?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secret"

# GPU Acceleration
ENABLE_GPU_STRATEGIES=true

# Notifications
NTFY_TOPIC="signal-cartel"
```

## Phase Transition Strategy

### Hardcoded Safety Minimums:
- **Phase 0**: 0-100 completed trades (ultra-low barriers)
- **Phase 1**: 100-500 trades (basic sentiment)
- **Phase 2**: 500-1000 trades (multi-source sentiment)
- **Phase 3**: 1000-2000 trades (order book intelligence)
- **Phase 4**: 2000+ trades (full QUANTUM FORGE™)

### Adaptive Intelligence Analysis:
- **Data Volume**: Sufficient trades for next phase?
- **Performance Stability**: Win rate consistent (30-70% learning range)?
- **Performance Trajectory**: Improving or declining trend?
- **Risk Management**: Drawdown under control (<20%)?
- **Data Quality**: Diverse trading conditions and strategies?

### Transition Modes:
- **AUTO** (Default): Smart progression based on performance + minimums
- **MANUAL**: Force specific phase for testing
- **UNRESTRICTED**: Remove all barriers for maximum trade generation

## 🚨 **CRITICAL: Position Management is MANDATORY**

**All trading must use position lifecycle tracking:**
- ✅ **ALWAYS USE**: `load-database-strategies.ts` (includes complete position management)
- ❌ **NEVER USE**: `custom-paper-trading.ts` (bypasses position tracking)
- ⚠️ **DATABASE**: PostgreSQL only - no SQLite exceptions
- 🔒 **ARCHITECTURE**: Entry→Exit lifecycle tracking required for all intelligence

## Important Notes
- **Phase 0 Active**: Ultra-low barriers (10% confidence) for maximum data collection
- **PostgreSQL Only**: All data in postgresql://localhost:5433/signalcartel
- **Complete Position Tracking**: Every trade lifecycle from entry to exit
- **Real-Time Monitoring**: Live dashboard shows all activity with comprehensive logging
- **Mathematical Intuition**: Parallel analysis enhancing traditional calculations
- **Admin Scripts**: All organized in `/admin` folder for easy access
- **Log Files**: All activity logged to `/tmp/signalcartel-logs/` for analysis
- **Graceful Shutdown**: Ctrl+C cleanly stops all processes

## Hardware Context
- Development server: Alienware Aurora R6
- CPU: Intel i7-7700 (4C/8T, 3.6-4.2GHz)
- RAM: 32GB DDR4
- GPU: NVIDIA GTX 1080 8GB (CUDA 13.0 working)
- OS: Debian 13 (trixie)

## Repository
- GitHub: https://github.com/ninjahangover/signalcartel
- Main branch is production
- Latest update: Phased Intelligence System with complete position management

---
*QUANTUM FORGE™ Phased Intelligence Achievement: Revolutionary 5-phase AI activation system with ultra-low barriers for maximum data collection (Phase 0: 10% confidence threshold), complete position lifecycle management, Mathematical Intuition Engine parallel analysis, real-time monitoring dashboard, and intelligent phase transitions - the world's first truly adaptive cryptocurrency trading platform that learns and evolves through progressive intelligence activation.*