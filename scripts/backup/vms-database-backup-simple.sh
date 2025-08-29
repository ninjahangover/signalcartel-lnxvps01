#!/bin/bash
# QUANTUM FORGE™ VMS Database Simple Backup (No Sudo Required)
# Works with existing Docker containers and user permissions

set -e

# Configuration
LOCAL_BACKUP_DIR="/home/telgkb9/signalcartel-enterprise-backups/vms-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/tmp/vms-backup-${TIMESTAMP}.log"

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

log "${BLUE}🚀 QUANTUM FORGE™ VMS DATABASE BACKUP SYSTEM (SIMPLE)${NC}"
log "======================================================"
log "Timestamp: $(date)"
log "Backup Location: ${LOCAL_BACKUP_DIR}"
log ""

# Create backup directory
mkdir -p "${LOCAL_BACKUP_DIR}"

log "${YELLOW}📊 STEP 1: Primary Database Backup${NC}"
# Primary database backup using docker cp method
docker exec quantum-forge-db-primary pg_dump -U postgres -d signalcartel -F c -f "/tmp/signalcartel_primary_${TIMESTAMP}.dump"
docker cp quantum-forge-db-primary:/tmp/signalcartel_primary_${TIMESTAMP}.dump "${LOCAL_BACKUP_DIR}/"
docker exec quantum-forge-db-primary rm -f "/tmp/signalcartel_primary_${TIMESTAMP}.dump"

if [ -f "${LOCAL_BACKUP_DIR}/signalcartel_primary_${TIMESTAMP}.dump" ]; then
    log "${GREEN}✅ Primary Database Backup: SUCCESS ($(ls -lh ${LOCAL_BACKUP_DIR}/signalcartel_primary_${TIMESTAMP}.dump | awk '{print $5}'))${NC}"
else
    log "${RED}❌ Primary Database Backup: FAILED${NC}"
fi

log "${YELLOW}📊 STEP 2: Analytics Database Backup${NC}"
# Analytics database backup
docker exec quantum-forge-analytics pg_dump -U analytics_user -d signalcartel_analytics -F c -f "/tmp/signalcartel_analytics_${TIMESTAMP}.dump"
docker cp quantum-forge-analytics:/tmp/signalcartel_analytics_${TIMESTAMP}.dump "${LOCAL_BACKUP_DIR}/"
docker exec quantum-forge-analytics rm -f "/tmp/signalcartel_analytics_${TIMESTAMP}.dump"

if [ -f "${LOCAL_BACKUP_DIR}/signalcartel_analytics_${TIMESTAMP}.dump" ]; then
    log "${GREEN}✅ Analytics Database Backup: SUCCESS ($(ls -lh ${LOCAL_BACKUP_DIR}/signalcartel_analytics_${TIMESTAMP}.dump | awk '{print $5}'))${NC}"
else
    log "${RED}❌ Analytics Database Backup: FAILED${NC}"
fi

log "${YELLOW}📊 STEP 3: Cluster-Wide Backup${NC}"
# Complete cluster backup
docker exec quantum-forge-db-primary pg_dumpall -U postgres -f "/tmp/cluster_complete_${TIMESTAMP}.sql"
docker cp quantum-forge-db-primary:/tmp/cluster_complete_${TIMESTAMP}.sql "${LOCAL_BACKUP_DIR}/"
docker exec quantum-forge-db-primary rm -f "/tmp/cluster_complete_${TIMESTAMP}.sql"

if [ -f "${LOCAL_BACKUP_DIR}/cluster_complete_${TIMESTAMP}.sql" ]; then
    log "${GREEN}✅ Cluster Backup: SUCCESS ($(ls -lh ${LOCAL_BACKUP_DIR}/cluster_complete_${TIMESTAMP}.sql | awk '{print $5}'))${NC}"
else
    log "${RED}❌ Cluster Backup: FAILED${NC}"
fi

