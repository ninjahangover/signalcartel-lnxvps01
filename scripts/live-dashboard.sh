#!/bin/bash

# Live Dashboard - Compact real-time monitoring
# Shows key metrics in a constantly updating display

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# Clear screen and hide cursor
clear
tput civis

# Cleanup function
cleanup() {
    tput cnorm  # Show cursor
    clear
    echo "Dashboard stopped."
    exit 0
}

trap cleanup SIGINT SIGTERM

# Main dashboard loop
while true; do
    # Move cursor to top-left
    tput cup 0 0
    
    echo -e "${WHITE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${WHITE}         📊 SIGNALCARTEL LIVE DASHBOARD $(date '+%H:%M:%S')         ${NC}"
    echo -e "${WHITE}═══════════════════════════════════════════════════════════════${NC}"
    
    # System Status
    tsx_count=$(ps aux | grep tsx | grep -v grep | wc -l)
    next_count=$(ps aux | grep 'next dev' | grep -v grep | wc -l)
    total_processes=$((tsx_count + next_count))
    
    if [ $total_processes -gt 15 ]; then
        status_color="$GREEN"
        status="HEALTHY"
    elif [ $total_processes -gt 5 ]; then
        status_color="$YELLOW" 
        status="PARTIAL"
    else
        status_color="$RED"
        status="CRITICAL"
    fi
    
    echo -e "${WHITE}System Status:${NC} ${status_color}$status${NC} | Processes: $total_processes | $(date '+%Y-%m-%d %H:%M:%S')"
    
    # Memory and CPU
    memory_used=$(free | grep Mem: | awk '{printf "%.1f", $3/$2*100}')
    memory_avail=$(free -h | grep Mem: | awk '{print $7}')
    cpu_load=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | tr -d ',')
    
    echo -e "${WHITE}Resources:${NC} Memory: ${CYAN}${memory_used}%${NC} (${memory_avail} avail) | CPU Load: ${CYAN}$cpu_load${NC}"
    echo ""
    
    # Service Status
    echo -e "${WHITE}🔧 Services:${NC}"
    services=(
        "Next.js:next dev:📱"
        "Market Data:start-market-data:📊"
        "Strategy Engine:start-strategy-engine:⚡"
        "Alert Engine:start-alert-engine:🚨"
        "AI Optimizer:start-ai-optimizer:🧠"
        "Stratus Engine:start-stratus-engine:🎯"
    )
    
    for service in "${services[@]}"; do
        IFS=':' read -r name pattern icon <<< "$service"
        if ps aux | grep "$pattern" | grep -v grep > /dev/null; then
            pid=$(ps aux | grep "$pattern" | grep -v grep | awk '{print $2}' | head -1)
            echo -e "  ${GREEN}✅${NC} $icon $name ${CYAN}(PID: $pid)${NC}"
        else
            echo -e "  ${RED}❌${NC} $icon $name ${RED}(Not Running)${NC}"
        fi
    done
    
    echo ""
    
    # Latest Prices (if available)
    echo -e "${WHITE}💰 Live Prices:${NC}"
    if [ -f strategy-execution-engine.log ]; then
        btc_price=$(tail -20 strategy-execution-engine.log | grep "BTCUSD:" | tail -1 | grep -o '\$[0-9,]*' | tail -1)
        eth_price=$(tail -20 strategy-execution-engine.log | grep "ETHUSD:" | tail -1 | grep -o '\$[0-9,]*' | tail -1)
        sol_price=$(tail -20 strategy-execution-engine.log | grep "SOLUSD:" | tail -1 | grep -o '\$[0-9,]*' | tail -1)
        
        echo -e "  ${YELLOW}₿ BTC:${NC} ${btc_price:-"Loading..."}"
        echo -e "  ${BLUE}Ξ ETH:${NC} ${eth_price:-"Loading..."}"
        echo -e "  ${PURPLE}◎ SOL:${NC} ${sol_price:-"Loading..."}"
    else
        echo -e "  ${RED}Market data not available${NC}"
    fi
    
    echo ""
    
    # Trading Status
    echo -e "${WHITE}📈 Trading Status:${NC}"
    if curl -s http://127.0.0.1:3001/api/alpaca/account 2>/dev/null | grep -q "buying_power"; then
        buying_power=$(curl -s http://127.0.0.1:3001/api/alpaca/account 2>/dev/null | grep -o '"buying_power":[0-9.]*' | cut -d: -f2)
        positions=$(curl -s http://127.0.0.1:3001/api/alpaca/positions 2>/dev/null | grep -o '\[.*\]' | tr ',' '\n' | wc -l)
        positions=$((positions - 1))
        
        echo -e "  ${GREEN}✅${NC} Account Active | Buying Power: ${GREEN}\$$(printf "%.0f" $buying_power 2>/dev/null || echo "N/A")${NC}"
        echo -e "  ${CYAN}📊${NC} Active Positions: ${YELLOW}$positions${NC}"
    else
        echo -e "  ${RED}❌ Trading account unavailable${NC}"
    fi
    
    echo ""
    
    # Recent Activity (last few lines from logs)
    echo -e "${WHITE}🔄 Recent Activity:${NC}"
    
    # Show recent successful price fetches
    if [ -f strategy-execution-engine.log ]; then
        recent_activity=$(tail -5 strategy-execution-engine.log | grep "Successfully fetched\|BUY\|SELL\|Signal" | tail -3)
        if [ -n "$recent_activity" ]; then
            echo "$recent_activity" | while read line; do
                if echo "$line" | grep -q "Successfully fetched"; then
                    symbol=$(echo "$line" | grep -o '[A-Z]*USD' | head -1)
                    price=$(echo "$line" | grep -o '\$[0-9,]*\.[0-9]*' | head -1)
                    echo -e "  ${GREEN}📊${NC} $symbol: $price"
                elif echo "$line" | grep -qE "(BUY|SELL|Signal)"; then
                    echo -e "  ${YELLOW}⚡${NC} ${line:0:60}..."
                fi
            done
        else
            echo -e "  ${CYAN}ℹ️${NC}  Building market data history..."
        fi
    fi
    
    echo ""
    echo -e "${WHITE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}Press Ctrl+C to exit | Auto-refresh every 2 seconds${NC}"
    
    # Wait 2 seconds before refresh
    sleep 2
done