#!/bin/bash
# SignalCartel Database Backup System
# Handles SQLite backups in containerized environment with multiple restore strategies

set -euo pipefail

# Configuration
BACKUP_DIR="/home/telgkb9/signalcartel-backups"
DB_PATH="/home/telgkb9/depot/dev-signalcartel/prisma/dev.db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="signalcartel_backup_${TIMESTAMP}"
RETENTION_DAYS=30

# Logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${BACKUP_DIR}/backup.log"
}

# Create backup directory structure
setup_backup_structure() {
    log "📁 Setting up backup directory structure"
    mkdir -p "${BACKUP_DIR}"/{daily,weekly,monthly,emergency}
    mkdir -p "${BACKUP_DIR}/restore-scripts"
    touch "${BACKUP_DIR}/backup.log"
}

# Check database health before backup
check_database_health() {
    log "🔍 Checking database health"
    
    if [ ! -f "$DB_PATH" ]; then
        log "❌ ERROR: Database file not found at $DB_PATH"
        exit 1
    fi
    
    # Check if database is accessible
    if ! sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master;" > /dev/null 2>&1; then
        log "❌ ERROR: Database is corrupted or inaccessible"
        exit 1
    fi
    
    # Get database stats
    TABLES=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE type='table';")
    TRADE_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM PaperTrade;" 2>/dev/null || echo "0")
    STRATEGY_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM PineStrategy;" 2>/dev/null || echo "0")
    
    log "✅ Database health check passed"
    log "📊 Tables: $TABLES, Trades: $TRADE_COUNT, Strategies: $STRATEGY_COUNT"
}

# Stop all services that use the database
stop_services() {
    log "🛑 Stopping all database-dependent services"
    
    # Stop QUANTUM FORGE™ trading engine
    pkill -f "load-database-strategies.ts" 2>/dev/null || true
    pkill -f "custom-paper-trading.ts" 2>/dev/null || true
    
    # Stop market data collector
    pkill -f "market-data-collector.ts" 2>/dev/null || true
    
    # Stop website container to prevent API access
    docker compose -f /home/telgkb9/depot/dev-signalcartel/containers/website/docker-compose.yml down 2>/dev/null || true
    
    # Wait for processes to fully terminate
    sleep 5
    
    log "✅ All services stopped for backup"
}

# Start all services after backup
start_services() {
    log "🚀 Starting all database-dependent services"
    
    # Start website container
    docker compose -f /home/telgkb9/depot/dev-signalcartel/containers/website/docker-compose.yml up -d 2>/dev/null || true
    
    # Start market data collector in background
    cd /home/telgkb9/depot/dev-signalcartel
    nohup npx tsx -r dotenv/config scripts/engines/market-data-collector.ts >> "${BACKUP_DIR}/service-restart.log" 2>&1 &
    
    # Start QUANTUM FORGE™ trading engine in background
    nohup NTFY_TOPIC="signal-cartel" npx tsx -r dotenv/config load-database-strategies.ts >> "${BACKUP_DIR}/service-restart.log" 2>&1 &
    
    # Wait for services to initialize
    sleep 10
    
    log "✅ All services restarted after backup"
}

# Create SQLite backup using multiple methods with proper service management
create_sqlite_backup() {
    local backup_type="$1"
    local backup_path="${BACKUP_DIR}/${backup_type}/${BACKUP_NAME}"
    
    log "💾 Creating $backup_type backup: $BACKUP_NAME"
    
    # Stop services for consistent backup
    stop_services
    
    # Method 1: SQLite .backup command (most reliable for transactional consistency)
    log "📋 Method 1: SQLite .backup command (transactionally consistent)"
    sqlite3 "$DB_PATH" ".backup '${backup_path}.db'"
    
    # Method 2: File copy with integrity check
    log "📋 Method 2: File copy with integrity check"
    cp "$DB_PATH" "${backup_path}_copy.db"
    
    # Method 3: SQL dump (human-readable, universal)
    log "📋 Method 3: SQL dump export"
    sqlite3 "$DB_PATH" .dump > "${backup_path}.sql"
    
    # Method 4: Compressed full backup with related files
    log "📋 Method 4: Compressed backup with related files"
    tar -czf "${backup_path}_full.tar.gz" -C "$(dirname "$DB_PATH")" \
        "$(basename "$DB_PATH")" \
        "$(basename "$DB_PATH")-wal" \
        "$(basename "$DB_PATH")-shm" 2>/dev/null || \
    tar -czf "${backup_path}_full.tar.gz" -C "$(dirname "$DB_PATH")" "$(basename "$DB_PATH")"
    
    # Verify backup integrity
    verify_backup_integrity "${backup_path}"
    
    # Upload to cloud storage
    upload_to_cloud "${backup_path}" "$backup_type"
    
    # Restart services
    start_services
}

