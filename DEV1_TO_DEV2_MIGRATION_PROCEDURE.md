# DEV1 to DEV2 System Migration Procedure

## Overview
This document provides the complete procedure to upgrade DEV1 to the DEV2 AI-enhanced position tracking system after A/B testing confirms superior performance.

**Current State:**
- **DEV1**: Original system with 10-minute forced exits
- **DEV2**: AI-enhanced with unique trade IDs, extended hold times, and learning system

## 📋 Pre-Migration Checklist

- [ ] Confirm DEV2 outperforms DEV1 (win rate, P&L, drawdown)
- [ ] Backup DEV1 database
- [ ] Record current DEV1 statistics for comparison
- [ ] Ensure no critical trades are open
- [ ] Schedule migration during low-activity period

## 🗂️ Files Created/Modified for DEV2 System

### New Files Created (Copy These to DEV1)
```bash
# Core AI Position Management
src/lib/position-management/ai-position-optimizer.ts
src/lib/position-management/dev2-ai-position-service.ts
src/lib/position-management/enhanced-position-service.ts

# Database Migrations
prisma/migrations/20250831_dev2_ai_tracking_fixed.sql

# Test Files
test-dev2-ai-tracking.ts

# This Migration Guide
DEV1_TO_DEV2_MIGRATION_PROCEDURE.md
```

### Modified Files (Apply These Changes)
```bash
# Position Manager - Extended hold times for AI positions
src/lib/position-management/position-manager.ts
  - Lines 363-397: Updated time-based exit logic

# Strategy Execution Engine - Route to dev2 service
src/lib/strategy-execution-engine.ts
  - Line 10: Import dev2AIPositionService
  - Lines 1358-1380: Conditional routing based on NTFY_TOPIC
```

## 📦 Step-by-Step Migration Process

### Step 1: Stop DEV1 Trading
```bash
# Stop the current trading process
pkill -f "production-trading-with-positions.ts"

# Verify no positions are being opened
docker exec signalcartel-warehouse psql -U warehouse_user -d signalcartel -c \
  "SELECT COUNT(*) FROM \"ManagedPosition\" WHERE status = 'open';"
```

### Step 2: Backup Current State
```bash
# Create backup directory with timestamp
BACKUP_DIR="/home/telgkb9/signalcartel-backups/dev1-pre-migration-$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup database
docker exec signalcartel-warehouse pg_dump -U warehouse_user -d signalcartel \
  > $BACKUP_DIR/signalcartel_dev1_backup.sql

# Record current statistics
docker exec signalcartel-warehouse psql -U warehouse_user -d signalcartel -c \
  "SELECT 
    COUNT(*) as total_positions,
    COUNT(CASE WHEN status = 'closed' AND \"realizedPnL\" > 0 THEN 1 END) as wins,
    COUNT(CASE WHEN status = 'closed' AND \"realizedPnL\" < 0 THEN 1 END) as losses,
    AVG(CASE WHEN status = 'closed' THEN \"realizedPnL\" END) as avg_pnl,
    SUM(CASE WHEN status = 'closed' THEN \"realizedPnL\" END) as total_pnl
  FROM \"ManagedPosition\" 
  WHERE \"createdAt\" > NOW() - INTERVAL '7 days';" \
  > $BACKUP_DIR/dev1_final_stats.txt
```

### Step 3: Copy New Files from DEV2 Repository
```bash
# Assuming dev2 repo is at /home/telgkb9/depot/signalcartel-dev2
DEV2_REPO="/home/telgkb9/depot/signalcartel-dev2"
DEV1_REPO="/home/telgkb9/depot/signalcartel"

# Copy AI position management files
cp $DEV2_REPO/src/lib/position-management/ai-position-optimizer.ts \
   $DEV1_REPO/src/lib/position-management/

cp $DEV2_REPO/src/lib/position-management/dev2-ai-position-service.ts \
   $DEV1_REPO/src/lib/position-management/

cp $DEV2_REPO/src/lib/position-management/enhanced-position-service.ts \
   $DEV1_REPO/src/lib/position-management/

# Copy test file
cp $DEV2_REPO/test-dev2-ai-tracking.ts $DEV1_REPO/
```

