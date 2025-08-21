#!/usr/bin/env tsx

/**
 * Test Market Data Collection
 * 
 * Simple test to verify market data collection can start without issues
 * Run with: npx tsx test-market-data-collection.ts
 */

console.log('🧪 Testing Market Data Collection');
console.log('='.repeat(50));

async function testMarketDataCollection() {
    try {
        console.log('📦 Importing market data collector...');
        const { marketDataCollector } = await import('./src/lib/market-data-collector.ts');
        console.log('✅ Market data collector imported successfully');
        
        console.log('🔍 Checking if already running...');
        const isActive = marketDataCollector.isCollectionActive();
        console.log(`Current status: ${isActive ? 'ACTIVE' : 'INACTIVE'}`);
        
        if (isActive) {
            console.log('✅ Market data collection is already running');
            
            // Get collection status
            try {
                const status = await marketDataCollector.getCollectionStatus();
                console.log(`📊 Collection status: ${status.length} symbols being monitored`);
                
                status.forEach(s => {
                    console.log(`   ${s.symbol}: ${s.status} (${s.dataPoints} data points)`);
                });
            } catch (error) {
                console.log('⚠️ Could not get detailed status:', error.message);
            }
            
        } else {
            console.log('🚀 Starting market data collection...');
            
            // Add a timeout to prevent hanging
            const timeout = setTimeout(() => {
                console.log('⏰ Market data collection startup timed out');
                process.exit(1);
            }, 30000); // 30 second timeout
            
            try {
                await marketDataCollector.startCollection();
                clearTimeout(timeout);
                console.log('✅ Market data collection started successfully');
                
                // Wait a moment and check status
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                const nowActive = marketDataCollector.isCollectionActive();
                console.log(`Final status: ${nowActive ? 'ACTIVE ✅' : 'INACTIVE ❌'}`);
                
                if (nowActive) {
                    const status = await marketDataCollector.getCollectionStatus();
                    console.log(`📊 Now monitoring ${status.length} symbols`);
                }
                
            } catch (error) {
                clearTimeout(timeout);
                console.error('❌ Failed to start market data collection:');
                console.error('Error message:', error.message);
                console.error('Error stack:', error.stack);
                
                // Try to provide helpful debugging info
                if (error.message.includes('database')) {
                    console.log('💡 Database issue detected. Try:');
                    console.log('   npx prisma generate');
                    console.log('   npx prisma migrate dev');
                }
                
                if (error.message.includes('network') || error.message.includes('fetch')) {
                    console.log('💡 Network issue detected. Check internet connection.');
                }
                
                process.exit(1);
            }
        }
        
    } catch (error) {
        console.error('💥 Import or initialization failed:');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        if (error.message.includes('Cannot find module')) {
            console.log('💡 Module not found. Try: npm install');
        }
        
        process.exit(1);
    }
}

async function main() {
    try {
        await testMarketDataCollection();
        console.log('\n🎉 Market data collection test completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('\n💥 Test failed:', error);
        process.exit(1);
    }
}

// Handle process termination gracefully
process.on('SIGTERM', () => {
    console.log('🛑 Test interrupted');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Test interrupted by user');
    process.exit(0);
});

main().catch(console.error);