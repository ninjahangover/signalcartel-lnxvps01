"use client";

import React, { useState, useEffect } from 'react';
import UnifiedStrategyController from '../lib/unified-strategy-controller';
import { UnifiedStrategy, UnifiedStrategyParameters, getParameterExplanation } from '../lib/unified-strategy-config';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Progress } from './ui/progress';
import { AlertCircle, TrendingUp, TrendingDown, Activity, Brain, Settings, BarChart3, Target } from 'lucide-react';

export default function UnifiedStrategyDashboard() {
  const [strategies, setStrategies] = useState<UnifiedStrategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [marketConditions, setMarketConditions] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [optimizationResults, setOptimizationResults] = useState<Map<string, any>>(new Map());
  const [isEditingParams, setIsEditingParams] = useState(false);
  const [tempParameters, setTempParameters] = useState<UnifiedStrategyParameters | null>(null);
  const [showInitialSetup, setShowInitialSetup] = useState(false);
  
  const controller = UnifiedStrategyController.getInstance();

  useEffect(() => {
    // Load initial strategies
    const loadStrategies = () => {
      const allStrategies = controller.getAllStrategies();
      setStrategies(allStrategies);
      if (allStrategies.length > 0 && !selectedStrategy) {
        setSelectedStrategy(allStrategies[0].id);
      }
    };

    loadStrategies();

    // Subscribe to updates
    const events = ['STRATEGY_CREATED', 'STRATEGY_UPDATED', 'PARAMETERS_OPTIMIZED', 'PERFORMANCE_UPDATED'] as const;
    
    const handlers = events.map(event => {
      const handler = () => loadStrategies();
      controller.on(event, handler);
      return { event, handler };
    });

    // Update market conditions
    const marketInterval = setInterval(() => {
      const conditions = controller.getMarketConditions();
      setMarketConditions(conditions);
    }, 5000);

    return () => {
      handlers.forEach(({ event, handler }) => controller.off(event, handler));
      clearInterval(marketInterval);
    };
  }, [selectedStrategy]);

  const currentStrategy = strategies.find(s => s.id === selectedStrategy);

  // Calculate overall metrics
  const totalProfit = strategies.reduce((sum, s) => sum + s.performance.profitLoss, 0);
  const activeStrategies = strategies.filter(s => s.enabled).length;
  const avgWinRate = strategies.reduce((sum, s) => sum + s.performance.winRate, 0) / Math.max(1, strategies.length);
  const liveStrategies = strategies.filter(s => s.mode === 'live').length;

  return (
    <div className="space-y-6">
      {/* Header with Key Metrics */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Unified Strategy Control Center</h1>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-600">Total P&L</div>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${totalProfit.toFixed(2)}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">Active Strategies</div>
            <div className="text-2xl font-bold">{activeStrategies}/{strategies.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">Avg Win Rate</div>
            <div className="text-2xl font-bold">{(avgWinRate * 100).toFixed(1)}%</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">Trading Mode</div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${liveStrategies > 0 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
              <span className="text-lg font-bold">
                {liveStrategies > 0 ? `${liveStrategies} LIVE (Kraken)` : 'PAPER (Alpaca)'}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {liveStrategies > 0 ? 'Webhook → kraken.circuitcartel.com' : 'Direct Alpaca API'}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">Market Regime</div>
            <div className="flex items-center space-x-2">
              {marketConditions?.regime === 'trending_up' && <TrendingUp className="w-5 h-5 text-green-500" />}
              {marketConditions?.regime === 'trending_down' && <TrendingDown className="w-5 h-5 text-red-500" />}
              {marketConditions?.regime === 'ranging' && <Activity className="w-5 h-5 text-blue-500" />}
              {marketConditions?.regime === 'volatile' && <AlertCircle className="w-5 h-5 text-orange-500" />}
              <span className="text-lg font-bold uppercase">
                {marketConditions?.regime?.replace('_', ' ') || 'ANALYZING...'}
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Content Area with Tabs */}
      <Card className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
            <TabsTrigger value="optimization">AI Optimization</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="stratus-brain">Stratus Brain</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Active Strategies</h3>
              {strategies.map(strategy => (
                <div 
                  key={strategy.id} 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedStrategy === strategy.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedStrategy(strategy.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Switch
                        checked={strategy.enabled}
                        onCheckedChange={() => controller.toggleStrategy(strategy.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div>
                        <div className="font-semibold">{strategy.name}</div>
                        <div className="text-sm text-gray-600">
                          RSI: {strategy.parameters.rsi.lookback} | 
                          Win Rate: {(strategy.performance.winRate * 100).toFixed(1)}% | 
                          Trades: {strategy.performance.totalTrades}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={strategy.mode === 'live' ? 'destructive' : 'default'}>
                        {strategy.mode === 'live' ? '🔴 LIVE (Kraken)' : '📊 PAPER (Alpaca)'}
                      </Badge>
                      <Badge variant={strategy.enabled ? 'default' : 'secondary'}>
                        {strategy.enabled ? 'ACTIVE' : 'PAUSED'}
                      </Badge>
                      {strategy.lastOptimization && (
                        <Badge variant="outline" className="text-xs">
                          Optimized {new Date(strategy.lastOptimization).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex items-center space-x-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        controller.setTradingMode(strategy.id, strategy.mode === 'live' ? 'paper' : 'live');
                      }}
                    >
                      {strategy.mode === 'live' 
                        ? '📊 Switch to Paper (Alpaca)' 
                        : '🔴 Switch to Live (Kraken)'
                      }
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        controller.queueOptimization(strategy.id);
                      }}
                    >
                      Optimize Now
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        controller.resetToDefaults(strategy.id);
                      }}
                    >
                      Reset to Defaults
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Market Conditions Card */}
            {marketConditions && (
              <Card className="p-4 bg-gray-50">
                <h3 className="text-lg font-semibold mb-3">Current Market Conditions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Trend</div>
                    <div className="font-semibold capitalize">{marketConditions.trend}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Volatility</div>
                    <Progress value={marketConditions.volatility * 100} className="mt-1" />
                    <div className="text-xs text-gray-500">{(marketConditions.volatility * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Volume</div>
                    <div className="font-semibold capitalize">{marketConditions.volume}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Confidence</div>
                    <div className="font-semibold">{(marketConditions.confidence * 100).toFixed(0)}%</div>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* PARAMETERS TAB */}
          <TabsContent value="parameters" className="space-y-4">
            {currentStrategy && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Parameters for {currentStrategy.name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {!isEditingParams ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setTempParameters(JSON.parse(JSON.stringify(currentStrategy.parameters)));
                            setIsEditingParams(true);
                          }}
                        >
                          Manual Edit
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowInitialSetup(true)}
                        >
                          Initial Setup
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="default"
                          onClick={() => {
                            if (tempParameters) {
                              controller.updateStrategyParameters(currentStrategy.id, tempParameters, 'manual');
                              setIsEditingParams(false);
                              setTempParameters(null);
                            }
                          }}
                        >
                          Save Changes
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditingParams(false);
                            setTempParameters(null);
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Show current parameters if not editing */}
                {!isEditingParams && (
                  <Card className="p-4 bg-blue-50 border-blue-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Current Active Parameters</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">RSI Period:</span>
                        <span className="ml-1 font-bold">{currentStrategy.parameters.rsi.lookback}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Oversold:</span>
                        <span className="ml-1 font-bold">{currentStrategy.parameters.rsi.oversoldEntry}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Overbought:</span>
                        <span className="ml-1 font-bold">{currentStrategy.parameters.rsi.overboughtEntry}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Position Size:</span>
                        <span className="ml-1 font-bold">{(currentStrategy.parameters.risk.positionSize * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </Card>
                )}
                
                {/* RSI Parameters */}
                <Card className="p-4">
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    RSI Configuration
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <ParameterInput
                      label="Lookback Period"
                      value={isEditingParams && tempParameters ? tempParameters.rsi.lookback : currentStrategy.parameters.rsi.lookback}
                      min={2}
                      max={50}
                      onChange={(value) => {
                        if (isEditingParams && tempParameters) {
                          setTempParameters({
                            ...tempParameters,
                            rsi: { ...tempParameters.rsi, lookback: value }
                          });
                        } else {
                          controller.updateStrategyParameters(currentStrategy.id, {
                            rsi: { ...currentStrategy.parameters.rsi, lookback: value }
                          });
                        }
                      }}
                      explanation={getParameterExplanation('rsi.lookback')}
                      disabled={!isEditingParams}
                    />
                    <ParameterInput
                      label="Oversold Entry"
                      value={currentStrategy.parameters.rsi.oversoldEntry}
                      min={15}
                      max={35}
                      onChange={(value) => {
                        controller.updateStrategyParameters(currentStrategy.id, {
                          rsi: { ...currentStrategy.parameters.rsi, oversoldEntry: value }
                        });
                      }}
                      explanation={getParameterExplanation('rsi.oversoldEntry')}
                    />
                    <ParameterInput
                      label="Oversold Exit"
                      value={currentStrategy.parameters.rsi.oversoldExit}
                      min={20}
                      max={45}
                      onChange={(value) => {
                        controller.updateStrategyParameters(currentStrategy.id, {
                          rsi: { ...currentStrategy.parameters.rsi, oversoldExit: value }
                        });
                      }}
                      explanation={getParameterExplanation('rsi.oversoldExit')}
                    />
                    <ParameterInput
                      label="Overbought Entry"
                      value={currentStrategy.parameters.rsi.overboughtEntry}
                      min={65}
                      max={85}
                      onChange={(value) => {
                        controller.updateStrategyParameters(currentStrategy.id, {
                          rsi: { ...currentStrategy.parameters.rsi, overboughtEntry: value }
                        });
                      }}
                      explanation={getParameterExplanation('rsi.overboughtEntry')}
                    />
                    <ParameterInput
                      label="Overbought Exit"
                      value={currentStrategy.parameters.rsi.overboughtExit}
                      min={55}
                      max={80}
                      onChange={(value) => {
                        controller.updateStrategyParameters(currentStrategy.id, {
                          rsi: { ...currentStrategy.parameters.rsi, overboughtExit: value }
                        });
                      }}
                      explanation={getParameterExplanation('rsi.overboughtExit')}
                    />
                  </div>
                </Card>

                {/* Risk Management Parameters */}
                <Card className="p-4">
                  <h4 className="font-semibold mb-3 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Risk Management
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <ParameterInput
                      label="Position Size (%)"
                      value={currentStrategy.parameters.risk.positionSize * 100}
                      min={0.1}
                      max={5}
                      step={0.1}
                      onChange={(value) => {
                        controller.updateStrategyParameters(currentStrategy.id, {
                          risk: { ...currentStrategy.parameters.risk, positionSize: value / 100 }
                        });
                      }}
                      explanation={getParameterExplanation('risk.positionSize')}
                    />
                    <ParameterInput
                      label="Stop Loss (ATR)"
                      value={currentStrategy.parameters.risk.stopLossATR}
                      min={0.5}
                      max={5}
                      step={0.1}
                      onChange={(value) => {
                        controller.updateStrategyParameters(currentStrategy.id, {
                          risk: { ...currentStrategy.parameters.risk, stopLossATR: value }
                        });
                      }}
                      explanation={getParameterExplanation('risk.stopLossATR')}
                    />
                    <ParameterInput
                      label="Take Profit (ATR)"
                      value={currentStrategy.parameters.risk.takeProfitATR}
                      min={1}
                      max={10}
                      step={0.1}
                      onChange={(value) => {
                        controller.updateStrategyParameters(currentStrategy.id, {
                          risk: { ...currentStrategy.parameters.risk, takeProfitATR: value }
                        });
                      }}
                      explanation={getParameterExplanation('risk.takeProfitATR')}
                    />
                  </div>
                </Card>

                {/* Optimization Settings */}
                <Card className="p-4">
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Optimization Settings
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Enable AI Optimization</div>
                        <div className="text-sm text-gray-600">Allow automatic parameter adjustments</div>
                      </div>
                      <Switch
                        checked={currentStrategy.parameters.optimization.enabled}
                        onCheckedChange={(checked) => {
                          controller.updateStrategyParameters(currentStrategy.id, {
                            optimization: { ...currentStrategy.parameters.optimization, enabled: checked }
                          });
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Adapt to Market</div>
                        <div className="text-sm text-gray-600">Adjust parameters based on market conditions</div>
                      </div>
                      <Switch
                        checked={currentStrategy.parameters.optimization.adaptToMarket}
                        onCheckedChange={(checked) => {
                          controller.updateStrategyParameters(currentStrategy.id, {
                            optimization: { ...currentStrategy.parameters.optimization, adaptToMarket: checked }
                          });
                        }}
                      />
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* AI OPTIMIZATION TAB */}
          <TabsContent value="optimization" className="space-y-4">
            {currentStrategy && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">AI Optimization for {currentStrategy.name}</h3>
                
                {/* Optimization Status */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Optimization Engine</h4>
                    <Badge variant={currentStrategy.parameters.optimization.enabled ? 'default' : 'secondary'}>
                      {currentStrategy.parameters.optimization.enabled ? 'ENABLED' : 'DISABLED'}
                    </Badge>
                  </div>
                  
                  {currentStrategy.lastOptimization && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Optimization:</span>
                        <span>{new Date(currentStrategy.lastOptimization).toLocaleString()}</span>
                      </div>
                      {currentStrategy.optimizedParameters && (
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                          <div className="font-medium mb-2">Optimized Parameters:</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>RSI Period: {currentStrategy.optimizedParameters.rsi.lookback}</div>
                            <div>Oversold: {currentStrategy.optimizedParameters.rsi.oversoldEntry}</div>
                            <div>Overbought: {currentStrategy.optimizedParameters.rsi.overboughtEntry}</div>
                            <div>Stop Loss: {currentStrategy.optimizedParameters.risk.stopLossATR} ATR</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <Button
                      className="w-full"
                      onClick={() => controller.optimizeStrategy(currentStrategy.id)}
                    >
                      Run Optimization Now
                    </Button>
                  </div>
                </Card>

                {/* Market Adaptation */}
                {currentStrategy.marketAdaptation && (
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3">Market Adaptation</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Detected Regime:</span>
                        <Badge>{currentStrategy.marketAdaptation.detectedRegime.replace('_', ' ').toUpperCase()}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Confidence:</span>
                        <span>{(currentStrategy.marketAdaptation.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Analysis:</span>
                        <span>{new Date(currentStrategy.marketAdaptation.lastAnalysis).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Optimization History */}
                {optimizationResults.has(currentStrategy.id) && (
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3">Recent Optimization Results</h4>
                    <div className="space-y-2">
                      {/* Add optimization history display here */}
                    </div>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* PERFORMANCE TAB */}
          <TabsContent value="performance" className="space-y-4">
            {currentStrategy && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Performance Metrics for {currentStrategy.name}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="text-sm text-gray-600">Total Trades</div>
                    <div className="text-2xl font-bold">{currentStrategy.performance.totalTrades}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-gray-600">Win Rate</div>
                    <div className="text-2xl font-bold">{(currentStrategy.performance.winRate * 100).toFixed(1)}%</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-gray-600">Profit/Loss</div>
                    <div className={`text-2xl font-bold ${currentStrategy.performance.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${currentStrategy.performance.profitLoss.toFixed(2)}
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-gray-600">Sharpe Ratio</div>
                    <div className="text-2xl font-bold">{currentStrategy.performance.sharpeRatio.toFixed(2)}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-gray-600">Max Drawdown</div>
                    <div className="text-2xl font-bold text-red-600">
                      {currentStrategy.performance.maxDrawdown.toFixed(1)}%
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-gray-600">Streaks</div>
                    <div className="text-sm">
                      <span className="text-green-600">W: {currentStrategy.performance.consecutiveWins}</span>
                      {' / '}
                      <span className="text-red-600">L: {currentStrategy.performance.consecutiveLosses}</span>
                    </div>
                  </Card>
                </div>

                {/* Performance Chart Placeholder */}
                <Card className="p-4">
                  <h4 className="font-semibold mb-3 flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Performance History
                  </h4>
                  <div className="h-64 bg-gray-50 rounded flex items-center justify-center text-gray-500">
                    Performance chart will be displayed here
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* STRATUS BRAIN TAB */}
          <TabsContent value="stratus-brain" className="space-y-4">
            {currentStrategy && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Brain className="w-5 h-5 mr-2" />
                  Stratus Brain Insights for {currentStrategy.name}
                </h3>
                
                {currentStrategy.stratusBrain ? (
                  <>
                    <Card className="p-4">
                      <h4 className="font-semibold mb-3">Neural Network Analysis</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Neural Confidence</span>
                          <div className="flex items-center space-x-2">
                            <Progress value={currentStrategy.stratusBrain.neuralConfidence * 100} className="w-32" />
                            <span className="font-semibold">
                              {(currentStrategy.stratusBrain.neuralConfidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Predicted Win Rate</span>
                          <span className="font-semibold">
                            {(currentStrategy.stratusBrain.predictedWinRate * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Learning Progress</span>
                          <div className="flex items-center space-x-2">
                            <Progress value={currentStrategy.stratusBrain.learningProgress} className="w-32" />
                            <span className="font-semibold">
                              {currentStrategy.stratusBrain.learningProgress}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {currentStrategy.stratusBrain.suggestedAdjustments && 
                     Object.keys(currentStrategy.stratusBrain.suggestedAdjustments).length > 0 && (
                      <Card className="p-4 border-l-4 border-l-blue-500">
                        <h4 className="font-semibold mb-3">AI Suggested Adjustments</h4>
                        <div className="space-y-2 text-sm">
                          {Object.entries(currentStrategy.stratusBrain.suggestedAdjustments).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-gray-600">{key}:</span>
                              <span className="font-mono">{JSON.stringify(value)}</span>
                            </div>
                          ))}
                        </div>
                        <Button className="mt-3 w-full" variant="outline">
                          Apply AI Suggestions
                        </Button>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card className="p-8 text-center">
                    <Brain className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">Stratus Brain is gathering data...</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Neural network requires at least 10 trades to begin learning
                    </p>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Initial Setup Modal */}
      {showInitialSetup && currentStrategy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 m-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Initial Strategy Setup</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInitialSetup(false)}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Configure Starting Parameters</h3>
                <p className="text-sm text-blue-700">
                  Set your initial parameters before any AI optimization or market adjustments. 
                  These will be your baseline settings that you can always return to.
                </p>
              </div>

              <InitialSetupForm
                strategy={currentStrategy}
                onSave={(params) => {
                  controller.updateStrategyParameters(currentStrategy.id, params, 'manual');
                  setShowInitialSetup(false);
                }}
                onCancel={() => setShowInitialSetup(false)}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// Initial Setup Form Component
function InitialSetupForm({ 
  strategy, 
  onSave, 
  onCancel 
}: { 
  strategy: UnifiedStrategy; 
  onSave: (params: UnifiedStrategyParameters) => void; 
  onCancel: () => void; 
}) {
  const [params, setParams] = useState<UnifiedStrategyParameters>(
    JSON.parse(JSON.stringify(strategy.parameters))
  );

  return (
    <div className="space-y-6">
      {/* Quick Presets */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3">Quick Presets</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setParams({
                ...params,
                rsi: { ...params.rsi, lookback: 2, oversoldEntry: 25, overboughtEntry: 75 }
              });
            }}
          >
            Ultra Aggressive (RSI 2)
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setParams({
                ...params,
                rsi: { ...params.rsi, lookback: 5, oversoldEntry: 30, overboughtEntry: 70 }
              });
            }}
          >
            Aggressive (RSI 5)
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setParams({
                ...params,
                rsi: { ...params.rsi, lookback: 14, oversoldEntry: 30, overboughtEntry: 70 }
              });
            }}
          >
            Conservative (RSI 14)
          </Button>
        </div>
      </Card>

      {/* RSI Settings */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3">RSI Settings</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">RSI Lookback Period</label>
            <input
              type="number"
              value={params.rsi.lookback}
              min={2}
              max={50}
              onChange={(e) => setParams({
                ...params,
                rsi: { ...params.rsi, lookback: parseInt(e.target.value) }
              })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">Default: 2 (your preference)</p>
          </div>
          <div>
            <label className="text-sm font-medium">Oversold Entry</label>
            <input
              type="number"
              value={params.rsi.oversoldEntry}
              min={15}
              max={40}
              onChange={(e) => setParams({
                ...params,
                rsi: { ...params.rsi, oversoldEntry: parseInt(e.target.value) }
              })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Overbought Entry</label>
            <input
              type="number"
              value={params.rsi.overboughtEntry}
              min={60}
              max={85}
              onChange={(e) => setParams({
                ...params,
                rsi: { ...params.rsi, overboughtEntry: parseInt(e.target.value) }
              })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </Card>

      {/* Risk Management */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3">Risk Management</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Position Size (%)</label>
            <input
              type="number"
              value={(params.risk.positionSize * 100).toFixed(1)}
              min={0.1}
              max={5}
              step={0.1}
              onChange={(e) => setParams({
                ...params,
                risk: { ...params.risk, positionSize: parseFloat(e.target.value) / 100 }
              })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Stop Loss (ATR)</label>
            <input
              type="number"
              value={params.risk.stopLossATR}
              min={0.5}
              max={5}
              step={0.1}
              onChange={(e) => setParams({
                ...params,
                risk: { ...params.risk, stopLossATR: parseFloat(e.target.value) }
              })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Take Profit (ATR)</label>
            <input
              type="number"
              value={params.risk.takeProfitATR}
              min={1}
              max={10}
              step={0.1}
              onChange={(e) => setParams({
                ...params,
                risk: { ...params.risk, takeProfitATR: parseFloat(e.target.value) }
              })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </Card>

      {/* Optimization Control */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3">Optimization Control</h4>
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={params.optimization.enabled}
              onChange={(e) => setParams({
                ...params,
                optimization: { ...params.optimization, enabled: e.target.checked }
              })}
              className="rounded"
            />
            <span className="text-sm">Enable AI Optimization after initial setup</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={params.optimization.adaptToMarket}
              onChange={(e) => setParams({
                ...params,
                optimization: { ...params.optimization, adaptToMarket: e.target.checked }
              })}
              className="rounded"
            />
            <span className="text-sm">Allow market condition adjustments</span>
          </label>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSave(params)}>
          Save Initial Parameters
        </Button>
      </div>
    </div>
  );
}

// Helper component for parameter inputs
function ParameterInput({ 
  label, 
  value, 
  min, 
  max, 
  step = 1, 
  onChange, 
  explanation,
  disabled = false 
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  explanation?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
          disabled ? 'bg-gray-100 border-gray-200 cursor-not-allowed' : 'border-gray-300 bg-white'
        }`}
      />
      {explanation && (
        <p className="mt-1 text-xs text-gray-500">{explanation}</p>
      )}
    </div>
  );
}