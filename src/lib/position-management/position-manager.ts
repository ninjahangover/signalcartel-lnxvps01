/**
 * Position Management System
 * Tracks entry/exit trades and calculates real P&L
 */

export interface Position {
  id: string;
  strategy: string;
  symbol: string;
  side: 'long' | 'short';
  
  // Entry details
  entryPrice: number;
  quantity: number;
  entryTradeId: string;
  entryTime: Date;
  
  // Exit details (when closed)
  exitPrice?: number;
  exitTradeId?: string;
  exitTime?: Date;
  
  // Status and P&L
  status: 'open' | 'closed' | 'partial';
  realizedPnL?: number;
  unrealizedPnL?: number;
  
  // Risk management
  stopLoss?: number;
  takeProfit?: number;
  maxHoldTime?: number; // milliseconds
}

export interface ExitStrategy {
  strategy: string;
  symbol?: string; // If undefined, applies to all symbols for this strategy
  
  // Profit/Loss targets
  takeProfitPercent?: number;  // Close at +X% profit (0.05 = 5%)
  stopLossPercent?: number;    // Close at -X% loss (0.03 = 3%)
  trailingStopPercent?: number; // Trailing stop loss
  
  // Time-based exits
  maxHoldMinutes?: number;     // Close after X minutes
  
  // Technical exits
  reverseSignalExit?: boolean; // Close when opposite signal occurs
}

export interface TradingSignal {
  strategy: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  price: number;
  confidence: number;
  quantity?: number;
  timestamp: Date;
}

export interface PositionTrade {
  id: string;
  positionId: string;
  side: 'buy' | 'sell';
  symbol: string;
  quantity: number;
  price: number;
  value: number;
  strategy: string;
  executedAt: Date;
  pnl?: number;
  isEntry: boolean;
}

export class PositionManager {
  private positions = new Map<string, Position>();
  private exitStrategies = new Map<string, ExitStrategy>();
  
  constructor(private prisma: any) {}
  
  /**
   * Register exit strategy for a trading strategy
   */
  registerExitStrategy(exitStrategy: ExitStrategy) {
    const key = `${exitStrategy.strategy}:${exitStrategy.symbol || '*'}`;
    this.exitStrategies.set(key, exitStrategy);
    console.log(`📋 Registered exit strategy for ${key}`);
  }
  
  /**
   * Process a trading signal - either open new position or close existing ones
   */
  async processSignal(signal: TradingSignal): Promise<{ 
    action: 'opened' | 'closed' | 'ignored'; 
    position?: Position;
    trade?: PositionTrade;
    pnl?: number;
  }> {
    const openPositions = this.getOpenPositions(signal.strategy, signal.symbol);
    
    if (signal.action === 'BUY') {
      // Check if we should close short positions first
      const shortPositions = openPositions.filter(p => p.side === 'short');
      if (shortPositions.length > 0) {
        // Close oldest short position
        const position = shortPositions[0];
        return await this.closePosition(position.id, signal.price, 'signal_reversal');
      }
      
      // Open new long position or add to existing
      return await this.openPosition({
        strategy: signal.strategy,
        symbol: signal.symbol,
        side: 'long',
        price: signal.price,
        quantity: signal.quantity || this.calculatePositionSize(signal),
        timestamp: signal.timestamp
      });
    }
    
    if (signal.action === 'SELL') {
      // Check if we should close long positions first
      const longPositions = openPositions.filter(p => p.side === 'long');
      if (longPositions.length > 0) {
        // Close oldest long position
        const position = longPositions[0];
        return await this.closePosition(position.id, signal.price, 'signal_reversal');
      }
      
      // Open new short position or add to existing  
      return await this.openPosition({
        strategy: signal.strategy,
        symbol: signal.symbol,
        side: 'short',
        price: signal.price,
        quantity: signal.quantity || this.calculatePositionSize(signal),
        timestamp: signal.timestamp
      });
    }
    
    return { action: 'ignored' };
  }
  
