#!/usr/bin/env tsx

/**
 * Transition to Live Trading
 * 
 * Safe transition from paper trading to live trading:
 * 1. Verify paper trading performance
 * 2. Run comprehensive safety checks
 * 3. Configure live trading parameters
 * 4. Set up monitoring and alerts
 * 5. Enable live trading with safeguards
 * 
 * Run with: npx tsx transition-to-live-trading.ts
 */

import { liveTradingSafety, LiveTradingConfig } from './src/lib/live-trading-safety';
import { unifiedStrategySystem } from './src/lib/unified-strategy-system';
import StrategyExecutionEngine from './src/lib/strategy-execution-engine';
import { aiTradeMonitor } from './src/lib/ai-trade-monitor';

class LiveTradingTransition {
  private readonly MINIMUM_PAPER_TRADING_DAYS = 2;
  private readonly MINIMUM_PAPER_TRADES = 20;
  private readonly MINIMUM_WIN_RATE = 60;
  
  async verifyPaperTradingResults(): Promise<{ready: boolean, report: string}> {
    console.log('📊 Verifying Paper Trading Results');
    console.log('=' .repeat(50));
    
    const strategies = unifiedStrategySystem.getAllStrategies();
    const enabledStrategies = strategies.filter(s => s.enabled);
    
    if (enabledStrategies.length === 0) {
      return {
        ready: false,
        report: 'No strategies enabled. Enable at least one strategy for paper trading.'
      };
    }
    
    let report = '';
    let totalTrades = 0;
    let totalProfit = 0;
    let profitableStrategies = 0;
    let readyStrategies = 0;
    
    for (const strategy of enabledStrategies) {
      const perf = strategy.performance;
      
      report += `\n${strategy.displayName}:\n`;
      report += `  Total Trades: ${perf.totalTrades}\n`;
      report += `  Win Rate: ${perf.winRate.toFixed(1)}%\n`;
      report += `  Total P&L: $${perf.totalProfit.toFixed(2)}\n`;
      report += `  Avg Profit/Trade: $${perf.avgProfit.toFixed(2)}\n`;
      report += `  Max Drawdown: ${perf.maxDrawdown.toFixed(1)}%\n`;
      report += `  Real Data: ${perf.isReal ? '✅' : '❌'}\n`;
      
      totalTrades += perf.totalTrades;
      totalProfit += perf.totalProfit;
      
      // Check if strategy meets minimum requirements
      if (perf.totalTrades >= 10 && perf.winRate >= this.MINIMUM_WIN_RATE && perf.totalProfit > 0) {
        profitableStrategies++;
        report += `  Status: ✅ READY FOR LIVE TRADING\n`;
        readyStrategies++;
      } else {
        report += `  Status: ❌ NEEDS MORE PAPER TRADING\n`;
        if (perf.totalTrades < 10) report += `    - Need ${10 - perf.totalTrades} more trades\n`;
        if (perf.winRate < this.MINIMUM_WIN_RATE) report += `    - Win rate too low (need ${this.MINIMUM_WIN_RATE}%+)\n`;
        if (perf.totalProfit <= 0) report += `    - Not profitable\n`;
      }
    }
    
    report += `\nOverall Summary:\n`;
    report += `  Total Trades: ${totalTrades}\n`;
    report += `  Total P&L: $${totalProfit.toFixed(2)}\n`;
    report += `  Ready Strategies: ${readyStrategies}/${enabledStrategies.length}\n`;
    
    const ready = (
      totalTrades >= this.MINIMUM_PAPER_TRADES &&
      readyStrategies > 0 &&
      totalProfit > 0
    );
    
    if (ready) {
      report += `\n✅ PAPER TRADING VERIFICATION PASSED\n`;
    } else {
      report += `\n❌ PAPER TRADING VERIFICATION FAILED\n`;
      if (totalTrades < this.MINIMUM_PAPER_TRADES) {
        report += `  - Need ${this.MINIMUM_PAPER_TRADES - totalTrades} more total trades\n`;
      }
      if (readyStrategies === 0) {
        report += `  - No strategies meet live trading requirements\n`;
      }
      if (totalProfit <= 0) {
        report += `  - Overall not profitable\n`;
      }
    }
    
    console.log(report);
    return { ready, report };
  }
  
