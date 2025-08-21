/**
 * DEPRECATED: Legacy Paper Trading Engine
 * 
 * This module has been replaced by the new Alpaca-based paper trading system.
 * Please use the following modules instead:
 * 
 * - @/lib/alpaca-paper-trading-service - Core Alpaca integration
 * - @/lib/paper-account-cycling-service - Automated account cycling
 * - @/components/paper-trading-dashboard - New UI dashboard
 * 
 * The new system provides:
 * ✅ Real market data via Alpaca API
 * ✅ Automated account cycling
 * ✅ Database persistence
 * ✅ Multi-user support
 * ✅ Historical performance tracking
 */

import { alpacaPaperTradingService } from './alpaca-paper-trading-service';
import { paperAccountCyclingService } from './paper-account-cycling-service';
import { stratusEngine, getAITradingSignal, recordAITradeResult, type AITradingDecision, type TradeOutcome } from './stratus-engine-ai';
import { realMarketData } from './real-market-data';
import { cleanTestingService } from './clean-testing-service';
// Kraken removed from paper trading - using Alpaca only

export interface PaperAccount {
  accountId: string;
  totalBalance: number;
  availableBalance: number;
  positions: PaperPosition[];
  trades: PaperTrade[];
  realizedPnL: number;
  unrealizedPnL: number;
  totalTrades: number;
  winningTrades: number;
  winRate: number;
  lastUpdated: Date;
}

export interface PaperPosition {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  stopLoss?: number;
  takeProfit?: number;
  entryTime: Date;
  strategyName: string;
  aiDecision: AITradingDecision;
}

export interface PaperTrade {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  value: number;
  fees: number;
  pnl?: number;
  timestamp: Date;
  strategyName: string;
  aiDecision?: AITradingDecision;
  isEntry: boolean; // true for entry, false for exit
  positionId?: string; // Link to position
}

class PaperTradingEngine {
  private static instance: PaperTradingEngine | null = null;
  private account: PaperAccount;
  private isRunning: boolean = false;
  private tradingInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(account: PaperAccount) => void> = new Set();

  private constructor() {
    this.account = {
      accountId: 'paper_account_1',
      totalBalance: 100000, // $100k starting balance
      availableBalance: 100000,
      positions: [],
      trades: [],
      realizedPnL: 0,
      unrealizedPnL: 0,
      totalTrades: 0,
      winningTrades: 0,
      winRate: 0,
      lastUpdated: new Date()
    };

    this.loadFromStorage();
  }

  static getInstance(): PaperTradingEngine {
    if (!PaperTradingEngine.instance) {
      PaperTradingEngine.instance = new PaperTradingEngine();
    }
    return PaperTradingEngine.instance;
  }

  // Start AI-driven paper trading
  async startAITrading(symbols: string[] = ['BTCUSD', 'ETHUSD', 'ADAUSD']): Promise<void> {
    if (this.isRunning) {
      console.log('📊 Paper trading engine already running');
      return;
    }

    console.log('🚀 Starting AI-driven paper trading engine for symbols:', symbols);
    this.isRunning = true;

    // Execute trades based on AI signals
    this.tradingInterval = setInterval(async () => {
      for (const symbol of symbols) {
        try {
          await this.processAISignal(symbol);
        } catch (error) {
          console.error(`Error processing AI signal for ${symbol}:`, error);
        }
      }
      
      // Update all positions with current market prices
      await this.updatePositions();
      
      // Save to storage
      this.saveToStorage();
      
      // Notify listeners
      this.notifyListeners();
      
    }, 10000); // Check every 10 seconds for new signals

    console.log('✅ AI paper trading engine started');
  }

