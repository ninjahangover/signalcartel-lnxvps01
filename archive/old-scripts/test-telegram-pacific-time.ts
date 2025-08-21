/**
 * Test Telegram Bot with Pacific Time
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment with bot credentials
config({ path: resolve(process.cwd(), '.env.local') });

// Set timezone to Pacific
process.env.TZ = 'America/Los_Angeles';

async function testTelegramPacificTime() {
  console.log('🧪 Testing Telegram Bot with Pacific Time...');
  console.log('Current Pacific Time:', new Date().toLocaleString('en-US', { 
    timeZone: 'America/Los_Angeles',
    dateStyle: 'full',
    timeStyle: 'medium'
  }));
  console.log('===============================================');

  try {
    // Import Telegram service
    const { telegramBotService } = await import('./src/lib/telegram-bot-service');
    
    // Test connection with Pacific Time
    console.log('🔍 Testing bot connection with Pacific Time...');
    const connectionTest = await telegramBotService.testConnection();
    
    if (!connectionTest) {
      console.log('❌ Connection test failed');
      return;
    }
    
    console.log('✅ Connection test successful!');
    
    // Send a test trade alert with Pacific Time
    console.log('📊 Sending test trade alert with Pacific Time...');
    await telegramBotService.sendTradeAlert({
      type: 'TRADE_EXECUTED',
      strategy: 'Pacific Time Test',
      symbol: 'BTCUSD',
      action: 'BUY',
      price: 95000,
      quantity: 0.01,
      confidence: 85,
      profit: 125.50,
      timestamp: new Date()
    });
    
    // Send system startup with Pacific Time
    console.log('🚀 Sending system startup with Pacific Time...');
    await telegramBotService.sendSystemStartup();
    
    // Wait for messages to be sent
    console.log('⏰ Waiting for messages to be sent...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n🎉 Pacific Time test completed!');
    console.log('📱 Check your Telegram - timestamps should now show Pacific Time (PDT/PST)');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testTelegramPacificTime();