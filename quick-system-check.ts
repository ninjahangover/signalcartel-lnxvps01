/**
 * Quick System Check - Trading Pipeline Status
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function quickCheck() {
  console.log('🔍 SIGNAL CARTEL QUICK SYSTEM CHECK\n');
  
  // 1. Database Strategies
  console.log('📊 DATABASE STRATEGIES:');
  try {
    const totalStrategies = await prisma.pineStrategy.count();
    const activeStrategies = await prisma.pineStrategy.count({ where: { isActive: true }});
    const strategies = await prisma.pineStrategy.findMany({ 
      where: { isActive: true },
      select: { name: true, strategyType: true }
    });
    
    console.log(`   Total: ${totalStrategies}`);
    console.log(`   Active: ${activeStrategies}`);
    if (strategies.length > 0) {
      strategies.forEach(s => console.log(`   - ${s.name} (${s.strategyType})`));
    }
    console.log(`   Status: ${activeStrategies > 0 ? '✅ OK' : '⚠️ No active strategies'}`);
  } catch (error: any) {
    console.log(`   Status: ❌ Error - ${error.message}`);
  }
  
  // 2. Alpaca Configuration
  console.log('\n🏦 ALPACA PAPER TRADING:');
  const hasKey = process.env.ALPACA_PAPER_API_KEY || process.env.NEXT_PUBLIC_ALPACA_PAPER_API_KEY;
  const hasSecret = process.env.ALPACA_PAPER_API_SECRET || process.env.NEXT_PUBLIC_ALPACA_PAPER_API_SECRET;
  console.log(`   API Key: ${hasKey ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   API Secret: ${hasSecret ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Status: ${hasKey && hasSecret ? '✅ Ready' : '❌ Not configured'}`);
  
  // 3. Key Files Check
  console.log('\n📁 KEY SYSTEM FILES:');
  const keyFiles = [
    'src/lib/strategy-execution-engine.ts',
    'src/lib/alpaca-paper-trading-service.ts',
    'src/lib/market-data-service.ts',
    'load-database-strategies.ts'
  ];
  
  const fs = require('fs');
  keyFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`   ${file}: ${exists ? '✅' : '❌'}`);
  });
  
  // 4. Pipeline Flow
  console.log('\n🔄 TRADING PIPELINE FLOW:');
  console.log('   1. Database Strategies → load-database-strategies.ts');
  console.log('   2. Strategy Loading → strategy-execution-engine.ts');
  console.log('   3. Market Data → market-data-service.ts');
  console.log('   4. Signal Generation → strategy implementations');
  console.log('   5. Trade Execution → alpaca-paper-trading-service.ts');
  
  // Summary
  console.log('\n📋 SUMMARY:');
  const dbOk = (await prisma.pineStrategy.count({ where: { isActive: true }})) > 0;
  const alpacaOk = hasKey && hasSecret;
  
  if (dbOk && alpacaOk) {
    console.log('   ✅ System is READY for paper trading');
    console.log('\n   To start trading:');
    console.log('   npx tsx load-database-strategies.ts');
  } else if (dbOk && !alpacaOk) {
    console.log('   ⚠️ Strategies ready but Alpaca not configured');
    console.log('\n   To fix:');
    console.log('   1. Get API keys from https://app.alpaca.markets/paper/dashboard/overview');
    console.log('   2. Add to .env file:');
    console.log('      ALPACA_PAPER_API_KEY=your-key');
    console.log('      ALPACA_PAPER_API_SECRET=your-secret');
  } else if (!dbOk && alpacaOk) {
    console.log('   ⚠️ Alpaca ready but no active strategies');
    console.log('\n   To fix:');
    console.log('   Activate strategies in the web interface');
  } else {
    console.log('   ❌ System needs configuration');
    console.log('\n   Required actions:');
    console.log('   1. Configure Alpaca API credentials');
    console.log('   2. Activate strategies in database');
  }
  
  await prisma.$disconnect();
}

quickCheck().catch(console.error);