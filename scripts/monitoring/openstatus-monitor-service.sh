#!/bin/bash
# OpenStatus Monitor Service
# Runs monitoring checks every 2 minutes

set -euo pipefail

PROJECT_DIR="/home/telgkb9/depot/dev-signalcartel"
MONITOR_SCRIPT="openstatus-monitor-runner.ts"
LOG_FILE="/tmp/openstatus-monitor.log"
PID_FILE="/tmp/openstatus-monitor.pid"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to check if service is already running
is_running() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

# Function to start the monitoring service
start_service() {
    if is_running; then
        echo -e "${YELLOW}⚠️  OpenStatus Monitor Service is already running (PID: $(cat $PID_FILE))${NC}"
        return 1
    fi
    
    echo -e "${GREEN}🚀 Starting OpenStatus Monitor Service...${NC}"
    log "Starting OpenStatus Monitor Service"
    
    cd "$PROJECT_DIR"
    
    # Start the monitoring loop in background
    (
        while true; do
            log "Running monitor checks..."
            
            # Run the monitor script
            if npx tsx "$MONITOR_SCRIPT" >> "$LOG_FILE" 2>&1; then
                log "Monitor check completed successfully"
            else
                log "Monitor check failed with exit code $?"
            fi
            
            # Wait 2 minutes before next check
            sleep 120
        done
    ) &
    
    # Save PID
    echo $! > "$PID_FILE"
    
    echo -e "${GREEN}✅ OpenStatus Monitor Service started (PID: $(cat $PID_FILE))${NC}"
    echo -e "   📋 Logs: tail -f $LOG_FILE"
    echo -e "   🔄 Checks run every 2 minutes"
}

# Function to stop the monitoring service
stop_service() {
    if ! is_running; then
        echo -e "${YELLOW}⚠️  OpenStatus Monitor Service is not running${NC}"
        return 1
    fi
    
    PID=$(cat "$PID_FILE")
    echo -e "${YELLOW}🛑 Stopping OpenStatus Monitor Service (PID: $PID)...${NC}"
    log "Stopping OpenStatus Monitor Service"
    
    # Kill the process and all children
    pkill -P "$PID" 2>/dev/null || true
    kill "$PID" 2>/dev/null || true
    
    # Remove PID file
    rm -f "$PID_FILE"
    
    echo -e "${GREEN}✅ OpenStatus Monitor Service stopped${NC}"
}

# Function to show service status
status_service() {
    if is_running; then
        PID=$(cat "$PID_FILE")
        echo -e "${GREEN}✅ OpenStatus Monitor Service is running (PID: $PID)${NC}"
        
        # Show recent log entries
        echo ""
        echo "📋 Recent activity:"
        tail -n 10 "$LOG_FILE" | sed 's/^/   /'
        
        # Show last check results if available
        if [ -f "/tmp/openstatus-monitor-results.json" ]; then
            echo ""
            echo "📊 Last check summary:"
            # Extract last result from JSON
            tail -n 50 "/tmp/openstatus-monitor-results.json" | grep -E "name|success|status" | tail -n 10 | sed 's/^/   /'
        fi
    else
        echo -e "${RED}❌ OpenStatus Monitor Service is not running${NC}"
    fi
}

# Function to restart the service
restart_service() {
    echo -e "${YELLOW}🔄 Restarting OpenStatus Monitor Service...${NC}"
    stop_service
    sleep 2
    start_service
}

# Function to show logs
show_logs() {
    if [ -f "$LOG_FILE" ]; then
        echo "📋 OpenStatus Monitor Logs:"
        echo "============================================================"
        tail -f "$LOG_FILE"
    else
        echo -e "${RED}❌ No log file found${NC}"
    fi
}

# Main script logic
case "${1:-}" in
    start)
        start_service
        ;;
    stop)
        stop_service
        ;;
    restart)
        restart_service
        ;;
    status)
        status_service
        ;;
    logs)
        show_logs
        ;;
    *)
        echo "OpenStatus Monitor Service Manager"
        echo "Usage: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the monitoring service"
        echo "  stop    - Stop the monitoring service"
        echo "  restart - Restart the monitoring service"
        echo "  status  - Show service status"
        echo "  logs    - Follow the service logs"
        echo ""
        echo "Example:"
        echo "  $0 start   # Start monitoring"
        echo "  $0 status  # Check if running"
        echo "  $0 logs    # View logs"
        exit 1
        ;;
esac