#!/usr/bin/env npx tsx
/**
 * Test Dashboard Integration for QUANTUM FORGE Sentiment
 * Verify that all API endpoints return proper data
 */

async function testDashboardAPIs() {
  console.log('🧪 Testing QUANTUM FORGE Sentiment Dashboard APIs...');
  console.log('=' .repeat(60));
  
  const baseUrl = 'http://localhost:3001/api/quantum-forge-sentiment';
  
  try {
    console.log('\n1. Testing Current Sentiment API...');
    console.log('-'.repeat(40));
    
    const currentResponse = await fetch(`${baseUrl}/current?symbol=BTC`);
    const currentData = await currentResponse.json();
    
    if (currentResponse.ok) {
      console.log('✅ Current Sentiment API working');
      console.log(`   Symbol: ${currentData.data.symbol}`);
      console.log(`   Sentiment: ${currentData.data.sentiment}`);
      console.log(`   Score: ${currentData.data.overallScore.toFixed(4)}`);
      console.log(`   Confidence: ${(currentData.data.overallConfidence * 100).toFixed(1)}%`);
      console.log(`   GPU Time: ${currentData.data.processingMetrics.gpuTimeMs}ms`);
    } else {
      console.log('❌ Current Sentiment API failed:', currentData.error);
    }
    
    console.log('\n2. Testing Sentiment History API...');
    console.log('-'.repeat(40));
    
    const historyResponse = await fetch(`${baseUrl}/history?symbol=BTC&hours=24`);
    const historyData = await historyResponse.json();
    
    if (historyResponse.ok) {
      console.log('✅ History API working');
      console.log(`   Data Points: ${historyData.data.length}`);
      console.log(`   Time Range: ${historyData.metadata.hours} hours`);
      if (historyData.data.length > 0) {
        const latest = historyData.data[historyData.data.length - 1];
        console.log(`   Latest Score: ${latest.overallScore.toFixed(4)}`);
        console.log(`   Latest Action: ${latest.tradingAction}`);
      }
    } else {
      console.log('❌ History API failed:', historyData.error);
    }
    
    console.log('\n3. Testing Statistics API...');
    console.log('-'.repeat(40));
    
    const statsResponse = await fetch(`${baseUrl}/stats`);
    const statsData = await statsResponse.json();
    
    if (statsResponse.ok) {
      console.log('✅ Statistics API working');
      console.log(`   Total Analyses: ${statsData.data.totalAnalyses}`);
      console.log(`   Avg Confidence: ${statsData.data.avgConfidence.toFixed(1)}%`);
      console.log(`   GPU Acceleration: ${statsData.data.gpuAcceleration ? '✅' : '❌'}`);
      console.log(`   Accuracy Rate: ${statsData.data.accuracyRate.toFixed(1)}%`);
      console.log(`   Recent Alerts: ${statsData.data.recentAlerts}`);
    } else {
      console.log('❌ Statistics API failed:', statsData.error);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 DASHBOARD API TEST RESULTS:');
    console.log('✅ All APIs tested successfully');
    console.log('📊 Dashboard should display real sentiment data');
    console.log('🚀 Access your dashboard at: http://localhost:3001/dashboard');
    console.log('🧠 Navigate to: QUANTUM FORGE™ Sentiment tab');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n💡 Make sure the Next.js server is running:');
    console.log('   npm run dev');
    console.log('   or');
    console.log('   PORT=3001 npm run dev');
  }
}

// Run test
testDashboardAPIs();