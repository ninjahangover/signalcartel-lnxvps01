/**
 * Dynamic Database Strategy Loader
 * Automatically detects and loads strategies from database using Pine Script analysis
 */

import StrategyExecutionEngine from './src/lib/strategy-execution-engine';
import { StrategyService } from './src/lib/strategy-service';
import { PineScriptParser } from './src/lib/pine-parser';

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

// Dynamic strategy type detection based on Pine Script content and indicators
class StrategyTypeDetector {
  static detectExecutionType(pineScriptCode: string, dbStrategyType: string): string {
    const code = pineScriptCode.toLowerCase();
    
    // RSI-based strategies
    if (code.includes('rsi') && (code.includes('pullback') || code.includes('oversold') || code.includes('overbought'))) {
      return 'ENHANCED_RSI_PULLBACK';
    }
    
    // Oscillator strategies (EMA crossovers, momentum)
    if (code.includes('ema') && (code.includes('oscillator') || code.includes('quantum') || code.includes('crossover'))) {
      return 'CLAUDE_QUANTUM_OSCILLATOR';
    }
    
    // Neural/AI strategies
    if (code.includes('neural') || code.includes('ai') || code.includes('stratus') || code.includes('confidence')) {
      return 'STRATUS_CORE_NEURAL';
    }
    
    // Bollinger Band strategies
    if (code.includes('bollinger') || (code.includes('sma') && code.includes('breakout'))) {
      return 'BOLLINGER_BREAKOUT_ENHANCED';
    }
    
    // Fallback to database strategy type mapping
    const fallbackMapping: {[key: string]: string} = {
      'rsi': 'ENHANCED_RSI_PULLBACK',
      'oscillator': 'CLAUDE_QUANTUM_OSCILLATOR',
      'ai_neural': 'STRATUS_CORE_NEURAL',
      'bollinger': 'BOLLINGER_BREAKOUT_ENHANCED',
      'momentum': 'CLAUDE_QUANTUM_OSCILLATOR',
      'trend': 'ENHANCED_RSI_PULLBACK'
    };
    
    const dbType = dbStrategyType.toLowerCase();
    for (const [key, execType] of Object.entries(fallbackMapping)) {
      if (dbType.includes(key)) {
        return execType;
      }
    }
    
    // Default fallback
    console.warn(`⚠️  Could not detect strategy type for ${dbStrategyType}, defaulting to RSI`);
    return 'ENHANCED_RSI_PULLBACK';
  }
}

// Dynamic parameter extraction and conversion
class ParameterConverter {
  static convertDbParametersToConfig(
    executionType: string, 
    parameters: any[], 
    pineScriptCode: string
  ): any {
    // Parse Pine Script to extract default values and structure
    let pineDefaults = {};
    try {
      const parsed = PineScriptParser.parse(pineScriptCode);
      pineDefaults = parsed.parameters?.reduce((acc: any, param: any) => {
        acc[param.name] = param.currentValue || param.originalValue;
        return acc;
      }, {}) || {};
    } catch (error) {
      console.warn('Could not parse Pine Script for defaults:', error.message);
    }
    
    // Convert database parameters to typed config
    const config: any = {};
    parameters.forEach(param => {
      const value = param.currentValue;
      let parsedValue: any = value;
      
      // Parse based on parameter type
      switch (param.parameterType) {
        case 'integer':
          parsedValue = parseInt(value);
          break;
        case 'float':
          parsedValue = parseFloat(value);
          break;
        case 'boolean':
          parsedValue = value === 'true' || value === true;
          break;
        default:
          parsedValue = value;
      }
      
      config[param.parameterName] = parsedValue;
    });
    
    // Merge with Pine Script defaults
    const mergedConfig = { ...pineDefaults, ...config };
    
    // Apply execution-type-specific validation and defaults
    return this.applyExecutionTypeDefaults(executionType, mergedConfig);
  }
  
