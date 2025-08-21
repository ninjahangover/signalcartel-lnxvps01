import { useState, useEffect } from 'react';
import RSIStrategyOptimizer, { RSIParameters, PerformanceMetrics, OptimizationResult } from '../rsi-strategy-optimizer';

interface UseRSIOptimizerReturn {
  currentParameters: RSIParameters | null;
  optimizationHistory: OptimizationResult[];
  isOptimizing: boolean;
  forceOptimization: () => Promise<void>;
  getOptimizationInsights: () => string;
  getPerformanceImprovement: () => {
    winRateImprovement: number;
    profitFactorImprovement: number;
    sharpeRatioImprovement: number;
    drawdownReduction: number;
  };
}

export function useRSIOptimizer(): UseRSIOptimizerReturn {
  const [currentParameters, setCurrentParameters] = useState<RSIParameters | null>(null);
  const [optimizationHistory, setOptimizationHistory] = useState<OptimizationResult[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Default parameters for comparison
  const defaultParams: RSIParameters = {
    rsi_period: 14,
    oversold_level: 30,
    overbought_level: 70,
    confirmation_period: 3,
    ma_short_period: 20,
    ma_long_period: 50,
    position_size: 0.01
  };

  useEffect(() => {
    const optimizer = RSIStrategyOptimizer.getInstance();
    
    // Initial load
    const loadCurrentState = () => {
      setCurrentParameters(optimizer.getCurrentParameters());
      setOptimizationHistory(optimizer.getOptimizationHistory());
      setIsOptimizing(optimizer.isCurrentlyOptimizing());
    };

    loadCurrentState();

    // Subscribe to updates
    const unsubscribe = optimizer.subscribe(() => {
      loadCurrentState();
    });

    // Periodic refresh
    const interval = setInterval(loadCurrentState, 5000); // Every 5 seconds

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const forceOptimization = async (): Promise<void> => {
    const optimizer = RSIStrategyOptimizer.getInstance();
    setIsOptimizing(true);
    
    try {
      await optimizer.forceOptimization();
    } finally {
      setIsOptimizing(false);
    }
  };

  const getOptimizationInsights = (): string => {
    if (!currentParameters || optimizationHistory.length === 0) {
      return "Collecting market data for initial optimization...";
    }

    const latest = optimizationHistory[optimizationHistory.length - 1];
    const regime = latest.marketRegime;
    
    const rsiChange = currentParameters.oversold_level - defaultParams.oversold_level;
    const periodChange = currentParameters.rsi_period - defaultParams.rsi_period;
    
    let insight = `Parameters optimized for current ${regime.trend} market with ${regime.volatility} volatility. `;
    
    if (Math.abs(rsiChange) > 2) {
      insight += `RSI thresholds adjusted by ${rsiChange > 0 ? '+' : ''}${rsiChange} points `;
    }
    
    if (Math.abs(periodChange) > 1) {
      insight += `${periodChange > 0 ? 'Increased' : 'Decreased'} RSI period to ${currentParameters.rsi_period} for better ${regime.volatility} volatility response `;
    }
    
    insight += `based on ${latest.performance.totalTrades} recent trades analysis.`;
    
    return insight;
  };

  const getPerformanceImprovement = () => {
    if (optimizationHistory.length === 0) {
      return {
        winRateImprovement: 0,
        profitFactorImprovement: 0,
        sharpeRatioImprovement: 0,
        drawdownReduction: 0
      };
    }

    // Compare recent optimized performance vs baseline
    const recentResults = optimizationHistory.slice(-5);
    const avgPerformance = recentResults.reduce((acc, result) => ({
      winRate: acc.winRate + result.performance.winRate,
      profitFactor: acc.profitFactor + result.performance.profitFactor,
      sharpeRatio: acc.sharpeRatio + result.performance.sharpeRatio,
      maxDrawdown: acc.maxDrawdown + result.performance.maxDrawdown
    }), { winRate: 0, profitFactor: 0, sharpeRatio: 0, maxDrawdown: 0 });

    const count = recentResults.length;
    if (count === 0) {
      return {
        winRateImprovement: 0,
        profitFactorImprovement: 0,
        sharpeRatioImprovement: 0,
        drawdownReduction: 0
      };
    }

    // Baseline performance estimates (these would be calculated from backtesting default params)
    const baselinePerformance = {
      winRate: 0.635, // 63.5%
      profitFactor: 1.64,
      sharpeRatio: 1.05,
      maxDrawdown: 0.103 // 10.3%
    };

    return {
      winRateImprovement: (avgPerformance.winRate / count) - baselinePerformance.winRate,
      profitFactorImprovement: (avgPerformance.profitFactor / count) - baselinePerformance.profitFactor,
      sharpeRatioImprovement: (avgPerformance.sharpeRatio / count) - baselinePerformance.sharpeRatio,
      drawdownReduction: baselinePerformance.maxDrawdown - (avgPerformance.maxDrawdown / count)
    };
  };

  return {
    currentParameters,
    optimizationHistory,
    isOptimizing,
    forceOptimization,
    getOptimizationInsights,
    getPerformanceImprovement
  };
}