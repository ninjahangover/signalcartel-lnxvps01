"use client";

import React, { useEffect, useState } from 'react';
import { useStrategySync, useOptimizationSync, useLiveTradingSync, usePineScript, useStrategyExecution, useStrategyOptimizer } from '../lib/hooks';
import AlertGenerationEngine from '../lib/alert-generation-engine';
import PerformanceTracker from '../lib/performance-tracker';
import AlertManagementDashboard from './alert-management-dashboard';
import StrategyControlPanel from './unified/StrategyControlPanel';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Switch } from './ui/switch';

export default function StratusEngineDashboard() {
  const { strategies, updateStrategy } = useStrategySync();
  const { optimizationState, startOptimization, stopOptimization } = useOptimizationSync();
  const { liveTradingState, startLiveTrading, stopLiveTrading, toggleStrategy } = useLiveTradingSync();
  const { webhookConfigs, alertHistory, getWebhookConfig } = usePineScript();
  const { 
    isEngineRunning, 
    strategyStates, 
    startEngine, 
    stopEngine, 
    addStrategy, 
    removeStrategy 
  } = useStrategyExecution();
  const { 
    optimizationProgress,
    optimizationHistory,
    optimizeStrategy,
    detectMarketConditions,
    isOptimizing
  } = useStrategyOptimizer();

  const activeStrategies = strategies.filter(s => s.status === 'active');
  const totalProfit = strategies.reduce((sum, s) => sum + s.performance.profitLoss, 0);
  const avgWinRate = strategies.reduce((sum, s) => sum + s.performance.winRate, 0) / strategies.length;
  
  // Pine Script metrics
  const strategiesWithPineScript = strategies.filter(s => s.pineScript);
  const recentAlerts = alertHistory.slice(-5);
  const totalAlerts = alertHistory.length;

  const [selectedStrategyForOptimization, setSelectedStrategyForOptimization] = useState<string>('');
  const [marketCondition, setMarketCondition] = useState<'trending' | 'ranging' | 'volatile'>('trending');
  const [alertEngine] = useState(() => AlertGenerationEngine.getInstance());
  const [performanceTracker] = useState(() => PerformanceTracker.getInstance());
  const [showAlertDashboard, setShowAlertDashboard] = useState(false);

  // Auto-register strategies with Pine Script configuration when engine starts
  useEffect(() => {
    if (isEngineRunning) {
      strategiesWithPineScript.forEach(strategy => {
        addStrategy(strategy, 'BTCUSD');
        // Initialize with alert generation engine
        alertEngine.initializeStrategy(strategy, 'BTCUSD');
      });
      
      // Start alert generation engine
      alertEngine.startEngine();
      
      // Start performance tracking
      performanceTracker.startTracking(5); // 5-minute intervals
    } else {
      // Stop engines when main engine stops
      alertEngine.stopEngine();
      performanceTracker.stopTracking();
    }
  }, [isEngineRunning, strategiesWithPineScript.length]);

  const handleOptimizeStrategy = async (strategyId: string) => {
    try {
      const currentConditions = detectMarketConditions();
      console.log(`🎯 Detected market conditions: ${currentConditions}`);
      
      const result = await optimizeStrategy(strategyId, currentConditions);
      console.log('✅ Optimization completed:', result);
    } catch (error) {
      console.error('❌ Optimization failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Unified Strategy Control */}
      <StrategyControlPanel 
        title="Stratus Engine Strategies"
        showPerformance={true}
        showOptimization={true}
        compact={false}
      />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Engine Status & Advanced Controls</h1>
          <p className="text-gray-600">AI-Powered Trading Strategy Optimization</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isEngineRunning ? "default" : "secondary"}>
            {isEngineRunning ? "ENGINE ACTIVE" : "ENGINE STOPPED"}
          </Badge>
          {/* Enhanced Trading Mode Indicator */}
          <div className={`px-4 py-2 rounded-lg border-2 ${
            liveTradingState.isActive 
              ? 'bg-red-50 border-red-500 text-red-700' 
              : 'bg-green-50 border-green-500 text-green-700'
          }`}>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                liveTradingState.isActive ? 'bg-red-500 animate-pulse' : 'bg-green-500'
              }`} />
              <span className="font-semibold">
                {liveTradingState.isActive ? "🔴 LIVE TRADING" : "🟢 PAPER TRADING"}
              </span>
            </div>
            <div className="text-xs mt-1">
              {liveTradingState.isActive 
                ? "Real money at risk" 
                : "Safe simulation mode"
              }
            </div>
          </div>
          <Badge variant={alertEngine.isEngineRunning() ? "default" : "secondary"}>
            {alertEngine.isEngineRunning() ? "ALERTS ACTIVE" : "ALERTS STOPPED"}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAlertDashboard(!showAlertDashboard)}
          >
            {showAlertDashboard ? 'Hide' : 'Show'} Alert Dashboard
          </Button>
          <div className={`w-3 h-3 rounded-full ${isEngineRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Profit</div>
          <div className="text-2xl font-bold text-green-600">
            ${totalProfit.toFixed(2)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Active Strategies</div>
          <div className="text-2xl font-bold">{activeStrategies.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Avg Win Rate</div>
          <div className="text-2xl font-bold">{(avgWinRate * 100).toFixed(1)}%</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Live Trades</div>
          <div className="text-2xl font-bold">{liveTradingState.totalTrades}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Generated Alerts (24h)</div>
          <div className="text-2xl font-bold text-blue-600">
            {alertEngine.getAlertStats().recentAlerts.filter(a => 
              a.timestamp.getTime() > Date.now() - 24*60*60*1000
            ).length}
          </div>
          <div className="text-xs text-gray-500">
            {alertEngine.getAlertConfigs().filter(c => c.active).length} strategies active
          </div>
        </Card>
      </div>

      {/* Stratus Engine Control */}
      <Card className={`p-6 border-l-4 ${
        liveTradingState.isActive ? 'border-l-red-500 bg-red-50/20' : 'border-l-green-500 bg-green-50/20'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Stratus Engine Control</h2>
            <p className="text-sm text-gray-600 mt-1">
              Currently operating in{' '}
              <span className={`font-semibold ${
                liveTradingState.isActive ? 'text-red-600' : 'text-green-600'
              }`}>
                {liveTradingState.isActive ? 'LIVE TRADING' : 'PAPER TRADING'}
              </span>{' '}
              mode
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-600">
                Engine: {isEngineRunning ? '🟢 Active' : '🔴 Stopped'}
              </div>
              <div className={`text-sm font-medium ${
                liveTradingState.isActive ? 'text-red-600' : 'text-green-600'
              }`}>
                {liveTradingState.isActive ? '⚠️ Live Money' : '✅ Safe Mode'}
              </div>
            </div>
            <Button
              onClick={isEngineRunning ? stopEngine : startEngine}
              variant={isEngineRunning ? "destructive" : "default"}
            >
              {isEngineRunning ? 'Stop Engine' : 'Start Engine'}
            </Button>
            <Button
              onClick={liveTradingState.isActive ? stopLiveTrading : startLiveTrading}
              variant={liveTradingState.isActive ? "destructive" : "default"}
              size="sm"
              className={liveTradingState.isActive 
                ? "bg-red-600 hover:bg-red-700 border-red-600" 
                : "bg-green-600 hover:bg-green-700 border-green-600"
              }
            >
              {liveTradingState.isActive 
                ? '🔴 Switch to Paper Trading' 
                : '🟢 Switch to Live Trading'
              }
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {strategies.map(strategy => (
            <div key={strategy.id} className={`flex items-center justify-between p-3 border rounded-lg ${
              liveTradingState.activeStrategies.has(strategy.id) 
                ? (liveTradingState.isActive ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200')
                : 'bg-gray-50'
            }`}>
              <div className="flex items-center space-x-3">
                <div className="flex flex-col items-center">
                  <Switch
                    checked={liveTradingState.activeStrategies.has(strategy.id)}
                    onCheckedChange={() => toggleStrategy(strategy.id)}
                  />
                  <span className={`text-xs mt-1 ${
                    liveTradingState.activeStrategies.has(strategy.id)
                      ? (liveTradingState.isActive ? 'text-red-600 font-medium' : 'text-green-600 font-medium')
                      : 'text-gray-400'
                  }`}>
                    {liveTradingState.activeStrategies.has(strategy.id)
                      ? (liveTradingState.isActive ? 'LIVE' : 'PAPER')
                      : 'OFF'
                    }
                  </span>
                </div>
                <div>
                  <div className="font-medium">{strategy.name}</div>
                  <div className="text-sm text-gray-600">
                    Win Rate: {(strategy.performance.winRate * 100).toFixed(1)}% |
                    P&L: ${strategy.performance.profitLoss.toFixed(2)}
                  </div>
                  {strategy.pineScript && (
                    <div className="text-xs text-blue-600 mt-1">
                      📡 Real-time Monitoring: kraken.circuitcartel.com/webhook
                    </div>
                  )}
                  {(() => {
                    const executionState = strategyStates.find(s => s.strategyId === strategy.id);
                    if (executionState && isEngineRunning) {
                      return (
                        <div className="text-xs text-green-600 mt-1">
                          🎯 Position: {executionState.position.toUpperCase()} | 
                          RSI: {executionState.indicators.rsi[executionState.indicators.rsi.length - 1]?.toFixed(1) || 'Loading...'}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
              <Badge variant={strategy.status === 'active' ? 'default' : 'secondary'}>
                {strategy.status.toUpperCase()}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Optimization Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">AI Optimization</h2>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => optimizationState.isRunning ? stopOptimization() : startOptimization('ai-momentum-001')}
              variant={optimizationState.isRunning ? "destructive" : "default"}
              disabled={optimizationState.isRunning}
            >
              {optimizationState.isRunning ? 'Optimizing...' : 'Start Optimization'}
            </Button>
          </div>
        </div>

        {optimizationState.isRunning && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{optimizationState.currentIteration}/{optimizationState.totalIterations}</span>
              </div>
              <Progress
                value={(optimizationState.currentIteration / optimizationState.totalIterations) * 100}
                className="h-2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Current Performance</div>
                <div className="text-lg font-semibold">{optimizationState.currentPerformance.toFixed(2)}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Best Performance</div>
                <div className="text-lg font-semibold text-green-600">
                  {(optimizationState.bestParameters.performance as number)?.toFixed(2) || '0.00'}%
                </div>
              </div>
            </div>
          </div>
        )}

        {!optimizationState.isRunning && optimizationState.history.length > 0 && (
          <div className="text-sm text-gray-600">
            Last optimization completed {optimizationState.history.length} iterations
          </div>
        )}
      </Card>

      {/* Real-time Strategy Optimization */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Real-time Strategy Optimization</h2>
            <p className="text-sm text-gray-600">Optimize strategy parameters based on current market conditions</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={detectMarketConditions() === 'trending' ? 'default' : 
                           detectMarketConditions() === 'volatile' ? 'destructive' : 'secondary'}>
              Market: {detectMarketConditions().toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Optimization Progress */}
        {isOptimizing && (
          <div className="space-y-4 mb-6">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Optimizing Parameters</span>
                <span>{optimizationProgress.currentIteration}/{optimizationProgress.totalIterations}</span>
              </div>
              <Progress
                value={optimizationProgress.progress}
                className="h-2"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Current Best Win Rate:</span>
                <span className="ml-2 font-semibold text-green-600">
                  {(optimizationProgress.bestWinRate * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-gray-600">Testing Parameters:</span>
                <span className="ml-2 font-mono text-xs">
                  RSI: {optimizationProgress.bestParams.rsiPeriod || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Strategy Optimization Buttons */}
        <div className="space-y-3">
          {strategiesWithPineScript.map(strategy => (
            <div key={strategy.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="font-medium">{strategy.name}</div>
                <div className="text-sm text-gray-600">
                  Current: RSI({strategy.config.rsiPeriod}) | 
                  Oversold: {strategy.config.oversoldLevel} | 
                  Overbought: {strategy.config.overboughtLevel}
                </div>
                {optimizationHistory.find(h => h.strategyId === strategy.id) && (
                  <div className="text-xs text-green-600 mt-1">
                    ✅ Last optimized: {optimizationHistory.find(h => h.strategyId === strategy.id)?.improvementPercent.toFixed(1)}% improvement
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={() => handleOptimizeStrategy(strategy.id)}
                  disabled={isOptimizing || !isEngineRunning}
                  variant="outline"
                >
                  {isOptimizing ? 'Optimizing...' : 'Optimize Now'}
                </Button>
              </div>
            </div>
          ))}
          
          {strategiesWithPineScript.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No strategies configured for optimization. Add Pine Script strategies to begin.
            </div>
          )}
        </div>

        {/* Optimization History */}
        {optimizationHistory.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold mb-3">Recent Optimizations</h3>
            <div className="space-y-2">
              {optimizationHistory.slice(-3).reverse().map((result, index) => (
                <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                  <span>{strategies.find(s => s.id === result.strategyId)?.name}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant={result.improvementPercent > 0 ? 'default' : 'secondary'} className="text-xs">
                      {result.improvementPercent > 0 ? '+' : ''}{result.improvementPercent.toFixed(1)}%
                    </Badge>
                    <span className="text-gray-500">
                      {result.timestamp.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Strategy Performance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {strategies.map(strategy => (
          <Card key={strategy.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{strategy.name}</h3>
              <Badge variant={strategy.status === 'active' ? 'default' : 'secondary'}>
                {strategy.status}
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Trades:</span>
                <span>{strategy.performance.totalTrades}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Win Rate:</span>
                <span>{(strategy.performance.winRate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">P&L:</span>
                <span className={strategy.performance.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                  ${strategy.performance.profitLoss.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sharpe Ratio:</span>
                <span>{strategy.performance.sharpeRatio.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t">
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => updateStrategy(strategy.id, {
                  status: strategy.status === 'active' ? 'paused' : 'active'
                })}
              >
                {strategy.status === 'active' ? 'Pause' : 'Activate'}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Alert Management Dashboard */}
      {showAlertDashboard && (
        <AlertManagementDashboard className="border-t pt-6" />
      )}
    </div>
  );
}