  private static applyExecutionTypeDefaults(executionType: string, config: any): any {
    // Common defaults that all strategies need
    const commonDefaults = {
      stopLoss: config.stopLoss || 2.0,
      takeProfit: config.takeProfit || 3.0,
      maxRisk: config.maxRisk || 0.02, // 2% max risk per trade
      positionSize: config.positionSize || 0.1 // 10% of account
    };
    
    switch (executionType) {
      case 'CLAUDE_QUANTUM_OSCILLATOR':
        return {
          fastPeriod: config.fastPeriod || config.fast_period || 8,
          slowPeriod: config.slowPeriod || config.slow_period || 21,
          signalPeriod: config.signalPeriod || config.signal_period || 9,
          overboughtLevel: config.overboughtLevel || config.overbought || 75,
          oversoldLevel: config.oversoldLevel || config.oversold || 25,
          momentumThreshold: config.momentumThreshold || config.momentum_threshold || 1.0,
          volumeMultiplier: config.volumeMultiplier || config.volume_multiplier || 1.2,
          ...commonDefaults,
          ...config
        };
        
      case 'STRATUS_CORE_NEURAL':
        return {
          neuralLayers: config.neuralLayers || config.neural_layers || 3,
          learningRate: config.learningRate || config.learning_rate || 0.01,
          lookbackWindow: config.lookbackWindow || config.lookback || 20,
          confidenceThreshold: config.confidenceThreshold || config.confidence || 0.7,
          adaptationPeriod: config.adaptationPeriod || config.adaptation || 50,
          riskMultiplier: config.riskMultiplier || config.risk_multiplier || 1.0,
          ...commonDefaults,
          ...config
        };
        
      case 'ENHANCED_RSI_PULLBACK':
        return {
          lookback: config.lookback || config.rsi_period || 14,
          lowerBarrier: config.lowerBarrier || config.lower_barrier || 30,
          lowerThreshold: config.lowerThreshold || config.lower_threshold || 40,
          upperBarrier: config.upperBarrier || config.upper_barrier || 70,
          upperThreshold: config.upperThreshold || config.upper_threshold || 80,
          maLength: config.maLength || config.ma_length || 50,
          atrMultSL: config.atrMultSL || config.atr_sl || 2.0,
          atrMultTP: config.atrMultTP || config.atr_tp || 3.0,
          ...commonDefaults,
          ...config
        };
        
      case 'BOLLINGER_BREAKOUT_ENHANCED':
        return {
          smaLength: config.smaLength || config.sma_length || 20,
          ubOffset: config.ubOffset || config.upper_offset || 2.0,
          lbOffset: config.lbOffset || config.lower_offset || 2.0,
          useRSIFilter: config.useRSIFilter || config.rsi_filter || false,
          useVolumeFilter: config.useVolumeFilter || config.volume_filter || false,
          ...commonDefaults,
          ...config
        };
        
      default:
        return { ...commonDefaults, ...config };
    }
  }
}

