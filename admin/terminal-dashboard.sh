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

# Function to extract JSON values (fallback if jq not available)
extract_json_value() {
    local json="$1"
    local key="$2"
    local default="${3:-0}"
    
    if [[ "$USE_FALLBACK_JSON" == "true" ]]; then
        # Handle nested keys like "data.currentPhase.phase"
        if [[ "$key" =~ \. ]]; then
            # For nested keys, just extract the final key name
            local simple_key=$(echo "$key" | awk -F'.' '{print $NF}')
            local value=$(echo "$json" | grep -o "\"$simple_key\":[^,}]*" | cut -d':' -f2 | tr -d ' "' | head -1)
        else
            # Simple regex-based extraction for top-level keys
            local value=$(echo "$json" | grep -o "\"$key\":[^,}]*" | cut -d':' -f2 | tr -d ' "')
        fi
        
        if [[ -z "$value" || "$value" == "null" ]]; then
            echo "$default"
        else
            echo "$value"
        fi
    else
        # Use jq if available
        echo "$json" | jq -r ".$key // \"$default\""
    fi
}

# Function to check if JSON indicates success
json_success() {
    local json="$1"
    if [[ "$USE_FALLBACK_JSON" == "true" ]]; then
        echo "$json" | grep -q '"success":\s*true'
    else
        [[ "$(echo "$json" | jq -r '.success // false')" == "true" ]]
    fi
}

# Function to get system uptime
get_uptime() {
    uptime | awk -F'up ' '{print $2}' | awk -F',' '{print $1}'
}

# Function to execute PostgreSQL query directly
db_query() {
    local query="$1"
    local database="${2:-signalcartel}"
    local result
    local retry_count=0
    local max_retries=3
    
    while [[ $retry_count -lt $max_retries ]]; do
        result=$(PGPASSWORD=quantum_forge_warehouse_2024 docker exec signalcartel-warehouse psql -U warehouse_user -d "$database" -t -c "$query" 2>/dev/null | tr -d ' ' | head -1)
        
        if [[ -n "$result" && "$result" != "" && "$result" != "FATAL:" ]]; then
            echo "$result"
            return 0
        fi
        
        ((retry_count++))
        sleep 0.1
    done
    
    echo "0"
}

