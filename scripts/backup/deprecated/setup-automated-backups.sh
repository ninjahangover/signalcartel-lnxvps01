#!/bin/bash
# Setup automated backup system for SignalCartel
# Handles containerized database backups with multiple strategies

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/database-backup.sh"

echo "🚀 SignalCartel Automated Backup Setup"
echo "======================================"

# Check if backup script exists
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "❌ Backup script not found: $BACKUP_SCRIPT"
    exit 1
fi

# Make sure backup script is executable
chmod +x "$BACKUP_SCRIPT"

echo "📋 Setting up automated backup schedule:"
echo "  • Daily backups at 2:00 AM (keeps 30 days)"
echo "  • Weekly backups on Sunday at 3:00 AM (keeps 12 weeks)"
echo "  • Monthly backups on 1st of month at 4:00 AM (keeps 12 months)"
echo "  • Emergency backup on demand"

# Create crontab entries
CRON_ENTRIES="# SignalCartel Automated Database Backups
# Daily backup at 2:00 AM
0 2 * * * $BACKUP_SCRIPT daily >> /home/telgkb9/signalcartel-backups/cron.log 2>&1

# Weekly backup on Sunday at 3:00 AM  
0 3 * * 0 $BACKUP_SCRIPT weekly >> /home/telgkb9/signalcartel-backups/cron.log 2>&1

# Monthly backup on 1st of month at 4:00 AM
0 4 1 * * $BACKUP_SCRIPT monthly >> /home/telgkb9/signalcartel-backups/cron.log 2>&1"

# Backup existing crontab
echo "💾 Backing up existing crontab..."
crontab -l > /tmp/crontab_backup_$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "# No existing crontab"

# Add backup entries to crontab
echo "📅 Installing cron jobs..."
(crontab -l 2>/dev/null || echo ""; echo ""; echo "$CRON_ENTRIES") | crontab -

# Create backup monitoring script
cat > "${SCRIPT_DIR}/backup-monitor.sh" << 'EOF'
#!/bin/bash
# Monitor backup health and send alerts

BACKUP_DIR="/home/telgkb9/signalcartel-backups"
LOG_FILE="${BACKUP_DIR}/cron.log"

# Check last backup
check_last_backup() {
    local backup_type="$1"
    local max_age_hours="$2"
    
    local latest_backup=$(find "${BACKUP_DIR}/${backup_type}" -name "signalcartel_backup_*.db" -newer "/tmp/backup_${backup_type}_check" 2>/dev/null | head -1)
    
    if [ -z "$latest_backup" ]; then
        echo "⚠️ No recent $backup_type backup found (max age: ${max_age_hours}h)"
        return 1
    fi
    
    echo "✅ Recent $backup_type backup found: $(basename "$latest_backup")"
    return 0
}

# Create age check files
touch -d "25 hours ago" /tmp/backup_daily_check 2>/dev/null || true
touch -d "8 days ago" /tmp/backup_weekly_check 2>/dev/null || true
touch -d "32 days ago" /tmp/backup_monthly_check 2>/dev/null || true

echo "🔍 SignalCartel Backup Health Check - $(date)"
echo "=============================================="

# Check daily backups (should be < 25 hours old)
check_last_backup "daily" 25

# Check weekly backups (should be < 8 days old)
check_last_backup "weekly" 192

# Check monthly backups (should be < 32 days old)  
check_last_backup "monthly" 768

# Show disk usage
echo ""
echo "💾 Backup Disk Usage:"
du -sh "${BACKUP_DIR}"/* 2>/dev/null || echo "No backup data found"

# Show recent backup log entries
echo ""
echo "📋 Recent Backup Log (last 10 lines):"
tail -n 10 "$LOG_FILE" 2>/dev/null || echo "No log entries found"
EOF

chmod +x "${SCRIPT_DIR}/backup-monitor.sh"

# Create emergency backup alias
cat > "${SCRIPT_DIR}/emergency-backup.sh" << EOF
#!/bin/bash
# Emergency backup - run immediately
echo "🚨 EMERGENCY BACKUP STARTING..."
$BACKUP_SCRIPT emergency
echo "✅ Emergency backup complete!"
echo "📝 Check /home/telgkb9/signalcartel-backups/emergency/ for files"
EOF

chmod +x "${SCRIPT_DIR}/emergency-backup.sh"

# Create quick restore script
cat > "${SCRIPT_DIR}/quick-restore.sh" << 'EOF'
#!/bin/bash
# Quick restore interface

BACKUP_DIR="/home/telgkb9/signalcartel-backups"

echo "🔄 SignalCartel Database Restore Interface"
echo "========================================"

# List available backups
echo "Available backups:"
echo "Daily Backups:"
ls -lt "${BACKUP_DIR}/daily/"*.db 2>/dev/null | head -5 | awk '{print "  " NR ") " $9 " (" $6 " " $7 " " $8 ")"}'
echo "Weekly Backups:"
ls -lt "${BACKUP_DIR}/weekly/"*.db 2>/dev/null | head -3 | awk '{print "  " NR+10 ") " $9 " (" $6 " " $7 " " $8 ")"}'
echo "Emergency Backups:"
ls -lt "${BACKUP_DIR}/emergency/"*.db 2>/dev/null | head -3 | awk '{print "  " NR+20 ") " $9 " (" $6 " " $7 " " $8 ")"}'

echo ""
echo "📋 Restore Scripts (automatic):"
ls -lt "${BACKUP_DIR}/restore-scripts/"restore_*.sh 2>/dev/null | head -5 | awk '{print "  " $9}'

echo ""
echo "💡 To restore a backup:"
echo "1. Stop services: docker compose down"
echo "2. Run restore script: bash /path/to/restore_script.sh"
echo "3. Restart services: docker compose up -d"
EOF

chmod +x "${SCRIPT_DIR}/quick-restore.sh"

# Test the backup system
echo ""
echo "🧪 Testing backup system..."
echo "Running test backup..."

if "$BACKUP_SCRIPT" emergency; then
    echo "✅ Test backup successful!"
else
    echo "❌ Test backup failed!"
    exit 1
fi

# Show setup summary
echo ""
echo "🎯 AUTOMATED BACKUP SETUP COMPLETE!"
echo "===================================="
echo "✅ Daily backups scheduled (2:00 AM)"
echo "✅ Weekly backups scheduled (Sunday 3:00 AM)"  
echo "✅ Monthly backups scheduled (1st of month 4:00 AM)"
echo "✅ Emergency backup ready"
echo "✅ Monitoring script available"
echo "✅ Quick restore interface ready"
echo ""
echo "📁 Backup location: /home/telgkb9/signalcartel-backups/"
echo "📋 Scripts available:"
echo "  • Emergency backup: ${SCRIPT_DIR}/emergency-backup.sh"
echo "  • Backup monitor: ${SCRIPT_DIR}/backup-monitor.sh"  
echo "  • Quick restore: ${SCRIPT_DIR}/quick-restore.sh"
echo ""
echo "🔍 Check backup status: ${SCRIPT_DIR}/backup-monitor.sh"
echo "🚨 Emergency backup: ${SCRIPT_DIR}/emergency-backup.sh"
echo "🔄 Restore interface: ${SCRIPT_DIR}/quick-restore.sh"
EOF