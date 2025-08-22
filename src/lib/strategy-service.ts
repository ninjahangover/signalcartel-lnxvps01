// Strategy Service for managing Pine Script strategies and parameters
import { prisma } from '@/lib/prisma';
import { PineScriptParser, type ParsedPineStrategy } from './pine-parser';

export interface CreateStrategyRequest {
  userId: string;
  name: string;
  description?: string;
  pineScriptCode: string;
  tradingPairs: string[];
  timeframe?: string;
}

export interface UpdateParameterRequest {
  strategyId: string;
  parameterName: string;
  newValue: string;
  reason: string;
  marketConditions?: {
    volatility?: number;
    momentum?: number;
    volume?: number;
    regime?: string;
  };
}

export class StrategyService {
  // Create a new Pine Script strategy
  static async createStrategy(request: CreateStrategyRequest) {
    try {
      // Parse the Pine Script code
      const parsedStrategy = PineScriptParser.parse(request.pineScriptCode);
      
      // Validate the Pine Script
      const validation = PineScriptParser.validateSyntax(request.pineScriptCode);
      if (!validation.isValid) {
        throw new Error(`Pine Script validation failed: ${validation.errors.join(', ')}`);
      }

      // Create the strategy record
      const strategy = await prisma.pineStrategy.create({
        data: {
          userId: request.userId,
          name: request.name,
          description: request.description,
          pineScriptCode: request.pineScriptCode,
          version: '1.0',
          strategyType: parsedStrategy.strategyType,
          timeframe: request.timeframe || parsedStrategy.timeframe,
          tradingPairs: JSON.stringify(request.tradingPairs),
          isActive: false,
          isOptimized: false,
        },
      });

      // Create parameter records
      const parameterPromises = parsedStrategy.parameters.map(param =>
        prisma.strategyParameter.create({
          data: {
            strategyId: strategy.id,
            parameterName: param.name,
            parameterType: param.type,
            category: param.category,
            currentValue: param.currentValue,
            originalValue: param.originalValue,
            minValue: param.minValue,
            maxValue: param.maxValue,
            isOptimizable: param.isOptimizable,
            optimizationPriority: param.priority,
            volatilityAdjustment: param.marketAdjustments.volatility,
            volumeAdjustment: param.marketAdjustments.volume,
            momentumAdjustment: param.marketAdjustments.momentum,
          },
        })
      );

      await Promise.all(parameterPromises);

      return {
        strategy,
        parsedStrategy,
        message: 'Strategy created successfully',
      };
    } catch (error) {
      console.error('Error creating strategy:', error);
      throw error;
    }
  }

