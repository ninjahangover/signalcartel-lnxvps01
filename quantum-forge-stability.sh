#!/bin/bash

# QUANTUM FORGE™ Service Stability Manager
# Ensures long-term reliability and automatic recovery

SCRIPT_DIR="/home/telgkb9/depot/dev-signalcartel"
LOG_DIR="$SCRIPT_DIR/logs"
NTFY_TOPIC="signal-cartel"
RESTART_DELAY=5
MAX_RESTARTS=10
HEALTH_CHECK_INTERVAL=60

# Create logs directory
mkdir -p "$LOG_DIR"

# Service configuration
declare -A SERVICES=(
    ["quantum-forge"]="NTFY_TOPIC=signal-cartel npx tsx -r dotenv/config custom-paper-trading.ts"
    ["market-data"]="npx tsx -r dotenv/config scripts/engines/market-data-collector.ts"
)

# Track restart counts
declare -A RESTART_COUNTS

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_DIR/stability-manager.log"
}

# Send NTFY alert
send_alert() {
    local message="$1"
    curl -s -d "$message" "https://ntfy.sh/$NTFY_TOPIC" >/dev/null 2>&1
}

# Check if service is running
is_service_running() {
    local service_name="$1"
    case $service_name in
        "quantum-forge")
            pgrep -f "custom-paper-trading.ts" >/dev/null
            ;;
        "market-data")
            pgrep -f "market-data-collector.ts" >/dev/null
            ;;
    esac
}

# Kill all instances of a service
kill_service() {
    local service_name="$1"
    case $service_name in
        "quantum-forge")
            pkill -f "custom-paper-trading.ts"
            ;;
        "market-data")
            pkill -f "market-data-collector.ts"
            ;;
    esac
    sleep 2
}

# Start a service
start_service() {
    local service_name="$1"
    local command="${SERVICES[$service_name]}"
    
    cd "$SCRIPT_DIR"
    log "Starting $service_name: $command"
    
    # Start service in background with logging
    nohup bash -c "$command" > "$LOG_DIR/$service_name.log" 2>&1 &
    
    # Track the PID
    local pid=$!
    echo $pid > "$LOG_DIR/$service_name.pid"
    
    sleep 3
    
    if is_service_running "$service_name"; then
        log "✅ $service_name started successfully (PID: $pid)"
        send_alert "✅ QUANTUM FORGE™ $service_name service started successfully"
        return 0
    else
        log "❌ Failed to start $service_name"
        send_alert "❌ QUANTUM FORGE™ $service_name service failed to start"
        return 1
    fi
}

# Restart a service with backoff
restart_service() {
    local service_name="$1"
    local restart_count="${RESTART_COUNTS[$service_name]:-0}"
    
    if [ $restart_count -ge $MAX_RESTARTS ]; then
        log "🚨 $service_name exceeded maximum restart attempts ($MAX_RESTARTS)"
        send_alert "🚨 CRITICAL: QUANTUM FORGE™ $service_name exceeded restart limit - manual intervention required"
        return 1
    fi
    
    log "🔄 Restarting $service_name (attempt $((restart_count + 1))/$MAX_RESTARTS)"
    
    # Kill existing instances
    kill_service "$service_name"
    
    # Wait before restart (exponential backoff)
    local delay=$((RESTART_DELAY * (restart_count + 1)))
    log "⏳ Waiting ${delay}s before restart..."
    sleep $delay
    
    # Start service
    if start_service "$service_name"; then
        RESTART_COUNTS[$service_name]=0
        return 0
    else
        RESTART_COUNTS[$service_name]=$((restart_count + 1))
        return 1
    fi
}

# Health check for services
health_check() {
    log "🔍 Performing health check..."
    
    for service_name in "${!SERVICES[@]}"; do
        if is_service_running "$service_name"; then
            log "✅ $service_name is running"
        else
            log "❌ $service_name is not running - initiating restart"
            send_alert "⚠️ QUANTUM FORGE™ $service_name stopped - auto-restarting..."
            restart_service "$service_name"
        fi
    done
}

# Database health check
check_database_activity() {
    local recent_trades=$(sqlite3 "$SCRIPT_DIR/prisma/dev.db" "SELECT COUNT(*) FROM PaperTrade WHERE executedAt > datetime('now', '-10 minutes');" 2>/dev/null || echo "0")
    
    if [ "$recent_trades" -eq 0 ]; then
        log "⚠️ No recent trades detected - QUANTUM FORGE™ may be stalled"
        send_alert "⚠️ QUANTUM FORGE™ WARNING: No trades in last 10 minutes - checking system..."
        
        # Force restart trading engine if no recent activity
        if is_service_running "quantum-forge"; then
            log "🔄 Force restarting quantum-forge due to inactivity"
            restart_service "quantum-forge"
        fi
    else
        log "✅ Database activity normal: $recent_trades recent trades"
    fi
}

# Main monitoring loop
main() {
    log "🚀 QUANTUM FORGE™ Stability Manager started"
    send_alert "🚀 QUANTUM FORGE™ Stability Manager activated - monitoring all services"
    
    # Initial startup
    for service_name in "${!SERVICES[@]}"; do
        if ! is_service_running "$service_name"; then
            start_service "$service_name"
        else
            log "✅ $service_name already running"
        fi
    done
    
    # Main monitoring loop
    while true; do
        health_check
        check_database_activity
        
        # Reset restart counts every 24 hours
        if [ $(($(date +%s) % 86400)) -lt $HEALTH_CHECK_INTERVAL ]; then
            for service_name in "${!SERVICES[@]}"; do
                RESTART_COUNTS[$service_name]=0
            done
            log "🔄 Daily restart counters reset"
        fi
        
        sleep $HEALTH_CHECK_INTERVAL
    done
}

# Signal handlers for graceful shutdown
cleanup() {
    log "🛑 Stability Manager shutting down..."
    send_alert "🛑 QUANTUM FORGE™ Stability Manager shutting down"
    exit 0
}

trap cleanup SIGTERM SIGINT

# Start the stability manager
main