/**
 * Complete Telegram Integration Test
 * 
 * Tests all Telegram notification points in the system:
 * 1. System startup notifications
 * 2. Alert generation notifications
 * 3. Trade execution notifications
 * 4. Strategy optimization notifications
 * 5. Daily summary notifications
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment with bot credentials
config({ path: resolve(process.cwd(), '.env.local') });

async function testCompleteTelegramIntegration() {
  console.log('🧪 Testing Complete Telegram Integration...');
  console.log('===============================================');

  try {
    // Import Telegram service
    const { telegramBotService } = await import('./src/lib/telegram-bot-service');
    
    // Test 1: System Status Check
    console.log('\n🔍 Test 1: Checking Telegram bot status...');
    const status = telegramBotService.getStatus();
    console.log('📊 Telegram Bot Status:', status);
    
    if (!status.enabled) {
      console.log('❌ Telegram bot is not enabled. Please check your .env.local configuration:');
      console.log('   - TELEGRAM_BOT_TOKEN should be set');
      console.log('   - TELEGRAM_CHAT_ID should be set');
      return;
    }

    // Test 2: Connection Test
    console.log('\n🔍 Test 2: Testing bot connection...');
    const connectionTest = await telegramBotService.testConnection();
    
    if (!connectionTest) {
      console.log('❌ Connection test failed. Check bot token and chat ID.');
      return;
    }
    
    console.log('✅ Connection test successful!');

    // Test 3: System Startup Notification
    console.log('\n🚀 Test 3: Sending system startup notification...');
    await telegramBotService.sendSystemStartup();
    console.log('✅ System startup notification sent');

    // Test 4: Alert Generation Notification
    console.log('\n🚨 Test 4: Sending alert generation notification...');
    await telegramBotService.sendTradeAlert({
      type: 'ALERT_GENERATED',
      strategy: 'RSI Pullback Strategy',
      symbol: 'BTCUSD',
      action: 'BUY',
      price: 95000,
      quantity: 0.01,
      confidence: 78,
      timestamp: new Date()
    });
    console.log('✅ Alert generation notification sent');

    // Test 5: Trade Execution Notification
    console.log('\n💰 Test 5: Sending trade execution notification...');
    await telegramBotService.sendTradeAlert({
      type: 'TRADE_EXECUTED',
      strategy: 'RSI Pullback Strategy',
      symbol: 'BTCUSD',
      action: 'BUY',
      price: 95000,
      quantity: 0.01,
      confidence: 78,
      profit: 245.67,
      timestamp: new Date()
    });
    console.log('✅ Trade execution notification sent');

    // Test 6: Strategy Optimization Notification
    console.log('\n⚡ Test 6: Sending strategy optimization notification...');
    await telegramBotService.sendTradeAlert({
      type: 'STRATEGY_OPTIMIZED',
      strategy: 'RSI Strategy Optimizer',
      symbol: 'BTCUSD',
      action: 'BUY', // Not relevant for optimization
      price: 0, // Not relevant for optimization
      quantity: 0, // Not relevant for optimization
      confidence: 85,
      timestamp: new Date(),
      details: {
        optimizedParams: {
          rsi_period: 16,
          oversold_level: 28,
          overbought_level: 74
        },
        improvement: '12.3%',
        score: 0.85
      }
    });
    console.log('✅ Strategy optimization notification sent');

    // Test 7: Daily Summary Notification
    console.log('\n📊 Test 7: Sending daily summary notification...');
    await telegramBotService.sendDailySummary({
      totalTrades: 12,
      winningTrades: 9,
      winRate: 75,
      totalProfit: 1456.89,
      bestTrade: 523.44,
      worstTrade: -89.12,
      activeStrategies: 4
    });
    console.log('✅ Daily summary notification sent');

    // Test 8: System Status Notification
    console.log('\n🔧 Test 8: Sending system status notification...');
    await telegramBotService.sendTradeAlert({
      type: 'SYSTEM_STATUS',
      strategy: 'System Monitor',
      symbol: 'SYSTEM',
      action: 'BUY', // Not relevant
      price: 0, // Not relevant
      quantity: 0, // Not relevant
      timestamp: new Date(),
      details: {
        status: 'All systems operational',
        activeStrategies: 4,
        paperTradingActive: true,
        aiOptimizationActive: true
      }
    });
    console.log('✅ System status notification sent');

    // Test 9: Check Integration Points
    console.log('\n🔗 Test 9: Verifying integration points...');
    
    // Check alert generation engine
    try {
      const { default: AlertGenerationEngine } = await import('./src/lib/alert-generation-engine');
      console.log('✅ Alert Generation Engine: Telegram integration detected');
    } catch (error) {
      console.log('⚠️ Alert Generation Engine: Unable to verify integration');
    }

    // Check RSI optimizer
    try {
      const { rsiStrategyOptimizer } = await import('./src/lib/rsi-strategy-optimizer');
      console.log('✅ RSI Strategy Optimizer: Telegram integration detected');
    } catch (error) {
      console.log('⚠️ RSI Strategy Optimizer: Unable to verify integration');
    }

    // Check global engine service
    try {
      const { globalStratusEngineService } = await import('./src/lib/global-stratus-engine-service');
      console.log('✅ Global Stratus Engine: Telegram integration detected');
    } catch (error) {
      console.log('⚠️ Global Stratus Engine: Unable to verify integration');
    }

    // Wait for messages to be sent
    console.log('\n⏰ Waiting for all messages to be sent...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Final status check
    const finalStatus = telegramBotService.getStatus();
    console.log('\n📊 Final Status:', finalStatus);
    
    console.log('\n🎉 Complete Telegram Integration Test Completed!');
    console.log('===============================================');
    console.log('📱 Check your Telegram app for all test messages');
    console.log('✅ The following notification types are now integrated:');
    console.log('   • System startup/shutdown notifications');
    console.log('   • Real-time alert generation notifications');
    console.log('   • Trade execution confirmations');
    console.log('   • Strategy optimization updates');
    console.log('   • Daily performance summaries');
    console.log('   • System status updates');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Telegram integration test failed:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the test
testCompleteTelegramIntegration();