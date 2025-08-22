"use client";

import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import RealTimeChart from './real-time-chart';

export default function LiveTradingDashboard() {
  // Replace mock hooks with real QUANTUM FORGE™ data
  const [quantumForgeStatus, setQuantumForgeStatus] = useState<any>(null);
  const [quantumForgePortfolio, setQuantumForgePortfolio] = useState<any>(null);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSD');

  // Fetch real QUANTUM FORGE™ data
  const fetchQuantumForgeData = async () => {
    try {
      const [statusResponse, portfolioResponse] = await Promise.all([
        fetch('/api/quantum-forge/status'),
        fetch('/api/quantum-forge/portfolio')
      ]);

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setQuantumForgeStatus(statusData.data);
      }

      if (portfolioResponse.ok) {
        const portfolioData = await portfolioResponse.json();
        setQuantumForgePortfolio(portfolioData.data);
      }
    } catch (error) {
      console.error('Failed to fetch QUANTUM FORGE™ data:', error);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchQuantumForgeData();
    const interval = setInterval(fetchQuantumForgeData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Create live trading state from QUANTUM FORGE™ data
  const liveTradingState = {
    isActive: quantumForgeStatus?.quantumForge?.isRunning || false,
    totalTrades: quantumForgeStatus?.quantumForge?.totalTrades || 0,
    totalProfit: quantumForgePortfolio?.realizedPnL || 0,
    activeStrategies: new Set(['quantum-forge-engine']),
    riskLevel: 'medium',
    winningTrades: Math.round((quantumForgeStatus?.quantumForge?.winRate || 0) * (quantumForgeStatus?.quantumForge?.totalTrades || 0) / 100),
    averageTradeSize: quantumForgePortfolio?.totalValue ? quantumForgePortfolio.totalValue / Math.max(quantumForgeStatus?.quantumForge?.totalTrades || 1, 1) : 0,
    startTime: Date.now() - (6 * 60 * 60 * 1000), // Approximate 6 hours ago
    positions: quantumForgePortfolio?.positions || [],
    recentTrades: quantumForgePortfolio?.positions?.slice(0, 10) || []
  };

  // Mock strategy data based on QUANTUM FORGE™
  useEffect(() => {
    if (quantumForgeStatus) {
      setStrategies([
        {
          id: 'quantum-forge-engine',
          name: 'QUANTUM FORGE™ Trading Engine',
          type: 'Multi-Symbol AI',
          performance: {
            winRate: (quantumForgeStatus.quantumForge?.winRate || 0) / 100,
            totalTrades: quantumForgeStatus.quantumForge?.totalTrades || 0
          }
        }
      ]);
    }
  }, [quantumForgeStatus]);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    });
  };

  const formatPercentage = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  // Real trading control functions (for QUANTUM FORGE™)
  const startLiveTrading = async () => {
    try {
      // In a real implementation, this would start the QUANTUM FORGE™ engine
      alert('QUANTUM FORGE™ trading engine start functionality would be implemented here');
      await fetchQuantumForgeData(); // Refresh data
    } catch (error) {
      console.error('Failed to start trading:', error);
    }
  };

  const stopLiveTrading = async () => {
    try {
      // In a real implementation, this would stop the QUANTUM FORGE™ engine
      alert('QUANTUM FORGE™ trading engine stop functionality would be implemented here');
      await fetchQuantumForgeData(); // Refresh data
    } catch (error) {
      console.error('Failed to stop trading:', error);
    }
  };

  const toggleStrategy = (strategyId: string) => {
    // For QUANTUM FORGE™, this is a single integrated system
    alert(`Strategy ${strategyId} toggle functionality would be implemented here`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">QUANTUM FORGE™ Live Trading Dashboard</h2>
          <p className="text-gray-600">Monitor your QUANTUM FORGE™ AI trading performance and positions</p>
        </div>
        <Badge variant={liveTradingState.isActive ? "default" : "secondary"}>
          {liveTradingState.isActive ? "QUANTUM FORGE™ ACTIVE" : "QUANTUM FORGE™ STOPPED"}
        </Badge>
      </div>

      {/* Trading Control Panel */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">QUANTUM FORGE™ Control</h3>
          <Button
            onClick={liveTradingState.isActive ? stopLiveTrading : startLiveTrading}
            variant={liveTradingState.isActive ? "destructive" : "default"}
            size="lg"
          >
            {liveTradingState.isActive ? 'Stop QUANTUM FORGE™' : 'Start QUANTUM FORGE™'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {liveTradingState.totalTrades}
            </div>
            <div className="text-sm text-gray-600">Total Trades</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(liveTradingState.totalProfit)}
            </div>
            <div className="text-sm text-gray-600">Total Profit</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {liveTradingState.activeStrategies.size}
            </div>
            <div className="text-sm text-gray-600">Active Strategies</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {liveTradingState.riskLevel.toUpperCase()}
            </div>
            <div className="text-sm text-gray-600">Risk Level</div>
          </div>
        </div>

        {/* Strategy Toggle Controls */}
        <div className="space-y-3">
          <h4 className="text-md font-semibold">QUANTUM FORGE™ Engine Status</h4>
          {strategies.map((strategy) => (
            <div key={strategy.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Switch
                  checked={liveTradingState.activeStrategies.has(strategy.id)}
                  onCheckedChange={() => toggleStrategy(strategy.id)}
                  disabled={!liveTradingState.isActive}
                />
                <div>
                  <div className="font-medium">{strategy.name}</div>
                  <div className="text-sm text-gray-600">{strategy.type}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-green-600">
                  {formatPercentage(strategy.performance.winRate * 100)} win rate
                </div>
                <div className="text-xs text-gray-500">
                  {strategy.performance.totalTrades} trades
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Tabs defaultValue="chart" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chart">Live Chart</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="trades">Recent Trades</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          <div className="space-y-4">
            {/* Symbol Selection for Chart */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Market Symbol</h4>
                <div className="text-sm text-gray-600">
                  Real-time trading data
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {['BTCUSD', 'ETHUSD', 'XRPUSD', 'ADAUSD', 'SOLUSD', 'LTCUSD'].map((symbol) => (
                  <Button
                    key={symbol}
                    variant={selectedSymbol === symbol ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSymbol(symbol)}
                  >
                    {symbol}
                  </Button>
                ))}
              </div>
            </Card>

            {/* Live Chart */}
            <RealTimeChart
              symbol={selectedSymbol}
              height={500}
              showControls={true}
              className="bg-white"
            />
          </div>
        </TabsContent>

        <TabsContent value="positions">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Open Positions</h3>
            {liveTradingState.positions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No open positions</p>
                <p className="text-sm text-gray-500">
                  {liveTradingState.isActive ? 'QUANTUM FORGE™ positions will appear here when trades are opened' : 'Start QUANTUM FORGE™ to see your positions'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {liveTradingState.positions.map((position, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{position.symbol}</div>
                      <div className="text-sm text-gray-600">
                        {position.quantity} • {position.side}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(position.value)}</div>
                      <div className={`text-sm ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(position.pnlPercent)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="trades">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Trades</h3>
            {liveTradingState.recentTrades.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No trades yet</p>
                <p className="text-sm text-gray-500">
                  {liveTradingState.isActive ? 'QUANTUM FORGE™ trade activity will appear here' : 'Start QUANTUM FORGE™ to see your activity'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {liveTradingState.recentTrades.slice(0, 10).map((trade, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{trade.symbol}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(trade.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-center">
                      <Badge variant={trade.side === 'buy' ? 'default' : 'destructive'}>
                        {trade.side.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(trade.value)}</div>
                      <div className={`text-sm ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
            {liveTradingState.totalTrades === 0 ? (
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-600">No performance data yet</p>
                  <p className="text-sm text-gray-500">
                    Start QUANTUM FORGE™ to see P&L charts, win rate, and AI strategy performance
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600">Win Rate</div>
                  <div className="text-xl font-bold text-blue-700">
                    {((liveTradingState.winningTrades / liveTradingState.totalTrades) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-blue-600">
                    {liveTradingState.winningTrades}/{liveTradingState.totalTrades} trades
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600">Total P&L</div>
                  <div className={`text-xl font-bold ${liveTradingState.totalProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatCurrency(liveTradingState.totalProfit)}
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-purple-600">Avg Trade</div>
                  <div className="text-xl font-bold text-purple-700">
                    {formatCurrency(liveTradingState.averageTradeSize)}
                  </div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-sm text-orange-600">Active Time</div>
                  <div className="text-xl font-bold text-orange-700">
                    {Math.floor((Date.now() - liveTradingState.startTime) / (1000 * 60))}m
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
