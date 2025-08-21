"use client";

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Alert } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { alpacaPaperTradingService } from '../lib/alpaca-paper-trading-service';
import { paperAccountCyclingService } from '../lib/paper-account-cycling-service';
import type { AlpacaPaperAccount, AlpacaPosition, AlpacaOrder } from '../lib/alpaca-paper-trading-service';

interface PaperTradingDashboardProps {
  userId: string;
}

export default function PaperTradingDashboard({ userId }: PaperTradingDashboardProps) {
  const [account, setAccount] = useState<AlpacaPaperAccount | null>(null);
  const [positions, setPositions] = useState<AlpacaPosition[]>([]);
  const [orders, setOrders] = useState<AlpacaOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Trade form state
  const [orderForm, setOrderForm] = useState({
    symbol: 'BTCUSD',
    quantity: 1,
    side: 'buy' as 'buy' | 'sell',
    orderType: 'market' as 'market' | 'limit',
    limitPrice: ''
  });

  // Account cycling state
  const [cyclingConfig, setCyclingConfig] = useState({
    maxAccountAge: 168, // 7 days
    maxTrades: 1000,
    maxDrawdown: 50,
    resetOnUserRequest: true
  });

  const [accountStats, setAccountStats] = useState({
    dailyPnL: 0,
    totalTrades: 0,
    winRate: 0,
    maxDrawdown: 0,
    sharpeRatio: 0
  });

  useEffect(() => {
    initializePaperTrading();
  }, [userId]);

  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        refreshAccountData();
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const initializePaperTrading = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check for existing paper account or create new one
      const paperAccount = await alpacaPaperTradingService.initializeAccount(
        userId,
        process.env.NEXT_PUBLIC_ALPACA_PAPER_API_KEY || '',
        process.env.NEXT_PUBLIC_ALPACA_PAPER_API_SECRET || ''
      );

      if (paperAccount) {
        setAccount(paperAccount);
        setIsConnected(true);
        
        // Start monitoring for cycling
        paperAccountCyclingService.setUserConfig(userId, cyclingConfig);
        await paperAccountCyclingService.startUserMonitoring(userId);
        
        await refreshAccountData();
      } else {
        setError('Failed to initialize paper trading account. Please check your Alpaca API credentials.');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize paper trading');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAccountData = async () => {
    try {
      const [accountInfo, positionsData, ordersData] = await Promise.all([
        alpacaPaperTradingService.getAccountInfo(),
        alpacaPaperTradingService.getPositions(),
        alpacaPaperTradingService.getOpenOrders()
      ]);

      if (accountInfo && account) {
        setAccount({
          ...account,
          currentBalance: parseFloat(accountInfo.equity),
          buyingPower: parseFloat(accountInfo.buying_power),
          dayTradingBuyingPower: parseFloat(accountInfo.daytrading_buying_power)
        });
      }

      setPositions(positionsData);
      setOrders(ordersData);

      // Calculate stats
      const totalUnrealizedPnL = positionsData.reduce((sum, pos) => sum + pos.unrealizedPl, 0);
      const totalPositionValue = positionsData.reduce((sum, pos) => sum + Math.abs(pos.marketValue), 0);

      setAccountStats({
        dailyPnL: totalUnrealizedPnL,
        totalTrades: account?.totalTrades || 0,
        winRate: account?.winningTrades && account?.totalTrades 
          ? (account.winningTrades / account.totalTrades) * 100 
          : 0,
        maxDrawdown: account?.maxDrawdown || 0,
        sharpeRatio: 0 // Would calculate based on returns
      });

    } catch (err) {
      console.error('Failed to refresh account data:', err);
    }
  };

  const handlePlaceOrder = async () => {
    try {
      setError(null);
      
      const orderParams = {
        symbol: orderForm.symbol.toUpperCase(),
        qty: orderForm.quantity,
        side: orderForm.side,
        type: orderForm.orderType,
        ...(orderForm.orderType === 'limit' && orderForm.limitPrice && {
          limitPrice: parseFloat(orderForm.limitPrice)
        })
      };

      const order = await alpacaPaperTradingService.placeOrder(orderParams);
      
      if (order) {
        console.log('✅ Order placed successfully:', order);
        await refreshAccountData();
        
        // Reset form
        setOrderForm({
          symbol: 'BTCUSD',
          quantity: 1,
          side: 'buy',
          orderType: 'market',
          limitPrice: ''
        });
      } else {
        setError('Failed to place order');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const success = await alpacaPaperTradingService.cancelOrder(orderId);
      if (success) {
        console.log('✅ Order cancelled successfully');
        await refreshAccountData();
      } else {
        setError('Failed to cancel order');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel order');
    }
  };

  const handleResetAccount = async () => {
    try {
      setIsLoading(true);
      
      const newAccount = await paperAccountCyclingService.manualCycle(
        userId, 
        'Manual reset requested by user'
      );
      
      if (newAccount) {
        setAccount(newAccount);
        await refreshAccountData();
        console.log('✅ Account reset successfully');
      } else {
        setError('Failed to reset account');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset account');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Progress value={50} className="w-48 mb-4" />
          <p>Initializing paper trading account...</p>
        </div>
      </div>
    );
  }

  if (!isConnected || !account) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Paper Trading Setup</h2>
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <div className="text-red-800">{error}</div>
            </Alert>
          )}
          <div className="space-y-4">
            <p>Initialize your paper trading account to start risk-free trading with real market data.</p>
            <Button onClick={initializePaperTrading} disabled={isLoading}>
              {isLoading ? 'Connecting...' : 'Initialize Paper Trading'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Paper Trading Dashboard</h1>
          <p className="text-gray-600">Risk-free trading with real market data via Alpaca</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="default" className="bg-green-100 text-green-800">
            🧪 PAPER TRADING
          </Badge>
          <Badge variant="outline">
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </Badge>
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <div className="text-red-800">{error}</div>
        </Alert>
      )}

      {/* Account Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Account Balance</div>
          <div className="text-2xl font-bold">{formatCurrency(account.currentBalance)}</div>
          <div className="text-xs text-gray-500">Paper Money</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-gray-600">Buying Power</div>
          <div className="text-2xl font-bold">{formatCurrency(account.buyingPower || 0)}</div>
          <div className="text-xs text-gray-500">Available</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-gray-600">Today's P&L</div>
          <div className={`text-2xl font-bold ${accountStats.dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(accountStats.dailyPnL)}
          </div>
          <div className="text-xs text-gray-500">Unrealized</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-gray-600">Win Rate</div>
          <div className="text-2xl font-bold">{accountStats.winRate.toFixed(1)}%</div>
          <div className="text-xs text-gray-500">{accountStats.totalTrades} trades</div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="trading" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="trading">Trading</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Trading Tab */}
        <TabsContent value="trading" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              🧠 Stratus Engine Automated Trading
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-green-900">✅ Fully Automated Paper Trading</h4>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="space-y-2 text-sm text-green-700">
                  <div>• Stratus Engine monitors all Pine Script strategies automatically</div>
                  <div>• Trades are executed via Alpaca Paper Trading API</div>
                  <div>• Real-time parameter optimization based on market conditions</div>
                  <div>• No manual intervention required</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 bg-purple-50 border-purple-200">
                  <div className="text-sm text-purple-600 mb-1">Strategy Monitoring</div>
                  <div className="text-lg font-bold text-purple-900">Active</div>
                  <div className="text-xs text-purple-600">AI continuously optimizes parameters</div>
                </Card>
                
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <div className="text-sm text-blue-600 mb-1">Trade Execution</div>
                  <div className="text-lg font-bold text-blue-900">Automated</div>
                  <div className="text-xs text-blue-600">All trades via Stratus Engine</div>
                </Card>
                
                <Card className="p-4 bg-green-50 border-green-200">
                  <div className="text-sm text-green-600 mb-1">Risk Management</div>
                  <div className="text-lg font-bold text-green-900">Protected</div>
                  <div className="text-xs text-green-600">Paper trading - no real money</div>
                </Card>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 border rounded-lg">
                <h5 className="font-medium mb-2">📊 How It Works</h5>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>Stratus Engine analyzes 7-day market data and strategy performance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>AI optimizes Pine Script strategy parameters in real-time</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span>When strategy conditions are met, trades are executed automatically</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                    <span>Results feed back into optimization for continuous improvement</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Positions Tab */}
        <TabsContent value="positions" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Open Positions</h3>
            {positions.length === 0 ? (
              <p className="text-gray-500">No open positions</p>
            ) : (
              <div className="space-y-3">
                {positions.map((position, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{position.symbol}</div>
                      <div className="text-sm text-gray-600">
                        {position.qty} shares • {position.side}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(position.marketValue)}</div>
                      <div className={`text-sm ${position.unrealizedPl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(position.unrealizedPl)} ({formatPercent(position.unrealizedPlpc)})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Open Orders</h3>
            {orders.length === 0 ? (
              <p className="text-gray-500">No open orders</p>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{order.symbol}</div>
                      <div className="text-sm text-gray-600">
                        {order.side} {order.qty} • {order.orderType}
                        {order.limitPrice && ` @ ${formatCurrency(order.limitPrice)}`}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{order.status}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Total Trades</div>
                <div className="text-xl font-bold">{accountStats.totalTrades}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Win Rate</div>
                <div className="text-xl font-bold">{accountStats.winRate.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Max Drawdown</div>
                <div className="text-xl font-bold text-red-600">{formatPercent(accountStats.maxDrawdown)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Account Age</div>
                <div className="text-xl font-bold">
                  {Math.ceil((Date.now() - account.createdAt.getTime()) / (1000 * 60 * 60 * 24))} days
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Account Management</h3>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Account Information</h4>
                <div className="space-y-2 text-sm">
                  <div>Account ID: {account.id}</div>
                  <div>Platform: Alpaca Paper Trading</div>
                  <div>Created: {account.createdAt.toLocaleDateString()}</div>
                  <div>Initial Balance: {formatCurrency(account.initialBalance)}</div>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Reset Account</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Reset your paper trading account to start fresh. All positions will be closed and balance reset to $100,000.
                </p>
                <Button
                  onClick={handleResetAccount}
                  variant="outline"
                  disabled={isLoading}
                >
                  {isLoading ? 'Resetting...' : 'Reset Account'}
                </Button>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Auto-Cycling Settings</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Configure when your paper trading account automatically cycles to a fresh state.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Account Age (hours)</label>
                    <input
                      type="number"
                      value={cyclingConfig.maxAccountAge}
                      onChange={(e) => setCyclingConfig({...cyclingConfig, maxAccountAge: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Trades</label>
                    <input
                      type="number"
                      value={cyclingConfig.maxTrades}
                      onChange={(e) => setCyclingConfig({...cyclingConfig, maxTrades: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}