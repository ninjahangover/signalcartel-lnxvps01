/**
 * Fast GPU Strategy Test with Simulated Market Data
 */

import { GPURSIStrategy } from './src/lib/gpu-rsi-strategy';

async function testGPUStrategyFast() {
  console.log('🚀 Fast GPU Strategy Test with Simulated Data');
  console.log('==============================================');
  
  const strategy = new GPURSIStrategy('gpu-test-fast', 'BTCUSD', {
    rsiPeriod: 14,
    oversoldLevel: 30,
    overboughtLevel: 70,
    confirmationPeriod: 3,
    useGPU: true
  });
  
  // Generate simulated market data with realistic BTC price movements
  const basePrice = 112679;
  let currentPrice = basePrice;
  let gpuUsageCount = 0;
  let cpuUsageCount = 0;
  let tradingSignals = 0;
  
  console.log('📊 Feeding strategy with 100 simulated data points...\n');
  
  const startTime = Date.now();
  
  for (let i = 0; i < 100; i++) {
    // Simulate realistic price movement
    const volatility = 0.02; // 2% volatility
    const randomChange = (Math.random() - 0.5) * 2 * volatility;
    currentPrice = currentPrice * (1 + randomChange);
    
    const marketData = {
      symbol: 'BTCUSD',
      price: currentPrice,
      timestamp: new Date(Date.now() + i * 60000), // 1 minute intervals
      volume: Math.random() * 1000000,
      bid: currentPrice * 0.9995,
      ask: currentPrice * 1.0005
    };
    
    const signal = strategy.analyzeMarket(marketData);
    
    // Track GPU vs CPU usage
    if (signal.metadata?.gpuAccelerated) {
      gpuUsageCount++;
    } else {
      cpuUsageCount++;
    }
    
    // Log every 10th signal or trading signals
    if (i % 10 === 0 || signal.action !== 'HOLD') {
      console.log(`${i+1}/100 - Price: $${currentPrice.toFixed(2)} | Signal: ${signal.action} (${(signal.confidence * 100).toFixed(1)}%)`);
      console.log(`   Reason: ${signal.reason}`);
      
      if (signal.metadata) {
        const rsi = signal.metadata.rsi?.toFixed(2) || 'N/A';
        const sma20 = signal.metadata.sma20?.toFixed(2) || 'N/A';
        const sma50 = signal.metadata.sma50?.toFixed(2) || 'N/A';
        console.log(`   RSI: ${rsi} | SMA20: $${sma20} | SMA50: $${sma50} | GPU: ${signal.metadata.gpuAccelerated ? 'Yes' : 'No'}`);
      }
      
      if (signal.action !== 'HOLD') {
        tradingSignals++;
        console.log(`🚨 TRADING SIGNAL #${tradingSignals}: ${signal.action} ${signal.quantity} BTC`);
        if (signal.stopLoss) console.log(`   🛑 Stop Loss: $${signal.stopLoss.toFixed(2)}`);
        if (signal.takeProfit) console.log(`   💰 Take Profit: $${signal.takeProfit.toFixed(2)}`);
      }
      console.log('');
    }
  }
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  console.log('🏁 Fast GPU Strategy Test Complete!');
  console.log('===================================');
  console.log(`⏱️  Total Processing Time: ${totalTime}ms`);
  console.log(`📊 Data Points Processed: 100`);
  console.log(`⚡ GPU Calculations: ${gpuUsageCount}`);
  console.log(`🖥️  CPU Calculations: ${cpuUsageCount}`);
  console.log(`🚀 GPU Usage Rate: ${((gpuUsageCount / 100) * 100).toFixed(1)}%`);
  console.log(`📈 Avg Processing Time: ${(totalTime / 100).toFixed(2)}ms per data point`);
  console.log(`🎯 Trading Signals Generated: ${tradingSignals}`);
  
  if (gpuUsageCount > 0) {
    console.log('\n✅ GPU acceleration is working!');
    console.log('💡 Strategy successfully uses GPU for technical indicator calculations');
    console.log(`🔥 Performance: ${(100 / (totalTime / 1000)).toFixed(0)} data points per second`);
  } else {
    console.log('\n⚠️  GPU acceleration not triggered in this test');
    console.log('💡 GPU kicks in after sufficient data accumulation (50+ points)');
  }
}

testGPUStrategyFast().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});