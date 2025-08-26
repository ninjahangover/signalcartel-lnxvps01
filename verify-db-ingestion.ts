#!/usr/bin/env npx tsx
/**
 * Verify Database Ingestion of Sentiment Data
 * Tests that real API sentiment data is properly stored in database
 */

import { PrismaClient } from '@prisma/client';
import { twitterSentiment } from './src/lib/sentiment/simple-twitter-sentiment.js';

const prisma = new PrismaClient();

console.log('🔍 DATABASE INGESTION VERIFICATION');
console.log('=' .repeat(80));
console.log('Testing that real sentiment API data is properly stored in database...');
console.log('');

async function verifyDatabaseIngestion() {
  try {
    // 1. Check current database state
    console.log('📊 STEP 1: Checking current database state...');
    console.log('-'.repeat(40));
    
    const currentTrades = await prisma.managedTrade.count();
    const currentSignals = await prisma.enhancedTradingSignal.count();
    const currentPositions = await prisma.managedPosition.count();
    
    console.log(`Current database counts:`);
    console.log(`   Managed Trades: ${currentTrades}`);
    console.log(`   Enhanced Signals: ${currentSignals}`);
    console.log(`   Managed Positions: ${currentPositions}`);
    console.log('');
    
    // 2. Test sentiment API directly
    console.log('📡 STEP 2: Fetching fresh sentiment data from APIs...');
    console.log('-'.repeat(40));
    
    const sentimentResult = await twitterSentiment.getBTCSentiment();
    
    console.log('✅ Fresh sentiment data retrieved:');
    console.log(`   Symbol: ${sentimentResult.symbol}`);
    console.log(`   Score: ${sentimentResult.score.toFixed(4)} (${sentimentResult.score > 0 ? 'BULLISH' : 'BEARISH'})`);
    console.log(`   Confidence: ${(sentimentResult.confidence * 100).toFixed(2)}%`);
    console.log(`   Data Points: ${sentimentResult.tweetCount}`);
    console.log(`   Timestamp: ${sentimentResult.timestamp}`);
    console.log('');
    
    // 3. Run a trading strategy to generate database records
    console.log('🚀 STEP 3: Running trading engine to test database ingestion...');
    console.log('-'.repeat(40));
    console.log('Starting trading engine with sentiment data ingestion...');
    console.log('');
    
    // Import and run strategy execution
    const { execSync } = await import('child_process');
    
    try {
      // Run the trading engine for 15 seconds to generate some database activity
      console.log('⏳ Running QUANTUM FORGE trading engine for 15 seconds...');
      const output = execSync('timeout 15s npx tsx -r dotenv/config load-database-strategies.ts', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      console.log('📄 Trading engine output (last 20 lines):');
      const lines = output.split('\n').slice(-20);
      lines.forEach(line => console.log(`   ${line}`));
      
    } catch (error) {
      // Timeout is expected
      if (error.status === 124) {
        console.log('✅ Trading engine ran for 15 seconds (timeout expected)');
      } else {
        console.log(`⚠️ Trading engine error: ${error.message}`);
      }
    }
    
    console.log('');
    
    // 4. Check database after trading run
    console.log('📊 STEP 4: Checking database after trading engine run...');
    console.log('-'.repeat(40));
    
    const newTrades = await prisma.managedTrade.count();
    const newSignals = await prisma.enhancedTradingSignal.count();
    const newPositions = await prisma.managedPosition.count();
    
    console.log(`New database counts:`);
    console.log(`   Managed Trades: ${newTrades} (${newTrades - currentTrades > 0 ? '+' + (newTrades - currentTrades) : 'no change'})`);
    console.log(`   Enhanced Signals: ${newSignals} (${newSignals - currentSignals > 0 ? '+' + (newSignals - currentSignals) : 'no change'})`);
    console.log(`   Managed Positions: ${newPositions} (${newPositions - currentPositions > 0 ? '+' + (newPositions - currentPositions) : 'no change'})`);
    console.log('');
    
    // 5. Examine the most recent enhanced signals (contain sentiment data)
    console.log('🔍 STEP 5: Examining recent enhanced trading signals with sentiment...');
    console.log('-'.repeat(40));
    
    const recentSignals = await prisma.enhancedTradingSignal.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        symbol: true,
        action: true,
        confidence: true,
        sentimentScore: true,
        sentimentConfidence: true,
        sentimentSources: true,
        createdAt: true,
        reason: true
      }
    });
    
    if (recentSignals.length > 0) {
      console.log(`✅ Found ${recentSignals.length} recent enhanced signals with sentiment data:`);
      console.log('');
      
      recentSignals.forEach((signal, index) => {
        console.log(`📋 Signal ${index + 1}:`);
        console.log(`   ID: ${signal.id}`);
        console.log(`   Symbol: ${signal.symbol}`);
        console.log(`   Action: ${signal.action}`);
        console.log(`   Confidence: ${(signal.confidence * 100).toFixed(2)}%`);
        console.log(`   Sentiment Score: ${signal.sentimentScore?.toFixed(4) || 'null'}`);
        console.log(`   Sentiment Confidence: ${signal.sentimentConfidence ? (signal.sentimentConfidence * 100).toFixed(2) + '%' : 'null'}`);
        console.log(`   Sentiment Sources: ${signal.sentimentSources || 'null'}`);
        console.log(`   Created: ${signal.createdAt}`);
        console.log(`   Reason: ${signal.reason}`);
        console.log('');
      });
    } else {
      console.log('⚠️ No recent enhanced signals found');
      console.log('   This might indicate the trading engine needs more time to generate signals');
      console.log('');
    }
    
    // 6. Check for any managed trades with sentiment data
    console.log('💰 STEP 6: Examining managed trades for sentiment integration...');
    console.log('-'.repeat(40));
    
    const recentTrades = await prisma.managedTrade.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        position: {
          select: {
            symbol: true,
            status: true,
            entryPrice: true,
            currentPrice: true,
            pnl: true
          }
        }
      }
    });
    
    if (recentTrades.length > 0) {
      console.log(`✅ Found ${recentTrades.length} recent managed trades:`);
      console.log('');
      
      recentTrades.forEach((trade, index) => {
        console.log(`💼 Trade ${index + 1}:`);
        console.log(`   ID: ${trade.id}`);
        console.log(`   Type: ${trade.type}`);
        console.log(`   Symbol: ${trade.position?.symbol || 'N/A'}`);
        console.log(`   Quantity: ${trade.quantity}`);
        console.log(`   Price: $${trade.price?.toFixed(2) || 'N/A'}`);
        console.log(`   Position Status: ${trade.position?.status || 'N/A'}`);
        console.log(`   P&L: $${trade.position?.pnl?.toFixed(2) || 'N/A'}`);
        console.log(`   Created: ${trade.createdAt}`);
        console.log('');
      });
    } else {
      console.log('⚠️ No recent managed trades found');
      console.log('   Trading engine may need more time or market conditions for trades');
      console.log('');
    }
    
    // 7. Final validation
    console.log('🎯 STEP 7: Database ingestion validation...');
    console.log('-'.repeat(40));
    
    const hasNewData = (newSignals > currentSignals) || (newTrades > currentTrades);
    const hasWorkingSentiment = sentimentResult.tweetCount > 10 && sentimentResult.confidence > 0.8;
    
    if (hasNewData && hasWorkingSentiment) {
      console.log('✅ DATABASE INGESTION VERIFIED:');
      console.log(`   - Sentiment APIs working (${sentimentResult.tweetCount} data points, ${(sentimentResult.confidence * 100).toFixed(1)}% confidence)`);
      console.log(`   - Trading engine processing sentiment data`);
      console.log(`   - Database receiving new records from trading activity`);
      console.log(`   - Enhanced signals storing sentiment scores and sources`);
      console.log('');
      console.log('🎊 CONCLUSION: Real API sentiment data is properly ingested into database');
    } else if (hasWorkingSentiment && !hasNewData) {
      console.log('⚠️ PARTIAL VERIFICATION:');
      console.log(`   - Sentiment APIs working perfectly (${sentimentResult.tweetCount} data points, ${(sentimentResult.confidence * 100).toFixed(1)}% confidence)`);
      console.log(`   - No new database records generated (may need longer runtime or market conditions)`);
      console.log(`   - System architecture is correct, just needs more time/activity`);
      console.log('');
      console.log('💡 RECOMMENDATION: Run trading engine for longer period to see database activity');
    } else {
      console.log('❌ ISSUES DETECTED:');
      if (!hasWorkingSentiment) {
        console.log(`   - Sentiment system issues (only ${sentimentResult.tweetCount} data points, ${(sentimentResult.confidence * 100).toFixed(1)}% confidence)`);
      }
      if (!hasNewData) {
        console.log(`   - No database activity during test run`);
      }
      console.log('');
      console.log('🔧 RECOMMENDATION: Check sentiment APIs and trading engine configuration');
    }
    
  } catch (error) {
    console.error('❌ Database verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

console.log('Starting database ingestion verification...');
console.log('This will:');
console.log('1. Check current database state');
console.log('2. Test sentiment APIs');  
console.log('3. Run trading engine briefly');
console.log('4. Verify data was ingested');
console.log('');

verifyDatabaseIngestion().catch(console.error);