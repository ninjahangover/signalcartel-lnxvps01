// Quick test of Neural Predictor integration (CommonJS for easier execution)

console.log('🧠 Testing Stratus Neural Predictor™...\n');

async function testNeuralPredictor() {
  try {
    // Test 1: Check if Markov predictor loads
    console.log('📊 Test 1: Loading Neural Predictor core...');
    const { markovPredictor } = require('./src/lib/markov-chain-predictor');
    console.log('✅ Neural Predictor core loaded');
    
    // Test 2: Get LLN metrics
    console.log('\n📊 Test 2: Checking Law of Large Numbers metrics...');
    const metrics = markovPredictor.getLLNConfidenceMetrics();
    console.log(`✅ Convergence Status: ${metrics.convergenceStatus}`);
    console.log(`✅ Neural Confidence: ${(metrics.overallReliability * 100).toFixed(1)}%`);
    console.log(`✅ Evolution Points Needed: ${metrics.recommendedMinTrades}`);
    
    // Test 3: Check model persistence
    console.log('\n📊 Test 3: Testing model persistence...');
    const { initializeMarkovPersistence } = require('./src/lib/markov-model-persistence');
    await initializeMarkovPersistence();
    console.log('✅ Model persistence initialized');
    
    // Test 4: Check Stratus Engine integration
    console.log('\n📊 Test 4: Testing Stratus Engine integration...');
    const { stratusEngine } = require('./src/lib/stratus-engine-ai');
    const performance = stratusEngine.getPerformance();
    console.log(`✅ Stratus Engine active - ${performance.totalTrades} trades processed`);
    console.log(`✅ AI Learning iterations: ${performance.learningIterations}`);
    
    console.log('\n🎉 SUCCESS: All Neural Predictor components working!');
    console.log('\n📈 Neural Predictor Status:');
    console.log(`   🧠 Learning Stage: ${metrics.convergenceStatus}`);
    console.log(`   🎯 Confidence: ${(metrics.overallReliability * 100).toFixed(1)}%`);
    
    if (metrics.recommendedMinTrades > 0) {
      console.log(`   🚀 Need ${metrics.recommendedMinTrades} more trades to level up!`);
    } else {
      console.log('   ⭐ Fully evolved - maximum prediction power!');
    }
    
  } catch (error) {
    console.error('❌ Neural Predictor test failed:', error.message);
    console.log('\n🔧 This might indicate:');
    console.log('   - TypeScript compilation issues');
    console.log('   - Missing dependencies');
    console.log('   - File path problems');
  }
}

testNeuralPredictor().then(() => {
  console.log('\n✨ Neural Predictor test complete!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test crashed:', error.message);
  process.exit(1);
});