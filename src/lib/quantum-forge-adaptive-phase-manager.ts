/**
 * QUANTUM FORGE™ ADAPTIVE PHASE INTELLIGENCE
 * Dynamically determines when to evolve trading intelligence based on performance metrics
 */

import { PrismaClient } from '@prisma/client';
import { phaseManager } from './quantum-forge-phase-config';

const prisma = new PrismaClient();

interface PerformanceMetrics {
  totalTrades: number;
  winRate: number;
  avgPnL: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  consistency: number; // How consistent are the results
  dataQuality: number; // Quality of data collected
}

interface PhaseReadinessScore {
  metric: string;
  score: number;
  weight: number;
  reasoning: string;
}

export class AdaptivePhaseManager {
  private static instance: AdaptivePhaseManager | null = null;
  
  static getInstance(): AdaptivePhaseManager {
    if (!AdaptivePhaseManager.instance) {
      AdaptivePhaseManager.instance = new AdaptivePhaseManager();
    }
    return AdaptivePhaseManager.instance;
  }

  /**
   * Analyze if we're ready to advance to the next phase using quantum intelligence
   */
  async analyzePhaseReadiness(): Promise<{
    currentPhase: number;
    recommendedPhase: number;
    readinessScore: number;
    metrics: PerformanceMetrics;
    analysis: PhaseReadinessScore[];
    recommendation: string;
    confidence: number;
  }> {
    // Get current performance metrics
    const metrics = await this.calculatePerformanceMetrics();
    const currentPhase = (await phaseManager.getCurrentPhase()).phase;
    
    // Calculate readiness scores for each aspect
    const readinessScores: PhaseReadinessScore[] = [];
    
    // 1. DATA VOLUME READINESS (Do we have enough data?)
    const dataVolumeScore = this.calculateDataVolumeReadiness(metrics.totalTrades, currentPhase);
    readinessScores.push(dataVolumeScore);
    
    // 2. PERFORMANCE STABILITY (Is performance stable enough?)
    const stabilityScore = this.calculateStabilityReadiness(metrics);
    readinessScores.push(stabilityScore);
    
    // 3. WIN RATE TRAJECTORY (Is win rate improving or stable?)
    const trajectoryScore = await this.calculateTrajectoryReadiness();
    readinessScores.push(trajectoryScore);
    
    // 4. RISK METRICS (Is risk under control?)
    const riskScore = this.calculateRiskReadiness(metrics);
    readinessScores.push(riskScore);
    
    // 5. DATA QUALITY (Is the data diverse and meaningful?)
    const qualityScore = await this.calculateDataQualityReadiness();
    readinessScores.push(qualityScore);
    
    // Calculate weighted readiness score
    const totalWeight = readinessScores.reduce((sum, s) => sum + s.weight, 0);
    const weightedScore = readinessScores.reduce((sum, s) => sum + (s.score * s.weight), 0) / totalWeight;
    
    // Determine recommended phase based on readiness
    let recommendedPhase = currentPhase;
    let recommendation = '';
    let confidence = weightedScore;
    
    if (weightedScore >= 0.75 && metrics.totalTrades >= this.getMinTradesForPhase(currentPhase + 1)) {
      recommendedPhase = currentPhase + 1;
      recommendation = `ADVANCE TO PHASE ${recommendedPhase}: Strong readiness across all metrics`;
    } else if (weightedScore >= 0.60 && metrics.totalTrades >= this.getMinTradesForPhase(currentPhase + 1) * 0.8) {
      recommendedPhase = currentPhase + 1;
      recommendation = `CONSIDER ADVANCING: Good readiness, but monitor closely`;
      confidence = weightedScore * 0.9; // Slightly less confident
    } else if (weightedScore < 0.40 && currentPhase > 0) {
      recommendedPhase = currentPhase - 1;
      recommendation = `CONSIDER REVERTING: Performance issues detected, simplify approach`;
      confidence = 1 - weightedScore; // Confidence in reverting
    } else {
      recommendation = `MAINTAIN PHASE ${currentPhase}: Continue gathering data and stabilizing performance`;
    }
    
    // Special case: If losing money consistently, recommend Phase 0
    if (metrics.avgPnL < -0.02 && metrics.winRate < 0.35 && metrics.totalTrades > 20) {
      recommendedPhase = 0;
      recommendation = `EMERGENCY: Revert to Phase 0 - Significant losses detected`;
      confidence = 0.95;
    }
    
    return {
      currentPhase,
      recommendedPhase,
      readinessScore: weightedScore,
      metrics,
      analysis: readinessScores,
      recommendation,
      confidence
    };
  }
  
  private async calculatePerformanceMetrics(): Promise<PerformanceMetrics> {
    // Get completed trades
    const trades = await prisma.managedTrade.findMany({
      where: {
        exitPrice: { not: null },
        exitTime: { not: null }
      },
      orderBy: { exitTime: 'asc' }
    });
    
    const totalTrades = trades.length;
    if (totalTrades === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        avgPnL: 0,
        profitFactor: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        consistency: 0,
        dataQuality: 0
      };
    }
    
