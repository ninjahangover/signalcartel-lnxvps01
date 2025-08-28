import { quantumForgeMultiLayerAI } from './src/lib/quantum-forge-multi-layer-ai';

async function testAIConfidence() {
  console.log('🧪 Testing AI Confidence Calculation...\n');
  
  const testSignal = {
    action: 'BUY' as const,
    confidence: 0.75,
    symbol: 'BTCUSD',
    price: 111000,
    timestamp: new Date()
  };
  
  try {
    console.log('📊 Input signal:', testSignal);
    
    const result = await quantumForgeMultiLayerAI.enhanceSignalWithMultiLayerAI(testSignal, {
      technicalWeight: 0.4,
      sentimentWeight: 0.35,
      orderBookWeight: 0.25,
      minConsensus: 70,
      skipOnConflict: false
    });
    
    console.log('\n✅ Result received:');
    console.log('  - Confidence:', result.confidence);
    console.log('  - Final Decision:', result.finalDecision);
    console.log('  - Full result:', JSON.stringify(result, null, 2));
    
    if (result.confidence === undefined || isNaN(result.confidence)) {
      console.log('\n❌ PROBLEM FOUND: Confidence is undefined or NaN!');
      console.log('This is why the trading engine shows NaN% confidence.');
    } else {
      console.log('\n✅ Confidence calculation working: ' + (result.confidence * 100).toFixed(1) + '%');
    }
    
  } catch (error) {
    console.log('❌ Error testing AI confidence:', error);
  }
  
  process.exit(0);
}

testAIConfidence();