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
    // Load open positions from database to ensure we have the latest state
    await this.loadOpenPositionsFromDatabase();
    
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
   * PRIORITY: Fast loss cutting, validated winner holding
   */
  private checkExitConditions(position: Position, currentPrice: number): string | null {
    const currentPnL = this.calculatePnL(position, currentPrice);
    const pnlPercent = (currentPnL / (position.entryPrice * position.quantity)) * 100;
    const holdTimeMs = Date.now() - position.entryTime.getTime();
    const holdTimeMinutes = holdTimeMs / (1000 * 60);
    
    // 🚨 FAST LOSS CUTTING - NO DELAYS, NO VALIDATION
    if (pnlPercent <= -1.5) { // 1.5% loss = immediate exit
      return `fast_loss_cut_${pnlPercent.toFixed(1)}%`;
    }
    
    // ⚡ QUICK MINOR LOSS PROTECTION (positions older than 2 minutes)
    if (holdTimeMinutes >= 2 && pnlPercent <= -0.5) { // 0.5% loss after 2min = exit
      return `minor_loss_protection_${pnlPercent.toFixed(1)}%`;
    }
    
    // 🎯 PROFIT MANAGEMENT - Let winners run but with trailing protection
    if (pnlPercent >= 2.0) { // Position is profitable
      // Trailing stop: close if profit drops below 1% (from 2%+)
      if (pnlPercent <= 1.0) {
        return `trailing_profit_protection_${pnlPercent.toFixed(1)}%`;
      }
      
      // For very profitable positions (5%+), use wider trailing stop
      if (pnlPercent >= 5.0 && pnlPercent <= 3.0) {
        return `wide_trailing_stop_${pnlPercent.toFixed(1)}%`;
      }
    }
    
    // 📈 QUICK PROFIT TAKING for small positions
    if (pnlPercent >= 1.0 && holdTimeMinutes <= 3) {
      return `quick_profit_${pnlPercent.toFixed(1)}%_${holdTimeMinutes.toFixed(1)}min`;
    }
    
    // ⏰ TIME-BASED EXITS - More intelligent with strategy validation
    // Phase 3/4 AI-validated positions get more time to develop
    const isAIValidated = position.strategy.includes('phase-3') || position.strategy.includes('phase-4');
    const isQuantumForge = position.strategy.includes('quantum-forge');
    
    // For AI-validated positions, allow longer hold times
    if (isAIValidated) {
      // Only exit if losing significantly after extended time
      if (holdTimeMinutes >= 20 && pnlPercent <= -2.0) {
        return `ai_validated_loss_exit_${holdTimeMinutes.toFixed(1)}min_${pnlPercent.toFixed(1)}%`;
      }
      
      // For quantum forge positions, even more patience
      if (isQuantumForge) {
        // Allow up to 45 minutes for quantum forge validated positions
        if (holdTimeMinutes >= 45 && pnlPercent < 0) {
          return `quantum_forge_time_exit_${holdTimeMinutes.toFixed(1)}min_${pnlPercent.toFixed(1)}%`;
        }
      } else {
        // Regular AI positions get 30 minutes
        if (holdTimeMinutes >= 30 && pnlPercent < 0) {
          return `ai_time_exit_${holdTimeMinutes.toFixed(1)}min_${pnlPercent.toFixed(1)}%`;
        }
      }
    } else {
      // Non-AI positions use original 10-minute rule but only if losing
      if (holdTimeMinutes >= 10 && pnlPercent < 0) {
        return `basic_time_exit_${holdTimeMinutes.toFixed(1)}min_${pnlPercent.toFixed(1)}%`;
      }
    }
    
    // ❌ EMERGENCY EXIT: Positions older than 60 minutes (regardless of P&L)
    if (holdTimeMinutes >= 60) {
      return `emergency_time_exit_${holdTimeMinutes.toFixed(1)}min`;
    }
    
    // 🔄 LEGACY EXIT CONDITIONS (fallback)
    if (position.stopLoss) {
      if (position.side === 'long' && currentPrice <= position.stopLoss) {
        return 'legacy_stop_loss';
      }
      if (position.side === 'short' && currentPrice >= position.stopLoss) {
        return 'legacy_stop_loss';
      }
    }
    
    if (position.takeProfit) {
      if (position.side === 'long' && currentPrice >= position.takeProfit) {
        return 'legacy_take_profit';
      }
      if (position.side === 'short' && currentPrice <= position.takeProfit) {
        return 'legacy_take_profit';
      }
    }
    
    return null; // Hold the position
  }
  
  /**
   * Get exit strategy for a strategy/symbol combination
   */
  private getExitStrategy(strategy: string, symbol: string): ExitStrategy | undefined {
    const specificKey = `${strategy}:${symbol}`;
    const genericKey = `${strategy}:*`;
    
    const specific = this.exitStrategies.get(specificKey);
    const generic = this.exitStrategies.get(genericKey);
    
    console.log(`🎯 EXIT STRATEGY LOOKUP: ${strategy} / ${symbol}`);
    console.log(`   Available strategies: ${Array.from(this.exitStrategies.keys()).join(', ')}`);
    console.log(`   Looking for: ${specificKey} OR ${genericKey}`);
    console.log(`   Found: ${specific ? 'specific' : generic ? 'generic' : 'NONE'}`);
    
    return specific || generic;
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
   * Get all open positions for a symbol (public method)
   */
  getOpenPositionsBySymbol(symbol: string): Position[] {
    return Array.from(this.positions.values()).filter(
      p => p.symbol === symbol && p.status === 'open'
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
   * Load open positions from database
   */
  private async loadOpenPositionsFromDatabase() {
    try {
      const dbPositions = await this.prisma.managedPosition.findMany({
        where: { status: 'open' }
      });
      
      for (const dbPos of dbPositions) {
        const position: Position = {
          id: dbPos.id,
          strategy: dbPos.strategy,
          symbol: dbPos.symbol,
          side: dbPos.side as 'long' | 'short',
          entryPrice: dbPos.entryPrice,
          quantity: dbPos.quantity,
          entryTradeId: dbPos.entryTradeId,
          entryTime: dbPos.entryTime,
          exitPrice: dbPos.exitPrice || undefined,
          exitTradeId: dbPos.exitTradeId || undefined,
          exitTime: dbPos.exitTime || undefined,
          status: dbPos.status as 'open' | 'closed',
          realizedPnL: dbPos.realizedPnL || undefined,
          unrealizedPnL: dbPos.unrealizedPnL || undefined,
          stopLoss: dbPos.stopLoss || undefined,
          takeProfit: dbPos.takeProfit || undefined,
          maxHoldTime: dbPos.maxHoldTime || undefined
        };
        
        this.positions.set(position.id, position);
      }
    } catch (error) {
      console.error('❌ Failed to load positions from database:', error);
    }
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