# Function to get trading statistics directly from database
get_db_stats() {
    echo "# Database fallback - getting real-time PostgreSQL data"
    
    # Phase calculation
    local entry_trades=$(db_query "SELECT COUNT(*) FROM \"ManagedTrade\" WHERE \"isEntry\" = true;")
    local real_phase=0
    local real_phase_name="Maximum Data Collection Phase"
    local next_threshold=100
    
    if [[ "$entry_trades" -ge 2000 ]]; then
        real_phase=4
        real_phase_name="Full QUANTUM FORGE™ Phase"
        next_threshold=0
    elif [[ "$entry_trades" -ge 1000 ]]; then
        real_phase=3
        real_phase_name="Order Book Intelligence Phase"
        next_threshold=2000
    elif [[ "$entry_trades" -ge 500 ]]; then
        real_phase=2
        real_phase_name="Multi-Source Sentiment Phase"
        next_threshold=1000
    elif [[ "$entry_trades" -ge 100 ]]; then
        real_phase=1
        real_phase_name="Basic Sentiment Phase"
        next_threshold=500
    fi
    
    # Trading statistics
    local total_trades=$(db_query "SELECT COUNT(*) FROM \"ManagedTrade\";")
    local trades_with_pnl=$(db_query "SELECT COUNT(*) FROM \"ManagedTrade\" WHERE \"pnl\" IS NOT NULL;")
    local winning_trades=$(db_query "SELECT COUNT(*) FROM \"ManagedTrade\" WHERE \"pnl\" > 0;")
    local losing_trades=$(db_query "SELECT COUNT(*) FROM \"ManagedTrade\" WHERE \"pnl\" < 0;")
    
    # P&L data
    local total_pnl=$(db_query "SELECT COALESCE(SUM(\"pnl\"), 0) FROM \"ManagedTrade\" WHERE \"pnl\" IS NOT NULL;")
    local max_win=$(db_query "SELECT COALESCE(MAX(\"pnl\"), 0) FROM \"ManagedTrade\" WHERE \"pnl\" IS NOT NULL;")
    local max_loss=$(db_query "SELECT COALESCE(MIN(\"pnl\"), 0) FROM \"ManagedTrade\" WHERE \"pnl\" IS NOT NULL;")
    
    # Recent activity (24h and 1h)
    local last_24h=$(db_query "SELECT COUNT(*) FROM \"ManagedTrade\" WHERE \"executedAt\" > NOW() - INTERVAL '24 hours';")
    local last_hour=$(db_query "SELECT COUNT(*) FROM \"ManagedTrade\" WHERE \"executedAt\" > NOW() - INTERVAL '1 hour';")
    
    # Position data
    local total_positions=$(db_query "SELECT COUNT(*) FROM \"ManagedPosition\";")
    local open_positions=$(db_query "SELECT COUNT(*) FROM \"ManagedPosition\" WHERE \"status\" = 'open';")
    
    # Analytics database record counts (consolidated data)
    local consolidated_trades=$(db_query "SELECT COUNT(*) FROM \"consolidated_trades\";" "signalcartel_analytics")
    local consolidated_positions=$(db_query "SELECT COUNT(*) FROM \"consolidated_positions\";" "signalcartel_analytics") 
    local consolidated_sentiment=$(db_query "SELECT COUNT(*) FROM \"consolidated_sentiment\";" "signalcartel_analytics")
    local consolidated_market_data=$(db_query "SELECT COUNT(*) FROM \"consolidated_market_data\";" "signalcartel_analytics")
    local consolidated_signals=$(db_query "SELECT COUNT(*) FROM \"consolidated_trading_signals\";" "signalcartel_analytics")
    local consolidated_data_collection=$(db_query "SELECT COUNT(*) FROM \"consolidated_data_collection\";" "signalcartel_analytics")
    
    # Get actual data collection and sentiment counts from production
    local actual_data_collection=$(db_query "SELECT COUNT(*) FROM \"MarketDataCollection\";")
    local actual_sentiment_records=$(db_query "SELECT COUNT(*) FROM \"SentimentData\";")
    local intuition_analysis=$(db_query "SELECT COUNT(*) FROM \"IntuitionAnalysis\";")
    local enhanced_signals=$(db_query "SELECT COUNT(*) FROM \"EnhancedTradingSignal\";")
    local learning_insights=$(db_query "SELECT COUNT(*) FROM \"learning_insights\";" "signalcartel_analytics")
    
    # Market data warehouse record counts - with recent activity focus
    local market_data_points=$(db_query "SELECT COUNT(*) FROM \"MarketData\";")
    local market_data_1h=$(db_query "SELECT COUNT(*) FROM \"MarketData\" WHERE \"timestamp\" > NOW() - INTERVAL '1 hour';")
    local trading_signals=$(db_query "SELECT COUNT(*) FROM \"TradingSignal\";")
    local recent_trading_signals=$(db_query "SELECT COUNT(*) FROM \"TradingSignal\" WHERE \"createdAt\" > NOW() - INTERVAL '24 hours';")
    local enhanced_signals=$(db_query "SELECT COUNT(*) FROM \"EnhancedTradingSignal\";")
    local recent_enhanced_signals=$(db_query "SELECT COUNT(*) FROM \"EnhancedTradingSignal\" WHERE \"signalTime\" > NOW() - INTERVAL '24 hours';")
    
    # Get data timeframe info
    local oldest_data=$(db_query "SELECT EXTRACT(HOUR FROM MIN(timestamp)) FROM \"MarketData\";" | head -1)
    local data_hours_ago=$(db_query "SELECT EXTRACT(EPOCH FROM (NOW() - MIN(timestamp)))/3600 FROM \"MarketData\";" | head -1 | cut -d'.' -f1)
    
    # Check analytics database connection
    local analytics_db_status="offline"
    if timeout 3s docker exec -e PGPASSWORD=quantum_forge_warehouse_2024 signalcartel-warehouse pg_isready -U warehouse_user -d signalcartel_analytics > /dev/null 2>&1; then
        analytics_db_status="online"
    fi
    
    # Calculate metrics
    local win_rate=0
    if [[ "$trades_with_pnl" -gt 0 ]]; then
        win_rate=$(echo "scale=1; $winning_trades * 100 / $trades_with_pnl" | bc -l 2>/dev/null || echo "0")
    fi
    
    # Store in global variables for the display functions to use
    FALLBACK_PHASE_NUM=$real_phase
    FALLBACK_PHASE_NAME="$real_phase_name"
    FALLBACK_ENTRY_TRADES=$entry_trades
    FALLBACK_TOTAL_TRADES=$total_trades
    FALLBACK_TRADES_WITH_PNL=$trades_with_pnl
    FALLBACK_WINNING_TRADES=$winning_trades
    FALLBACK_LOSING_TRADES=$losing_trades
    FALLBACK_WIN_RATE=$win_rate
    FALLBACK_TOTAL_PNL=$total_pnl
    FALLBACK_MAX_WIN=$max_win
    FALLBACK_MAX_LOSS=$max_loss
    FALLBACK_LAST_24H=$last_24h
    FALLBACK_LAST_HOUR=$last_hour
    FALLBACK_TOTAL_POSITIONS=$total_positions
    FALLBACK_OPEN_POSITIONS=$open_positions
    
    # Store analytics database metrics
    FALLBACK_ANALYTICS_DB_STATUS=$analytics_db_status
    FALLBACK_CONSOLIDATED_TRADES=$consolidated_trades
    FALLBACK_CONSOLIDATED_POSITIONS=$consolidated_positions
    FALLBACK_CONSOLIDATED_SENTIMENT=$consolidated_sentiment
    FALLBACK_CONSOLIDATED_MARKET_DATA=$consolidated_market_data
    FALLBACK_CONSOLIDATED_SIGNALS=$consolidated_signals
    FALLBACK_CONSOLIDATED_DATA_COLLECTION=$consolidated_data_collection
    FALLBACK_ACTUAL_DATA_COLLECTION=$actual_data_collection
    FALLBACK_ACTUAL_SENTIMENT_RECORDS=$actual_sentiment_records
    FALLBACK_INTUITION_ANALYSIS=$intuition_analysis
    FALLBACK_ENHANCED_SIGNALS=$enhanced_signals
    FALLBACK_LEARNING_INSIGHTS=$learning_insights
    
    # Store market data warehouse metrics
    FALLBACK_MARKET_DATA_POINTS=$market_data_points
    FALLBACK_MARKET_DATA_1H=$market_data_1h
    FALLBACK_TRADING_SIGNALS=$trading_signals
    FALLBACK_RECENT_TRADING_SIGNALS=$recent_trading_signals
    FALLBACK_ENHANCED_SIGNALS=$enhanced_signals
    FALLBACK_RECENT_ENHANCED_SIGNALS=$recent_enhanced_signals
    FALLBACK_DATA_HOURS_AGO=$data_hours_ago
    
    # Calculate remaining trades needed for next phase
    if [[ $next_threshold -gt 0 ]]; then
        FALLBACK_TRADES_NEEDED=$((next_threshold - entry_trades))
    else
        FALLBACK_TRADES_NEEDED=0
    fi
    
    # Calculate progress percentage
    if [[ $real_phase -lt 4 ]]; then
        local phase_start=0
        case $real_phase in
            0) phase_start=0 ;;
            1) phase_start=100 ;;
            2) phase_start=500 ;;
            3) phase_start=1000 ;;
        esac
        local phase_range=$((next_threshold - phase_start))
        local progress_in_phase=$((entry_trades - phase_start))
        FALLBACK_PROGRESS=$(echo "scale=1; $progress_in_phase * 100 / $phase_range" | bc -l 2>/dev/null || echo "0")
    else
        FALLBACK_PROGRESS=100
    fi
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
    
    if json_success "$phase_data"; then
        local current_phase=$(extract_json_value "$phase_data" "data.currentPhase.phase" "0")
        local phase_name=$(extract_json_value "$phase_data" "data.currentPhase.name" "Unknown")
        local current_trades=$(extract_json_value "$phase_data" "data.progress.currentTrades" "0")
        local progress=$(extract_json_value "$phase_data" "data.progress.progress" "0")
        local trades_needed=$(extract_json_value "$phase_data" "data.progress.tradesNeeded" "0")
        
        # Get actual trade count directly from PostgreSQL database using db_query function
        local actual_trades
        actual_trades=$(db_query "SELECT COUNT(*) FROM \"ManagedTrade\" WHERE \"isEntry\" = true;")
        
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
        echo -e "  ${YELLOW}⚠️  API unavailable, using database fallback${NC}"
        echo -e "  ${WHITE}Current Phase:${NC}      ${BOLD}${YELLOW}Phase $FALLBACK_PHASE_NUM${NC} - $FALLBACK_PHASE_NAME"
        echo -e "  ${WHITE}Entry Trades:${NC}       ${GREEN}$(format_number $FALLBACK_ENTRY_TRADES)${NC}"
        
        if [[ $FALLBACK_PHASE_NUM -lt 4 ]]; then
            echo -e "  ${WHITE}Progress:${NC}           ${CYAN}${FALLBACK_PROGRESS}%${NC} to Phase $((FALLBACK_PHASE_NUM + 1))"
            echo -e "  ${WHITE}Trades Needed:${NC}      ${YELLOW}$(format_number $FALLBACK_TRADES_NEEDED)${NC}"
        else
            echo -e "  ${WHITE}Progress:${NC}           ${GREEN}MAXIMUM PHASE ACHIEVED${NC}"
        fi
    fi
    echo ""
}

