import { alpacaPaperTradingService } from './src/lib/alpaca-paper-trading-service';

async function checkTradingActivity() {
  console.log('📊 CHECKING TRADING ACTIVITY\n');
  
  // Wait for service initialization
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    // Get account info
    const account = await alpacaPaperTradingService.getAccountInfo();
    console.log('💰 ACCOUNT STATUS:');
    console.log(`   Equity: $${parseFloat(account.equity).toLocaleString()}`);
    console.log(`   Cash: $${parseFloat(account.cash).toLocaleString()}`);
    console.log(`   Buying Power: $${parseFloat(account.buying_power).toLocaleString()}`);
    
    // Get positions
    console.log('\n📈 CURRENT POSITIONS:');
    const positions = await alpacaPaperTradingService.getPositions();
    if (positions.length > 0) {
      positions.forEach(pos => {
        const pl = pos.unrealizedPl > 0 ? '+' : '';
        console.log(`   ${pos.symbol}: ${pos.qty} @ $${pos.currentPrice.toFixed(2)} (P/L: ${pl}$${pos.unrealizedPl.toFixed(2)})`);
      });
    } else {
      console.log('   No open positions');
    }
    
    // Get recent orders
    console.log('\n📋 RECENT ORDERS (Last 10):');
    const orders = await alpacaPaperTradingService.getOrders({ 
      status: 'all', 
      limit: 10,
      direction: 'desc' 
    });
    
    if (orders && orders.length > 0) {
      orders.forEach(order => {
        const time = new Date(order.submittedAt).toLocaleString();
        const price = order.limitPrice ? `$${order.limitPrice}` : 'market';
        console.log(`   ${time}: ${order.side.toUpperCase()} ${order.qty} ${order.symbol} @ ${price} - ${order.status}`);
      });
    } else {
      console.log('   No recent orders');
    }
    
    // Check for today's activity
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = orders ? orders.filter(o => new Date(o.submittedAt) >= today) : [];
    
    console.log('\n📅 TODAY\'S ACTIVITY:');
    console.log(`   Orders placed today: ${todayOrders.length}`);
    if (todayOrders.length > 0) {
      console.log('   ✅ System is actively trading!');
    } else {
      console.log('   ⚠️  No trades executed today');
      console.log('   Note: Strategies may be waiting for proper market conditions');
    }
    
  } catch (error: any) {
    console.error('❌ Error checking trading activity:', error.message);
  }
}

checkTradingActivity().catch(console.error);