#!/usr/bin/env node

/**
 * End-to-End Test Script for Alpaca Paper Trading Integration
 * Tests all major components to ensure the system is ready for use
 */

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function testAlpacaIntegration() {
  console.log(`${colors.cyan}🚀 Starting End-to-End Alpaca Integration Test${colors.reset}\n`);
  
  const baseUrl = 'http://localhost:3001';
  let allTestsPassed = true;
  
  // Test 1: Check if server is running
  console.log(`${colors.blue}Test 1: Server Health Check${colors.reset}`);
  try {
    const response = await fetch(baseUrl);
    if (response.ok) {
      console.log(`${colors.green}✅ Server is running on port 3001${colors.reset}`);
    } else {
      throw new Error(`Server returned status ${response.status}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Server health check failed: ${error.message}${colors.reset}`);
    allTestsPassed = false;
  }
  
  // Test 2: Test Alpaca connection via API
  console.log(`\n${colors.blue}Test 2: Alpaca API Connection${colors.reset}`);
  try {
    const response = await fetch(`${baseUrl}/api/paper-trading/test`);
    const data = await response.json();
    
    if (data.success) {
      console.log(`${colors.green}✅ Alpaca API connection successful${colors.reset}`);
      console.log(`   Account Status: ${data.accountStatus}`);
      console.log(`   Balance: $${data.balance?.toLocaleString()}`);
    } else {
      throw new Error(data.error || 'Connection failed');
    }
  } catch (error) {
    console.log(`${colors.red}❌ Alpaca connection test failed: ${error.message}${colors.reset}`);
    allTestsPassed = false;
  }
  
  // Test 3: Check database connection
  console.log(`\n${colors.blue}Test 3: Database Connection${colors.reset}`);
  try {
    // Test by checking if Prisma schema is valid
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Try to count paper accounts
    const count = await prisma.paperAccount.count();
    console.log(`${colors.green}✅ Database connected successfully${colors.reset}`);
    console.log(`   Paper accounts in database: ${count}`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.log(`${colors.red}❌ Database connection failed: ${error.message}${colors.reset}`);
    allTestsPassed = false;
  }
  
  // Test 4: Check real market data
  console.log(`\n${colors.blue}Test 4: Real Market Data${colors.reset}`);
  try {
    const response = await fetch(`${baseUrl}/api/paper-trading/alpaca?action=market-data&symbols=AAPL,TSLA`);
    const data = await response.json();
    
    if (data.success && data.marketData) {
      console.log(`${colors.green}✅ Real market data available${colors.reset}`);
      Object.entries(data.marketData).forEach(([symbol, price]) => {
        console.log(`   ${symbol}: $${price.toFixed(2)}`);
      });
    } else {
      throw new Error('Market data not available');
    }
  } catch (error) {
    console.log(`${colors.yellow}⚠️  Market data test failed (markets may be closed): ${error.message}${colors.reset}`);
  }
  
  // Test 5: Check configuration
  console.log(`\n${colors.blue}Test 5: Configuration Check${colors.reset}`);
  const config = require('./src/lib/config.ts');
  
  if (config.TRADING_CONFIG.REAL_DATA_ONLY === true) {
    console.log(`${colors.green}✅ Real data mode enabled${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Real data mode not enabled${colors.reset}`);
    allTestsPassed = false;
  }
  
  if (config.TRADING_CONFIG.PAPER_TRADING.PRIMARY_PLATFORM === 'alpaca') {
    console.log(`${colors.green}✅ Alpaca set as primary platform${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Alpaca not set as primary platform${colors.reset}`);
    allTestsPassed = false;
  }
  
  // Test Summary
  console.log(`\n${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  if (allTestsPassed) {
    console.log(`${colors.green}🎉 ALL TESTS PASSED! System is ready for end-to-end testing.${colors.reset}`);
    console.log(`\n${colors.cyan}Next Steps:${colors.reset}`);
    console.log('1. Navigate to http://localhost:3001');
    console.log('2. Log in with your account');
    console.log('3. Go to the "Alpaca Paper" tab in the dashboard');
    console.log('4. Initialize your paper trading account');
    console.log('5. Start placing test trades with real market data!');
  } else {
    console.log(`${colors.red}⚠️  Some tests failed. Please fix the issues above before testing.${colors.reset}`);
  }
  console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);
}

// Run the test
testAlpacaIntegration().catch(console.error);