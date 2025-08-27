/**
 * Position-Managed Strategy Loader
 * Loads strategies from database and uses Position Management System for real P&L tracking
 * This is the new preferred method for running trading strategies
 */

import { positionService } from './src/lib/position-management/position-service';
import { StrategyIntegration } from './src/lib/position-management/strategy-integration';
import { StrategyService } from './src/lib/strategy-service';
import { PineScriptParser } from './src/lib/pine-parser';
import marketDataService from './src/lib/market-data-service';

interface DatabaseStrategyConfig {
  id: string;
  name: string;
  strategyType: string;
  isActive: boolean;
  pineScriptCode: string;
  parameters: Array<{
    parameterName: string;
    currentValue: string;
    parameterType: string;
  }>;
}

class PositionManagedStrategyLoader {
  private activeStrategies: Map<string, any> = new Map();
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  async initialize() {
    console.log('🚀 POSITION-MANAGED STRATEGY SYSTEM INITIALIZATION');
    console.log('=' + '='.repeat(60));
    
    // Initialize position management system
    console.log('🔄 Initializing Position Management System...');
    
    // Start position monitoring
    StrategyIntegration.startPositionMonitoring();
    console.log('✅ Position Management System ready\n');
    
    // Load strategies from database
    await this.loadDatabaseStrategies();
    
    // Start the monitoring loop
    this.startStrategyExecution();
  }

  private async loadDatabaseStrategies() {
    try {
      const adminUserId = 'cmerfldym00005n99vrofhfff'; // admin@signalcartel.com
      
      // Load strategies from database
      const dbStrategies = await StrategyService.getUserStrategies(adminUserId);
      console.log(`📊 Found ${dbStrategies.length} strategies in database`);
      
      if (dbStrategies.length === 0) {
        console.log('❌ No strategies found in database');
        return false;
      }

      let loadedCount = 0;
      
      for (const dbStrategy of dbStrategies) {
        if (!dbStrategy.isActive) {
          console.log(`⏸️  Skipping inactive strategy: ${dbStrategy.name}`);
          continue;
        }

        try {
          // Create simple configuration from database parameters (bypass Pine Script parsing for now)
          const config: any = {};
          dbStrategy.parameters.forEach(param => {
            config[param.parameterName] = param.currentValue;
          });
          
          // Store strategy configuration for execution
          this.activeStrategies.set(dbStrategy.id, {
            id: dbStrategy.id,
            name: dbStrategy.name,
            type: dbStrategy.strategyType.toLowerCase(),
            config,
            pineScript: dbStrategy.pineScriptCode
          });
          
          loadedCount++;
          console.log(`✅ Loaded: ${dbStrategy.name} (${dbStrategy.strategyType}) - Config: ${Object.keys(config).join(', ')}`);
          
        } catch (error) {
          console.error(`❌ Failed to load strategy ${dbStrategy.name}:`, error);
        }
      }

      console.log(`\n🎉 STRATEGY LOADING COMPLETE`);
      console.log(`   Total strategies: ${dbStrategies.length}`);
      console.log(`   Active strategies: ${dbStrategies.filter(s => s.isActive).length}`);
      console.log(`   Successfully loaded: ${loadedCount}`);
      
      return loadedCount > 0;
      
    } catch (error) {
      console.error('❌ Failed to load database strategies:', error);
      return false;
    }
  }

  private startStrategyExecution() {
    console.log('\n📈 Starting Position-Managed Strategy Execution...');
    this.isRunning = true;
    
    // Execute strategies every 30 seconds
    this.intervalId = setInterval(async () => {
      await this.executeStrategyCycle();
    }, 30000);
    
    console.log('✅ Strategy execution loop started (30-second intervals)');
    console.log('\n🚀 SYSTEM STATUS:');
    console.log(`   ✅ ${this.activeStrategies.size} position-managed strategies running`);
    console.log('   ✅ Real P&L tracking active');
    console.log('   ✅ Position lifecycle management enabled');
    console.log('   ✅ Exit strategies configured');
    
    // Run first cycle immediately
    setTimeout(() => this.executeStrategyCycle(), 5000);
  }

