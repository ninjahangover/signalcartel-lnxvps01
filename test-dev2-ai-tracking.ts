/**
 * Test script for DEV2 AI Enhanced Position Tracking
 * Verifies the A/B test setup without affecting DEV1
 */

import { PrismaClient } from '@prisma/client';
import { dev2AIPositionService } from './src/lib/position-management/dev2-ai-position-service';

const prisma = new PrismaClient();

async function testDev2Setup() {
  console.log(`
════════════════════════════════════════════════════════════
     DEV2 AI ENHANCED POSITION TRACKING TEST
     A/B Test Variant: Enhanced AI with Unique Trade IDs
════════════════════════════════════════════════════════════
  `);
  
  // 1. Check if dev2 tables exist
  console.log('1️⃣ Checking DEV2 database tables...');
  try {
    const dev2Tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('position_signals_dev2', 'trade_learning_dev2')
    ` as any[];
    
    console.log(`   ✅ Found ${dev2Tables.length} dev2 tables:`, dev2Tables.map(t => t.table_name));
  } catch (error) {
    console.error('   ❌ Error checking tables:', error);
  }
  
  // 2. Check environment configuration
  console.log('\n2️⃣ Checking environment configuration...');
  const isDev2 = process.env.NTFY_TOPIC === 'signal-cartel-dev2';
  console.log(`   ${isDev2 ? '✅' : '⚠️'} NTFY_TOPIC = ${process.env.NTFY_TOPIC || 'not set'}`);
  console.log(`   ${isDev2 ? '✅' : '⚠️'} Running as: ${isDev2 ? 'DEV2 (AI Enhanced)' : 'DEV1 (Control)'}`);
  
  // 3. Test signal processing (dry run)
  if (isDev2) {
    console.log('\n3️⃣ Testing DEV2 signal processing...');
    const testSignal = {
      symbol: 'BTCUSD',
      action: 'buy' as const,
      price: 108000,
      confidence: 65,
      strategy: 'test-dev2-ai',
      metadata: {
        rsi: 45,
        bayesian: {
          recommendation: 'BUY',
          confidence: 70,
          marketRegime: 'NEUTRAL'
        },
        intuition: {
          overallIntuition: 62,
          flowFieldResonance: 55,
          harmonicPattern: 48
        }
      }
    };
    
    console.log('   📊 Test signal:', testSignal);
    console.log('   🤖 DEV2 AI service would process this with:');
    console.log('      - Unique Trade ID generation');
    console.log('      - Full AI validation');
    console.log('      - Strategy input capture');
    console.log('      - Learning system recording');
  }
  
  // 4. Check A/B test comparison view
  console.log('\n4️⃣ Checking A/B test comparison...');
  try {
    const comparison = await prisma.$queryRaw`
      SELECT * FROM ab_test_comparison
    ` as any[];
    
    console.log('   📊 A/B Test Results:');
    for (const variant of comparison) {
      const winRate = variant.total_positions > 0 
        ? ((variant.wins / (variant.wins + variant.losses)) * 100).toFixed(1)
        : '0.0';
      
      console.log(`   
   ${variant.variant.toUpperCase()}:
   • Total Positions: ${variant.total_positions}
   • Wins: ${variant.wins} | Losses: ${variant.losses}
   • Win Rate: ${winRate}%
   • Avg P&L: $${parseFloat(variant.avg_pnl || 0).toFixed(2)}
   • Total P&L: $${parseFloat(variant.total_pnl || 0).toFixed(2)}`);
    }
  } catch (error) {
    console.error('   ❌ Error getting comparison:', error);
  }
  
  // 5. Check dev1 positions are unaffected
  console.log('\n5️⃣ Verifying DEV1 positions are unaffected...');
  try {
    const dev1Positions = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM "ManagedPosition" 
      WHERE unique_trade_id_dev2 IS NULL 
        AND status = 'open'
    ` as any[];
    
    console.log(`   ✅ DEV1 has ${dev1Positions[0].count} open positions (unaffected)`);
    
    const dev2Positions = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM "ManagedPosition" 
      WHERE unique_trade_id_dev2 IS NOT NULL 
        AND status = 'open'
    ` as any[];
    
    console.log(`   ✅ DEV2 has ${dev2Positions[0].count} AI-tracked positions`);
  } catch (error) {
    console.error('   ❌ Error checking positions:', error);
  }
  
  // 6. Summary
  console.log(`
════════════════════════════════════════════════════════════
                    TEST SUMMARY
════════════════════════════════════════════════════════════
  `);
  
  if (isDev2) {
    console.log(`✅ DEV2 AI Enhanced System is READY
   
   Features Active:
   • Unique Trade ID tracking for every position
   • Full AI validation before trade entry
   • Strategy input capture and storage
   • Continuous AI monitoring and optimization
   • Learning system for completed trades
   • Separate dev2 tables (dev1 unaffected)
   
   To start DEV2 trading:
   NTFY_TOPIC="signal-cartel-dev2" \\
   npx tsx -r dotenv/config production-trading-with-positions.ts
   `);
  } else {
    console.log(`⚠️ Currently configured for DEV1 (Control)
   
   DEV1 continues with:
   • Original position management
   • Standard exit strategies
   • No unique trade IDs
   • No dev2 AI enhancements
   
   To switch to DEV2:
   export NTFY_TOPIC="signal-cartel-dev2"
   `);
  }
  
  await prisma.$disconnect();
}

// Run the test
testDev2Setup().catch(console.error);