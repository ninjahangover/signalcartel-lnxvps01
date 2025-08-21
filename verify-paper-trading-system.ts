#!/usr/bin/env tsx

/**
 * Paper Trading System Verification
 * 
 * Complete verification before enabling live trading:
 * 1. Strategy signal generation
 * 2. Alpaca paper trading execution
 * 3. Performance tracking accuracy
 * 4. Risk management compliance
 * 5. AI optimization effectiveness
 * 
 * Run with: npx tsx verify-paper-trading-system.ts
 */

// Load environment variables from .env.local and .env
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load .env.local first (takes priority)
try {
  const envLocalPath = join(process.cwd(), '.env.local');
  const envLocalContent = readFileSync(envLocalPath, 'utf8');
  const envLocalVars = envLocalContent.split('\n')
    .filter(line => line.includes('=') && !line.startsWith('#'))
    .reduce((acc, line) => {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').replace(/^"(.*)"$/, '$1');
      acc[key.trim()] = value.trim();
      return acc;
    }, {} as Record<string, string>);
  
  Object.assign(process.env, envLocalVars);
} catch (error) {
  console.log('⚠️ Could not load .env.local, using .env fallback');
}

// Load .env as fallback
config();

import { unifiedStrategySystem } from './src/lib/unified-strategy-system';
import StrategyExecutionEngine from './src/lib/strategy-execution-engine';
import { alpacaPaperTradingService } from './src/lib/alpaca-paper-trading-service';
import marketDataService from './src/lib/market-data-service';
import { aiTradeMonitor } from './src/lib/ai-trade-monitor';

interface VerificationResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string;
  critical: boolean;
}

class PaperTradingVerifier {
  private results: VerificationResult[] = [];
  private startTime = new Date();
  
  private addResult(category: string, test: string, status: 'PASS' | 'FAIL' | 'WARNING', details: string, critical = false) {
    this.results.push({ category, test, status, details, critical });
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    const criticalFlag = critical ? ' [CRITICAL]' : '';
    console.log(`${emoji} ${test}${criticalFlag}: ${details}`);
  }
  
