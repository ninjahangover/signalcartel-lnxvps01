#!/bin/bash

# QUANTUM FORGE™ Internal System Stability Manager
# Focuses on internal service reliability, not external API issues

SCRIPT_DIR="/home/telgkb9/depot/dev-signalcartel"
LOG_DIR="$SCRIPT_DIR/logs"
NTFY_TOPIC="signal-cartel"
HEALTH_CHECK_INTERVAL=30  # Check every 30 seconds
DATABASE_CHECK_INTERVAL=120  # Check database activity every 2 minutes

# Create logs directory
mkdir -p "$LOG_DIR"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_DIR/internal-stability.log"
}

# Send Telegram alert
send_alert() {
    local message="$1"
    # Use Telegram instead of NTFY due to daily limits
    local telegram_token="7271136211:AAGE248w3_N7JwtHnLpWn9Cp-GpXx3hBEMM"
    local chat_id="1370390999"
    curl -s -X POST "https://api.telegram.org/bot${telegram_token}/sendMessage" \
        -d "chat_id=${chat_id}" \
        -d "text=${message}" \
        -d "parse_mode=HTML" >/dev/null 2>&1
}

# Check if QUANTUM FORGE™ (custom-paper-trading) is running and healthy
check_quantum_forge() {
    # Check if process is running
    if ! pgrep -f "custom-paper-trading.ts" >/dev/null; then
        log "❌ QUANTUM FORGE™ process not running"
        return 1
    fi
    
    # Check if it's actually trading (recent database activity)
    # executedAt is stored as epoch milliseconds, so we need to convert properly
    local recent_trades=$(sqlite3 "$SCRIPT_DIR/prisma/dev.db" "SELECT COUNT(*) FROM PaperTrade WHERE executedAt > (strftime('%s', 'now') - 300) * 1000;" 2>/dev/null || echo "0")
    
    if [ "$recent_trades" -eq 0 ]; then
        log "⚠️ QUANTUM FORGE™ process running but no recent trades (may be stalled)"
        return 2  # Process running but stalled
    fi
    
    log "✅ QUANTUM FORGE™ healthy: $recent_trades trades in last 5 minutes"
    return 0
}

# Check if market data collector is running
check_market_data() {
    if ! pgrep -f "market-data-collector.ts" >/dev/null; then
        log "❌ Market data collector not running"
        return 1
    fi
    
    # Check recent market data (less critical due to external API limits)
    local recent_data=$(sqlite3 "$SCRIPT_DIR/prisma/dev.db" "SELECT COUNT(*) FROM MarketData WHERE timestamp > datetime('now', '-10 minutes');" 2>/dev/null || echo "0")
    
    if [ "$recent_data" -eq 0 ]; then
        log "⚠️ Market data collector running but no recent data (likely external API limits)"
        return 2  # Running but limited by external APIs
    fi
    
    log "✅ Market data collector healthy: $recent_data data points in last 10 minutes"
    return 0
}

# Restart QUANTUM FORGE™ trading engine
restart_quantum_forge() {
    log "🔄 Restarting QUANTUM FORGE™ trading engine..."
    send_alert "🔄 QUANTUM FORGE™ AUTO-RESTART: Restarting trading engine to fix stalled state"
    
    # Kill existing processes
    pkill -f "custom-paper-trading.ts"
    sleep 3
    
    # Start fresh instance
    cd "$SCRIPT_DIR"
    nohup bash -c "npx tsx -r dotenv/config custom-paper-trading.ts" > "$LOG_DIR/quantum-forge-restart.log" 2>&1 &
    
    sleep 5
    
    if pgrep -f "custom-paper-trading.ts" >/dev/null; then
        log "✅ QUANTUM FORGE™ restarted successfully"
        send_alert "✅ QUANTUM FORGE™ AUTO-RESTART: Successfully restarted and trading resumed"
    else
        log "❌ Failed to restart QUANTUM FORGE™"
        send_alert "🚨 QUANTUM FORGE™ CRITICAL: Auto-restart failed - manual intervention needed"
    fi
}

