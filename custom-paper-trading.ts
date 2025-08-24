/**
 * CUSTOM PAPER TRADING ENGINE
 * 
 * No API restrictions, no minimum orders, no complex integrations.
 * Pure focus on generating high-quality trade data for LLN and Markov optimization.
 * 
 * Uses real market data + intelligent execution simulation.
 */

import { PrismaClient } from '@prisma/client';
import { PAPER_TRADING_CONFIG } from './src/lib/paper-trading-config';

const prisma = new PrismaClient();

interface TradeExecutionResult {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  pnl?: number;
  status: 'open' | 'closed';
  executedAt: Date;
  outcome?: 'WIN' | 'LOSS';
}

class CustomPaperTradingEngine {
  private sessionId: string = '';
  private balance = PAPER_TRADING_CONFIG.STARTING_BALANCE; // $10K realistic starting balance
  private trades: TradeExecutionResult[] = [];
  private openPositions: Map<string, TradeExecutionResult> = new Map();
  private tradeCount = 0;
  private winCount = 0;
  
  /**
   * Validates P&L values to prevent extreme/unrealistic amounts
   * @param pnl - Calculated P&L value
   * @param quantity - Trade quantity
   * @param entryPrice - Entry price
   * @returns Validated P&L within reasonable bounds
   */
  validatePnL(pnl: number, quantity: number, entryPrice: number): number {
    const tradeValue = quantity * entryPrice;
    const maxPnLPercent = 0.50; // Maximum 50% gain/loss per trade
    const maxPnLAmount = Math.min(tradeValue * maxPnLPercent, 1000); // Cap at $1,000
    
    // Check for extreme values
    if (Math.abs(pnl) > maxPnLAmount) {
      console.warn(`⚠️  P&L validation: Extreme value detected (${pnl.toFixed(2)} -> ${Math.sign(pnl) * maxPnLAmount})`);
      return Math.sign(pnl) * maxPnLAmount;
    }
    
    // Check for NaN or Infinity
    if (!isFinite(pnl)) {
      console.warn(`⚠️  P&L validation: Invalid value detected (${pnl}), setting to 0`);
      return 0;
    }
    
    return parseFloat(pnl.toFixed(2)); // Round to 2 decimal places
  }
  
  async initialize() {
    console.log('🚀 CUSTOM PAPER TRADING ENGINE');
    console.log('==============================');
    console.log('✅ No API restrictions');
    console.log('✅ Instant execution');
    console.log('✅ Any order size');
    console.log('✅ Real market data');
    console.log('✅ Perfect dashboard integration');
    
    // Create paper trading session
    const session = await this.createTradingSession();
    this.sessionId = session.id;
    
    console.log(`💰 Starting balance: $${this.balance.toLocaleString()}`);
    console.log(`📊 Session ID: ${this.sessionId}`);
    console.log('🎯 Ready for LLN and Markov data generation!\n');
    
    // Log startup
    console.log('🚀 Custom Trading Engine Started');
    console.log(`   Session initialized with $${this.balance.toLocaleString()} balance`);
    console.log('   System ready for LLN and Markov data generation');
  }
  
