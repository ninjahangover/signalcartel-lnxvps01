/**
 * QUANTUM FORGE™ Complete System Launcher
 * 
 * Launches and monitors all components of the QUANTUM FORGE™ trading system:
 * - Custom Paper Trading Engine
 * - Strategy Engine
 * - Workflow Monitor with Telegram alerts
 * - Database monitoring
 * - Auto-recovery systems
 */

import { startQuantumForgeWorkflowMonitoring } from './src/lib/quantum-forge-workflow-monitor';
import { telegramAlerts } from './src/lib/telegram-alert-service';

async function main() {
  console.log('🚀 QUANTUM FORGE™ COMPLETE SYSTEM LAUNCHER');
  console.log('==========================================');
  
  try {
    // Start workflow monitoring first
    console.log('🔍 Starting workflow monitoring...');
    await startQuantumForgeWorkflowMonitoring();
    
    // Send system startup alert
    await telegramAlerts.sendAlert(
      '🚀 <b>QUANTUM FORGE™ System Started</b>\n' +
      'Complete trading system active:\n' +
      '• Paper Trading Engine\n' +
      '• Strategy Engine\n' +
      '• Workflow Monitor\n' +
      '• Database Monitor\n' +
      '• Auto-Recovery System\n\n' +
      'All components monitored via Telegram',
      'medium'
    );
    
    console.log('✅ QUANTUM FORGE™ system fully operational');
    console.log('📱 Telegram alerts active');
    console.log('🔍 Workflow monitoring active');
    console.log('');
    console.log('System will run continuously and monitor all components...');
    
    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down QUANTUM FORGE™ system...');
      await telegramAlerts.sendAlert(
        '🛑 <b>QUANTUM FORGE™ System Shutdown</b>\n' +
        'System shutting down gracefully\n' +
        'All monitoring stopped',
        'medium'
      );
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start QUANTUM FORGE™ system:', error);
    await telegramAlerts.sendAlert(
      '❌ <b>QUANTUM FORGE™ Startup Failed</b>\n' +
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}\n` +
      'Manual intervention required',
      'critical'
    );
    process.exit(1);
  }
}

main().catch(console.error);