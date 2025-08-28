#!/bin/bash

# 📊 SigNoz Dashboard Configuration Script for QUANTUM FORGE™
# Automatically imports trading-specific dashboards and alert rules

set -euo pipefail

# Configuration
SIGNOZ_URL="${SIGNOZ_URL:-http://localhost:3301}"
API_TOKEN="${SIGNOZ_API_TOKEN:-}"
DASHBOARD_FILE="/home/telgkb9/depot/signalcartel/admin/signoz-trading-dashboards.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Check if SigNoz is accessible
check_signoz_connection() {
    log "🔍 Checking SigNoz connection..."
    
    local max_attempts=10
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -f -s "${SIGNOZ_URL}/api/v1/version" > /dev/null 2>&1; then
            log "✅ SigNoz is accessible at ${SIGNOZ_URL}"
            return 0
        fi
        
        attempt=$((attempt + 1))
        log "⏳ Waiting for SigNoz to be ready... (${attempt}/${max_attempts})"
        sleep 5
    done
    
    error "❌ Cannot connect to SigNoz at ${SIGNOZ_URL}"
    return 1
}

# Create API headers
get_api_headers() {
    if [ -n "$API_TOKEN" ]; then
        echo "-H 'Authorization: Bearer $API_TOKEN'"
    else
        echo ""
    fi
}

# Import dashboards from JSON configuration
import_dashboards() {
    log "📊 Importing QUANTUM FORGE™ dashboards..."
    
    if [ ! -f "$DASHBOARD_FILE" ]; then
        error "Dashboard configuration file not found: $DASHBOARD_FILE"
        return 1
    fi
    
    local headers=$(get_api_headers)
    local dashboard_count=$(jq '.dashboards | length' "$DASHBOARD_FILE")
    
    log "Found $dashboard_count dashboards to import"
    
    for i in $(seq 0 $((dashboard_count - 1))); do
        local dashboard_title=$(jq -r ".dashboards[$i].title" "$DASHBOARD_FILE")
        log "📊 Importing dashboard: $dashboard_title"
        
        # Extract dashboard definition
        local dashboard_json=$(jq ".dashboards[$i]" "$DASHBOARD_FILE")
        
        # Create dashboard via API
        local response=$(curl -s -X POST "${SIGNOZ_URL}/api/v1/dashboards" \
            -H "Content-Type: application/json" \
            $headers \
            -d "$dashboard_json" 2>/dev/null || echo '{"error": "API call failed"}')
        
        if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
            warn "⚠️ Failed to import dashboard: $dashboard_title"
            echo "   Response: $(echo "$response" | jq -r '.error // .message // "Unknown error"')"
        else
            log "✅ Successfully imported dashboard: $dashboard_title"
        fi
        
        sleep 1 # Rate limiting
    done
}

# Import alert rules
import_alert_rules() {
    log "🚨 Importing QUANTUM FORGE™ alert rules..."
    
    local headers=$(get_api_headers)
    local alert_count=$(jq '.alertRules | length' "$DASHBOARD_FILE")
    
    log "Found $alert_count alert rules to import"
    
    for i in $(seq 0 $((alert_count - 1))); do
        local alert_name=$(jq -r ".alertRules[$i].alert" "$DASHBOARD_FILE")
        log "🚨 Importing alert rule: $alert_name"
        
        # Extract alert rule definition
        local alert_json=$(jq ".alertRules[$i]" "$DASHBOARD_FILE")
        
        # Create alert rule via API
        local response=$(curl -s -X POST "${SIGNOZ_URL}/api/v1/rules" \
            -H "Content-Type: application/json" \
            $headers \
            -d "$alert_json" 2>/dev/null || echo '{"error": "API call failed"}')
        
        if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
            warn "⚠️ Failed to import alert rule: $alert_name"
            echo "   Response: $(echo "$response" | jq -r '.error // .message // "Unknown error"')"
        else
            log "✅ Successfully imported alert rule: $alert_name"
        fi
        
        sleep 1 # Rate limiting
    done
}