# Function to display trading statistics
show_trading_stats() {
    echo -e "${BOLD}${GREEN}💹 TRADING STATISTICS${NC}"
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    
    local overview_data
    overview_data=$(api_call "/dashboard/overview-metrics")
    
    if json_success "$overview_data"; then
        local total_trades=$(extract_json_value "$overview_data" "data.totalTrades" "0")
        local trades_with_pnl=$(extract_json_value "$overview_data" "data.tradesWithPnL" "0")
        local winning_trades=$(extract_json_value "$overview_data" "data.winningTrades" "0")
        local losing_trades=$(extract_json_value "$overview_data" "data.losingTrades" "0")
        local win_rate=$(extract_json_value "$overview_data" "data.winRate" "0")
        
        echo -e "  ${WHITE}Total Trades:${NC}       ${CYAN}$(format_number $total_trades)${NC}"
        echo -e "  ${WHITE}Completed P&L:${NC}      ${CYAN}$(format_number $trades_with_pnl)${NC}"
        echo -e "  ${WHITE}Winning Trades:${NC}     ${GREEN}$(format_number $winning_trades)${NC}"
        echo -e "  ${WHITE}Losing Trades:${NC}      ${RED}$(format_number $losing_trades)${NC}"
        echo -e "  ${WHITE}Win Rate:${NC}           ${BOLD}${YELLOW}$(printf "%.1f" "$win_rate")%${NC}"
    else
        echo -e "  ${YELLOW}⚠️  Using database fallback${NC}"
        echo -e "  ${WHITE}Total Trades:${NC}       ${CYAN}$(format_number $FALLBACK_TOTAL_TRADES)${NC}"
        echo -e "  ${WHITE}Completed P&L:${NC}      ${CYAN}$(format_number $FALLBACK_TRADES_WITH_PNL)${NC}"
        echo -e "  ${WHITE}Winning Trades:${NC}     ${GREEN}$(format_number $FALLBACK_WINNING_TRADES)${NC}"
        echo -e "  ${WHITE}Losing Trades:${NC}      ${RED}$(format_number $FALLBACK_LOSING_TRADES)${NC}"
        echo -e "  ${WHITE}Win Rate:${NC}           ${BOLD}${YELLOW}$(printf "%.1f" "$FALLBACK_WIN_RATE")%${NC}"
    fi
    echo ""
}

