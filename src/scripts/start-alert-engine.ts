import AlertGenerationEngine from '../lib/alert-generation-engine';

async function start() {
  console.log('🚨 Starting Alert Generation Engine...');
  
  try {
    const alertEngine = AlertGenerationEngine.getInstance();
    alertEngine.startEngine();
    console.log('✅ Alert generation engine started');
    
    // Status check every 5 minutes
    setInterval(() => {
      const stats = alertEngine.getAlertStats();
      const status = alertEngine.isEngineRunning() ? 'RUNNING' : 'STOPPED';
      console.log(`[${new Date().toISOString()}] 🚨 Alert Engine: ${status} | Total Alerts: ${stats.totalAlerts}`);
    }, 300000);
    
  } catch (error) {
    console.error('❌ Failed to start alert engine:', error);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('🚨 Stopping alert engine...');
  const alertEngine = AlertGenerationEngine.getInstance();
  alertEngine.stopEngine();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🚨 Stopping alert engine...');
  const alertEngine = AlertGenerationEngine.getInstance();
  alertEngine.stopEngine();
  process.exit(0);
});

start();