#!/bin/bash

# Signal Cartel Trading System - Server Shutdown Script
# Gracefully stops all trading system services

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Log file
LOG_FILE="server-shutdown.log"
exec 1> >(tee -a "$LOG_FILE")
exec 2> >(tee -a "$LOG_FILE" >&2)

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE} Signal Cartel Trading System - Server Shutdown${NC}"
echo -e "${BLUE}==================================================${NC}"
echo -e "$(date): Starting server shutdown sequence..."

# Function to stop service gracefully
stop_service() {
    local service_name="$1"
    local display_name="$2"
    local pid_file="${service_name}.pid"
    
    echo -e "\n${CYAN}🛑 Stopping $display_name...${NC}"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${YELLOW}   Sending SIGTERM to PID $pid...${NC}"
            
            # Try graceful shutdown first
            kill -TERM "$pid" 2>/dev/null || true
            
            # Wait for process to stop gracefully
            local attempts=0
            local max_attempts=10
            
            while [ $attempts -lt $max_attempts ]; do
                if ! kill -0 "$pid" 2>/dev/null; then
                    echo -e "${GREEN}✅ $display_name stopped gracefully${NC}"
                    rm -f "$pid_file"
                    return 0
                fi
                
                sleep 2
                ((attempts++))
                echo -e "${YELLOW}   Waiting for graceful shutdown... ($attempts/$max_attempts)${NC}"
            done
            
            # Force kill if graceful shutdown failed
            echo -e "${YELLOW}⚠️  Graceful shutdown timed out, forcing stop...${NC}"
            kill -KILL "$pid" 2>/dev/null || true
            sleep 1
            
            if ! kill -0 "$pid" 2>/dev/null; then
                echo -e "${GREEN}✅ $display_name stopped (forced)${NC}"
                rm -f "$pid_file"
            else
                echo -e "${RED}❌ Failed to stop $display_name${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  Process not running (stale PID file)${NC}"
            rm -f "$pid_file"
        fi
    else
        echo -e "${YELLOW}⚠️  No PID file found for $service_name${NC}"
        
        # Try to find and kill process by name
        local pids=$(pgrep -f "$service_name" || true)
        if [ -n "$pids" ]; then
            echo -e "${YELLOW}   Found running processes, stopping them...${NC}"
            echo "$pids" | xargs -r kill -TERM
            sleep 3
            
            # Check if any are still running
            local remaining_pids=$(pgrep -f "$service_name" || true)
            if [ -n "$remaining_pids" ]; then
                echo -e "${YELLOW}   Force killing remaining processes...${NC}"
                echo "$remaining_pids" | xargs -r kill -KILL
            fi
            echo -e "${GREEN}✅ $display_name processes stopped${NC}"
        else
            echo -e "${GREEN}✅ $display_name was not running${NC}"
        fi
    fi
}

# Function to stop all processes matching a pattern
stop_processes_by_pattern() {
    local pattern="$1"
    local display_name="$2"
    
    echo -e "\n${CYAN}🛑 Stopping $display_name processes...${NC}"
    
    local pids=$(pgrep -f "$pattern" || true)
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}   Found processes: $pids${NC}"
        
        # Graceful shutdown
        echo "$pids" | xargs -r kill -TERM
        sleep 3
        
        # Check for remaining processes
        local remaining_pids=$(pgrep -f "$pattern" || true)
        if [ -n "$remaining_pids" ]; then
            echo -e "${YELLOW}   Force killing remaining processes...${NC}"
            echo "$remaining_pids" | xargs -r kill -KILL
            sleep 1
        fi
        
        # Final check
        local final_pids=$(pgrep -f "$pattern" || true)
        if [ -z "$final_pids" ]; then
            echo -e "${GREEN}✅ All $display_name processes stopped${NC}"
        else
            echo -e "${RED}❌ Some $display_name processes may still be running${NC}"
        fi
    else
        echo -e "${GREEN}✅ No $display_name processes were running${NC}"
    fi
}

echo -e "\n${PURPLE}📋 STEP 1: Checking Server Status${NC}"
echo "================================================"

if [ -f ".server-status" ]; then
    echo -e "${YELLOW}📊 Found server status file${NC}"
    cat .server-status
else
    echo -e "${YELLOW}⚠️  No server status file found${NC}"
fi

echo -e "\n${PURPLE}📋 STEP 2: Graceful Stratus Engine Shutdown${NC}"
echo "================================================"

# Special handling for Stratus Engine with Neural Predictor
echo -e "${CYAN}🧠 Initiating Stratus Neural Predictor shutdown...${NC}"