# Function to display P&L information
show_pnl_info() {
    echo -e "${BOLD}${YELLOW}💰 PROFIT & LOSS ANALYSIS${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════${NC}"
    
    local overview_data
    overview_data=$(api_call "/dashboard/overview-metrics")
    
    if json_success "$overview_data"; then
        local total_pnl=$(extract_json_value "$overview_data" "data.totalPnL" "0")
        local avg_pnl=$(extract_json_value "$overview_data" "data.avgPnL" "0")
        local max_win=$(extract_json_value "$overview_data" "data.maxWin" "0")
        local max_loss=$(extract_json_value "$overview_data" "data.maxLoss" "0")
        local portfolio_value=$(extract_json_value "$overview_data" "data.portfolioValue" "10000")
        
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
        echo -e "  ${YELLOW}⚠️  Using database fallback${NC}"
        local pnl_color
        if (( $(echo "$FALLBACK_TOTAL_PNL > 0" | bc -l 2>/dev/null || echo 0) )); then
            pnl_color="${GREEN}"
        else
            pnl_color="${RED}"
        fi
        
        local avg_pnl=0
        if [[ "$FALLBACK_TRADES_WITH_PNL" -gt 0 ]]; then
            avg_pnl=$(echo "scale=2; $FALLBACK_TOTAL_PNL / $FALLBACK_TRADES_WITH_PNL" | bc -l 2>/dev/null || echo "0")
        fi
        local portfolio_value=$(echo "scale=2; 10000 + $FALLBACK_TOTAL_PNL" | bc -l 2>/dev/null || echo "10000")
        
        echo -e "  ${WHITE}Total P&L:${NC}          ${pnl_color}$(format_currency $FALLBACK_TOTAL_PNL)${NC}"
        echo -e "  ${WHITE}Average P&L:${NC}        $(format_currency $avg_pnl)"
        echo -e "  ${WHITE}Max Win:${NC}            ${GREEN}$(format_currency $FALLBACK_MAX_WIN)${NC}"
        echo -e "  ${WHITE}Max Loss:${NC}           ${RED}$(format_currency $FALLBACK_MAX_LOSS)${NC}"
        echo -e "  ${WHITE}Portfolio Value:${NC}    ${BOLD}${CYAN}$(format_currency $portfolio_value)${NC}"
    fi
    echo ""
}

