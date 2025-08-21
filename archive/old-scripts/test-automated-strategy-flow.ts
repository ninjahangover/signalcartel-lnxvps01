/**
 * Test the automated strategy evaluation -> alert generation -> trade execution flow
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment
config({ path: resolve(process.cwd(), '.env.local') });

async function testAutomatedStrategyFlow() {
  console.log('🧪 Testing Automated Strategy-to-Trade Flow...');

  try {
    // 1. Initialize all systems
    console.log('🚀 Step 1: Initialize all trading systems...');
    
    // Start strategy registry
    const { getAllStrategies } = await import('./src/lib/strategy-registry');
    const strategies = getAllStrategies();
    console.log(`📋 Found ${strategies.length} registered strategies`);
    
    strategies.forEach(strategy => {
      console.log(`  - ${strategy.name} (${strategy.symbol}): ${strategy.enabled ? 'ENABLED' : 'DISABLED'}`);
    });

    // 2. Start Alert Generation Engine with strategies
    console.log('🚨 Step 2: Start Alert Generation Engine...');
    const AlertGenerationEngine = (await import('./src/lib/alert-generation-engine')).default;
    const alertEngine = AlertGenerationEngine.getInstance();
    
    // Initialize strategies in alert engine
    for (const strategy of strategies.filter(s => s.enabled)) {
      alertEngine.initializeStrategy(strategy, strategy.symbol);
      console.log(`✅ Initialized alert generation for ${strategy.name}`);
    }
    
    alertEngine.startEngine();
    console.log('✅ Alert generation engine started');

    // 3. Start Market Data Collection
    console.log('📊 Step 3: Start market data collection...');
    const { marketDataCollector } = await import('./src/lib/market-data-collector');
    
    // Start collecting data for strategy symbols
    const symbols = [...new Set(strategies.map(s => s.symbol))];
    console.log(`📊 Starting data collection for symbols: ${symbols.join(', ')}`);
    
    await marketDataCollector.startCollection();
    console.log('✅ Market data collection started');

    // 4. Initialize Alpaca Integration 
    console.log('🦙 Step 4: Initialize Alpaca integration...');
    const { alpacaStratusIntegration } = await import('./src/lib/alpaca-stratus-integration');
    
    await alpacaStratusIntegration.initialize('automated-test-user');
    await alpacaStratusIntegration.startOptimizationEngine();
    console.log('✅ Alpaca integration ready');

    // 5. Monitor for automated activity
    console.log('👀 Step 5: Monitor for automated strategy signals...');
    console.log('⏰ Waiting 30 seconds to observe automated trading activity...');
    
    let alertCount = 0;
    let tradeCount = 0;
    
    // Monitor alerts
    const monitorInterval = setInterval(() => {
      const stats = alertEngine.getAlertStats();
      const history = alpacaStratusIntegration.getTradeHistory();
      
      if (stats.totalAlerts > alertCount) {
        alertCount = stats.totalAlerts;
        console.log(`🚨 NEW ALERT GENERATED! Total: ${alertCount}`);
        
        if (stats.recentAlerts.length > 0) {
          const latestAlert = stats.recentAlerts[stats.recentAlerts.length - 1];
          console.log(`📊 Latest: ${latestAlert.action} ${latestAlert.symbol} at $${latestAlert.price} (${latestAlert.confidence}%)`);
        }
      }
      
      if (history && history.length > tradeCount) {
        tradeCount = history.length;
        console.log(`💰 NEW TRADE EXECUTED! Total: ${tradeCount}`);
        
        const latestTrade = history[history.length - 1];
        console.log(`📊 Trade: ${latestTrade.action} ${latestTrade.quantity} ${latestTrade.symbol} at $${latestTrade.price}`);
      }
    }, 5000); // Check every 5 seconds

    // Wait for activity
    await new Promise(resolve => setTimeout(resolve, 30000));
    clearInterval(monitorInterval);

    // 6. Final status check
    console.log('\n📋 FINAL STATUS CHECK:');
    console.log('======================');
    
    const finalStats = alertEngine.getAlertStats();
    const finalHistory = alpacaStratusIntegration.getTradeHistory();
    
    console.log(`🚨 Total alerts generated: ${finalStats.totalAlerts}`);
    console.log(`💰 Total trades executed: ${finalHistory ? finalHistory.length : 0}`);
    console.log(`📊 Market data active: ${marketDataCollector.isCollectionActive()}`);
    
    // Show recent alerts
    if (finalStats.recentAlerts.length > 0) {
      console.log('\n🚨 Recent Alerts:');
      finalStats.recentAlerts.slice(-3).forEach(alert => {
        console.log(`  - ${alert.timestamp.toLocaleTimeString()}: ${alert.action} ${alert.symbol} at $${alert.price}`);
      });
    }
    
    // Show recent trades  
    if (finalHistory && finalHistory.length > 0) {
      console.log('\n💰 Recent Trades:');
      finalHistory.slice(-3).forEach(trade => {
        console.log(`  - ${trade.executionTime.toLocaleTimeString()}: ${trade.action} ${trade.quantity} ${trade.symbol} at $${trade.price}`);
      });
    }

    if (finalStats.totalAlerts > 0 && finalHistory && finalHistory.length > 0) {
      console.log('\n🎉 SUCCESS! AUTOMATED STRATEGY-TO-TRADE FLOW IS WORKING!');
      console.log('✅ Strategies are evaluating market conditions');
      console.log('✅ Alerts are being generated automatically');
      console.log('✅ Trades are being executed automatically');
    } else if (finalStats.totalAlerts > 0) {
      console.log('\n⚠️ PARTIAL SUCCESS: Alerts generated but trades not executing');
      console.log('💡 Check Alpaca integration and trade execution logic');
    } else {
      console.log('\n⚠️ NO AUTOMATED ACTIVITY DETECTED');
      console.log('💡 Possible issues:');
      console.log('   - Market conditions may not trigger strategy signals');
      console.log('   - Strategy parameters may need adjustment');
      console.log('   - Market data collection may not be working');
    }

  } catch (error) {
    console.error('❌ Automated strategy test failed:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testAutomatedStrategyFlow().catch(console.error);