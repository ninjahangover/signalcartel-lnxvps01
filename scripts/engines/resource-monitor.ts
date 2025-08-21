import { startResourceMonitoring } from '../../src/lib/resource-monitor.ts';

async function main() {
    console.log('🔍 Resource Monitor starting...');
    startResourceMonitoring();
    console.log('✅ Resource Monitor active - monitoring every 30s');
    
    // Keep process alive
    process.on('SIGTERM', () => {
        console.log('🔍 Stopping resource monitor...');
        process.exit(0);
    });
    
    setInterval(() => {
        console.log('🔍 Resource Monitor: Active');
    }, 300000); // Status every 5 minutes
}

main().catch(console.error);