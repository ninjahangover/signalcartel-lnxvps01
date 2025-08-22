#!/usr/bin/env npx tsx -r dotenv/config
/**
 * Quick Test - Smart NTFY Alerts with 5-minute summaries
 * This will immediately send you consolidated trading summaries!
 */

import { smartNtfyAlerts } from './src/lib/smart-ntfy-alerts';

async function main() {
  console.log('🚀 Testing Smart NTFY Alerts System...');
  
  // Add some realistic trading activity
  console.log('📊 Adding sample trading activity...');
  
  smartNtfyAlerts.addTrade('BTCUSD', 'BUY', 67250, 0.0015, 12.50, 'CustomPaperEngine');
  smartNtfyAlerts.addTrade('ETHUSD', 'SELL', 2420, 0.041, -8.20, 'RSI_Strategy');
  smartNtfyAlerts.addTrade('SOLUSD', 'BUY', 145, 0.069, 15.80, 'Neural_Strategy');
  
  smartNtfyAlerts.addSignal('BTCUSD', 'STRONG_BUY', 92, 'Quantum_Oscillator');
  smartNtfyAlerts.addSignal('ETHUSD', 'SELL', 78, 'RSI_Strategy');
  
  smartNtfyAlerts.addOptimization('RSI_Strategy', 'Increased win rate by 4.2% via AI parameter tuning');
  smartNtfyAlerts.addOptimization('Neural_Strategy', 'Reduced false signals by 15%');
  
  smartNtfyAlerts.addSystemEvent('🚀 Custom Trading Engine Active', 
    'Processing trades with 5-minute NTFY summaries enabled');
  
  console.log('✅ Activity added to buffer');
  console.log('📱 Sending immediate summary to NTFY...');
  
  // Send immediate summary instead of waiting 5 minutes
  await smartNtfyAlerts.sendManualSummary();
  
  console.log('🎉 Smart NTFY summary sent!');
  console.log('📊 5-minute automatic summaries are now active');
  
  // Keep the process alive for a few minutes to test the automatic batching
  console.log('⏰ Keeping process alive for 2 minutes to test auto-batching...');
  
  setTimeout(() => {
    console.log('🔄 Adding more activity for next batch...');
    smartNtfyAlerts.addTrade('LINKUSD', 'BUY', 18.50, 2.7, 6.75, 'CustomPaperEngine');
    smartNtfyAlerts.addSystemEvent('📈 Market momentum detected', 'Multiple positive signals across strategies');
  }, 60000); // 1 minute
  
  setTimeout(() => {
    console.log('✅ Test complete - NTFY alerts system is active!');
    process.exit(0);
  }, 120000); // 2 minutes
}

main().catch(console.error);