/**
 * Test paper trading with proper env loading
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

async function testPaperTradingWithEnv() {
  console.log('🧪 Testing Paper Trading with Environment Loading...');

  try {
    // Check environment variables after loading
    console.log('🔍 Step 1: Check credentials after loading .env.local...');
    const hasKey = !!process.env.NEXT_PUBLIC_ALPACA_PAPER_API_KEY;
    const hasSecret = !!process.env.NEXT_PUBLIC_ALPACA_PAPER_API_SECRET;
    
    console.log(`📋 API Key present: ${hasKey}`);
    console.log(`📋 API Secret present: ${hasSecret}`);
    
    if (hasKey) {
      const keyPreview = process.env.NEXT_PUBLIC_ALPACA_PAPER_API_KEY!.substring(0, 8) + '...';
      console.log(`📋 API Key preview: ${keyPreview}`);
    }
    
    if (!hasKey || !hasSecret) {
      console.log('❌ Missing credentials - checking .env.local file...');
      
      // Try to read .env.local directly
      const fs = await import('fs');
      if (fs.existsSync('.env.local')) {
        console.log('📄 .env.local file exists');
        const content = fs.readFileSync('.env.local', 'utf-8');
        const hasAlpacaKeys = content.includes('ALPACA_PAPER_API_KEY');
        console.log(`📋 Contains Alpaca keys: ${hasAlpacaKeys}`);
        
        if (hasAlpacaKeys) {
          console.log('💡 Keys exist in file but not loaded. This might be a Next.js environment issue.');
          console.log('💡 In production, this would work through the Next.js environment system.');
        }
      } else {
        console.log('📄 .env.local file not found');
      }
      return;
    }

    // Continue with the test if credentials are available
    console.log('✅ Credentials loaded, continuing with test...');
    
    // Test Alpaca service
    const { alpacaPaperTradingService } = await import('./src/lib/alpaca-paper-trading-service');
    
    const account = await alpacaPaperTradingService.initializeAccount(
      'test-user-123',
      process.env.NEXT_PUBLIC_ALPACA_PAPER_API_KEY!,
      process.env.NEXT_PUBLIC_ALPACA_PAPER_API_SECRET!
    );
    
    if (account) {
      console.log('🎉 SUCCESS! Alpaca paper trading is working!');
      console.log(`💰 Account balance: $${account.currentBalance.toLocaleString()}`);
    } else {
      console.log('❌ Alpaca account initialization failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testPaperTradingWithEnv().catch(console.error);