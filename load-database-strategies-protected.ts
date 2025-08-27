#!/usr/bin/env npx tsx
/**
 * QUANTUM FORGE™ Protected Trading System
 * 
 * Enhanced version with:
 * - Graceful shutdown manager
 * - Transaction protection
 * - Emergency data backup
 * - Connection pooling
 * - Auto-recovery mechanisms
 */

import { StrategyService } from './src/lib/strategy-service';
import { StrategyExecutionEngine } from './src/lib/strategy-execution-engine';
import { shutdownManager } from './src/lib/graceful-shutdown-manager';
import { enhancedPrisma, withTransaction, withRetry } from './src/lib/prisma-enhanced';
import { prisma } from './src/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

// Force GPU strategies to be enabled
process.env.ENABLE_GPU_STRATEGIES = 'true';

interface ConversionResult {
  id: string;
  name: string;
  dbType: string;
  executionType?: string;
  parameterCount?: number;
  configKeys?: string[];
  success: boolean;
  error?: string;
}

async function loadDatabaseStrategiesProtected() {
  const startTime = Date.now();
  let engine: StrategyExecutionEngine | null = null;
  
  try {
    console.log('\n🛡️ QUANTUM FORGE™ PROTECTED TRADING SYSTEM');
    console.log('━'.repeat(70));
    console.log('✅ Graceful Shutdown Protection: ENABLED');
    console.log('✅ Transaction Management: ENABLED');
    console.log('✅ Emergency Backup: ENABLED');
    console.log('✅ Connection Pooling: ENABLED');
    console.log('━'.repeat(70));
    
    // Connect with enhanced client
    await enhancedPrisma.connect();
    console.log('✅ Enhanced database connection established');
    
    // Register shutdown handlers
    shutdownManager.registerDefaultHandlers(prisma);
    console.log('✅ Graceful shutdown handlers registered');
    
    // Register custom trading-specific handlers
    shutdownManager.registerHandler({
      name: 'Save Trading State',
      priority: 5,
      timeout: 5000,
      handler: async () => {
        try {
          if (engine) {
            // Save current trading state
            const state = {
              timestamp: new Date().toISOString(),
              activeStrategies: engine.getActiveStrategies?.() || [],
              pendingSignals: engine.getPendingSignals?.() || []
            };
            
            const stateFile = path.join('/tmp/signalcartel-emergency', `trading_state_${Date.now()}.json`);
            fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
            console.log(`✅ Trading state saved to ${stateFile}`);
          }
        } catch (error) {
          console.error('Failed to save trading state:', error.message);
        }
      }
    });
    
    console.log('\n🔍 Loading strategies from database...');
    
    // Get admin user (with retry logic)
    const adminUser = await withRetry(async () => {
      return await prisma.user.findFirst({
        where: { email: 'admin@signalcartel.com' }
      });
    });
    
    if (!adminUser) {
      throw new Error('Admin user not found');
    }
    
    // Load strategies with transaction protection
    const dbStrategies = await withTransaction(async (tx) => {
      return await tx.pineStrategy.findMany({
        where: { userId: adminUser.id },
        include: {
          parameters: true,
          backtestResults: true
        },
        orderBy: { createdAt: 'desc' }
      });
    });
    
    console.log(`\n📊 Found ${dbStrategies.length} strategies in database`);
    console.log(`   Active: ${dbStrategies.filter(s => s.isActive).length}`);
    console.log(`   Inactive: ${dbStrategies.filter(s => !s.isActive).length}`);
    
    // Initialize execution engine
    engine = StrategyExecutionEngine.getInstance();
    
    // Load strategies with protection
    let loadedCount = 0;
    const conversionResults: ConversionResult[] = [];
    
    for (const dbStrategy of dbStrategies) {
      // Check if shutdown is in progress
      if (shutdownManager.isShuttingDownNow()) {
        console.log('⚠️ Shutdown detected, stopping strategy loading');
        break;
      }
      
      try {
        const detectedType = detectStrategyType(dbStrategy.strategyType);
        
        if (detectedType === 'unknown') {
          console.log(`⚠️ Unknown strategy type: ${dbStrategy.strategyType}`);
          continue;
        }
        
        const config = dbStrategy.parameters.reduce((acc, param) => {
          let value = param.currentValue;
          if (param.parameterType === 'number') {
            value = parseFloat(value);
          } else if (param.parameterType === 'boolean') {
            value = value === 'true';
          }
          acc[param.parameterName] = value;
          return acc;
        }, {} as Record<string, any>);
        
        const strategyForEngine = {
          id: dbStrategy.id,
          name: dbStrategy.name,
          type: detectedType as any,
          config: config,
          isActive: dbStrategy.isActive
        };
        
        console.log(`✅ Loading: ${dbStrategy.name} (${detectedType})`);
        
        // Add to execution engine with protection
        await withRetry(async () => {
          engine!.addStrategy(strategyForEngine, 'BTCUSD');
        });
        
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
        console.error(`❌ Failed to convert strategy ${dbStrategy.name}:`, conversionError.message);
        conversionResults.push({
          id: dbStrategy.id,
          name: dbStrategy.name,
          dbType: dbStrategy.strategyType,
          success: false,
          error: conversionError.message
        });
      }
    }
    
    console.log(`\n🎉 STRATEGY LOADING COMPLETE`);
    console.log(`   Successfully loaded: ${loadedCount}`);
    console.log(`   Failed: ${conversionResults.filter(r => !r.success).length}`);
    
    if (loadedCount === 0) {
      throw new Error('No strategies could be loaded');
    }
    
    // Start the engine with protection
    console.log('\n📈 Starting protected execution engine...');
    engine.startEngine();
    
    // System status
    const loadTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n🚀 PROTECTED SYSTEM STATUS:');
    console.log(`   ✅ ${loadedCount} strategies loaded`);
    console.log(`   ✅ Graceful shutdown protection active`);
    console.log(`   ✅ Transaction management enabled`);
    console.log(`   ✅ Emergency backup configured`);
    console.log(`   ✅ Load time: ${loadTime} seconds`);
    
    // Show connection stats
    const stats = enhancedPrisma.getConnectionStats();
    console.log('\n📊 DATABASE CONNECTION STATS:');
    console.log(`   Connected: ${stats.isConnected}`);
    console.log(`   Pending transactions: ${stats.pendingTransactions}`);
    console.log(`   Connection attempts: ${stats.connectionAttempts}`);
    
    // Phase status check
    const phaseModule = await import('./src/lib/quantum-forge-phase-config');
    const phaseManager = phaseModule.default?.phaseManager;
    if (phaseManager) {
      await phaseManager.updateTradeCount();
      const currentPhase = await phaseManager.getCurrentPhase();
      const progress = await phaseManager.getProgressToNextPhase();
      
      console.log('\n🎯 PHASE STATUS:');
      console.log(`   Current Phase: ${currentPhase.phase} - ${currentPhase.name}`);
      console.log(`   Entry Trades: ${progress.currentTrades}`);
      console.log(`   Progress to Next: ${progress.progress}%`);
      
      if (currentPhase.phase === 4) {
        console.log('   🎊 PHASE 4 ACTIVE - Ready for live trading!');
      } else {
        console.log(`   Trades to Phase 4: ${2000 - progress.currentTrades}`);
      }
    }
    
    console.log('\n━'.repeat(70));
    console.log('🛡️ PROTECTED TRADING SYSTEM RUNNING');
    console.log('Press Ctrl+C for graceful shutdown with data protection');
    console.log('━'.repeat(70));
    
    return { 
      success: true, 
      loadedStrategies: loadedCount,
      totalStrategies: dbStrategies.length,
      conversionResults,
      protected: true
    };
    
  } catch (error) {
    console.error('\n💥 Fatal error in protected trading system:', error);
    
    // Emergency save attempt
    try {
      const emergencyFile = path.join('/tmp/signalcartel-emergency', `crash_${Date.now()}.json`);
      fs.writeFileSync(emergencyFile, JSON.stringify({
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack
        }
      }, null, 2));
      console.log(`📝 Emergency data saved to ${emergencyFile}`);
    } catch (saveError) {
      console.error('Failed to save emergency data:', saveError.message);
    }
    
    // Initiate graceful shutdown
    await shutdownManager.shutdown('Fatal error: ' + error.message);
    
    return { success: false, error: error.message, protected: true };
  }
}

