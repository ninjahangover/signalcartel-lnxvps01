#!/bin/bash
# Database backup script for SignalCartel
# Handles both PostgreSQL (via pg_dump) and SQLite databases

set -euo pipefail

# Configuration
BACKUP_ROOT="/home/telgkb9/signalcartel-db-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE=$(date +"%Y-%m-%d")

# PostgreSQL configuration (from Docker container)
PG_CONTAINER="signalcartel-warehouse"
PG_USER="warehouse_user"
PG_PASSWORD="quantum_forge_warehouse_2024"
PG_PORT="5433"

# List of PostgreSQL databases to backup
PG_DATABASES=("signalcartel" "marketdata" "quantum_forge_warehouse")

# SQLite database paths (if they exist)
SQLITE_MAIN_DB="/home/telgkb9/depot/dev-signalcartel/prisma/dev.db"
SQLITE_MARKET_DB="/home/telgkb9/depot/dev-signalcartel/prisma/market-data.db"

# Create backup directory for today
BACKUP_DIR="${BACKUP_ROOT}/${DATE}"
mkdir -p "${BACKUP_DIR}"

echo "🔄 SignalCartel Database Backup"
echo "================================"
echo "📅 Date: ${DATE}"
echo "⏰ Time: $(date +"%H:%M:%S")"
echo "📁 Backup directory: ${BACKUP_DIR}"
echo ""

# Function to backup PostgreSQL databases
backup_postgresql() {
    echo "🐘 Backing up PostgreSQL databases..."
    
    # Check if container is running
    if ! docker ps --format "{{.Names}}" | grep -q "^${PG_CONTAINER}$"; then
        echo "   ❌ PostgreSQL container '$PG_CONTAINER' not running!"
        return 1
    fi
    
    # Backup each database
    for db in "${PG_DATABASES[@]}"; do
        echo ""
        echo "   📊 Backing up database: $db"
        
        local backup_file="${BACKUP_DIR}/postgresql_${db}_${TIMESTAMP}.sql"
        local backup_custom="${BACKUP_DIR}/postgresql_${db}_${TIMESTAMP}.dump"
        
        # Create SQL format backup (human-readable, good for version control)
        echo "   📝 Creating SQL format backup for $db..."
        if docker exec "$PG_CONTAINER" pg_dump \
            -U "$PG_USER" \
            -d "$db" \
            --verbose \
            --clean \
            --if-exists \
            --no-owner \
            --no-privileges \
            > "${backup_file}" 2>/dev/null; then
            
            local size=$(du -h "${backup_file}" | cut -f1)
            echo "   ✅ SQL backup created for $db (${size})"
        else
            echo "   ❌ SQL backup failed for $db!"
            continue
        fi
        
        # Create custom format backup (compressed, supports parallel restore)
        echo "   📦 Creating custom format backup for $db..."
        if docker exec "$PG_CONTAINER" pg_dump \
            -U "$PG_USER" \
            -d "$db" \
            --format=custom \
            --verbose \
            --clean \
            --if-exists \
            --no-owner \
            --no-privileges \
            > "${backup_custom}" 2>/dev/null; then
            
            local size=$(du -h "${backup_custom}" | cut -f1)
            echo "   ✅ Custom format backup created for $db (${size})"
            
            # Create symlinks to latest backups
            ln -sf "${backup_file}" "${BACKUP_DIR}/postgresql_${db}_latest.sql"
            ln -sf "${backup_custom}" "${BACKUP_DIR}/postgresql_${db}_latest.dump"
        else
            echo "   ❌ Custom format backup failed for $db!"
        fi
    done
    
    # Also create a combined backup of all databases
    echo ""
    echo "   🗄️  Creating combined backup of all databases..."
    if docker exec "$PG_CONTAINER" pg_dumpall \
        -U "$PG_USER" \
        --clean \
        --if-exists \
        --no-role-passwords \
        > "${BACKUP_DIR}/postgresql_all_databases_${TIMESTAMP}.sql" 2>/dev/null; then
        
        local size=$(du -h "${BACKUP_DIR}/postgresql_all_databases_${TIMESTAMP}.sql" | cut -f1)
        echo "   ✅ Combined backup created (${size})"
        ln -sf "${BACKUP_DIR}/postgresql_all_databases_${TIMESTAMP}.sql" "${BACKUP_DIR}/postgresql_all_latest.sql"
    else
        echo "   ⚠️  Combined backup failed (this is okay if individual backups succeeded)"
    fi
}

