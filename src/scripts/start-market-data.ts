import { marketDataCollector } from '../lib/market-data-collector';

async function start() {
  console.log('🚀 Starting market data collection...');
  
  try {
    await marketDataCollector.startCollection();
    console.log('✅ Market data collection started successfully');
    
    // Status check every 5 minutes
    setInterval(() => {
      if (marketDataCollector.isCollectionActive()) {
        console.log(`[${new Date().toISOString()}] 📊 Market data collection is active`);
      } else {
        console.log(`[${new Date().toISOString()}] ⚠️ Market data collection is inactive`);
      }
    }, 300000);
    
  } catch (error) {
    console.error('❌ Failed to start market data collection:', error);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('📊 Stopping market data collection...');
  marketDataCollector.stopCollection();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📊 Stopping market data collection...');
  marketDataCollector.stopCollection();
  process.exit(0);
});

start();