function detectStrategyType(dbType: string): string {
  const typeMap: Record<string, string> = {
    'rsi': 'gpu-rsi',
    'macd': 'gpu-macd',
    'bollinger': 'gpu-bollinger',
    'volume': 'gpu-volume',
    'sentiment': 'gpu-sentiment',
    'neural': 'gpu-neural',
    'momentum': 'gpu-momentum',
    'meanReversion': 'gpu-mean-reversion',
    'trendFollowing': 'gpu-trend',
    'gpu-rsi': 'gpu-rsi',
    'gpu-macd': 'gpu-macd',
    'gpu-bollinger': 'gpu-bollinger',
    'gpu-volume': 'gpu-volume',
    'gpu-sentiment': 'gpu-sentiment',
    'gpu-neural': 'gpu-neural',
    'gpu-momentum': 'gpu-momentum',
    'gpu-mean-reversion': 'gpu-mean-reversion',
    'gpu-trend': 'gpu-trend'
  };
  
  const normalizedType = dbType.toLowerCase().replace(/[-_]/g, '');
  
  for (const [key, value] of Object.entries(typeMap)) {
    if (normalizedType.includes(key.toLowerCase().replace(/[-_]/g, ''))) {
      return value;
    }
  }
  
  return 'unknown';
}

// Run if called directly
if (require.main === module) {
  loadDatabaseStrategiesProtected()
    .then(result => {
      if (result.success) {
        console.log('\n✅ Protected database strategies loaded successfully!');
        console.log('🔄 System is running with full data protection...');
        
        // Keep process running
        console.log('\n📊 Monitoring trades with protection... (Ctrl+C for graceful shutdown)');
        
        // Prevent process from exiting
        setInterval(() => {
          // Keep alive
        }, 1000);
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}