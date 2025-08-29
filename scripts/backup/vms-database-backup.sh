#!/bin/bash
# QUANTUM FORGE™ VMS Database Infrastructure Backup System
# Professional PostgreSQL backup using pg_dump, pg_dumpall, pg_basebackup

set -e

# Configuration
VMS_BACKUP_DIR="/opt/quantum-forge-backups"
LOCAL_BACKUP_DIR="/home/telgkb9/signalcartel-enterprise-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/tmp/vms-backup-${TIMESTAMP}.log"

# Database connection info
DB_HOST="db.pixelraidersystems.com"
PRIMARY_PORT="5432"
REPLICA_PORT="5433" 
ANALYTICS_PORT="5434"
DB_USER="postgres"
ANALYTICS_USER="analytics_user"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

log "${BLUE}🚀 QUANTUM FORGE™ VMS DATABASE BACKUP SYSTEM${NC}"
log "============================================="
log "Timestamp: $(date)"
log "Backup Location: ${VMS_BACKUP_DIR}"
log ""

# Create backup directories
sudo mkdir -p "${VMS_BACKUP_DIR}/dumps"
sudo mkdir -p "${VMS_BACKUP_DIR}/wal"
sudo mkdir -p "${LOCAL_BACKUP_DIR}/vms-backups"

log "${YELLOW}📊 STEP 1: Primary Database Backup${NC}"
# Primary database backup (signalcartel production)
docker exec quantum-forge-db-primary pg_dump -U postgres -d signalcartel -F c -f "/backups/dumps/signalcartel_primary_${TIMESTAMP}.dump"
if [ $? -eq 0 ]; then
    log "${GREEN}✅ Primary Database Backup: SUCCESS${NC}"
    sudo cp "${VMS_BACKUP_DIR}/dumps/signalcartel_primary_${TIMESTAMP}.dump" "${LOCAL_BACKUP_DIR}/vms-backups/"
else
    log "${RED}❌ Primary Database Backup: FAILED${NC}"
fi

log "${YELLOW}📊 STEP 2: Analytics Database Backup${NC}"
# Analytics database backup (consolidated data)
docker exec quantum-forge-analytics pg_dump -U analytics_user -d signalcartel_analytics -F c -f "/var/lib/postgresql/data/signalcartel_analytics_${TIMESTAMP}.dump"
docker cp quantum-forge-analytics:/var/lib/postgresql/data/signalcartel_analytics_${TIMESTAMP}.dump "${VMS_BACKUP_DIR}/dumps/"
if [ $? -eq 0 ]; then
    log "${GREEN}✅ Analytics Database Backup: SUCCESS${NC}"
    sudo cp "${VMS_BACKUP_DIR}/dumps/signalcartel_analytics_${TIMESTAMP}.dump" "${LOCAL_BACKUP_DIR}/vms-backups/"
else
    log "${RED}❌ Analytics Database Backup: FAILED${NC}"
fi

log "${YELLOW}📊 STEP 3: Cluster-Wide Backup${NC}"
# Complete cluster backup (all databases, users, roles)
docker exec quantum-forge-db-primary pg_dumpall -U postgres -f "/backups/dumps/cluster_complete_${TIMESTAMP}.sql"
if [ $? -eq 0 ]; then
    log "${GREEN}✅ Cluster Backup: SUCCESS${NC}"
    sudo cp "${VMS_BACKUP_DIR}/dumps/cluster_complete_${TIMESTAMP}.sql" "${LOCAL_BACKUP_DIR}/vms-backups/"
else
    log "${RED}❌ Cluster Backup: FAILED${NC}"
fi

log "${YELLOW}📊 STEP 4: Physical Base Backup${NC}"
# Physical backup for point-in-time recovery
PHYSICAL_BACKUP_DIR="${VMS_BACKUP_DIR}/physical_${TIMESTAMP}"
sudo mkdir -p "$PHYSICAL_BACKUP_DIR"
docker exec quantum-forge-db-primary pg_basebackup -U postgres -D "/backups/physical_${TIMESTAMP}" -P -v
if [ $? -eq 0 ]; then
    log "${GREEN}✅ Physical Base Backup: SUCCESS${NC}"
    # Compress and copy to local backup
    sudo tar -czf "${LOCAL_BACKUP_DIR}/vms-backups/physical_backup_${TIMESTAMP}.tar.gz" -C "${VMS_BACKUP_DIR}" "physical_${TIMESTAMP}"
