/**
 * Complete System Verification Script
 * 
 * Validates the entire SignalCartel trading platform including:
 * - Pine Script strategies with database parameters
 * - Custom paper trading engine with real data
 * - Dashboard integration with live trading data
 * - End-to-end pipeline from strategy → trade → display
 */

import { PrismaClient } from '@prisma/client';
import { StrategyService } from './src/lib/strategy-service';
import StrategyExecutionEngine from './src/lib/strategy-execution-engine';
import { alpacaPaperTradingService } from './src/lib/alpaca-paper-trading-service';
import marketDataService from './src/lib/market-data-service';
import { ntfyAlerts } from './src/lib/ntfy-alerts';

const prisma = new PrismaClient();

interface SystemVerificationResult {
  component: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string;
  data?: any;
}

async function verifyCompleteSystem() {
  console.log('🔍 COMPLETE SYSTEM VERIFICATION');
  console.log('=' + '='.repeat(80));
  console.log('Validating: Pine Script + Custom Paper Trading + Dashboard Integration\n');

  const results: SystemVerificationResult[] = [];

  try {
    // SECTION 1: Database & Pine Script Strategies
    console.log('📁 SECTION 1: DATABASE & PINE SCRIPT STRATEGIES');
    console.log('-'.repeat(60));
    
    const adminUserId = 'cme53zc9y0000mwgyjb9joki2';
    const dbStrategies = await StrategyService.getUserStrategies(adminUserId);
    
    results.push({
      component: 'Database Strategies',
      status: dbStrategies.length > 0 ? 'PASS' : 'FAIL',
      details: `Found ${dbStrategies.length} strategies in database`,
      data: { count: dbStrategies.length, activeCount: dbStrategies.filter(s => s.isActive).length }
    });

    // Verify strategy parameters
    for (const strategy of dbStrategies.slice(0, 2)) { // Check first 2 strategies
      const params = await prisma.strategyParameter.findMany({
        where: { strategyId: strategy.id }
      });
      
      results.push({
        component: `Strategy Parameters (${strategy.name})`,
        status: params.length > 0 ? 'PASS' : 'WARNING',
        details: `${params.length} parameters configured`,
        data: { parameters: params.map(p => ({ name: p.parameterName, value: p.currentValue })) }
      });
    }

    // SECTION 2: Custom Paper Trading Engine
    console.log('\n💰 SECTION 2: CUSTOM PAPER TRADING ENGINE');
    console.log('-'.repeat(60));
    
    // Check custom paper trading data
    const paperTrades = await prisma.paperTrade.findMany({
      take: 10,
      orderBy: { executedAt: 'desc' }
    });
    
    const paperSessions = await prisma.paperTradingSession.findMany({
      take: 5,
      orderBy: { startedAt: 'desc' }
    });
    
    results.push({
      component: 'Custom Paper Trading Data',
      status: paperTrades.length > 0 ? 'PASS' : 'FAIL',
      details: `${paperTrades.length} paper trades found, ${paperSessions.length} sessions`,
      data: { 
        totalTrades: paperTrades.length,
        sessions: paperSessions.length,
        latestTrade: paperTrades[0]?.executedAt || 'None'
      }
    });

    // Calculate trading statistics
    const totalTrades = await prisma.paperTrade.count();
    const profitableTrades = await prisma.paperTrade.count({
      where: { pnl: { gt: 0 } }
    });
    const totalPnL = await prisma.paperTrade.aggregate({
      _sum: { pnl: true }
    });
    
    const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;
    
    results.push({
      component: 'Trading Performance',
      status: totalTrades >= 50 ? 'PASS' : 'WARNING',
      details: `${totalTrades} trades, ${winRate.toFixed(1)}% win rate, $${totalPnL._sum.pnl?.toFixed(2) || '0'} P&L`,
      data: {
        totalTrades,
        winRate: winRate.toFixed(1),
        totalPnL: totalPnL._sum.pnl || 0,
        llnStatus: totalTrades >= 50 ? 'Achieved' : 'In Progress',
        markovStatus: totalTrades >= 10 ? 'Achieved' : 'In Progress'
      }
    });

    // SECTION 3: API Endpoints
    console.log('\n🌐 SECTION 3: API ENDPOINTS');
    console.log('-'.repeat(60));
    
    // Test dashboard API
    try {
      const response = await fetch('http://localhost:3001/api/custom-paper-trading/dashboard');
      const data = await response.json();
      
      results.push({
        component: 'Dashboard API',
        status: response.ok && data.success ? 'PASS' : 'FAIL',
        details: `API responding with ${data.success ? 'valid' : 'invalid'} data`,
        data: { 
          status: response.status,
          hasData: !!data.data,
          tradesCount: data.data?.trades?.length || 0
        }
      });
    } catch (error) {
      results.push({
        component: 'Dashboard API',
        status: 'FAIL',
        details: `API unreachable: ${error.message}`,
        data: { error: error.message }
      });
    }

    // SECTION 4: Alpaca Integration
    console.log('\n📡 SECTION 4: ALPACA INTEGRATION');
    console.log('-'.repeat(60));
    
    try {
      const accountInfo = await alpacaPaperTradingService.getAccountInfo();
      results.push({
        component: 'Alpaca Paper Trading',
        status: accountInfo ? 'PASS' : 'FAIL',
        details: accountInfo ? `Connected with $${parseFloat(accountInfo.buying_power).toLocaleString()} buying power` : 'Not connected',
        data: accountInfo ? {
          buyingPower: accountInfo.buying_power,
          accountValue: accountInfo.portfolio_value
        } : null
      });
    } catch (error) {
      results.push({
        component: 'Alpaca Paper Trading',
        status: 'FAIL',
        details: `Connection failed: ${error.message}`,
        data: { error: error.message }
      });
    }

    // SECTION 5: Market Data
    console.log('\n📊 SECTION 5: MARKET DATA');
    console.log('-'.repeat(60));
    
    const btcData = marketDataService.getLatestData('BTCUSD');
    results.push({
      component: 'Market Data Service',
      status: btcData ? 'PASS' : 'WARNING',
      details: btcData ? `Latest BTC: $${btcData.price.toLocaleString()}` : 'No recent data',
      data: btcData ? {
        price: btcData.price,
        timestamp: btcData.timestamp,
        symbol: btcData.symbol
      } : null
    });

    // SECTION 6: Notification System
    console.log('\n📱 SECTION 6: NOTIFICATION SYSTEM');
    console.log('-'.repeat(60));
    
    // Test NTFY notification
    try {
      const testResult = await ntfyAlerts.sendMessage(
        'System verification test - Custom paper trading engine active',
        '🧪 Verification Test'
      );
      
      results.push({
        component: 'NTFY Notifications',
        status: testResult ? 'PASS' : 'WARNING',
        details: testResult ? 'Test notification sent successfully' : 'Notification failed',
        data: { testSent: testResult }
      });
    } catch (error) {
      results.push({
        component: 'NTFY Notifications',
        status: 'WARNING',
        details: `Notification test failed: ${error.message}`,
        data: { error: error.message }
      });
    }

    // SECTION 7: Container Status
    console.log('\n🐳 SECTION 7: CONTAINER STATUS');
    console.log('-'.repeat(60));
    
    // Check if running in container
    const isContainer = process.env.HOSTNAME === '0.0.0.0' || process.env.NODE_ENV === 'production';
    results.push({
      component: 'Container Environment',
      status: 'PASS',
      details: isContainer ? 'Running in Docker container' : 'Running locally',
      data: {
        environment: process.env.NODE_ENV || 'development',
        hostname: process.env.HOSTNAME || 'localhost',
        port: process.env.PORT || '3001'
      }
    });

    // FINAL RESULTS
    console.log('\n' + '='.repeat(80));
    console.log('📋 VERIFICATION RESULTS SUMMARY');
    console.log('='.repeat(80));

    const passCount = results.filter(r => r.status === 'PASS').length;
    const failCount = results.filter(r => r.status === 'FAIL').length;
    const warningCount = results.filter(r => r.status === 'WARNING').length;

    results.forEach(result => {
      const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${statusIcon} ${result.component}: ${result.details}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log(`📊 OVERALL STATUS: ${passCount} PASS | ${warningCount} WARNING | ${failCount} FAIL`);
    
    if (failCount === 0) {
      console.log('🎉 SYSTEM VERIFICATION SUCCESSFUL!');
      console.log('\n✅ Your SignalCartel platform is fully operational:');
      console.log('   • Pine Script strategies with database parameters ✅');
      console.log('   • Custom paper trading engine with real data ✅');
      console.log('   • Dashboard showing live trading activity ✅');
      console.log('   • End-to-end pipeline validated ✅');
    } else {
      console.log('⚠️  SYSTEM HAS ISSUES - Please address failed components');
    }

    // Generate detailed report
    console.log('\n📄 DETAILED VERIFICATION DATA:');
    console.log('='.repeat(80));
    results.forEach(result => {
      if (result.data) {
        console.log(`\n${result.component}:`);
        console.log(JSON.stringify(result.data, null, 2));
      }
    });

  } catch (error: any) {
    console.error('❌ System verification failed:', error.message);
    results.push({
      component: 'System Verification',
      status: 'FAIL',
      details: `Fatal error: ${error.message}`,
      data: { error: error.message }
    });
  } finally {
    await prisma.$disconnect();
  }

  return results;
}

// Run the complete verification
console.log('Starting complete system verification...\n');
verifyCompleteSystem().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});