/**
 * Complete Trading Pipeline Test Script
 * 
 * Tests both:
 * 1. Pine Script strategies with database parameters (original system)
 * 2. Custom paper trading engine (new LLN data generation system)
 * 
 * Usage: 
 * - npm run test-complete-pipeline        (tests both systems)
 * - npm run test-complete-pipeline pine   (tests only Pine Script)
 * - npm run test-complete-pipeline custom (tests only Custom Paper Trading)
 */

import { PrismaClient } from '@prisma/client';
import StrategyExecutionEngine from './src/lib/strategy-execution-engine';
import { alpacaPaperTradingService } from './src/lib/alpaca-paper-trading-service';
import marketDataService from './src/lib/market-data-service';
import { spawn } from 'child_process';

const prisma = new PrismaClient();

// Test mode selection
const testMode = process.argv[2] || 'both'; // 'pine', 'custom', or 'both'

// Pine Script test configurations with relaxed thresholds
const PINE_TEST_CONFIGS = {
  RSI_PULLBACK: {
    lookback: 14,
    lowerBarrier: 45,     // Relaxed from 30
    lowerThreshold: 48,   
    upperBarrier: 55,     // Relaxed from 70
    upperThreshold: 52,   
    maLength: 20,         
    atrMultSL: 5.0,       
    atrMultTP: 1.0,       
    positionSize: 0.001,  
    stopLoss: 5.0,
    takeProfit: 1.0
  }
};

async function testCompletePipeline() {
  console.log('🧪 COMPLETE TRADING PIPELINE TEST');
  console.log('=' + '='.repeat(70));
  console.log(`📋 Test Mode: ${testMode.toUpperCase()}`);
  console.log('=' + '='.repeat(70));
  
  if (testMode === 'both' || testMode === 'pine') {
    await testPineScriptPipeline();
  }
  
  if (testMode === 'both' || testMode === 'custom') {
    await testCustomPaperTradingPipeline();
  }
  
  if (testMode === 'both') {
    await compareSystemResults();
  }
}

async function testPineScriptPipeline() {
  console.log('\n📜 PINE SCRIPT PIPELINE TEST');
  console.log('-'.repeat(50));
  
  try {
    // 1. Check Alpaca connection
    console.log('📡 Checking Alpaca connection...');
    const account = await alpacaPaperTradingService.getAccountInfo();
    if (!account) {
      throw new Error('Alpaca not connected. Please check API credentials.');
    }
    console.log(`✅ Alpaca connected: $${parseFloat(account.buying_power).toLocaleString()} buying power`);
    
    // 2. Get Pine Script strategies from database
    const pineStrategies = await prisma.pineStrategy.findMany({
      where: { isActive: true },
      include: { parameters: true },
      take: 1
    });
    
    if (pineStrategies.length === 0) {
      console.log('⚠️  No active Pine Script strategies found');
      return;
    }
    
    const strategy = pineStrategies[0];
    console.log(`📊 Testing Pine Script strategy: ${strategy.name}`);
    console.log(`   Type: ${strategy.strategyType}`);
    console.log(`   Parameters: ${strategy.parameters.length}`);
    
    // 3. Set up execution engine with relaxed parameters
    const engine = StrategyExecutionEngine.getInstance();
    engine.setPaperTradingMode(true);
    
    const testConfig = {
      id: 'pine-test-001',
      name: `TEST - ${strategy.name}`,
      type: 'ENHANCED_RSI_PULLBACK',
      status: 'active' as const,
      config: PINE_TEST_CONFIGS.RSI_PULLBACK,
      isActive: true
    };
    
    console.log('🎯 Pine Script Test Configuration:');
    console.log(`   Lower Barrier: ${testConfig.config.lowerBarrier} (buy when RSI below)`);
    console.log(`   Upper Barrier: ${testConfig.config.upperBarrier} (sell when RSI above)`);
    
    engine.addStrategy(testConfig, 'BTCUSD');
    engine.startEngine();
    
    // 4. Monitor for 5 minutes
    console.log('👀 Monitoring Pine Script pipeline for 5 minutes...');
    await monitorTradingActivity('pine', 5 * 60 * 1000); // 5 minutes
    
    engine.stopEngine();
    
  } catch (error: any) {
    console.error('❌ Pine Script pipeline test failed:', error.message);
  }
}

