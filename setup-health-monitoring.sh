#!/bin/bash
# QUANTUM FORGE™ Health Monitoring Cron Setup
# Sets up automated system health checks with Telegram alerts

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HEALTH_CHECK_SCRIPT="$SCRIPT_DIR/system-health-check.ts"
CRON_COMMAND="*/30 * * * * cd $SCRIPT_DIR && /home/telgkb9/.nvm/versions/node/v22.18.0/bin/npx tsx system-health-check.ts --monitor >> /tmp/health-monitor.log 2>&1"

echo "🚀 QUANTUM FORGE™ Health Monitoring Setup"
echo "========================================="

# Check if health check script exists
if [ ! -f "$HEALTH_CHECK_SCRIPT" ]; then
    echo "❌ Health check script not found: $HEALTH_CHECK_SCRIPT"
    exit 1
fi

# Check if Node.js and npx are available
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js"
    exit 1
fi

echo "✅ Health check script found: $HEALTH_CHECK_SCRIPT"
echo "📅 Setting up cron job to run every 30 minutes..."
echo "📧 Alerts will be sent to Telegram on failures"

# Add cron job (will add if not exists, or update if exists)
(crontab -l 2>/dev/null | grep -v "system-health-check.ts --monitor"; echo "$CRON_COMMAND") | crontab -

if [ $? -eq 0 ]; then
    echo "✅ Cron job added successfully!"
    echo ""
    echo "📋 Current crontab:"
    crontab -l | grep "system-health-check"
    echo ""
    echo "📁 Logs will be written to: /tmp/health-monitor.log"
    echo "🔍 To view logs: tail -f /tmp/health-monitor.log"
    echo ""
    echo "📱 Test alert system now: npx tsx system-health-check.ts --monitor"
    echo "❌ Remove monitoring: crontab -l | grep -v 'system-health-check.ts --monitor' | crontab -"
else
    echo "❌ Failed to add cron job"
    exit 1
fi

echo ""
echo "🎯 System will now monitor:"
echo "   • Database connectivity and activity"
echo "   • GPU trading strategies"
echo "   • Trade execution engine"
echo "   • Data warehouse status"
echo ""
echo "🚨 Alerts sent on:"
echo "   • Any CRITICAL status"
echo "   • Status changes from HEALTHY to WARNING/CRITICAL"
echo "   • Health check failures"