#!/usr/bin/env tsx

/**
 * Test Alpaca Credentials
 * 
 * Quick test to verify Alpaca API credentials are working
 * Run with: npx tsx test-alpaca-credentials.ts
 */

// Load environment variables from .env.local and .env
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load .env.local first (takes priority)
try {
  const envLocalPath = join(process.cwd(), '.env.local');
  const envLocalContent = readFileSync(envLocalPath, 'utf8');
  const envLocalVars = envLocalContent.split('\n')
    .filter(line => line.includes('=') && !line.startsWith('#'))
    .reduce((acc, line) => {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').replace(/^"(.*)"$/, '$1');
      acc[key.trim()] = value.trim();
      return acc;
    }, {} as Record<string, string>);
  
  Object.assign(process.env, envLocalVars);
  console.log('✅ Loaded .env.local');
} catch (error) {
  console.log('⚠️ Could not load .env.local');
}

// Load .env as fallback
config();

console.log('🔑 Testing Alpaca API Credentials');
console.log('='.repeat(40));

async function testAlpacaCredentials() {
    try {
        // Check environment variables
        console.log('🔍 Checking environment variables...');
        
        const apiKey = process.env.ALPACA_PAPER_API_KEY || process.env.NEXT_PUBLIC_ALPACA_PAPER_API_KEY;
        const apiSecret = process.env.ALPACA_PAPER_API_SECRET || process.env.NEXT_PUBLIC_ALPACA_PAPER_API_SECRET;
        
        console.log('API Key present:', apiKey ? `✅ Yes (${apiKey.substring(0, 8)}...)` : '❌ No');
        console.log('API Secret present:', apiSecret ? `✅ Yes (${apiSecret.substring(0, 8)}...)` : '❌ No');
        
        if (!apiKey || !apiSecret) {
            console.log('\n❌ Missing Alpaca credentials in environment variables');
            console.log('📝 Please update your .env file with real Alpaca credentials');
            console.log('🔗 Get them from: https://alpaca.markets');
            return false;
        }
        
        if (apiKey.includes('PASTE_YOUR') || apiSecret.includes('PASTE_YOUR')) {
            console.log('\n❌ Alpaca credentials still contain placeholder values');
            console.log('📝 Please replace the placeholder values in .env with real credentials');
            return false;
        }
        
        // Test actual API connection
        console.log('\n🌐 Testing Alpaca API connection...');
        
        const headers = {
            'APCA-API-KEY-ID': apiKey,
            'APCA-API-SECRET-KEY': apiSecret
        };
        
        // Test account endpoint
        console.log('📊 Fetching paper trading account...');
        const accountResponse = await fetch('https://paper-api.alpaca.markets/v2/account', {
            headers
        });
        
        if (!accountResponse.ok) {
            const errorText = await accountResponse.text();
            console.log(`❌ Account fetch failed (${accountResponse.status}):`, errorText);
            
            if (accountResponse.status === 401) {
                console.log('🔑 This usually means invalid credentials');
            } else if (accountResponse.status === 403) {
                console.log('🚫 This usually means credentials are valid but account has restrictions');
            }
            
            return false;
        }
        
        const accountData = await accountResponse.json();
        console.log('✅ Account connection successful!');
        console.log('💰 Account Details:', {
            status: accountData.status,
            equity: `$${parseFloat(accountData.equity).toLocaleString()}`,
            buying_power: `$${parseFloat(accountData.buying_power).toLocaleString()}`,
            cash: `$${parseFloat(accountData.cash).toLocaleString()}`,
            pattern_day_trader: accountData.pattern_day_trader,
            trade_suspended_by_user: accountData.trade_suspended_by_user
        });
        
        // Test positions endpoint
        console.log('\n📈 Testing positions endpoint...');
        const positionsResponse = await fetch('https://paper-api.alpaca.markets/v2/positions', {
            headers
        });
        
        if (positionsResponse.ok) {
            const positions = await positionsResponse.json();
            console.log(`✅ Positions endpoint working (${positions.length} positions)`);
        } else {
            console.log('⚠️ Positions endpoint issue (but account works)');
        }
        
        // Test orders endpoint
        console.log('📋 Testing orders endpoint...');
        const ordersResponse = await fetch('https://paper-api.alpaca.markets/v2/orders?status=all&limit=1', {
            headers
        });
        
        if (ordersResponse.ok) {
            const orders = await ordersResponse.json();
            console.log(`✅ Orders endpoint working (${orders.length} recent orders)`);
        } else {
            console.log('⚠️ Orders endpoint issue (but account works)');
        }
        
        console.log('\n🎉 All Alpaca API tests passed!');
        return true;
        
    } catch (error) {
        console.error('\n❌ Alpaca API test failed:', error);
        return false;
    }
}

async function main() {
    const success = await testAlpacaCredentials();
    
    console.log('\n' + '='.repeat(40));
    console.log('📊 Results:');
    console.log('='.repeat(40));
    
    if (success) {
        console.log('✅ Alpaca credentials are working correctly!');
        console.log('🚀 You can now run: npx tsx verify-paper-trading-system.ts');
        process.exit(0);
    } else {
        console.log('❌ Alpaca credentials need to be fixed');
        console.log('📋 Next steps:');
        console.log('1. Sign up at https://alpaca.markets');
        console.log('2. Get your paper trading API keys');
        console.log('3. Update the .env file with real credentials');
        console.log('4. Run this test again');
        process.exit(1);
    }
}

main().catch(console.error);