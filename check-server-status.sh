#!/bin/bash

# Signal Cartel Trading System - Server Status Checker
# Quick status check for all trading system services

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE} Signal Cartel Trading System - Status Check${NC}"
echo -e "${BLUE}================================================${NC}"

# Check server status file
if [ -f ".server-status" ]; then
    echo -e "\n${CYAN}📊 Server Status File:${NC}"
    cat .server-status
else
    echo -e "\n${YELLOW}⚠️  No server status file found${NC}"
fi

echo -e "\n${CYAN}🔍 Service Status:${NC}"
echo "=================="

# Function to check service status
check_service_status() {
    local service_name="$1"
    local display_name="$2"
    local pid_file="${service_name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${GREEN}✅ $display_name (PID: $pid)${NC}"
            return 0
        else
            echo -e "${RED}❌ $display_name (stale PID)${NC}"
            return 1
        fi
    else
        # Try to find process by name
        local pids=$(pgrep -f "$service_name" || true)
        if [ -n "$pids" ]; then
            echo -e "${YELLOW}⚠️  $display_name (running without PID file: $pids)${NC}"
            return 1
        else
            echo -e "${RED}❌ $display_name (not running)${NC}"
            return 1
        fi
    fi
}

# Check all services
total_services=0
running_services=0

services=(
    "market-data-collector:Market Data Collection"
    "ai-optimization-engine:AI Optimization Engine" 
    "strategy-execution-engine:Strategy Execution Engine"
    "alert-generation-engine:Alert Generation System"
    "stratus-engine:Stratus Engine"
    "nextjs-server:Next.js Development Server"
)

for service in "${services[@]}"; do
    IFS=':' read -r process_name display_name <<< "$service"
    if check_service_status "$process_name" "$display_name"; then
        ((running_services++))
    fi
    ((total_services++))
done

echo -e "\n${CYAN}🌐 Port Status:${NC}"
echo "==============="

ports=(3001 3000 8080)
for port in "${ports[@]}"; do
    if lsof -ti:$port &>/dev/null; then
        local pid=$(lsof -ti:$port)
        echo -e "${GREEN}✅ Port $port (PID: $pid)${NC}"
    else
        echo -e "${RED}❌ Port $port (not in use)${NC}"
    fi
done

echo -e "\n${CYAN}📊 API Endpoints:${NC}"
echo "=================="

# Check API endpoints if server is running
if lsof -ti:3001 &>/dev/null; then
    endpoints=(
        "/:Dashboard"
        "/api/market-data/status:Market Data API"
        "/api/engine-status:Engine Status API"
        "/api/dynamic-triggers?action=status:Dynamic Triggers API"
    )
    
    for endpoint in "${endpoints[@]}"; do
        IFS=':' read -r path description <<< "$endpoint"
        if curl -s -f "http://localhost:3001$path" &>/dev/null; then
            echo -e "${GREEN}✅ $description${NC}"
        else
            echo -e "${RED}❌ $description${NC}"
        fi
    done
else
    echo -e "${YELLOW}⚠️  Server not running on port 3001, cannot check API endpoints${NC}"
fi

echo -e "\n${CYAN}📁 Log Files:${NC}"
echo "============="

for log_file in *.log; do
    if [ -f "$log_file" ]; then
        local size=$(stat -f%z "$log_file" 2>/dev/null || stat -c%s "$log_file" 2>/dev/null || echo 0)
        local size_mb=$((size / 1024 / 1024))
        local modified=$(stat -f%Sm -t%Y-%m-%d\ %H:%M "$log_file" 2>/dev/null || stat -c%y "$log_file" 2>/dev/null | cut -d. -f1)
        echo -e "${CYAN}📄 $log_file${NC} (${size_mb}MB, modified: $modified)"
        
        # Show last few lines if log exists and has content
        if [ "$size" -gt 0 ]; then
            echo -e "${YELLOW}   Last entry:${NC} $(tail -n1 "$log_file" 2>/dev/null)"
        fi
    fi
done

echo -e "\n${CYAN}💾 Database Status:${NC}"
echo "=================="

if [ -f "prisma/dev.db" ]; then
    local db_size=$(stat -f%z "prisma/dev.db" 2>/dev/null || stat -c%s "prisma/dev.db" 2>/dev/null || echo 0)
    local db_size_mb=$((db_size / 1024 / 1024))
    echo -e "${GREEN}✅ Database exists${NC} (${db_size_mb}MB)"
else
    echo -e "${RED}❌ Database not found${NC}"
fi

echo -e "\n${CYAN}📊 Summary:${NC}"
echo "==========="
echo -e "Services: ${running_services}/${total_services} running"

if [ "$running_services" -eq "$total_services" ]; then
    echo -e "${GREEN}🎉 All systems operational!${NC}"
    echo -e "${GREEN}🌐 Dashboard: http://localhost:3001${NC}"
elif [ "$running_services" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Partial system operation${NC}"
    echo -e "${YELLOW}💡 Run './start-server.sh' to start missing services${NC}"
else
    echo -e "${RED}❌ System not running${NC}"
    echo -e "${RED}🚀 Run './start-server.sh' to start all services${NC}"
fi

echo -e "\n${CYAN}⚡ Quick Actions:${NC}"
echo "================="
echo -e "${GREEN}Start: ${NC}./start-server.sh"
echo -e "${GREEN}Stop:  ${NC}./stop-server.sh"
echo -e "${GREEN}Test:  ${NC}npx tsx test-status-monitors.ts"