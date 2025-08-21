/**
 * Force Test Trade Script
 * 
 * Immediately executes a small test trade through Alpaca Paper Trading
 * to verify the trading pipeline is working
 */

import { alpacaPaperTradingService } from './src/lib/alpaca-paper-trading-service';

async function forceTestTrade() {
  console.log('🧪 FORCE TEST TRADE - Alpaca Paper Trading\n');
  
  try {
    // Initialize and check connection
    console.log('📡 Connecting to Alpaca...');
    const account = await alpacaPaperTradingService.getAccountInfo();
    
    if (!account) {
      throw new Error('Cannot connect to Alpaca. Check API credentials.');
    }
    
    console.log('✅ Connected to Alpaca Paper Trading');
    console.log(`   Account: ${account.id}`);
    console.log(`   Buying Power: $${parseFloat(account.buying_power).toLocaleString()}`);
    console.log(`   Cash: $${parseFloat(account.cash).toLocaleString()}\n`);
    
    // Check current positions
    console.log('📊 Checking current positions...');
    const positions = await alpacaPaperTradingService.getPositions();
    console.log(`   Current positions: ${positions.length}`);
    
    if (positions.length > 0) {
      positions.forEach(pos => {
        console.log(`   - ${pos.symbol}: ${pos.qty} shares @ $${pos.currentPrice}`);
      });
    }
    
    // Execute a small test trade
    console.log('\n🎯 Executing test trade...');
    const testOrder = {
      symbol: 'BTCUSD',     // Bitcoin - perfect for crypto trading platform
      qty: 0.0001,          // Small fraction of BTC (about $10-15 worth)
      side: 'buy' as const,
      type: 'market' as const,
      time_in_force: 'gtc' as const  // Crypto requires 'gtc' (good till cancelled), not 'day'
    };
    
    console.log(`   Order: BUY ${testOrder.qty} ${testOrder.symbol} (market order)`);
    
    try {
      const order = await alpacaPaperTradingService.placeOrder({
        symbol: testOrder.symbol,
        qty: testOrder.qty,
        side: testOrder.side,
        type: testOrder.type,
        timeInForce: testOrder.time_in_force
      });
      
      if (order) {
        console.log('\n✅ TEST TRADE SUCCESSFUL!');
        console.log(`   Order ID: ${order.id}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Symbol: ${order.symbol}`);
        console.log(`   Quantity: ${order.qty}`);
        console.log(`   Side: ${order.side}`);
        console.log(`   Type: ${order.orderType}`);
        
        // Wait a moment for order to process
        console.log('\n⏳ Waiting for order to fill...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check order status
        const orders = await alpacaPaperTradingService.getOrders({ 
          status: 'all', 
          limit: 1 
        });
        
        if (orders && orders.length > 0) {
          const latestOrder = orders[0];
          console.log(`\n📋 Order Status: ${latestOrder.status}`);
          if (latestOrder.filledQty) {
            console.log(`   Filled Quantity: ${latestOrder.filledQty}`);
            console.log(`   Filled Price: $${latestOrder.filledAvgPrice}`);
          }
        }
        
        console.log('\n🎉 Trading pipeline verified! The system can execute trades successfully.');
        
        // Optional: Close the position immediately
        console.log('\n🔄 Closing test position...');
        const closeOrder = await alpacaPaperTradingService.placeOrder({
          symbol: testOrder.symbol,
          qty: testOrder.qty,
          side: 'sell',
          type: 'market',
          timeInForce: 'gtc'  // Crypto requires 'gtc'
        });
        
        if (closeOrder) {
          console.log('✅ Test position closed');
          console.log(`   Close Order ID: ${closeOrder.id}`);
        }
        
      } else {
        console.log('❌ Order placement failed - check error messages above');
      }
      
    } catch (orderError: any) {
      console.error('❌ Order execution failed:', orderError.message);
      console.log('\nPossible issues:');
      console.log('  1. Market might be closed (try during market hours)');
      console.log('  2. Insufficient buying power');
      console.log('  3. Symbol not tradeable on Alpaca');
      console.log('\nTry with a different symbol or during market hours.');
    }
    
    // Show final account status
    console.log('\n📊 Final Account Status:');
    const finalAccount = await alpacaPaperTradingService.getAccountInfo();
    console.log(`   Equity: $${parseFloat(finalAccount.equity).toLocaleString()}`);
    console.log(`   Buying Power: $${parseFloat(finalAccount.buying_power).toLocaleString()}`);
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('  1. Check .env for ALPACA_PAPER_API_KEY and ALPACA_PAPER_API_SECRET');
    console.log('  2. Verify API keys at https://app.alpaca.markets/paper/dashboard/overview');
    console.log('  3. Ensure you are using Paper Trading keys, not Live Trading');
  }
}

// Run the test
console.log('Starting forced test trade...\n');
forceTestTrade().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});