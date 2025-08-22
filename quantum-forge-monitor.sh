#!/bin/bash

# QUANTUM FORGE™ Service Monitor with NTFY Alerts
# Monitors only the custom paper trading engine and market data collector

NTFY_TOPIC="signal-cartel"
CHECK_INTERVAL=300  # 5 minutes

while true; do
    TIMESTAMP=$(date "+%I:%M %p")
    
    # Check if custom-paper-trading is running
    if ! pgrep -f "custom-paper-trading.ts" > /dev/null; then
        curl -d "🔴 QUANTUM FORGE™ STOPPED at $TIMESTAMP - Restarting..." https://ntfy.sh/$NTFY_TOPIC
        cd /home/telgkb9/depot/dev-signalcartel
        NTFY_TOPIC="signal-cartel" npx tsx -r dotenv/config custom-paper-trading.ts > custom-paper-trading.log 2>&1 &
        sleep 5
        curl -d "✅ QUANTUM FORGE™ restarted successfully" https://ntfy.sh/$NTFY_TOPIC
    fi
    
    # Check if market-data-collector is running
    if ! pgrep -f "market-data-collector.ts" > /dev/null; then
        curl -d "🔴 Market Data Collector STOPPED at $TIMESTAMP - Restarting..." https://ntfy.sh/$NTFY_TOPIC
        cd /home/telgkb9/depot/dev-signalcartel
        npx tsx -r dotenv/config scripts/engines/market-data-collector.ts > market-data-collector.log 2>&1 &
        sleep 5
        curl -d "✅ Market Data Collector restarted successfully" https://ntfy.sh/$NTFY_TOPIC
    fi
    
    # Check database for recent activity (custom paper trades)
    RECENT_TRADES=$(sqlite3 /home/telgkb9/depot/dev-signalcartel/prisma/dev.db "SELECT COUNT(*) FROM PaperTrade WHERE executedAt > datetime('now', '-30 minutes');" 2>/dev/null || echo "0")
    RECENT_DATA=$(sqlite3 /home/telgkb9/depot/dev-signalcartel/prisma/dev.db "SELECT COUNT(*) FROM MarketData WHERE timestamp > datetime('now', '-30 minutes');" 2>/dev/null || echo "0")
    
    # Alert if no recent activity
    if [ "$RECENT_TRADES" -eq "0" ] && [ "$RECENT_DATA" -eq "0" ]; then
        curl -d "⚠️ QUANTUM FORGE™ WARNING at $TIMESTAMP: No trades or data in 30 min. May be stuck." https://ntfy.sh/$NTFY_TOPIC
    fi
    
    sleep $CHECK_INTERVAL
done