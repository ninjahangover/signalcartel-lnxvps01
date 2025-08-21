"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Progress } from '../ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Settings,
  AlertCircle,
  CheckCircle,
  Brain,
  Target,
  Zap,
  BarChart3
} from 'lucide-react';
import { unifiedStrategySystem, UnifiedStrategy } from '../../lib/unified-strategy-system';

interface StrategyControlPanelProps {
  showPerformance?: boolean;
  showOptimization?: boolean;
  compact?: boolean;
  title?: string;
}

export default function StrategyControlPanel({ 
  showPerformance = true, 
  showOptimization = true, 
  compact = false,
  title = "Strategy Control Panel"
}: StrategyControlPanelProps) {
  const [strategies, setStrategies] = useState<UnifiedStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to strategy updates
    const unsubscribe = unifiedStrategySystem.subscribe((updatedStrategies) => {
      setStrategies(updatedStrategies);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleToggleStrategy = async (strategyId: string) => {
    try {
      setError(null);
      const success = await unifiedStrategySystem.toggleStrategy(strategyId);
      
      if (!success) {
        setError(`Failed to toggle strategy ${strategyId}`);
      }
    } catch (error) {
      setError(`Error toggling strategy: ${error}`);
    }
  };

  const getStatusIcon = (strategy: UnifiedStrategy) => {
    if (strategy.status === 'active') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (strategy.status === 'optimizing') {
      return <Brain className="h-4 w-4 text-blue-500 animate-pulse" />;
    } else if (strategy.status === 'error') {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    return <Activity className="h-4 w-4 text-gray-400" />;
  };

  const getExecutionStatus = (strategy: UnifiedStrategy) => {
    if (!strategy.execution.isConnected) {
      return { status: 'Not Connected', color: 'text-red-500' };
    }
    if (!strategy.execution.canExecutePaper && !strategy.execution.canExecuteLive) {
      return { status: 'Cannot Execute', color: 'text-yellow-500' };
    }
    if (strategy.execution.canExecutePaper) {
      return { status: 'Paper Ready', color: 'text-green-500' };
    }
    if (strategy.execution.canExecuteLive) {
      return { status: 'Live Ready', color: 'text-blue-500' };
    }
    return { status: 'Unknown', color: 'text-gray-500' };
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading strategies...</span>
        </div>
      </Card>
    );
  }

  const activeStrategies = strategies.filter(s => s.enabled).length;
  const totalTrades = strategies.reduce((sum, s) => sum + s.performance.totalTrades, 0);
  const avgWinRate = strategies.length > 0 
    ? strategies.reduce((sum, s) => sum + s.performance.winRate, 0) / strategies.length 
    : 0;

  return (
    <div className="space-y-4">
      {/* Header with summary */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {activeStrategies} of {strategies.length} strategies active
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-lg font-bold">{totalTrades}</div>
              <div className="text-xs text-gray-500">Total Trades</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{avgWinRate.toFixed(1)}%</div>
              <div className="text-xs text-gray-500">Avg Win Rate</div>
            </div>
            <Badge variant={activeStrategies > 0 ? "default" : "secondary"}>
              {activeStrategies > 0 ? "ACTIVE" : "INACTIVE"}
            </Badge>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Strategy list */}
      <div className="space-y-3">
        {strategies.map((strategy) => {
          const executionStatus = getExecutionStatus(strategy);
          
          return (
            <Card key={strategy.id} className={`p-4 ${strategy.enabled ? 'border-l-4 border-l-green-500' : ''}`}>
              <div className="flex items-center justify-between">
                {/* Strategy Info */}
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={strategy.enabled}
                    onCheckedChange={() => handleToggleStrategy(strategy.id)}
                  />
                  
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(strategy)}
                    <div>
                      <h3 className="font-medium">{strategy.displayName}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>{strategy.config.symbol}</span>
                        <span>•</span>
                        <span>{strategy.config.timeframe}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">
                          {strategy.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance & Status */}
                <div className="flex items-center space-x-6">
                  {showPerformance && (
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {strategy.performance.winRate > 0 
                          ? `${strategy.performance.winRate.toFixed(1)}% WR`
                          : 'No trades yet'
                        }
                      </div>
                      <div className="text-xs text-gray-500">
                        {strategy.performance.totalTrades} trades
                        {strategy.performance.isReal ? ' (real)' : ' (sim)'}
                      </div>
                    </div>
                  )}

                  <div className="text-right">
                    <div className={`text-sm font-medium ${executionStatus.color}`}>
                      {executionStatus.status}
                    </div>
                    <div className="text-xs text-gray-500">
                      {strategy.execution.currentPositions > 0 
                        ? `${strategy.execution.currentPositions} positions`
                        : 'No positions'
                      }
                    </div>
                  </div>

                  <Badge 
                    variant={strategy.status === 'active' ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {strategy.status}
                  </Badge>
                </div>
              </div>

              {/* Expanded details */}
              {strategy.enabled && !compact && (
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Configuration */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Configuration</h4>
                      <div className="space-y-1 text-xs">
                        {strategy.type === 'RSI' && (
                          <>
                            <div>RSI Period: {strategy.config.rsiPeriod}</div>
                            <div>Oversold: {strategy.config.rsiOversold}</div>
                            <div>Overbought: {strategy.config.rsiOverbought}</div>
                          </>
                        )}
                        {strategy.type === 'MACD' && (
                          <>
                            <div>Fast: {strategy.config.macdFast}</div>
                            <div>Slow: {strategy.config.macdSlow}</div>
                            <div>Signal: {strategy.config.macdSignal}</div>
                          </>
                        )}
                        <div>Stop Loss: {strategy.config.stopLoss}%</div>
                        <div>Take Profit: {strategy.config.takeProfit}%</div>
                      </div>
                    </div>

                    {/* Performance */}
                    {showPerformance && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Performance</h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Win/Loss:</span>
                            <span>{strategy.performance.winningTrades}/{strategy.performance.losingTrades}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total P&L:</span>
                            <span className={strategy.performance.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                              ${strategy.performance.totalProfit.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Sharpe:</span>
                            <span>{strategy.performance.sharpeRatio.toFixed(2)}</span>
                          </div>
                          {strategy.performance.lastTrade && (
                            <div className="flex justify-between">
                              <span>Last Trade:</span>
                              <span>{strategy.performance.lastTrade.toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* AI Optimization */}
                    {showOptimization && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center">
                          <Brain className="h-3 w-3 mr-1" />
                          AI Optimization
                        </h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Optimized:</span>
                            <span>{strategy.optimization.isOptimized ? '✅' : '❌'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cycles:</span>
                            <span>{strategy.optimization.optimizationCycles}</span>
                          </div>
                          {strategy.optimization.aiConfidence > 0 && (
                            <div>
                              <div className="flex justify-between mb-1">
                                <span>AI Confidence:</span>
                                <span>{strategy.optimization.aiConfidence.toFixed(0)}%</span>
                              </div>
                              <Progress 
                                value={strategy.optimization.aiConfidence} 
                                className="h-1"
                              />
                            </div>
                          )}
                          {strategy.optimization.lastOptimization && (
                            <div className="flex justify-between">
                              <span>Last Optimized:</span>
                              <span>{strategy.optimization.lastOptimization.toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Instructions for non-working strategies */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900">Strategy Status Guide:</p>
            <ul className="mt-2 space-y-1 text-blue-700">
              <li>• <strong>RSI Pullback Pro</strong>: Fully working with real AI optimization</li>
              <li>• <strong>Other strategies</strong>: Framework ready, need implementation</li>
              <li>• Enable any strategy to test the activation/deactivation system</li>
              <li>• "Paper Ready" means connected to Alpaca for paper trading</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}