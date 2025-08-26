/**
 * Test Position Management System
 * Demonstrates realistic trading scenarios with proper position lifecycle
 */

import { StrategyIntegration } from './src/lib/position-management/strategy-integration';
import { positionService } from './src/lib/position-management/position-service';

async function testPositionManagement() {
  console.log('🚀 TESTING POSITION MANAGEMENT SYSTEM');
  console.log('=====================================\n');
  
  try {
    // Start position monitoring in background
    StrategyIntegration.startPositionMonitoring();
    
    console.log('📊 Initial Portfolio Status:');
    let portfolio = await StrategyIntegration.getPortfolioStatus();
    console.log(`  Open Positions: ${portfolio.openPositions}`);
    console.log(`  Closed Positions: ${portfolio.closedPositions}`);
    console.log(`  Total P&L: $${portfolio.totalPnL.toFixed(2)}\n`);
    
    // Test 1: RSI Strategy - Oversold BTC
    console.log('🎯 TEST 1: RSI Strategy - Oversold BTC');
    await StrategyIntegration.processRSISignal('BTCUSD', 25, 64000); // Strong oversold signal
    
    await delay(1000);
    
    // Test 2: Bollinger Bands - Price below lower band
    console.log('🎯 TEST 2: Bollinger Bands Strategy - ETH below lower band');
    await StrategyIntegration.processBollingerSignal('ETHUSD', 2300, 2600, 2300, 2450);
    
    await delay(1000);
    
    // Test 3: Neural Network - Strong buy prediction
    console.log('🎯 TEST 3: Neural Network Strategy - Strong BUY prediction for SOL');
    await StrategyIntegration.processNeuralSignal('SOLUSD', 145, 0.75, 0.88); // 75% upward prediction with 88% confidence
    
    await delay(1000);
    
    // Test 4: Quantum Oscillator - Oversold with positive momentum
    console.log('🎯 TEST 4: Quantum Oscillator - ADA oversold with momentum');
    await StrategyIntegration.processQuantumSignal('ADAUSD', 0.48, -65, 0.3); // Oversold with positive momentum
    
    await delay(2000);
    
    console.log('\\n📊 Portfolio Status After Opening Positions:');
    portfolio = await StrategyIntegration.getPortfolioStatus();
    console.log(`  Open Positions: ${portfolio.openPositions}`);
    console.log(`  Total Unrealized P&L: $${portfolio.totalUnrealizedPnL.toFixed(2)}`);
    console.log(`  Win Rate: ${portfolio.winRate.toFixed(1)}%\\n`);
    
    // Simulate price movements and position closures
    console.log('📈 SIMULATING PRICE MOVEMENTS...');
    
    // Test 5: RSI Reversal Signal - Should close BTC position
    console.log('🔄 TEST 5: RSI Overbought - Should trigger position closure');
    await StrategyIntegration.processRSISignal('BTCUSD', 75, 65500); // Price moved up, RSI now overbought
    
    await delay(1000);
    
    // Test 6: Neural Network reversal
    console.log('🔄 TEST 6: Neural Network SELL signal - Should close SOL position');  
    await StrategyIntegration.processNeuralSignal('SOLUSD', 148, -0.6, 0.82); // Now predicting downward movement
    
    await delay(2000);
    
    console.log('\\n📊 Final Portfolio Status:');
    portfolio = await StrategyIntegration.getPortfolioStatus();
    console.log(`  Open Positions: ${portfolio.openPositions}`);
    console.log(`  Closed Positions: ${portfolio.closedPositions}`);
    console.log(`  Total Realized P&L: $${portfolio.totalRealizedPnL.toFixed(2)}`);
    console.log(`  Total Unrealized P&L: $${portfolio.totalUnrealizedPnL.toFixed(2)}`);
    console.log(`  Combined P&L: $${portfolio.totalPnL.toFixed(2)}`);
    console.log(`  Win Rate: ${portfolio.winRate.toFixed(1)}%`);
    console.log(`  Winning Trades: ${portfolio.winningTrades}/${portfolio.totalTrades}\\n`);
    
    // Show detailed position information
    if (portfolio.openPositionsDetail && portfolio.openPositionsDetail.length > 0) {
      console.log('📋 OPEN POSITIONS:');
      portfolio.openPositionsDetail.forEach(pos => {
        console.log(`  ${pos.side.toUpperCase()} ${pos.quantity.toFixed(4)} ${pos.symbol} @ $${pos.entryPrice} (${pos.strategy})`);
        console.log(`    Unrealized P&L: $${(pos.unrealizedPnL || 0).toFixed(2)}`);
        if (pos.stopLoss) console.log(`    Stop Loss: $${pos.stopLoss.toFixed(2)}`);
        if (pos.takeProfit) console.log(`    Take Profit: $${pos.takeProfit.toFixed(2)}`);
      });
      console.log();
    }
    
    if (portfolio.recentClosedPositions && portfolio.recentClosedPositions.length > 0) {
      console.log('🏁 RECENTLY CLOSED POSITIONS:');
      portfolio.recentClosedPositions.forEach(pos => {
        const pnlDisplay = pos.realizedPnL ? (pos.realizedPnL >= 0 ? `+$${pos.realizedPnL.toFixed(2)}` : `-$${Math.abs(pos.realizedPnL).toFixed(2)}`) : '$0.00';
        console.log(`  ${pos.side.toUpperCase()} ${pos.quantity.toFixed(4)} ${pos.symbol}: ${pos.entryPrice} → ${pos.exitPrice} = ${pnlDisplay} (${pos.strategy})`);
      });
      console.log();
    }
    
    console.log('✅ POSITION MANAGEMENT SYSTEM TEST COMPLETED');
    console.log('===========================================');
    
    // Test the new portfolio API
    console.log('\\n🌐 Testing Position-Managed Portfolio API...');
    const apiResponse = await fetch('http://localhost:3001/api/position-management/portfolio');
    
    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      console.log('✅ Position-managed portfolio API working:');
      console.log(`  Total Value: $${apiData.data.totalValue.toLocaleString()}`);
      console.log(`  Available Balance: $${apiData.data.availableBalance.toLocaleString()}`);
      console.log(`  Realized P&L: $${apiData.data.realizedPnL}`);
      console.log(`  Unrealized P&L: $${apiData.data.unrealizedPnL}`);
      console.log(`  Win Rate: ${apiData.data.performance.winRate}%`);
      console.log(`  Open Positions: ${apiData.data.positions.length}`);
    } else {
      console.log('❌ Portfolio API test failed - container may not be running');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Cleanup
    await positionService.disconnect();
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the test
testPositionManagement();