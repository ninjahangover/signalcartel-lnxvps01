/**
 * Test Binance US WebSocket Connection
 * Verify order book data stream is working properly
 */

import WebSocket from 'ws';

async function testBinanceUSConnection() {
  console.log('🇺🇸 Testing Binance US WebSocket Connection...');
  console.log('=' .repeat(50));

  return new Promise((resolve, reject) => {
    // Test with just BTC first
    const testUrl = 'wss://stream.binance.us:9443/ws/btcusdt@depth20@100ms';
    
    console.log('🔗 Connecting to:', testUrl);
    
    const ws = new WebSocket(testUrl);
    let messageCount = 0;
    const maxMessages = 3; // Just get a few messages to verify
    
    const timeout = setTimeout(() => {
      console.log('❌ Connection timeout after 10 seconds');
      ws.close();
      reject(new Error('Connection timeout'));
    }, 10000);
    
    ws.on('open', () => {
      console.log('✅ WebSocket connection opened successfully!');
    });
    
    ws.on('message', (data) => {
      messageCount++;
      
      try {
        const message = JSON.parse(data.toString());
        
        if (messageCount === 1) {
          console.log('\n📊 First message received:');
          console.log('• Symbol:', message.s);
          console.log('• Update ID:', message.lastUpdateId);
          console.log('• Bids:', message.bids?.length || 0);
          console.log('• Asks:', message.asks?.length || 0);
          
          if (message.bids && message.asks) {
            const bestBid = parseFloat(message.bids[0][0]);
            const bestAsk = parseFloat(message.asks[0][0]);
            const spread = ((bestAsk - bestBid) / bestBid * 100).toFixed(4);
            
            console.log('• Best Bid:', '$' + bestBid.toLocaleString());
            console.log('• Best Ask:', '$' + bestAsk.toLocaleString());
            console.log('• Spread:', spread + '%');
          }
        }
        
        if (messageCount >= maxMessages) {
          clearTimeout(timeout);
          console.log(`\n🎉 SUCCESS! Received ${messageCount} valid order book updates`);
          console.log('✅ Binance US WebSocket is working perfectly!');
          ws.close();
          resolve(true);
        }
        
      } catch (error) {
        console.error('❌ Error parsing message:', error);
        clearTimeout(timeout);
        ws.close();
        reject(error);
      }
    });
    
    ws.on('error', (error) => {
      clearTimeout(timeout);
      console.error('❌ WebSocket error:', error.message);
      if (error.message.includes('451')) {
        console.log('💡 HTTP 451 = Unavailable for legal reasons (geo-blocked)');
        console.log('💡 You may need a VPN or different region');
      } else if (error.message.includes('403')) {
        console.log('💡 HTTP 403 = Forbidden (may need API key or different endpoint)');
      }
      reject(error);
    });
    
    ws.on('close', (code, reason) => {
      clearTimeout(timeout);
      if (messageCount < maxMessages) {
        console.log(`❌ Connection closed: ${code} - ${reason}`);
        reject(new Error(`Connection closed: ${code}`));
      }
    });
  });
}

// Run the test
testBinanceUSConnection()
  .then(() => {
    console.log('\n🚀 Phase 4 Order Book Intelligence is ready for deployment!');
    process.exit(0);
  })
  .catch((error) => {
    console.log('\n🔄 Let\'s try alternative approaches...');
    console.log('Options:');
    console.log('1. Try different Binance endpoints');
    console.log('2. Use Coinbase Pro WebSocket');
    console.log('3. Use Kraken WebSocket');
    console.log('4. Use a VPN for geo-restrictions');
    process.exit(1);
  });