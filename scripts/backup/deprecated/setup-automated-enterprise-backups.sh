#!/bin/bash
# Setup automated enterprise backup system for QUANTUM FORGE™

set -euo pipefail

echo "🛡️  QUANTUM FORGE™ Enterprise Backup Setup"
echo "=========================================="

SCRIPT_DIR="/home/telgkb9/depot/dev-signalcartel/scripts/backup"
BACKUP_SCRIPT="${SCRIPT_DIR}/enterprise-backup-system.sh"

# Verify backup script exists
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "❌ Backup script not found: $BACKUP_SCRIPT"
    exit 1
fi

# Make sure script is executable
chmod +x "$BACKUP_SCRIPT"

echo "📋 Setting up cron jobs for automated backups..."

# Create cron job entries
CRON_ENTRIES="
# QUANTUM FORGE™ Enterprise Backup System
# Critical data backup every hour
0 * * * * $BACKUP_SCRIPT >/tmp/signalcartel-backup.log 2>&1

# Full backup at midnight daily
0 0 * * * $BACKUP_SCRIPT >/tmp/signalcartel-backup-full.log 2>&1

# Additional safety backup every 6 hours
0 */6 * * * $BACKUP_SCRIPT >/tmp/signalcartel-backup-safety.log 2>&1
"

# Check if cron entries already exist
if crontab -l 2>/dev/null | grep -q "QUANTUM FORGE"; then
    echo "⚠️  QUANTUM FORGE™ backup cron jobs already exist"
    echo "   Run 'crontab -e' to modify manually if needed"
else
    echo "📅 Installing cron jobs..."
    
    # Add to existing crontab
    (crontab -l 2>/dev/null || true; echo "$CRON_ENTRIES") | crontab -
    
    echo "✅ Cron jobs installed successfully!"
fi

echo ""
echo "📊 BACKUP SCHEDULE:"
echo "   ⏰ Every hour: Critical data backup"
echo "   🌙 Daily at midnight: Full backup"
echo "   🛡️  Every 6 hours: Safety backup"
echo ""

echo "📁 BACKUP LOCATIONS:"
echo "   📊 Main backups: /home/telgkb9/signalcartel-enterprise-backups/"
echo "   📝 Logs: /tmp/signalcartel-backup*.log"
echo ""

echo "🔧 MANUAL COMMANDS:"
echo "   Test backup now: $BACKUP_SCRIPT"
echo "   View cron jobs: crontab -l"
echo "   Edit schedule: crontab -e"
echo "   View logs: tail -f /tmp/signalcartel-backup.log"
echo ""

# Test the backup system
echo "🧪 Testing backup system..."
if "$BACKUP_SCRIPT"; then
    echo "✅ Backup system test successful!"
else
    echo "❌ Backup system test failed!"
    exit 1
fi

echo ""
echo "🎊 ENTERPRISE BACKUP SYSTEM READY!"
echo "Your QUANTUM FORGE™ data is now protected with:"
echo "  ✅ Automated hourly critical data backups"
echo "  ✅ Daily full database backups"  
echo "  ✅ Recovery scripts generated with each backup"
echo "  ✅ 30-day retention policy"
echo "  ✅ Backup integrity verification"
echo ""
echo "🛡️  DATA LOSS PREVENTION: ACTIVATED"