  // Get user's strategies with parameters
  static async getUserStrategies(userId: string) {
    try {
      const strategies = await prisma.pineStrategy.findMany({
        where: { userId },
        include: {
          parameters: {
            orderBy: [
              { optimizationPriority: 'asc' },
              { parameterName: 'asc' }
            ],
          },
          optimizations: {
            orderBy: { createdAt: 'desc' },
            take: 5, // Get last 5 optimizations
          },
          performances: {
            orderBy: { calculatedAt: 'desc' },
            take: 1, // Get latest performance
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return strategies.map(strategy => ({
        ...strategy,
        tradingPairs: strategy.tradingPairs.includes(',') ? strategy.tradingPairs.split(',') : [strategy.tradingPairs],
      }));
    } catch (error) {
      console.error('Error fetching user strategies:', error);
      throw error;
    }
  }

  // Get single strategy with full details
  static async getStrategyById(strategyId: string, userId: string) {
    try {
      const strategy = await prisma.pineStrategy.findFirst({
        where: { 
          id: strategyId,
          userId, // Ensure user owns this strategy
        },
        include: {
          parameters: true,
          optimizations: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          performances: {
            orderBy: { calculatedAt: 'desc' },
            take: 30, // Last 30 performance records
          },
        },
      });

      if (!strategy) {
        throw new Error('Strategy not found');
      }

      return {
        ...strategy,
        tradingPairs: strategy.tradingPairs.includes(',') ? strategy.tradingPairs.split(',') : [strategy.tradingPairs],
      };
    } catch (error) {
      console.error('Error fetching strategy:', error);
      throw error;
    }
  }

  // Update strategy parameter (manual or automatic optimization)
  static async updateParameter(request: UpdateParameterRequest) {
    try {
      const parameter = await prisma.strategyParameter.findFirst({
        where: {
          strategy: { id: request.strategyId },
          parameterName: request.parameterName,
        },
        include: { strategy: true },
      });

      if (!parameter) {
        throw new Error('Parameter not found');
      }

      // Store previous value for optimization history
      const previousValue = parameter.currentValue;

      // Update the parameter
      const updatedParameter = await prisma.strategyParameter.update({
        where: { id: parameter.id },
        data: {
          currentValue: request.newValue,
          lastChangedAt: new Date(),
        },
      });

      // Create optimization record
      await prisma.strategyOptimization.create({
        data: {
          strategyId: request.strategyId,
          optimizationType: 'manual', // Will be 'automatic' when AI does it
          triggerReason: request.reason,
          parametersChanged: JSON.stringify({
            [request.parameterName]: {
              from: previousValue,
              to: request.newValue,
            },
          }),
          previousParameters: JSON.stringify({ [request.parameterName]: previousValue }),
          marketVolatility: request.marketConditions?.volatility,
          marketMomentum: request.marketConditions?.momentum,
          volumeAverage: request.marketConditions?.volume,
          marketRegime: request.marketConditions?.regime,
          wasApplied: true,
          appliedAt: new Date(),
        },
      });

      // Update strategy's last optimized timestamp
      await prisma.pineStrategy.update({
        where: { id: request.strategyId },
        data: { 
          lastOptimizedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return {
        parameter: updatedParameter,
        message: 'Parameter updated successfully',
      };
    } catch (error) {
      console.error('Error updating parameter:', error);
      throw error;
    }
  }

  // Activate/deactivate strategy
  static async toggleStrategy(strategyId: string, userId: string, isActive: boolean) {
    try {
      const strategy = await prisma.pineStrategy.updateMany({
        where: { 
          id: strategyId,
          userId, // Ensure user owns this strategy
        },
        data: { 
          isActive,
          updatedAt: new Date(),
        },
      });

      if (strategy.count === 0) {
        throw new Error('Strategy not found or access denied');
      }

      return {
        message: `Strategy ${isActive ? 'activated' : 'deactivated'} successfully`,
      };
    } catch (error) {
      console.error('Error toggling strategy:', error);
      throw error;
    }
  }

  // Record strategy performance
  static async recordPerformance(
    strategyId: string,
    timeframe: string,
    performance: {
      totalTrades: number;
      winningTrades: number;
      losingTrades: number;
      totalPnL: number;
      avgWin: number;
      avgLoss: number;
      maxDrawdown: number;
      sharpeRatio?: number;
      periodStart: Date;
      periodEnd: Date;
      marketConditions?: {
        avgVolatility?: number;
        avgVolume?: number;
        marketTrend?: 'bullish' | 'bearish' | 'sideways';
      };
    }
  ) {
    try {
      const winRate = performance.totalTrades > 0 
        ? (performance.winningTrades / performance.totalTrades) * 100 
        : 0;

      const performanceRecord = await prisma.strategyPerformance.create({
        data: {
          strategyId,
          timeframe,
          totalTrades: performance.totalTrades,
          winningTrades: performance.winningTrades,
          losingTrades: performance.losingTrades,
          winRate,
          totalPnL: performance.totalPnL,
          avgWin: performance.avgWin,
          avgLoss: performance.avgLoss,
          maxDrawdown: performance.maxDrawdown,
          sharpeRatio: performance.sharpeRatio,
          avgVolatility: performance.marketConditions?.avgVolatility,
          avgVolume: performance.marketConditions?.avgVolume,
          marketTrend: performance.marketConditions?.marketTrend,
          periodStart: performance.periodStart,
          periodEnd: performance.periodEnd,
        },
      });

      // Update strategy's overall performance stats
      await prisma.pineStrategy.update({
        where: { id: strategyId },
        data: {
          currentWinRate: winRate,
          totalTrades: performance.totalTrades,
          profitLoss: performance.totalPnL,
          updatedAt: new Date(),
        },
      });

      return performanceRecord;
    } catch (error) {
      console.error('Error recording performance:', error);
      throw error;
    }
  }

  // Get strategies ready for optimization (based on performance decline or market changes)
  static async getStrategiesForOptimization() {
    try {
      // Find active strategies that haven't been optimized recently
      // or have declining performance
      const strategies = await prisma.pineStrategy.findMany({
        where: {
          isActive: true,
          OR: [
            // Never optimized
            { lastOptimizedAt: null },
            // Not optimized in last 24 hours
            { lastOptimizedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
            // Win rate below 60%
            { currentWinRate: { lt: 60 } },
          ],
        },
        include: {
          parameters: {
            where: { isOptimizable: true },
            orderBy: { optimizationPriority: 'asc' },
          },
          performances: {
            orderBy: { calculatedAt: 'desc' },
            take: 5,
          },
        },
      });

      return strategies.map(strategy => ({
        ...strategy,
        tradingPairs: strategy.tradingPairs.includes(',') ? strategy.tradingPairs.split(',') : [strategy.tradingPairs],
      }));
    } catch (error) {
      console.error('Error fetching strategies for optimization:', error);
      throw error;
    }
  }

  // Delete strategy
  static async deleteStrategy(strategyId: string, userId: string) {
    try {
      const result = await prisma.pineStrategy.deleteMany({
        where: { 
          id: strategyId,
          userId, // Ensure user owns this strategy
        },
      });

      if (result.count === 0) {
        throw new Error('Strategy not found or access denied');
      }

      return {
        message: 'Strategy deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting strategy:', error);
      throw error;
    }
  }
}

export default StrategyService;