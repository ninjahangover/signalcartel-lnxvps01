#!/bin/bash

# QUANTUM FORGE™ Terminal Dashboard
# Real-time terminal-based overview of trading system status
# Alternative to web dashboard - grab all data and display in terminal

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="http://localhost:3001/api"
REFRESH_INTERVAL=${1:-5}  # Default 5 seconds, can override with first argument

# Function to make API calls with error handling
api_call() {
    local endpoint="$1"
    local result
    result=$(curl -s --connect-timeout 5 --max-time 10 "$API_BASE_URL$endpoint" 2>/dev/null)
    if [ $? -eq 0 ] && [ -n "$result" ]; then
        echo "$result"
    else
        echo '{"error": "API call failed"}'
    fi
}

# Function to format numbers with commas
format_number() {
    printf "%'.0f" "$1" 2>/dev/null || echo "$1"
}

# Function to format currency
format_currency() {
    local amount="$1"
    if [[ "$amount" =~ ^-?[0-9]+\.?[0-9]*$ ]]; then
        printf "$%.2f" "$amount"
    else
        echo "$amount"
    fi
}

# Function to get system uptime
get_uptime() {
    uptime | awk -F'up ' '{print $2}' | awk -F',' '{print $1}'
}

# Function to display header
show_header() {
    clear
    echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${CYAN}║                      🚀 QUANTUM FORGE™ TERMINAL DASHBOARD                       ║${NC}"
    echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo -e "${WHITE}$(date '+%Y-%m-%d %H:%M:%S %Z')${NC} | ${BLUE}Refresh: ${REFRESH_INTERVAL}s${NC} | ${GREEN}Uptime: $(get_uptime)${NC}"
    echo ""
}

# Function to display phase information
show_phase_info() {
    echo -e "${BOLD}${PURPLE}📊 PHASE SYSTEM STATUS${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════${NC}"
    
    # Get phase data from API
    local phase_data
    phase_data=$(api_call "/dashboard/overview-metrics")
    
    if echo "$phase_data" | grep -q '"success": *true'; then
        local current_phase=$(echo "$phase_data" | jq -r '.data.currentPhase.phase // 0')
        local phase_name=$(echo "$phase_data" | jq -r '.data.currentPhase.name // "Unknown"')
        local current_trades=$(echo "$phase_data" | jq -r '.data.progress.currentTrades // 0')
        local progress=$(echo "$phase_data" | jq -r '.data.progress.progress // 0')
        local trades_needed=$(echo "$phase_data" | jq -r '.data.progress.tradesNeeded // 0')
        
        # Get actual trade count directly from PostgreSQL database
        local actual_trades
        actual_trades=$(docker exec signalcartel-warehouse psql -U warehouse_user -d signalcartel -t -c "SELECT COUNT(*) FROM \"ManagedTrade\" WHERE \"isEntry\" = true;" 2>/dev/null | tr -d ' ')
        
        # Validate and default actual_trades
        if [[ ! "$actual_trades" =~ ^[0-9]+$ ]]; then
            actual_trades=0
        fi
        
        # Determine actual phase based on real data
        local real_phase=0
        local real_phase_name="Maximum Data Collection Phase"
        if [[ "$actual_trades" -ge 2000 ]]; then
            real_phase=4
            real_phase_name="Full QUANTUM FORGE™ Phase"
        elif [[ "$actual_trades" -ge 1000 ]]; then
            real_phase=3
            real_phase_name="Order Book Intelligence Phase"
        elif [[ "$actual_trades" -ge 500 ]]; then
            real_phase=2
            real_phase_name="Multi-Source Sentiment Phase"
        elif [[ "$actual_trades" -ge 100 ]]; then
            real_phase=1
            real_phase_name="Basic Sentiment Phase"
        fi
        
        echo -e "  ${WHITE}Current Phase:${NC}      ${BOLD}${YELLOW}Phase $real_phase${NC} - $real_phase_name"
        echo -e "  ${WHITE}Entry Trades:${NC}       ${GREEN}$(format_number $actual_trades)${NC}"
        
        # Calculate real progress
        local next_threshold
        case $real_phase in
            0) next_threshold=100 ;;
            1) next_threshold=500 ;;
            2) next_threshold=1000 ;;
            3) next_threshold=2000 ;;
            4) next_threshold=0 ;;
        esac
        
        if [[ $real_phase -lt 4 ]]; then
            local real_progress=$(( (actual_trades * 100) / next_threshold ))
            local real_trades_needed=$((next_threshold - actual_trades))
            echo -e "  ${WHITE}Progress:${NC}           ${CYAN}${real_progress}%${NC} to Phase $((real_phase + 1))"
            echo -e "  ${WHITE}Trades Needed:${NC}      ${YELLOW}$(format_number $real_trades_needed)${NC}"
        else
            echo -e "  ${WHITE}Progress:${NC}           ${GREEN}MAXIMUM PHASE ACHIEVED${NC}"
        fi
        
        # Show API discrepancy if exists
        if [[ "$current_phase" != "$real_phase" ]]; then
            echo -e "  ${RED}⚠️  API Phase:${NC}       Phase $current_phase (${current_trades} trades) - API Issue"
        fi
    else
        echo -e "  ${RED}❌ Error fetching phase data${NC}"
    fi
    echo ""
}

