#!/usr/bin/env tsx

async function testAPIRoute() {
  try {
    console.log('🧪 Testing multi-source-sentiment API route...');
    
    const response = await fetch('http://localhost:3001/api/multi-source-sentiment?symbol=BTC');
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response successful!');
      console.log('Success:', data.success);
      console.log('Sources:', data.data?.sources?.length || 0);
      console.log('Total data points:', data.data?.summary?.totalDataPoints || 0);
    } else {
      console.log('❌ API Response failed');
      const text = await response.text();
      console.log('Response:', text.substring(0, 200) + '...');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAPIRoute().catch(console.error);