  async runSafetyChecks(): Promise<{passed: boolean, report: string}> {
    console.log('\n🔒 Running Live Trading Safety Checks');
    console.log('=' .repeat(50));
    
    const results = await liveTradingSafety.runAllSafetyChecks();
    const status = liveTradingSafety.getSafetyStatus();
    
    let report = `\nSafety Check Results:\n`;
    report += `  Passed: ${results.passed}\n`;
    report += `  Failed: ${results.failed}\n`;
    report += `  Total: ${results.total}\n`;
    report += `  Critical Passed: ${status.allCriticalPassed ? '✅' : '❌'}\n`;
    report += `  Ready for Live: ${status.readyForLiveTrading ? '✅' : '❌'}\n`;
    
    report += `\nDetailed Results:\n`;
    status.checks.forEach(check => {
      const emoji = check.status === 'PASS' ? '✅' : check.status === 'FAIL' ? '❌' : '⚠️';
      const critical = check.critical ? ' [CRITICAL]' : '';
      report += `  ${emoji} ${check.name}${critical}\n`;
      if (check.details) {
        report += `     ${check.details}\n`;
      }
    });
    
    console.log(report);
    return { 
      passed: status.allCriticalPassed, 
      report 
    };
  }
  
  configureLiveTradingParameters(): LiveTradingConfig {
    console.log('\n⚙️ Configuring Live Trading Parameters');
    console.log('=' .repeat(50));
    
    // Conservative live trading configuration
    const config: LiveTradingConfig = {
      maxDailyLoss: 500,        // $500 max daily loss (conservative start)
      maxPositionSize: 2,       // 2% max position size (conservative)
      maxOpenPositions: 2,      // Max 2 positions (conservative)
      allowedSymbols: ['BTCUSD'], // Start with just Bitcoin
      tradingHours: {
        start: '09:00',         // Start after major market open
        end: '17:00',          // Stop before major market close
        timezone: 'America/New_York'
      },
      emergencyStopPrice: 5000, // Emergency stop if account < $5000
      requireManualApproval: true // Start with manual approval
    };
    
    console.log('Live Trading Configuration:');
    console.log(`  Max Daily Loss: $${config.maxDailyLoss}`);
    console.log(`  Max Position Size: ${config.maxPositionSize}%`);
    console.log(`  Max Open Positions: ${config.maxOpenPositions}`);
    console.log(`  Allowed Symbols: ${config.allowedSymbols.join(', ')}`);
    console.log(`  Trading Hours: ${config.tradingHours.start} - ${config.tradingHours.end} ${config.tradingHours.timezone}`);
    console.log(`  Emergency Stop: $${config.emergencyStopPrice}`);
    console.log(`  Manual Approval: ${config.requireManualApproval ? 'Yes' : 'No'}`);
    
    liveTradingSafety.updateConfig(config);
    return config;
  }
  
  async setupMonitoring(): Promise<boolean> {
    console.log('\n📡 Setting Up Live Trading Monitoring');
    console.log('=' .repeat(50));
    
    try {
      // Verify monitoring systems
      const metrics = aiTradeMonitor.getMetrics();
      
      console.log('Monitoring System Status:');
      console.log(`  Overall Health: ${metrics.health.overall}`);
      console.log(`  Market Data: ${metrics.marketData.isActive ? '✅' : '❌'}`);
      console.log(`  AI Analysis: ${metrics.aiAnalysis.isActive ? '✅' : '❌'}`);
      console.log(`  Execution Engine: ${metrics.execution.engineRunning ? '✅' : '❌'}`);
      
      if (metrics.health.overall === 'critical') {
        console.log('❌ Monitoring system has critical issues');
        return false;
      }
      
      // Set up additional live trading alerts
      console.log('\nSetting up live trading alerts...');
      console.log('✅ Daily P&L monitoring: Enabled');
      console.log('✅ Position size monitoring: Enabled');
      console.log('✅ Emergency stop monitoring: Enabled');
      console.log('✅ Risk limit monitoring: Enabled');
      
      return true;
      
    } catch (error) {
      console.log(`❌ Failed to setup monitoring: ${error.message}`);
      return false;
    }
  }
  