# Function to display recent activity
show_recent_activity() {
    echo -e "${BOLD}${BLUE}⚡ RECENT ACTIVITY${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    
    local overview_data
    overview_data=$(api_call "/dashboard/overview-metrics")
    
    if json_success "$overview_data"; then
        local last_24h=$(extract_json_value "$overview_data" "data.last24hTrades" "0")
        local last_hour=$(extract_json_value "$overview_data" "data.lastHourTrades" "0")
        local trading_velocity=$(extract_json_value "$overview_data" "data.tradingVelocity" "0")
        local open_positions=$(extract_json_value "$overview_data" "data.openPositions" "0")
        local total_positions=$(extract_json_value "$overview_data" "data.totalPositions" "0")
        
        echo -e "  ${WHITE}Last 24 Hours:${NC}      ${CYAN}$(format_number $last_24h)${NC} trades"
        echo -e "  ${WHITE}Last Hour:${NC}          ${CYAN}$(format_number $last_hour)${NC} trades"
        echo -e "  ${WHITE}Trading Velocity:${NC}   ${YELLOW}$(printf "%.1f" "$trading_velocity")${NC} trades/hour"
        echo -e "  ${WHITE}Open Positions:${NC}     ${GREEN}$(format_number $open_positions)${NC}"
        echo -e "  ${WHITE}Total Positions:${NC}    ${CYAN}$(format_number $total_positions)${NC}"
    else
        echo -e "  ${YELLOW}⚠️  Using database fallback${NC}"
        local trading_velocity=$(echo "scale=1; $FALLBACK_LAST_24H / 24" | bc -l 2>/dev/null || echo "0")
        echo -e "  ${WHITE}Last 24 Hours:${NC}      ${CYAN}$(format_number $FALLBACK_LAST_24H)${NC} trades"
        echo -e "  ${WHITE}Last Hour:${NC}          ${CYAN}$(format_number $FALLBACK_LAST_HOUR)${NC} trades"
        echo -e "  ${WHITE}Trading Velocity:${NC}   ${YELLOW}$(printf "%.1f" "$trading_velocity")${NC} trades/hour"
        echo -e "  ${WHITE}Open Positions:${NC}     ${GREEN}$(format_number $FALLBACK_OPEN_POSITIONS)${NC}"
        echo -e "  ${WHITE}Total Positions:${NC}    ${CYAN}$(format_number $FALLBACK_TOTAL_POSITIONS)${NC}"
    fi
    
    # Show recent strategies used
    local recent_strategies
    recent_strategies=$(db_query "SELECT DISTINCT strategy FROM \"ManagedTrade\" WHERE \"executedAt\" > NOW() - INTERVAL '1 hour' LIMIT 3;" | tr '\n' ',' | sed 's/,$//')
    if [[ -n "$recent_strategies" && "$recent_strategies" != "0" ]]; then
        echo -e "  ${WHITE}Active Strategies:${NC}   ${PURPLE}$(echo "$recent_strategies" | cut -c1-35)...${NC}"
    fi
    echo ""
}

# Function to display system health
show_system_health() {
    echo -e "${BOLD}${WHITE}🛡️  SYSTEM HEALTH${NC}"
    echo -e "${WHITE}═══════════════════════════════════════${NC}"
    
    local overview_data
    overview_data=$(api_call "/dashboard/overview-metrics")
    
    if json_success "$overview_data"; then
        local system_health=$(extract_json_value "$overview_data" "data.systemHealth" "unknown")
        local intuition_analyses=$(extract_json_value "$overview_data" "data.intuitionAnalyses" "0")
        
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
        
        # Check if trading system is running (multiple possible processes)
        if pgrep -f "production-trading-with-positions.ts" > /dev/null || \
           pgrep -f "load-database-strategies.ts" > /dev/null || \
           pgrep -f "strategy-execution-engine.ts" > /dev/null; then
            echo -e "  ${WHITE}Trading Engine:${NC}     ${GREEN}RUNNING${NC}"
        else
            echo -e "  ${WHITE}Trading Engine:${NC}     ${RED}STOPPED${NC}"
        fi
        
        # Check database connection
        local db_status
        if timeout 3s docker exec signalcartel-warehouse pg_isready -U warehouse_user -d signalcartel > /dev/null 2>&1; then
            echo -e "  ${WHITE}Database:${NC}           ${GREEN}ONLINE${NC}"
        else
            echo -e "  ${WHITE}Database:${NC}           ${RED}OFFLINE${NC}"
        fi
        
        # Check website (container or process)
        if docker ps | grep -q "signalcartel-website.*Up" || \
           pgrep -f "next.*start" > /dev/null || \
           curl -s --connect-timeout 2 http://localhost:3001/ > /dev/null 2>&1; then
            echo -e "  ${WHITE}Website:${NC}            ${GREEN}RUNNING${NC}"
        else
            echo -e "  ${WHITE}Website:${NC}            ${YELLOW}OPTIONAL${NC}"
        fi
        
    else
        echo -e "  ${YELLOW}⚠️  Using database fallback${NC}"
        
        # Calculate system health based on fallback data (more realistic thresholds)
        local system_health="good"
        local health_color="${CYAN}"
        
        # Check if trading engine is running
        local trading_running=false
        if pgrep -f "production-trading-with-positions.ts" > /dev/null || \
           pgrep -f "load-database-strategies.ts" > /dev/null || \
           pgrep -f "strategy-execution-engine.ts" > /dev/null; then
            trading_running=true
        fi
        
        # Improved health logic
        if [[ "$trading_running" == "true" ]] && [[ $(echo "$FALLBACK_WIN_RATE >= 50" | bc -l 2>/dev/null || echo 0) -eq 1 ]] && [[ $(echo "$FALLBACK_TOTAL_PNL > 100" | bc -l 2>/dev/null || echo 0) -eq 1 ]]; then
            system_health="excellent"
            health_color="${GREEN}"
        elif [[ "$trading_running" == "true" ]] && [[ $(echo "$FALLBACK_TOTAL_PNL >= 0" | bc -l 2>/dev/null || echo 0) -eq 1 ]]; then
            system_health="good"
            health_color="${CYAN}"
        elif [[ "$trading_running" == "true" ]] && [[ $(echo "$FALLBACK_TOTAL_PNL >= -50" | bc -l 2>/dev/null || echo 0) -eq 1 ]]; then
            system_health="warning"
            health_color="${YELLOW}"
        elif [[ "$trading_running" == "false" ]]; then
            system_health="maintenance"
            health_color="${YELLOW}"
        else
            system_health="critical"
            health_color="${RED}"
        fi
        
        echo -e "  ${WHITE}Overall Health:${NC}     ${health_color}${system_health^^}${NC}"
        echo -e "  ${WHITE}AI Analyses:${NC}        ${PURPLE}N/A (fallback mode)${NC}"
        
        # Check if trading system is running (multiple possible processes)
        if pgrep -f "production-trading-with-positions.ts" > /dev/null || \
           pgrep -f "load-database-strategies.ts" > /dev/null || \
           pgrep -f "strategy-execution-engine.ts" > /dev/null; then
            echo -e "  ${WHITE}Trading Engine:${NC}     ${GREEN}RUNNING${NC}"
        else
            echo -e "  ${WHITE}Trading Engine:${NC}     ${RED}STOPPED${NC}"
        fi
        
        # Check database connection
        if timeout 3s docker exec signalcartel-warehouse pg_isready -U warehouse_user -d signalcartel > /dev/null 2>&1; then
            echo -e "  ${WHITE}Database:${NC}           ${GREEN}ONLINE${NC}"
        else
            echo -e "  ${WHITE}Database:${NC}           ${RED}OFFLINE${NC}"
        fi
        
        # Check website (container or process)
        if docker ps | grep -q "signalcartel-website.*Up" || \
           pgrep -f "next.*start" > /dev/null || \
           curl -s --connect-timeout 2 http://localhost:3001/ > /dev/null 2>&1; then
            echo -e "  ${WHITE}Website:${NC}            ${GREEN}RUNNING${NC}"
        else
            echo -e "  ${WHITE}Website:${NC}            ${YELLOW}OPTIONAL${NC}"
        fi
    fi
    echo ""
}

