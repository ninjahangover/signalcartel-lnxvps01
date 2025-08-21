#!/usr/bin/env ts-node

/**
 * Test Markov Chain Integration with Stratus Engine
 * 
 * This script demonstrates how the Law of Large Numbers and Markov chains
 * improve trading predictions over time.
 */

import { stratusEngine, getAITradingSignal } from './src/lib/stratus-engine-ai';
import { markovPredictor } from './src/lib/markov-chain-predictor';
import { marketIntelligence } from './src/lib/market-intelligence-service';
import { realMarketData } from './src/lib/real-market-data';
import { initializeMarkovPersistence, saveMarkovModel } from './src/lib/markov-model-persistence';

async function testMarkovIntegration() {
  console.log('🔮 Testing Markov Chain Integration with Stratus Engine\n');
  console.log('═'.repeat(60));
  
  try {
    // Initialize Markov persistence
    console.log('📂 Initializing Markov model persistence...');
    await initializeMarkovPersistence();
    
    // Get initial LLN metrics
    const initialMetrics = markovPredictor.getLLNConfidenceMetrics();
    console.log('\n📊 Initial Law of Large Numbers Metrics:');
    console.log(`  • Convergence Status: ${initialMetrics.convergenceStatus}`);
    console.log(`  • Overall Reliability: ${(initialMetrics.overallReliability * 100).toFixed(1)}%`);
    console.log(`  • Trades Needed for Convergence: ${initialMetrics.recommendedMinTrades}`);
    console.log(`  • Current Average Confidence: ${(initialMetrics.currentAverageConfidence * 100).toFixed(1)}%`);
    
    // Test with multiple symbols
    const symbols = ['BTCUSD', 'ETHUSD', 'ADAUSD'];
    
    console.log('\n🎯 Generating AI Trading Decisions with Markov Enhancement:\n');
    
    for (const symbol of symbols) {
      console.log(`\n📈 Analyzing ${symbol}:`);
      console.log('─'.repeat(40));
      
      // Get AI trading decision (now enhanced with Markov predictions)
      const decision = await getAITradingSignal(symbol);
      
      // Display decision details
      console.log(`  Decision: ${decision.decision}`);
      console.log(`  AI Score: ${decision.aiScore}/100`);
      console.log(`  Confidence: ${(decision.confidence * 100).toFixed(1)}%`);
      console.log(`  Expected Win Rate: ${decision.expectedWinRate.toFixed(1)}%`);
      console.log(`  Expected Profit: ${decision.expectedProfitMargin.toFixed(2)}%`);
      
      // Show Markov chain specific insights
      if (decision.markovPrediction) {
        const markov = decision.markovPrediction;
        console.log('\n  🔮 Markov Chain Analysis:');
        console.log(`    • Current State: ${markov.currentState}`);
        console.log(`    • Most Likely Next State: ${markov.mostLikelyNextState}`);
        console.log(`    • Expected Return: ${markov.expectedReturn.toFixed(2)}%`);
        console.log(`    • Prediction Confidence: ${(markov.confidence * 100).toFixed(1)}%`);
        console.log(`    • Sample Size: ${markov.sampleSize} transitions`);
        console.log(`    • Convergence Score: ${(markov.convergenceScore * 100).toFixed(1)}%`);
      }
      
      // Show LLN confidence
      if (decision.llnConfidence !== undefined) {
        console.log(`\n  📊 Law of Large Numbers Confidence: ${(decision.llnConfidence * 100).toFixed(1)}%`);
        if (decision.llnConfidence < 0.3) {
          console.log('    ⚠️ Low confidence - more data needed for reliable predictions');
        } else if (decision.llnConfidence < 0.7) {
          console.log('    📈 Moderate confidence - predictions improving with data');
        } else {
          console.log('    ✅ High confidence - predictions are statistically reliable');
        }
      }
      
      // Simulate Markov chain evolution
      console.log('\n  🎲 Running Markov Chain Simulation (5 chains):');
      const intelligence = marketIntelligence.getMarketIntelligence(symbol);
      const currentPrice = await realMarketData.getCurrentPrice(symbol);
      
      if (intelligence) {
        const ensemblePredictions = markovPredictor.evaluateChains(5);
        const topStates = Array.from(ensemblePredictions.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);
        
        console.log('    Top 3 predicted states:');
        topStates.forEach(([state, prob]) => {
          console.log(`      • ${state}: ${(prob * 100).toFixed(1)}%`);
        });
      }
    }
    
    // Show how the system improves over time
    console.log('\n' + '═'.repeat(60));
    console.log('💡 How the System Gets Smarter:\n');
    console.log('1. Law of Large Numbers (LLN):');
    console.log('   • Each trade adds to our sample size');
    console.log('   • Confidence intervals tighten as √n increases');
    console.log('   • Predictions converge to true probabilities');
    console.log('   • Currently need ' + initialMetrics.recommendedMinTrades + ' more trades for full convergence');
    
    console.log('\n2. Markov Chain Learning:');
    console.log('   • Tracks state transitions (e.g., sideways → breakout)');
    console.log('   • Updates transition probabilities with each outcome');
    console.log('   • Identifies patterns in market regime changes');
    console.log('   • Ensemble predictions reduce single-path bias');
    
    console.log('\n3. Adaptive Improvements:');
    console.log('   • Low confidence → conservative positions');
    console.log('   • High confidence → optimal Kelly sizing');
    console.log('   • Continuous model updates every trade');
    console.log('   • Persistent storage preserves learning');
    
    // Save the model
    console.log('\n💾 Saving Markov model to disk...');
    await saveMarkovModel();
    console.log('✅ Model saved successfully');
    
    // Final metrics
    const finalMetrics = markovPredictor.getLLNConfidenceMetrics();
    console.log('\n📊 Final Metrics:');
    console.log(`  • Convergence Status: ${finalMetrics.convergenceStatus}`);
    console.log(`  • Overall Reliability: ${(finalMetrics.overallReliability * 100).toFixed(1)}%`);
    
    console.log('\n✅ Markov chain integration test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run the test
testMarkovIntegration().then(() => {
  console.log('\n👋 Test complete. Exiting...');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});