  /**
   * Open a new position
   */
  async openPosition(params: {
    strategy: string;
    symbol: string;
    side: 'long' | 'short';
    price: number;
    quantity: number;
    timestamp: Date;
  }): Promise<{ action: 'opened'; position: Position; trade: PositionTrade }> {
    
    const positionId = `${params.strategy}-${params.symbol}-${Date.now()}`;
    const tradeId = `trade-${Date.now()}`;
    
    // Create entry trade record
    const entryTrade: PositionTrade = {
      id: tradeId,
      positionId,
      side: params.side === 'long' ? 'buy' : 'sell',
      symbol: params.symbol,
      quantity: params.quantity,
      price: params.price,
      value: params.quantity * params.price,
      strategy: params.strategy,
      executedAt: params.timestamp,
      isEntry: true
    };
    
    // Get exit strategy for this position
    const exitStrategy = this.getExitStrategy(params.strategy, params.symbol);
    
    // Create position
    const position: Position = {
      id: positionId,
      strategy: params.strategy,
      symbol: params.symbol,
      side: params.side,
      entryPrice: params.price,
      quantity: params.quantity,
      entryTradeId: tradeId,
      entryTime: params.timestamp,
      status: 'open',
      
      // Apply exit strategy rules
      stopLoss: exitStrategy?.stopLossPercent ? 
        params.price * (1 - (params.side === 'long' ? exitStrategy.stopLossPercent : -exitStrategy.stopLossPercent)) : 
        undefined,
      takeProfit: exitStrategy?.takeProfitPercent ? 
        params.price * (1 + (params.side === 'long' ? exitStrategy.takeProfitPercent : -exitStrategy.takeProfitPercent)) : 
        undefined,
      maxHoldTime: exitStrategy?.maxHoldMinutes ? exitStrategy.maxHoldMinutes * 60 * 1000 : undefined
    };
    
    this.positions.set(positionId, position);
    
    // Save entry trade to database first (required by foreign key)
    await this.savePositionTrade(entryTrade);
    
    // Save position to database
    await this.prisma.managedPosition.create({
      data: {
        id: position.id,
        strategy: position.strategy,
        symbol: position.symbol,
        side: position.side,
        entryPrice: position.entryPrice,
        quantity: position.quantity,
        entryTradeId: position.entryTradeId,
        entryTime: position.entryTime,
        status: position.status,
        stopLoss: position.stopLoss,
        takeProfit: position.takeProfit,
        maxHoldTime: position.maxHoldTime
      }
    });
    
    console.log(`📈 OPENED ${position.side.toUpperCase()} position: ${params.quantity} ${params.symbol} @ $${params.price}`);
    
    return { action: 'opened', position, trade: entryTrade };
  }
  
  /**
   * Close an existing position
   */
  async closePosition(
    positionId: string, 
    exitPrice: number, 
    reason: string
  ): Promise<{ action: 'closed'; position: Position; trade: PositionTrade; pnl: number }> {
    
    const position = this.positions.get(positionId);
    if (!position || position.status === 'closed') {
      throw new Error(`Position ${positionId} not found or already closed`);
    }
    
    const tradeId = `trade-${Date.now()}`;
    
    // Calculate P&L
    const pnl = this.calculatePnL(position, exitPrice);
    
    // Create exit trade record
    const exitTrade: PositionTrade = {
      id: tradeId,
      positionId,
      side: position.side === 'long' ? 'sell' : 'buy', // Opposite of entry
      symbol: position.symbol,
      quantity: position.quantity,
      price: exitPrice,
      value: position.quantity * exitPrice,
      strategy: position.strategy,
      executedAt: new Date(),
      pnl,
      isEntry: false
    };
    
    // Save exit trade to database first (before updating position to avoid FK constraint issues)
    await this.savePositionTrade(exitTrade);
    
    // Update position
    position.exitPrice = exitPrice;
    position.exitTradeId = tradeId;
    position.exitTime = new Date();
    position.status = 'closed';
    position.realizedPnL = pnl;
    
    // Update position in database
    await this.prisma.managedPosition.update({
      where: { id: positionId },
      data: {
        exitPrice: exitPrice,
        exitTradeId: tradeId,
        exitTime: position.exitTime,
        status: 'closed',
        realizedPnL: pnl
      }
    });
    
    console.log(`📉 CLOSED ${position.side.toUpperCase()} position: ${position.quantity} ${position.symbol} @ $${exitPrice} | P&L: $${pnl.toFixed(2)} (${reason})`);
    
    return { action: 'closed', position, trade: exitTrade, pnl };
  }
  
