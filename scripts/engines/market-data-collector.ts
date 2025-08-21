import { marketDataCollector } from '../../src/lib/market-data-collector.ts';

async function waitForServer() {
    const maxRetries = 15;
    let retries = 0;
    
    while (retries < maxRetries) {
        try {
            const response = await fetch('http://localhost:3001/api/market-data/status');
            if (response.ok) {
                console.log('✅ Next.js server is ready');
                return true;
            }
        } catch (error) {
            // Server not ready yet
        }
        
        console.log(`⏳ Waiting for Next.js server... (${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        retries++;
    }
    
    console.log('⚠️ Timeout waiting for Next.js server, starting anyway...');
    return false;
}

async function main() {
    console.log('📊 Market Data Collector initializing...');
    await waitForServer();
    
    console.log('Starting market data collection...');
    await marketDataCollector.startCollection();
    
    setInterval(() => {
        if (marketDataCollector.isCollectionActive()) {
            console.log(`[${new Date().toISOString()}] Market data collection active`);
        }
    }, 300000);
}

main().catch(console.error);