    // Calculate metrics
    const winningTrades = trades.filter(t => (t.pnl || 0) > 0);
    const losingTrades = trades.filter(t => (t.pnl || 0) < 0);
    const winRate = winningTrades.length / totalTrades;
    
    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const avgPnL = totalPnL / totalTrades;
    
    // Profit factor (gross profit / gross loss)
    const grossProfit = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
    
    // Sharpe ratio approximation (return / volatility)
    const returns = trades.map(t => (t.pnl || 0) / (t.entryPrice || 1));
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized
    
    // Max drawdown calculation
    let peak = 0;
    let maxDrawdown = 0;
    let runningPnL = 0;
    
    for (const trade of trades) {
      runningPnL += trade.pnl || 0;
      peak = Math.max(peak, runningPnL);
      const drawdown = peak > 0 ? (peak - runningPnL) / peak : 0;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    // Consistency score (how steady are the results)
    const recentTrades = trades.slice(-20); // Last 20 trades
    const recentWinRate = recentTrades.filter(t => (t.pnl || 0) > 0).length / Math.max(recentTrades.length, 1);
    const consistency = 1 - Math.abs(winRate - recentWinRate); // Closer to 1 = more consistent
    
    // Data quality (variety of conditions)
    const uniqueHours = new Set(trades.map(t => new Date(t.entryTime).getHours())).size;
    const uniqueStrategies = new Set(trades.map(t => t.strategy)).size;
    const dataQuality = Math.min(1, (uniqueHours / 24 + uniqueStrategies / 4) / 2);
    
    return {
      totalTrades,
      winRate,
      avgPnL,
      profitFactor,
      sharpeRatio,
      maxDrawdown,
      consistency,
      dataQuality
    };
  }
  
  private calculateDataVolumeReadiness(totalTrades: number, currentPhase: number): PhaseReadinessScore {
    const minTrades = this.getMinTradesForPhase(currentPhase + 1);
    const score = Math.min(1, totalTrades / minTrades);
    
    return {
      metric: 'Data Volume',
      score,
      weight: 0.25, // 25% weight
      reasoning: `${totalTrades}/${minTrades} trades completed (${(score * 100).toFixed(0)}% of minimum)`
    };
  }
  
  private calculateStabilityReadiness(metrics: PerformanceMetrics): PhaseReadinessScore {
    // Stability based on consistency and reasonable metrics
    let score = 0;
    
    // Win rate stability (prefer 40-60% for learning)
    if (metrics.winRate >= 0.35 && metrics.winRate <= 0.65) {
      score += 0.4;
    } else if (metrics.winRate >= 0.30 && metrics.winRate <= 0.70) {
      score += 0.2;
    }
    
    // Consistency
    score += metrics.consistency * 0.3;
    
    // Reasonable drawdown (less than 20%)
    if (metrics.maxDrawdown < 0.20) {
      score += 0.3;
    } else if (metrics.maxDrawdown < 0.30) {
      score += 0.15;
    }
    
    return {
      metric: 'Performance Stability',
      score: Math.min(1, score),
      weight: 0.30, // 30% weight - most important
      reasoning: `Win rate ${(metrics.winRate * 100).toFixed(1)}%, Consistency ${(metrics.consistency * 100).toFixed(0)}%, Max DD ${(metrics.maxDrawdown * 100).toFixed(1)}%`
    };
  }
  
