#!/usr/bin/env tsx
/**
 * Test Multi-Source Sentiment API Endpoint
 */

async function testMultiSourceAPI() {
  console.log('🧪 Testing new multi-source sentiment API endpoint...');

  try {
    const response = await fetch('http://localhost:3001/api/multi-source-sentiment?symbol=BTC');

    if (response.ok) {
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ API Response received successfully!');
        console.log('');
        console.log('📊 SUMMARY:');
        console.log('   Total Sources:', data.data.summary.totalSources);
        console.log('   Total Data Points:', data.data.summary.totalDataPoints);
        console.log('   Overall Score:', data.data.summary.overallScore.toFixed(3));
        console.log('   Overall Confidence:', (data.data.summary.overallConfidence * 100).toFixed(1) + '%');
        console.log('');
        console.log('🎯 SOURCES BREAKDOWN:');
        data.data.sources.forEach((source: any, index: number) => {
          console.log('   ' + (index + 1).toString().padStart(2, ' ') + '. ' + source.icon + ' ' + source.name);
          console.log('       Score: ' + source.score.toFixed(3) + ' (' + source.sentiment + ')');
          console.log('       Weight: ' + source.weight.toFixed(1) + 'x, Data Points: ' + source.dataPoints);
          console.log('       Sample: "' + source.sampleText.substring(0, 50) + '..."');
          console.log('');
        });
        
        console.log('🎉 API endpoint working perfectly for dashboard integration!');
      } else {
        console.error('❌ API returned error:', data.error);
      }
    } else {
      console.error('❌ HTTP error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testMultiSourceAPI().catch(console.error);