import { startGlobalStratusEngine, getStratusEngineStatus } from '../../src/lib/global-stratus-engine-service.ts';

async function waitForServer() {
    const maxRetries = 30;
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
    console.log('🎯 Stratus Engine initializing...');
    await waitForServer();
    
    await startGlobalStratusEngine();
    console.log('Stratus Engine started');
    
    setInterval(async () => {
        const status = await getStratusEngineStatus();
        const activeComponents = Object.values(status.components).filter(c => c.active).length;
        console.log(`[${new Date().toISOString()}] Stratus: ${activeComponents}/4 components active`);
    }, 300000);
}

main().catch(console.error);