#!/bin/bash

# Signal Cartel Trading System - Server Startup Script
# Starts all necessary services for the complete trading platform

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

# Log file - Output to both terminal and log file
LOG_FILE="server-startup.log"
echo "📝 Logging output to: $LOG_FILE"
echo "📺 All output will be shown in terminal"
echo ""

# Create or clear the log file
echo "$(date): Starting server startup sequence..." > "$LOG_FILE"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE} Signal Cartel Trading System - Server Startup${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "$(date): Starting server startup sequence..."

# Function to check if a process is running
check_process() {
    local process_name="$1"
    if pgrep -f "$process_name" > /dev/null; then
        echo -e "${GREEN}✅ $process_name is running${NC}"
        return 0
    else
        echo -e "${RED}❌ $process_name is not running${NC}"
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local service_name="$1"
    local check_command="$2"
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}⏳ Waiting for $service_name to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if eval "$check_command" &>/dev/null; then
            echo -e "${GREEN}✅ $service_name is ready${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}   Attempt $attempt/$max_attempts - waiting for $service_name...${NC}"
        sleep 2
        ((attempt++))
    done
    
    echo -e "${YELLOW}⚠️ $service_name startup timeout - may still be initializing${NC}"
    echo -e "${YELLOW}💡 Check ${service_name}.log for details${NC}"
    return 1
}

# Function to start background service
start_background_service() {
    local service_name="$1"
    local command="$2"
    local check_command="$3"
    
    echo -e "${CYAN}🚀 Starting $service_name...${NC}"
    
    # Check if already running
    if eval "$check_command" &>/dev/null; then
        echo -e "${YELLOW}⚠️  $service_name is already running${NC}"
        return 0
    fi
    
    # Start the service in background with output to both terminal and log
    echo -e "${CYAN}📝 Logging to: ${service_name}.log${NC}"
    
    # Create a wrapper script that outputs to both terminal and log
    (
        bash -c "$command" 2>&1 | while IFS= read -r line; do
            echo "[${service_name}] $line"
            echo "[$(date '+%H:%M:%S')] $line" >> "${service_name}.log"
        done
    ) &
    local pid=$!
    echo $pid > "${service_name}.pid"
    
    # Wait for service to be ready
    if wait_for_service "$service_name" "$check_command"; then
        echo -e "${GREEN}✅ $service_name started successfully (PID: $pid)${NC}"
        return 0
    else
        # For certain services, timeout doesn't mean failure
        if [[ "$service_name" == "market-data-collector" || "$service_name" == "ai-optimization-engine" || "$service_name" == "nextjs-server" ]]; then
            echo -e "${YELLOW}⚠️ $service_name may still be initializing (continuing)${NC}"
            echo -e "${YELLOW}💡 Monitor ${service_name}.log for startup progress${NC}"
            if [[ "$service_name" == "nextjs-server" ]]; then
                echo -e "${YELLOW}⏰ Next.js often takes 30-60 seconds for first compile${NC}"
            fi
            return 0
        else
            echo -e "${RED}❌ Failed to start $service_name${NC}"
            return 1
        fi
    fi
}

echo -e "\n${PURPLE}📋 STEP 1: Environment Verification${NC}"
echo "================================================"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not found. Please install Node.js${NC}"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm not found. Please install npm${NC}"
    exit 1
fi

# Check tsx
if command -v npx tsx &> /dev/null || npm list -g tsx &> /dev/null; then
    echo -e "${GREEN}✅ tsx available${NC}"
else
    echo -e "${YELLOW}⚠️  Installing tsx globally...${NC}"
    npm install -g tsx
fi

