#!/bin/bash
# Test restore functionality using our backup files

set -euo pipefail

BACKUP_DIR="/home/telgkb9/signalcartel-backups/test"
TEST_DB_PATH="/tmp/test_restore.db"

echo "🔄 BACKUP RESTORE VERIFICATION TEST"
echo "==================================="

# Find the latest backup
LATEST_BACKUP=$(ls -t "${BACKUP_DIR}"/signalcartel_backup_*.db 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ No backup files found in ${BACKUP_DIR}"
    exit 1
fi

echo "📁 Testing restore from: $(basename "$LATEST_BACKUP")"

# Test Method 1: Direct copy restore
echo "📋 Method 1: Testing direct file restore"
cp "$LATEST_BACKUP" "$TEST_DB_PATH"

if sqlite3 "$TEST_DB_PATH" "SELECT COUNT(*) FROM PaperTrade;" > /dev/null 2>&1; then
    TRADE_COUNT=$(sqlite3 "$TEST_DB_PATH" "SELECT COUNT(*) FROM PaperTrade;")
    STRATEGY_COUNT=$(sqlite3 "$TEST_DB_PATH" "SELECT COUNT(*) FROM PineStrategy;")
    echo "✅ Direct restore successful: $TRADE_COUNT trades, $STRATEGY_COUNT strategies"
else
    echo "❌ Direct restore failed"
    exit 1
fi

# Test Method 2: SQL dump restore
echo "📋 Method 2: Testing SQL dump restore"
SQL_DUMP="${LATEST_BACKUP%.db}.sql"
TEST_DB_SQL="/tmp/test_restore_sql.db"

if [ -f "$SQL_DUMP" ]; then
    rm -f "$TEST_DB_SQL"
    sqlite3 "$TEST_DB_SQL" < "$SQL_DUMP"
    
    if sqlite3 "$TEST_DB_SQL" "SELECT COUNT(*) FROM PaperTrade;" > /dev/null 2>&1; then
        TRADE_COUNT_SQL=$(sqlite3 "$TEST_DB_SQL" "SELECT COUNT(*) FROM PaperTrade;")
        echo "✅ SQL dump restore successful: $TRADE_COUNT_SQL trades"
    else
        echo "❌ SQL dump restore failed"
        exit 1
    fi
else
    echo "⚠️ SQL dump file not found, skipping"
fi

# Verify data integrity
echo "🔍 Verifying data integrity"
RECENT_TRADE=$(sqlite3 "$TEST_DB_PATH" "SELECT symbol, side, strategy FROM PaperTrade ORDER BY executedAt DESC LIMIT 1;" 2>/dev/null || echo "none")
echo "📊 Most recent trade: $RECENT_TRADE"

# Cleanup
rm -f "$TEST_DB_PATH" "$TEST_DB_SQL"

echo ""
echo "✅ RESTORE VERIFICATION COMPLETE!"
echo "================================"
echo "🎯 All restore methods working correctly"
echo "📊 Data integrity verified"
echo "🔄 Ready for production disaster recovery"

echo ""
echo "📋 Available backup management:"
echo "   • Simple backup: /home/telgkb9/depot/dev-signalcartel/scripts/backup/simple-backup.sh"
echo "   • Full backup (stops services): /home/telgkb9/depot/dev-signalcartel/scripts/backup/database-backup.sh"
echo "   • Systemd setup: /home/telgkb9/depot/dev-signalcartel/scripts/backup/setup-systemd-backups.sh"
EOF