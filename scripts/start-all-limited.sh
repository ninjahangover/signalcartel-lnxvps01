#!/bin/bash

echo "🚀 Starting SignalCartel Trading System (Resource Limited)..."
echo "========================================="

# Resource limits configuration
export NODE_OPTIONS="--max-old-space-size=512"  # Limit Node.js to 512MB heap
CPU_LIMIT=30  # Max 30% CPU per process

# Function to start a service with resource limits
start_limited_service() {
    local name=$1
    local command=$2
    local log_file=$3
    local cpu_limit=${4:-$CPU_LIMIT}
    
    echo "Starting $name (CPU limit: ${cpu_limit}%)..."
    
    # Start with nice priority and CPU limit
    nice -n 10 nohup bash -c "
        $command
    " > "$log_file" 2>&1 &
    
    local pid=$!
    echo "$name started with PID $pid"
    
    # Apply CPU limit using cpulimit if available
    if command -v cpulimit &> /dev/null; then
        cpulimit -p $pid -l $cpu_limit -b > /dev/null 2>&1
        echo "  Applied CPU limit of ${cpu_limit}%"
    fi
    
    sleep 2
}

# Clean up any existing processes first
echo "Cleaning up existing processes..."
./scripts/cleanup-processes.sh > /dev/null 2>&1

# Start resource manager
echo "🔧 Starting resource manager..."
nohup ./scripts/resource-manager.sh > logs/resource-manager.log 2>&1 &
RESOURCE_MGR_PID=$!
echo "Resource manager started with PID $RESOURCE_MGR_PID"
sleep 2

# 1. Start Next.js server with limits
echo "📱 Starting Next.js server with resource limits..."
nice -n 5 NODE_OPTIONS="--max-old-space-size=768" npm run dev > nextjs-server.log 2>&1 &
NEXT_PID=$!
echo "Next.js server started with PID $NEXT_PID (768MB memory limit)"

# Apply CPU limit to Next.js
if command -v cpulimit &> /dev/null; then
    cpulimit -p $NEXT_PID -l 50 -b > /dev/null 2>&1
fi

sleep 5

# Start website monitor
if [ -f ./scripts/monitor-website.sh ]; then
    echo "🔍 Starting website monitor..."
    nohup ./scripts/monitor-website.sh > monitor-website.log 2>&1 &
    MONITOR_PID=$!
    echo "Website monitor started with PID $MONITOR_PID"
fi

# 2. Start Market Data Collector (lower priority, less CPU)
start_limited_service "📊 Market Data Collector" \
    "NODE_OPTIONS='--max-old-space-size=256' npx tsx -e \"
    import { marketDataCollector } from './src/lib/market-data-collector.js';
    
    // Add resource limiter
    import { resourceLimiter } from './src/lib/resource-limiter.js';
    
    console.log('Starting market data collection with resource limits...');
    
    // Use throttled execution for data collection
    const startCollection = async () => {
        await resourceLimiter.throttledExecute(
            'market-data',
            () => marketDataCollector.startCollection(),
            { maxConcurrent: 1, delayMs: 1000 }
        );
    };
    
    await startCollection();
    
    setInterval(() => {
        if (marketDataCollector.isCollectionActive()) {
            const stats = resourceLimiter.getResourceStats();
            console.log('[' + new Date().toISOString() + '] Market data active | CPU: ' + stats.cpu.current.toFixed(1) + '%');
        }
    }, 300000);
    \"" \
    "market-data-collector.log" \
    25  # Lower CPU limit for data collection

# 3. Start Strategy Execution Engine (limited)
start_limited_service "⚡ Strategy Execution Engine" \
    "NODE_OPTIONS='--max-old-space-size=256' npx tsx -e \"
    import StrategyExecutionEngine from './src/lib/strategy-execution-engine.js';
    import strategyManager from './src/lib/strategy-manager.js';
    import { resourceLimiter } from './src/lib/resource-limiter.js';
    
    const engine = StrategyExecutionEngine.getInstance();
    engine.setPaperTradingMode(true);
    
    // Load strategies with throttling
    const strategies = await strategyManager.getStrategies();
    const activeStrategies = strategies.filter(s => s.isActive);
    
    console.log('Loading ' + activeStrategies.length + ' strategies with resource limits...');
    
    for (const strategy of activeStrategies) {
        await resourceLimiter.throttledExecute(
            'strategy-load',
            async () => {
                engine.addStrategy(strategy, strategy.symbol || 'BTCUSD');
                console.log('Added strategy: ' + strategy.name);
            },
            { delayMs: 500 }
        );
    }
    
    engine.startEngine();
    console.log('Strategy engine started with resource limits');
    
    setInterval(() => {
        const stats = resourceLimiter.getResourceStats();
        console.log('[' + new Date().toISOString() + '] Engine running | Memory: ' + stats.memory.usedMB + 'MB');
    }, 300000);
    \"" \
    "strategy-execution-engine.log" \
    30