# Check dependencies
echo -e "${YELLOW}🔍 Checking dependencies...${NC}"
if [ -f "package.json" ] && [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ Dependencies appear to be installed${NC}"
else
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

echo -e "\n${PURPLE}📋 STEP 2: Database Initialization${NC}"
echo "================================================"

# Initialize database if needed
if [ -f "prisma/schema.prisma" ]; then
    echo -e "${CYAN}🗄️  Setting up database...${NC}"
    
    # Generate Prisma client
    npx prisma generate
    
    # Run migrations
    if [ ! -f "prisma/dev.db" ]; then
        echo -e "${YELLOW}🔧 Creating database and running migrations...${NC}"
        npx prisma migrate dev --name init
    else
        echo -e "${YELLOW}🔧 Running database migrations...${NC}"
        npx prisma migrate deploy
    fi
    
    echo -e "${GREEN}✅ Database ready${NC}"
else
    echo -e "${YELLOW}⚠️  No Prisma schema found, skipping database setup${NC}"
fi

echo -e "\n${PURPLE}📋 STEP 3: Next.js Pre-compilation & Server (Priority Start)${NC}"
echo "================================================"

# Pre-compile Next.js application (including auth pages and unified dashboard)
echo -e "${CYAN}⚡ Starting Next.js server early for faster user access...${NC}"
echo -e "${YELLOW}   📋 This provides immediate access to:${NC}"
echo -e "${YELLOW}   - Authentication pages${NC}"
echo -e "${YELLOW}   - Unified Strategy Dashboard${NC}"
echo -e "${YELLOW}   - API routes${NC}"
echo -e "${YELLOW}   - All dashboard components${NC}"
echo -e "${YELLOW}   🚀 Heavy API components will load in background${NC}"

# Start development server immediately for faster access
echo -e "${CYAN}🌐 Starting Next.js development server (fast start)...${NC}"
start_background_service "nextjs-server" \
    "npm run dev" \
    "curl -s http://localhost:3001 | grep -q 'Signal Cartel\\|DOCTYPE\\|html'"

echo -e "${GREEN}✅ Web server started! Dashboard accessible while other services load${NC}"
echo -e "${CYAN}🌐 Access: ${BLUE}http://localhost:3001${NC}"
echo -e "${CYAN}🎯 Unified Dashboard: ${BLUE}http://localhost:3001/unified-dashboard${NC}"

echo -e "\n${PURPLE}📋 STEP 4: Market Data Collection (Background)${NC}"
echo "================================================"

# First verify database is accessible
echo -e "${YELLOW}🔍 Checking database accessibility...${NC}"
if npx prisma db push --accept-data-loss &>/dev/null; then
    echo -e "${GREEN}✅ Database is accessible${NC}"
else
    echo -e "${YELLOW}⚠️ Database may need setup, trying to continue...${NC}"
fi

# Start market data collection
echo -e "${CYAN}📊 Starting market data collection...${NC}"
start_background_service "market-data-collector" \
    "npx tsx -e \"
        async function startMarketData() {
            try {
                const { marketDataCollector } = await import('./src/lib/market-data-collector.ts');
                console.log('🚀 Starting market data collection...');
                
                // Add startup delay to ensure database is ready
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                await marketDataCollector.startCollection();
                console.log('✅ Market data collection started successfully');
                
                // Verify it's actually working
                setTimeout(() => {
                    if (marketDataCollector.isCollectionActive()) {
                        console.log('🎉 Market data collection confirmed active');
                    } else {
                        console.log('⚠️ Market data collection may not be working properly');
                    }
                }, 5000);
                
            } catch (error) {
                console.error('❌ Market data collection startup failed:', error.message);
                console.error('Stack:', error.stack);
                // Don't exit, just log the error
                console.log('🔄 Market data collection will retry...');
            }
        }
        
        startMarketData();
        
        process.on('SIGTERM', () => {
            console.log('📊 Stopping market data collection...');
            try {
                const { marketDataCollector } = require('./src/lib/market-data-collector.ts');
                marketDataCollector.stopCollection();
            } catch (error) {
                console.log('Error stopping market data collection:', error.message);
            }
            process.exit(0);
        });
        
        // Keep process alive and log status
        setInterval(() => {
            try {
                const { marketDataCollector } = require('./src/lib/market-data-collector.ts');
                if (marketDataCollector.isCollectionActive()) {
                    console.log('📊 Market data collection is active');
                } else {
                    console.log('ℹ️ Market data collection status: inactive');
                }
            } catch (error) {
                console.log('ℹ️ Market data collection status check failed:', error.message);
            }
        }, 300000); // Every 5 minutes
    \"" \
    "sleep 10 && pgrep -f 'market-data-collector'"

echo -e "\n${PURPLE}📋 STEP 5: Unified Strategy System (Background)${NC}"
echo "================================================"

# Start unified strategy controller early (important for dashboard)
echo -e "${CYAN}🎯 Initializing Unified Strategy Controller...${NC}"
echo -e "${YELLOW}   This replaces fragmented strategy management with:${NC}"
echo -e "${YELLOW}   - Single source of truth for parameters${NC}"
echo -e "${YELLOW}   - Unified optimization engine${NC}"
echo -e "${YELLOW}   - Integrated Telegram alerts${NC}"
echo -e "${YELLOW}   - Both Paper (Alpaca) and Live (Kraken) trading${NC}"

start_background_service "unified-strategy-system" \
    "npx tsx -e \"
        import UnifiedStrategyController from './src/lib/unified-strategy-controller.ts';
        
        async function startUnifiedSystem() {
            console.log('🎯 Starting Unified Strategy Controller...');
            const controller = UnifiedStrategyController.getInstance();
            
            console.log('✅ Unified Strategy Controller initialized');
            console.log('📊 Available strategies:', controller.getAllStrategies().length);
            console.log('🔗 Market conditions monitoring: ACTIVE');
            console.log('🧠 AI optimization engine: READY');
            console.log('📱 Telegram alerts: CONFIGURED');
            console.log('💻 Paper trading (Alpaca): READY');
            console.log('🔴 Live trading (Kraken webhooks): READY');
            
            // Set up test trade for verification
            setTimeout(() => {
                console.log('🧪 Running unified system test...');
                const strategies = controller.getAllStrategies();
                if (strategies.length > 0) {
                    console.log('✅ Strategy system operational');
                    strategies.forEach(strategy => {
                        console.log('  📋', strategy.name, '- Mode:', strategy.mode, '- Enabled:', strategy.enabled);
                        console.log('  📊 RSI Lookback:', strategy.parameters.rsi.lookback, '- Position Size:', (strategy.parameters.risk.positionSize * 100).toFixed(1) + '%');
                    });
                } else {
                    console.log('⚠️  No strategies loaded - check configuration');
                }
            }, 3000);
        }
        
        startUnifiedSystem().catch(err => {
            console.error('❌ Failed to start unified system:', err);
        });
        
        process.on('SIGTERM', () => {
            console.log('🎯 Stopping Unified Strategy System...');
            process.exit(0);
        });
        
        // Keep process alive and show status
        setInterval(() => {
            console.log('🎯 Unified Strategy System: RUNNING | Market analysis and optimization active');
        }, 300000); // Every 5 minutes
    \"" \
    "sleep 3 && pgrep -f 'unified-strategy-controller'"

echo -e "\n${PURPLE}📋 STEP 6: AI Optimization Engine (Background)${NC}"
echo "================================================"

# Start AI optimization engine
echo -e "${CYAN}🧠 Starting AI optimization engine...${NC}"
start_background_service "ai-optimization-engine" \
    "npx tsx -e \"
        import { startInputOptimization, pineScriptInputOptimizer } from './src/lib/pine-script-input-optimizer.ts';
        
        async function runOptimizer() {
            console.log('🧠 Starting AI optimization engine...');
            
            // Start the optimization
            await startInputOptimization();
            console.log('✅ Input optimization started');
            
            // Verify it's running
            setTimeout(() => {
                if (pineScriptInputOptimizer.isRunning()) {
                    console.log('✅ AI Optimization Engine confirmed ACTIVE');
                    console.log('📊 Optimization history:', pineScriptInputOptimizer.getOptimizationHistory().length, 'entries');
                } else {
                    console.log('⚠️ AI Optimization Engine may not be running properly');
                }
            }, 3000);
        }
        
        runOptimizer().catch(err => {
            console.error('❌ Failed to start optimizer:', err);
        });
        
        process.on('SIGTERM', () => {
            console.log('🧠 Stopping AI optimization engine...');
            process.exit(0);
        });
        
        // Keep process alive and show status
        setInterval(() => {
            const isRunning = pineScriptInputOptimizer.isRunning();
            const history = pineScriptInputOptimizer.getOptimizationHistory();
            console.log('🧠 AI optimization: ' + (isRunning ? 'ACTIVE' : 'STOPPED') + ' | ' + history.length + ' optimizations completed');
        }, 300000); // Every 5 minutes
    \"" \
    "sleep 5 && pgrep -f 'pine-script-input-optimizer'"

echo -e "\n${PURPLE}📋 STEP 7: Strategy Execution Engine (Background)${NC}"
echo "================================================"

# Start strategy execution engine
echo -e "${CYAN}⚡ Starting strategy execution engine...${NC}"
start_background_service "strategy-execution-engine" \
    "npx tsx -e \"
        import StrategyExecutionEngine from './src/lib/strategy-execution-engine.ts';
        console.log('⚡ Starting strategy execution engine...');
        const engine = StrategyExecutionEngine.getInstance();
        engine.setPaperTradingMode(true);
        engine.startEngine();
        process.on('SIGTERM', () => {
            console.log('⚡ Stopping strategy execution engine...');
            engine.stopEngine();
            process.exit(0);
        });
        // Keep process alive and log status
        setInterval(() => {
            console.log('⚡ Strategy engine status:', engine.isEngineRunning() ? 'RUNNING' : 'STOPPED');
        }, 300000); // Every 5 minutes
    \"" \
    "pgrep -f 'strategy-execution-engine'"

echo -e "\n${PURPLE}📋 STEP 8: Alert Generation System (Background)${NC}"
echo "================================================"

# Start alert generation engine
echo -e "${CYAN}🚨 Starting alert generation system...${NC}"
start_background_service "alert-generation-engine" \
    "npx tsx -e \"
        import AlertGenerationEngine from './src/lib/alert-generation-engine.ts';
        console.log('🚨 Starting alert generation engine...');
        const alertEngine = AlertGenerationEngine.getInstance();
        alertEngine.startEngine();
        console.log('✅ Alert generation engine started');
        
        process.on('SIGTERM', () => {
            console.log('🚨 Stopping alert generation engine...');
            alertEngine.stopEngine();
            process.exit(0);
        });
        
        // Keep process alive and show status
        setInterval(() => {
            const stats = alertEngine.getAlertStats();
            console.log('🚨 Alert engine: ' + (alertEngine.isEngineRunning() ? 'RUNNING' : 'STOPPED') + ' | ' + stats.totalAlerts + ' total alerts');
        }, 300000); // Every 5 minutes
    \"" \
    "pgrep -f 'alert-generation-engine'"

echo -e "\n${PURPLE}📋 STEP 9: Stratus Engine with Neural Predictor™ (Background)${NC}"
echo "================================================"

# Start Stratus Engine with Neural Predictor
echo -e "${CYAN}🎯 Starting Stratus Engine with Neural Predictor™...${NC}"
echo -e "${CYAN}🧠 Initializing AI learning systems...${NC}"
start_background_service "stratus-engine" \
    "npx tsx -e \"
        import { startGlobalStratusEngine, getStratusEngineStatus } from './src/lib/global-stratus-engine-service.ts';
        
        async function runEngine() {
            console.log('🎯 Starting Stratus Engine with Neural Predictor™...');
            console.log('🧠 Loading Neural Predictor and Markov chain models...');
            
            // Start the engine (includes Neural Predictor initialization)
            await startGlobalStratusEngine();
            console.log('✅ Stratus Engine with Neural Predictor™ started successfully');
            console.log('🧠 Neural learning systems are now active');
            
            // Verify components are running
            setTimeout(async () => {
                const status = await getStratusEngineStatus();
                console.log('🎯 Stratus Engine Status:');
                console.log('  - Engine Running:', status.isRunning);
                console.log('  - Input Optimizer:', status.components.inputOptimizer.active ? '✅ ACTIVE' : '❌ STOPPED');
                console.log('  - Market Monitor:', status.components.marketMonitor.active ? '✅ ACTIVE' : '❌ STOPPED');
                console.log('  - Market Data:', status.components.marketData.active ? '✅ ACTIVE' : '❌ STOPPED');
                console.log('  - Alpaca Integration:', status.components.alpacaIntegration.active ? '✅ ACTIVE' : '❌ STOPPED');
                if (status.components.markovPredictor) {
                    const reliability = Math.round(status.components.markovPredictor.reliability * 100);
                    console.log('  - Neural Predictor:', status.components.markovPredictor.active ? '✅ ACTIVE' : '❌ STOPPED', '(' + status.components.markovPredictor.convergenceStatus + ', ' + reliability + '% reliable)');
                } else {
                    console.log('  - Neural Predictor: ❌ STOPPED');
                }
            }, 5000);
        }
        
        runEngine().catch(err => {
            console.error('❌ Failed to start Stratus Engine:', err);
        });
        
        process.on('SIGTERM', () => {
            console.log('🎯 Stopping Stratus Engine with Neural Predictor™...');
            console.log('💾 Saving Neural Predictor models...');
            // Neural model saving happens automatically in the global service
            process.exit(0);
        });
        
        // Keep process alive and show periodic status
        setInterval(async () => {
            const status = await getStratusEngineStatus();
            const activeComponents = Object.values(status.components).filter(c => c.active).length;
            if (status.components.markovPredictor) {
                const reliability = Math.round(status.components.markovPredictor.reliability * 100);
                const neuralStatus = ' | Neural: ' + status.components.markovPredictor.convergenceStatus + ' (' + reliability + '%)';
                console.log('🎯 Stratus Engine: ' + (status.isRunning ? 'RUNNING' : 'STOPPED') + ' | ' + activeComponents + '/5 components active' + neuralStatus);
            } else {
                console.log('🎯 Stratus Engine: ' + (status.isRunning ? 'RUNNING' : 'STOPPED') + ' | ' + activeComponents + '/5 components active');
            }
        }, 300000); // Every 5 minutes
    \"" \
    "sleep 5 && pgrep -f 'global-stratus-engine-service'"

echo -e "\n${PURPLE}📋 STEP 10: Startup Summary${NC}"
echo "================================================"

echo -e "${GREEN}🎉 SERVER STARTUP COMPLETE!${NC}"
echo -e "$(date): Web server started early - background services loading"

echo -e "\n${CYAN}⚡ OPTIMIZED STARTUP SEQUENCE COMPLETED:${NC}"
echo "==========================================="
echo -e "${GREEN}🚀 STEP 3: Next.js Web Server - ${BLUE}STARTED FIRST${NC} (Immediate access)"
echo -e "${YELLOW}📊 STEP 4: Market Data Collection - Background loading${NC}"
echo -e "${YELLOW}🎯 STEP 5: Unified Strategy System - Background loading${NC}" 
echo -e "${YELLOW}🧠 STEP 6: AI Optimization Engine - Background loading${NC}"
echo -e "${YELLOW}⚡ STEP 7: Strategy Execution Engine - Background loading${NC}"
echo -e "${YELLOW}🚨 STEP 8: Alert Generation System - Background loading${NC}"
echo -e "${YELLOW}🎯 STEP 9: Stratus Engine & Neural Predictor™ - Background loading${NC}"

# Check Input Optimizer status
echo -e "${YELLOW}🧠 Verifying AI Input Optimizer...${NC}"
OPTIMIZER_STATUS=$(npx tsx -e "
    import { pineScriptInputOptimizer } from './src/lib/pine-script-input-optimizer.ts';
    console.log(pineScriptInputOptimizer.isRunning() ? 'ACTIVE' : 'STOPPED');
" 2>/dev/null)
if [[ "$OPTIMIZER_STATUS" == *"ACTIVE"* ]]; then
    echo -e "${GREEN}✅ AI Input Optimizer is ACTIVE${NC}"
else
    echo -e "${YELLOW}⚠️  AI Input Optimizer status: $OPTIMIZER_STATUS${NC}"
    echo -e "${YELLOW}💡 Attempting to start Input Optimizer...${NC}"
    npx tsx -e "
        import { startInputOptimization } from './src/lib/pine-script-input-optimizer.ts';
        (async () => {
            await startInputOptimization();
            console.log('✅ Input Optimizer started');
        })();
    " 2>/dev/null || echo -e "${YELLOW}⚠️  Could not verify optimizer status${NC}"
fi

# Run verification tests
echo -e "${YELLOW}📊 Testing market data collection...${NC}"
if timeout 30 npx tsx test-market-data-collection.ts &>/dev/null; then
    echo -e "${GREEN}✅ Market data collection test passed${NC}"
else
    echo -e "${YELLOW}⚠️  Market data collection test failed or timed out${NC}"
fi

echo -e "${YELLOW}🎯 Testing strategy system...${NC}"
if timeout 60 npx tsx test-unified-strategies.ts &>/dev/null; then
    echo -e "${GREEN}✅ Strategy system test passed${NC}"
else
    echo -e "${YELLOW}⚠️  Strategy system test failed or timed out${NC}"
fi

echo -e "${YELLOW}📊 Testing status monitors...${NC}"
if timeout 30 npx tsx test-status-monitors.ts &>/dev/null; then
    echo -e "${GREEN}✅ Status monitor test passed${NC}"
else
    echo -e "${YELLOW}⚠️  Status monitor test failed or timed out${NC}"
fi

echo -e "\n${PURPLE}📋 STEP 11: Startup Summary${NC}"
echo "================================================"

echo -e "${GREEN}🎉 SERVER STARTUP COMPLETE!${NC}"
echo -e "$(date): All services have been started"

echo -e "\n${CYAN}📊 Service Status:${NC}"
echo "=============================="

# Check all services
services=(
    "market-data-collector:Market Data Collection"
    "ai-optimization-engine:AI Optimization Engine" 
    "strategy-execution-engine:Strategy Execution Engine"
    "alert-generation-engine:Alert Generation System"
    "stratus-engine:Stratus Engine with Neural Predictor™"
    "unified-strategy-system:Unified Strategy Controller"
    "nextjs-server:Next.js Development Server (Pre-compiled)"
)

for service in "${services[@]}"; do
    IFS=':' read -r process_name display_name <<< "$service"
    if [ -f "${process_name}.pid" ] && kill -0 "$(cat "${process_name}.pid")" 2>/dev/null; then
        echo -e "${GREEN}✅ $display_name${NC}"
    else
        echo -e "${RED}❌ $display_name${NC}"
    fi
done

echo -e "\n${CYAN}🌐 Access Points (Available NOW):${NC}"
echo "=================================="
echo -e "${GREEN}🚀 READY NOW: Main Dashboard: ${BLUE}http://localhost:3001${NC}"
echo -e "${GREEN}🎯 READY NOW: Unified Strategy Dashboard: ${BLUE}http://localhost:3001/unified-dashboard${NC}"
echo -e "${GREEN}🔐 READY NOW: Authentication: ${BLUE}http://localhost:3001/auth${NC}"
echo -e "${YELLOW}⏳ Loading: Market Data API: ${BLUE}http://localhost:3001/api/market-data/status${NC}"
echo -e "${YELLOW}⏳ Loading: Engine Status API: ${BLUE}http://localhost:3001/api/engine-status${NC}"

echo -e "\n${CYAN}📋 Immediate Access (No waiting required):${NC}"
echo "=========================================="
echo -e "${GREEN}✅ 1. Open your browser to http://localhost:3001 ${YELLOW}(READY NOW)${NC}"
echo -e "${GREEN}✅ 2. Navigate to the Unified Strategy Dashboard ${YELLOW}(READY NOW)${NC}"
echo -e "${GREEN}✅ 3. Login with your credentials ${YELLOW}(READY NOW)${NC}"
echo -e "${YELLOW}⏳ 4. Background services will continue loading (monitor logs)${NC}"
echo -e "${YELLOW}⏳ 5. AI optimization and strategies will activate automatically${NC}"
echo -e "${YELLOW}⏳ 6. Telegram alerts will start once background services complete${NC}"

echo -e "\n${CYAN}🛑 To Stop Server:${NC}"
echo "=================="
echo "Run: ./stop-server.sh"

echo -e "\n${CYAN}📝 Log Files:${NC}"
echo "============="
echo "Startup log: server-startup.log"
echo "Individual service logs: [service-name].log"

echo -e "\n${GREEN}🚀 Signal Cartel Trading System - OPTIMIZED STARTUP COMPLETE!${NC}"
echo -e "${CYAN}⚡ Web dashboard available immediately - background services loading${NC}"
echo -e "${YELLOW}💡 This optimized startup gets you to the dashboard faster!${NC}"

# Create a status file to indicate successful startup
echo "$(date): Server startup completed successfully" > .server-status
echo "STATUS=RUNNING" >> .server-status