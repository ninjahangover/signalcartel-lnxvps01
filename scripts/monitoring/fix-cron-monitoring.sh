#!/bin/bash

# Fix cron monitoring job with proper PATH and working directory
# This script updates the crontab to use full paths for npx/tsx

echo "🔧 Fixing OpenStatus monitoring cron job..."

# Remove old broken cron entry and add fixed one
crontab -l | grep -v "openstatus-monitor-runner" > /tmp/new_cron

# Add fixed cron with full PATH and cd to correct directory
echo '*/2 * * * * PATH=/home/telgkb9/.nvm/versions/node/v22.18.0/bin:/usr/bin:/bin NTFY_TOPIC="signal-cartel" cd /home/telgkb9/depot/dev-signalcartel && /home/telgkb9/.nvm/versions/node/v22.18.0/bin/npx tsx openstatus-monitor-runner.ts >> /tmp/openstatus-cron.log 2>&1' >> /tmp/new_cron

# Install new crontab
crontab /tmp/new_cron

echo "✅ Cron job fixed!"
echo ""
echo "📋 Current monitoring cron job:"
crontab -l | grep "openstatus-monitor-runner"
echo ""
echo "💡 The monitoring will now:"
echo "   - Run every 2 minutes"
echo "   - Send alerts to ntfy.sh/signal-cartel"
echo "   - Log output to /tmp/openstatus-cron.log"