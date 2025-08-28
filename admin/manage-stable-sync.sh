#!/bin/bash

# Manage Stable Data Synchronization Service
# Usage: ./admin/manage-stable-sync.sh [start|stop|status|restart]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PIDFILE="/tmp/signalcartel-stable-sync.pid"
LOGFILE="/tmp/signalcartel-logs/stable-sync.log"

# Default sync interval (10 minutes)
SYNC_INTERVAL_MINUTES="${SYNC_INTERVAL_MINUTES:-10}"

function print_header() {
    echo "🔄 SIGNALCARTEL STABLE DATA SYNCHRONIZATION SERVICE"
    echo "================================================================"
}

function ensure_log_dir() {
    mkdir -p /tmp/signalcartel-logs
}

function start_sync_service() {
    if [[ -f "$PIDFILE" ]] && kill -0 $(cat "$PIDFILE") 2>/dev/null; then
        echo "⚠️  Stable sync service is already running (PID: $(cat "$PIDFILE"))"
        return 1
    fi

    ensure_log_dir
    print_header
    echo "🚀 Starting stable data synchronization service..."
    echo "   Sync interval: $SYNC_INTERVAL_MINUTES minutes"
    echo "   Log file: $LOGFILE"
    echo "   PID file: $PIDFILE"
    echo ""

    cd "$PROJECT_DIR"

    # Set required environment variables
    export ANALYTICS_DB_URL="postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/signalcartel_analytics?schema=public"
    export DATABASE_URL="postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/signalcartel?schema=public"

    # Start the service in background
    SYNC_INTERVAL_MINUTES="$SYNC_INTERVAL_MINUTES" \
    nohup npx tsx -r dotenv/config admin/stable-data-sync-service.ts \
        >> "$LOGFILE" 2>&1 &
    
    local pid=$!
    echo $pid > "$PIDFILE"
    
    # Wait a moment to check if it started successfully
    sleep 3
    
    if kill -0 $pid 2>/dev/null; then
        echo "✅ Stable sync service started successfully (PID: $pid)"
        echo "   Use 'tail -f $LOGFILE' to monitor logs"
        echo "   Use '$0 stop' to stop the service"
        return 0
    else
        echo "❌ Failed to start stable sync service"
        echo "   Check logs: tail $LOGFILE"
        rm -f "$PIDFILE"
        return 1
    fi
}

function stop_sync_service() {
    if [[ ! -f "$PIDFILE" ]]; then
        echo "⚠️  Stable sync service is not running (no PID file found)"
        return 1
    fi

    local pid=$(cat "$PIDFILE")
    
    if ! kill -0 $pid 2>/dev/null; then
        echo "⚠️  Stable sync service is not running (PID $pid not found)"
        rm -f "$PIDFILE"
        return 1
    fi

    print_header
    echo "🛑 Stopping stable sync service (PID: $pid)..."
    
    # Send SIGINT for graceful shutdown
    kill -INT $pid
    
    # Wait for graceful shutdown
    local timeout=15
    while kill -0 $pid 2>/dev/null && [[ $timeout -gt 0 ]]; do
        sleep 1
        ((timeout--))
        echo -n "."
    done
    echo ""
    
    if kill -0 $pid 2>/dev/null; then
        echo "⚠️  Service didn't stop gracefully, forcing shutdown..."
        kill -KILL $pid
        sleep 1
    fi
    
    rm -f "$PIDFILE"
    echo "✅ Stable sync service stopped successfully"
}

function show_status() {
    print_header
    
    if [[ -f "$PIDFILE" ]] && kill -0 $(cat "$PIDFILE") 2>/dev/null; then
        local pid=$(cat "$PIDFILE")
        echo "✅ Stable sync service is running (PID: $pid)"
        echo "   Started: $(ps -o lstart= -p $pid 2>/dev/null || echo 'Unknown')"
        echo "   Memory: $(ps -o rss= -p $pid 2>/dev/null | awk '{print $1/1024 " MB"}' || echo 'Unknown')"
        echo "   Log file: $LOGFILE"
        echo ""
        
        # Show recent log entries
        if [[ -f "$LOGFILE" ]]; then
            echo "📋 Recent log entries:"
            tail -n 5 "$LOGFILE" | sed 's/^/   /'
            echo ""
            echo "   Use 'tail -f $LOGFILE' for live monitoring"
        fi
        
        # Show consolidated data counts
        echo "📊 Database status:"
        docker exec signalcartel-warehouse psql -U warehouse_user -d signalcartel_analytics -q -c "
        SELECT 
            'Cross-site Sentiment: ' || COUNT(*) || ' records' as status
        FROM consolidated_sentiment 
        WHERE instance_id = 'site-primary-main'
        UNION ALL
        SELECT 
            'Market Data: ' || COUNT(*) || ' records' as status
        FROM consolidated_market_data 
        WHERE instance_id = 'site-primary-main'
        UNION ALL
        SELECT 
            'Data Collection: ' || COUNT(*) || ' configs' as status
        FROM consolidated_data_collection 
        WHERE instance_id = 'site-primary-main';
        " 2>/dev/null | grep -E "Sentiment|Market|Collection" | sed 's/^/   /' || echo "   Database status unavailable"
        
    else
        echo "❌ Stable sync service is not running"
        if [[ -f "$PIDFILE" ]]; then
            echo "   Removing stale PID file..."
            rm -f "$PIDFILE"
        fi
    fi
}

function restart_sync_service() {
    print_header
    echo "🔄 Restarting stable sync service..."
    stop_sync_service
    sleep 3
    start_sync_service
}

function show_logs() {
    if [[ -f "$LOGFILE" ]]; then
        tail -f "$LOGFILE"
    else
        echo "❌ Log file not found: $LOGFILE"
        echo "   Service may not have been started yet"
    fi
}

# Main command processing
case "${1:-status}" in
    start)
        start_sync_service
        ;;
    stop)
        stop_sync_service
        ;;
    status)
        show_status
        ;;
    restart)
        restart_sync_service
        ;;
    logs)
        show_logs
        ;;
    *)
        echo "Usage: $0 {start|stop|status|restart|logs}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the stable data sync service"
        echo "  stop    - Stop the stable data sync service"
        echo "  status  - Show current service status and database counts"
        echo "  restart - Restart the service"
        echo "  logs    - Follow the service logs"
        echo ""
        echo "Environment variables:"
        echo "  SYNC_INTERVAL_MINUTES - Sync interval in minutes (default: 10)"
        echo ""
        echo "Features:"
        echo "  • Uses proper Prisma schema for reliable syncing"
        echo "  • Focuses on Mathematical Intuition sentiment data (most important)"
        echo "  • Includes market data collection metadata"
        echo "  • Built-in error handling and graceful shutdown"
        echo "  • Memory usage monitoring"
        exit 1
        ;;
esac