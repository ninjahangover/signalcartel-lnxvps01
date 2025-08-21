import { useState, useEffect } from 'react';
import StrategyOptimizer, { OptimizationResult, OptimizationProgress } from '../strategy-optimizer';

export function useStrategyOptimizer() {
  const [optimizationProgress, setOptimizationProgress] = useState<OptimizationProgress>({
    isRunning: false,
    currentIteration: 0,
    totalIterations: 0,
    bestParams: {},
    bestWinRate: 0,
    progress: 0
  });
  const [optimizationHistory, setOptimizationHistory] = useState<OptimizationResult[]>([]);

  useEffect(() => {
    const optimizer = StrategyOptimizer.getInstance();

    const updateOptimizer = () => {
      setOptimizationProgress(optimizer.getOptimizationProgress());
      setOptimizationHistory(optimizer.getOptimizationHistory());
    };

    // Initial load
    updateOptimizer();

    // Subscribe to changes
    const unsubscribe = optimizer.subscribe(updateOptimizer);

    return unsubscribe;
  }, []);

  const optimizeStrategy = async (strategyId: string, marketConditions?: 'trending' | 'ranging' | 'volatile') => {
    const optimizer = StrategyOptimizer.getInstance();
    
    // Auto-detect market conditions if not specified
    const conditions = marketConditions || optimizer.detectMarketConditions();
    
    return await optimizer.optimizeStrategy(strategyId, conditions);
  };

  const detectMarketConditions = () => {
    const optimizer = StrategyOptimizer.getInstance();
    return optimizer.detectMarketConditions();
  };

  return {
    optimizationProgress,
    optimizationHistory,
    optimizeStrategy,
    detectMarketConditions,
    isOptimizing: optimizationProgress.isRunning
  };
}