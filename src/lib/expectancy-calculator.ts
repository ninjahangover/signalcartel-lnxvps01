/**
 * Expectancy Calculator - Real-time profit optimization using mathematical expectancy
 * Formula: E = (W × A) - (L × B)
 * Where: W = Win probability, A = Average win, L = Loss probability, B = Average loss
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ExpectancyResult {
  strategyName: string;
  expectancy: number;
  winProbability: number;
  lossProbability: number;
  averageWin: number;
  averageLoss: number;
  totalTrades: number;
  profitFactor: number;
  kellyPercent: number;
  expectedValuePer1000: number;
}

export interface PositionSizingRecommendation {
  strategyName: string;
  kellyPercent: number;
  recommendedPositionSize: number;
  maxRiskAmount: number;
  confidenceLevel: 'high' | 'medium' | 'low';
}

class ExpectancyCalculator {
  private static instance: ExpectancyCalculator;

  private constructor() {}

  static getInstance(): ExpectancyCalculator {
    if (!ExpectancyCalculator.instance) {
      ExpectancyCalculator.instance = new ExpectancyCalculator();
    }
    return ExpectancyCalculator.instance;
  }

  /**
   * Calculate expectancy for a specific strategy using completed trades
   */
  async calculateStrategyExpectancy(strategyName: string): Promise<ExpectancyResult> {
    // Get completed trades (exit trades with P&L) for the strategy
    const trades = await prisma.paperTrade.findMany({
      where: {
        strategy: strategyName,
        pnl: { not: null }, // Only completed trades
        isEntry: false     // Only exit trades (completed positions)
      },
      select: {
        pnl: true,
        executedAt: true
      },
      orderBy: { executedAt: 'desc' }
    });

    if (trades.length === 0) {
      return this.getDefaultExpectancy(strategyName);
    }

    // Separate winning and losing trades
    const winningTrades = trades.filter(t => (t.pnl || 0) > 0);
    const losingTrades = trades.filter(t => (t.pnl || 0) < 0);
    const totalTrades = trades.length;

    // Calculate probabilities
    const winProbability = winningTrades.length / totalTrades;
    const lossProbability = losingTrades.length / totalTrades;

    // Calculate average win/loss amounts
    const averageWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length
      : 0;

    const averageLoss = losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length)
      : 0;

    // Calculate expectancy: E = (W × A) - (L × B)
    const expectancy = (winProbability * averageWin) - (lossProbability * averageLoss);

    // Calculate profit factor (gross profit / gross loss)
    const grossProfit = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

    // Calculate Kelly Criterion percentage for optimal position sizing
    // Kelly % = (bp - q) / b, where b = odds, p = win prob, q = loss prob
    const kellyPercent = this.calculateKellyPercent(winProbability, averageWin, averageLoss);

    // Expected value per $1000 invested
    const expectedValuePer1000 = expectancy * 1000;

    return {
      strategyName,
      expectancy,
      winProbability,
      lossProbability,
      averageWin,
      averageLoss,
      totalTrades,
      profitFactor,
      kellyPercent,
      expectedValuePer1000
    };
  }

  /**
   * Calculate Kelly Criterion percentage for optimal position sizing
   */
  private calculateKellyPercent(winProb: number, avgWin: number, avgLoss: number): number {
    if (avgLoss === 0) return 0;
    
    const odds = avgWin / avgLoss;
    const kelly = (winProb * odds - (1 - winProb)) / odds;
    
    // Cap Kelly at 25% for risk management
    return Math.max(0, Math.min(kelly * 100, 25));
  }

  /**
   * Get expectancy for all active strategies
   */
  async calculateAllStrategiesExpectancy(): Promise<ExpectancyResult[]> {
    // Get strategy names from PineStrategy table
    const pineStrategies = await prisma.pineStrategy.findMany({
      where: { isActive: true },
      select: { name: true }
    });

    // Get actual strategy names from trades (for custom engines like CustomPaperEngine)
    const actualStrategyNames = await prisma.paperTrade.findMany({
      where: { 
        pnl: { not: null }, // Only completed trades
        isEntry: false      // Only exit trades
      },
      select: { strategy: true },
      distinct: ['strategy']
    });

    // Combine both sources and remove duplicates
    const allStrategyNames = new Set([
      ...pineStrategies.map(s => s.name),
      ...actualStrategyNames.map(t => t.strategy)
    ]);

    const results: ExpectancyResult[] = [];

    for (const strategyName of allStrategyNames) {
      const expectancy = await this.calculateStrategyExpectancy(strategyName);
      results.push(expectancy);
    }

    // Sort by expectancy (highest first)
    return results.sort((a, b) => b.expectancy - a.expectancy);
  }

  /**
   * Get position sizing recommendations based on Kelly Criterion
   */
  async getPositionSizingRecommendations(accountBalance: number): Promise<PositionSizingRecommendation[]> {
    const expectancyResults = await this.calculateAllStrategiesExpectancy();
    
    return expectancyResults.map(result => {
      const maxRiskAmount = accountBalance * (result.kellyPercent / 100);
      
      let confidenceLevel: 'high' | 'medium' | 'low' = 'low';
      if (result.expectancy > 5 && result.totalTrades >= 20) {
        confidenceLevel = 'high';
      } else if (result.expectancy > 0 && result.totalTrades >= 10) {
        confidenceLevel = 'medium';
      }

      return {
        strategyName: result.strategyName,
        kellyPercent: result.kellyPercent,
        recommendedPositionSize: maxRiskAmount,
        maxRiskAmount,
        confidenceLevel
      };
    });
  }

  /**
   * Get real-time expectancy dashboard data
   */
  async getExpectancyDashboardData() {
    const expectancyResults = await this.calculateAllStrategiesExpectancy();
    
    const totalExpectancy = expectancyResults.reduce((sum, r) => sum + r.expectancy, 0);
    const avgExpectancy = expectancyResults.length > 0 ? totalExpectancy / expectancyResults.length : 0;
    
    const bestStrategy = expectancyResults[0]; // Already sorted by expectancy
    const worstStrategy = expectancyResults[expectancyResults.length - 1];

    return {
      strategies: expectancyResults,
      summary: {
        totalStrategies: expectancyResults.length,
        avgExpectancy,
        bestStrategy: bestStrategy ? {
          name: bestStrategy.strategyName,
          expectancy: bestStrategy.expectancy
        } : null,
        worstStrategy: worstStrategy ? {
          name: worstStrategy.strategyName,
          expectancy: worstStrategy.expectancy
        } : null,
        profitableStrategies: expectancyResults.filter(r => r.expectancy > 0).length
      }
    };
  }

  /**
   * Default expectancy for strategies with no completed trades
   */
  private getDefaultExpectancy(strategyName: string): ExpectancyResult {
    return {
      strategyName,
      expectancy: 0,
      winProbability: 0.5,
      lossProbability: 0.5,
      averageWin: 0,
      averageLoss: 0,
      totalTrades: 0,
      profitFactor: 0,
      kellyPercent: 0,
      expectedValuePer1000: 0
    };
  }

  /**
   * Update strategy parameters based on expectancy analysis
   */
  async optimizeStrategyParameters(strategyName: string): Promise<{
    currentExpectancy: number;
    recommendedChanges: string[];
    riskAdjustments: string[];
  }> {
    const expectancy = await this.calculateStrategyExpectancy(strategyName);
    
    const recommendedChanges: string[] = [];
    const riskAdjustments: string[] = [];

    // Analyze and provide recommendations
    if (expectancy.expectancy < 0) {
      recommendedChanges.push('Strategy showing negative expectancy - consider parameter adjustment');
      if (expectancy.winProbability < 0.5) {
        recommendedChanges.push('Win rate below 50% - tighten entry criteria or adjust indicators');
      }
      if (expectancy.averageLoss > expectancy.averageWin * 2) {
        riskAdjustments.push('Average loss is high - implement tighter stop losses');
      }
    }

    if (expectancy.kellyPercent > 20) {
      riskAdjustments.push('High Kelly percentage detected - consider position size limits');
    }

    if (expectancy.totalTrades < 30) {
      recommendedChanges.push('Limited trade history - continue monitoring for statistical significance');
    }

    return {
      currentExpectancy: expectancy.expectancy,
      recommendedChanges,
      riskAdjustments
    };
  }
}

export const expectancyCalculator = ExpectancyCalculator.getInstance();
export default ExpectancyCalculator;