### Step 4: Apply Code Modifications
```bash
# Copy modified files (make backups first)
cp $DEV1_REPO/src/lib/position-management/position-manager.ts \
   $DEV1_REPO/src/lib/position-management/position-manager.ts.bak

cp $DEV1_REPO/src/lib/strategy-execution-engine.ts \
   $DEV1_REPO/src/lib/strategy-execution-engine.ts.bak

# Copy updated versions from dev2
cp $DEV2_REPO/src/lib/position-management/position-manager.ts \
   $DEV1_REPO/src/lib/position-management/

cp $DEV2_REPO/src/lib/strategy-execution-engine.ts \
   $DEV1_REPO/src/lib/strategy-execution-engine.ts
```

### Step 5: Apply Database Migration
```bash
# Run the migration to add dev2 tables and columns
cat $DEV2_REPO/prisma/migrations/20250831_dev2_ai_tracking_fixed.sql | \
  docker exec -i signalcartel-warehouse psql -U warehouse_user -d signalcartel

# Verify tables were created
docker exec signalcartel-warehouse psql -U warehouse_user -d signalcartel -c \
  "SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('position_signals_dev2', 'trade_learning_dev2');"
```

### Step 6: Migrate to Unified System (Optional)
If you want to use the enhanced system as the primary (not just dev2):

```bash
# Create migration script to unify the system
cat > migrate_to_unified.sql << 'EOF'
-- Rename dev2 tables to primary tables
ALTER TABLE position_signals_dev2 RENAME TO position_signals;
ALTER TABLE trade_learning_dev2 RENAME TO trade_learning;

-- Add unique_trade_id to all future positions
ALTER TABLE "ManagedPosition" 
ADD COLUMN IF NOT EXISTS unique_trade_id TEXT;

-- Create index
CREATE INDEX IF NOT EXISTS idx_managed_position_trade_id 
ON "ManagedPosition"(unique_trade_id);

-- Update view to track all positions
CREATE OR REPLACE VIEW position_performance AS
SELECT 
  COUNT(*) as total_positions,
  COUNT(CASE WHEN status = 'closed' AND "realizedPnL" > 0 THEN 1 END) as wins,
  COUNT(CASE WHEN status = 'closed' AND "realizedPnL" < 0 THEN 1 END) as losses,
  AVG(CASE WHEN status = 'closed' THEN "realizedPnL" END) as avg_pnl,
  SUM(CASE WHEN status = 'closed' THEN "realizedPnL" END) as total_pnl,
  'enhanced_ai' as system_version
FROM "ManagedPosition"
WHERE "createdAt" > NOW() - INTERVAL '24 hours';
EOF

# Apply if desired
# cat migrate_to_unified.sql | docker exec -i signalcartel-warehouse psql -U warehouse_user -d signalcartel
```

### Step 7: Configuration Update
```bash
# Update environment to use enhanced system
export NTFY_TOPIC="signal-cartel-dev2"  # Or create new topic like "signal-cartel-enhanced"

# Or modify .env file
echo 'AI_POSITION_TRACKING=true' >> $DEV1_REPO/.env
echo 'ENABLE_TRADE_LEARNING=true' >> $DEV1_REPO/.env
```

### Step 8: Test the Migration
```bash
# Run the test script
cd $DEV1_REPO
NTFY_TOPIC="signal-cartel-dev2" npx tsx test-dev2-ai-tracking.ts

# Should see:
# ✅ DEV2 AI Enhanced System is READY
# ✅ Found 2 dev2 tables
# ✅ Running as: DEV2 (AI Enhanced)
```