# Function to display trading statistics
show_trading_stats() {
    echo -e "${BOLD}${GREEN}💹 TRADING STATISTICS${NC}"
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    
    local overview_data
    overview_data=$(api_call "/dashboard/overview-metrics")
    
    if echo "$overview_data" | grep -q '"success": *true'; then
        local total_trades=$(echo "$overview_data" | jq -r '.data.totalTrades // 0')
        local trades_with_pnl=$(echo "$overview_data" | jq -r '.data.tradesWithPnL // 0')
        local winning_trades=$(echo "$overview_data" | jq -r '.data.winningTrades // 0')
        local losing_trades=$(echo "$overview_data" | jq -r '.data.losingTrades // 0')
        local win_rate=$(echo "$overview_data" | jq -r '.data.winRate // 0')
        
        echo -e "  ${WHITE}Total Trades:${NC}       ${CYAN}$(format_number $total_trades)${NC}"
        echo -e "  ${WHITE}Completed P&L:${NC}      ${CYAN}$(format_number $trades_with_pnl)${NC}"
        echo -e "  ${WHITE}Winning Trades:${NC}     ${GREEN}$(format_number $winning_trades)${NC}"
        echo -e "  ${WHITE}Losing Trades:${NC}      ${RED}$(format_number $losing_trades)${NC}"
        echo -e "  ${WHITE}Win Rate:${NC}           ${BOLD}${YELLOW}$(printf "%.1f" "$win_rate")%${NC}"
    else
        echo -e "  ${RED}❌ Error fetching trading statistics${NC}"
    fi
    echo ""
}

# Function to display P&L information
show_pnl_info() {
    echo -e "${BOLD}${YELLOW}💰 PROFIT & LOSS ANALYSIS${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════${NC}"
    
    local overview_data
    overview_data=$(api_call "/dashboard/overview-metrics")
    
    if echo "$overview_data" | grep -q '"success": *true'; then
        local total_pnl=$(echo "$overview_data" | jq -r '.data.totalPnL // 0')
        local avg_pnl=$(echo "$overview_data" | jq -r '.data.avgPnL // 0')
        local max_win=$(echo "$overview_data" | jq -r '.data.maxWin // 0')
        local max_loss=$(echo "$overview_data" | jq -r '.data.maxLoss // 0')
        local portfolio_value=$(echo "$overview_data" | jq -r '.data.portfolioValue // 10000')
        
        # Color code P&L
        local pnl_color
        if (( $(echo "$total_pnl > 0" | bc -l 2>/dev/null || echo 0) )); then
            pnl_color="${GREEN}"
        else
            pnl_color="${RED}"
        fi
        
        echo -e "  ${WHITE}Total P&L:${NC}          ${pnl_color}$(format_currency $total_pnl)${NC}"
        echo -e "  ${WHITE}Average P&L:${NC}        $(format_currency $avg_pnl)"
        echo -e "  ${WHITE}Max Win:${NC}            ${GREEN}$(format_currency $max_win)${NC}"
        echo -e "  ${WHITE}Max Loss:${NC}           ${RED}$(format_currency $max_loss)${NC}"
        echo -e "  ${WHITE}Portfolio Value:${NC}    ${BOLD}${CYAN}$(format_currency $portfolio_value)${NC}"
    else
        echo -e "  ${RED}❌ Error fetching P&L data${NC}"
    fi
    echo ""
}

# Function to display recent activity
show_recent_activity() {
    echo -e "${BOLD}${BLUE}⚡ RECENT ACTIVITY${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    
    local overview_data
    overview_data=$(api_call "/dashboard/overview-metrics")
    
    if echo "$overview_data" | grep -q '"success": *true'; then
        local last_24h=$(echo "$overview_data" | jq -r '.data.last24hTrades // 0')
        local last_hour=$(echo "$overview_data" | jq -r '.data.lastHourTrades // 0')
        local trading_velocity=$(echo "$overview_data" | jq -r '.data.tradingVelocity // 0')
        local open_positions=$(echo "$overview_data" | jq -r '.data.openPositions // 0')
        local total_positions=$(echo "$overview_data" | jq -r '.data.totalPositions // 0')
        
        echo -e "  ${WHITE}Last 24 Hours:${NC}      ${CYAN}$(format_number $last_24h)${NC} trades"
        echo -e "  ${WHITE}Last Hour:${NC}          ${CYAN}$(format_number $last_hour)${NC} trades"
        echo -e "  ${WHITE}Trading Velocity:${NC}   ${YELLOW}$(printf "%.1f" "$trading_velocity")${NC} trades/hour"
        echo -e "  ${WHITE}Open Positions:${NC}     ${GREEN}$(format_number $open_positions)${NC}"
        echo -e "  ${WHITE}Total Positions:${NC}    ${CYAN}$(format_number $total_positions)${NC}"
    else
        echo -e "  ${RED}❌ Error fetching activity data${NC}"
    fi
    echo ""
}

