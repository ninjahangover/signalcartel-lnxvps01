import AlertGenerationEngine from '../../src/lib/alert-generation-engine.ts';

async function main() {
    const alertEngine = AlertGenerationEngine.getInstance();
    alertEngine.startEngine();
    console.log('Alert generation engine started');
    
    setInterval(() => {
        const stats = alertEngine.getAlertStats();
        console.log(`[${new Date().toISOString()}] Alerts: ${stats.totalAlerts}`);
    }, 300000);
}

main().catch(console.error);