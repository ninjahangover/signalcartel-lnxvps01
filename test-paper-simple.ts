import { paperTradingEngine } from './src/lib/paper-trading-engine';

async function testPaperTrading() {
    console.log('🧪 Paper Trading Test Starting...');
    
    // Check initial state
    const account = paperTradingEngine.getAccount();
    console.log('📊 Account Status:', {
        balance: `$${account.totalBalance.toFixed(2)}`,
        available: `$${account.availableBalance.toFixed(2)}`,
        positions: account.positions.length,
        trades: account.trades.length,
        isRunning: paperTradingEngine.isRunning()
    });

    // Start paper trading if not running
    if (!paperTradingEngine.isRunning()) {
        console.log('🚀 Starting paper trading...');
        await paperTradingEngine.startAITrading(['BTCUSD']);
        console.log('✅ Paper trading started');
    } else {
        console.log('✅ Paper trading already running');
    }

    // Monitor for 20 seconds
    console.log('⏱️ Monitoring for 20 seconds...');
    let counter = 0;
    const interval = setInterval(() => {
        counter++;
        const currentAccount = paperTradingEngine.getAccount();
        console.log(`Check ${counter}: Balance $${currentAccount.totalBalance.toFixed(2)}, Positions: ${currentAccount.positions.length}, Trades: ${currentAccount.trades.length}`);
        
        if (counter >= 4) { // 20 seconds
            clearInterval(interval);
            console.log('🏁 Test complete');
            process.exit(0);
        }
    }, 5000);
}

testPaperTrading().catch(console.error);