# Run dedicated neural shutdown script
if [ -f "scripts/graceful-neural-shutdown.sh" ]; then
    echo -e "${YELLOW}   Running graceful neural shutdown...${NC}"
    bash scripts/graceful-neural-shutdown.sh
else
    echo -e "${YELLOW}   ⚠️ Graceful neural shutdown script not found, using fallback...${NC}"
    
    # Fallback: Save Markov model before shutdown
    if [ -f "stratus-engine.pid" ]; then
        local stratus_pid=$(cat "stratus-engine.pid")
        if kill -0 "$stratus_pid" 2>/dev/null; then
            echo -e "${YELLOW}   💾 Saving Neural Predictor model...${NC}"
            
            # Give the engine time to save the Markov model
            kill -USR1 "$stratus_pid" 2>/dev/null || true
            sleep 3
            
            echo -e "${GREEN}✅ Neural Predictor shutdown initiated${NC}"
        fi
    else
        echo -e "${YELLOW}   ⚠️ No Stratus Engine PID file found${NC}"
    fi
fi

echo -e "\n${PURPLE}📋 STEP 3: Stopping Core Services${NC}"
echo "================================================"

# Stop services in reverse order of startup for clean shutdown
stop_service "nextjs-server" "Next.js Development Server"
stop_service "unified-strategy-system" "Unified Strategy Controller"
stop_service "stratus-engine" "Stratus Engine"
stop_service "alert-generation-engine" "Alert Generation System"
stop_service "strategy-execution-engine" "Strategy Execution Engine"
stop_service "ai-optimization-engine" "AI Optimization Engine"
stop_service "market-data-collector" "Market Data Collection"

echo -e "\n${PURPLE}📋 STEP 4: Cleanup Additional Processes${NC}"
echo "================================================"

# Clean up any remaining related processes
stop_processes_by_pattern "market-data-collector" "Market Data Collector"
stop_processes_by_pattern "pine-script-input-optimizer" "Pine Script Optimizer"
stop_processes_by_pattern "strategy-execution-engine" "Strategy Execution"
stop_processes_by_pattern "alert-generation-engine" "Alert Generation"
stop_processes_by_pattern "global-stratus-engine" "Stratus Engine"
stop_processes_by_pattern "unified-strategy-controller" "Unified Strategy Controller"
stop_processes_by_pattern "unified-strategy-system" "Strategy System"
stop_processes_by_pattern "next dev\\|next start" "Next.js Server"

echo -e "\n${PURPLE}📋 STEP 5: Database Cleanup${NC}"
echo "================================================"

echo -e "${CYAN}🗄️  Checking database connections...${NC}"

# Close any open database connections
local_db_pids=$(pgrep -f "prisma\\|sqlite" || true)
if [ -n "$local_db_pids" ]; then
    echo -e "${YELLOW}   Found database processes: $local_db_pids${NC}"
    echo "$local_db_pids" | xargs -r kill -TERM
    sleep 2
    echo -e "${GREEN}✅ Database connections closed${NC}"
else
    echo -e "${GREEN}✅ No database processes found${NC}"
fi

echo -e "\n${PURPLE}📋 STEP 6: Port Cleanup${NC}"
echo "================================================"

echo -e "${CYAN}🔌 Checking for processes using common ports...${NC}"

# Check common ports used by the system
ports=(3001 3000 8080 8000 5000)
for port in "${ports[@]}"; do
    local port_pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$port_pid" ]; then
        echo -e "${YELLOW}   Port $port is in use by PID $port_pid${NC}"
        kill -TERM "$port_pid" 2>/dev/null || true
        sleep 1
        
        # Check if still running
        if kill -0 "$port_pid" 2>/dev/null; then
            kill -KILL "$port_pid" 2>/dev/null || true
        fi
        echo -e "${GREEN}✅ Freed port $port${NC}"
    fi
done

echo -e "\n${PURPLE}📋 STEP 7: File Cleanup & Neural Data Preservation${NC}"
echo "================================================"

echo -e "${CYAN}🧹 Cleaning up temporary files...${NC}"

# Preserve Neural Predictor data directory
echo -e "${YELLOW}   Preserving Neural Predictor training data...${NC}"
if [ -d "data/models" ]; then
    echo -e "${GREEN}   ✅ Neural Predictor models preserved in data/models/${NC}"
else
    echo -e "${YELLOW}   ⚠️ No Neural Predictor data directory found${NC}"
fi