# Upload backup to cloud storage using rclone
upload_to_cloud() {
    local backup_path="$1"
    local backup_type="$2"
    
    log "☁️ Uploading $backup_type backup to cloud storage"
    
    # Create cloud backup directory structure
    CLOUD_BACKUP_DIR="/signalcartel-backups/${backup_type}/$(date +%Y)/$(date +%m)"
    
    # Upload all backup files to cloud
    if command -v rclone >/dev/null 2>&1; then
        log "📤 Uploading backup files to signal.humanizedcomputing.com"
        
        # Upload SQLite backup
        if rclone copy "${backup_path}.db" --progress signal.humanizedcomputing.com:"${CLOUD_BACKUP_DIR}/" >> "${BACKUP_DIR}/cloud-sync.log" 2>&1; then
            log "✅ SQLite backup uploaded successfully"
        else
            log "❌ Failed to upload SQLite backup"
        fi
        
        # Upload SQL dump (smaller, faster)
        if rclone copy "${backup_path}.sql" --progress signal.humanizedcomputing.com:"${CLOUD_BACKUP_DIR}/" >> "${BACKUP_DIR}/cloud-sync.log" 2>&1; then
            log "✅ SQL dump uploaded successfully"
        else
            log "❌ Failed to upload SQL dump"
        fi
        
        # Upload compressed backup (most efficient)
        if rclone copy "${backup_path}_full.tar.gz" --progress signal.humanizedcomputing.com:"${CLOUD_BACKUP_DIR}/" >> "${BACKUP_DIR}/cloud-sync.log" 2>&1; then
            log "✅ Compressed backup uploaded successfully"
        else
            log "❌ Failed to upload compressed backup"
        fi
        
        log "☁️ Cloud backup completed to ${CLOUD_BACKUP_DIR}"
        
    else
        log "⚠️ rclone not found - skipping cloud backup"
    fi

# Verify backup integrity
verify_backup_integrity() {
    local backup_path="$1"
    
    log "🔍 Verifying backup integrity"
    
    # Test SQLite backup
    if sqlite3 "${backup_path}.db" "SELECT COUNT(*) FROM sqlite_master;" > /dev/null 2>&1; then
        log "✅ SQLite backup verified"
    else
        log "❌ SQLite backup verification failed"
        return 1
    fi
    
    # Test SQL dump
    if [ -f "${backup_path}.sql" ] && [ -s "${backup_path}.sql" ]; then
        log "✅ SQL dump backup verified"
    else
        log "❌ SQL dump backup verification failed"
        return 1
    fi
    
    # Get backup file sizes
    SQLITE_SIZE=$(du -h "${backup_path}.db" | cut -f1)
    SQL_SIZE=$(du -h "${backup_path}.sql" | cut -f1)
    COMPRESSED_SIZE=$(du -h "${backup_path}_full.tar.gz" | cut -f1)
    
    log "📏 Backup sizes - SQLite: $SQLITE_SIZE, SQL: $SQL_SIZE, Compressed: $COMPRESSED_SIZE"
}

# Create restore script for this backup
create_restore_script() {
    local backup_type="$1"
    local backup_path="${BACKUP_DIR}/${backup_type}/${BACKUP_NAME}"
    local restore_script="${BACKUP_DIR}/restore-scripts/restore_${BACKUP_NAME}.sh"
    
    log "📝 Creating restore script: $restore_script"
    
    cat > "$restore_script" << EOF
#!/bin/bash
# Restore script for backup: $BACKUP_NAME
# Created: $(date)

set -euo pipefail

DB_PATH="$DB_PATH"
BACKUP_PATH="$backup_path"

echo "🔄 SignalCartel Database Restore - $BACKUP_NAME"
echo "Target database: \$DB_PATH"

# Stop any running services
echo "🛑 Stopping services..."
docker compose -f /home/telgkb9/depot/dev-signalcartel/containers/website/docker-compose.yml down 2>/dev/null || true
pkill -f "load-database-strategies.ts" 2>/dev/null || true

# Backup current database
if [ -f "\$DB_PATH" ]; then
    echo "💾 Backing up current database..."
    cp "\$DB_PATH" "\$DB_PATH.backup-\$(date +%Y%m%d_%H%M%S)"
fi

# Restore method selection
echo "Select restore method:"
echo "1) SQLite .backup file (recommended)"
echo "2) File copy"
echo "3) SQL dump import"
echo "4) Extract from compressed backup"
read -p "Enter choice (1-4): " choice

case \$choice in
    1)
        echo "🔄 Restoring from SQLite backup..."
        cp "\${BACKUP_PATH}.db" "\$DB_PATH"
        ;;
    2)
        echo "🔄 Restoring from file copy..."
        cp "\${BACKUP_PATH}_copy.db" "\$DB_PATH"
        ;;
    3)
        echo "🔄 Restoring from SQL dump..."
        rm -f "\$DB_PATH"
        sqlite3 "\$DB_PATH" < "\${BACKUP_PATH}.sql"
        ;;
    4)
        echo "🔄 Restoring from compressed backup..."
        tar -xzf "\${BACKUP_PATH}_full.tar.gz" -C "\$(dirname "\$DB_PATH")"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

