'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';

interface MarketData {
  symbol: string;
  price: number;
  timestamp: string;
  source: string;
}

interface Trade {
  id: string;
  symbol: string;
  side: string;
  quantity: number;
  price: number;
  strategy: string;
  type: string;
  status: string;
  timestamp: string;
}

interface StrategyStatus {
  name: string;
  status: string;
  lastSignal: string;
  reason: string;
  currentRSI?: number;
  threshold?: any;
  currentValue?: number;
  confidence?: number;
}

export default function ManualTradingDashboard() {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [strategies, setStrategies] = useState<StrategyStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Trade form state
  const [symbol, setSymbol] = useState('BTCUSD');
  const [side, setSide] = useState('buy');
  const [quantity, setQuantity] = useState('0.01');
  const [orderType, setOrderType] = useState('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [strategy, setStrategy] = useState('manual');

  const MANUAL_TRADING_URL = '';

  // Fetch market data
  const fetchMarketData = async () => {
    try {
      const response = await fetch(`/api/manual-trading/market-data/${symbol}`);
      const data = await response.json();
      setMarketData(data);
    } catch (error) {
      console.error('Error fetching market data:', error);
    }
  };

  // Fetch trade history (mock for now)
  const fetchTrades = async () => {
    try {
      const mockTrades = [
        {
          id: '1',
          symbol: 'BTCUSD',
          side: 'buy',
          quantity: 0.01,
          price: 113500,
          strategy: 'manual',
          type: 'manual',
          status: 'filled',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '2',
          symbol: 'BTCUSD', 
          side: 'sell',
          quantity: 0.01,
          price: 114000,
          strategy: 'manual',
          type: 'manual',
          status: 'filled',
          timestamp: new Date().toISOString()
        }
      ];
      setTrades(mockTrades);
    } catch (error) {
      console.error('Error fetching trades:', error);
    }
  };

  // Fetch strategy status
  const fetchStrategyStatus = async () => {
    try {
      const response = await fetch('/api/manual-trading/strategy-status');
      const data = await response.json();
      setStrategies(data.strategies);
    } catch (error) {
      console.error('Error fetching strategy status:', error);
    }
  };

  // Execute manual trade
  const executeTrade = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/manual-trading/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          side,
          quantity: parseFloat(quantity),
          orderType,
          limitPrice: limitPrice ? parseFloat(limitPrice) : undefined,
          strategy
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: `Trade executed successfully! Order ID: ${result.trade.orderId}` });
        fetchTrades(); // Refresh trade history
      } else {
        setMessage({ type: 'error', text: result.error || 'Trade execution failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error executing trade: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh data
  useEffect(() => {
    fetchMarketData();
    fetchTrades();
    fetchStrategyStatus();

    const interval = setInterval(() => {
      fetchMarketData();
      fetchStrategyStatus();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [symbol]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manual Trading Dashboard</h1>
        <Button onClick={() => window.location.reload()} variant="outline">
          Refresh All Data
        </Button>
      </div>

      {/* Market Data */}
      <Card>
        <CardHeader>
          <CardTitle>Live Market Data</CardTitle>
        </CardHeader>
        <CardContent>
          {marketData ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Symbol</Label>
                <div className="text-2xl font-bold">{marketData.symbol}</div>
              </div>
              <div>
                <Label>Current Price</Label>
                <div className="text-2xl font-bold text-green-600">${marketData.price.toLocaleString()}</div>
              </div>
              <div>
                <Label>Source</Label>
                <div className="text-lg">{marketData.source}</div>
              </div>
              <div>
                <Label>Last Updated</Label>
                <div className="text-sm text-gray-600">
                  {new Date(marketData.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ) : (
            <div>Loading market data...</div>
          )}
        </CardContent>
      </Card>

      {/* Manual Trade Form */}
      <Card>
        <CardHeader>
          <CardTitle>Execute Manual Trade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert className={message.type === 'error' ? 'border-red-500' : 'border-green-500'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="BTCUSD"
              />
            </div>
            <div>
              <Label htmlFor="side">Side</Label>
              <Select value={side} onValueChange={setSide}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.01"
                type="number"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="orderType">Order Type</Label>
              <Select value={orderType} onValueChange={setOrderType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">Market</SelectItem>
                  <SelectItem value="limit">Limit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {orderType === 'limit' && (
              <div>
                <Label htmlFor="limitPrice">Limit Price</Label>
                <Input
                  id="limitPrice"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  placeholder="113500"
                  type="number"
                />
              </div>
            )}
            <div>
              <Label htmlFor="strategy">Strategy</Label>
              <Select value={strategy} onValueChange={setStrategy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="RSI Pullback Pro">RSI Pullback Pro</SelectItem>
                  <SelectItem value="Claude Quantum Oscillator">Claude Quantum Oscillator</SelectItem>
                  <SelectItem value="Stratus Core Neural">Stratus Core Neural</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={executeTrade} 
            disabled={isLoading || !symbol || !quantity}
            className="w-full"
            size="lg"
          >
            {isLoading ? 'Executing Trade...' : 'Execute Paper Trade'}
          </Button>
        </CardContent>
      </Card>

      {/* Strategy Status */}
      <Card>
        <CardHeader>
          <CardTitle>Strategy Status - Why No Auto Trades?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {strategies.map((strategy, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{strategy.name}</h3>
                  <Badge variant={strategy.status === 'active' ? 'default' : 'secondary'}>
                    {strategy.status}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  Last Signal: {new Date(strategy.lastSignal).toLocaleString()}
                </div>
                <div className="text-sm">
                  <strong>Why not triggering:</strong> {strategy.reason}
                </div>
                {strategy.currentRSI && (
                  <div className="text-sm mt-1">
                    Current RSI: {strategy.currentRSI} (Buy: {strategy.threshold.buy}, Sell: {strategy.threshold.sell})
                  </div>
                )}
                {strategy.confidence && (
                  <div className="text-sm mt-1">
                    Neural Confidence: {(strategy.confidence * 100).toFixed(1)}% (Min: {(strategy.threshold.minimum * 100).toFixed(0)}%)
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Trades */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {trades.length > 0 ? (
              trades.map((trade) => (
                <div key={trade.id} className="border rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">
                      {trade.side.toUpperCase()} {trade.quantity} {trade.symbol}
                    </div>
                    <div className="text-sm text-gray-600">
                      ${trade.price.toLocaleString()} • {trade.strategy} • {new Date(trade.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={trade.status === 'filled' ? 'default' : 'secondary'}>
                      {trade.status}
                    </Badge>
                    <div className="text-sm text-gray-600">{trade.type}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-600 py-8">
                No trades found. Execute a manual trade to test the system!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}