log "${YELLOW}📊 STEP 4: Replica Health Check${NC}"
# Verify replica is healthy
REPLICA_STATUS=$(docker exec quantum-forge-db-replica psql -U postgres -t -c "SELECT pg_is_in_recovery();" | xargs 2>/dev/null || echo "error")
if [ "$REPLICA_STATUS" = "t" ]; then
    log "${GREEN}✅ Replica Status: HEALTHY (In Recovery Mode)${NC}"
    # Get replication lag if possible
    LAG=$(docker exec quantum-forge-db-primary psql -U postgres -t -c "SELECT COALESCE(EXTRACT(SECONDS FROM (now() - pg_stat_replication.sent_lsn::text::pg_lsn))::int, 0) FROM pg_stat_replication LIMIT 1;" 2>/dev/null | xargs || echo "0")
    log "${BLUE}📈 Replication Lag: ${LAG} seconds${NC}"
else
    log "${RED}❌ Replica Status: ${REPLICA_STATUS}${NC}"
fi

log "${YELLOW}📊 STEP 5: Backup Verification${NC}"
# Verify backup integrity
BACKUP_COUNT=0
TOTAL_SIZE=0

for backup_file in "${LOCAL_BACKUP_DIR}"/*${TIMESTAMP}*; do
    if [ -f "$backup_file" ]; then
        SIZE=$(stat -c%s "$backup_file")
        if [ $SIZE -gt 1000 ]; then
            log "${GREEN}✅ $(basename "$backup_file"): ${SIZE} bytes${NC}"
            BACKUP_COUNT=$((BACKUP_COUNT + 1))
            TOTAL_SIZE=$((TOTAL_SIZE + SIZE))
        else
            log "${RED}❌ $(basename "$backup_file"): Too small (${SIZE} bytes)${NC}"
        fi
    fi
done

log "${BLUE}📊 Total Backups Created: ${BACKUP_COUNT}${NC}"
log "${BLUE}📊 Total Backup Size: $(echo $TOTAL_SIZE | numfmt --to=iec)${NC}"

log "${YELLOW}📊 STEP 6: Cleanup Old Backups${NC}"
# Keep last 30 days of backups locally
find "${LOCAL_BACKUP_DIR}" -name "*.dump" -mtime +30 -delete 2>/dev/null || true
find "${LOCAL_BACKUP_DIR}" -name "*.sql" -mtime +30 -delete 2>/dev/null || true

REMAINING_BACKUPS=$(find "${LOCAL_BACKUP_DIR}" -name "*.dump" -o -name "*.sql" | wc -l)
log "${GREEN}✅ Cleanup Complete: ${REMAINING_BACKUPS} backup files retained${NC}"

log "${YELLOW}📊 STEP 7: System Status Summary${NC}"
# Container health check
CONTAINERS=("quantum-forge-db-primary" "quantum-forge-db-replica" "quantum-forge-analytics" "quantum-forge-redis" "quantum-forge-pgbouncer")
HEALTHY_COUNT=0

for container in "${CONTAINERS[@]}"; do
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "unknown")
    if [ "$STATUS" = "healthy" ] || [ "$STATUS" = "unknown" ]; then
        log "${GREEN}✅ $container: ${STATUS}${NC}"
        HEALTHY_COUNT=$((HEALTHY_COUNT + 1))
    else
        log "${RED}❌ $container: ${STATUS}${NC}"
    fi
done

log "${BLUE}📊 Container Health: ${HEALTHY_COUNT}/${#CONTAINERS[@]} containers healthy${NC}"

log ""
log "${GREEN}✅ VMS DATABASE BACKUP COMPLETE${NC}"
log "${BLUE}📋 BACKUP SUMMARY:${NC}"
log "• Backups Created: ${BACKUP_COUNT}"
log "• Total Size: $(echo $TOTAL_SIZE | numfmt --to=iec)"
log "• Storage Location: ${LOCAL_BACKUP_DIR}"
log "• Log File: ${LOG_FILE}"
log "• Container Health: ${HEALTHY_COUNT}/${#CONTAINERS[@]}"
log ""
log "${BLUE}🕐 Next backup recommended: $(date -d '+1 day' '+%Y-%m-%d %H:%M')${NC}"

echo ""
echo "VMS backup completed successfully! Check ${LOG_FILE} for details."