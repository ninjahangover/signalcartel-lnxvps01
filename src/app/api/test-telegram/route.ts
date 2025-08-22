import { NextRequest, NextResponse } from 'next/server';
import { telegramAlerts } from '../../../lib/telegram-alert-service';
import { testTelegramAlerts } from '../../../lib/strategy-signal-monitor';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing Telegram bot connection...');
    
    // Test basic bot service
    const basicTest = await telegramAlerts.testConnection();
    
    // Test strategy alert system
    const alertTest = await testTelegramAlerts();
    
    // Get bot status
    const status = telegramAlerts.getStatus();
    
    const result = {
      success: basicTest && alertTest,
      basicBotTest: basicTest,
      strategyAlertTest: alertTest,
      botStatus: status,
      timestamp: new Date().toISOString()
    };
    
    if (result.success) {
      console.log('✅ Telegram test successful');
    } else {
      console.log('❌ Telegram test failed');
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ Telegram test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get current status without sending test messages
    const status = telegramAlerts.getStatus();
    
    return NextResponse.json({
      telegramConfigured: status.configured,
      telegramEnabled: status.enabled,
      queueSize: status.queueSize,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}