### Step 9: Start Enhanced Trading
```bash
# Start with enhanced AI tracking
DATABASE_URL="postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/signalcartel?schema=public" \
ANALYTICS_DB_URL="postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/signalcartel_analytics?schema=public" \
ENABLE_GPU_STRATEGIES=true \
NTFY_TOPIC="signal-cartel-dev2" \
npx tsx -r dotenv/config production-trading-with-positions.ts
```

## 🔄 Rollback Procedure (If Needed)

### Quick Rollback
```bash
# Stop trading
pkill -f "production-trading-with-positions.ts"

# Restore original files
cp $DEV1_REPO/src/lib/position-management/position-manager.ts.bak \
   $DEV1_REPO/src/lib/position-management/position-manager.ts

cp $DEV1_REPO/src/lib/strategy-execution-engine.ts.bak \
   $DEV1_REPO/src/lib/strategy-execution-engine.ts

# Reset environment
unset NTFY_TOPIC
# Or set to original: export NTFY_TOPIC="signal-cartel"

# Restart original system
ENABLE_GPU_STRATEGIES=true \
NTFY_TOPIC="signal-cartel" \
npx tsx -r dotenv/config production-trading-with-positions.ts
```

### Full Database Rollback
```bash
# Only if absolutely necessary
docker exec -i signalcartel-warehouse psql -U warehouse_user -d signalcartel \
  < $BACKUP_DIR/signalcartel_dev1_backup.sql
```

## ✅ Post-Migration Verification

### 1. Check System Status
```bash
# Verify enhanced features are active
NTFY_TOPIC="signal-cartel-dev2" npx tsx test-dev2-ai-tracking.ts
```

### 2. Monitor First Trades
```bash
# Watch for unique trade IDs
docker exec signalcartel-warehouse psql -U warehouse_user -d signalcartel -c \
  "SELECT unique_trade_id_dev2, symbol, strategy, \"createdAt\" 
   FROM \"ManagedPosition\" 
   WHERE unique_trade_id_dev2 IS NOT NULL 
   ORDER BY \"createdAt\" DESC LIMIT 5;"
```

### 3. Verify AI Tracking
```bash
# Check position signals are being stored
docker exec signalcartel-warehouse psql -U warehouse_user -d signalcartel -c \
  "SELECT COUNT(*) FROM position_signals_dev2;"

# Check learning data
docker exec signalcartel-warehouse psql -U warehouse_user -d signalcartel -c \
  "SELECT COUNT(*) FROM trade_learning_dev2;"
```

### 4. Performance Comparison
```bash
# Compare before/after statistics
docker exec signalcartel-warehouse psql -U warehouse_user -d signalcartel -c \
  "SELECT * FROM ab_test_comparison;"
```

## 📊 Expected Improvements

After migration, you should see:
- **Longer Position Holds**: AI-validated positions held up to 45 minutes
- **Unique Trade Tracking**: Every position has a unique ID for analysis
- **AI Learning**: System learns from each completed trade
- **Better Exit Timing**: Intelligent exits based on strategy validation
- **Reduced Premature Exits**: No more blanket 10-minute closures

## 🚨 Important Notes

1. **Database Redundancy**: Changes will replicate to redundant databases
2. **Both Systems Can Coexist**: Tables have `_dev2` suffix, so both can run
3. **Environment Variable Control**: System selection via `NTFY_TOPIC`
4. **No Data Loss**: Original position data remains intact
5. **Gradual Migration**: Can run both systems in parallel if needed

## 📞 Support

If issues arise during migration:
1. Check logs: `tail -f /tmp/signalcartel-logs/production-trading.log`
2. Verify database: `docker exec signalcartel-warehouse psql -U warehouse_user -d signalcartel`
3. Test configuration: `npx tsx test-dev2-ai-tracking.ts`
4. Rollback if needed using backup files

---

**Migration Time Estimate**: 15-30 minutes
**Risk Level**: Low (with backups)
**Reversibility**: Full (with rollback procedure)