# 4. Start Alert Generation Engine (limited)
start_limited_service "🚨 Alert Generation Engine" \
    "NODE_OPTIONS='--max-old-space-size=128' npx tsx -e \"
    import AlertGenerationEngine from './src/lib/alert-generation-engine.js';
    import { resourceLimiter } from './src/lib/resource-limiter.js';
    
    const alertEngine = AlertGenerationEngine.getInstance();
    
    // Rate limit alert generation
    const rateLimitedEngine = {
        startEngine: resourceLimiter.rateLimiter(
            () => alertEngine.startEngine(),
            1  // Max 1 call per second
        )
    };
    
    await rateLimitedEngine.startEngine();
    console.log('Alert engine started with rate limiting');
    
    setInterval(() => {
        const stats = alertEngine.getAlertStats();
        console.log('[' + new Date().toISOString() + '] Alerts: ' + stats.totalAlerts);
    }, 300000);
    \"" \
    "alert-generation-engine.log" \
    20  # Lower CPU for alerts

# 5. Start AI Optimization Engine (heavily limited)
start_limited_service "🧠 AI Optimization Engine" \
    "NODE_OPTIONS='--max-old-space-size=384' npx tsx -e \"
    import { startInputOptimization, pineScriptInputOptimizer } from './src/lib/pine-script-input-optimizer.js';
    import { resourceLimiter } from './src/lib/resource-limiter.js';
    
    console.log('Starting AI optimization with strict resource limits...');
    
    // Heavily throttle AI operations
    await resourceLimiter.throttledExecute(
        'ai-optimization',
        () => startInputOptimization(),
        { maxConcurrent: 1, delayMs: 2000, maxCpuPercent: 40 }
    );
    
    console.log('AI optimization started with resource limits');
    
    setInterval(() => {
        const history = pineScriptInputOptimizer.getOptimizationHistory();
        const stats = resourceLimiter.getResourceStats();
        console.log('[' + new Date().toISOString() + '] Optimizations: ' + history.length + ' | CPU: ' + stats.cpu.current.toFixed(1) + '%');
    }, 300000);
    \"" \
    "ai-optimization-engine.log" \
    25  # Strict limit for AI

# 6. Skip Stratus Engine in limited mode (too resource intensive)
echo "⚠️  Skipping Stratus Engine in limited mode (too resource intensive)"

echo ""
echo "✅ All services started with resource limits!"
echo "========================================="
echo "Resource limits applied:"
echo "  - Node.js memory: 128-768MB per process"
echo "  - CPU usage: 20-50% per process"
echo "  - Resource manager monitoring active"
echo ""
echo "Monitor logs with: tail -f logs/*.log"
echo "Check resource usage with: ./scripts/cleanup-processes.sh"
echo "Stop all with: ./scripts/stop-all.sh"
echo ""

# Create enhanced stop script
if [ ! -f ./scripts/stop-all.sh ]; then
    cat > ./scripts/stop-all.sh << 'EOF'
#!/bin/bash
echo "Stopping all services..."
pkill -f "resource-manager.sh"
pkill -f "monitor-website.sh"
pkill -f "cpulimit"
pkill -f "tsx.*market-data-collector"
pkill -f "tsx.*strategy-execution"
pkill -f "tsx.*alert-generation"
pkill -f "tsx.*pine-script-input"
pkill -f "tsx.*stratus-engine"
pkill -f "next dev"
echo "All services stopped"

# Clean up
./scripts/cleanup-processes.sh
EOF
    chmod +x ./scripts/stop-all.sh
fi

echo "Resource monitoring active. System protected from overload."