# Function to display system health
show_system_health() {
    echo -e "${BOLD}${WHITE}🛡️  SYSTEM HEALTH${NC}"
    echo -e "${WHITE}═══════════════════════════════════════${NC}"
    
    local overview_data
    overview_data=$(api_call "/dashboard/overview-metrics")
    
    if echo "$overview_data" | grep -q '"success": *true'; then
        local system_health=$(echo "$overview_data" | jq -r '.data.systemHealth // "unknown"')
        local intuition_analyses=$(echo "$overview_data" | jq -r '.data.intuitionAnalyses // 0')
        
        # Color code system health
        local health_color
        case "$system_health" in
            "excellent") health_color="${GREEN}" ;;
            "good") health_color="${YELLOW}" ;;
            "warning") health_color="${YELLOW}" ;;
            "critical") health_color="${RED}" ;;
            *) health_color="${WHITE}" ;;
        esac
        
        echo -e "  ${WHITE}Overall Health:${NC}     ${health_color}${system_health^^}${NC}"
        echo -e "  ${WHITE}AI Analyses:${NC}        ${PURPLE}$(format_number $intuition_analyses)${NC}"
        
        # Check if trading system is running
        if pgrep -f "load-database-strategies.ts" > /dev/null; then
            echo -e "  ${WHITE}Trading Engine:${NC}     ${GREEN}RUNNING${NC}"
        else
            echo -e "  ${WHITE}Trading Engine:${NC}     ${RED}STOPPED${NC}"
        fi
        
        # Check database connection
        local db_status
        if timeout 3s docker exec signalcartel-warehouse pg_isready -U warehouse_user > /dev/null 2>&1; then
            echo -e "  ${WHITE}Database:${NC}           ${GREEN}ONLINE${NC}"
        else
            echo -e "  ${WHITE}Database:${NC}           ${RED}OFFLINE${NC}"
        fi
        
        # Check website container
        if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "signalcartel-website.*Up"; then
            echo -e "  ${WHITE}Website:${NC}            ${GREEN}RUNNING${NC}"
        else
            echo -e "  ${WHITE}Website:${NC}            ${RED}STOPPED${NC}"
        fi
        
    else
        echo -e "  ${RED}❌ Error fetching system health${NC}"
    fi
    echo ""
}

# Function to display footer
show_footer() {
    echo -e "${BOLD}${CYAN}════════════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${WHITE}Press ${RED}Ctrl+C${NC} to exit | Refresh every ${BLUE}${REFRESH_INTERVAL}s${NC} | ${PURPLE}QUANTUM FORGE™${NC} Terminal Dashboard"
    echo ""
}

# Main dashboard function
show_dashboard() {
    while true; do
        show_header
        show_phase_info
        show_trading_stats
        show_pnl_info
        show_recent_activity
        show_system_health
        show_footer
        
        sleep "$REFRESH_INTERVAL"
    done
}

# Handle Ctrl+C gracefully
trap 'echo -e "\n${YELLOW}Dashboard stopped.${NC}"; exit 0' INT

# Check if required commands exist
if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl is required but not installed.${NC}"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is required but not installed.${NC}"
    exit 1
fi

# Display usage if help requested
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    echo "QUANTUM FORGE™ Terminal Dashboard"
    echo "Usage: $0 [refresh_interval]"
    echo ""
    echo "Options:"
    echo "  refresh_interval    Refresh interval in seconds (default: 5)"
    echo "  -h, --help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                 # Refresh every 5 seconds"
    echo "  $0 10              # Refresh every 10 seconds"
    echo "  $0 1               # Refresh every 1 second (fast)"
    exit 0
fi

# Start the dashboard
echo -e "${GREEN}Starting QUANTUM FORGE™ Terminal Dashboard...${NC}"
echo -e "${BLUE}Refresh interval: ${REFRESH_INTERVAL} seconds${NC}"
echo -e "${YELLOW}Press Ctrl+C to exit${NC}"
echo ""
sleep 2

show_dashboard