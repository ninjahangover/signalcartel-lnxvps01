import { useState, useEffect } from 'react';
import StrategyExecutionEngine, { StrategyState, WebhookAlert } from '../strategy-execution-engine';
import { Strategy } from '../strategy-manager';

export function useStrategyExecution() {
  const [isEngineRunning, setIsEngineRunning] = useState(false);
  const [strategyStates, setStrategyStates] = useState<Map<string, StrategyState>>(new Map());

  useEffect(() => {
    const engine = StrategyExecutionEngine.getInstance();

    const updateEngineState = () => {
      setIsEngineRunning(engine.isEngineRunning());
      setStrategyStates(engine.getStrategyStates());
    };

    // Initial load
    updateEngineState();

    // Subscribe to changes
    const unsubscribe = engine.subscribe(updateEngineState);

    return unsubscribe;
  }, []);

  const startEngine = () => {
    const engine = StrategyExecutionEngine.getInstance();
    engine.startEngine();
  };

  const stopEngine = () => {
    const engine = StrategyExecutionEngine.getInstance();
    engine.stopEngine();
  };

  const addStrategy = (strategy: Strategy, symbol: string = 'BTCUSD') => {
    const engine = StrategyExecutionEngine.getInstance();
    engine.addStrategy(strategy, symbol);
  };

  const removeStrategy = (strategyId: string) => {
    const engine = StrategyExecutionEngine.getInstance();
    engine.removeStrategy(strategyId);
  };

  const getStrategyState = (strategyId: string) => {
    const engine = StrategyExecutionEngine.getInstance();
    return engine.getStrategyState(strategyId);
  };

  // Convert Map to Array for easier rendering
  const strategyStatesArray = Array.from(strategyStates.entries()).map(([id, state]) => ({
    id,
    ...state
  }));

  return {
    isEngineRunning,
    strategyStates: strategyStatesArray,
    startEngine,
    stopEngine,
    addStrategy,
    removeStrategy,
    getStrategyState
  };
}