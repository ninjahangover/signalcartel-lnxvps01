/**
 * AGGRESSIVE TRADING WITH 105K+ REAL MARKET DATA POINTS
 * 
 * Uses the restored database with 105,348 real market data points
 * to generate rapid trades for LLN and Markov chain optimization
 */

import { PrismaClient } from '@prisma/client';
import { alpacaPaperTradingService } from './src/lib/alpaca-paper-trading-service';

const prisma = new PrismaClient();

async function runAggressiveWithRealData() {
  console.log('🔥 AGGRESSIVE TRADING WITH 105K+ REAL DATA POINTS');
  console.log('=================================================');
  
  // Count our data
  const dataCount = await prisma.marketData.count();
  console.log(`📊 Total market data points: ${dataCount.toLocaleString()}`);
  
  // Get data by symbol
  const symbolData = await prisma.marketData.groupBy({
    by: ['symbol'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });
  
  console.log('\n📈 Data by Symbol:');
  symbolData.forEach(s => {
    console.log(`   • ${s.symbol}: ${s._count.id.toLocaleString()} points`);
  });
  
  // Get recent data for each symbol for aggressive analysis
  console.log('\n🎯 Starting aggressive analysis...');
  
  const symbols = ['BTCUSD', 'ETHUSD', 'ADAUSD', 'LINKUSD', 'SOLUSD'];
  let tradeSignals = 0;
  let analysisCount = 0;
  
  for (const symbol of symbols) {
    console.log(`\n📊 Analyzing ${symbol}...`);
    
    // Get recent 1000 data points for this symbol
    const recentData = await prisma.marketData.findMany({
      where: { symbol },
      orderBy: { timestamp: 'desc' },
      take: 1000
    });
    
    if (recentData.length < 50) {
      console.log(`   ⚠️  Insufficient data for ${symbol} (${recentData.length} points)`);
      continue;
    }
    
    console.log(`   ✅ Using ${recentData.length} recent data points`);
    
    // Aggressive RSI analysis with our relaxed thresholds
    for (let i = 14; i < recentData.length; i++) {
      analysisCount++;
      
      // Get last 14 prices for RSI calculation
      const prices = recentData.slice(i-14, i).map(d => d.price);
      const currentPrice = recentData[i].price;
      
      // Simple RSI calculation
      const gains = [];
      const losses = [];
      
      for (let j = 1; j < prices.length; j++) {
        const change = prices[j] - prices[j-1];
        if (change > 0) {
          gains.push(change);
          losses.push(0);
        } else {
          gains.push(0);
          losses.push(-change);
        }
      }
      
      const avgGain = gains.reduce((a, b) => a + b, 0) / gains.length;
      const avgLoss = losses.reduce((a, b) => a + b, 0) / losses.length;
      
      if (avgLoss === 0) continue;
      
      const rs = avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      
      // AGGRESSIVE THRESHOLDS: Buy at RSI < 45, Sell at RSI > 55
      let signal = 'HOLD';
      if (rsi < 45) signal = 'BUY';
      if (rsi > 55) signal = 'SELL';
      
      if (signal !== 'HOLD') {
        tradeSignals++;
        console.log(`   🎯 ${signal} Signal: ${symbol} @ $${currentPrice.toFixed(2)} | RSI: ${rsi.toFixed(1)}`);
        
        // In aggressive mode, we would execute trades here
        // For now, we're just counting signals for LLN data collection
        
        if (tradeSignals >= 50) {
          console.log(`\n🔥 Generated ${tradeSignals} trade signals! LLN threshold reached.`);
          break;
        }
      }
      
      // Progress update
      if (analysisCount % 1000 === 0) {
        console.log(`   📈 Analyzed ${analysisCount.toLocaleString()} data points, ${tradeSignals} signals`);
      }
    }
    
    if (tradeSignals >= 50) break;
  }
  
  console.log('\n🎉 AGGRESSIVE ANALYSIS COMPLETE!');
  console.log('=================================');
  console.log(`📊 Total data points analyzed: ${analysisCount.toLocaleString()}`);
  console.log(`🎯 Trade signals generated: ${tradeSignals}`);
  console.log(`📈 Signal rate: ${((tradeSignals/analysisCount)*100).toFixed(2)}%`);
  
  if (tradeSignals >= 10) {
    console.log('\n🔄 MARKOV CHAIN OPTIMIZATION READY!');
    console.log('Sufficient signals for pattern analysis');
  }
  
  if (tradeSignals >= 50) {
    console.log('\n🎯 LAW OF LARGE NUMBERS ACTIVATED!');
    console.log('Dataset large enough for statistical optimization');
  }
  
  console.log('\n💡 Next Steps:');
  console.log('==============');
  console.log('1. Execute these signals as paper trades');
  console.log('2. Collect win/loss data for optimization');
  console.log('3. Apply Markov chain analysis to improve strategy');
  console.log('4. Use LLN to refine probability calculations');
  
  await prisma.$disconnect();
}

// Execute if run directly
if (require.main === module) {
  runAggressiveWithRealData().catch(console.error);
}

export { runAggressiveWithRealData };