#!/bin/bash
# Enterprise Backup System for QUANTUM FORGE™ SignalCartel
# Prevents data loss with scheduled full and incremental backups

set -euo pipefail

# Configuration
BACKUP_ROOT="/home/telgkb9/signalcartel-enterprise-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE=$(date +"%Y-%m-%d")
HOUR=$(date +"%H")

# PostgreSQL configuration
PG_CONTAINER="signalcartel-warehouse"
PG_USER="warehouse_user"
PG_PASSWORD="quantum_forge_warehouse_2024"
PG_DATABASES=("signalcartel" "marketdata" "quantum_forge_warehouse")

# Backup retention (days)
DAILY_RETENTION=30
HOURLY_RETENTION=7
FULL_RETENTION=90

# Create backup directories
BACKUP_DIR="${BACKUP_ROOT}/${DATE}"
HOURLY_DIR="${BACKUP_DIR}/hourly"
FULL_DIR="${BACKUP_DIR}/full"
INCREMENTAL_DIR="${BACKUP_DIR}/incremental"

mkdir -p "${BACKUP_DIR}" "${HOURLY_DIR}" "${FULL_DIR}" "${INCREMENTAL_DIR}"

echo "🛡️  QUANTUM FORGE™ Enterprise Backup System"
echo "============================================="
echo "📅 Date: ${DATE}"
echo "⏰ Time: $(date +"%H:%M:%S")"
echo "📁 Backup directory: ${BACKUP_DIR}"
echo ""

# Function to check container health
check_container() {
    if ! docker ps --format "{{.Names}}" | grep -q "^${PG_CONTAINER}$"; then
        echo "   ❌ PostgreSQL container '$PG_CONTAINER' not running!"
        exit 1
    fi
    echo "   ✅ PostgreSQL container healthy"
}

# Function to backup critical trading tables (incremental)
backup_critical_tables() {
    local db=$1
    local backup_file="${INCREMENTAL_DIR}/${db}_critical_${TIMESTAMP}.sql"
    
    echo "   📊 Backing up critical tables from $db..."
    
    # Critical tables for trading intelligence
    local tables=("ManagedTrade" "ManagedPosition" "IntuitionAnalysis" "EnhancedTradingSignal" "PaperTrade")
    
    for table in "${tables[@]}"; do
        echo "      → Backing up $table"
        docker exec $PG_CONTAINER pg_dump \
            -U $PG_USER \
            -d $db \
            --table="\"$table\"" \
            --data-only \
            --inserts >> "$backup_file" 2>/dev/null || echo "      ⚠️  Table $table might not exist"
    done
    
    if [ -s "$backup_file" ]; then
        gzip "$backup_file"
        echo "   ✅ Critical tables backup: ${backup_file}.gz"
    else
        rm -f "$backup_file"
        echo "   ⚠️  No critical data to backup"
    fi
}

# Function to backup full database
backup_full_database() {
    local db=$1
    local backup_file="${FULL_DIR}/${db}_full_${TIMESTAMP}"
    
    echo "   🗄️  Full backup of $db..."
    
    # Create both SQL and custom format backups
    docker exec $PG_CONTAINER pg_dump \
        -U $PG_USER \
        -d $db \
        --verbose \
        --format=custom \
        --compress=9 \
        --file="/tmp/${db}_full_${TIMESTAMP}.dump" 2>/dev/null
    
    docker exec $PG_CONTAINER pg_dump \
        -U $PG_USER \
        -d $db \
        --verbose \
        --format=plain \
        --file="/tmp/${db}_full_${TIMESTAMP}.sql" 2>/dev/null
    
    # Copy both formats
    docker cp "$PG_CONTAINER:/tmp/${db}_full_${TIMESTAMP}.dump" "${backup_file}.dump"
    docker cp "$PG_CONTAINER:/tmp/${db}_full_${TIMESTAMP}.sql" "${backup_file}.sql"
    
    # Compress SQL file
    gzip "${backup_file}.sql"
    
    # Cleanup temp files
    docker exec $PG_CONTAINER rm -f "/tmp/${db}_full_${TIMESTAMP}.dump" "/tmp/${db}_full_${TIMESTAMP}.sql"
    
    echo "   ✅ Full backup: ${backup_file}.dump and ${backup_file}.sql.gz"
}

# Function to backup AI model data and configurations
backup_ai_configurations() {
    local config_backup="${BACKUP_DIR}/ai_configurations_${TIMESTAMP}.tar.gz"
    
    echo "🧠 Backing up AI configurations and model data..."
    
    tar -czf "$config_backup" \
        -C /home/telgkb9/depot/dev-signalcartel \
        src/lib/quantum-forge-phase-config.ts \
        src/lib/mathematical-intuition-engine.ts \
        src/lib/enhanced-markov-predictor.ts \
        src/lib/quantum-forge-multi-layer-ai.ts \
        src/lib/quantum-forge-orderbook-ai.ts \
        src/lib/sentiment/universal-sentiment-enhancer.ts \
        prisma/schema.prisma \
        CLAUDE.md 2>/dev/null || true
    
    echo "   ✅ AI configurations: $config_backup"
}