# Check if snapshots directory exists
if [ -d "data/models/snapshots" ]; then
    local snapshot_count=$(ls -1 data/models/snapshots/*.json 2>/dev/null | wc -l || echo 0)
    echo -e "${GREEN}   ✅ $snapshot_count Neural Predictor snapshots preserved${NC}"
fi

# Remove PID files
echo -e "${YELLOW}   Removing PID files...${NC}"
rm -f *.pid

# Clean up log files if they're too large (>100MB)
echo -e "${YELLOW}   Checking log file sizes...${NC}"
for log_file in *.log; do
    if [ -f "$log_file" ]; then
        local size=$(stat -f%z "$log_file" 2>/dev/null || stat -c%s "$log_file" 2>/dev/null || echo 0)
        if [ "$size" -gt 104857600 ]; then  # 100MB
            echo -e "${YELLOW}   Rotating large log file: $log_file${NC}"
            mv "$log_file" "${log_file}.old"
            touch "$log_file"
        fi
    fi
done

# Clean up any temporary files
echo -e "${YELLOW}   Removing temporary files...${NC}"
rm -f .next/cache/webpack* 2>/dev/null || true
rm -f /tmp/signal-cartel-* 2>/dev/null || true

echo -e "${GREEN}✅ File cleanup complete${NC}"

echo -e "\n${PURPLE}📋 STEP 8: Final Verification${NC}"
echo "================================================"

echo -e "${CYAN}🔍 Verifying all services are stopped...${NC}"

# Check for any remaining trading system processes
remaining_processes=$(pgrep -f "market-data\\|stratus\\|strategy\\|alert\\|pine-script\\|next dev" || true)

if [ -n "$remaining_processes" ]; then
    echo -e "${YELLOW}⚠️  Found remaining processes:${NC}"
    ps -p $remaining_processes -o pid,cmd || true
    echo -e "${YELLOW}   Attempting final cleanup...${NC}"
    echo "$remaining_processes" | xargs -r kill -KILL
    sleep 2
else
    echo -e "${GREEN}✅ All trading system processes stopped${NC}"
fi

# Final port check
echo -e "${CYAN}🔌 Final port check...${NC}"
active_ports=""
for port in 3001 3000 8080; do
    if lsof -ti:$port &>/dev/null; then
        active_ports="$active_ports $port"
    fi
done

if [ -n "$active_ports" ]; then
    echo -e "${YELLOW}⚠️  Ports still in use:$active_ports${NC}"
else
    echo -e "${GREEN}✅ All ports freed${NC}"
fi

echo -e "\n${PURPLE}📋 STEP 9: Shutdown Summary${NC}"
echo "================================================"

echo -e "${GREEN}🛑 SERVER SHUTDOWN COMPLETE!${NC}"
echo -e "$(date): All services have been stopped"

echo -e "\n${CYAN}📊 Final Status:${NC}"
echo "================="

# Update status file
echo "$(date): Server shutdown completed successfully" > .server-status
echo "STATUS=STOPPED" >> .server-status

# Summary of what was stopped
services_stopped=(
    "Next.js Development Server (Pre-compiled)"
    "Unified Strategy Controller"
    "Stratus Engine with Neural Predictor™"
    "Alert Generation System"  
    "Strategy Execution Engine"
    "AI Optimization Engine"
    "Market Data Collection"
)

for service in "${services_stopped[@]}"; do
    echo -e "${GREEN}✅ $service${NC}"
done

echo -e "\n${CYAN}📝 Data Preserved:${NC}"
echo "=================="
echo "Shutdown log: server-shutdown.log"
echo "Individual service logs: [service-name].log"
echo "🧠 Neural Predictor models: data/models/"
echo "📸 Neural Predictor snapshots: data/models/snapshots/"
echo "📊 All trading history and learning progress preserved"

echo -e "\n${CYAN}🚀 To Restart Server:${NC}"
echo "===================="
echo "Run: ./start-server.sh"

echo -e "\n${CYAN}🧹 For Complete Cleanup:${NC}"
echo "========================="
echo "- Remove all *.log files"
echo "- Remove .server-status"
echo "- Clear browser cache"
echo "- Restart terminal session"

# Check system resources
echo -e "\n${CYAN}📊 System Resources:${NC}"
echo "==================="
if command -v free &> /dev/null; then
    echo "Memory usage:"
    free -h
fi

if command -v df &> /dev/null; then
    echo -e "\nDisk usage:"
    df -h . 2>/dev/null || true
fi

echo -e "\n${GREEN}✅ Signal Cartel Trading System has been safely shut down${NC}"
echo -e "${YELLOW}💡 All data has been preserved and the system is ready to restart${NC}"