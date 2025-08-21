#!/usr/bin/env tsx

/**
 * Test Next.js Server
 * 
 * Simple test to verify the Next.js development server is running and accessible
 * Run with: npx tsx test-nextjs-server.ts
 */

console.log('🧪 Testing Next.js Server');
console.log('='.repeat(40));

async function testNextjsServer() {
    const ports = [3001, 3000]; // Check both common ports
    
    for (const port of ports) {
        console.log(`\n🔍 Checking port ${port}...`);
        
        try {
            const response = await fetch(`http://localhost:${port}`, {
                method: 'GET',
                headers: { 'Accept': 'text/html' }
            });
            
            if (response.ok) {
                const text = await response.text();
                
                if (text.includes('Signal Cartel') || text.includes('DOCTYPE') || text.includes('<html')) {
                    console.log(`✅ Next.js server responding on port ${port}`);
                    console.log(`🌐 Dashboard accessible at: http://localhost:${port}`);
                    
                    // Test a few API endpoints
                    console.log(`\n📡 Testing API endpoints on port ${port}...`);
                    
                    const endpoints = [
                        '/api/market-data/status',
                        '/api/engine-status', 
                        '/api/dynamic-triggers?action=status'
                    ];
                    
                    for (const endpoint of endpoints) {
                        try {
                            const apiResponse = await fetch(`http://localhost:${port}${endpoint}`);
                            if (apiResponse.ok) {
                                console.log(`✅ ${endpoint}`);
                            } else {
                                console.log(`⚠️ ${endpoint} (${apiResponse.status})`);
                            }
                        } catch (error) {
                            console.log(`❌ ${endpoint} (error: ${error.message})`);
                        }
                    }
                    
                    return true;
                } else {
                    console.log(`⚠️ Port ${port} responding but doesn't look like Signal Cartel`);
                }
            } else {
                console.log(`❌ Port ${port} responded with status: ${response.status}`);
            }
            
        } catch (error) {
            console.log(`❌ Port ${port} not accessible: ${error.message}`);
        }
    }
    
    return false;
}

async function checkNextjsProcess() {
    console.log(`\n🔍 Checking for Next.js processes...`);
    
    try {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        try {
            const { stdout } = await execAsync('pgrep -f "next dev" | head -5');
            if (stdout.trim()) {
                const pids = stdout.trim().split('\n');
                console.log(`✅ Found Next.js processes: ${pids.join(', ')}`);
                return true;
            } else {
                console.log('❌ No Next.js dev processes found');
                return false;
            }
        } catch (error) {
            console.log('❌ No Next.js dev processes found');
            return false;
        }
        
    } catch (error) {
        console.log('⚠️ Could not check processes:', error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Next.js Server Test Starting...\n');
    
    // Check if Next.js process is running
    const processRunning = await checkNextjsProcess();
    
    // Check if server is accessible
    const serverAccessible = await testNextjsServer();
    
    console.log('\n' + '='.repeat(40));
    console.log('📊 Test Results:');
    console.log('='.repeat(40));
    
    console.log(`Process Running: ${processRunning ? '✅ Yes' : '❌ No'}`);
    console.log(`Server Accessible: ${serverAccessible ? '✅ Yes' : '❌ No'}`);
    
    if (processRunning && serverAccessible) {
        console.log('\n🎉 Next.js server is working correctly!');
        process.exit(0);
    } else if (processRunning && !serverAccessible) {
        console.log('\n⚠️ Next.js process running but server not accessible');
        console.log('💡 Server may still be compiling. Wait 30-60 seconds and try again.');
        process.exit(1);
    } else if (!processRunning && serverAccessible) {
        console.log('\n⚠️ Server accessible but no Next.js process found');
        console.log('💡 May be running under a different process name');
        process.exit(0);
    } else {
        console.log('\n❌ Next.js server not working');
        console.log('💡 Try: ./start-server.sh');
        process.exit(1);
    }
}

main().catch(error => {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
});