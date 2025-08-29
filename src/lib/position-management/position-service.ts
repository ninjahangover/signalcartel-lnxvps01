/**
 * Position Management Service
 * Integrates position management with existing trading strategies
 */

import { PrismaClient } from '@prisma/client';
import { PositionManager, TradingSignal, ExitStrategy } from './position-manager';
import { phaseManager, PhaseConfig } from '../quantum-forge-phase-config';

export class PositionService {
  private positionManager: PositionManager;
  private prisma: PrismaClient;
  
  constructor() {
    this.prisma = new PrismaClient();
    this.positionManager = new PositionManager(this.prisma);
    
    // 🛡️ CRITICAL: Ensure core exit strategies are protected and available
    this.ensureCoreStrategiesProtected();
    
    this.initializeDefaultExitStrategies();
    this.loadExitStrategiesFromDatabase();
  }
  
  /**
   * 🛡️ CRITICAL SYSTEM PROTECTION: Ensure core exit strategies are always available
   * This protects the system from database resets that would remove core strategies
   */
  private async ensureCoreStrategiesProtected() {
    try {
      // Import and run the protection system
      const { ensureCoreExitStrategies } = await import('../../../admin/ensure-core-exit-strategies');
      await ensureCoreExitStrategies();
      console.log('🛡️ Core exit strategies protected and verified');
    } catch (error) {
      console.error('❌ Failed to protect core exit strategies:', error.message);
      // Continue startup but warn that system may not work properly
      console.warn('⚠️ System starting without protected strategies - positions may not close properly!');
    }
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
    
    // Phase-0 AI Strategy - Very aggressive for data collection
    this.positionManager.registerExitStrategy({
      strategy: 'phase-0-ai-basic-technical',
      takeProfitPercent: 0.01, // 1% profit target (quick wins)
      stopLossPercent: 0.005,  // 0.5% stop loss (tight risk control)
      maxHoldMinutes: 5,       // Exit after 5 minutes max (very quick)
      reverseSignalExit: false
    });
    
    // Phase-1 AI Strategy - Conservative
    this.positionManager.registerExitStrategy({
      strategy: 'phase-1-ai-basic-technical',
      takeProfitPercent: 0.015, // 1.5% profit target
      stopLossPercent: 0.01,   // 1% stop loss
      maxHoldMinutes: 15,      // Exit after 15 minutes max
      reverseSignalExit: false
    });
    
    console.log('🎯 Default exit strategies initialized for all trading strategies');
  }

  /**
   * Load exit strategies from database
   */
  private async loadExitStrategiesFromDatabase() {
    try {
      const exitStrategies = await this.prisma.exitStrategy.findMany();
      
      for (const strategy of exitStrategies) {
        this.positionManager.registerExitStrategy({
          strategy: strategy.strategy,
          symbol: strategy.symbol || undefined,
          takeProfitPercent: strategy.takeProfitPercent || undefined,
          stopLossPercent: strategy.stopLossPercent || undefined,
          trailingStopPercent: strategy.trailingStopPercent || undefined,
          maxHoldMinutes: strategy.maxHoldMinutes || undefined,
          reverseSignalExit: strategy.reverseSignalExit || false
        });
        
        console.log(`📋 Loaded exit strategy from database: ${strategy.strategy}`);
      }
      
      console.log(`✅ Loaded ${exitStrategies.length} exit strategies from database`);
    } catch (error) {
      console.error('❌ Error loading exit strategies from database:', error);
    }
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
        const { mathIntuitionEngine } = (await import('../mathematical-intuition-engine')).default;
        
        const marketData = {
          price: signal.price,
          timestamp: signal.timestamp,
          symbol: signal.symbol,
          volume: 1000000, // Default volume
          strategy: signal.strategy || 'position-managed'
        };
        
        intuitionAnalysis = await mathIntuitionEngine.runParallelAnalysisSimple(signal, marketData);
        
        console.log('🧠 INTUITION vs TRADITIONAL ANALYSIS:');
        console.log(`  Flow Field Resonance: ${((intuitionAnalysis?.intuition?.flowFieldResonance || 0) * 100).toFixed(1)}%`);
        console.log(`  Pattern Resonance: ${((intuitionAnalysis?.intuition?.patternResonance || 0) * 100).toFixed(1)}%`);
        console.log(`  Overall Intuition: ${((intuitionAnalysis?.intuition?.overallIntuition || 0) * 100).toFixed(1)}%`);
        console.log(`  Traditional Expectancy: ${((intuitionAnalysis?.traditional?.expectancyScore || 0) * 100).toFixed(1)}%`);
        console.log(`  Performance Gap: ${((intuitionAnalysis?.performanceGap || 0) * 100).toFixed(1)}%`);
        console.log(`  Final Recommendation: ${intuitionAnalysis?.recommendation || 'unknown'}`);
        
        // Enhance signal confidence based on intuition analysis
        if ((intuitionAnalysis?.performanceGap || 0) > 0.1) {
          signal.confidence = Math.min(0.95, signal.confidence * (1 + (intuitionAnalysis?.performanceGap || 0)));
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
   * Get current market prices for position monitoring - REAL DATA ONLY
   */
  private async getCurrentMarketPrices(): Promise<{ [symbol: string]: number }> {
    const { realTimePriceFetcher } = await import('@/lib/real-time-price-fetcher');
    const symbols = ['BTCUSD', 'ETHUSD', 'SOLUSD', 'ADAUSD', 'LINKUSD', 'DOTUSD', 'AVAXUSD', 'MATICUSD'];
    const prices: { [symbol: string]: number } = {};
    
    await Promise.all(symbols.map(async (symbol) => {
      try {
        const priceData = await realTimePriceFetcher.getCurrentPrice(symbol);
        if (priceData.success && priceData.price > 0) {
          prices[symbol] = priceData.price;
        } else {
          console.error(`❌ Failed to get real price for ${symbol}: ${priceData.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error(`❌ Error fetching price for ${symbol}:`, error);
      }
    }));
    
    return prices;
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