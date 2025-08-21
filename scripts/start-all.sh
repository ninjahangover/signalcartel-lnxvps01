#!/bin/bash

echo "🚀 Starting SignalCartel Trading System..."
echo "========================================="

# Check available resources
mem_available=$(free -m | awk 'NR==2{print $7}')
cpu_load=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | tr -d ',')
cpu_count=$(nproc)

echo "📊 System Resources:"
echo "  Memory: ${mem_available}MB available"
echo "  CPU: ${cpu_count} cores, load: ${cpu_load}"
echo ""

# Set memory limits based on available memory
if [ "$mem_available" -lt 2000 ]; then
    echo "⚠️  Low memory detected, applying resource limits..."
    export NODE_OPTIONS="--max-old-space-size=512"
    
    # Start resource manager for low-memory systems
    if [ -f ./scripts/resource-manager.sh ]; then
        echo "Starting resource manager..."
        nohup ./scripts/resource-manager.sh > logs/resource-manager.log 2>&1 &
        sleep 2
    fi
elif [ "$mem_available" -lt 4000 ]; then
    export NODE_OPTIONS="--max-old-space-size=1024"
else
    export NODE_OPTIONS="--max-old-space-size=2048"
fi

# Function to start a service and log it
start_service() {
    local name=$1
    local command=$2
    local log_file=$3
    
    echo "Starting $name..."
    nohup $command > "$log_file" 2>&1 &
    local pid=$!
    echo "$name started with PID $pid"
    sleep 2
}

# 1. Start Next.js server with monitoring
echo "📱 Starting Next.js server with monitoring..."
npm run dev > nextjs-server.log 2>&1 &
NEXT_PID=$!
echo "Next.js server started with PID $NEXT_PID"
echo "⏳ Waiting for Next.js server to be ready..."
sleep 10

# Wait for server to be responsive
max_wait=60
wait_time=0
SERVER_READY=false
while [ $wait_time -lt $max_wait ]; do
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001" | grep -q "200\|404"; then
        echo "✅ Next.js server is ready!"
        SERVER_READY=true
        break
    fi
    sleep 2
    wait_time=$((wait_time + 2))
    echo "⏳ Still waiting for Next.js server... (${wait_time}s)"
done

# Only proceed if server is ready
if [ "$SERVER_READY" = "true" ]; then
    echo "🚀 Server verified ready, starting services..."
    
    # Start website monitor in background
    if [ -f ./scripts/monitor-website.sh ]; then
        echo "🔍 Starting website monitor..."
        nohup ./scripts/monitor-website.sh > monitor-website.log 2>&1 &
        MONITOR_PID=$!
        echo "Website monitor started with PID $MONITOR_PID"
    fi

    # 2. Start Market Data Collector
    start_service "📊 Market Data Collector" \
        "npx tsx scripts/engines/market-data-collector.ts" \
        "market-data-collector.log" &&

    # 3. Start Strategy Execution Engine with proper initialization
    start_service "⚡ Strategy Execution Engine" \
        "npx tsx scripts/engines/strategy-execution-engine.ts" \
        "strategy-execution-engine.log" &&

    # 4. Start Alert Generation Engine
    start_service "🚨 Alert Generation Engine" \
        "npx tsx scripts/engines/alert-generation-engine.ts" \
        "alert-generation-engine.log" &&

    # 5. Start AI Optimization Engine
    start_service "🧠 AI Optimization Engine" \
        "npx tsx scripts/engines/ai-optimization-engine.ts" \
        "ai-optimization-engine.log" &&

    # 6. Start Stratus Engine (Master Controller)
    start_service "🎯 Stratus Engine" \
        "npx tsx scripts/engines/stratus-engine.ts" \
        "stratus-engine.log"
        
    if [ $? -eq 0 ]; then
        echo "✅ All services started successfully in sequence!"
    else
        echo "❌ Error starting one or more services"
        exit 1
    fi
else
    echo "❌ Next.js server failed to start within ${max_wait} seconds"
    echo "   Cannot proceed with starting other services"
    exit 1
fi

echo ""
echo "✅ All services started!"
echo "========================================="

# Health check after startup
sleep 3
echo "🏥 Health Check:"
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001" | grep -q "200\|404"; then
    echo "  ✅ Website: Running"
else
    echo "  ⚠️  Website: Starting..."
fi

node_count=$(pgrep -c node 2>/dev/null || echo 0)
tsx_count=$(pgrep -c tsx 2>/dev/null || echo 0)
echo "  📦 Processes: $node_count Node.js, $tsx_count TSX"

mem_used=$(free -m | awk 'NR==2{print $3}')
echo "  💾 Memory used: ${mem_used}MB"

echo ""
echo "📝 Commands:"
echo "  Monitor logs:     tail -f logs/*.log"
echo "  Check resources:  ./scripts/cleanup-processes.sh"
echo "  Stop all:         ./scripts/stop-all.sh"
echo ""

# Create stop script if it doesn't exist
if [ ! -f ./scripts/stop-all.sh ]; then
    cat > ./scripts/stop-all.sh << 'EOF'
#!/bin/bash
echo "Stopping all services..."
pkill -f "monitor-website.sh"
pkill -f "tsx.*market-data-collector"
pkill -f "tsx.*strategy-execution"
pkill -f "tsx.*alert-generation"
pkill -f "tsx.*pine-script-input"
pkill -f "tsx.*stratus-engine"
pkill -f "next dev"
echo "All services stopped"
EOF
    chmod +x ./scripts/stop-all.sh
fi

# Schedule log rotation
(
    while true; do
        sleep 3600  # Every hour
        ./scripts/rotate-logs.sh > /dev/null 2>&1
    done
) &

echo "Log rotation scheduled (hourly)"