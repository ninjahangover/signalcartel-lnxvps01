#!/usr/bin/env node

/**
 * Paper Trading Setup Verification Script
 * 
 * This script verifies that all components of the paper trading system are properly configured
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🔍 Verifying Paper Trading Setup...\n');

  let allChecksPass = true;

  // Check 1: Environment Variables
  console.log('1. Checking Environment Variables...');
  const requiredEnvVars = [
    'ALPACA_PAPER_API_KEY',
    'ALPACA_PAPER_API_SECRET'
  ];

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`   ✅ ${envVar} is set`);
    } else {
      console.log(`   ❌ ${envVar} is missing`);
      allChecksPass = false;
    }
  }

  // Check 2: Database Schema
  console.log('\n2. Checking Database Schema...');
  try {
    const prisma = new PrismaClient();
    
    // Test paper trading tables
    const paperAccountCount = await prisma.paperAccount.count();
    console.log(`   ✅ PaperAccount table exists (${paperAccountCount} records)`);
    
    const paperPositionCount = await prisma.paperPosition.count();
    console.log(`   ✅ PaperPosition table exists (${paperPositionCount} records)`);
    
    const paperOrderCount = await prisma.paperOrder.count();
    console.log(`   ✅ PaperOrder table exists (${paperOrderCount} records)`);
    
    const paperTradeCount = await prisma.paperTrade.count();
    console.log(`   ✅ PaperTrade table exists (${paperTradeCount} records)`);
    
    const paperSessionCount = await prisma.paperTradingSession.count();
    console.log(`   ✅ PaperTradingSession table exists (${paperSessionCount} records)`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.log(`   ❌ Database error: ${error.message}`);
    allChecksPass = false;
  }

  // Check 3: Required Files
  console.log('\n3. Checking Required Files...');
  const requiredFiles = [
    'src/lib/alpaca-paper-trading-service.ts',
    'src/lib/paper-account-cycling-service.ts',
    'src/components/paper-trading-dashboard.tsx',
    '.env.example',
    'PAPER_TRADING_SETUP.md'
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${file} exists`);
    } else {
      console.log(`   ❌ ${file} is missing`);
      allChecksPass = false;
    }
  }

  // Check 4: API Connection (if credentials available)
  console.log('\n4. Testing Alpaca API Connection...');
  if (process.env.ALPACA_PAPER_API_KEY && process.env.ALPACA_PAPER_API_SECRET) {
    try {
      const response = await fetch('https://paper-api.alpaca.markets/v2/account', {
        headers: {
          'APCA-API-KEY-ID': process.env.ALPACA_PAPER_API_KEY,
          'APCA-API-SECRET-KEY': process.env.ALPACA_PAPER_API_SECRET
        }
      });

      if (response.ok) {
        const accountData = await response.json();
        console.log(`   ✅ Alpaca API connection successful`);
        console.log(`   📊 Account Status: ${accountData.account_status}`);
        console.log(`   💰 Buying Power: $${parseFloat(accountData.buying_power).toLocaleString()}`);
      } else {
        console.log(`   ❌ Alpaca API connection failed: ${response.status} ${response.statusText}`);
        allChecksPass = false;
      }
    } catch (error) {
      console.log(`   ❌ Alpaca API test failed: ${error.message}`);
      allChecksPass = false;
    }
  } else {
    console.log('   ⚠️  Skipping API test - credentials not configured');
  }

  // Check 5: Migration Status
  console.log('\n5. Checking Migration Status...');
  const migrationDir = path.join(process.cwd(), 'prisma', 'migrations');
  if (fs.existsSync(migrationDir)) {
    const migrations = fs.readdirSync(migrationDir).filter(dir => 
      dir.includes('add_paper_trading') || dir.includes('add-paper-trading')
    );
    
    if (migrations.length > 0) {
      console.log(`   ✅ Paper trading migration found: ${migrations[0]}`);
    } else {
      console.log('   ⚠️  Paper trading migration not found');
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  if (allChecksPass) {
    console.log('🎉 All checks passed! Paper trading system is ready to use.');
    console.log('\nNext steps:');
    console.log('1. Add your Alpaca credentials to .env.local');
    console.log('2. Add the PaperTradingDashboard component to your app');
    console.log('3. Start trading with virtual money!');
  } else {
    console.log('❌ Some checks failed. Please review the issues above.');
    console.log('\nSetup instructions can be found in PAPER_TRADING_SETUP.md');
  }
  console.log('='.repeat(50));
}

main().catch(console.error);