# Function to display data warehousing status
show_data_warehousing() {
    echo -e "${BOLD}${PURPLE}📊 LOCAL DATA WAREHOUSE${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════${NC}"
    
    # Always get warehouse data directly from database
    # Get market data warehouse record counts - with recent activity focus
    local market_data_points=$(db_query "SELECT COUNT(*) FROM \"MarketData\";")
    local market_data_1h=$(db_query "SELECT COUNT(*) FROM \"MarketData\" WHERE \"timestamp\" > NOW() - INTERVAL '1 hour';")
    local trading_signals=$(db_query "SELECT COUNT(*) FROM \"TradingSignal\";")
    local recent_trading_signals=$(db_query "SELECT COUNT(*) FROM \"TradingSignal\" WHERE \"createdAt\" > NOW() - INTERVAL '24 hours';")
    local enhanced_signals=$(db_query "SELECT COUNT(*) FROM \"EnhancedTradingSignal\";")
    
    # Analytics database consolidated data
    local consolidated_market_data=$(db_query "SELECT COUNT(*) FROM \"consolidated_market_data\";" "signalcartel_analytics")
    
    echo -e "  ${YELLOW}📊 Direct database access${NC}"
    echo -e "  ${WHITE}Market Data (Local):${NC}   ${CYAN}$(format_number $market_data_points)${NC}"
    echo -e "  ${WHITE}Market Data (1hr):${NC}     ${GREEN}$(format_number $market_data_1h)${NC}"
    echo -e "  ${WHITE}Trading Signals:${NC}       ${CYAN}$(format_number $trading_signals)${NC}"
    echo -e "  ${WHITE}Recent Signals (24h):${NC}  ${GREEN}$(format_number $recent_trading_signals)${NC}"
    echo -e "  ${WHITE}Enhanced Signals:${NC}      ${PURPLE}$(format_number $enhanced_signals)${NC}"
    
    # Data collection health indicator
    if [[ "$market_data_1h" -gt 100 ]]; then
        echo -e "  ${WHITE}Collection Status:${NC}    ${GREEN}ACTIVE${NC} ($(format_number $market_data_1h)/hr)"
    elif [[ "$market_data_1h" -gt 10 ]]; then
        echo -e "  ${WHITE}Collection Status:${NC}    ${YELLOW}SLOW${NC} ($(format_number $market_data_1h)/hr)"
    else
        echo -e "  ${WHITE}Collection Status:${NC}    ${RED}STALLED${NC} ($(format_number $market_data_1h)/hr)"
    fi
    
    # Show consolidated data status - check if ANY consolidated data exists (not just market data)
    local consolidated_trades=$(db_query "SELECT COUNT(*) FROM \"consolidated_trades\";" "signalcartel_analytics")
    local consolidated_positions=$(db_query "SELECT COUNT(*) FROM \"consolidated_positions\";" "signalcartel_analytics") 
    local consolidated_sentiment=$(db_query "SELECT COUNT(*) FROM \"consolidated_sentiment\";" "signalcartel_analytics")
    local total_consolidated=$((consolidated_trades + consolidated_positions + consolidated_sentiment))
    if [[ "$total_consolidated" -gt 100 ]]; then
        echo -e "  ${WHITE}Multi-Instance Sync:${NC}  ${GREEN}ACTIVE${NC}"
        echo -e "  ${WHITE}Consolidated Available:${NC} ${GREEN}$(format_number $total_consolidated)${NC} records"
    else
        echo -e "  ${WHITE}Multi-Instance Sync:${NC}  ${RED}NOT SYNCING${NC}"
        echo -e "  ${WHITE}Expected vs Actual:${NC}   ${RED}Need 100+ vs $(format_number $total_consolidated)${NC}"
    fi
    echo ""
}