  // Process AI signal and execute trade if conditions are met
  private async processAISignal(symbol: string): Promise<void> {
    try {
      // Get AI trading decision
      const aiDecision = await getAITradingSignal(symbol);
      
      // Only trade on high-confidence signals
      if (aiDecision.confidence < 0.6 || aiDecision.decision === 'HOLD') {
        return;
      }

      const currentPrice = await realMarketData.getCurrentPrice(symbol);
      const existingPosition = this.findPosition(symbol);

      // Execute trade based on AI decision
      if (aiDecision.decision === 'BUY' && !existingPosition) {
        await this.executeBuyOrder(symbol, currentPrice, aiDecision);
      } else if (aiDecision.decision === 'SELL' && !existingPosition) {
        await this.executeSellOrder(symbol, currentPrice, aiDecision);
      } else if ((aiDecision.decision === 'CLOSE_LONG' || aiDecision.decision === 'SELL') && existingPosition?.side === 'LONG') {
        await this.closePosition(existingPosition.id, currentPrice, 'AI_SIGNAL');
      } else if ((aiDecision.decision === 'CLOSE_SHORT' || aiDecision.decision === 'BUY') && existingPosition?.side === 'SHORT') {
        await this.closePosition(existingPosition.id, currentPrice, 'AI_SIGNAL');
      }

    } catch (error) {
      console.error(`Error processing AI signal for ${symbol}:`, error);
    }
  }

  // Execute buy order
  private async executeBuyOrder(symbol: string, price: number, aiDecision: AITradingDecision): Promise<void> {
    // Calculate position size based on AI recommendation and available balance
    const maxRiskAmount = this.account.availableBalance * 0.02; // Max 2% risk per trade
    const positionValue = this.account.availableBalance * (aiDecision.positionSize * 0.1); // AI position size as percentage
    const orderValue = Math.min(maxRiskAmount, positionValue, this.account.availableBalance * 0.1); // Max 10% per trade
    
    if (orderValue < 100) return; // Minimum $100 trade

    const quantity = orderValue / price;
    const fees = orderValue * 0.001; // 0.1% fee

    // Check if we have enough balance
    if (this.account.availableBalance < orderValue + fees) {
      console.log(`❌ Insufficient balance for ${symbol} BUY order: $${orderValue.toFixed(2)}`);
      return;
    }

    // Create position
    const positionId = `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const position: PaperPosition = {
      id: positionId,
      symbol,
      side: 'LONG',
      quantity,
      entryPrice: price,
      currentPrice: price,
      unrealizedPnL: 0,
      stopLoss: aiDecision.stopLoss,
      takeProfit: aiDecision.takeProfit[0], // Use first take profit level
      entryTime: new Date(),
      strategyName: 'Stratus Engine AI',
      aiDecision
    };

    // Create trade record
    const trade: PaperTrade = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol,
      side: 'BUY',
      quantity,
      price,
      value: orderValue,
      fees,
      timestamp: new Date(),
      strategyName: 'Stratus Engine AI',
      aiDecision,
      isEntry: true,
      positionId
    };

    // Update account
    this.account.positions.push(position);
    this.account.trades.push(trade);
    this.account.availableBalance -= (orderValue + fees);
    this.account.totalTrades++;
    this.account.lastUpdated = new Date();

    console.log(`✅ Executed BUY order for ${symbol}:`, {
      quantity: quantity.toFixed(6),
      price: `$${price.toFixed(2)}`,
      value: `$${orderValue.toFixed(2)}`,
      confidence: `${(aiDecision.confidence * 100).toFixed(1)}%`,
      availableBalance: `$${this.account.availableBalance.toFixed(2)}`,
      totalBalance: `$${this.account.totalBalance.toFixed(2)}`,
      positions: this.account.positions.length
    });

    // Record trade with AI system for learning
    await this.recordAITradeForLearning(trade, position, true);
  }

  // Execute sell order (short position)
  private async executeSellOrder(symbol: string, price: number, aiDecision: AITradingDecision): Promise<void> {
    // Similar to buy but creates short position
    const maxRiskAmount = this.account.availableBalance * 0.02;
    const positionValue = this.account.availableBalance * (aiDecision.positionSize * 0.1);
    const orderValue = Math.min(maxRiskAmount, positionValue, this.account.availableBalance * 0.1);
    
    if (orderValue < 100) return;

    const quantity = orderValue / price;
    const fees = orderValue * 0.001;

    if (this.account.availableBalance < orderValue + fees) {
      console.log(`❌ Insufficient balance for ${symbol} SELL order: $${orderValue.toFixed(2)}`);
      return;
    }

    const positionId = `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const position: PaperPosition = {
      id: positionId,
      symbol,
      side: 'SHORT',
      quantity,
      entryPrice: price,
      currentPrice: price,
      unrealizedPnL: 0,
      stopLoss: aiDecision.stopLoss,
      takeProfit: aiDecision.takeProfit[0],
      entryTime: new Date(),
      strategyName: 'Stratus Engine AI',
      aiDecision
    };

    const trade: PaperTrade = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol,
      side: 'SELL',
      quantity,
      price,
      value: orderValue,
      fees,
      timestamp: new Date(),
      strategyName: 'Stratus Engine AI',
      aiDecision,
      isEntry: true,
      positionId
    };

