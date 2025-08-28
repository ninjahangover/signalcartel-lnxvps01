#!/bin/bash

# Simple Data Sync Daemon
# Uses the working sync-intuition-signals.ts script in a loop

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PIDFILE="/tmp/signalcartel-simple-sync.pid"
LOGFILE="/tmp/signalcartel-logs/simple-sync-daemon.log"

# Default sync interval (10 minutes)
SYNC_INTERVAL_MINUTES="${SYNC_INTERVAL_MINUTES:-10}"

function print_header() {
    echo "🔄 SIGNALCARTEL SIMPLE SYNC DAEMON"
    echo "=================================================="
}

function ensure_log_dir() {
    mkdir -p /tmp/signalcartel-logs
}

function start_sync_daemon() {
    if [[ -f "$PIDFILE" ]] && kill -0 $(cat "$PIDFILE") 2>/dev/null; then
        echo "⚠️  Simple sync daemon is already running (PID: $(cat "$PIDFILE"))"
        return 1
    fi

    ensure_log_dir
    print_header
    echo "🚀 Starting simple sync daemon..."
    echo "   Sync interval: $SYNC_INTERVAL_MINUTES minutes"
    echo "   Log file: $LOGFILE"
    echo "   Using working sync-intuition-signals.ts script"
    echo ""

    cd "$PROJECT_DIR"

    # Set required environment variables
    export ANALYTICS_DB_URL="postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/signalcartel_analytics?schema=public"
    export DATABASE_URL="postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/signalcartel?schema=public"

    # Start the daemon in background
    nohup bash -c '
        echo "🔄 SIMPLE SYNC DAEMON STARTED - $(date)"
        echo "Interval: '$SYNC_INTERVAL_MINUTES' minutes"
        echo "======================================"
        
        while true; do
            echo ""
            echo "🔄 [$(date)] Starting sync cycle..."
            
            # Run the working sync script
            npx tsx -r dotenv/config sync-intuition-signals.ts 2>&1 | while read line; do
                echo "   $line"
            done
            
            echo "✅ [$(date)] Sync cycle completed"
            echo "   Sleeping for '$SYNC_INTERVAL_MINUTES' minutes..."
            
            sleep $((SYNC_INTERVAL_MINUTES * 60))
        done
    ' >> "$LOGFILE" 2>&1 &
    
    local pid=$!
    echo $pid > "$PIDFILE"
    
    # Wait a moment to check if it started successfully
    sleep 2
    
    if kill -0 $pid 2>/dev/null; then
        echo "✅ Simple sync daemon started successfully (PID: $pid)"
        echo "   Use 'tail -f $LOGFILE' to monitor logs"
        echo "   Use '$0 stop' to stop the daemon"
        return 0
    else
        echo "❌ Failed to start simple sync daemon"
        echo "   Check logs: tail $LOGFILE"
        rm -f "$PIDFILE"
        return 1
    fi
}

function stop_sync_daemon() {
    if [[ ! -f "$PIDFILE" ]]; then
        echo "⚠️  Simple sync daemon is not running (no PID file found)"
        return 1
    fi

    local pid=$(cat "$PIDFILE")
    
    if ! kill -0 $pid 2>/dev/null; then
        echo "⚠️  Simple sync daemon is not running (PID $pid not found)"
        rm -f "$PIDFILE"
        return 1
    fi

    print_header
    echo "🛑 Stopping simple sync daemon (PID: $pid)..."
    
    # Kill the process group to stop the bash loop too
    kill -TERM -$pid 2>/dev/null || kill -TERM $pid
    
    # Wait for graceful shutdown
    local timeout=10
    while kill -0 $pid 2>/dev/null && [[ $timeout -gt 0 ]]; do
        sleep 1
        ((timeout--))
        echo -n "."
    done
    echo ""
    
    if kill -0 $pid 2>/dev/null; then
        echo "⚠️  Daemon didn't stop gracefully, forcing shutdown..."
        kill -KILL -$pid 2>/dev/null || kill -KILL $pid
        sleep 1
    fi
    
    rm -f "$PIDFILE"
    echo "✅ Simple sync daemon stopped successfully"
}

function show_status() {
    print_header
    
    if [[ -f "$PIDFILE" ]] && kill -0 $(cat "$PIDFILE") 2>/dev/null; then
        local pid=$(cat "$PIDFILE")
        echo "✅ Simple sync daemon is running (PID: $pid)"
        echo "   Started: $(ps -o lstart= -p $pid 2>/dev/null || echo 'Unknown')"
        echo "   Log file: $LOGFILE"
        echo ""
        
        # Show recent log entries
        if [[ -f "$LOGFILE" ]]; then
            echo "📋 Recent log entries:"
            tail -n 8 "$LOGFILE" | sed 's/^/   /'
            echo ""
            echo "   Use 'tail -f $LOGFILE' for live monitoring"
        fi
        
        # Show database status
        echo "📊 Database status:"
        docker exec signalcartel-warehouse psql -U warehouse_user -d signalcartel_analytics -q -c "
        SELECT 
            'Cross-site Sentiment: ' || COUNT(*) || ' records' as status
        FROM consolidated_sentiment 
        WHERE instance_id = 'site-primary-main'
        UNION ALL
        SELECT 
            'Data Collection: ' || COUNT(*) || ' configs' as status
        FROM consolidated_data_collection 
        WHERE instance_id = 'site-primary-main';
        " 2>/dev/null | grep -E "Sentiment|Collection" | sed 's/^/   /' || echo "   Database status unavailable"
        
    else
        echo "❌ Simple sync daemon is not running"
        if [[ -f "$PIDFILE" ]]; then
            echo "   Removing stale PID file..."
            rm -f "$PIDFILE"
        fi
    fi
}

function restart_sync_daemon() {
    print_header
    echo "🔄 Restarting simple sync daemon..."
    stop_sync_daemon
    sleep 2
    start_sync_daemon
}

function show_logs() {
    if [[ -f "$LOGFILE" ]]; then
        tail -f "$LOGFILE"
    else
        echo "❌ Log file not found: $LOGFILE"
        echo "   Daemon may not have been started yet"
    fi
}

# Main command processing
case "${1:-status}" in
    start)
        start_sync_daemon
        ;;
    stop)
        stop_sync_daemon
        ;;
    status)
        show_status
        ;;
    restart)
        restart_sync_daemon
        ;;
    logs)
        show_logs
        ;;
    *)
        echo "Usage: $0 {start|stop|status|restart|logs}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the simple sync daemon"
        echo "  stop    - Stop the simple sync daemon"
        echo "  status  - Show current daemon status and database counts"
        echo "  restart - Restart the daemon"
        echo "  logs    - Follow the daemon logs"
        echo ""
        echo "Environment variables:"
        echo "  SYNC_INTERVAL_MINUTES - Sync interval in minutes (default: 10)"
        echo ""
        echo "Features:"
        echo "  • Uses the proven sync-intuition-signals.ts script"
        echo "  • Simple bash loop for reliability"
        echo "  • Focuses on Mathematical Intuition sentiment data"
        echo "  • Minimal complexity = maximum stability"
        exit 1
        ;;
esac