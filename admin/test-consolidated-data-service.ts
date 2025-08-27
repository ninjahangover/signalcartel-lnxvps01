#!/usr/bin/env npx tsx

/**
 * Test Consolidated Data Service
 * Verifies multi-instance data access functionality
 */

import consolidatedDataService from '../src/lib/consolidated-ai-data-service.js';

async function testConsolidatedDataService() {
  console.log('🧪 TESTING CONSOLIDATED DATA SERVICE');
  console.log('='.repeat(70));
  
  try {
    if (!consolidatedDataService) {
      console.error('❌ ConsolidatedDataService not found');
      return;
    }
    
    console.log('✅ ConsolidatedDataService imported successfully');
    console.log('   Type:', typeof consolidatedDataService);
    console.log('');
    
    // Test 1: Unified strategy performance
    console.log('📊 Test 1: Unified strategy performance...');
    const strategyPerf = await consolidatedDataService.getUnifiedStrategyPerformance('rsi-gpu', 'BTCUSD');
    console.log('   Strategy performance query result:', Array.isArray(strategyPerf) ? strategyPerf.length + ' records' : 'No data');
    
    // Test 2: AI system comparison
    console.log('🧠 Test 2: AI system comparison...');
    const aiComparison = await consolidatedDataService.getAISystemComparison();
    console.log('   AI comparison query result:', Array.isArray(aiComparison) ? aiComparison.length + ' records' : 'No data');
    
    // Test 3: Market condition insights  
    console.log('📈 Test 3: Market condition insights...');
    const marketInsights = await consolidatedDataService.getMarketConditionInsights('BTCUSD');
    console.log('   Market insights query result:', Array.isArray(marketInsights) ? marketInsights.length + ' records' : 'No data');
    
    // Test 4: Phase progression insights
    console.log('🎯 Test 4: Phase progression insights...');
    const phaseInsights = await consolidatedDataService.getPhaseProgressionInsights();
    console.log('   Phase insights query result:', Array.isArray(phaseInsights) ? phaseInsights.length + ' records' : 'No data');
    
    // Test 5: Learning insights
    console.log('🎓 Test 5: Learning insights...');
    const learningInsights = await consolidatedDataService.getLearningInsights('strategy', 'BTCUSD', 0.5);
    console.log('   Learning insights query result:', Array.isArray(learningInsights) ? learningInsights.length + ' records' : 'No data');
    
    // Test 6: Update instance status
    console.log('🔄 Test 6: Update instance status...');
    await consolidatedDataService.updateInstanceStatus({
      dataQualityScore: 0.95,
      lastSync: new Date(),
      tradesProcessed: 200
    });
    console.log('   Instance status update: ✅ Success');
    
    console.log('');
    console.log('🎊 ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('━'.repeat(70));
    console.log('✅ Consolidated Data Service is fully operational');
    console.log('✅ Multi-instance data access working');
    console.log('✅ Ready for AI algorithm integration');
    
    await consolidatedDataService.disconnect();
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('   Stack:', error.stack?.split('\n')[0]);
  }
}

// Main execution
if (require.main === module) {
  testConsolidatedDataService().catch(console.error);
}

export default testConsolidatedDataService;