# Restart market data collector (less critical)
restart_market_data() {
    log "🔄 Restarting market data collector..."
    
    # Kill existing processes
    pkill -f "market-data-collector.ts"
    sleep 2
    
    # Start fresh instance
    cd "$SCRIPT_DIR"
    nohup bash -c "npx tsx -r dotenv/config scripts/engines/market-data-collector.ts" > "$LOG_DIR/market-data-restart.log" 2>&1 &
    
    sleep 3
    
    if pgrep -f "market-data-collector.ts" >/dev/null; then
        log "✅ Market data collector restarted successfully"
    else
        log "❌ Failed to restart market data collector"
    fi
}

# Check database connectivity
check_database() {
    if ! sqlite3 "$SCRIPT_DIR/prisma/dev.db" "SELECT 1;" >/dev/null 2>&1; then
        log "🚨 Database connectivity issue!"
        send_alert "🚨 QUANTUM FORGE™ CRITICAL: Database connectivity lost - system may be unstable"
        return 1
    fi
    return 0
}

# Main monitoring function
monitor_internal_services() {
    log "🔍 Checking internal service health..."
    
    # Check database first
    if ! check_database; then
        return 1
    fi
    
    # Check QUANTUM FORGE™ (most critical)
    check_quantum_forge
    local qf_status=$?
    
    if [ $qf_status -eq 1 ]; then
        # Process not running - restart immediately
        restart_quantum_forge
    elif [ $qf_status -eq 2 ]; then
        # Process stalled - restart immediately  
        log "⚠️ QUANTUM FORGE™ appears stalled - forcing restart"
        restart_quantum_forge
    fi
    
    # Check market data (less critical due to external API dependencies)
    check_market_data
    local md_status=$?
    
    if [ $md_status -eq 1 ]; then
        # Process not running - restart
        restart_market_data
    fi
    # Don't restart for stalled market data due to external API limits
}

# Database activity monitor
monitor_database_activity() {
    log "📊 Checking database trading activity..."
    
    # Get recent trading stats (executedAt is stored as epoch milliseconds)
    local trades_1h=$(sqlite3 "$SCRIPT_DIR/prisma/dev.db" "SELECT COUNT(*) FROM PaperTrade WHERE executedAt > (strftime('%s', 'now') - 3600) * 1000;" 2>/dev/null || echo "0")
    local trades_24h=$(sqlite3 "$SCRIPT_DIR/prisma/dev.db" "SELECT COUNT(*) FROM PaperTrade WHERE executedAt > (strftime('%s', 'now') - 86400) * 1000;" 2>/dev/null || echo "0")
    local total_trades=$(sqlite3 "$SCRIPT_DIR/prisma/dev.db" "SELECT COUNT(*) FROM PaperTrade;" 2>/dev/null || echo "0")
    
    log "📈 Trading activity: ${trades_1h} trades (1h), ${trades_24h} trades (24h), ${total_trades} total"
    
    # Alert if trading has completely stopped
    if [ "$trades_1h" -eq 0 ]; then
        log "🚨 No trades in the last hour - QUANTUM FORGE™ may have critical issues"
        send_alert "🚨 QUANTUM FORGE™ ALERT: No trades in last hour - checking system health"
        
        # Force restart if no recent activity
        restart_quantum_forge
    fi
}

# Main loop
main() {
    log "🚀 QUANTUM FORGE™ Internal Stability Manager started"
    log "🎯 Monitoring: Internal services, database connectivity, trading activity"
    log "⚠️ Note: External API rate limits (CoinGecko/Binance) are expected and handled gracefully"
    send_alert "🚀 QUANTUM FORGE™ Internal Stability Manager: Switched to Telegram alerts (NTFY hit daily limits)"
    
    local health_counter=0
    local db_counter=0
    
    while true; do
        # Regular health checks every 30 seconds
        if [ $((health_counter % HEALTH_CHECK_INTERVAL)) -eq 0 ]; then
            monitor_internal_services
        fi
        
        # Database activity checks every 2 minutes  
        if [ $((db_counter % DATABASE_CHECK_INTERVAL)) -eq 0 ]; then
            monitor_database_activity
        fi
        
        health_counter=$((health_counter + 1))
        db_counter=$((db_counter + 1))
        
        sleep 1
    done
}

# Signal handlers
cleanup() {
    log "🛑 Internal Stability Manager shutting down..."
    send_alert "🛑 QUANTUM FORGE™ Internal Stability Manager stopped"
    exit 0
}

trap cleanup SIGTERM SIGINT

# Start monitoring
main