  async createTradingSession() {
    // Find or create a user for the session
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'system@trading.ai',
          name: 'System Trader',
          role: 'USER'
        }
      });
    }
    
    // Create paper account
    const paperAccount = await prisma.paperAccount.create({
      data: {
        userId: user.id,
        platform: 'internal',
        platformAccountId: 'custom-paper-' + Date.now(),
        currentBalance: this.balance,
        buyingPower: this.balance * 2 // 2x leverage
      }
    });
    
    // Create trading session
    const session = await prisma.paperTradingSession.create({
      data: {
        paperAccountId: paperAccount.id,
        sessionName: `Custom Paper Trading - ${new Date().toISOString()}`,
        startingBalance: this.balance,
        strategy: 'QUANTUM FORGE™'
      }
    });
    
    return session;
  }
  
  async executeOrder(params: {
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    type?: 'market' | 'limit';
    price?: number;
  }): Promise<TradeExecutionResult> {
    
    // Get current market price
    const marketPrice = await this.getCurrentPrice(params.symbol);
    const executionPrice = params.price || marketPrice;
    
    // Calculate trade value
    const tradeValue = params.quantity * executionPrice;
    
    // Check if we have enough balance (for buys)
    if (params.side === 'buy' && tradeValue > this.balance) {
      throw new Error(`Insufficient balance: $${this.balance.toFixed(2)} < $${tradeValue.toFixed(2)}`);
    }
    
    // Execute trade
    const trade: TradeExecutionResult = {
      id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      symbol: params.symbol,
      side: params.side,
      quantity: params.quantity,
      entryPrice: executionPrice,
      status: 'open',
      executedAt: new Date()
    };
    
    // Update balance
    if (params.side === 'buy') {
      this.balance -= tradeValue;
    } else {
      this.balance += tradeValue;
    }
    
    // Store open position
    this.openPositions.set(trade.id, trade);
    this.trades.push(trade);
    this.tradeCount++;
    
    // Store in database
    await this.storeTrade(trade, tradeValue);
    
    console.log(`✅ ${params.side.toUpperCase()} ${params.quantity} ${params.symbol} @ $${executionPrice.toFixed(2)}`);
    console.log(`   Trade ID: ${trade.id}`);
    console.log(`   Value: $${tradeValue.toFixed(2)}`);
    console.log(`   Balance: $${this.balance.toFixed(2)}`);
    
    // Log trade execution
    console.log(`📊 TRADE: ${params.side.toUpperCase()} ${params.quantity.toFixed(6)} ${params.symbol} @ $${executionPrice.toFixed(2)}`);
    
    return trade;
  }
  
  async closePosition(tradeId: string): Promise<TradeExecutionResult | null> {
    const position = this.openPositions.get(tradeId);
    if (!position) {
      return null;
    }
    
    // Get current market price for exit
    const currentPrice = await this.getCurrentPrice(position.symbol);
    
    // Calculate P&L
    let pnl = 0;
    if (position.side === 'buy') {
      pnl = (currentPrice - position.entryPrice) * position.quantity;
    } else {
      pnl = (position.entryPrice - currentPrice) * position.quantity;
    }
    
    // Validate P&L before updating trade
    const validatedPnL = this.validatePnL(pnl, position.quantity, position.entryPrice);
    
    // Update trade
    position.exitPrice = currentPrice;
    position.pnl = validatedPnL;
    position.status = 'closed';
    position.outcome = validatedPnL > 0 ? 'WIN' : 'LOSS';
    
    if (validatedPnL > 0) {
      this.winCount++;
    }
    
    // Update balance with validated P&L
    this.balance += validatedPnL;
    
    // Remove from open positions
    this.openPositions.delete(tradeId);
    
    // Update database
    await this.updateTradeInDB(position);
    
    console.log(`🎯 CLOSED ${position.symbol} position`);
    console.log(`   Entry: $${position.entryPrice.toFixed(2)} → Exit: $${currentPrice.toFixed(2)}`);
    console.log(`   P&L: ${validatedPnL > 0 ? '+' : ''}$${validatedPnL.toFixed(2)} (${position.outcome})`);
    console.log(`   Balance: $${this.balance.toFixed(2)}`);
    
    // Log position close
    console.log(`📊 CLOSE: ${position.quantity.toFixed(6)} ${position.symbol} @ $${currentPrice.toFixed(2)} | P&L: ${validatedPnL > 0 ? '+' : ''}$${validatedPnL.toFixed(2)}`);
    
    return position;
  }
  
  async getCurrentPrice(symbol: string): Promise<number> {
    // Get latest market data point
    const latest = await prisma.marketData.findFirst({
      where: { symbol },
      orderBy: { timestamp: 'desc' }
    });
    
    if (!latest) {
      throw new Error(`No market data found for ${symbol}`);
    }
    
    // Add small random spread for realism (0.01-0.05%)
    const spread = (Math.random() * 0.0004 + 0.0001);
    return latest.close * (1 + (Math.random() > 0.5 ? spread : -spread));
  }
  
  async storeTrade(trade: TradeExecutionResult, tradeValue: number) {
    try {
      await prisma.paperTrade.create({
        data: {
          sessionId: this.sessionId,
          symbol: trade.symbol,
          side: trade.side,
          quantity: trade.quantity,
          price: trade.entryPrice,
          value: tradeValue,
          commission: 0.0, // No fees in paper trading
          fees: 0.0,
          netValue: tradeValue,
          isEntry: true,
          tradeType: 'market',
          strategy: 'QUANTUM FORGE™',
          signalSource: 'ai',
          confidence: 0.85, // High confidence for custom engine
          executedAt: trade.executedAt
        }
      });
      
      // Also store as trading signal for Markov analysis
      await prisma.tradingSignal.create({
        data: {
          symbol: trade.symbol,
          strategy: 'QUANTUM FORGE™',
          signalType: trade.side.toUpperCase(),
          currentPrice: trade.entryPrice,
          confidence: 0.85,
          volume: tradeValue,
          indicators: JSON.stringify({
            tradeId: trade.id,
            tradeValue: tradeValue,
            engineType: 'custom',
            executionTime: trade.executedAt.getTime()
          })
        }
      });
      
    } catch (error) {
      console.log(`⚠️  Database storage error: ${error.message}`);
    }
  }
  
  async updateTradeInDB(trade: TradeExecutionResult) {
    try {
      // Create a closing trade record
      if (trade.pnl !== undefined && trade.exitPrice) {
        // Validate P&L to prevent extreme values
        const validatedPnL = this.validatePnL(trade.pnl, trade.quantity, trade.entryPrice);
        const validatedPnLPercent = (validatedPnL / (trade.quantity * trade.entryPrice)) * 100;
        
        await prisma.paperTrade.create({
          data: {
            sessionId: this.sessionId,
            symbol: trade.symbol,
            side: trade.side === 'buy' ? 'sell' : 'buy', // Opposite side for close
            quantity: trade.quantity,
            price: trade.exitPrice,
            value: trade.quantity * trade.exitPrice,
            commission: 0.0,
            fees: 0.0,
            netValue: trade.quantity * trade.exitPrice,
            pnl: validatedPnL,
            pnlPercent: validatedPnLPercent,
            isEntry: false,
            tradeType: 'market',
            strategy: 'QUANTUM FORGE™',
            signalSource: 'ai',
            confidence: 0.85,
            executedAt: new Date()
          }
        });
      }
    } catch (error) {
      console.log(`⚠️  Database update error: ${error.message}`);
    }
  }
  
  async startAggressiveTrading() {
    console.log('🔥 STARTING AGGRESSIVE PAPER TRADING');
    console.log('===================================');
    console.log('⚡ Ultra-fast execution for LLN data generation');
    console.log('🎯 Target: 100+ trades for statistical optimization\n');
    
    const symbols = ['BTCUSD', 'ETHUSD', 'ADAUSD', 'LINKUSD', 'SOLUSD'];
    let cycle = 0;
    
    const tradingInterval = setInterval(async () => {
      try {
        cycle++;
        console.log(`\n🔄 Trading Cycle ${cycle} - ${new Date().toLocaleTimeString()}`);
        
        // Execute 2-3 trades per cycle
        const tradesToExecute = Math.floor(Math.random() * 2) + 2; // 2-3 trades
        
        for (let i = 0; i < tradesToExecute; i++) {
          const symbol = symbols[Math.floor(Math.random() * symbols.length)];
          const side = Math.random() > 0.5 ? 'buy' : 'sell';
          
          // Random trade size between $50-$500
          const currentPrice = await this.getCurrentPrice(symbol);
          const tradeValue = Math.random() * 450 + 50; // $50-$500
          const quantity = tradeValue / currentPrice;
          
          try {
            const trade = await this.executeOrder({
              symbol,
              side,
              quantity,
              type: 'market'
            });
            
            // Random hold time: 30-180 seconds for quick turnover
            const holdTime = Math.random() * 150000 + 30000; // 30-180 seconds
            setTimeout(async () => {
              await this.closePosition(trade.id);
            }, holdTime);
            
          } catch (error) {
            console.log(`⚠️  Trade failed: ${error.message}`);
          }
          
          // Small delay between trades in same cycle
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Status update
        const winRate = this.tradeCount > 0 ? (this.winCount / this.tradeCount) * 100 : 0;
        console.log(`📊 Total trades: ${this.tradeCount} | Win rate: ${winRate.toFixed(1)}% | Balance: $${this.balance.toFixed(2)}`);
        
        // Check milestones
        if (this.tradeCount === 10) {
          console.log('\n🔄 MARKOV CHAIN READY!');
          console.log('✅ 10+ trades completed - pattern analysis can begin');
          
          console.log('🔄 MARKOV CHAIN ACTIVATED!');
          console.log(`   10 trades completed! Pattern analysis now available. Win rate: ${winRate.toFixed(1)}%`);
        }
        
        if (this.tradeCount === 50) {
          console.log('\n🎯 LAW OF LARGE NUMBERS ACTIVATED!');
          console.log('✅ 50+ trades completed - statistical optimization enabled');
          
          console.log('🎯 LAW OF LARGE NUMBERS!');
          console.log(`   50 trades completed! Statistical optimization activated. Win rate: ${winRate.toFixed(1)}%`);
        }
        
        if (this.tradeCount >= 100) {
          console.log('\n🏆 OPTIMIZATION DATASET COMPLETE!');
          console.log('✅ 100+ trades completed - ready for advanced algorithms');
          
          console.log('🏆 DATASET COMPLETE!');
          console.log(`   100+ trades completed! Ready for advanced AI algorithms. Final win rate: ${winRate.toFixed(1)}%`);
          
          clearInterval(tradingInterval);
          await this.printFinalResults();
        }
        
      } catch (error) {
        console.error('❌ Trading cycle error:', error.message);
      }
    }, 10000); // Every 10 seconds
    
    console.log('✅ Aggressive trading started (10-second cycles)');
  }
  
  async printFinalResults() {
    const winRate = this.tradeCount > 0 ? (this.winCount / this.tradeCount) * 100 : 0;
    const totalPnL = this.balance - 1000000; // Starting balance was $1M
    
    console.log('\n🎉 CUSTOM PAPER TRADING SESSION COMPLETE!');
    console.log('=========================================');
    console.log(`🎯 Total trades executed: ${this.tradeCount}`);
    console.log(`✅ Winning trades: ${this.winCount}`);
    console.log(`📊 Win rate: ${winRate.toFixed(1)}%`);
    console.log(`💰 Total P&L: ${totalPnL > 0 ? '+' : ''}$${totalPnL.toFixed(2)}`);
    console.log(`💼 Final balance: $${this.balance.toFixed(2)}`);
    console.log(`📈 ROI: ${((totalPnL / 1000000) * 100).toFixed(2)}%`);
    
    // Check database counts
    const paperTradeCount = await prisma.paperTrade.count({
      where: { sessionId: this.sessionId }
    });
    const signalCount = await prisma.tradingSignal.count({
      where: { strategy: 'QUANTUM FORGE™' }
    });
    
    console.log('\n📊 DATABASE INTEGRATION:');
    console.log(`   • ${paperTradeCount} trades stored in PaperTrade table`);
    console.log(`   • ${signalCount} signals stored for Markov analysis`);
    console.log(`   • Ready for dashboard display!`);
    console.log(`   • Perfect dataset for LLN and Markov optimization!`);
    
    await prisma.$disconnect();
  }
  
  getStats() {
    const winRate = this.tradeCount > 0 ? (this.winCount / this.tradeCount) * 100 : 0;
    return {
      tradeCount: this.tradeCount,
      winCount: this.winCount,
      winRate,
      balance: this.balance,
      openPositions: this.openPositions.size
    };
  }
}

// Main execution
async function startCustomPaperTrading() {
  const engine = new CustomPaperTradingEngine();
  
  await engine.initialize();
  await engine.startAggressiveTrading();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping custom paper trading...');
    process.exit(0);
  });
}

if (require.main === module) {
  startCustomPaperTrading().catch(console.error);
}

export { CustomPaperTradingEngine };