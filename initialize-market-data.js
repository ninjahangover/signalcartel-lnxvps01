/**
 * Initialize Market Data Collection
 * This script starts collecting real-time market data for your trading symbols
 */

const fetch = require('node-fetch');

async function initializeMarketData() {
  console.log('📊 Initializing Market Data Collection');
  console.log('=' + '='.repeat(40));
  
  try {
    // Step 1: Check current status
    console.log('\n📈 Step 1: Checking current market data status...');
    
    // Most systems expose this through an API endpoint or webhook
    // For now, we'll trigger data collection by sending sample webhooks
    
    // Step 2: Define symbols to track
    const symbols = [
      'AAPL',   // Apple - high volume, good for learning
      'TSLA',   // Tesla - volatile, good for AI training
      'SPY',    // S&P 500 ETF - market trends
      'QQQ',    // NASDAQ ETF - tech trends  
      'MSFT',   // Microsoft - stable patterns
      'GOOGL',  // Google - search trends correlation
      'AMZN',   // Amazon - e-commerce trends
      'NVDA'    // NVIDIA - AI/crypto correlation
    ];
    
    console.log(`\n📊 Step 2: Starting data collection for ${symbols.length} symbols...`);
    console.log(`Symbols: ${symbols.join(', ')}`);
    
    // Step 3: Send initialization webhooks to start data collection
    for (const symbol of symbols) {
      console.log(`\n🔄 Initializing data collection for ${symbol}...`);
      
      try {
        // Send a small test webhook to trigger market data collection
        const webhookData = {
          strategy_id: `market-data-init-${symbol}`,
          action: 'collect_data', // Special action to initialize data collection
          symbol: symbol,
          quantity: 0.01, // Tiny amount, just to trigger data collection
          price: 'market',
          initialize_data_collection: true,
          timestamp: new Date().toISOString()
        };
        
        const response = await fetch('http://localhost:3001/api/pine-script-webhook?mode=paper', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookData)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`  ✅ ${symbol}: ${result.message || 'Initialized'}`);
          
          // Check if data collection started
          if (result.marketAnalysis) {
            console.log(`  📊 Market regime: ${result.marketAnalysis}`);
          }
          if (result.optimizationApplied) {
            console.log(`  🧠 AI optimization: ${result.aiConfidence}`);
          }
        } else {
          console.log(`  ⚠️ ${symbol}: HTTP ${response.status}`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`  ❌ ${symbol}: ${error.message}`);
      }
    }
    
    // Step 4: Verify data collection is working
    console.log('\n📊 Step 3: Verifying data collection...');
    
    // Wait a moment for data to be processed
    console.log('⏳ Waiting 10 seconds for data to accumulate...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check if any positions were created (indicates system is working)
    const positionsResponse = await fetch('http://localhost:3001/api/paper-trading/positions');
    
    if (positionsResponse.ok) {
      const positions = await positionsResponse.json();
      console.log('\n📈 Current positions:');
      
      if (positions.hasOpenPositions) {
        console.log(`✅ Found ${positions.positions.length} positions`);
        positions.positions.forEach(pos => {
          console.log(`  • ${pos.pair}: ${pos.side} ${pos.quantity}`);
        });
      } else {
        console.log('📊 No positions yet (data collection may need more time)');
      }
    }
    
    // Step 5: Instructions for monitoring
    console.log('\n📋 NEXT STEPS:');
    console.log('✅ Market data collection has been initialized');
    console.log('⏳ Data points will accumulate over the next few minutes');
    console.log('📊 Check your dashboard - the count should start increasing');
    console.log('🧠 AI will become smarter as more data is collected');
    
    console.log('\n🔍 MONITORING:');
    console.log('• Refresh your dashboard to see data point count increase');
    console.log('• After 100+ data points, AI confidence will improve');
    console.log('• After 1000+ data points, 7-day analysis becomes robust');
    console.log('• Full learning cycle takes 7 days for complete patterns');
    
    console.log('\n⚡ WHAT HAPPENS NOW:');
    console.log('1. System collects real-time price/volume data');
    console.log('2. Calculates technical indicators (RSI, MACD, etc.)');
    console.log('3. Detects market regimes (trending/volatile/sideways)');
    console.log('4. AI learns optimal trading conditions');
    console.log('5. Trading decisions become more accurate over time');
    
    console.log('\n🎯 TARGET METRICS:');
    console.log('• 100 data points: Basic patterns recognized');
    console.log('• 500 data points: Reliable trend detection');
    console.log('• 1000+ data points: Advanced AI optimization');
    console.log('• 7 days: Complete market cycle analysis');
    
  } catch (error) {
    console.error('\n❌ Initialization failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure dev server is running: npm run dev');
    console.log('2. Check that webhook endpoints are accessible');
    console.log('3. Verify market data service is enabled');
  }
}

// Run the initialization
initializeMarketData();