# Function to display analytics database status  
show_analytics_status() {
    echo -e "${BOLD}${CYAN}🌐 CROSS-SITE ANALYTICS${NC}"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    
    # Always get analytics data directly from database
    # Check analytics database connection
    local analytics_db_status="offline"
    if timeout 3s docker exec -e PGPASSWORD=quantum_forge_warehouse_2024 signalcartel-warehouse pg_isready -U warehouse_user -d signalcartel_analytics > /dev/null 2>&1; then
        analytics_db_status="online"
    fi
    
    # Analytics database record counts (consolidated data)
    local consolidated_trades=$(db_query "SELECT COUNT(*) FROM \"consolidated_trades\";" "signalcartel_analytics")
    local consolidated_positions=$(db_query "SELECT COUNT(*) FROM \"consolidated_positions\";" "signalcartel_analytics") 
    local consolidated_sentiment=$(db_query "SELECT COUNT(*) FROM \"consolidated_sentiment\";" "signalcartel_analytics")
    local consolidated_market_data=$(db_query "SELECT COUNT(*) FROM \"consolidated_market_data\";" "signalcartel_analytics")
    local consolidated_signals=$(db_query "SELECT COUNT(*) FROM \"consolidated_trading_signals\";" "signalcartel_analytics")
    local consolidated_data_collection=$(db_query "SELECT COUNT(*) FROM \"consolidated_data_collection\";" "signalcartel_analytics")
    local learning_insights=$(db_query "SELECT COUNT(*) FROM \"learning_insights\";" "signalcartel_analytics")
    
    # Get production data for comparison
    local intuition_analysis=$(db_query "SELECT COUNT(*) FROM \"IntuitionAnalysis\";")
    local enhanced_signals=$(db_query "SELECT COUNT(*) FROM \"EnhancedTradingSignal\";")
    
    echo -e "  ${YELLOW}🌐 Direct analytics database access${NC}"
    
    # Analytics DB status
    if [[ "$analytics_db_status" == "online" ]]; then
        echo -e "  ${WHITE}Analytics DB:${NC}         ${GREEN}ONLINE${NC}"
    else
        echo -e "  ${WHITE}Analytics DB:${NC}         ${RED}OFFLINE${NC}"
    fi
    
    echo -e "  ${WHITE}Consolidated Trades:${NC}     ${CYAN}$(format_number $consolidated_trades)${NC}"
    echo -e "  ${WHITE}Consolidated Positions:${NC}  ${CYAN}$(format_number $consolidated_positions)${NC}"
    echo -e "  ${WHITE}Consolidated Signals:${NC}    ${CYAN}$(format_number $consolidated_signals)${NC}"
    echo -e "  ${WHITE}Cross-site Sentiment:${NC}    ${GREEN}$(format_number $consolidated_sentiment)${NC}"
    echo -e "  ${WHITE}Consolidated Market Data:${NC} ${PURPLE}$(format_number $consolidated_market_data)${NC}"
    
    # Show consolidated data collection system status
    if [[ "$consolidated_data_collection" -eq 0 ]]; then
        echo -e "  ${WHITE}Data Collection:${NC}      ${RED}$(format_number $consolidated_data_collection)${NC} ❌ NOT SYNCED"
    else
        echo -e "  ${WHITE}Data Collection:${NC}      ${GREEN}$(format_number $consolidated_data_collection)${NC} ✅ SYNCED"
    fi
    
    # Show production source data
    echo -e "  ${WHITE}Intuition Analysis:${NC}    ${GREEN}$(format_number $intuition_analysis)${NC} ✅ SOURCE"
    echo -e "  ${WHITE}Enhanced Signals:${NC}      ${CYAN}$(format_number $enhanced_signals)${NC}"
    echo -e "  ${WHITE}Learning Insights:${NC}     ${PURPLE}$(format_number $learning_insights)${NC}"
    
    # Multi-instance sync service status with our new reliable sync approach
    SYNC_STATUS="UNKNOWN"
    SYNC_ISSUES=""
    
    # Check if any sync process is running
    if pgrep -f "automated-data-sync-service.ts" > /dev/null; then
        SYNC_STATUS="${YELLOW}DEPRECATED${NC}"
        SYNC_ISSUES="Replace with reliable-data-sync.sh"
    elif pgrep -f "simple-sync-daemon.sh" > /dev/null; then
        SYNC_STATUS="${YELLOW}DEPRECATED${NC}"
        SYNC_ISSUES="Replace with reliable-data-sync.sh"
    elif pgrep -f "stable-data-sync-service.ts" > /dev/null; then
        SYNC_STATUS="${YELLOW}DEPRECATED${NC}"
        SYNC_ISSUES="Replace with reliable-data-sync.sh"
    else
        SYNC_STATUS="${BLUE}MANUAL${NC}"
        SYNC_ISSUES="Use ./admin/reliable-data-sync.sh sync"
    fi
    
    # Display sync status with appropriate colors
    if [[ "$SYNC_STATUS" =~ "DEPRECATED" ]]; then
        echo -e "  ${WHITE}Data Sync Service:${NC}    $SYNC_STATUS"
        echo -e "  ${WHITE}└─ Recommendation:${NC}   ${YELLOW}$SYNC_ISSUES${NC}"
    elif [[ -n "$SYNC_ISSUES" ]]; then
        echo -e "  ${WHITE}Data Sync Service:${NC}    $SYNC_STATUS"
        echo -e "  ${WHITE}└─ Usage:${NC}            ${BLUE}$SYNC_ISSUES${NC}"
    else
        echo -e "  ${WHITE}Data Sync Service:${NC}    $SYNC_STATUS"
    fi
    echo ""
}

