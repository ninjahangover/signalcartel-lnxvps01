/**
 * System Health Check - Complete Trading Pipeline Verification
 */

import { PrismaClient } from '@prisma/client';
import StrategyExecutionEngine from './src/lib/strategy-execution-engine';
import { StrategyService } from './src/lib/strategy-service';
import { alpacaPaperTradingService } from './src/lib/alpaca-paper-trading-service';
import marketDataService from './src/lib/market-data-service';

const prisma = new PrismaClient();

interface HealthCheckResult {
  component: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  details?: any;
}

async function checkDatabaseStrategies(): Promise<HealthCheckResult> {
  try {
    const totalStrategies = await prisma.pineStrategy.count();
    const activeStrategies = await prisma.pineStrategy.count({ where: { isActive: true }});
    const strategies = await prisma.pineStrategy.findMany({ 
      where: { isActive: true },
      select: { name: true, strategyType: true, isActive: true, parameters: true }
    });
    
    if (totalStrategies === 0) {
      return {
        component: 'Database Strategies',
        status: 'error',
        message: 'No strategies found in database',
        details: { totalStrategies, activeStrategies }
      };
    }
    
    if (activeStrategies === 0) {
      return {
        component: 'Database Strategies',
        status: 'warning',
        message: `Found ${totalStrategies} strategies but none are active`,
        details: { totalStrategies, activeStrategies }
      };
    }
    
    return {
      component: 'Database Strategies',
      status: 'ok',
      message: `${activeStrategies} active strategies ready`,
      details: {
        totalStrategies,
        activeStrategies,
        strategies: strategies.map(s => ({
          name: s.name,
          type: s.strategyType,
          parameterCount: s.parameters.length
        }))
      }
    };
  } catch (error: any) {
    return {
      component: 'Database Strategies',
      status: 'error',
      message: error.message
    };
  }
}

async function checkStrategyExecutionEngine(): Promise<HealthCheckResult> {
  try {
    const engine = StrategyExecutionEngine.getInstance();
    
    // Check if engine can be initialized
    engine.setPaperTradingMode(true);
    
    // Try to get engine status
    const status = engine.getEngineStatus();
    
    if (!status.isRunning) {
      return {
        component: 'Strategy Execution Engine',
        status: 'warning',
        message: 'Engine initialized but not running',
        details: status
      };
    }
    
    return {
      component: 'Strategy Execution Engine',
      status: 'ok',
      message: 'Engine ready for execution',
      details: {
        paperTradingMode: true,
        isRunning: status.isRunning,
        activeStrategies: status.activeStrategies
      }
    };
  } catch (error: any) {
    return {
      component: 'Strategy Execution Engine',
      status: 'error',
      message: error.message
    };
  }
}

async function checkAlpacaIntegration(): Promise<HealthCheckResult> {
  try {
    const hasKey = process.env.ALPACA_PAPER_API_KEY || process.env.NEXT_PUBLIC_ALPACA_PAPER_API_KEY;
    const hasSecret = process.env.ALPACA_PAPER_API_SECRET || process.env.NEXT_PUBLIC_ALPACA_PAPER_API_SECRET;
    
    if (!hasKey || !hasSecret) {
      return {
        component: 'Alpaca Paper Trading',
        status: 'error',
        message: 'API credentials not configured',
        details: {
          apiKeyConfigured: !!hasKey,
          apiSecretConfigured: !!hasSecret,
          requiredEnvVars: ['ALPACA_PAPER_API_KEY', 'ALPACA_PAPER_API_SECRET']
        }
      };
    }
    
    // Try to connect
    const accountInfo = await alpacaPaperTradingService.getAccountInfo();
    
    if (!accountInfo) {
      return {
        component: 'Alpaca Paper Trading',
        status: 'error',
        message: 'Could not connect to Alpaca API',
        details: { credentialsConfigured: true, connectionFailed: true }
      };
    }
    
    return {
      component: 'Alpaca Paper Trading',
      status: 'ok',
      message: 'Connected to Alpaca Paper Trading',
      details: {
        accountId: accountInfo.id,
        accountStatus: accountInfo.status,
        buyingPower: parseFloat(accountInfo.buying_power),
        equity: parseFloat(accountInfo.equity)
      }
    };
  } catch (error: any) {
    return {
      component: 'Alpaca Paper Trading',
      status: 'error',
      message: error.message
    };
  }
}

async function checkMarketDataService(): Promise<HealthCheckResult> {
  try {
    // Check if market data service can fetch data
    const testSymbol = 'BTCUSD';
    
    return new Promise((resolve) => {
      let dataReceived = false;
      
      // Subscribe to test symbol
      const unsubscribe = marketDataService.subscribe(testSymbol, (data) => {
        dataReceived = true;
        unsubscribe();
        
        resolve({
          component: 'Market Data Service',
          status: 'ok',
          message: 'Real-time market data flowing',
          details: {
            testSymbol,
            lastPrice: data.price,
            timestamp: data.timestamp
          }
        });
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (!dataReceived) {
          unsubscribe();
          resolve({
            component: 'Market Data Service',
            status: 'warning',
            message: 'Market data service initialized but no data received',
            details: { testSymbol, timeout: '5 seconds' }
          });
        }
      }, 5000);
    });
  } catch (error: any) {
    return {
      component: 'Market Data Service',
      status: 'error',
      message: error.message
    };
  }
}

