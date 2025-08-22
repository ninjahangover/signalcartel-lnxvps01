/**
 * Test GPU-Accelerated RSI Strategy with Real Market Data
 */

import { GPURSIStrategy } from './src/lib/gpu-rsi-strategy';
import marketDataService from './src/lib/market-data-service';

async function testGPUStrategy() {
  console.log('🚀 Testing GPU-Accelerated RSI Strategy');
  console.log('==========================================');
  
  // Initialize GPU RSI strategy
  const strategy = new GPURSIStrategy('gpu-test-1', 'BTCUSD', {
    rsiPeriod: 14,
    oversoldLevel: 30,
    overboughtLevel: 70,
    confirmationPeriod: 3,
    useGPU: true
  });
  
  console.log('📊 Strategy initialized with GPU acceleration');
  
  // Get real market data
  console.log('📈 Fetching real-time market data...');
  
  let signalCount = 0;
  let gpuCalculations = 0;
  let cpuCalculations = 0;
  
  const startTime = Date.now();
  
  // Subscribe to market data and test strategy
  const unsubscribe = marketDataService.subscribe('BTCUSD', (marketData) => {
    try {
      const timestamp = marketData.timestamp instanceof Date ? marketData.timestamp.toISOString() : new Date(marketData.timestamp).toISOString();
      console.log(`\n💰 Market Data: ${marketData.symbol} = $${marketData.price.toFixed(2)} at ${timestamp}`);
      
      const signal = strategy.analyzeMarket(marketData);
      
      // Track GPU vs CPU usage
      if (signal.metadata?.gpuAccelerated) {
        gpuCalculations++;
      } else {
        cpuCalculations++;
      }
      
      console.log(`🎯 Signal: ${signal.action} (confidence: ${(signal.confidence * 100).toFixed(1)}%)`);
      console.log(`💡 Reason: ${signal.reason}`);
      
      if (signal.metadata) {
        console.log(`📊 RSI: ${signal.metadata.rsi?.toFixed(2) || 'N/A'}`);
        console.log(`📈 SMA20: ${signal.metadata.sma20?.toFixed(2) || 'N/A'}`);
        console.log(`📊 SMA50: ${signal.metadata.sma50?.toFixed(2) || 'N/A'}`);
        console.log(`⚡ GPU Accelerated: ${signal.metadata.gpuAccelerated ? 'Yes' : 'No'}`);
      }
      
      if (signal.action !== 'HOLD') {
        signalCount++;
        console.log(`🚨 TRADING SIGNAL #${signalCount}: ${signal.action} ${signal.quantity} BTC at $${signal.price.toFixed(2)}`);
        if (signal.stopLoss) console.log(`   🛑 Stop Loss: $${signal.stopLoss.toFixed(2)}`);
        if (signal.takeProfit) console.log(`   💰 Take Profit: $${signal.takeProfit.toFixed(2)}`);
      }
      
      signalCount++;
      
      // Test for 100 data points then stop
      if (signalCount >= 100) {
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        
        console.log('\n🏁 GPU Strategy Test Complete!');
        console.log('================================');
        console.log(`⏱️  Total Time: ${totalTime}ms`);
        console.log(`📊 Total Signals: ${signalCount}`);
        console.log(`⚡ GPU Calculations: ${gpuCalculations}`);
        console.log(`🖥️  CPU Calculations: ${cpuCalculations}`);
        console.log(`🚀 GPU Usage: ${((gpuCalculations / signalCount) * 100).toFixed(1)}%`);
        console.log(`📈 Avg Time per Signal: ${(totalTime / signalCount).toFixed(2)}ms`);
        
        if (gpuCalculations > 0) {
          console.log('\n✅ GPU acceleration working successfully!');
          console.log('💡 Strategy is using GPU for indicator calculations');
        } else {
          console.log('\n⚠️  GPU acceleration not used');
          console.log('💡 Check CUDA installation or increase data volume');
        }
        
        unsubscribe();
        process.exit(0);
      }
      
    } catch (error) {
      console.error('❌ Error testing GPU strategy:', error);
      unsubscribe();
      process.exit(1);
    }
  });
  
  console.log('🔄 Listening for market data... (will test 100 signals)');
  console.log('   Use Ctrl+C to stop early\n');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Test interrupted by user');
  process.exit(0);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

// Run the test
testGPUStrategy().catch(error => {
  console.error('❌ Failed to test GPU strategy:', error);
  process.exit(1);
});