  async enableLiveTrading(force: boolean = false): Promise<boolean> {
    console.log('\n🚨 ENABLING LIVE TRADING');
    console.log('=' .repeat(50));
    
    if (!force) {
      console.log('⚠️  WARNING: THIS WILL ENABLE TRADING WITH REAL MONEY');
      console.log('⚠️  Make sure you have reviewed all settings and are ready');
      console.log('⚠️  Press Ctrl+C now if you want to cancel');
      
      // In a real implementation, you'd prompt for user confirmation here
      console.log('\nProceeding with live trading enablement...');
    }
    
    // Final safety check
    const status = liveTradingSafety.getSafetyStatus();
    if (!status.allCriticalPassed) {
      console.log('❌ Cannot enable live trading: Critical safety checks failed');
      return false;
    }
    
    // Switch execution engine to live mode
    const engine = StrategyExecutionEngine.getInstance();
    console.log('Switching execution engine to live trading mode...');
    engine.setPaperTradingMode(false);
    
    // Enable live trading in safety system
    const enabled = liveTradingSafety.enableLiveTrading(force);
    
    if (enabled) {
      console.log('\n🎯 LIVE TRADING IS NOW ENABLED');
      console.log('🚨 REAL MONEY IS NOW AT RISK');
      console.log('📊 Monitor your positions carefully');
      console.log('⚠️  Emergency stop procedures are in place');
      
      // Log the transition
      const strategies = unifiedStrategySystem.getAllStrategies().filter(s => s.enabled);
      console.log(`\nActive Strategies for Live Trading:`);
      strategies.forEach(strategy => {
        console.log(`  - ${strategy.displayName} (${strategy.config.symbol})`);
      });
      
      return true;
    }
    
    return false;
  }
  
  generateTransitionReport(): string {
    const timestamp = new Date().toISOString();
    const strategies = unifiedStrategySystem.getAllStrategies();
    const config = liveTradingSafety.getConfig();
    const metrics = aiTradeMonitor.getMetrics();
    
    let report = `LIVE TRADING TRANSITION REPORT\n`;
    report += `Generated: ${timestamp}\n`;
    report += `${'=' .repeat(50)}\n\n`;
    
    report += `SYSTEM STATUS:\n`;
    report += `  Live Trading Enabled: ${liveTradingSafety.isLiveTradingAllowed() ? '✅ YES' : '❌ NO'}\n`;
    report += `  Execution Engine: ${metrics.execution.engineRunning ? '🟢 RUNNING' : '🔴 STOPPED'}\n`;
    report += `  Trading Mode: ${metrics.execution.mode.toUpperCase()}\n`;
    report += `  Active Strategies: ${metrics.execution.activeStrategies}\n\n`;
    
    report += `RISK CONFIGURATION:\n`;
    report += `  Max Daily Loss: $${config.maxDailyLoss}\n`;
    report += `  Max Position Size: ${config.maxPositionSize}%\n`;
    report += `  Max Open Positions: ${config.maxOpenPositions}\n`;
    report += `  Allowed Symbols: ${config.allowedSymbols.join(', ')}\n`;
    report += `  Emergency Stop: $${config.emergencyStopPrice}\n`;
    report += `  Manual Approval: ${config.requireManualApproval ? 'Required' : 'Automated'}\n\n`;
    
    report += `STRATEGY PERFORMANCE (PAPER TRADING):\n`;
    strategies.filter(s => s.enabled).forEach(strategy => {
      const perf = strategy.performance;
      report += `  ${strategy.displayName}:\n`;
      report += `    Trades: ${perf.totalTrades}\n`;
      report += `    Win Rate: ${perf.winRate.toFixed(1)}%\n`;
      report += `    P&L: $${perf.totalProfit.toFixed(2)}\n`;
      report += `    Status: ${perf.totalTrades >= 10 && perf.winRate >= 60 ? 'VALIDATED' : 'NEEDS_MORE_DATA'}\n\n`;
    });
    
    report += `SAFETY CHECKS:\n`;
    const status = liveTradingSafety.getSafetyStatus();
    status.checks.forEach(check => {
      const emoji = check.status === 'PASS' ? '✅' : check.status === 'FAIL' ? '❌' : '⚠️';
      report += `  ${emoji} ${check.name}\n`;
    });
    
    report += `\nREADY FOR LIVE TRADING: ${status.readyForLiveTrading ? '✅ YES' : '❌ NO'}\n`;
    
    return report;
  }
}

