"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { 
  Brain, 
  TrendingUp, 
  Activity, 
  Target, 
  Zap,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Cpu,
  Database,
  Rocket,
  Gauge,
  Calculator,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { Alert } from '../ui/alert';

interface QuantumForgeData {
  isRunning: boolean;
  currentSession: {
    sessionId: string;
    startTime: Date;
    uptime: string;
  };
  performance: {
    totalTrades: number;
    winningTrades: number;
    winRate: number;
    currentBalance: number;
    startingBalance: number;
    totalPnL: number;
    profitPercent: number;
  };
  expectancy?: {
    strategies: Array<{
      strategyName: string;
      expectancy: number;
      winProbability: number;
      averageWin: number;
      averageLoss: number;
      kellyPercent: number;
      totalTrades: number;
      profitFactor: number;
    }>;
    summary: {
      avgExpectancy: number;
      bestStrategy: { name: string; expectancy: number } | null;
      profitableStrategies: number;
    };
  };
  recentTrades: Array<{
    tradeId: string;
    timestamp: Date;
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    pnl?: number;
    strategy: string;
  }>;
  strategies: {
    active: number;
    total: number;
    rsiStrategy: {
      enabled: boolean;
      trades: number;
      winRate: number;
      lastSignal?: Date;
    };
    quantumOscillator: {
      enabled: boolean;
      trades: number;
      winRate: number;
      lastSignal?: Date;
    };
    neuralNetwork: {
      enabled: boolean;
      trades: number;
      winRate: number;
      lastSignal?: Date;
    };
    claudeQuantumOscillator: {
      enabled: boolean;
      trades: number;
      winRate: number;
      lastSignal?: Date;
    };
  };
  systemHealth: {
    databaseConnected: boolean;
    marketDataActive: boolean;
    tradingEngineStatus: 'ACTIVE' | 'PAUSED' | 'ERROR';
    lastHealthCheck: Date;
  };
}

