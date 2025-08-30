#!/bin/bash
# Simple backup script for testing - doesn't stop services
# Use this for development/testing, use full script for production

set -euo pipefail

BACKUP_DIR="/home/telgkb9/signalcartel-backups"
DB_PATH="/home/telgkb9/depot/dev-signalcartel/prisma/dev.db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="signalcartel_backup_${TIMESTAMP}"

echo "🧪 SIMPLE BACKUP TEST (no service interruption)"
echo "==============================================="

# Create backup directories
mkdir -p "${BACKUP_DIR}"/{daily,weekly,monthly,emergency,test}
mkdir -p "${BACKUP_DIR}/restore-scripts"

# Simple backup methods (service-friendly)
echo "📋 Method 1: SQLite .backup (while services running)"
sqlite3 "$DB_PATH" ".backup '${BACKUP_DIR}/test/${BACKUP_NAME}.db'"

echo "📋 Method 2: SQL dump"
sqlite3 "$DB_PATH" .dump > "${BACKUP_DIR}/test/${BACKUP_NAME}.sql"

echo "📋 Method 3: File copy" 
cp "$DB_PATH" "${BACKUP_DIR}/test/${BACKUP_NAME}_copy.db"

# Verify backups
echo "🔍 Verifying backup integrity"
if sqlite3 "${BACKUP_DIR}/test/${BACKUP_NAME}.db" "SELECT COUNT(*) FROM sqlite_master;" > /dev/null 2>&1; then
    echo "✅ SQLite backup verified"
else
    echo "❌ SQLite backup failed"
    exit 1
fi

# Show backup info
TRADE_COUNT=$(sqlite3 "${BACKUP_DIR}/test/${BACKUP_NAME}.db" "SELECT COUNT(*) FROM PaperTrade;" 2>/dev/null || echo "0")
STRATEGY_COUNT=$(sqlite3 "${BACKUP_DIR}/test/${BACKUP_NAME}.db" "SELECT COUNT(*) FROM PineStrategy;" 2>/dev/null || echo "0")

echo ""
echo "🎯 BACKUP TEST SUCCESSFUL!"
echo "========================="
echo "📁 Backup location: ${BACKUP_DIR}/test/"
echo "📊 Trades backed up: $TRADE_COUNT"
echo "📊 Strategies backed up: $STRATEGY_COUNT"
echo "📋 Files created:"
echo "   • ${BACKUP_NAME}.db (SQLite backup)"
echo "   • ${BACKUP_NAME}.sql (SQL dump)"  
echo "   • ${BACKUP_NAME}_copy.db (file copy)"

# Show file sizes
du -h "${BACKUP_DIR}/test/${BACKUP_NAME}"* | sed 's/^/   • /'

echo ""
echo "✅ Ready for production backup system with systemd!"
EOF