import { alpacaPaperTradingService } from './src/lib/alpaca-paper-trading-service';

async function testAlpacaConnection() {
  console.log('🔍 Testing Alpaca Paper Trading Service...\n');
  
  const service = alpacaPaperTradingService;
  
  // Check if API credentials are configured
  const hasKey = process.env.ALPACA_PAPER_API_KEY || process.env.NEXT_PUBLIC_ALPACA_PAPER_API_KEY;
  const hasSecret = process.env.ALPACA_PAPER_API_SECRET || process.env.NEXT_PUBLIC_ALPACA_PAPER_API_SECRET;
  
  console.log('Environment Check:');
  console.log('  API Key configured:', hasKey ? '✅ Yes' : '❌ No');
  console.log('  API Secret configured:', hasSecret ? '✅ Yes' : '❌ No');
  
  if (!hasKey || !hasSecret) {
    console.log('\n❌ Alpaca API credentials not found in environment');
    console.log('Please set the following environment variables:');
    console.log('  - ALPACA_PAPER_API_KEY');
    console.log('  - ALPACA_PAPER_API_SECRET');
    console.log('\nYou can get these from: https://app.alpaca.markets/paper/dashboard/overview');
    return;
  }
  
  // Try to get account info
  console.log('\n📡 Attempting to connect to Alpaca...');
  try {
    const accountInfo = await service.getAccountInfo();
    if (accountInfo) {
      console.log('\n✅ Alpaca connection successful!');
      console.log('\nAccount Details:');
      console.log('  Account ID:', accountInfo.id);
      console.log('  Status:', accountInfo.status);
      console.log('  Pattern Day Trader:', accountInfo.pattern_day_trader);
      console.log('\nBalance Information:');
      console.log('  Buying Power: $' + parseFloat(accountInfo.buying_power).toLocaleString());
      console.log('  Cash: $' + parseFloat(accountInfo.cash).toLocaleString());
      console.log('  Portfolio Value: $' + parseFloat(accountInfo.portfolio_value).toLocaleString());
      console.log('  Equity: $' + parseFloat(accountInfo.equity).toLocaleString());
      
      // Check positions
      console.log('\n📊 Checking positions...');
      const positions = await service.getPositions();
      console.log('  Active positions:', positions.length);
      if (positions.length > 0) {
        positions.forEach(pos => {
          console.log(`    - ${pos.symbol}: ${pos.qty} shares @ $${pos.currentPrice}`);
        });
      }
      
      // Check recent orders
      console.log('\n📋 Checking recent orders...');
      const orders = await service.getOrders({ status: 'all', limit: 5 });
      console.log('  Recent orders:', orders.length);
      if (orders.length > 0) {
        orders.forEach(order => {
          console.log(`    - ${order.symbol}: ${order.side} ${order.qty} @ $${order.limitPrice || 'market'} (${order.status})`);
        });
      }
      
      console.log('\n🎉 Alpaca Paper Trading is ready for use!');
      
    } else {
      console.log('\n❌ Could not retrieve account information from Alpaca');
    }
  } catch (error: any) {
    console.log('\n❌ Alpaca connection failed:', error.message);
    console.log('\nPossible issues:');
    console.log('  1. Invalid API credentials');
    console.log('  2. Network connectivity issues');
    console.log('  3. Alpaca service temporarily unavailable');
    console.log('\nPlease verify your credentials at: https://app.alpaca.markets/paper/dashboard/overview');
  }
}

// Run the test
testAlpacaConnection().catch(console.error);