export default function QuantumForgeStrategyMonitor() {
  const [data, setData] = useState<QuantumForgeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchQuantumForgeData = async () => {
    try {
      setError(null);
      
      // Fetch data from our real QUANTUM FORGE system API
      const response = await fetch('/api/custom-paper-trading/dashboard');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Also fetch expectancy data
      let expectancyData = null;
      try {
        const expectancyResponse = await fetch('/api/expectancy/dashboard');
        if (expectancyResponse.ok) {
          const expectancyResult = await expectancyResponse.json();
          if (expectancyResult.success) {
            expectancyData = expectancyResult.data;
          }
        }
      } catch (expectancyError) {
        console.warn('Failed to fetch expectancy data:', expectancyError);
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch QUANTUM FORGE data');
      }

      // Transform the data from live QUANTUM FORGE system
      const transformedData: QuantumForgeData = {
        isRunning: result.data?.systemStatus?.isActive || result.data?.systemStatus?.totalTrades > 0,
        currentSession: {
          sessionId: result.data?.currentSession?.id || 'quantum-forge-active',
          startTime: new Date(result.data?.currentSession?.startTime || Date.now() - 3600000),
          uptime: calculateUptime(result.data?.currentSession?.startTime)
        },
        performance: {
          totalTrades: result.data?.systemStatus?.totalTrades || 0,
          winningTrades: Math.floor((result.data?.systemStatus?.totalTrades || 0) * (result.data?.systemStatus?.winRate || 0) / 100),
          winRate: result.data?.systemStatus?.winRate || 0,
          currentBalance: result.data?.balance || (10000 + (result.data?.totalPnL || 0)),
          startingBalance: 10000, // QUANTUM FORGE starts with $10K
          totalPnL: result.data?.totalPnL || 0,
          profitPercent: result.data?.totalPnL ? (result.data.totalPnL / 10000) * 100 : 0
        },
        recentTrades: (result.data?.trades || [])
          .slice(-10)
          .map((trade: any) => ({
            tradeId: trade.tradeId,
            timestamp: new Date(trade.executedAt),
            symbol: trade.symbol,
            side: trade.side.toUpperCase(),
            quantity: trade.quantity,
            price: trade.price,
            pnl: trade.pnl,
            strategy: trade.strategy || 'QUANTUM_FORGE_CORE'
          })),
        strategies: {
          active: result.data?.trades?.length > 0 ? 4 : 0, // We have 4 active strategies
          total: 4,
          rsiStrategy: {
            enabled: true,
            trades: calculateStrategyTrades(result.data?.trades || [], 'Enhanced RSI Pullback Strategy') || 0,
            winRate: calculateStrategyWinRate(result.data?.trades || [], 'Enhanced RSI Pullback Strategy') || 0,
            lastSignal: getLastStrategySignal(result.data?.trades || [], 'Enhanced RSI Pullback Strategy')
          },
          quantumOscillator: {
            enabled: true,
            trades: calculateStrategyTrades(result.data?.trades || [], 'Bollinger Breakout Enhanced Strategy') || 0,
            winRate: calculateStrategyWinRate(result.data?.trades || [], 'Bollinger Breakout Enhanced Strategy') || 0,
            lastSignal: getLastStrategySignal(result.data?.trades || [], 'Bollinger Breakout Enhanced Strategy')
          },
          neuralNetwork: {
            enabled: true,
            trades: calculateStrategyTrades(result.data?.trades || [], 'Stratus Core Neural Strategy') || 0,
            winRate: calculateStrategyWinRate(result.data?.trades || [], 'Stratus Core Neural Strategy') || 0,
            lastSignal: getLastStrategySignal(result.data?.trades || [], 'Stratus Core Neural Strategy')
          },
          claudeQuantumOscillator: {
            enabled: true,
            trades: calculateStrategyTrades(result.data?.trades || [], 'Claude Quantum Oscillator Strategy') || 0,
            winRate: calculateStrategyWinRate(result.data?.trades || [], 'Claude Quantum Oscillator Strategy') || 0,
            lastSignal: getLastStrategySignal(result.data?.trades || [], 'Claude Quantum Oscillator Strategy')
          },
          quantumForgeCore: {
            enabled: true,
            trades: calculateStrategyTrades(result.data?.trades || [], 'CustomPaperEngine') + calculateStrategyTrades(result.data?.trades || [], 'QUANTUM FORGE™'),
            winRate: Math.max(calculateStrategyWinRate(result.data?.trades || [], 'CustomPaperEngine'), calculateStrategyWinRate(result.data?.trades || [], 'QUANTUM FORGE™')) || 0,
            lastSignal: getLastStrategySignal(result.data?.trades || [], 'CustomPaperEngine') || getLastStrategySignal(result.data?.trades || [], 'QUANTUM FORGE™')
          }
        },
        systemHealth: {
          databaseConnected: result.success,
          marketDataActive: true, // Assumed if we got data
          tradingEngineStatus: ((result.data?.trades || []).length > 0) ? 'ACTIVE' : 'PAUSED',
          lastHealthCheck: new Date()
        },
        expectancy: expectancyData
      };

      setData(transformedData);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching QUANTUM FORGE data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const calculateUptime = (startTime: string | undefined): string => {
    if (!startTime) return '0m';
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const calculateWinRate = (trades: any[]): number => {
    // Only count completed trades (those with P&L data)
    const completedTrades = trades.filter(t => t.pnl !== null && t.pnl !== undefined);
    if (completedTrades.length === 0) return 0;
    const winners = completedTrades.filter(t => t.pnl > 0).length;
    return (winners / completedTrades.length) * 100;
  };

  const calculateStrategyTrades = (trades: any[], strategyType: string): number => {
    return trades.filter(t => 
      t.strategy === strategyType || 
      t.signalSource === strategyType
    ).length;
  };

  const calculateStrategyWinRate = (trades: any[], strategyType: string): number => {
    const strategyTrades = trades.filter(t => 
      t.strategy === strategyType || 
      t.signalSource === strategyType
    );
    return calculateWinRate(strategyTrades);
  };

  const getLastStrategySignal = (trades: any[], strategyType: string): Date | undefined => {
    const strategyTrades = trades.filter(t => 
      t.strategy === strategyType || 
      t.signalSource === strategyType
    );
    if (strategyTrades.length === 0) return undefined;
    const latest = strategyTrades[0]; // First trade since ordered by desc
    return new Date(latest.executedAt);
  };

  useEffect(() => {
    fetchQuantumForgeData();
    const interval = setInterval(fetchQuantumForgeData, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mr-3" />
            <span className="text-lg">Loading QUANTUM FORGE Data...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <div className="ml-2">
            <strong>QUANTUM FORGE Connection Error</strong>
            <p className="text-sm mt-1">{error}</p>
            <Button onClick={fetchQuantumForgeData} size="sm" className="mt-2">
              Retry Connection
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="text-center py-8 text-gray-500">
            <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No QUANTUM FORGE data available</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-600" />
QUANTUM FORGE Strategy Monitor
          </h2>
          <p className="text-gray-600 mt-1">
            Advanced AI Paper Trading Platform • Real-time Strategy Execution
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right text-sm">
            <div className="text-gray-500">Last Update</div>
            <div className="font-mono">{lastUpdate.toLocaleTimeString()}</div>
          </div>
          
          <Badge className={`${
            data.isRunning 
              ? 'bg-green-100 text-green-800 border-green-300' 
              : 'bg-red-100 text-red-800 border-red-300'
          }`}>
            {data.isRunning ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                ACTIVE
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                STOPPED
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* System Status */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Rocket className="w-6 h-6 text-purple-600 mr-2" />
              <span className="font-semibold">Session</span>
            </div>
            <div className="text-sm text-gray-600">{data.currentSession.sessionId.slice(-8)}</div>
            <div className="text-lg font-bold text-purple-600">{data.currentSession.uptime}</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Database className="w-6 h-6 text-green-600 mr-2" />
              <span className="font-semibold">Database</span>
            </div>
            <div className={`text-lg font-bold ${
              data.systemHealth.databaseConnected ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.systemHealth.databaseConnected ? 'CONNECTED' : 'ERROR'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Activity className="w-6 h-6 text-blue-600 mr-2" />
              <span className="font-semibold">Market Data</span>
            </div>
            <div className={`text-lg font-bold ${
              data.systemHealth.marketDataActive ? 'text-blue-600' : 'text-red-600'
            }`}>
              {data.systemHealth.marketDataActive ? 'STREAMING' : 'OFFLINE'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Cpu className="w-6 h-6 text-orange-600 mr-2" />
              <span className="font-semibold">Trading Engine</span>
            </div>
            <div className={`text-lg font-bold ${
              data.systemHealth.tradingEngineStatus === 'ACTIVE' ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.systemHealth.tradingEngineStatus}
            </div>
          </div>
        </div>
      </Card>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Trades</p>
              <p className="text-2xl font-bold text-blue-600">{data.performance.totalTrades}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Win Rate</p>
              <p className="text-2xl font-bold text-green-600">{(data.performance.winRate || 0).toFixed(1)}%</p>
            </div>
            <Target className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Balance</p>
              <p className="text-2xl font-bold text-purple-600">${data.performance.currentBalance.toLocaleString()}</p>
            </div>
            <Gauge className="w-8 h-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total P&L</p>
              <p className={`text-2xl font-bold ${
                data.performance.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(data.performance.totalPnL || 0) >= 0 ? '+' : ''}${(data.performance.totalPnL || 0).toFixed(2)}
              </p>
            </div>
            <TrendingUp className={`w-8 h-8 ${
              data.performance.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
            }`} />
          </div>
        </Card>
      </div>

      {/* Strategy Status */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          Active Trading Strategies
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-blue-900">RSI Strategy</h4>
              <Badge className={data.strategies.rsiStrategy.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {data.strategies.rsiStrategy.enabled ? 'ENABLED' : 'DISABLED'}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">Trades:</span>
                <span className="font-medium">{data.strategies.rsiStrategy.trades}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">Win Rate:</span>
                <span className="font-medium">{(data.strategies.rsiStrategy.winRate || 0).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">Last Signal:</span>
                <span className="font-medium text-xs">
                  {data.strategies.rsiStrategy.lastSignal 
                    ? data.strategies.rsiStrategy.lastSignal.toLocaleTimeString()
                    : 'None'
                  }
                </span>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-purple-900">Bollinger Bands (GPU)</h4>
              <Badge className={data.strategies.quantumOscillator.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {data.strategies.quantumOscillator.enabled ? 'ACTIVE' : 'DISABLED'}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-purple-700">Signals:</span>
                <span className="font-medium">{data.strategies.quantumOscillator.trades}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-purple-700">Confidence:</span>
                <span className="font-medium">{(data.strategies.quantumOscillator.winRate || 0).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-purple-700">Last Signal:</span>
                <span className="font-medium text-xs">
                  {data.strategies.quantumOscillator.lastSignal 
                    ? data.strategies.quantumOscillator.lastSignal.toLocaleTimeString()
                    : 'None'
                  }
                </span>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-green-900">Neural Network</h4>
              <Badge className={data.strategies.neuralNetwork.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {data.strategies.neuralNetwork.enabled ? 'ENABLED' : 'DISABLED'}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-green-700">Trades:</span>
                <span className="font-medium">{data.strategies.neuralNetwork.trades}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-green-700">Win Rate:</span>
                <span className="font-medium">{(data.strategies.neuralNetwork.winRate || 0).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-green-700">Last Signal:</span>
                <span className="font-medium text-xs">
                  {data.strategies.neuralNetwork.lastSignal 
                    ? data.strategies.neuralNetwork.lastSignal.toLocaleTimeString()
                    : 'None'
                  }
                </span>
              </div>
            </div>
          </div>
          <div className="border rounded-lg p-4 bg-gradient-to-br from-yellow-50 to-yellow-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-yellow-900">Claude's Quantum Oscillator Pro</h4>
              <Badge className={data.strategies.claudeQuantumOscillator.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {data.strategies.claudeQuantumOscillator.enabled ? 'ACTIVE' : 'DISABLED'}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-yellow-700">Trades:</span>
                <span className="font-medium">{data.strategies.claudeQuantumOscillator.trades}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-yellow-700">Win Rate:</span>
                <span className="font-medium">{(data.strategies.claudeQuantumOscillator.winRate || 0).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-yellow-700">Last Signal:</span>
                <span className="font-medium text-xs">
                  {data.strategies.claudeQuantumOscillator.lastSignal 
                    ? data.strategies.claudeQuantumOscillator.lastSignal.toLocaleTimeString()
                    : 'None'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Expectancy Analysis */}
      {data.expectancy && (
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-green-600" />
            Expectancy Analysis - E = (W × A) - (L × B)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-white rounded-lg border border-green-200">
              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                ${data.expectancy.summary.avgExpectancy.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Average Expectancy</div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg border border-green-200">
              <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">
                {data.expectancy.summary.profitableStrategies}
              </div>
              <div className="text-sm text-gray-600">Profitable Strategies</div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg border border-green-200">
              <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-purple-600">
                {data.expectancy.summary.bestStrategy?.name.split(' ')[0] || 'None'}
              </div>
              <div className="text-sm text-gray-600">Best Strategy</div>
              <div className="text-xs text-green-600 font-mono">
                ${data.expectancy.summary.bestStrategy?.expectancy.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            {data.expectancy.strategies.map((strategy) => (
              <div key={strategy.strategyName} className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                  {strategy.strategyName.split(' ').slice(0, 2).join(' ')}
                </h4>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expectancy:</span>
                    <span className={`font-bold ${
                      strategy.expectancy >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${strategy.expectancy.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Win Rate:</span>
                    <span className="font-medium">
                      {(strategy.winProbability * 100).toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Win:</span>
                    <span className="text-green-600 font-medium">
                      +${strategy.averageWin.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Loss:</span>
                    <span className="text-red-600 font-medium">
                      -${strategy.averageLoss.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kelly %:</span>
                    <span className={`font-medium ${
                      strategy.kellyPercent > 15 ? 'text-orange-600' : 'text-blue-600'
                    }`}>
                      {strategy.kellyPercent.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trades:</span>
                    <span className="font-medium">{strategy.totalTrades}</span>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Profit Factor:</span>
                      <span className={`font-bold ${
                        strategy.profitFactor >= 1.5 ? 'text-green-600' : 
                        strategy.profitFactor >= 1 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {strategy.profitFactor.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Expectancy Formula:</strong> E = (W × A) - (L × B) where W = Win Probability, A = Average Win, L = Loss Probability, B = Average Loss
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Kelly % shows optimal position sizing. Values above 15% indicate high-conviction strategies but require careful risk management.
            </p>
          </div>
        </Card>
      )}

      {/* Recent Trades */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-600" />
Recent QUANTUM FORGE Trades
        </h3>
        
        {data.recentTrades.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No recent trades</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Time</th>
                  <th className="text-left py-2">Symbol</th>
                  <th className="text-left py-2">Side</th>
                  <th className="text-right py-2">Quantity</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">P&L</th>
                  <th className="text-left py-2">Strategy</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTrades.map((trade) => (
                  <tr key={trade.tradeId} className="border-b hover:bg-gray-50">
                    <td className="py-2">{trade.timestamp.toLocaleTimeString()}</td>
                    <td className="py-2 font-medium">{trade.symbol}</td>
                    <td className="py-2">
                      <Badge className={
                        trade.side === 'BUY' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }>
                        {trade.side}
                      </Badge>
                    </td>
                    <td className="py-2 text-right font-mono">{(trade.quantity || 0).toFixed(8)}</td>
                    <td className="py-2 text-right font-mono">${(trade.price || 0).toFixed(2)}</td>
                    <td className={`py-2 text-right font-mono ${
                      (trade.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {trade.pnl !== undefined && trade.pnl !== null
                        ? `${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)}`
                        : 'Pending'
                      }
                    </td>
                    <td className="py-2 text-xs text-gray-500">{trade.strategy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* QUANTUM FORGE™ Branding Footer */}
      <Card className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="text-center">
          <h3 className="text-xl font-bold flex items-center justify-center gap-2">
            <Brain className="w-6 h-6" />
QUANTUM FORGE AI Trading Platform
          </h3>
          <p className="text-sm opacity-90 mt-1">
            Advanced Paper Trading • Real Market Data • AI-Powered Strategies • $10K Starting Balance
          </p>
        </div>
      </Card>
    </div>
  );
}