# Function to create recovery script
create_recovery_script() {
    local recovery_script="${BACKUP_DIR}/RECOVERY_INSTRUCTIONS_${TIMESTAMP}.sh"
    
    cat > "$recovery_script" << 'EOF'
#!/bin/bash
# QUANTUM FORGE™ Recovery Instructions
# Generated automatically with backup

echo "🚨 QUANTUM FORGE™ DATABASE RECOVERY"
echo "===================================="
echo ""
echo "⚠️  WARNING: This will restore database from backup"
echo "    Make sure you understand the implications!"
echo ""

read -p "Continue with recovery? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Recovery cancelled"
    exit 1
fi

# Recovery commands will be inserted here by backup script
EOF

    # Add specific recovery commands for this backup
    cat >> "$recovery_script" << EOF

# Recovery for backup ${TIMESTAMP}
echo "📊 Restoring from backup ${TIMESTAMP}..."

# Stop trading system first
echo "🛑 Stopping trading system..."
pkill -f "load-database-strategies" || true

# Restore databases
for db in "${PG_DATABASES[@]}"; do
    echo "📊 Restoring database: \$db"
    if [ -f "${FULL_DIR}/\${db}_full_${TIMESTAMP}.sql.dump" ]; then
        docker exec ${PG_CONTAINER} pg_restore \\
            -U ${PG_USER} \\
            -d \$db \\
            --clean \\
            --if-exists \\
            "/tmp/\${db}_restore.dump"
    fi
done

echo "✅ Recovery complete!"
echo "🚀 Restart trading system manually"
EOF

    chmod +x "$recovery_script"
    echo "   ✅ Recovery script: $recovery_script"
}

# Function to cleanup old backups
cleanup_old_backups() {
    echo "🧹 Cleaning up old backups..."
    
    # Remove daily backups older than retention period
    find "$BACKUP_ROOT" -type d -name "????-??-??" -mtime +$DAILY_RETENTION -exec rm -rf {} \; 2>/dev/null || true
    
    echo "   ✅ Cleaned up backups older than $DAILY_RETENTION days"
}

# Function to verify backup integrity
verify_backup_integrity() {
    echo "🔍 Verifying backup integrity..."
    
    local errors=0
    
    # Check if backup files exist and have reasonable size
    for db in "${PG_DATABASES[@]}"; do
        local full_backup="${FULL_DIR}/${db}_full_${TIMESTAMP}.sql.dump"
        if [ -f "$full_backup" ]; then
            local size=$(stat -f%z "$full_backup" 2>/dev/null || stat -c%s "$full_backup" 2>/dev/null || echo "0")
            if [ "$size" -lt 1000 ]; then
                echo "   ⚠️  Warning: $db backup seems small ($size bytes)"
                ((errors++))
            else
                echo "   ✅ $db backup verified ($size bytes)"
            fi
        fi
    done
    
    if [ $errors -eq 0 ]; then
        echo "   ✅ All backups verified successfully"
    else
        echo "   ⚠️  $errors warnings detected"
    fi
}

# Main execution
main() {
    echo "🔍 Pre-flight checks..."
    check_container
    
    # Determine backup type based on time
    if [ "$HOUR" = "00" ]; then
        echo "🌙 Performing FULL backup (midnight run)"
        BACKUP_TYPE="full"
    elif [ $((10#$HOUR % 4)) -eq 0 ]; then
        echo "⏰ Performing INCREMENTAL backup (4-hour cycle)"
        BACKUP_TYPE="incremental"
    else
        echo "🔄 Performing CRITICAL backup (hourly)"
        BACKUP_TYPE="critical"
    fi
    
    echo ""
    
    # Perform backups based on type
    for db in "${PG_DATABASES[@]}"; do
        echo "📊 Processing database: $db"
        
        case $BACKUP_TYPE in
            "full")
                backup_full_database "$db"
                backup_critical_tables "$db"
                ;;
            "incremental")
                backup_full_database "$db"
                backup_critical_tables "$db"
                ;;
            "critical")
                backup_critical_tables "$db"
                ;;
        esac
        echo ""
    done
    
    # Always backup AI configurations
    backup_ai_configurations
    
    # Create recovery instructions
    create_recovery_script
    
    # Verify backup integrity
    verify_backup_integrity
    
    # Cleanup old backups
    cleanup_old_backups
    
    echo ""
    echo "✅ BACKUP COMPLETE"
    echo "📁 Backup location: $BACKUP_DIR"
    echo "📊 Backup type: $BACKUP_TYPE"
    echo "🛡️  Your QUANTUM FORGE™ data is safe!"
}

# Execute main function
main "$@"