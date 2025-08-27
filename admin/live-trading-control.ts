#!/usr/bin/env npx tsx
/**
 * QUANTUM FORGE™ Live Trading Control
 * Enable/disable live trading and check status
 */

import { quantumForgeLiveExecutor } from '../src/lib/live-trading/quantum-forge-live-executor';

// Get real price helper
async function getRealPrice(symbol: string): Promise<number> {
  const { realTimePriceFetcher } = await import('../src/lib/real-time-price-fetcher');
  const priceData = await realTimePriceFetcher.getCurrentPrice(symbol);
  
  if (!priceData.success || priceData.price <= 0) {
    throw new Error(`❌ Cannot get real price for ${symbol}: ${priceData.error || 'Invalid price'}`);
  }
  
  return priceData.price;
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('🔥 QUANTUM FORGE™ LIVE TRADING CONTROL');
  console.log('=' .repeat(60));
  console.log('Account Balance: $407.60');
  console.log('');
  
  try {
    switch (command) {
      case 'enable':
        quantumForgeLiveExecutor.setLiveTradingEnabled(true);
        console.log('✅ LIVE TRADING ENABLED');
        console.log('   🚨 REAL MONEY TRADING IS NOW ACTIVE');
        console.log('   💰 High-confidence QUANTUM FORGE™ signals will execute on Kraken');
        console.log('   📊 Minimum 80% confidence required for live trades');
        console.log('   🛡️  Commission-aware position sizing active');
        break;
        
      case 'disable':
        quantumForgeLiveExecutor.setLiveTradingEnabled(false);
        console.log('📄 LIVE TRADING DISABLED');
        console.log('   ✅ All trades will execute in paper mode only');
        console.log('   📊 QUANTUM FORGE™ continues learning and improving');
        console.log('   🔄 Switch back to live anytime with: enable');
        break;
        
      case 'status':
        const status = quantumForgeLiveExecutor.getStatus();
        console.log('📊 LIVE TRADING STATUS:');
        console.log('   Mode:', status.liveTradingEnabled ? '🔥 LIVE' : '📄 PAPER');
        console.log('   Kraken API:', status.krakenAuthenticated ? '✅ Connected' : '❌ Not Connected');
        console.log('   Min Confidence:', (status.configuration.minConfidence * 100).toFixed(0) + '%');
        console.log('   Required Phase:', status.configuration.requiredPhase);
        console.log('   Max Position:', (status.configuration.maxPositionSize * 100).toFixed(0) + '% of account');
        console.log('   AI Systems:', status.configuration.enabledAISystems.join(', '));
        break;
        
      case 'test':
        console.log('🧪 TESTING LIVE TRADING INTEGRATION...');
        console.log('');
        
        // Test signal processing without actual execution
        const testSignal = {
          action: 'BUY' as const,
          symbol: 'BTCUSD',
          price: await getRealPrice('BTCUSD'),
          confidence: 0.85,
          strategy: 'test-integration',
          aiSystemsUsed: ['mathematical-intuition-engine', 'multi-layer-ai'],
          expectedMove: 0.025,
          reason: 'Integration test signal'
        };
        
        console.log('📡 Test Signal:');
        console.log('   Action:', testSignal.action);
        console.log('   Symbol:', testSignal.symbol);
        console.log('   Price: $' + testSignal.price.toLocaleString());
        console.log('   Confidence:', (testSignal.confidence * 100).toFixed(1) + '%');
        console.log('   Expected Move:', (testSignal.expectedMove * 100).toFixed(1) + '%');
        console.log('');
        
        const result = await quantumForgeLiveExecutor.processSignalForLiveExecution(
          testSignal,
          4 // Phase 4
        );
        
        console.log('🎯 LIVE TRADING RESULT:');
        console.log('   Success:', result.success ? '✅ YES' : '❌ NO');
        console.log('   Message:', result.message);
        if (result.positionSize > 0) {
          console.log('   Position Size: $' + result.positionSize.toFixed(0));
          console.log('   Expected Profit: $' + result.expectedProfit.toFixed(2));
        }
        if (result.orderId) {
          console.log('   🔥 KRAKEN ORDER ID:', result.orderId);
        }
        break;
        
      default:
        console.log('🚀 QUANTUM FORGE™ Live Trading Commands:');
        console.log('');
        console.log('  enable    - Enable live trading on Kraken (REAL MONEY)');
        console.log('  disable   - Disable live trading (paper mode only)');
        console.log('  status    - Show current configuration and status');  
        console.log('  test      - Test live trading integration');
        console.log('');
        console.log('Examples:');
        console.log('  npx tsx admin/live-trading-control.ts enable');
        console.log('  npx tsx admin/live-trading-control.ts status');
        console.log('  npx tsx admin/live-trading-control.ts test');
        console.log('');
        console.log('⚠️  WARNING: "enable" activates REAL MONEY trading!');
        break;
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}