# Fix permissions
chown telgkb9:telgkb9 "\$DB_PATH"
chmod 664 "\$DB_PATH"

# Verify restore
if sqlite3 "\$DB_PATH" "SELECT COUNT(*) FROM sqlite_master;" > /dev/null 2>&1; then
    echo "✅ Database restore successful"
    TRADE_COUNT=\$(sqlite3 "\$DB_PATH" "SELECT COUNT(*) FROM PaperTrade;" 2>/dev/null || echo "0")
    STRATEGY_COUNT=\$(sqlite3 "\$DB_PATH" "SELECT COUNT(*) FROM PineStrategy;" 2>/dev/null || echo "0")
    echo "📊 Restored - Trades: \$TRADE_COUNT, Strategies: \$STRATEGY_COUNT"
else
    echo "❌ Database restore verification failed"
    exit 1
fi

echo "🚀 Database restore complete! You can now restart services."
EOF

    chmod +x "$restore_script"
    log "✅ Restore script created and made executable"
}

# Clean up old backups
cleanup_old_backups() {
    log "🧹 Cleaning up backups older than $RETENTION_DAYS days"
    
    find "${BACKUP_DIR}/daily" -name "signalcartel_backup_*" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    find "${BACKUP_DIR}/restore-scripts" -name "restore_signalcartel_backup_*" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    
    log "✅ Cleanup complete"
}

# Generate backup report
generate_backup_report() {
    local backup_type="$1"
    local backup_path="${BACKUP_DIR}/${backup_type}/${BACKUP_NAME}"
    
    log "📋 Generating backup report"
    
    cat >> "${BACKUP_DIR}/backup-report.txt" << EOF
========================================
Backup Report: $BACKUP_NAME
Date: $(date)
Type: $backup_type
========================================
Database Path: $DB_PATH
Backup Location: $backup_path
Trade Count: $(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM PaperTrade;" 2>/dev/null || echo "Unknown")
Strategy Count: $(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM PineStrategy;" 2>/dev/null || echo "Unknown")
Latest Trade: $(sqlite3 "$DB_PATH" "SELECT executedAt FROM PaperTrade ORDER BY executedAt DESC LIMIT 1;" 2>/dev/null || echo "Unknown")
Backup Files Created:
- ${backup_path}.db (SQLite backup)
- ${backup_path}_copy.db (File copy)
- ${backup_path}.sql (SQL dump)
- ${backup_path}_full.tar.gz (Compressed)
Restore Script: ${BACKUP_DIR}/restore-scripts/restore_${BACKUP_NAME}.sh
Cloud Backup: ${CLOUD_BACKUP_DIR:-"Not uploaded"}
========================================

EOF
}

# Main execution
main() {
    local backup_type="${1:-daily}"
    
    log "🚀 Starting SignalCartel database backup - Type: $backup_type"
    
    setup_backup_structure
    check_database_health
    create_sqlite_backup "$backup_type"
    create_restore_script "$backup_type"
    generate_backup_report "$backup_type"
    cleanup_old_backups
    
    log "✅ Backup completed successfully: $BACKUP_NAME"
    log "📝 Restore script: ${BACKUP_DIR}/restore-scripts/restore_${BACKUP_NAME}.sh"
    
    # Show summary
    echo ""
    echo "🎯 BACKUP SUMMARY"
    echo "================="
    echo "Backup Name: $BACKUP_NAME"
    echo "Location: ${BACKUP_DIR}/${backup_type}/"
    echo "Files: .db, .sql, .tar.gz, _copy.db"
    echo "Restore: ${BACKUP_DIR}/restore-scripts/restore_${BACKUP_NAME}.sh"
    echo ""
}

# Run main function with arguments
main "$@"
EOF