async function checkSignalGeneration(): Promise<HealthCheckResult> {
  try {
    // Check if strategies can generate signals
    const engine = StrategyExecutionEngine.getInstance();
    const adminUserId = 'cme53zc9y0000mwgyjb9joki2';
    
    // Load one strategy for testing
    const strategies = await StrategyService.getUserStrategies(adminUserId);
    const activeStrategy = strategies.find(s => s.isActive);
    
    if (!activeStrategy) {
      return {
        component: 'Signal Generation',
        status: 'warning',
        message: 'No active strategies to test signal generation',
        details: { totalStrategies: strategies.length }
      };
    }
    
    // Check if strategy has proper configuration
    const hasParameters = activeStrategy.parameters && activeStrategy.parameters.length > 0;
    const hasPineScript = !!activeStrategy.pineScriptCode;
    
    return {
      component: 'Signal Generation',
      status: hasParameters && hasPineScript ? 'ok' : 'warning',
      message: hasParameters && hasPineScript 
        ? 'Strategy configured for signal generation' 
        : 'Strategy missing configuration',
      details: {
        strategyName: activeStrategy.name,
        hasParameters,
        hasPineScript,
        parameterCount: activeStrategy.parameters?.length || 0
      }
    };
  } catch (error: any) {
    return {
      component: 'Signal Generation',
      status: 'error',
      message: error.message
    };
  }
}

async function runHealthCheck() {
  console.log('🏥 SIGNAL CARTEL SYSTEM HEALTH CHECK');
  console.log('=' + '='.repeat(50));
  console.log('Checking all critical components...\n');
  
  const results: HealthCheckResult[] = [];
  
  // Run all checks
  console.log('1️⃣  Checking database strategies...');
  results.push(await checkDatabaseStrategies());
  
  console.log('2️⃣  Checking strategy execution engine...');
  results.push(await checkStrategyExecutionEngine());
  
  console.log('3️⃣  Checking Alpaca paper trading integration...');
  results.push(await checkAlpacaIntegration());
  
  console.log('4️⃣  Checking market data service...');
  results.push(await checkMarketDataService());
  
  console.log('5️⃣  Checking signal generation capability...');
  results.push(await checkSignalGeneration());
  
  // Display results
  console.log('\n📊 HEALTH CHECK RESULTS');
  console.log('=' + '='.repeat(50));
  
  const statusEmoji = {
    ok: '✅',
    warning: '⚠️',
    error: '❌'
  };
  
  results.forEach(result => {
    console.log(`\n${statusEmoji[result.status]} ${result.component}`);
    console.log(`   Status: ${result.status.toUpperCase()}`);
    console.log(`   Message: ${result.message}`);
    if (result.details) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2).split('\n').map(l => '   ' + l).join('\n').trim());
    }
  });
  
  // Overall assessment
  const errorCount = results.filter(r => r.status === 'error').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  const okCount = results.filter(r => r.status === 'ok').length;
  
  console.log('\n📈 OVERALL SYSTEM STATUS');
  console.log('=' + '='.repeat(50));
  console.log(`   ✅ Healthy: ${okCount}`);
  console.log(`   ⚠️  Warnings: ${warningCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  
  if (errorCount === 0 && warningCount === 0) {
    console.log('\n🎉 System is FULLY OPERATIONAL and ready for trading!');
  } else if (errorCount === 0) {
    console.log('\n⚠️  System is OPERATIONAL with some warnings. Review above for details.');
  } else {
    console.log('\n❌ System has CRITICAL ISSUES that need to be resolved:');
    results.filter(r => r.status === 'error').forEach(r => {
      console.log(`   - ${r.component}: ${r.message}`);
    });
  }
  
  // Specific issue resolutions
  console.log('\n💡 RECOMMENDED ACTIONS:');
  
  const alpacaResult = results.find(r => r.component === 'Alpaca Paper Trading');
  if (alpacaResult?.status === 'error') {
    console.log('\n📌 To fix Alpaca integration:');
    console.log('   1. Sign up for free at: https://app.alpaca.markets/signup');
    console.log('   2. Go to: https://app.alpaca.markets/paper/dashboard/overview');
    console.log('   3. Copy your Paper Trading API credentials');
    console.log('   4. Add to your .env file:');
    console.log('      ALPACA_PAPER_API_KEY=your-key-here');
    console.log('      ALPACA_PAPER_API_SECRET=your-secret-here');
  }
  
  const dbResult = results.find(r => r.component === 'Database Strategies');
  if (dbResult?.status === 'warning' || dbResult?.status === 'error') {
    console.log('\n📌 To activate strategies:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Go to: http://localhost:3001');
    console.log('   3. Navigate to the strategies page');
    console.log('   4. Activate desired strategies');
  }
  
  await prisma.$disconnect();
}

// Run the health check
runHealthCheck().catch(error => {
  console.error('Fatal error during health check:', error);
  process.exit(1);
});