async function testCustomPaperTradingPipeline() {
  console.log('\n💰 CUSTOM PAPER TRADING PIPELINE TEST');
  console.log('-'.repeat(50));
  
  try {
    // 1. Check existing custom paper trading data
    const existingTrades = await prisma.paperTrade.count();
    const existingSessions = await prisma.paperTradingSession.count();
    
    console.log(`📊 Existing custom paper trading data:`);
    console.log(`   Trades: ${existingTrades}`);
    console.log(`   Sessions: ${existingSessions}`);
    
    // 2. Check if custom engine is currently running
    console.log('\n🔍 Checking custom paper trading engine status...');
    
    // Look for recent trades (last 10 minutes)
    const recentTrades = await prisma.paperTrade.findMany({
      where: {
        executedAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
        }
      },
      orderBy: { executedAt: 'desc' },
      take: 5
    });
    
    if (recentTrades.length > 0) {
      console.log(`✅ Custom engine appears active - ${recentTrades.length} recent trades`);
      recentTrades.forEach(trade => {
        console.log(`   ${trade.side.toUpperCase()} ${trade.quantity} ${trade.symbol} @ $${trade.price} (${trade.executedAt.toLocaleTimeString()})`);
      });
    } else {
      console.log('⚠️  No recent custom paper trading activity');
      console.log('💡 Starting new custom paper trading session...');
      
      // 3. Start a short custom paper trading session
      await startCustomPaperTradingSession();
    }
    
    // 4. Test API endpoints
    console.log('\n🌐 Testing dashboard API endpoints...');
    await testDashboardAPI();
    
  } catch (error: any) {
    console.error('❌ Custom paper trading pipeline test failed:', error.message);
  }
}

async function startCustomPaperTradingSession() {
  console.log('🚀 Starting short custom paper trading session...');
  
  return new Promise((resolve, reject) => {
    // Start the custom paper trading engine for 2 minutes
    const customProcess = spawn('npx', ['tsx', '-r', 'dotenv/config', 'custom-paper-trading.ts'], {
      stdio: 'pipe',
      env: { ...process.env, TRADING_DURATION: '120' } // 2 minutes
    });
    
    let output = '';
    
    customProcess.stdout?.on('data', (data) => {
      output += data.toString();
      console.log(`   ${data.toString().trim()}`);
    });
    
    customProcess.stderr?.on('data', (data) => {
      console.log(`   Error: ${data.toString().trim()}`);
    });
    
    customProcess.on('close', (code) => {
      console.log(`✅ Custom paper trading session completed (exit code: ${code})`);
      resolve(output);
    });
    
    customProcess.on('error', (error) => {
      console.error(`❌ Failed to start custom paper trading: ${error.message}`);
      reject(error);
    });
    
    // Kill after 3 minutes max
    setTimeout(() => {
      customProcess.kill();
      resolve(output);
    }, 3 * 60 * 1000);
  });
}