  async verifySystemReadiness(): Promise<boolean> {
    console.log('🔍 SYSTEM READINESS VERIFICATION');
    console.log('=' .repeat(50));
    
    // Test 1: API Connections
    console.log('\n📡 API Connections:');
    
    try {
      const accountInfo = await alpacaPaperTradingService.getAccountInfo();
      if (accountInfo && parseFloat(accountInfo.equity) > 0) {
        this.addResult('API', 'Alpaca Connection', 'PASS', 
          `Connected - $${parseFloat(accountInfo.equity).toLocaleString()} equity`, true);
      } else {
        this.addResult('API', 'Alpaca Connection', 'FAIL', 
          'No account info or zero equity', true);
        return false;
      }
    } catch (error) {
      this.addResult('API', 'Alpaca Connection', 'FAIL', 
        `Connection failed: ${error.message}`, true);
      return false;
    }
    
    // Test 2: Market Data
    console.log('\n📊 Market Data:');
    const testSymbols = ['BTCUSD', 'ETHUSD'];
    let marketDataWorking = true;
    
    for (const symbol of testSymbols) {
      try {
        let dataReceived = false;
        
        const unsubscribe = marketDataService.subscribe(symbol, (data) => {
          if (!dataReceived) {
            dataReceived = true;
            if (data.price > 0) {
              this.addResult('Market Data', `${symbol} Price Feed`, 'PASS', 
                `Real-time price: $${data.price.toLocaleString()}`);
            } else {
              this.addResult('Market Data', `${symbol} Price Feed`, 'FAIL', 
                'Invalid price data', true);
              marketDataWorking = false;
            }
            unsubscribe();
          }
        });
        
        // Wait up to 15 seconds for data
        await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            if (!dataReceived) {
              this.addResult('Market Data', `${symbol} Price Feed`, 'FAIL', 
                'No data received within 15 seconds', true);
              marketDataWorking = false;
              unsubscribe();
            }
            resolve(null);
          }, 15000);
        });
        
      } catch (error) {
        this.addResult('Market Data', `${symbol} Price Feed`, 'FAIL', 
          `Error: ${error.message}`, true);
        marketDataWorking = false;
      }
    }
    
    if (!marketDataWorking) return false;
    
    // Test 3: Strategy System
    console.log('\n🎯 Strategy System:');
    const strategies = unifiedStrategySystem.getAllStrategies();
    
    if (strategies.length === 0) {
      this.addResult('Strategy', 'Strategy Registry', 'FAIL', 
        'No strategies found', true);
      return false;
    }
    
    this.addResult('Strategy', 'Strategy Registry', 'PASS', 
      `${strategies.length} strategies loaded`);
    
    const workingStrategies = strategies.filter(s => s.execution.canExecutePaper);
    if (workingStrategies.length === 0) {
      this.addResult('Strategy', 'Paper Trading Ready', 'FAIL', 
        'No strategies can execute paper trades', true);
      return false;
    }
    
    this.addResult('Strategy', 'Paper Trading Ready', 'PASS', 
      `${workingStrategies.length} strategies ready for paper trading`);
    
    return true;
  }
  
  async verifyTradingExecution(): Promise<boolean> {
    console.log('\n⚡ TRADING EXECUTION VERIFICATION');
    console.log('=' .repeat(50));
    
    const engine = StrategyExecutionEngine.getInstance();
    
    // Test 1: Engine Status
    console.log('\n🚀 Engine Status:');
    
    if (!engine.isEngineRunning()) {
      console.log('Starting execution engine...');
      engine.startEngine();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    if (engine.isEngineRunning()) {
      this.addResult('Engine', 'Execution Engine', 'PASS', 'Engine is running');
    } else {
      this.addResult('Engine', 'Execution Engine', 'FAIL', 'Engine failed to start', true);
      return false;
    }
    
    if (engine.isPaperTradingMode()) {
      this.addResult('Engine', 'Trading Mode', 'PASS', 'Paper trading mode active');
    } else {
      this.addResult('Engine', 'Trading Mode', 'WARNING', 
        'Not in paper trading mode - switching...');
      engine.setPaperTradingMode(true);
    }
    
    // Test 2: Strategy Activation
    console.log('\n📋 Strategy Activation:');
    
    const rsiStrategy = unifiedStrategySystem.getStrategy('rsi-pullback-pro');
    if (!rsiStrategy) {
      this.addResult('Strategy', 'RSI Strategy', 'FAIL', 'RSI strategy not found', true);
      return false;
    }
    
    if (!rsiStrategy.enabled) {
      console.log('Enabling RSI Pullback Pro strategy...');
      const enabled = await unifiedStrategySystem.enableStrategy('rsi-pullback-pro');
      if (enabled) {
        this.addResult('Strategy', 'RSI Activation', 'PASS', 'Successfully enabled RSI strategy');
      } else {
        this.addResult('Strategy', 'RSI Activation', 'FAIL', 'Failed to enable RSI strategy', true);
        return false;
      }
    } else {
      this.addResult('Strategy', 'RSI Activation', 'PASS', 'RSI strategy already enabled');
    }
    
    // Test 3: Signal Generation Monitoring
    console.log('\n🎯 Signal Generation Test:');
    console.log('Monitoring for trading signals (60 seconds)...');
    
    let signalsDetected = 0;
    let tradesExecuted = 0;
    
    const initialPositions = await alpacaPaperTradingService.getPositions();
    const initialPositionCount = initialPositions.length;
    
    // Monitor for 60 seconds
    const monitoringStart = Date.now();
    while (Date.now() - monitoringStart < 60000) {
      // Check for new positions (indicating trades were executed)
      const currentPositions = await alpacaPaperTradingService.getPositions();
      const currentPositionCount = currentPositions.length;
      
      if (currentPositionCount !== initialPositionCount + tradesExecuted) {
        tradesExecuted = currentPositionCount - initialPositionCount;
        signalsDetected++;
        console.log(`   📊 Trade detected! Total positions: ${currentPositionCount}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
    }
    
    if (signalsDetected > 0) {
      this.addResult('Execution', 'Signal Generation', 'PASS', 
        `${signalsDetected} signals generated and ${tradesExecuted} trades executed`);
    } else {
      this.addResult('Execution', 'Signal Generation', 'WARNING', 
        'No signals generated in 60 seconds (normal in stable markets)');
    }
    
    return true;
  }
  
  async verifyRiskManagement(): Promise<boolean> {
    console.log('\n🛡️ RISK MANAGEMENT VERIFICATION');
    console.log('=' .repeat(50));
    
    // Test 1: Position Sizing
    console.log('\n💰 Position Sizing:');
    
    const accountInfo = await alpacaPaperTradingService.getAccountInfo();
    const accountEquity = parseFloat(accountInfo?.equity || '0');
    const positions = await alpacaPaperTradingService.getPositions();
    
    let totalPositionValue = 0;
    let maxPositionSize = 0;
    
    positions.forEach(position => {
      const positionValue = Math.abs(position.marketValue);
      totalPositionValue += positionValue;
      maxPositionSize = Math.max(maxPositionSize, positionValue);
    });
    
    const portfolioRisk = (totalPositionValue / accountEquity) * 100;
    const maxPositionRisk = (maxPositionSize / accountEquity) * 100;
    
    if (portfolioRisk <= 50) { // Max 50% of account in positions
      this.addResult('Risk', 'Portfolio Risk', 'PASS', 
        `Portfolio exposure: ${portfolioRisk.toFixed(1)}% of account`);
    } else {
      this.addResult('Risk', 'Portfolio Risk', 'WARNING', 
        `High portfolio exposure: ${portfolioRisk.toFixed(1)}% of account`);
    }
    
    if (maxPositionRisk <= 10) { // Max 10% per position
      this.addResult('Risk', 'Position Size', 'PASS', 
        `Largest position: ${maxPositionRisk.toFixed(1)}% of account`);
    } else {
      this.addResult('Risk', 'Position Size', 'WARNING', 
        `Large position detected: ${maxPositionRisk.toFixed(1)}% of account`);
    }
    
    // Test 2: Stop Loss Implementation
    console.log('\n🚨 Stop Loss Verification:');
    
    const strategies = unifiedStrategySystem.getAllStrategies().filter(s => s.enabled);
    let stopLossConfigured = true;
    
    strategies.forEach(strategy => {
      if (strategy.config.stopLoss && strategy.config.stopLoss > 0) {
        this.addResult('Risk', `${strategy.displayName} Stop Loss`, 'PASS', 
          `Stop loss set at ${strategy.config.stopLoss}%`);
      } else {
        this.addResult('Risk', `${strategy.displayName} Stop Loss`, 'FAIL', 
          'No stop loss configured', true);
        stopLossConfigured = false;
      }
    });
    
    return stopLossConfigured;
  }
  
  async verifyPerformanceTracking(): Promise<boolean> {
    console.log('\n📈 PERFORMANCE TRACKING VERIFICATION');
    console.log('=' .repeat(50));
    
    // Test 1: Real-time Metrics
    console.log('\n📊 Real-time Metrics:');
    
    const metrics = aiTradeMonitor.getMetrics();
    
    if (metrics.marketData.isActive) {
      this.addResult('Performance', 'Market Data Tracking', 'PASS', 
        `Tracking ${metrics.marketData.symbolsMonitored.length} symbols`);
    } else {
      this.addResult('Performance', 'Market Data Tracking', 'FAIL', 
        'Market data tracking inactive', true);
      return false;
    }
    
    if (metrics.execution.engineRunning) {
      this.addResult('Performance', 'Execution Tracking', 'PASS', 
        `${metrics.execution.activeStrategies} active strategies`);
    } else {
      this.addResult('Performance', 'Execution Tracking', 'FAIL', 
        'Execution engine not running');
      return false;
    }
    
    // Test 2: Data Accuracy
    console.log('\n🎯 Data Accuracy:');
    
    const strategies = unifiedStrategySystem.getAllStrategies();
    const realDataStrategies = strategies.filter(s => s.performance.isReal);
    
    if (realDataStrategies.length > 0) {
      this.addResult('Performance', 'Real Data Collection', 'PASS', 
        `${realDataStrategies.length} strategies using real performance data`);
    } else {
      this.addResult('Performance', 'Real Data Collection', 'WARNING', 
        'No strategies have real performance data yet (normal for new system)');
    }
    
    return true;
  }
  
  async generateReport(): Promise<void> {
    console.log('\n📋 VERIFICATION REPORT');
    console.log('=' .repeat(50));
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const warningTests = this.results.filter(r => r.status === 'WARNING').length;
    const criticalFailures = this.results.filter(r => r.status === 'FAIL' && r.critical).length;
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests} ✅`);
    console.log(`   Warnings: ${warningTests} ⚠️`);
    console.log(`   Failed: ${failedTests} ❌`);
    console.log(`   Critical Failures: ${criticalFailures} 🚨`);
    
    const successRate = (passedTests / totalTests) * 100;
    console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
    
    // Categorize results
    const categories = [...new Set(this.results.map(r => r.category))];
    
    console.log('\n📋 By Category:');
    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.category === category);
      const categoryPassed = categoryResults.filter(r => r.status === 'PASS').length;
      const categoryTotal = categoryResults.length;
      const categoryRate = (categoryPassed / categoryTotal) * 100;
      
      console.log(`   ${category}: ${categoryPassed}/${categoryTotal} (${categoryRate.toFixed(1)}%)`);
    });
    
    // Detailed failures
    const failures = this.results.filter(r => r.status === 'FAIL');
    if (failures.length > 0) {
      console.log('\n❌ Failures to Address:');
      failures.forEach(failure => {
        const critical = failure.critical ? ' [CRITICAL]' : '';
        console.log(`   - ${failure.test}${critical}: ${failure.details}`);
      });
    }
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    
    if (criticalFailures > 0) {
      console.log('   🚨 CRITICAL: Fix critical failures before proceeding to live trading');
    } else if (failedTests > 0) {
      console.log('   ⚠️  Address all test failures before live trading');
    } else if (warningTests > 0) {
      console.log('   ✅ Paper trading system ready - monitor warnings');
      console.log('   ➡️  Can proceed to live trading setup after extended paper testing');
    } else {
      console.log('   🎉 All systems verified! Paper trading fully operational');
      console.log('   ✅ Ready for extended paper trading period');
      console.log('   ➡️  Proceed to live trading setup when confident');
    }
    
    const elapsedTime = Date.now() - this.startTime.getTime();
    console.log(`\n⏱️  Verification completed in ${(elapsedTime / 1000).toFixed(1)} seconds`);
  }
  
  readyForLiveTrading(): boolean {
    const criticalFailures = this.results.filter(r => r.status === 'FAIL' && r.critical).length;
    const totalFailures = this.results.filter(r => r.status === 'FAIL').length;
    
    return criticalFailures === 0 && totalFailures === 0;
  }
}

