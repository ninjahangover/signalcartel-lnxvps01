/**
 * Position Management Service
 * Integrates position management with existing trading strategies
 */

import { PrismaClient } from '@prisma/client';
import { PositionManager, TradingSignal, ExitStrategy } from './position-manager';

export class PositionService {
  private positionManager: PositionManager;
  private prisma: PrismaClient;
  
  constructor() {
    this.prisma = new PrismaClient();
    this.positionManager = new PositionManager(this.prisma);
    this.initializeDefaultExitStrategies();
  }
  
  /**
   * Initialize default exit strategies for common trading strategies
   */
  private initializeDefaultExitStrategies() {
    // RSI Strategy - Quick scalping with tight stops
    this.positionManager.registerExitStrategy({
      strategy: 'rsi-strategy',
      takeProfitPercent: 0.02, // 2% profit target
      stopLossPercent: 0.01,   // 1% stop loss
      maxHoldMinutes: 30,      // Exit after 30 minutes max
      reverseSignalExit: true  // Exit when opposite RSI signal occurs
    });
    
    // Bollinger Bands - Medium-term mean reversion
    this.positionManager.registerExitStrategy({
      strategy: 'bollinger-strategy',
      takeProfitPercent: 0.03, // 3% profit target
      stopLossPercent: 0.015,  // 1.5% stop loss
      maxHoldMinutes: 60,      // Exit after 1 hour max
      reverseSignalExit: true
    });
    
    // Neural Network - Adaptive strategy
    this.positionManager.registerExitStrategy({
      strategy: 'neural-strategy',
      takeProfitPercent: 0.025, // 2.5% profit target
      stopLossPercent: 0.012,   // 1.2% stop loss
      maxHoldMinutes: 45,       // Exit after 45 minutes max
      trailingStopPercent: 0.008 // 0.8% trailing stop
    });
    
    // Quantum Oscillator - Momentum-based
    this.positionManager.registerExitStrategy({
      strategy: 'quantum-oscillator',
      takeProfitPercent: 0.04, // 4% profit target (higher risk/reward)
      stopLossPercent: 0.02,   // 2% stop loss
      maxHoldMinutes: 90,      // Exit after 90 minutes max
      reverseSignalExit: true
    });
    
    console.log('🎯 Default exit strategies initialized for all trading strategies');
  }
  
