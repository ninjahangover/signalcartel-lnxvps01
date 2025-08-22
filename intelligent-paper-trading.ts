#!/usr/bin/env npx tsx -r dotenv/config
/**
 * INTELLIGENT PAPER TRADING ENGINE
 * 
 * Enhanced version with smart optimization features:
 * ✅ Trend analysis before trades
 * ✅ Dynamic position sizing
 * ✅ Intelligent stop-loss/take-profit
 * ✅ Market momentum detection
 * ✅ Pattern learning from history
 * ✅ Real-time win rate optimization
 */

import { PrismaClient } from '@prisma/client';
import { smartNtfyAlerts } from './src/lib/smart-ntfy-alerts';
import { PAPER_TRADING_CONFIG } from './src/lib/paper-trading-config';
import { intelligentOptimizer } from './src/lib/intelligent-trading-optimizer';

const prisma = new PrismaClient();
const alertService = smartNtfyAlerts;

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
  strategy?: string;
  confidence?: number;
}

class IntelligentPaperTradingEngine {
  private sessionId: string = '';
  private balance = PAPER_TRADING_CONFIG.STARTING_BALANCE;
  private trades: TradeExecutionResult[] = [];
  private openPositions: Map<string, TradeExecutionResult> = new Map();
  private tradeCount = 0;
  private winCount = 0;
  private symbols = ['BTCUSD', 'ETHUSD', 'SOLUSD', 'LINKUSD', 'ADAUSD'];
  private lastOptimizationTime = Date.now();
  
  async initialize() {
    console.log('🧠 INTELLIGENT PAPER TRADING ENGINE');
    console.log('=====================================');
    console.log('✅ Smart trend analysis');
    console.log('✅ Dynamic position sizing');
    console.log('✅ Intelligent stop-loss/take-profit');
    console.log('✅ Pattern learning from history');
    console.log('✅ Real-time optimization');
    
    const session = await this.createTradingSession();
    this.sessionId = session.id;
    
    console.log(`💰 Starting balance: $${this.balance.toLocaleString()}`);
    console.log(`📊 Session ID: ${this.sessionId}`);
    console.log('🎯 Intelligent optimization active!\n');
    
    alertService.addSystemEvent('🧠 Intelligent Trading Engine Started', 
      `Smart optimization active with $${this.balance.toLocaleString()} balance. AI-driven trade analysis enabled.`
    );
  }
  
