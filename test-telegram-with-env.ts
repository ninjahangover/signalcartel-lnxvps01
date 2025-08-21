/**
 * Test Telegram Integration with Environment Variables
 */

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testTelegramIntegration() {
  console.log('🧪 TESTING TELEGRAM INTEGRATION');
  console.log('=' + '='.repeat(40));

  // Check environment variables
  console.log('\n🔐 ENVIRONMENT CHECK:');
  console.log(`TELEGRAM_BOT_TOKEN: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log(`TELEGRAM_CHAT_ID: ${process.env.TELEGRAM_CHAT_ID ? '✅ Set' : '❌ Missing'}`);

  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.log('❌ Telegram credentials missing from environment');
    return;
  }

  try {
    // Test the telegram bot service
    const { telegramBotService } = await import('./src/lib/telegram-bot-service');
    
    console.log('\n📱 TESTING TELEGRAM BOT SERVICE:');
    console.log('Service loaded:', typeof telegramBotService);
    
    // Test basic message
    console.log('\n📤 Sending test message...');
    const testMessage = `🧪 TEST MESSAGE
    
🚀 SignalCartel Trading Bot Test
📊 System Status: OPERATIONAL
⏰ Time: ${new Date().toLocaleString()}
💰 Paper Trading: ACTIVE

This is a test to verify Telegram integration is working properly!`;

    // Check if sendMessage method exists
    if (typeof telegramBotService.sendMessage === 'function') {
      await telegramBotService.sendMessage(testMessage);
      console.log('✅ Test message sent successfully!');
    } else {
      console.log('❌ sendMessage method not found on telegramBotService');
      console.log('Available methods:', Object.getOwnPropertyNames(telegramBotService));
    }

    // Test trade alert
    console.log('\n📈 Testing trade alert...');
    if (typeof telegramBotService.sendTradeAlert === 'function') {
      await telegramBotService.sendTradeAlert({
        type: 'TRADE_EXECUTED',
        strategy: 'Test Strategy',
        symbol: 'BTCUSD',
        action: 'BUY',
        price: 114000,
        quantity: 0.001,
        confidence: 85,
        timestamp: new Date()
      });
      console.log('✅ Trade alert sent successfully!');
    } else {
      console.log('❌ sendTradeAlert method not found');
    }

  } catch (error) {
    console.error('❌ Error testing Telegram integration:', error);
  }
}

// Also test the unified trade executor
async function testUnifiedExecutorWithTelegram() {
  console.log('\n🎯 TESTING UNIFIED EXECUTOR WITH TELEGRAM:');
  
  try {
    const { unifiedTradeExecutor } = await import('./src/lib/unified-trade-executor');
    
    // Set paper trading mode
    unifiedTradeExecutor.setTradingMode({ 
      type: 'paper', 
      paperProvider: 'internal' // Use internal to avoid Alpaca dependency
    });

    const testOrder = {
      symbol: 'BTCUSD',
      action: 'BUY' as const,
      quantity: 0.001,
      price: 114000,
      strategy: 'telegram-test',
      confidence: 0.95,
      metadata: { test: 'telegram_integration' }
    };

    console.log('📊 Executing test trade with Telegram alerts...');
    const result = await unifiedTradeExecutor.executeTrade(testOrder);
    
    if (result.success) {
      console.log('✅ Test trade executed with Telegram alert!');
      console.log(`   Order ID: ${result.orderId}`);
      console.log('   Check your Telegram for the notification!');
    } else {
      console.log('❌ Test trade failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Error testing unified executor:', error);
  }
}

if (require.main === module) {
  (async () => {
    await testTelegramIntegration();
    await testUnifiedExecutorWithTelegram();
  })();
}

export { testTelegramIntegration };