async function loadDatabaseStrategies() {
  try {
    console.log('🚀 DYNAMIC STRATEGY LOADING FROM DATABASE');
    console.log('=' + '='.repeat(60));
    
    // Get admin user (who owns all strategies)
    const adminUserId = 'cme53zc9y0000mwgyjb9joki2'; // admin@signalcartel.com
    
    // Load strategies from database
    const dbStrategies = await StrategyService.getUserStrategies(adminUserId);
    console.log(`📊 Found ${dbStrategies.length} strategies in database`);
    
    if (dbStrategies.length === 0) {
      console.log('❌ No strategies found in database');
      return { success: false, error: 'No strategies found' };
    }
    
    // Initialize execution engine
    const engine = StrategyExecutionEngine.getInstance();
    engine.setPaperTradingMode(true);
    console.log('✅ Paper trading mode enabled\n');
    
    // Convert and load each active strategy dynamically
    let loadedCount = 0;
    const conversionResults = [];
    
    for (const dbStrategy of dbStrategies) {
      console.log(`\n🔍 Processing: ${dbStrategy.name}`);
      console.log(`   Database Type: ${dbStrategy.strategyType}`);
      console.log(`   Active: ${dbStrategy.isActive}`);
      console.log(`   Parameters: ${dbStrategy.parameters.length}`);
      
      if (!dbStrategy.isActive) {
        console.log(`⏭️  Skipping inactive strategy`);
        continue;
      }
      
      try {
        // Dynamic type detection based on Pine Script content
        const detectedType = StrategyTypeDetector.detectExecutionType(
          dbStrategy.pineScriptCode || '', 
          dbStrategy.strategyType
        );
        
        console.log(`🎯 Detected execution type: ${detectedType}`);
        
        // Dynamic parameter conversion
        const config = ParameterConverter.convertDbParametersToConfig(
          detectedType,
          dbStrategy.parameters,
          dbStrategy.pineScriptCode || ''
        );
        
        // Create strategy for execution engine
        const strategyForEngine = {
          id: dbStrategy.id,
          name: dbStrategy.name,
          type: detectedType,
          config: config,
          isActive: dbStrategy.isActive
        };
        
        console.log(`✅ Converted successfully:`);
        console.log(`   Strategy ID: ${dbStrategy.id}`);
        console.log(`   Execution Type: ${detectedType}`);
        console.log(`   Config Keys: ${Object.keys(config).join(', ')}`);
        
        // Add to execution engine
        engine.addStrategy(strategyForEngine, 'BTCUSD');
        loadedCount++;
        
        conversionResults.push({
          id: dbStrategy.id,
          name: dbStrategy.name,
          dbType: dbStrategy.strategyType,
          executionType: detectedType,
          parameterCount: dbStrategy.parameters.length,
          configKeys: Object.keys(config),
          success: true
        });
        
      } catch (conversionError) {
        console.error(`❌ Failed to convert strategy ${dbStrategy.name}:`, conversionError);
        conversionResults.push({
          id: dbStrategy.id,
          name: dbStrategy.name,
          dbType: dbStrategy.strategyType,
          success: false,
          error: conversionError.message
        });
      }
    }
    
    console.log(`\n🎉 CONVERSION COMPLETE`);
    console.log(`   Total strategies: ${dbStrategies.length}`);
    console.log(`   Active strategies: ${dbStrategies.filter(s => s.isActive).length}`);
    console.log(`   Successfully loaded: ${loadedCount}`);
    console.log(`   Failed conversions: ${conversionResults.filter(r => !r.success).length}`);
    
    if (loadedCount === 0) {
      return { success: false, error: 'No strategies could be loaded' };
    }
    
    // Start the engine
    console.log('\n📈 Starting strategy execution engine...');
    engine.startEngine();
    
    // System status
    console.log('\n🚀 SYSTEM STATUS:');
    console.log(`   ✅ ${loadedCount} strategies loaded and running`);
    console.log('   ✅ Paper trading mode active');
    console.log('   ✅ Market data monitoring started');
    console.log('   ✅ Execution engine started');
    
    // Show detailed strategy status
    console.log('\n📊 LOADED STRATEGY DETAILS:');
    conversionResults.filter(r => r.success).forEach(strategy => {
      console.log(`   🟢 ${strategy.name}`);
      console.log(`      ID: ${strategy.id}`);
      console.log(`      Type: ${strategy.dbType} → ${strategy.executionType}`);
      console.log(`      Parameters: ${strategy.parameterCount} configured`);
      console.log(`      Config: ${strategy.configKeys.length} keys`);
    });
    
    if (conversionResults.some(r => !r.success)) {
      console.log('\n⚠️  FAILED CONVERSIONS:');
      conversionResults.filter(r => !r.success).forEach(strategy => {
        console.log(`   🔴 ${strategy.name}: ${strategy.error}`);
      });
    }
    
    return { 
      success: true, 
      loadedStrategies: loadedCount,
      totalStrategies: dbStrategies.length,
      conversionResults 
    };
    
  } catch (error) {
    console.error('❌ Fatal error loading database strategies:', error);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  loadDatabaseStrategies()
    .then(result => {
      if (result.success) {
        console.log('\n✅ Database strategies loaded successfully!');
        console.log('🔄 System is now running with live market data...');
        
        // Keep process running to monitor trades
        console.log('\n📊 Monitoring for trade signals... (Press Ctrl+C to stop)');
        process.on('SIGINT', () => {
          console.log('\n⏹️ Shutting down strategy execution engine...');
          StrategyExecutionEngine.getInstance().stopEngine();
          process.exit(0);
        });
      } else {
        console.log('\n❌ Failed to load database strategies');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

export { loadDatabaseStrategies, convertDbParametersToConfig };