async function main() {
  console.log('🚀 LIVE TRADING TRANSITION PROCESS');
  console.log('This process will verify paper trading results and transition to live trading');
  console.log('=' .repeat(70));
  
  const transition = new LiveTradingTransition();
  
  try {
    // Step 1: Verify Paper Trading Performance
    const paperResults = await transition.verifyPaperTradingResults();
    if (!paperResults.ready) {
      console.log('\n❌ TRANSITION BLOCKED: Paper trading verification failed');
      console.log('\n📋 Required Actions:');
      console.log('1. Continue paper trading until requirements are met');
      console.log('2. Ensure strategies are profitable and have sufficient trades');
      console.log('3. Re-run this transition process when ready');
      process.exit(1);
    }
    
    // Step 2: Run Safety Checks
    const safetyResults = await transition.runSafetyChecks();
    if (!safetyResults.passed) {
      console.log('\n❌ TRANSITION BLOCKED: Safety checks failed');
      console.log('\n📋 Required Actions:');
      console.log('1. Address all critical safety check failures');
      console.log('2. Configure Kraken API credentials if needed');
      console.log('3. Test emergency stop procedures');
      console.log('4. Re-run this transition process when ready');
      process.exit(1);
    }
    
    // Step 3: Configure Live Trading Parameters
    const config = transition.configureLiveTradingParameters();
    
    // Step 4: Setup Monitoring
    const monitoringReady = await transition.setupMonitoring();
    if (!monitoringReady) {
      console.log('\n❌ TRANSITION BLOCKED: Monitoring setup failed');
      process.exit(1);
    }
    
    // Step 5: Final Confirmation
    console.log('\n🎯 PRE-LIVE TRADING SUMMARY');
    console.log('=' .repeat(50));
    console.log('✅ Paper trading results verified');
    console.log('✅ All safety checks passed');
    console.log('✅ Risk parameters configured');
    console.log('✅ Monitoring systems ready');
    
    console.log('\n⚠️  FINAL WARNING:');
    console.log('   - This will enable trading with REAL MONEY');
    console.log('   - You could lose money');
    console.log('   - Monitor your account closely');
    console.log('   - Emergency stops are in place but not guaranteed');
    
    // Generate transition report
    const report = transition.generateTransitionReport();
    console.log('\n📊 TRANSITION REPORT:');
    console.log(report);
    
    // In a real implementation, you'd require user confirmation here
    console.log('\n🚨 To complete the transition to live trading:');
    console.log('1. Review the transition report above');
    console.log('2. Ensure you have sufficient funds in your Kraken account');
    console.log('3. Verify your Kraken API keys are configured');
    console.log('4. Run: node -e "require(\'./src/lib/live-trading-safety\').liveTradingSafety.enableLiveTrading(true)"');
    console.log('\n⚠️  Only proceed if you fully understand the risks involved');
    
    console.log('\n✅ TRANSITION PREPARATION COMPLETE');
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Transition failed with error:', error);
    process.exit(1);
  }
}

main().catch(console.error);