  /**
   * Monitor all open positions for exit conditions
   */
  async monitorPositions(currentPrices: { [symbol: string]: number }) {
    const openPositions = Array.from(this.positions.values()).filter(p => p.status === 'open');
    const closedPositions: Array<{ position: Position; trade: PositionTrade; pnl: number }> = [];
    
    for (const position of openPositions) {
      const currentPrice = currentPrices[position.symbol];
      if (!currentPrice) continue;
      
      // Update unrealized P&L
      position.unrealizedPnL = this.calculatePnL(position, currentPrice);
      
      // Check exit conditions
      const exitReason = this.checkExitConditions(position, currentPrice);
      if (exitReason) {
        const result = await this.closePosition(position.id, currentPrice, exitReason);
        closedPositions.push(result);
      }
    }
    
    return closedPositions;
  }
  
  /**
   * Calculate P&L for a position
   */
  private calculatePnL(position: Position, currentPrice: number): number {
    if (position.side === 'long') {
      return (currentPrice - position.entryPrice) * position.quantity;
    } else {
      return (position.entryPrice - currentPrice) * position.quantity;
    }
  }
  
  /**
   * Check if position should be closed based on exit conditions
   */
  private checkExitConditions(position: Position, currentPrice: number): string | null {
    // Stop loss
    if (position.stopLoss) {
      if (position.side === 'long' && currentPrice <= position.stopLoss) {
        return 'stop_loss';
      }
      if (position.side === 'short' && currentPrice >= position.stopLoss) {
        return 'stop_loss';
      }
    }
    
    // Take profit
    if (position.takeProfit) {
      if (position.side === 'long' && currentPrice >= position.takeProfit) {
        return 'take_profit';
      }
      if (position.side === 'short' && currentPrice <= position.takeProfit) {
        return 'take_profit';
      }
    }
    
    // Max hold time
    if (position.maxHoldTime) {
      const holdTime = Date.now() - position.entryTime.getTime();
      if (holdTime >= position.maxHoldTime) {
        return 'max_hold_time';
      }
    }
    
    return null;
  }
  
  /**
   * Get exit strategy for a strategy/symbol combination
   */
  private getExitStrategy(strategy: string, symbol: string): ExitStrategy | undefined {
    return this.exitStrategies.get(`${strategy}:${symbol}`) || 
           this.exitStrategies.get(`${strategy}:*`);
  }
  
  /**
   * Calculate position size based on signal and risk management
   */
  private calculatePositionSize(signal: TradingSignal): number {
    // Simple position sizing - can be made more sophisticated
    const maxRiskAmount = 1000; // Max $1000 per trade
    return Math.min(10, maxRiskAmount / signal.price); // Max 10 units or $1000 worth
  }
  
  /**
   * Get open positions for a strategy/symbol
   */
  private getOpenPositions(strategy: string, symbol: string): Position[] {
    return Array.from(this.positions.values()).filter(
      p => p.strategy === strategy && p.symbol === symbol && p.status === 'open'
    );
  }
  
  /**
   * Save position trade to database (uses new ManagedTrade table)
   */
  private async savePositionTrade(trade: PositionTrade) {
    await this.prisma.managedTrade.create({
      data: {
        id: trade.id,
        positionId: trade.positionId,
        side: trade.side,
        symbol: trade.symbol,
        quantity: trade.quantity,
        price: trade.price,
        value: trade.value,
        strategy: trade.strategy,
        executedAt: trade.executedAt,
        pnl: trade.pnl,
        isEntry: trade.isEntry
      }
    });
  }
  
  /**
   * Get portfolio summary with real P&L
   */
  getPortfolioSummary() {
    const openPositions = Array.from(this.positions.values()).filter(p => p.status === 'open');
    const closedPositions = Array.from(this.positions.values()).filter(p => p.status === 'closed');
    
    const totalUnrealizedPnL = openPositions.reduce((sum, p) => sum + (p.unrealizedPnL || 0), 0);
    const totalRealizedPnL = closedPositions.reduce((sum, p) => sum + (p.realizedPnL || 0), 0);
    const winningTrades = closedPositions.filter(p => (p.realizedPnL || 0) > 0).length;
    const totalTrades = closedPositions.length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    
    return {
      openPositions: openPositions.length,
      closedPositions: closedPositions.length,
      totalUnrealizedPnL,
      totalRealizedPnL,
      totalPnL: totalUnrealizedPnL + totalRealizedPnL,
      winningTrades,
      totalTrades,
      winRate
    };
  }
}