  /**
   * Process a trading signal through position management system with Mathematical Intuition
   */
  async processSignal(signal: TradingSignal) {
    try {
      // Run Mathematical Intuition Analysis alongside traditional processing
      console.log('🧠 MATHEMATICAL INTUITION: Analyzing signal through flow field resonance...');
      
      let intuitionAnalysis = null;
      try {
        const { MathematicalIntuitionEngine } = await import('../mathematical-intuition-engine');
        const intuitionEngine = MathematicalIntuitionEngine.getInstance();
        
        const marketData = {
          price: signal.price,
          timestamp: signal.timestamp,
          symbol: signal.symbol,
          volume: 1000000, // Default volume
          strategy: signal.strategy || 'position-managed'
        };
        
        intuitionAnalysis = await intuitionEngine.runParallelAnalysisSimple(signal, marketData);
        
        console.log('🧠 INTUITION vs TRADITIONAL ANALYSIS:');
        console.log(`  Flow Field Resonance: ${(intuitionAnalysis.intuition.flowFieldResonance * 100).toFixed(1)}%`);
        console.log(`  Pattern Resonance: ${(intuitionAnalysis.intuition.patternResonance * 100).toFixed(1)}%`);
        console.log(`  Overall Intuition: ${(intuitionAnalysis.intuition.overallIntuition * 100).toFixed(1)}%`);
        console.log(`  Traditional Expectancy: ${(intuitionAnalysis.traditional.expectancyScore * 100).toFixed(1)}%`);
        console.log(`  Performance Gap: ${(intuitionAnalysis.performanceGap * 100).toFixed(1)}%`);
        console.log(`  Final Recommendation: ${intuitionAnalysis.recommendation}`);
        
        // Enhance signal confidence based on intuition analysis
        if (intuitionAnalysis.performanceGap > 0.1) {
          signal.confidence = Math.min(0.95, signal.confidence * (1 + intuitionAnalysis.performanceGap));
          console.log(`🚀 Mathematical Intuition boosted confidence to ${(signal.confidence * 100).toFixed(1)}%`);
        }
        
      } catch (intuitionError) {
        console.warn('⚠️ Mathematical Intuition analysis failed:', intuitionError.message);
      }

      const result = await this.positionManager.processSignal(signal);
      
      if (result.action === 'opened') {
        console.log(`📈 POSITION OPENED: ${result.position?.side} ${result.position?.symbol} - ${result.position?.strategy}`);
      } else if (result.action === 'closed') {
        console.log(`📉 POSITION CLOSED: P&L = $${result.pnl?.toFixed(2)}`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error processing signal through position manager:', error);
      return { action: 'ignored' as const };
    }
  }
  
  /**
   * Monitor all positions and close those meeting exit criteria
   */
  async monitorPositions() {
    try {
      // Get current market prices (in production, this would come from live feeds)
      const currentPrices = await this.getCurrentMarketPrices();
      
      // Monitor all open positions
      const closedPositions = await this.positionManager.monitorPositions(currentPrices);
      
      if (closedPositions.length > 0) {
        console.log(`🔄 Position monitor closed ${closedPositions.length} positions`);
        closedPositions.forEach(({ position, pnl }) => {
          console.log(`  ✅ Closed ${position.side} ${position.symbol} for $${pnl.toFixed(2)} P&L`);
        });
      }
      
      return closedPositions;
    } catch (error) {
      console.error('❌ Error monitoring positions:', error);
      return [];
    }
  }
  
  /**
   * Get current market prices for position monitoring
   */
  private async getCurrentMarketPrices(): Promise<{ [symbol: string]: number }> {
    // In production, this would fetch from real market data APIs
    // For now, use reasonable current prices
    return {
      'BTCUSD': 65000,
      'ETHUSD': 2500,
      'SOLUSD': 150,
      'ADAUSD': 0.50,
      'LINKUSD': 15,
      'DOTUSD': 8,
      'AVAXUSD': 35,
      'MATICUSD': 0.80
    };
  }
  
  /**
   * Get portfolio summary with real P&L from position management
   */
  async getPortfolioSummary() {
    try {
      const summary = this.positionManager.getPortfolioSummary();
      
      // Get additional data from database
      const openPositions = await this.prisma.managedPosition.findMany({
        where: { status: 'open' },
        include: { 
          entryTrade: true,
          exitTrade: true
        }
      });
      
      const closedPositions = await this.prisma.managedPosition.findMany({
        where: { status: 'closed' },
        include: { 
          entryTrade: true,
          exitTrade: true
        }
      });
      
      return {
        ...summary,
        openPositionsDetail: openPositions.map(pos => ({
          id: pos.id,
          strategy: pos.strategy,
          symbol: pos.symbol,
          side: pos.side,
          entryPrice: pos.entryPrice,
          quantity: pos.quantity,
          unrealizedPnL: pos.unrealizedPnL,
          entryTime: pos.entryTime,
          stopLoss: pos.stopLoss,
          takeProfit: pos.takeProfit
        })),
        recentClosedPositions: closedPositions
          .sort((a, b) => (b.exitTime?.getTime() || 0) - (a.exitTime?.getTime() || 0))
          .slice(0, 10)
          .map(pos => ({
            id: pos.id,
            strategy: pos.strategy,
            symbol: pos.symbol,
            side: pos.side,
            entryPrice: pos.entryPrice,
            exitPrice: pos.exitPrice,
            quantity: pos.quantity,
            realizedPnL: pos.realizedPnL,
            holdTime: pos.exitTime && pos.entryTime ? 
              pos.exitTime.getTime() - pos.entryTime.getTime() : null
          }))
      };
    } catch (error) {
      console.error('❌ Error getting portfolio summary:', error);
      return this.positionManager.getPortfolioSummary();
    }
  }
  
  /**
   * Update exit strategy for a specific trading strategy
   */
  async updateExitStrategy(strategy: string, exitStrategy: Partial<ExitStrategy>) {
    try {
      // Save to database
      await this.prisma.exitStrategy.upsert({
        where: { 
          strategy_symbol: { 
            strategy, 
            symbol: exitStrategy.symbol || null 
          } 
        },
        update: {
          takeProfitPercent: exitStrategy.takeProfitPercent,
          stopLossPercent: exitStrategy.stopLossPercent,
          trailingStopPercent: exitStrategy.trailingStopPercent,
          maxHoldMinutes: exitStrategy.maxHoldMinutes,
          reverseSignalExit: exitStrategy.reverseSignalExit || false
        },
        create: {
          strategy,
          symbol: exitStrategy.symbol || null,
          takeProfitPercent: exitStrategy.takeProfitPercent,
          stopLossPercent: exitStrategy.stopLossPercent,
          trailingStopPercent: exitStrategy.trailingStopPercent,
          maxHoldMinutes: exitStrategy.maxHoldMinutes,
          reverseSignalExit: exitStrategy.reverseSignalExit || false
        }
      });
      
      // Update in-memory position manager
      this.positionManager.registerExitStrategy({
        strategy,
        ...exitStrategy
      } as ExitStrategy);
      
      console.log(`🎯 Updated exit strategy for ${strategy}`);
    } catch (error) {
      console.error('❌ Error updating exit strategy:', error);
    }
  }
  
  /**
   * Get all active exit strategies
   */
  async getExitStrategies() {
    try {
      return await this.prisma.exitStrategy.findMany();
    } catch (error) {
      console.error('❌ Error fetching exit strategies:', error);
      return [];
    }
  }
  
  /**
   * Force close a position (manual override)
   */
  async forceClosePosition(positionId: string, reason: string = 'manual_override') {
    try {
      const currentPrices = await this.getCurrentMarketPrices();
      const position = await this.prisma.managedPosition.findUnique({ where: { id: positionId } });
      
      if (!position || position.status === 'closed') {
        throw new Error(`Position ${positionId} not found or already closed`);
      }
      
      const currentPrice = currentPrices[position.symbol];
      if (!currentPrice) {
        throw new Error(`No current price available for ${position.symbol}`);
      }
      
      return await this.positionManager.closePosition(positionId, currentPrice, reason);
    } catch (error) {
      console.error('❌ Error force closing position:', error);
      throw error;
    }
  }
  
  /**
   * Start position monitoring service (should be called in background)
   */
  startMonitoring(intervalMs: number = 30000) { // 30 seconds default
    console.log(`🔄 Starting position monitoring service (${intervalMs}ms intervals)`);
    
    setInterval(async () => {
      await this.monitorPositions();
    }, intervalMs);
  }
  
  /**
   * Cleanup - disconnect from database
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

// Export singleton instance
export const positionService = new PositionService();