# Function to backup SQLite database
backup_sqlite() {
    local db_path="$1"
    local db_name="$2"
    
    if [ ! -f "$db_path" ]; then
        echo "   ⚠️  ${db_name} not found at ${db_path}, skipping..."
        return
    fi
    
    local backup_file="${BACKUP_DIR}/sqlite_${db_name}_${TIMESTAMP}.db"
    
    echo "   📦 Backing up ${db_name}..."
    
    # Use SQLite backup command (safe for running databases)
    sqlite3 "$db_path" ".backup '${backup_file}'"
    
    # Verify the backup
    if sqlite3 "${backup_file}" "SELECT COUNT(*) FROM sqlite_master;" > /dev/null 2>&1; then
        local size=$(du -h "${backup_file}" | cut -f1)
        echo "   ✅ ${db_name} backed up successfully (${size})"
        
        # Create a symlink to latest backup
        ln -sf "${backup_file}" "${BACKUP_DIR}/sqlite_${db_name}_latest.db"
        
        # Also create SQL dump for easier inspection
        sqlite3 "$db_path" .dump > "${BACKUP_DIR}/sqlite_${db_name}_${TIMESTAMP}.sql"
    else
        echo "   ❌ ${db_name} backup verification failed!"
        rm -f "${backup_file}"
        return 1
    fi
}

# Backup PostgreSQL
backup_postgresql

# Backup SQLite databases if they still exist
echo ""
echo "💾 Checking for SQLite databases..."
if [ -f "$SQLITE_MAIN_DB" ]; then
    backup_sqlite "$SQLITE_MAIN_DB" "signalcartel"
fi

if [ -f "$SQLITE_MARKET_DB" ]; then
    backup_sqlite "$SQLITE_MARKET_DB" "marketdata"
fi

# Create a compressed archive of today's backups
echo ""
echo "📦 Creating compressed archive..."
cd "${BACKUP_ROOT}"
tar -czf "${DATE}_${TIMESTAMP}.tar.gz" "${DATE}/"
echo "   ✅ Archive created: ${DATE}_${TIMESTAMP}.tar.gz"

# Clean up old backups (keep last 7 days of directories, 30 days of archives)
echo ""
echo "🧹 Cleaning up old backups..."
find "${BACKUP_ROOT}" -maxdepth 1 -type d -name "????-??-??" -mtime +7 -exec rm -rf {} \; 2>/dev/null || true
find "${BACKUP_ROOT}" -maxdepth 1 -type f -name "*.tar.gz" -mtime +30 -exec rm -f {} \; 2>/dev/null || true
echo "   ✅ Cleanup complete"

# Show summary
echo ""
echo "📊 Backup Summary"
echo "=================="
echo "📁 Backup location: ${BACKUP_DIR}"
echo "🗜️  Archive: ${BACKUP_ROOT}/${DATE}_${TIMESTAMP}.tar.gz"
echo ""
echo "📋 Backups created:"
ls -lh "${BACKUP_DIR}"/*.{sql,dump,db} 2>/dev/null | awk '{print "   • " $9 " (" $5 ")"}' || echo "   No backups created"

echo ""
echo "🔄 Restore Commands:"
echo "=================="
echo "PostgreSQL (individual databases from custom format):"
for db in "${PG_DATABASES[@]}"; do
    echo "   docker exec -i $PG_CONTAINER pg_restore -U $PG_USER -d $db --clean --if-exists < ${BACKUP_DIR}/postgresql_${db}_latest.dump"
done
echo ""
echo "PostgreSQL (all databases from combined backup):"
echo "   docker exec -i $PG_CONTAINER psql -U $PG_USER < ${BACKUP_DIR}/postgresql_all_latest.sql"
echo ""
echo "SQLite (if needed):"
echo "   sqlite3 /path/to/new.db < ${BACKUP_DIR}/sqlite_signalcartel_latest.sql"

echo ""
echo "💡 Add to crontab for automated backups:"
echo "   0 */6 * * * ${BACKUP_ROOT}/../scripts/backup/simple-db-backup.sh"
echo ""
echo "✅ Backup complete!"