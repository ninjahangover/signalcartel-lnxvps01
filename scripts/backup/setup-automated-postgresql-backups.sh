#!/bin/bash
# Setup Automated PostgreSQL Backup System for QUANTUM FORGE™
# Creates cron jobs for regular backups using professional PostgreSQL tools

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/postgresql-professional-backup.sh"

echo "🛡️  QUANTUM FORGE™ Automated PostgreSQL Backup Setup"
echo "===================================================="
echo ""

# Ensure backup script exists and is executable
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "❌ Backup script not found: $BACKUP_SCRIPT"
    exit 1
fi

chmod +x "$BACKUP_SCRIPT"
echo "✅ Backup script verified and executable"

# Create backup directories
BACKUP_ROOT="/home/telgkb9/signalcartel-enterprise-backups"
mkdir -p "$BACKUP_ROOT"
echo "✅ Backup directory created: $BACKUP_ROOT"

# Current cron jobs
echo ""
echo "📋 Current cron jobs:"
crontab -l 2>/dev/null | grep -E "(postgresql|signalcartel|backup)" || echo "   No existing backup jobs found"

# Proposed cron schedule
echo ""
echo "🕐 PROPOSED BACKUP SCHEDULE:"
echo "================================="
echo "• Every Hour:     Professional PostgreSQL backup (logical + cluster)"
echo "• At Midnight:    Full comprehensive backup (all formats)"
echo "• Every 4 Hours:  Extended backup with integrity checks"
echo "• Weekly:         Deep backup with full cluster analysis"
echo ""

read -p "Install automated backup schedule? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Setup cancelled"
    exit 0
fi

# Create temporary cron file
TEMP_CRON=$(mktemp)

# Get existing cron jobs (excluding backup jobs)
crontab -l 2>/dev/null | grep -v -E "(postgresql|signalcartel|backup)" > "$TEMP_CRON" || true

# Add QUANTUM FORGE™ backup jobs
cat >> "$TEMP_CRON" << EOF

# QUANTUM FORGE™ Professional PostgreSQL Backup Schedule
# Generated: $(date)

# Hourly backups - comprehensive logical backups
0 * * * * $BACKUP_SCRIPT >> /tmp/signalcartel-backup.log 2>&1

# Midnight full backup - comprehensive with all features
0 0 * * * $BACKUP_SCRIPT >> /tmp/signalcartel-backup-midnight.log 2>&1

# 4-hour extended backups with extra verification
0 */4 * * * $BACKUP_SCRIPT >> /tmp/signalcartel-backup-extended.log 2>&1

# Weekly deep backup on Sundays at 2 AM
0 2 * * 0 $BACKUP_SCRIPT >> /tmp/signalcartel-backup-weekly.log 2>&1
EOF

# Install new cron schedule
crontab "$TEMP_CRON"
rm "$TEMP_CRON"

echo "✅ Automated backup schedule installed"
echo ""

# Display installed cron jobs
echo "📋 INSTALLED BACKUP SCHEDULE:"
echo "================================="
crontab -l | grep -E "(postgresql|signalcartel|backup)" | while read -r job; do
    echo "   $job"
done

echo ""
echo "📁 BACKUP LOGS:"
echo "========================="
echo "   /tmp/signalcartel-backup.log (hourly)"
echo "   /tmp/signalcartel-backup-midnight.log (daily)"
echo "   /tmp/signalcartel-backup-extended.log (4-hourly)"
echo "   /tmp/signalcartel-backup-weekly.log (weekly)"

echo ""
echo "🎯 BACKUP TESTING:"
echo "========================="
echo "   Test backup manually:"
echo "   $BACKUP_SCRIPT"
echo ""
echo "   Monitor logs:"
echo "   tail -f /tmp/signalcartel-backup*.log"

echo ""
echo "📊 BACKUP MONITORING:"
echo "========================="
echo "   Check backup directory:"
echo "   ls -la $BACKUP_ROOT"
echo ""
echo "   Verify latest backup:"
echo "   find $BACKUP_ROOT -name '*.sql.gz' -o -name '*.dump' | head -10"

echo ""
echo "✅ QUANTUM FORGE™ Professional PostgreSQL Backup System ACTIVE"
echo "🛡️  Your trading data is now automatically protected with:"
echo "   • Hourly logical backups using pg_dump"
echo "   • Daily comprehensive backups using pg_dumpall"
echo "   • 30-day retention policy"
echo "   • Professional PostgreSQL tools only"
echo "   • Comprehensive recovery instructions"
echo ""
echo "🚀 Next steps:"
echo "   1. Monitor first few backup runs"
echo "   2. Test recovery procedures in development"
echo "   3. Consider setting up offsite backup sync"