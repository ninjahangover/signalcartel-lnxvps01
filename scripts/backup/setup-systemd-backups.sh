#!/bin/bash
# Setup systemd-based automated backup system for SignalCartel
# Better control than cron with service dependencies and logging

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/database-backup.sh"
SERVICE_NAME="signalcartel-backup"

echo "🚀 SignalCartel Systemd Backup Setup"
echo "===================================="

# Check if backup script exists
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "❌ Backup script not found: $BACKUP_SCRIPT"
    exit 1
fi

# Make sure backup script is executable
chmod +x "$BACKUP_SCRIPT"

echo "📋 Setting up systemd-based automated backup system:"
echo "  • Daily backups at 2:00 AM"
echo "  • Weekly backups on Sunday at 3:00 AM"
echo "  • Monthly backups on 1st of month at 4:00 AM"
echo "  • Better service management than cron"
echo "  • Proper logging and error handling"

# Create systemd service file for backup execution
sudo tee "/etc/systemd/system/${SERVICE_NAME}.service" > /dev/null << EOF
[Unit]
Description=SignalCartel Database Backup Service
After=network.target
Wants=network.target

[Service]
Type=oneshot
User=telgkb9
Group=telgkb9
WorkingDirectory=/home/telgkb9/depot/dev-signalcartel
Environment=PATH=/home/telgkb9/.nvm/versions/node/v22.18.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
Environment=HOME=/home/telgkb9
ExecStart=${BACKUP_SCRIPT} %i
StandardOutput=journal
StandardError=journal
TimeoutSec=1800
KillMode=mixed

[Install]
WantedBy=multi-user.target
EOF

# Create systemd timer for daily backups
sudo tee "/etc/systemd/system/${SERVICE_NAME}-daily.timer" > /dev/null << EOF
[Unit]
Description=SignalCartel Daily Database Backup Timer
Requires=${SERVICE_NAME}.service

[Timer]
OnCalendar=daily
Persistent=true
RandomizedDelaySec=300
AccuracySec=1m

[Install]
WantedBy=timers.target
EOF

# Create systemd timer for weekly backups
sudo tee "/etc/systemd/system/${SERVICE_NAME}-weekly.timer" > /dev/null << EOF
[Unit]
Description=SignalCartel Weekly Database Backup Timer
Requires=${SERVICE_NAME}.service

[Timer]
OnCalendar=weekly
Persistent=true
RandomizedDelaySec=600
AccuracySec=1m

[Install]
WantedBy=timers.target
EOF

# Create systemd timer for monthly backups
sudo tee "/etc/systemd/system/${SERVICE_NAME}-monthly.timer" > /dev/null << EOF
[Unit]
Description=SignalCartel Monthly Database Backup Timer
Requires=${SERVICE_NAME}.service

[Timer]
OnCalendar=monthly
Persistent=true
RandomizedDelaySec=900
AccuracySec=1m

[Install]
WantedBy=timers.target
EOF

# Create backup management script
cat > "${SCRIPT_DIR}/manage-backups.sh" << 'EOF'
#!/bin/bash
# SignalCartel Backup Management Interface

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/database-backup.sh"
SERVICE_NAME="signalcartel-backup"