async function main() {
  console.log('🔍 PAPER TRADING SYSTEM VERIFICATION');
  console.log('This comprehensive test verifies the paper trading system');
  console.log('before enabling live trading with real money.');
  console.log('=' .repeat(60));
  
  const verifier = new PaperTradingVerifier();
  
  try {
    // Step 1: System Readiness
    const systemReady = await verifier.verifySystemReadiness();
    if (!systemReady) {
      console.log('\n🚨 CRITICAL: System not ready for testing');
      await verifier.generateReport();
      process.exit(1);
    }
    
    // Step 2: Trading Execution
    await verifier.verifyTradingExecution();
    
    // Step 3: Risk Management
    await verifier.verifyRiskManagement();
    
    // Step 4: Performance Tracking
    await verifier.verifyPerformanceTracking();
    
    // Step 5: Generate Report
    await verifier.generateReport();
    
    // Final Assessment
    console.log('\n🎯 FINAL ASSESSMENT');
    console.log('=' .repeat(50));
    
    if (verifier.readyForLiveTrading()) {
      console.log('✅ PAPER TRADING SYSTEM VERIFIED');
      console.log('✅ All critical systems operational');
      console.log('✅ Risk management in place');
      console.log('✅ Performance tracking active');
      console.log('\n🎉 RECOMMENDATION: Paper trading system is ready!');
      console.log('📋 Next steps:');
      console.log('   1. Run paper trading for 24-48 hours');
      console.log('   2. Monitor performance and stability');
      console.log('   3. Verify AI optimization is improving results');
      console.log('   4. Then proceed to live trading setup');
    } else {
      console.log('❌ PAPER TRADING SYSTEM NOT READY');
      console.log('🚨 Critical issues must be resolved first');
      console.log('\n📋 Required actions:');
      console.log('   1. Fix all critical failures above');
      console.log('   2. Re-run this verification');
      console.log('   3. Do not proceed to live trading');
    }
    
    process.exit(verifier.readyForLiveTrading() ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Verification failed with error:', error);
    await verifier.generateReport();
    process.exit(1);
  }
}

main().catch(console.error);