  private async calculateTrajectoryReadiness(): Promise<PhaseReadinessScore> {
    // Look at recent performance trend
    const recentTrades = await prisma.managedTrade.findMany({
      where: {
        exitTime: { not: null },
        exitTime: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: { exitTime: 'asc' }
    });
    
    if (recentTrades.length < 10) {
      return {
        metric: 'Performance Trajectory',
        score: 0.5, // Neutral if not enough data
        weight: 0.20,
        reasoning: 'Insufficient recent data for trajectory analysis'
      };
    }
    
    // Split into halves and compare
    const midPoint = Math.floor(recentTrades.length / 2);
    const firstHalf = recentTrades.slice(0, midPoint);
    const secondHalf = recentTrades.slice(midPoint);
    
    const firstWinRate = firstHalf.filter(t => (t.pnl || 0) > 0).length / firstHalf.length;
    const secondWinRate = secondHalf.filter(t => (t.pnl || 0) > 0).length / secondHalf.length;
    
    const improvement = secondWinRate - firstWinRate;
    let score = 0.5 + improvement; // 0.5 baseline, +/- based on improvement
    score = Math.max(0, Math.min(1, score));
    
    return {
      metric: 'Performance Trajectory',
      score,
      weight: 0.20,
      reasoning: `Win rate trend: ${(firstWinRate * 100).toFixed(0)}% → ${(secondWinRate * 100).toFixed(0)}% (${improvement > 0 ? '+' : ''}${(improvement * 100).toFixed(0)}%)`
    };
  }
  
  private calculateRiskReadiness(metrics: PerformanceMetrics): PhaseReadinessScore {
    let score = 0;
    
    // Profit factor (prefer > 1.2)
    if (metrics.profitFactor > 1.5) {
      score += 0.4;
    } else if (metrics.profitFactor > 1.2) {
      score += 0.3;
    } else if (metrics.profitFactor > 1.0) {
      score += 0.2;
    }
    
    // Sharpe ratio (prefer > 0.5)
    if (metrics.sharpeRatio > 1.0) {
      score += 0.3;
    } else if (metrics.sharpeRatio > 0.5) {
      score += 0.2;
    } else if (metrics.sharpeRatio > 0) {
      score += 0.1;
    }
    
    // Average P&L positive
    if (metrics.avgPnL > 0) {
      score += 0.3;
    }
    
    return {
      metric: 'Risk Management',
      score: Math.min(1, score),
      weight: 0.15,
      reasoning: `PF: ${metrics.profitFactor.toFixed(2)}, Sharpe: ${metrics.sharpeRatio.toFixed(2)}, Avg P&L: $${metrics.avgPnL.toFixed(2)}`
    };
  }
  
  private async calculateDataQualityReadiness(): Promise<PhaseReadinessScore> {
    // Assess diversity and quality of collected data
    const trades = await prisma.managedTrade.findMany({
      where: { exitTime: { not: null } },
      select: {
        strategy: true,
        symbol: true,
        entryTime: true,
        side: true
      }
    });
    
    if (trades.length === 0) {
      return {
        metric: 'Data Quality',
        score: 0,
        weight: 0.10,
        reasoning: 'No data collected yet'
      };
    }
    
    // Diversity metrics
    const uniqueStrategies = new Set(trades.map(t => t.strategy)).size;
    const uniqueSymbols = new Set(trades.map(t => t.symbol)).size;
    const uniqueHours = new Set(trades.map(t => new Date(t.entryTime).getHours())).size;
    const buySellRatio = trades.filter(t => t.side === 'buy').length / trades.length;
    
    let score = 0;
    
    // Strategy diversity (want at least 2)
    score += Math.min(0.25, uniqueStrategies / 4 * 0.25);
    
    // Time diversity (want trades across different hours)
    score += Math.min(0.25, uniqueHours / 12 * 0.25);
    
    // Balance between buy and sell (ideal is 0.5)
    const balance = 1 - Math.abs(0.5 - buySellRatio) * 2;
    score += balance * 0.25;
    
    // Symbol diversity
    score += Math.min(0.25, uniqueSymbols / 3 * 0.25);
    
    return {
      metric: 'Data Quality',
      score,
      weight: 0.10,
      reasoning: `${uniqueStrategies} strategies, ${uniqueHours} hours, ${(buySellRatio * 100).toFixed(0)}% buys`
    };
  }
  
  private getMinTradesForPhase(phase: number): number {
    // Minimum trades "suggested" for each phase
    // But can be overridden by performance
    const minimums: { [key: number]: number } = {
      0: 0,
      1: 50,   // Phase 1: Basic sentiment
      2: 200,  // Phase 2: Multi-source sentiment  
      3: 500,  // Phase 3: Order book
      4: 1000, // Phase 4: Full AI
      5: 2000  // Beyond
    };
    
    return minimums[phase] || 999999;
  }
  
  /**
   * Make intelligent decision about phase progression
   */
  async makePhaseDecision(): Promise<{
    action: 'advance' | 'maintain' | 'revert';
    targetPhase: number;
    confidence: number;
    reasoning: string;
  }> {
    const analysis = await this.analyzePhaseReadiness();
    
    // Apply quantum intelligence logic
    let action: 'advance' | 'maintain' | 'revert' = 'maintain';
    let targetPhase = analysis.currentPhase;
    
    // Decision tree based on readiness and performance
    if (analysis.readinessScore >= 0.75 && analysis.confidence >= 0.70) {
      // Strong signal to advance
      action = 'advance';
      targetPhase = analysis.recommendedPhase;
    } else if (analysis.readinessScore >= 0.60 && analysis.metrics.winRate >= 0.45) {
      // Moderate signal - advance if win rate is good
      action = 'advance';
      targetPhase = analysis.recommendedPhase;
    } else if (analysis.readinessScore < 0.35 && analysis.currentPhase > 0) {
      // Poor performance - consider reverting
      action = 'revert';
      targetPhase = Math.max(0, analysis.currentPhase - 1);
    } else if (analysis.metrics.avgPnL < -0.05 && analysis.metrics.totalTrades > 20) {
      // Losing money - definitely revert
      action = 'revert';
      targetPhase = 0;
    }
    
    // Safety check: Don't advance too fast
    if (action === 'advance' && analysis.metrics.totalTrades < this.getMinTradesForPhase(targetPhase) * 0.5) {
      action = 'maintain';
      targetPhase = analysis.currentPhase;
    }
    
    return {
      action,
      targetPhase,
      confidence: analysis.confidence,
      reasoning: analysis.recommendation
    };
  }
}

// Export singleton
export const adaptivePhaseManager = AdaptivePhaseManager.getInstance();