  private async executeStrategyCycle() {
    if (!this.isRunning || this.activeStrategies.size === 0) return;

    try {
      // Get current market data
      const currentPrice = marketDataService.getPrice('BTCUSD');
      if (!currentPrice) {
        console.log('⚠️  No market data available, skipping cycle');
        return;
      }

      console.log(`\n🔄 Strategy Execution Cycle - BTC: $${currentPrice.toFixed(2)}`);
      
      // Execute each active strategy
      for (const [strategyId, strategy] of this.activeStrategies) {
        try {
          await this.executeStrategy(strategy, currentPrice);
        } catch (error) {
          console.error(`❌ Strategy ${strategy.name} execution failed:`, error);
        }
      }
      
      // Show current portfolio status
      const portfolio = await StrategyIntegration.getPortfolioStatus();
      console.log(`📊 Portfolio: ${portfolio.openPositions} open, ${portfolio.closedPositions} closed, P&L: $${portfolio.totalPnL.toFixed(2)}`);
      
    } catch (error) {
      console.error('❌ Strategy execution cycle failed:', error);
    }
  }

  private async executeStrategy(strategy: any, currentPrice: number) {
    const { type, config } = strategy;
    
    // Simulate different strategy types with position management integration
    switch (type) {
      case 'rsi':
      case 'rsi_pullback':
        // Simulate RSI calculation (in real implementation, use proper indicators)
        const rsi = this.calculateSimulatedRSI(currentPrice);
        await StrategyIntegration.processRSISignal(
          'BTCUSD', 
          rsi, 
          currentPrice,
          config.lowerBarrier || 30,
          config.upperBarrier || 70
        );
        break;

      case 'bollinger':
      case 'bollinger_breakout':
        // Simulate Bollinger Bands
        const bands = this.calculateSimulatedBollinger(currentPrice);
        await StrategyIntegration.processBollingerSignal(
          'BTCUSD',
          currentPrice,
          bands.upper,
          bands.lower,
          bands.middle
        );
        break;

      case 'neural':
      case 'stratus':
        // Simulate Neural Network prediction
        const prediction = this.calculateSimulatedNeuralPrediction(currentPrice);
        await StrategyIntegration.processNeuralSignal(
          'BTCUSD',
          currentPrice,
          prediction.direction,
          prediction.confidence
        );
        break;

      case 'quantum':
      case 'oscillator':
        // Simulate Quantum Oscillator
        const quantum = this.calculateSimulatedQuantumSignal(currentPrice);
        await StrategyIntegration.processQuantumSignal(
          'BTCUSD',
          currentPrice,
          quantum.oscillator,
          quantum.momentum
        );
        break;

      default:
        console.log(`⚠️  Unknown strategy type: ${type} for ${strategy.name}`);
    }
  }

  // Simplified indicator calculations for demonstration
  // In production, these should use proper technical analysis libraries
  private calculateSimulatedRSI(price: number): number {
    // Simulate RSI based on price movement - use dynamic thresholds based on current market
    const random = Math.random();
    const highThreshold = price * 1.05; // 5% above current
    const lowThreshold = price * 0.95;  // 5% below current
    
    if (price > highThreshold) return 60 + (random * 20); // Higher prices = higher RSI
    if (price < lowThreshold) return 20 + (random * 20); // Lower prices = lower RSI
    return 40 + (random * 20); // Mid-range RSI
  }

  private calculateSimulatedBollinger(price: number) {
    const middle = price * (0.998 + Math.random() * 0.004);
    const spread = price * 0.03; // 3% spread
    return {
      upper: middle + spread,
      lower: middle - spread,
      middle
    };
  }

  private calculateSimulatedNeuralPrediction(price: number) {
    const random = Math.random();
    return {
      direction: (random - 0.5) * 2, // -1 to 1
      confidence: 0.6 + (random * 0.3) // 0.6 to 0.9
    };
  }

  private calculateSimulatedQuantumSignal(price: number) {
    const random = Math.random();
    return {
      oscillator: -80 + (random * 160), // -80 to 80
      momentum: (random - 0.5) * 2 // -1 to 1
    };
  }

  stop() {
    console.log('\n⏹️  Stopping Position-Managed Strategy System...');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    console.log('✅ Strategy execution stopped');
  }
}

async function runPositionManagedStrategies() {
  const loader = new PositionManagedStrategyLoader();
  
  try {
    await loader.initialize();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n⏹️  Shutting down position-managed strategy system...');
      loader.stop();
      await positionService.disconnect();
      process.exit(0);
    });
    
    // Keep the process running
    console.log('\n💡 System running... Press Ctrl+C to stop');
    
  } catch (error) {
    console.error('❌ Failed to start position-managed strategies:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runPositionManagedStrategies();
}

export { PositionManagedStrategyLoader };