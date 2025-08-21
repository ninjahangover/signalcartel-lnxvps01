#!/usr/bin/env tsx

/**
 * Test Stratus Engine Startup
 * 
 * Test the Stratus Engine startup to verify it doesn't timeout
 * Run with: npx tsx test-stratus-engine-startup.ts
 */

console.log('🧪 Testing Stratus Engine Startup');
console.log('='.repeat(50));

async function testStratusEngineStartup() {
    const startTime = Date.now();
    
    try {
        console.log('🚀 Starting Stratus Engine test...');
        
        // Import and test the global stratus engine
        const { startGlobalStratusEngine, getStratusEngineStatus } = await import('./src/lib/global-stratus-engine-service');
        
        console.log('📦 Global stratus engine service imported successfully');
        
        // Test startup with timeout
        console.log('⏰ Testing startup with 15 second timeout...');
        
        const startupPromise = startGlobalStratusEngine();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Startup timeout after 15 seconds')), 15000)
        );
        
        await Promise.race([startupPromise, timeoutPromise]);
        
        const startupTime = Date.now() - startTime;
        console.log(`✅ Stratus Engine started successfully in ${startupTime}ms`);
        
        // Check status
        console.log('📊 Checking engine status...');
        const status = await getStratusEngineStatus();
        
        console.log('📋 Engine Status:', {
            isRunning: status.isRunning,
            startedAt: status.startedAt,
            marketDataActive: status.components.marketData.active,
            marketDataSymbols: status.components.marketData.symbolCount,
            inputOptimizerActive: status.components.inputOptimizer.active,
            marketMonitorActive: status.components.marketMonitor.active,
            alpacaIntegrationActive: status.components.alpacaIntegration.active
        });
        
        return true;
        
    } catch (error) {
        const elapsedTime = Date.now() - startTime;
        console.log(`❌ Stratus Engine startup failed after ${elapsedTime}ms:`, error.message);
        
        if (error.message.includes('timeout')) {
            console.log('💡 This confirms the timeout issue exists');
        }
        
        return false;
    }
}

async function main() {
    console.log('🔧 Testing Stratus Engine Startup Performance...\n');
    
    const success = await testStratusEngineStartup();
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Results:');
    console.log('='.repeat(50));
    
    if (success) {
        console.log('✅ Stratus Engine startup test PASSED');
        console.log('🎉 No timeout issues detected');
        process.exit(0);
    } else {
        console.log('❌ Stratus Engine startup test FAILED');
        console.log('🔧 Timeout issue needs further investigation');
        process.exit(1);
    }
}

main().catch(error => {
    console.error('\n💥 Test script failed:', error.message);
    process.exit(1);
});