# Create custom notification channels
setup_notification_channels() {
    log "📢 Setting up notification channels..."
    
    local headers=$(get_api_headers)
    
    # Webhook notification for QUANTUM FORGE™ alerts
    local webhook_config='{
        "name": "quantum-forge-webhook",
        "type": "webhook",
        "settings": {
            "url": "http://host.docker.internal:3001/api/alerts/webhook",
            "httpMethod": "POST",
            "title": "QUANTUM FORGE™ Alert - {{ .GroupLabels.alertname }}",
            "text": "{{ range .Alerts }}{{ .Annotations.description }}{{ end }}"
        }
    }'
    
    local response=$(curl -s -X POST "${SIGNOZ_URL}/api/v1/channels" \
        -H "Content-Type: application/json" \
        $headers \
        -d "$webhook_config" 2>/dev/null || echo '{"error": "API call failed"}')
    
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        warn "⚠️ Failed to create webhook notification channel"
    else
        log "✅ Created webhook notification channel"
    fi
    
    # Slack notification (if configured)
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        local slack_config='{
            "name": "quantum-forge-slack",
            "type": "slack",
            "settings": {
                "url": "'$SLACK_WEBHOOK_URL'",
                "channel": "#trading-alerts",
                "title": "🚨 QUANTUM FORGE™ Alert",
                "text": "{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}"
            }
        }'
        
        local response=$(curl -s -X POST "${SIGNOZ_URL}/api/v1/channels" \
            -H "Content-Type: application/json" \
            $headers \
            -d "$slack_config" 2>/dev/null || echo '{"error": "API call failed"}')
        
        if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
            warn "⚠️ Failed to create Slack notification channel"
        else
            log "✅ Created Slack notification channel"
        fi
    fi
}

# Verify dashboard installation
verify_dashboards() {
    log "🔍 Verifying dashboard installation..."
    
    local headers=$(get_api_headers)
    local response=$(curl -s -X GET "${SIGNOZ_URL}/api/v1/dashboards" $headers 2>/dev/null || echo '{"dashboards": []}')
    
    local installed_count=$(echo "$response" | jq '.dashboards | length' 2>/dev/null || echo "0")
    local quantum_forge_count=$(echo "$response" | jq '[.dashboards[] | select(.title | contains("QUANTUM FORGE"))] | length' 2>/dev/null || echo "0")
    
    log "📊 Total dashboards installed: $installed_count"
    log "📊 QUANTUM FORGE™ dashboards: $quantum_forge_count"
    
    if [ "$quantum_forge_count" -gt 0 ]; then
        log "✅ QUANTUM FORGE™ dashboards successfully installed"
        echo ""
        echo -e "${GREEN}Dashboard URLs:${NC}"
        echo "$response" | jq -r '.dashboards[] | select(.title | contains("QUANTUM FORGE")) | "  📊 " + .title + ": '${SIGNOZ_URL}'/dashboard/" + .uid'
    else
        warn "⚠️ No QUANTUM FORGE™ dashboards found"
    fi
}

# Main execution
main() {
    log "📊 Configuring SigNoz dashboards for QUANTUM FORGE™..."
    echo ""
    
    # Check dependencies
    if ! command -v jq &> /dev/null; then
        error "jq is required but not installed. Install with: sudo apt-get install jq"
        exit 1
    fi
    
    if ! command -v curl &> /dev/null; then
        error "curl is required but not installed."
        exit 1
    fi
    
    # Execute configuration steps
    check_signoz_connection || exit 1
    
    echo ""
    import_dashboards
    
    echo ""
    import_alert_rules
    
    echo ""
    setup_notification_channels
    
    echo ""
    verify_dashboards
    
    echo ""
    log "🎉 SigNoz dashboard configuration completed!"
    echo ""
    echo -e "${GREEN}=== Configuration Summary ===${NC}"
    echo -e "${BLUE}SigNoz URL:${NC} $SIGNOZ_URL"
    echo -e "${BLUE}Dashboards:${NC} 4 QUANTUM FORGE™ trading dashboards"
    echo -e "${BLUE}Alerts:${NC} 9 critical and warning alert rules"
    echo -e "${BLUE}Notifications:${NC} Webhook + Slack (if configured)"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo -e "1. Access SigNoz at: ${SIGNOZ_URL}"
    echo -e "2. Navigate to Dashboards to view QUANTUM FORGE™ metrics"
    echo -e "3. Configure alert notification channels in Settings"
    echo -e "4. Start trading engine to populate metrics"
    echo -e "5. Monitor real-time trading performance"
    echo ""
}

# Run main function
main "$@"