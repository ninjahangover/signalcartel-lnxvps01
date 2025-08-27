#!/bin/bash

# Manage Automated Data Synchronization Service
# Usage: ./admin/manage-data-sync.sh [start|stop|status|restart]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PIDFILE="/tmp/signalcartel-data-sync.pid"
LOGFILE="/tmp/signalcartel-data-sync.log"

# Default sync interval (15 minutes)
SYNC_INTERVAL_MINUTES="${SYNC_INTERVAL_MINUTES:-15}"

function print_header() {
    echo "🔄 SIGNALCARTEL AUTOMATED DATA SYNCHRONIZATION SERVICE"
    echo "================================================================"
}

function start_sync_service() {
    if [[ -f "$PIDFILE" ]] && kill -0 $(cat "$PIDFILE") 2>/dev/null; then
        echo "⚠️  Data sync service is already running (PID: $(cat "$PIDFILE"))"
        return 1
    fi

    print_header
    echo "🚀 Starting automated data synchronization service..."
    echo "   Sync interval: $SYNC_INTERVAL_MINUTES minutes"
    echo "   Log file: $LOGFILE"
    echo "   PID file: $PIDFILE"
    echo ""

    cd "$PROJECT_DIR"

    # Start the service in background
    SYNC_INTERVAL_MINUTES="$SYNC_INTERVAL_MINUTES" \
    nohup npx tsx -r dotenv/config admin/automated-data-sync-service.ts \
        >> "$LOGFILE" 2>&1 &
    
    local pid=$!
    echo $pid > "$PIDFILE"
    
    # Wait a moment to check if it started successfully
    sleep 2
    
    if kill -0 $pid 2>/dev/null; then
        echo "✅ Data sync service started successfully (PID: $pid)"
        echo "   Use 'tail -f $LOGFILE' to monitor logs"
        echo "   Use '$0 stop' to stop the service"
        return 0
    else
        echo "❌ Failed to start data sync service"
        rm -f "$PIDFILE"
        return 1
    fi
}

function stop_sync_service() {
    if [[ ! -f "$PIDFILE" ]]; then
        echo "⚠️  Data sync service is not running (no PID file found)"
        return 1
    fi

    local pid=$(cat "$PIDFILE")
    
    if ! kill -0 $pid 2>/dev/null; then
        echo "⚠️  Data sync service is not running (PID $pid not found)"
        rm -f "$PIDFILE"
        return 1
    fi

    print_header
    echo "🛑 Stopping data sync service (PID: $pid)..."
    
    # Send SIGINT for graceful shutdown
    kill -INT $pid
    
    # Wait for graceful shutdown
    local timeout=10
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
    echo "✅ Data sync service stopped successfully"
}

function show_status() {
    print_header
    
    if [[ -f "$PIDFILE" ]] && kill -0 $(cat "$PIDFILE") 2>/dev/null; then
        local pid=$(cat "$PIDFILE")
        echo "✅ Data sync service is running (PID: $pid)"
        echo "   Started: $(ps -o lstart= -p $pid 2>/dev/null || echo 'Unknown')"
        echo "   Log file: $LOGFILE"
        echo ""
        
        # Show recent log entries
        if [[ -f "$LOGFILE" ]]; then
            echo "📋 Recent log entries:"
            tail -n 5 "$LOGFILE" | sed 's/^/   /'
            echo ""
            echo "   Use 'tail -f $LOGFILE' for live monitoring"
        fi
        
        # Try to get service statistics
        echo "📊 Attempting to get service statistics..."
        cd "$PROJECT_DIR"
        timeout 10s npx tsx -e "
        import { AutomatedDataSyncService } from './admin/automated-data-sync-service.ts';
        const service = new AutomatedDataSyncService();
        service.getStatus().then(status => {
            console.log('   Instance ID:', status.instanceId);
            console.log('   Positions in analytics:', status.positionsInAnalytics);
            console.log('   Trades in analytics:', status.tradesInAnalytics);
            console.log('   Last sync:', status.lastSync.toISOString());
        }).catch(() => console.log('   Statistics unavailable')).finally(() => process.exit(0));
        " 2>/dev/null
        
    else
        echo "❌ Data sync service is not running"
        if [[ -f "$PIDFILE" ]]; then
            echo "   Removing stale PID file..."
            rm -f "$PIDFILE"
        fi
    fi
}

function restart_sync_service() {
    print_header
    echo "🔄 Restarting data sync service..."
    stop_sync_service
    sleep 2
    start_sync_service
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
        if [[ -f "$LOGFILE" ]]; then
            tail -f "$LOGFILE"
        else
            echo "❌ Log file not found: $LOGFILE"
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|status|restart|logs}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the automated data sync service"
        echo "  stop    - Stop the automated data sync service"
        echo "  status  - Show current service status and statistics"
        echo "  restart - Restart the service"
        echo "  logs    - Follow the service logs"
        echo ""
        echo "Environment variables:"
        echo "  SYNC_INTERVAL_MINUTES - Sync interval in minutes (default: 15)"
        exit 1
        ;;
esac