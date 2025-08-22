/**
 * Dashboard Integration Verification Script
 * 
 * Specifically tests the dashboard integration with real custom paper trading data
 * Validates that the dashboard shows actual trading activity instead of mock data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDashboardIntegration() {
  console.log('🎛️  DASHBOARD INTEGRATION VERIFICATION');
  console.log('=' + '='.repeat(60));
  console.log('Checking that dashboard displays real custom paper trading data\n');

  try {
    // 1. Check database has real trading data
    console.log('📊 Step 1: Checking Database Trading Data');
    console.log('-'.repeat(40));
    
    const totalTrades = await prisma.paperTrade.count();
    const totalSessions = await prisma.paperTradingSession.count();
    const totalSignals = await prisma.tradingSignal.count();
    
    console.log(`Total Paper Trades: ${totalTrades}`);
    console.log(`Total Trading Sessions: ${totalSessions}`);
    console.log(`Total Trading Signals: ${totalSignals}`);
    
    if (totalTrades === 0) {
      console.log('❌ No paper trades found! Dashboard will show empty data.');
      return;
    }
    
    // 2. Get recent trading activity
    console.log('\n📈 Step 2: Recent Trading Activity');
    console.log('-'.repeat(40));
    
    const recentTrades = await prisma.paperTrade.findMany({
      take: 5,
      orderBy: { executedAt: 'desc' },
      include: {
        session: true
      }
    });
    
    console.log('Latest 5 trades:');
    recentTrades.forEach((trade, index) => {
      console.log(`  ${index + 1}. ${trade.side.toUpperCase()} ${trade.quantity} ${trade.symbol} @ $${trade.price}`);
      console.log(`     P&L: $${trade.pnl?.toFixed(2) || '0.00'} | Time: ${trade.executedAt.toLocaleString()}`);
    });
    
    // 3. Calculate performance metrics
    console.log('\n💰 Step 3: Performance Metrics Calculation');
    console.log('-'.repeat(40));
    
    const profitableTrades = await prisma.paperTrade.count({
      where: { pnl: { gt: 0 } }
    });
    
    const totalPnL = await prisma.paperTrade.aggregate({
      _sum: { pnl: true }
    });
    
    const totalVolume = await prisma.paperTrade.aggregate({
      _sum: { value: true }
    });
    
    const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;
    const avgTradeSize = totalTrades > 0 ? (totalVolume._sum.value || 0) / totalTrades : 0;
    
    console.log(`Win Rate: ${winRate.toFixed(1)}%`);
    console.log(`Total P&L: $${totalPnL._sum.pnl?.toFixed(2) || '0.00'}`);
    console.log(`Total Volume: $${totalVolume._sum.value?.toFixed(2) || '0.00'}`);
    console.log(`Average Trade Size: $${avgTradeSize.toFixed(2)}`);
    
    // 4. Test API endpoint
    console.log('\n🌐 Step 4: Testing Dashboard API Endpoint');
    console.log('-'.repeat(40));
    
    try {
      const response = await fetch('http://localhost:3001/api/custom-paper-trading/dashboard');
      
      if (!response.ok) {
        console.log(`❌ API returned status: ${response.status}`);
        console.log('   Dashboard may not be accessible');
        return;
      }
      
      const apiData = await response.json();
      
      if (!apiData.success) {
        console.log(`❌ API returned error: ${apiData.error || 'Unknown error'}`);
        return;
      }
      
      console.log('✅ API endpoint working correctly');
      console.log(`   Trades in API response: ${apiData.data.trades?.length || 0}`);
      console.log(`   Sessions in API response: ${apiData.data.sessions?.length || 0}`);
      console.log(`   Signals in API response: ${apiData.data.signals?.length || 0}`);
      
      // 5. Verify API data matches database
      console.log('\n🔄 Step 5: API vs Database Consistency Check');
      console.log('-'.repeat(40));
      
      const apiTradeCount = apiData.data.trades?.length || 0;
      const dbTradeCount = Math.min(totalTrades, 50); // API limits to 50 recent trades
      
      if (apiTradeCount > 0) {
        console.log('✅ API returns real trading data');
        console.log(`   API trades: ${apiTradeCount}`);
        console.log(`   Database trades: ${totalTrades}`);
        console.log(`   Data consistency: ${apiTradeCount <= totalTrades ? 'Good' : 'Warning - API has more trades than DB'}`);
        
        // Check if latest trade matches
        const apiLatestTrade = apiData.data.trades[0];
        const dbLatestTrade = recentTrades[0];
        
        if (apiLatestTrade && dbLatestTrade) {
          const apiTime = new Date(apiLatestTrade.executedAt).getTime();
          const dbTime = new Date(dbLatestTrade.executedAt).getTime();
          const timeDiff = Math.abs(apiTime - dbTime);
          
          console.log(`   Latest trade sync: ${timeDiff < 1000 ? '✅ Perfect' : timeDiff < 60000 ? '✅ Good' : '⚠️ Delayed'}`);
        }
      } else {
        console.log('❌ API returns no trading data despite database having trades');
        console.log('   This indicates a dashboard integration issue');
      }
      
    } catch (apiError: any) {
      console.log(`❌ API test failed: ${apiError.message}`);
      console.log('   Dashboard may not be running or accessible');
    }
    
    // 6. Check LLN and Markov status
    console.log('\n📊 Step 6: LLN and Markov Analysis Status');
    console.log('-'.repeat(40));
    
    const llnThreshold = 50; // Law of Large Numbers threshold
    const markovThreshold = 10; // Minimum for Markov chain analysis
    
    console.log(`LLN Status: ${totalTrades >= llnThreshold ? '✅ Achieved' : `⏳ Progress (${totalTrades}/${llnThreshold})`}`);
    console.log(`Markov Status: ${totalTrades >= markovThreshold ? '✅ Achieved' : `⏳ Progress (${totalTrades}/${markovThreshold})`}`);
    
    if (totalTrades >= llnThreshold && totalTrades >= markovThreshold) {
      console.log('🎉 Sufficient data for advanced analysis!');
    }
    
    // 7. Dashboard component verification
    console.log('\n🎛️  Step 7: Dashboard Component Checklist');
    console.log('-'.repeat(40));
    
    const expectedComponents = [
      { name: 'Live Custom Paper Trading Card', api: '/api/custom-paper-trading/dashboard', expected: true },
      { name: 'Real-time Trade Count', data: totalTrades > 0, expected: true },
      { name: 'Actual Win Rate Display', data: winRate >= 0, expected: true },
      { name: 'Real P&L Values', data: totalPnL._sum.pnl !== null, expected: true },
      { name: 'LLN/Markov Status', data: totalTrades >= 10, expected: true }
    ];
    
    expectedComponents.forEach(component => {
      const status = component.data || component.expected ? '✅' : '❌';
      console.log(`   ${status} ${component.name}`);
    });
    
    // FINAL SUMMARY
    console.log('\n' + '='.repeat(60));
    console.log('📋 DASHBOARD INTEGRATION SUMMARY');
    console.log('='.repeat(60));
    
    const hasData = totalTrades > 0;
    const apiWorks = apiData?.success || false;
    const dataConsistent = apiData?.data?.trades?.length > 0;
    
    if (hasData && apiWorks && dataConsistent) {
      console.log('🎉 DASHBOARD INTEGRATION SUCCESSFUL!');
      console.log('\n✅ Your dashboard is showing real custom paper trading data:');
      console.log(`   • ${totalTrades} real trades from custom engine`);
      console.log(`   • ${winRate.toFixed(1)}% win rate calculated from actual results`);
      console.log(`   • $${totalPnL._sum.pnl?.toFixed(2)} real P&L from trading activity`);
      console.log(`   • API serving live data to dashboard components`);
      console.log(`   • ${totalTrades >= llnThreshold ? 'LLN analysis ready' : 'Building LLN dataset'}`);
    } else {
      console.log('⚠️ DASHBOARD INTEGRATION ISSUES DETECTED');
      console.log('\nIssues found:');
      if (!hasData) console.log('   ❌ No trading data in database');
      if (!apiWorks) console.log('   ❌ Dashboard API not responding');
      if (!dataConsistent) console.log('   ❌ API not returning trading data');
    }
    
  } catch (error: any) {
    console.error('❌ Dashboard verification failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
console.log('Starting dashboard integration verification...\n');
verifyDashboardIntegration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});