# Function to display footer
show_footer() {
    echo -e "${BOLD}${CYAN}════════════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${WHITE}Press ${RED}Ctrl+C${NC} to exit | Refresh every ${BLUE}${REFRESH_INTERVAL}s${NC} | ${PURPLE}QUANTUM FORGE™${NC} Terminal Dashboard"
    echo ""
}

# Function to display two columns side by side
show_two_columns() {
    local left_content="$1"
    local right_content="$2"
    
    # Convert content to arrays
    IFS=$'\n' read -d '' -r -a left_lines <<< "$left_content" || true
    IFS=$'\n' read -d '' -r -r -a right_lines <<< "$right_content" || true
    
    # Get max lines
    local max_lines=${#left_lines[@]}
    if [[ ${#right_lines[@]} -gt $max_lines ]]; then
        max_lines=${#right_lines[@]}
    fi
    
    # Display side by side
    for ((i=0; i<max_lines; i++)); do
        local left_line="${left_lines[i]:-}"
        local right_line="${right_lines[i]:-}"
        
        # Pad left column to 42 characters (removing ANSI codes for length calculation)
        local left_plain=$(echo "$left_line" | sed 's/\x1b\[[0-9;]*m//g')
        local left_padding=$((42 - ${#left_plain}))
        if [[ $left_padding -lt 0 ]]; then left_padding=0; fi
        local left_padded="$left_line$(printf "%*s" $left_padding "")"
        
        echo -e "$left_padded$right_line"
    done
}

# Main dashboard function
show_dashboard() {
    while true; do
        show_header
        
        # Try API first, fall back to database if needed
        local api_test=$(api_call "/dashboard/overview-metrics")
        if ! json_success "$api_test"; then
            echo -e "${YELLOW}API unavailable, querying PostgreSQL directly...${NC}"
            get_db_stats
        fi
        
        show_phase_info
        
        # Two-column layout for main sections
        local left_content
        local right_content
        
        # Left column: Trading Stats + P&L
        left_content=$(show_trading_stats; show_pnl_info)
        # Right column: Recent Activity + System Health  
        right_content=$(show_recent_activity; show_system_health)
        
        show_two_columns "$left_content" "$right_content"
        
        # Two-column layout for data sections
        left_content=$(show_data_warehousing)
        right_content=$(show_analytics_status)
        
        show_two_columns "$left_content" "$right_content"
        
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

# Try to install jq if not available
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Installing jq JSON processor...${NC}"
    if command -v apt-get &> /dev/null; then
        sudo apt-get update -qq && sudo apt-get install -y -qq jq >/dev/null 2>&1 || {
            echo -e "${RED}Warning: Could not install jq. Using fallback JSON parsing.${NC}"
            USE_FALLBACK_JSON=true
        }
    elif command -v yum &> /dev/null; then
        sudo yum install -y jq >/dev/null 2>&1 || {
            echo -e "${RED}Warning: Could not install jq. Using fallback JSON parsing.${NC}"
            USE_FALLBACK_JSON=true
        }
    else
        echo -e "${RED}Warning: jq not available. Using fallback JSON parsing.${NC}"
        USE_FALLBACK_JSON=true
    fi
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