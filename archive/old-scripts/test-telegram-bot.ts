/**
 * Test Telegram Bot Integration
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment with bot credentials
config({ path: resolve(process.cwd(), '.env.local') });

async function testTelegramBot() {
  console.log('🧪 Testing Telegram Bot Integration...');

  try {
    // Manually configure with your credentials for testing
    const BOT_TOKEN = "7271136211:AAGE248w3_N7JwtHnLpWn9Cp-GpXx3hBEMM";
    const CHAT_ID = "1370390999"; // Your chat ID
    
    console.log('📱 Bot Token:', BOT_TOKEN.substring(0, 20) + '...');
    console.log('💬 Chat ID:', CHAT_ID);
    
    // Import Telegram service
    const { telegramBotService } = await import('./src/lib/telegram-bot-service');
    
    // Configure the bot manually
    telegramBotService.configure(BOT_TOKEN, CHAT_ID);
    
    // Test basic connection
    console.log('🔍 Testing bot connection...');
    const connectionTest = await telegramBotService.testConnection();
    
    if (!connectionTest) {
      console.log('❌ Connection test failed');
      return;
    }
    
    console.log('✅ Connection test successful!');
    
    // Test system startup notification
    console.log('🚀 Sending startup notification...');
    await telegramBotService.sendSystemStartup();
    
    // Test trade alert
    console.log('📊 Sending test trade alert...');
    await telegramBotService.sendTradeAlert({
      type: 'TRADE_EXECUTED',
      strategy: 'RSI MACD Scalper v3',
      symbol: 'BTCUSD',
      action: 'BUY',
      price: 118474,
      quantity: 1,
      confidence: 85,
      profit: 247.83,
      timestamp: new Date()
    });
    
    // Test strategy alert
    console.log('🚨 Sending test strategy alert...');
    await telegramBotService.sendTradeAlert({
      type: 'ALERT_GENERATED',
      strategy: 'Mean Reversion Alpha',
      symbol: 'ETHUSD',
      action: 'SELL',
      price: 4548.25,
      quantity: 2,
      confidence: 73,
      timestamp: new Date()
    });
    
    // Test optimization notification
    console.log('⚡ Sending optimization notification...');
    await telegramBotService.sendTradeAlert({
      type: 'STRATEGY_OPTIMIZED',
      strategy: 'AI Fibonacci Hunter',
      symbol: 'SOLUSD',
      action: 'BUY', // Not relevant for optimization
      price: 0, // Not relevant for optimization
      quantity: 0, // Not relevant for optimization
      timestamp: new Date()
    });
    
    // Test daily summary
    console.log('📊 Sending test daily summary...');
    await telegramBotService.sendDailySummary({
      totalTrades: 8,
      winningTrades: 6,
      winRate: 75,
      totalProfit: 1247.83,
      bestTrade: 892.45,
      worstTrade: -156.22,
      activeStrategies: 5
    });
    
    // Wait for messages to be sent
    console.log('⏰ Waiting for messages to be sent...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check service status
    const status = telegramBotService.getStatus();
    console.log('📊 Final status:', status);
    
    console.log('\n🎉 Telegram bot test completed!');
    console.log('📱 Check your Telegram app for the test messages');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Telegram bot test failed:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the test
testTelegramBot();