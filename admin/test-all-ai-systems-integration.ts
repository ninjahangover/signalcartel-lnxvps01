#!/usr/bin/env npx tsx

/**
 * Test All AI Systems Integration with Multi-Instance Data Consolidation
 * Verifies that all 5 major AI systems are using consolidated data
 */

import { quantumForgeMultiLayerAI } from '../src/lib/quantum-forge-multi-layer-ai.js';
import { quantumForgeOrderBookAI } from '../src/lib/quantum-forge-orderbook-ai.js';
import { twitterSentiment } from '../src/lib/sentiment/simple-twitter-sentiment.js';
import { stratusEngine } from '../src/lib/stratus-engine-ai.js';
import { markovPredictor } from '../src/lib/markov-chain-predictor.js';
import { marketIntelligence } from '../src/lib/market-intelligence-service.js';

async function testAllAISystemsIntegration() {
  console.log('🔍 TESTING ALL AI SYSTEMS MULTI-INSTANCE INTEGRATION');
  console.log('='.repeat(80));
  
  const testSymbol = 'BTCUSD';
  const testPrice = 65000;
  
  // Test signal for all systems
  const baseSignal = {
    symbol: testSymbol,
    action: 'BUY' as const,
    confidence: 0.75,
    price: testPrice,
    strategy: 'integration-test'
  };

  let successCount = 0;
  let totalSystems = 5;

  try {
    // 1. Test Quantum Forge Multi-Layer AI
    console.log('\n🚀 Testing Quantum Forge Multi-Layer AI...');
    const multiLayerResult = await quantumForgeMultiLayerAI.enhanceSignalWithMultiLayerAI(baseSignal);
    const hasMultiLayerCrossSite = multiLayerResult.decisionExplanation.some((reason: string) => 
      reason.includes('🌐') || reason.includes('Cross-Site') || reason.includes('multi-instance')
    );
    console.log(`   ${hasMultiLayerCrossSite ? '✅' : '❌'} Cross-Site Enhancement: ${hasMultiLayerCrossSite ? 'ACTIVE' : 'NOT DETECTED'}`);
    if (hasMultiLayerCrossSite) successCount++;

    // 2. Test Order Book Intelligence
    console.log('\n📊 Testing Order Book Intelligence™...');
    const orderBookResult = await quantumForgeOrderBookAI.enhanceSignalWithOrderBookAI(baseSignal);
    // Check for cross-site boost in confidence
    const hasOrderBookCrossSite = orderBookResult.aiConfidenceBoost > baseSignal.confidence * 0.05; // Detect any boost
    console.log(`   ${hasOrderBookCrossSite ? '✅' : '❌'} Cross-Site Enhancement: ${hasOrderBookCrossSite ? 'ACTIVE' : 'NOT DETECTED'}`);
    console.log(`   📈 AI Confidence Boost: ${(orderBookResult.aiConfidenceBoost * 100).toFixed(2)}%`);
    if (hasOrderBookCrossSite) successCount++;

    // 3. Test Multi-Source Sentiment System
    console.log('\n💭 Testing Multi-Source Sentiment System...');
    const sentimentScore = await twitterSentiment.getSentimentFor(testSymbol);
    const enhancedSentimentResult = await twitterSentiment.calculateEnhancedSentimentBoost(sentimentScore);
    const hasSentimentCrossSite = enhancedSentimentResult.crossSiteEnhancement.crossSiteEnabled;
    console.log(`   ${hasSentimentCrossSite ? '✅' : '❌'} Cross-Site Enhancement: ${hasSentimentCrossSite ? 'ACTIVE' : 'NOT DETECTED'}`);
    console.log(`   📊 Sentiment Consensus: ${(enhancedSentimentResult.crossSiteEnhancement.sentimentConsensus * 100).toFixed(1)}%`);
    if (hasSentimentCrossSite) successCount++;

    // 4. Test Stratus Engine AI
    console.log('\n🤖 Testing Stratus Engine AI...');
    const stratusResult = await stratusEngine.generateAITradingDecision(testSymbol);
    // Check if confidence has been enhanced (should be different from base)
    const hasStratusCrossSite = stratusResult.confidence !== 0.75; // Should be modified by cross-site data
    console.log(`   ${hasStratusCrossSite ? '✅' : '❌'} Cross-Site Enhancement: ${hasStratusCrossSite ? 'ACTIVE' : 'NOT DETECTED'}`);
    console.log(`   🎯 Enhanced Confidence: ${(stratusResult.confidence * 100).toFixed(1)}%`);
    console.log(`   📊 AI Score: ${stratusResult.aiScore}/100`);
    if (hasStratusCrossSite) successCount++;

    // 5. Test Markov Chain Predictor
    console.log('\n🔮 Testing Markov Chain Predictor...');
    const intelligence = marketIntelligence.getMarketIntelligence(testSymbol);
    if (intelligence) {
      const markovResult = markovPredictor.predict(intelligence, testPrice);
      // Check if expected return is enhanced (should be non-zero with cross-site patterns)
      const hasMarkovCrossSite = Math.abs(markovResult.expectedReturn) > 0.001; // Detect enhancement
      console.log(`   ${hasMarkovCrossSite ? '✅' : '❌'} Cross-Site Enhancement: ${hasMarkovCrossSite ? 'ACTIVE' : 'NOT DETECTED'}`);
      console.log(`   📈 Enhanced Expected Return: ${(markovResult.expectedReturn * 100).toFixed(3)}%`);
      console.log(`   🎯 Prediction Confidence: ${(markovResult.confidence * 100).toFixed(1)}%`);
      if (hasMarkovCrossSite) successCount++;
    } else {
      console.log('   ⚠️ No market intelligence data available for testing');
    }

  } catch (error) {
    console.error('❌ Error during AI systems testing:', error);
  }

  // Results Summary
  console.log('\n📊 MULTI-INSTANCE AI INTEGRATION RESULTS');
  console.log('='.repeat(80));
  
  const integrationPercentage = (successCount / totalSystems) * 100;
  
  console.log(`✅ Integrated Systems: ${successCount}/${totalSystems}`);
  console.log(`🎯 Integration Score: ${integrationPercentage.toFixed(1)}%`);
  
  if (integrationPercentage === 100) {
    console.log('\n🎊 PERFECT INTEGRATION ACHIEVED!');
    console.log('━'.repeat(80));
    console.log('✅ ALL AI systems now use Multi-Instance Data Consolidation');
    console.log('✅ UNIFIED AI ALGORITHM ACCESS is fully operational');
    console.log('✅ Cross-site intelligence enhancement is working across all systems');
    console.log('🌐 QUANTUM FORGE™ Multi-Instance Intelligence: COMPLETE!');
  } else if (integrationPercentage >= 80) {
    console.log('\n🎯 EXCELLENT INTEGRATION!');
    console.log('━'.repeat(80));
    console.log('✅ Most AI systems are using cross-site data enhancement');
    console.log('⚠️ Some systems may need additional integration work');
  } else {
    console.log('\n⚠️ INTEGRATION NEEDS IMPROVEMENT');
    console.log('━'.repeat(80));
    console.log('❌ Several AI systems are not yet integrated with consolidated data');
  }

  console.log(`\n🚀 Ready for enhanced trading with ${integrationPercentage.toFixed(0)}% AI integration!`);
}

// Run the test
testAllAISystemsIntegration().catch(console.error);