  async createTradingSession() {
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'ai@trading.ai',
          name: 'AI Trader',
          role: 'USER'
        }
      });
    }
    
    const paperAccount = await prisma.paperAccount.create({
      data: {
        userId: user.id,
        platform: 'intelligent',
        platformAccountId: 'intelligent-paper-' + Date.now(),
        currentBalance: this.balance,
        buyingPower: this.balance * 1.5
      }
    });
    
    const session = await prisma.paperTradingSession.create({
      data: {
        paperAccountId: paperAccount.id,
        sessionName: `Intelligent Paper Trading - ${new Date().toISOString()}`,
        startingBalance: this.balance,
        strategy: 'IntelligentOptimizer'
      }
    });
    
    return session;
  }

  async executeTrade(params: { symbol: string; side: 'buy' | 'sell'; quantity?: number; value?: number; signal?: any }) {
    try {
      // Get intelligent signal if not provided
      let signal = params.signal;
      if (!signal) {
        signal = await intelligentOptimizer.generateTradingSignal(params.symbol);
        
        // Skip trade if signal says HOLD
        if (signal.action === 'HOLD') {
          console.log(`⏳ ${params.symbol}: ${signal.reasoning.join(', ')}`);
          return null;
        }
        
        // Override side with intelligent signal
        params.side = signal.action.toLowerCase() as 'buy' | 'sell';
        
        // Use intelligent position sizing
        if (signal.positionSize > 0 && signal.positionSize <= this.balance * 0.1) {
          params.value = signal.positionSize;
        }
      }

      const executionPrice = await this.getCurrentPrice(params.symbol);
      
      // Calculate quantity based on intelligent value or use provided quantity
      const quantity = params.quantity || (params.value || 100) / executionPrice;
      
      if (quantity <= 0) {
        console.log(`❌ Invalid quantity calculated for ${params.symbol}`);
        return null;
      }

      const tradeValue = quantity * executionPrice;
      
      // Check if we have enough balance
      if (tradeValue > this.balance * 0.2) { // Max 20% per trade for safety
        console.log(`❌ Trade too large: $${tradeValue.toFixed(2)} > 20% of balance`);
        return null;
      }

      const trade: TradeExecutionResult = {
        id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        symbol: params.symbol,
        side: params.side,
        quantity,
        entryPrice: executionPrice,
        status: 'open',
        executedAt: new Date(),
        strategy: 'IntelligentOptimizer',
        confidence: signal?.confidence || 0.75
      };

      this.tradeCount++;
      this.trades.push(trade);
      this.openPositions.set(trade.id, trade);
      
      // Update balance
      this.balance -= tradeValue * 0.001; // Small commission simulation
      
      await this.storeTrade(trade, tradeValue);
      
      console.log(`✅ SMART ${params.side.toUpperCase()} ${quantity.toFixed(6)} ${params.symbol} @ $${executionPrice.toFixed(2)}`);
      console.log(`   💡 AI Confidence: ${((signal?.confidence || 0.75) * 100).toFixed(1)}%`);
      console.log(`   💰 Value: $${tradeValue.toFixed(2)} | Balance: $${this.balance.toFixed(2)}`);
      
      if (signal?.reasoning?.length > 0) {
        console.log(`   🧠 Reasoning: ${signal.reasoning[0]}`);
      }
      
      // Add to smart alert system
      alertService.addTrade(params.symbol, params.side.toUpperCase() as 'BUY' | 'SELL', 
        executionPrice, quantity, undefined, 'IntelligentOptimizer');
      
      return trade;
      
    } catch (error) {
      console.error(`❌ Trade execution error: ${error.message}`);
      return null;
    }
  }

  async evaluateAndClosePositions() {
    for (const [positionId, position] of this.openPositions) {
      try {
        const currentPrice = await this.getCurrentPrice(position.symbol);
        
        // Use intelligent position closing logic
        const decision = intelligentOptimizer.shouldClosePosition(position, currentPrice);
        
        if (decision.shouldClose) {
          const closedPosition = await this.closePosition(position, currentPrice, decision.reason);
          if (closedPosition) {
            console.log(`🎯 AI CLOSE: ${decision.reason}`);
          }
        }
      } catch (error) {
        console.error(`Error evaluating position ${positionId}:`, error.message);
      }
    }
  }

  async closePosition(position: TradeExecutionResult, exitPrice: number, reason: string) {
    const quantity = position.quantity;
    const pnl = position.side === 'buy' 
      ? (exitPrice - position.entryPrice) * quantity
      : (position.entryPrice - exitPrice) * quantity;
    
    position.exitPrice = exitPrice;
    position.pnl = pnl;
    position.status = 'closed';
    position.outcome = pnl > 0 ? 'WIN' : 'LOSS';
    
    if (pnl > 0) this.winCount++;
    this.balance += pnl;
    
    this.openPositions.delete(position.id);
    
    await this.updateTradeInDB(position);
    
    console.log(`   📊 P&L: ${pnl > 0 ? '+' : ''}$${pnl.toFixed(2)} (${position.outcome})`);
    console.log(`   💼 Balance: $${this.balance.toFixed(2)}`);
    console.log(`   🧠 Reason: ${reason}`);
    
    // Add position close to smart alerts
    alertService.addTrade(position.symbol, 'CLOSE', exitPrice, quantity, pnl, 'IntelligentOptimizer');
    
    return position;
  }

  async getCurrentPrice(symbol: string): Promise<number> {
    const latest = await prisma.marketData.findFirst({
      where: { symbol },
      orderBy: { timestamp: 'desc' }
    });
    
    if (!latest) {
      throw new Error(`No market data found for ${symbol}`);
    }
    
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
          commission: tradeValue * 0.001, // 0.1% commission
          fees: 0.0,
          netValue: tradeValue * 0.999,
          isEntry: true,
          tradeType: 'intelligent',
          strategy: 'IntelligentOptimizer',
          signalSource: 'ai',
          confidence: trade.confidence || 0.75,
          executedAt: trade.executedAt
        }
      });
      
      await prisma.tradingSignal.create({
        data: {
          symbol: trade.symbol,
          strategy: 'IntelligentOptimizer',
          signalType: trade.side.toUpperCase(),
          currentPrice: trade.entryPrice,
          confidence: trade.confidence || 0.75,
          volume: tradeValue,
          indicators: JSON.stringify({
            tradeId: trade.id,
            aiConfidence: trade.confidence,
            strategy: 'intelligent',
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
      if (trade.pnl !== undefined && trade.exitPrice) {
        await prisma.paperTrade.create({
          data: {
            sessionId: this.sessionId,
            symbol: trade.symbol,
            side: trade.side === 'buy' ? 'sell' : 'buy',
            quantity: trade.quantity,
            price: trade.exitPrice,
            value: trade.quantity * trade.exitPrice,
            commission: 0.0,
            fees: 0.0,
            netValue: trade.quantity * trade.exitPrice,
            pnl: trade.pnl,
            pnlPercent: (trade.pnl / (trade.quantity * trade.entryPrice)) * 100,
            isEntry: false,
            tradeType: 'intelligent',
            strategy: 'IntelligentOptimizer',
            signalSource: 'ai',
            confidence: trade.confidence || 0.75,
            executedAt: new Date()
          }
        });
      }
    } catch (error) {
      console.log(`⚠️  Database update error: ${error.message}`);
    }
  }

  async runOptimizationCycle() {
    console.log(`\n🧠 INTELLIGENT TRADING CYCLE - ${new Date().toLocaleTimeString()}`);
    
    // Get current performance metrics
    const metrics = await intelligentOptimizer.getOptimizationMetrics();
    
    console.log(`📊 Performance: ${this.tradeCount} trades, ${(metrics.currentWinRate * 100).toFixed(1)}% win rate`);
    console.log(`💰 Balance: $${this.balance.toFixed(2)} (${this.balance >= PAPER_TRADING_CONFIG.STARTING_BALANCE ? '+' : ''}${(this.balance - PAPER_TRADING_CONFIG.STARTING_BALANCE).toFixed(2)})`);
    
    if (metrics.recommendations.length > 0) {
      console.log(`🎯 AI Recommendations:`);
      metrics.recommendations.forEach(rec => console.log(`   ${rec}`));
    }

    // Close positions that need closing
    await this.evaluateAndClosePositions();

    // Look for new intelligent trading opportunities
    let tradesThisCycle = 0;
    const maxTradesPerCycle = 2; // Limit trades per cycle
    
    for (const symbol of this.symbols) {
      if (tradesThisCycle >= maxTradesPerCycle) break;
      
      // Skip if we already have position in this symbol
      const hasPosition = Array.from(this.openPositions.values()).some(p => p.symbol === symbol);
      if (hasPosition) continue;
      
      // Skip worst performing symbol
      if (symbol === metrics.worstPerformingSymbol && metrics.currentWinRate < 0.4) {
        continue;
      }

      try {
        const signal = await intelligentOptimizer.generateTradingSignal(symbol);
        
        if (signal.action !== 'HOLD' && signal.confidence > 0.6) {
          const trade = await this.executeTrade({ 
            symbol, 
            side: signal.action.toLowerCase() as 'buy' | 'sell',
            signal 
          });
          
          if (trade) {
            tradesThisCycle++;
          }
        }
      } catch (error) {
        console.log(`⚠️  Error getting signal for ${symbol}: ${error.message}`);
      }
    }
    
    if (tradesThisCycle === 0) {
      console.log(`⏳ No high-confidence opportunities found this cycle`);
    }

    // Performance milestones
    const winRate = this.tradeCount > 0 ? this.winCount / this.tradeCount : 0;
    
    if (this.tradeCount === 10) {
      alertService.addSystemEvent('🎯 AI OPTIMIZATION ACTIVE!', 
        `10 intelligent trades completed. Win rate: ${(winRate * 100).toFixed(1)}%`);
    }
    
    if (this.tradeCount === 25) {
      alertService.addSystemEvent('📈 PATTERN LEARNING ENGAGED!', 
        `25 trades analyzed. AI adapting strategies. Win rate: ${(winRate * 100).toFixed(1)}%`);
    }

    if (this.tradeCount === 50) {
      alertService.addSystemEvent('🚀 OPTIMIZATION MASTERY!', 
        `50 intelligent trades complete! Advanced AI patterns active. Win rate: ${(winRate * 100).toFixed(1)}%`);
    }

    console.log(`🎯 Open positions: ${this.openPositions.size}`);
    console.log(`⏰ Next cycle in 30 seconds...\n`);
  }

  async startIntelligentTrading() {
    console.log('\n🚀 STARTING INTELLIGENT TRADING');
    console.log('=================================');
    console.log('⚡ 30-second cycles with AI analysis');
    console.log('🎯 Smart position management');
    console.log('📊 Real-time optimization\n');

    const tradingInterval = setInterval(async () => {
      try {
        await this.runOptimizationCycle();
        
        // Stop if we've hit targets or lost too much
        if (this.tradeCount >= 100) {
          console.log('\n🏆 OPTIMIZATION COMPLETE!');
          console.log('✅ 100 intelligent trades completed');
          
          alertService.addSystemEvent('🏆 AI OPTIMIZATION COMPLETE!', 
            `100 intelligent trades executed. Final performance optimized.`);
          
          clearInterval(tradingInterval);
          await this.printFinalResults();
        } else if (this.balance < PAPER_TRADING_CONFIG.STARTING_BALANCE * 0.5) {
          console.log('\n🛑 RISK MANAGEMENT STOP');
          console.log('📊 Balance protection activated');
          
          alertService.addSystemEvent('🛑 Risk Management Activated', 
            `Trading paused for balance protection. AI analyzing market conditions.`);
          
          clearInterval(tradingInterval);
        }
        
      } catch (error) {
        console.error('❌ Intelligent trading cycle error:', error.message);
      }
    }, 30000); // Every 30 seconds - more thoughtful than 10 seconds

    console.log('✅ Intelligent trading started (30-second cycles)');
  }

  async printFinalResults() {
    const winRate = this.tradeCount > 0 ? (this.winCount / this.tradeCount) * 100 : 0;
    const totalReturn = this.balance - PAPER_TRADING_CONFIG.STARTING_BALANCE;
    const returnPercent = (totalReturn / PAPER_TRADING_CONFIG.STARTING_BALANCE) * 100;

    console.log('\n🏁 INTELLIGENT TRADING RESULTS');
    console.log('==============================');
    console.log(`📊 Total Trades: ${this.tradeCount}`);
    console.log(`🎯 Win Rate: ${winRate.toFixed(1)}%`);
    console.log(`💰 Starting Balance: $${PAPER_TRADING_CONFIG.STARTING_BALANCE.toLocaleString()}`);
    console.log(`💼 Final Balance: $${this.balance.toFixed(2)}`);
    console.log(`📈 Total Return: ${totalReturn >= 0 ? '+' : ''}$${totalReturn.toFixed(2)} (${returnPercent >= 0 ? '+' : ''}${returnPercent.toFixed(2)}%)`);
    console.log(`🤖 Strategy: Intelligent AI Optimization`);
  }
}

// Main execution
async function main() {
  const engine = new IntelligentPaperTradingEngine();
  await engine.initialize();
  await engine.startIntelligentTrading();
}

main().catch(console.error);