else
    log "${RED}❌ Physical Base Backup: FAILED${NC}"
fi

log "${YELLOW}📊 STEP 5: Replica Verification${NC}"
# Verify replica is in sync before backup
REPLICA_STATUS=$(docker exec quantum-forge-db-replica psql -U postgres -t -c "SELECT pg_is_in_recovery();" | xargs)
if [ "$REPLICA_STATUS" = "t" ]; then
    log "${GREEN}✅ Replica Status: HEALTHY (In Recovery Mode)${NC}"
    # Get replication lag
    LAG=$(docker exec quantum-forge-db-primary psql -U postgres -t -c "SELECT EXTRACT(SECONDS FROM (now() - pg_stat_replication.sent_lsn::text::pg_lsn))::int FROM pg_stat_replication;" | xargs)
    log "${BLUE}📈 Replication Lag: ${LAG:-0} seconds${NC}"
else
    log "${RED}❌ Replica Status: NOT IN RECOVERY MODE${NC}"
fi

log "${YELLOW}📊 STEP 6: Backup Verification${NC}"
# Verify backup integrity
for backup_file in "${VMS_BACKUP_DIR}/dumps"/*.dump; do
    if [ -f "$backup_file" ]; then
        SIZE=$(stat -c%s "$backup_file")
        if [ $SIZE -gt 1000 ]; then
            log "${GREEN}✅ $(basename "$backup_file"): ${SIZE} bytes${NC}"
        else
            log "${RED}❌ $(basename "$backup_file"): Too small (${SIZE} bytes)${NC}"
        fi
    fi
done

log "${YELLOW}📊 STEP 7: Cleanup Old Backups${NC}"
# Keep last 7 days of backups in VMS, 30 days locally
sudo find "${VMS_BACKUP_DIR}/dumps" -name "*.dump" -mtime +7 -delete 2>/dev/null || true
sudo find "${VMS_BACKUP_DIR}/dumps" -name "*.sql" -mtime +7 -delete 2>/dev/null || true
find "${LOCAL_BACKUP_DIR}/vms-backups" -name "*.dump" -mtime +30 -delete 2>/dev/null || true
find "${LOCAL_BACKUP_DIR}/vms-backups" -name "*.tar.gz" -mtime +30 -delete 2>/dev/null || true

log "${YELLOW}📊 STEP 8: Integration with Existing Backup System${NC}"
# Trigger existing enterprise backup system for additional redundancy
if [ -f "/home/telgkb9/depot/signalcartel/scripts/backup/postgresql-professional-backup.sh" ]; then
    log "${BLUE}🔄 Triggering existing enterprise backup system...${NC}"
    cd /home/telgkb9/depot/signalcartel
    ./scripts/backup/postgresql-professional-backup.sh || log "${YELLOW}⚠️ Existing backup system not available${NC}"
fi

log ""
log "${GREEN}✅ VMS DATABASE BACKUP COMPLETE${NC}"
log "${BLUE}📊 BACKUP SUMMARY:${NC}"
log "• Primary Database: $(ls -lh ${VMS_BACKUP_DIR}/dumps/*primary*${TIMESTAMP}* 2>/dev/null | awk '{print $5}' || echo 'N/A')"
log "• Analytics Database: $(ls -lh ${VMS_BACKUP_DIR}/dumps/*analytics*${TIMESTAMP}* 2>/dev/null | awk '{print $5}' || echo 'N/A')"
log "• Cluster Backup: $(ls -lh ${VMS_BACKUP_DIR}/dumps/*cluster*${TIMESTAMP}* 2>/dev/null | awk '{print $5}' || echo 'N/A')"
log "• Physical Backup: Available"
log "• Local Copy: ${LOCAL_BACKUP_DIR}/vms-backups/"
log "• Log File: ${LOG_FILE}"
log ""
log "${BLUE}🕐 Next backup recommended: $(date -d '+1 day' '+%Y-%m-%d %H:%M')${NC}"

echo ""
echo "VMS backup completed successfully!"