async function testDashboardAPI() {
  try {
    const response = await fetch('http://localhost:3001/api/custom-paper-trading/dashboard');
    
    if (!response.ok) {
      console.log(`⚠️  Dashboard API returned status: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    
    if (data.success && data.data) {
      console.log('✅ Dashboard API working correctly');
      console.log(`   Trades returned: ${data.data.trades?.length || 0}`);
      console.log(`   Sessions returned: ${data.data.sessions?.length || 0}`);
      console.log(`   Signals returned: ${data.data.signals?.length || 0}`);
    } else {
      console.log('⚠️  Dashboard API returned invalid data');
    }
    
  } catch (error: any) {
    console.log(`❌ Dashboard API test failed: ${error.message}`);
  }
}

async function monitorTradingActivity(systemType: string, duration: number) {
  return new Promise((resolve) => {
    let checkCount = 0;
    const checkInterval = 30000; // 30 seconds
    const maxChecks = Math.floor(duration / checkInterval);
    
    const monitor = setInterval(async () => {
      checkCount++;
      console.log(`\n🔄 Check #${checkCount}/${maxChecks} - ${new Date().toLocaleTimeString()}`);
      
      try {
        if (systemType === 'pine') {
          // Check Alpaca for Pine Script trades
          const orders = await alpacaPaperTradingService.getOrders({ 
            status: 'all', 
            limit: 5,
            after: new Date(Date.now() - checkInterval).toISOString()
          });
          
          if (orders && orders.length > 0) {
            console.log(`   🎉 PINE SCRIPT TRADES! ${orders.length} new orders`);
            orders.forEach(order => {
              console.log(`      - ${order.side} ${order.qty} ${order.symbol} (${order.status})`);
            });
          } else {
            console.log(`   No new Pine Script trades`);
          }
        }
        
        // Always check custom paper trading activity
        const recentCustomTrades = await prisma.paperTrade.findMany({
          where: {
            executedAt: {
              gte: new Date(Date.now() - checkInterval)
            }
          },
          orderBy: { executedAt: 'desc' }
        });
        
        if (recentCustomTrades.length > 0) {
          console.log(`   📈 CUSTOM TRADES! ${recentCustomTrades.length} new custom trades`);
          recentCustomTrades.forEach(trade => {
            console.log(`      - ${trade.side.toUpperCase()} ${trade.quantity} ${trade.symbol} @ $${trade.price}`);
          });
        } else {
          console.log(`   No new custom paper trades`);
        }
        
      } catch (error: any) {
        console.log(`   Error checking activity: ${error.message}`);
      }
      
      if (checkCount >= maxChecks) {
        clearInterval(monitor);
        resolve(void 0);
      }
    }, checkInterval);
  });
}

async function compareSystemResults() {
  console.log('\n📊 SYSTEM COMPARISON');
  console.log('-'.repeat(50));
  
  try {
    // Pine Script system stats
    const alpacaAccount = await alpacaPaperTradingService.getAccountInfo();
    const alpacaOrders = await alpacaPaperTradingService.getOrders({ 
      status: 'all', 
      limit: 100 
    });
    
    // Custom paper trading stats
    const customTrades = await prisma.paperTrade.count();
    const customPnL = await prisma.paperTrade.aggregate({
      _sum: { pnl: true }
    });
    const customSessions = await prisma.paperTradingSession.count();
    
    console.log('Pine Script System:');
    console.log(`   Alpaca Account Value: $${alpacaAccount?.portfolio_value || 'N/A'}`);
    console.log(`   Total Alpaca Orders: ${alpacaOrders?.length || 0}`);
    console.log(`   Uses: Database strategies with Pine Script parameters`);
    
    console.log('\nCustom Paper Trading System:');
    console.log(`   Total Custom Trades: ${customTrades}`);
    console.log(`   Custom P&L: $${customPnL._sum.pnl?.toFixed(2) || '0.00'}`);
    console.log(`   Trading Sessions: ${customSessions}`);
    console.log(`   Uses: Custom engine for LLN data generation`);
    
    console.log('\n🎯 System Purposes:');
    console.log('   • Pine Script: Real trading strategies from database');
    console.log('   • Custom Paper: Data generation for LLN and Markov analysis');
    console.log('   • Both systems feed into unified dashboard');
    
  } catch (error: any) {
    console.error('❌ System comparison failed:', error.message);
  }
}

// Run the test
console.log('Starting complete pipeline test...\n');
testCompletePipeline()
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('\n✅ Pipeline test completed');
    process.exit(0);
  });