    this.account.positions.push(position);
    this.account.trades.push(trade);
    this.account.availableBalance -= (orderValue + fees);
    this.account.totalTrades++;
    this.account.lastUpdated = new Date();

    console.log(`✅ Executed SELL order for ${symbol}:`, {
      quantity: quantity.toFixed(6),
      price: `$${price.toFixed(2)}`,
      value: `$${orderValue.toFixed(2)}`,
      confidence: `${(aiDecision.confidence * 100).toFixed(1)}%`,
      availableBalance: `$${this.account.availableBalance.toFixed(2)}`,
      totalBalance: `$${this.account.totalBalance.toFixed(2)}`,
      positions: this.account.positions.length
    });

    await this.recordAITradeForLearning(trade, position, true);
  }

  // Close position
  private async closePosition(positionId: string, currentPrice: number, reason: string): Promise<void> {
    const positionIndex = this.account.positions.findIndex(p => p.id === positionId);
    if (positionIndex === -1) return;

    const position = this.account.positions[positionIndex];
    
    // Calculate P&L
    let pnl: number;
    if (position.side === 'LONG') {
      pnl = (currentPrice - position.entryPrice) * position.quantity;
    } else {
      pnl = (position.entryPrice - currentPrice) * position.quantity;
    }

    const orderValue = position.quantity * currentPrice;
    const fees = orderValue * 0.001;
    const netPnL = pnl - fees;

    // Create exit trade
    const exitTrade: PaperTrade = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol: position.symbol,
      side: position.side === 'LONG' ? 'SELL' : 'BUY',
      quantity: position.quantity,
      price: currentPrice,
      value: orderValue,
      fees,
      pnl: netPnL,
      timestamp: new Date(),
      strategyName: position.strategyName,
      aiDecision: position.aiDecision,
      isEntry: false,
      positionId: position.id
    };

    // Update account
    this.account.trades.push(exitTrade);
    this.account.availableBalance += (orderValue - fees);
    this.account.realizedPnL += netPnL;
    
    if (netPnL > 0) {
      this.account.winningTrades++;
    }
    
    this.account.winRate = (this.account.winningTrades / this.account.totalTrades) * 100;
    
    // Remove position
    this.account.positions.splice(positionIndex, 1);
    this.account.lastUpdated = new Date();

    console.log(`🔚 Closed ${position.side} position for ${position.symbol} (${reason}):`, {
      entryPrice: `$${position.entryPrice.toFixed(2)}`,
      exitPrice: `$${currentPrice.toFixed(2)}`,
      pnl: `${netPnL >= 0 ? '+' : ''}$${netPnL.toFixed(2)}`,
      newBalance: `$${this.account.availableBalance.toFixed(2)}`,
      winRate: `${this.account.winRate.toFixed(1)}%`
    });

    // Record trade outcome with AI for learning
    await this.recordAITradeForLearning(exitTrade, position, false);
  }

  // Update all position prices and check stop loss/take profit
  private async updatePositions(): Promise<void> {
    if (this.account.positions.length === 0) return;

    let totalUnrealizedPnL = 0;

    for (const position of this.account.positions) {
      try {
        const currentPrice = await realMarketData.getCurrentPrice(position.symbol);
        position.currentPrice = currentPrice;

        // Calculate unrealized P&L
        if (position.side === 'LONG') {
          position.unrealizedPnL = (currentPrice - position.entryPrice) * position.quantity;
        } else {
          position.unrealizedPnL = (position.entryPrice - currentPrice) * position.quantity;
        }

        totalUnrealizedPnL += position.unrealizedPnL;

        // Check stop loss and take profit
        if (position.side === 'LONG') {
          if (position.stopLoss && currentPrice <= position.stopLoss) {
            await this.closePosition(position.id, currentPrice, 'STOP_LOSS');
            continue;
          }
          if (position.takeProfit && currentPrice >= position.takeProfit) {
            await this.closePosition(position.id, currentPrice, 'TAKE_PROFIT');
            continue;
          }
        } else {
          if (position.stopLoss && currentPrice >= position.stopLoss) {
            await this.closePosition(position.id, currentPrice, 'STOP_LOSS');
            continue;
          }
          if (position.takeProfit && currentPrice <= position.takeProfit) {
            await this.closePosition(position.id, currentPrice, 'TAKE_PROFIT');
            continue;
          }
        }

      } catch (error) {
        console.error(`Error updating position for ${position.symbol}:`, error);
      }
    }

    // Update total balance
    this.account.unrealizedPnL = totalUnrealizedPnL;
    
    // Calculate position value correctly
    const positionValue = this.account.positions.reduce((sum, pos) => {
      return sum + (pos.quantity * pos.entryPrice); // Use entry price for cost basis
    }, 0);
    
    // Total balance = available cash + position value + unrealized P&L + realized P&L
    this.account.totalBalance = this.account.availableBalance + positionValue + totalUnrealizedPnL;
    this.account.lastUpdated = new Date();
    
    // Debug logging for balance tracking
    if (this.account.positions.length > 0) {
      console.log(`📊 Position update - Balance calculation:`, {
        availableBalance: `$${this.account.availableBalance.toFixed(2)}`,
        positionValue: `$${positionValue.toFixed(2)}`,
        unrealizedPnL: `$${totalUnrealizedPnL.toFixed(2)}`,
        totalBalance: `$${this.account.totalBalance.toFixed(2)}`,
        activePositions: this.account.positions.length
      });
    }
  }

  // Record trade with AI system for learning
  private async recordAITradeForLearning(trade: PaperTrade, position: PaperPosition, isEntry: boolean): Promise<void> {
    if (!trade.aiDecision || isEntry) return; // Only record exit trades for learning

    const wasCorrect = trade.pnl! > 0;
    const actualMargin = (trade.pnl! / trade.value) * 100;

    const outcome: TradeOutcome = {
      tradeId: trade.id,
      symbol: trade.symbol,
      decision: trade.aiDecision,
      entryPrice: position.entryPrice,
      exitPrice: trade.price,
      actualProfit: trade.pnl!,
      actualMargin,
      wasCorrect,
      executionTime: trade.timestamp,
      marketCondition: 'normal', // Could be enhanced with market regime
      aiConfidence: trade.aiDecision.confidence,
      actualWinRate: this.account.winRate
    };

    await recordAITradeResult(outcome);

    // Also add to clean testing session if active
    const activeSessions = cleanTestingService.getAllActiveSessions();
    if (activeSessions.length > 0) {
      const session = activeSessions[0];
      cleanTestingService.addTradeToSession(session.id, {
        pair: trade.symbol,
        side: trade.side.toLowerCase() as 'buy' | 'sell',
        quantity: trade.quantity,
        price: trade.price,
        profit: trade.pnl,
        isWin: wasCorrect
      });
    }
  }

  // Utility methods
  private findPosition(symbol: string): PaperPosition | undefined {
    return this.account.positions.find(p => p.symbol === symbol);
  }

  // Stop paper trading
  stopTrading(): void {
    if (this.tradingInterval) {
      clearInterval(this.tradingInterval);
      this.tradingInterval = null;
    }
    this.isRunning = false;
    console.log('⏹️ Paper trading engine stopped');
  }

  // Listeners for UI updates
  addListener(callback: (account: PaperAccount) => void): void {
    this.listeners.add(callback);
  }

  removeListener(callback: (account: PaperAccount) => void): void {
    this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    console.log(`🔔 Notifying ${this.listeners.size} listeners of account update:`, {
      totalBalance: `$${this.account.totalBalance.toFixed(2)}`,
      availableBalance: `$${this.account.availableBalance.toFixed(2)}`,
      positions: this.account.positions.length,
      trades: this.account.trades.length
    });
    this.listeners.forEach(callback => callback(this.account));
  }

  // Storage methods
  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('paperTradingAccount', JSON.stringify(this.account, this.dateReplacer));
    }
  }

  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('paperTradingAccount');
      if (saved) {
        try {
          this.account = JSON.parse(saved, this.dateReviver);
          console.log('📊 Loaded paper trading account from storage:', {
            balance: `$${this.account.totalBalance.toFixed(2)}`,
            positions: this.account.positions.length,
            trades: this.account.trades.length,
            winRate: `${this.account.winRate.toFixed(1)}%`
          });
        } catch (error) {
          console.error('Failed to load paper trading account from storage:', error);
        }
      }
    }
  }

  // JSON helpers
  private dateReplacer(key: string, value: any): any {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }
    return value;
  }

  private dateReviver(key: string, value: any): any {
    if (value && typeof value === 'object' && value.__type === 'Date') {
      return new Date(value.value);
    }
    return value;
  }

  // Public API
  getAccount(): PaperAccount {
    return { ...this.account };
  }

  resetAccount(): void {
    this.account = {
      accountId: 'paper_account_1',
      totalBalance: 100000,
      availableBalance: 100000,
      positions: [],
      trades: [],
      realizedPnL: 0,
      unrealizedPnL: 0,
      totalTrades: 0,
      winningTrades: 0,
      winRate: 0,
      lastUpdated: new Date()
    };
    this.saveToStorage();
    this.notifyListeners();
    console.log('🔄 Paper trading account reset to $100,000');
  }

  getRecentTrades(limit: number = 10): PaperTrade[] {
    return this.account.trades
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  isRunning(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance (LEGACY)
export const paperTradingEngine = PaperTradingEngine.getInstance();

// COMPATIBILITY LAYER - Redirects to new Alpaca-based system
// Export helper functions that now use the new Alpaca system
export async function startAIPaperTrading(symbols?: string[]): Promise<void> {
  console.warn('⚠️ startAIPaperTrading is deprecated. Use alpacaPaperTradingService.initializeAccount() instead');
  // Placeholder - maintain compatibility but log deprecation
  return paperTradingEngine.startAITrading(symbols);
}

export function stopAIPaperTrading(): void {
  console.warn('⚠️ stopAIPaperTrading is deprecated. Use paperAccountCyclingService.manualCycle() instead');
  return paperTradingEngine.stopTrading();
}

export function getPaperAccount(): PaperAccount {
  console.warn('⚠️ getPaperAccount is deprecated. Use alpacaPaperTradingService.getCurrentAccount() instead');
  return paperTradingEngine.getAccount();
}

// NEW SYSTEM EXPORTS - Recommended usage
export { alpacaPaperTradingService } from './alpaca-paper-trading-service';
export { paperAccountCyclingService } from './paper-account-cycling-service';

// Export types (keeping legacy types for compatibility)
export type { PaperAccount, PaperPosition, PaperTrade };

// Re-export new types
export type { 
  AlpacaPaperAccount,
  AlpacaPosition,
  AlpacaOrder,
  AlpacaMarketData 
} from './alpaca-paper-trading-service';