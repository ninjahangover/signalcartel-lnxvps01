#!/bin/bash

# Website monitoring script with auto-restart and Telegram alerts
# Run this as: ./scripts/monitor-website.sh

# Configuration
PORT=3001
CHECK_INTERVAL=60  # Check every 60 seconds
RESTART_ATTEMPTS=3
SITE_NAME="SignalCartel Trading Platform"
LOG_FILE="/home/telgkb9/depot/dev-signalcartel/logs/website-monitor.log"

# Source environment variables for Telegram
if [ -f .env.local ]; then
    source .env.local
fi

# Function to send Telegram alert
send_telegram_alert() {
    local message="$1"
    
    if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
        curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
            -d "chat_id=$TELEGRAM_CHAT_ID" \
            -d "text=🚨 $SITE_NAME Alert: $message" \
            -d "parse_mode=HTML" > /dev/null 2>&1
    fi
}

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to check if website is running
check_website() {
    # Check if process is running
    if pgrep -f "next.*3001" > /dev/null; then
        # Check if responding to HTTP
        if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" | grep -q "200\|404"; then
            return 0
        else
            return 1
        fi
    else
        return 1
    fi
}

# Function to restart website
restart_website() {
    log_message "Attempting to restart website..."
    
    # Kill existing process
    pkill -f "next.*3001" 2>/dev/null
    sleep 2
    
    # Start in production mode
    cd /home/telgkb9/depot/dev-signalcartel
    
    # Build if needed
    if [ ! -d ".next" ] || [ ".next" -ot "package.json" ]; then
        log_message "Building Next.js application..."
        npm run build >> "$LOG_FILE" 2>&1
    fi
    
    # Start the server
    nohup npm run start >> "$LOG_FILE" 2>&1 &
    
    sleep 10  # Give it time to start
    
    if check_website; then
        log_message "Website successfully restarted!"
        send_telegram_alert "✅ Website has been successfully restarted and is now running on port $PORT"
        return 0
    else
        return 1
    fi
}

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

log_message "Starting website monitor for $SITE_NAME on port $PORT"
send_telegram_alert "🔍 Website monitoring started for port $PORT"

# Main monitoring loop
consecutive_failures=0

while true; do
    if check_website; then
        if [ $consecutive_failures -gt 0 ]; then
            log_message "Website is back online after $consecutive_failures failures"
            send_telegram_alert "✅ Website is back online after $consecutive_failures check failures"
        fi
        consecutive_failures=0
    else
        consecutive_failures=$((consecutive_failures + 1))
        log_message "Website check failed (attempt $consecutive_failures)"
        
        if [ $consecutive_failures -ge 2 ]; then
            log_message "Website appears to be down after $consecutive_failures consecutive failures"
            send_telegram_alert "⚠️ Website is DOWN! Attempting automatic restart..."
            
            # Try to restart
            restart_attempts=0
            restart_success=false
            
            while [ $restart_attempts -lt $RESTART_ATTEMPTS ]; do
                restart_attempts=$((restart_attempts + 1))
                log_message "Restart attempt $restart_attempts of $RESTART_ATTEMPTS"
                
                if restart_website; then
                    restart_success=true
                    consecutive_failures=0
                    break
                fi
                
                sleep 5
            done
            
            if [ "$restart_success" = false ]; then
                log_message "CRITICAL: Failed to restart website after $RESTART_ATTEMPTS attempts"
                send_telegram_alert "🔴 CRITICAL: Failed to restart website after $RESTART_ATTEMPTS attempts! Manual intervention required."
                # Don't exit, keep trying
                sleep 300  # Wait 5 minutes before trying again
            fi
        fi
    fi
    
    sleep $CHECK_INTERVAL
done