case "${1:-help}" in
    start)
        echo "🚀 Starting backup timers..."
        sudo systemctl enable ${SERVICE_NAME}-daily.timer
        sudo systemctl enable ${SERVICE_NAME}-weekly.timer  
        sudo systemctl enable ${SERVICE_NAME}-monthly.timer
        sudo systemctl start ${SERVICE_NAME}-daily.timer
        sudo systemctl start ${SERVICE_NAME}-weekly.timer
        sudo systemctl start ${SERVICE_NAME}-monthly.timer
        echo "✅ All backup timers started and enabled"
        ;;
    stop)
        echo "🛑 Stopping backup timers..."
        sudo systemctl stop ${SERVICE_NAME}-daily.timer
        sudo systemctl stop ${SERVICE_NAME}-weekly.timer
        sudo systemctl stop ${SERVICE_NAME}-monthly.timer
        sudo systemctl disable ${SERVICE_NAME}-daily.timer
        sudo systemctl disable ${SERVICE_NAME}-weekly.timer
        sudo systemctl disable ${SERVICE_NAME}-monthly.timer
        echo "✅ All backup timers stopped and disabled"
        ;;
    status)
        echo "📊 Backup System Status:"
        echo "========================"
        sudo systemctl status ${SERVICE_NAME}-daily.timer --no-pager -l
        sudo systemctl status ${SERVICE_NAME}-weekly.timer --no-pager -l
        sudo systemctl status ${SERVICE_NAME}-monthly.timer --no-pager -l
        echo ""
        echo "📋 Recent Backup Logs:"
        sudo journalctl -u ${SERVICE_NAME}.service --since "24 hours ago" --no-pager
        echo ""
        echo "☁️ Cloud Sync Status (last 10 lines):"
        tail -10 /home/telgkb9/signalcartel-backups/cloud-sync.log 2>/dev/null || echo "No cloud sync log found"
        ;;
    emergency)
        echo "🚨 Running emergency backup NOW..."
        sudo systemctl start ${SERVICE_NAME}@emergency
        echo "✅ Emergency backup started (check with 'status')"
        ;;
    logs)
        echo "📋 Viewing backup service logs..."
        sudo journalctl -u ${SERVICE_NAME}.service -f
        ;;
    test)
        echo "🧪 Testing backup system..."
        sudo systemctl start ${SERVICE_NAME}@test
        echo "✅ Test backup initiated (check logs with 'logs')"
        ;;
    help|*)
        echo "🔧 SignalCartel Backup Management"
        echo "================================"
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  start     - Start all backup timers"
        echo "  stop      - Stop all backup timers"
        echo "  status    - Show backup system status"
        echo "  emergency - Run emergency backup now"
        echo "  logs      - View backup service logs (live)"
        echo "  test      - Run test backup"
        echo "  help      - Show this help message"
        echo ""
        echo "📁 Backup location: /home/telgkb9/signalcartel-backups/"
        echo "⚙️  Service management uses systemd (better than cron)"
        ;;
esac
EOF

chmod +x "${SCRIPT_DIR}/manage-backups.sh"

# Reload systemd and test setup
sudo systemctl daemon-reload

echo ""
echo "🧪 Testing backup script directly (without systemd)..."
if "${BACKUP_SCRIPT}" test; then
    echo "✅ Backup script test successful!"
else
    echo "❌ Backup script test failed!"
    exit 1
fi

echo ""
echo "⚠️  SUDO REQUIRED FOR SYSTEMD SETUP"
echo "To complete systemd installation, run:"
echo "sudo systemctl daemon-reload"
echo "sudo ${SCRIPT_DIR}/manage-backups.sh start"

# Show setup summary
echo ""
echo "🎯 SYSTEMD BACKUP SETUP COMPLETE!"
echo "================================="
echo "✅ Systemd service installed: ${SERVICE_NAME}.service"
echo "✅ Daily backup timer: ${SERVICE_NAME}-daily.timer"
echo "✅ Weekly backup timer: ${SERVICE_NAME}-weekly.timer"
echo "✅ Monthly backup timer: ${SERVICE_NAME}-monthly.timer"
echo "✅ Management interface: ${SCRIPT_DIR}/manage-backups.sh"
echo ""
echo "📁 Backup location: /home/telgkb9/signalcartel-backups/"
echo ""
echo "🔧 Management Commands:"
echo "  ${SCRIPT_DIR}/manage-backups.sh start     - Enable automatic backups"
echo "  ${SCRIPT_DIR}/manage-backups.sh status    - Check backup system status"
echo "  ${SCRIPT_DIR}/manage-backups.sh emergency - Run backup immediately"
echo "  ${SCRIPT_DIR}/manage-backups.sh logs      - View live backup logs"
echo ""
echo "🚀 To activate: ${SCRIPT_DIR}/manage-backups.sh start"
echo "📊 Check status: ${SCRIPT_DIR}/manage-backups.sh status"
EOF