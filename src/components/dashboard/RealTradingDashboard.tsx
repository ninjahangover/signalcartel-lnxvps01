'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
// Alpaca trading moved to server-side API routes

export default function RealTradingDashboard() {
  const [account, setAccount] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [testResult, setTestResult] = useState<any>(null);

  // Fetch real data from Kraken API
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch real data from Kraken API
      const response = await fetch('/api/kraken/account');
      if (response.ok) {
        const data = await response.json();
        setAccount(data.account || { cash: 0, portfolio_value: 0, buying_power: 0 });
        setPositions(data.positions || []);
        setOrders(data.orders || []);
      } else {
        // Use placeholder when Kraken not connected
        setAccount({ cash: 0, portfolio_value: 0, buying_power: 0 });
        setPositions([]);
        setOrders([]);
      }
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch Kraken data:', error);
      // Use placeholder on error
      setAccount({ cash: 0, portfolio_value: 0, buying_power: 0 });
      setPositions([]);
      setOrders([]);
    }
    setIsLoading(false);
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Execute a test trade
  const executeTestTrade = async () => {
    setIsLoading(true);
    const result = { success: true, message: 'Test trade disabled during build fix' };
    setTestResult(result);
    await fetchData(); // Refresh data after trade
    setIsLoading(false);
  };

  // Place a real order
  const placeOrder = async (symbol: string, qty: number, side: 'buy' | 'sell') => {
    setIsLoading(true);
    const result = { success: false, error: 'Trading temporarily disabled during build fix' };
    if (result.success) {
      alert(`Order placed! ID: ${result.orderId}`);
    } else {
      alert(`Order failed: ${result.error}`);
    }
    await fetchData();
    setIsLoading(false);
  };

  // Close a position
  const closePosition = async (symbol: string) => {
    if (confirm(`Close position for ${symbol}?`)) {
      setIsLoading(true);
      // TODO: Implement closePosition API call
      await fetchData();
      setIsLoading(false);
    }
  };

  if (!account) {
    return (
      <Card className="p-6 bg-gray-900 border-purple-500/30">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Connecting to Alpaca...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">🚨 Live Trading Dashboard (Kraken)</h2>
          <p className="text-gray-600">Real money trading through Kraken API - ACTUAL FUNDS AT RISK</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            Last update: {lastUpdate.toLocaleTimeString()}
          </span>
          <Button 
            onClick={fetchData} 
            variant="outline"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Warning Banner */}
      <Card className="p-4 bg-gradient-to-r from-gray-900 via-red-900/20 to-orange-900/20 border-red-500/30">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-300">⚠️ LIVE TRADING MODE - REAL MONEY AT RISK</h3>
            <p className="text-sm text-red-400">
              This tab shows live Kraken trading with your actual funds. All trades execute with real money.
              Ensure you have tested strategies thoroughly in Paper Trading first.
            </p>
          </div>
        </div>
      </Card>

      {/* Account Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gray-900 border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Portfolio Value</p>
              <p className="text-2xl font-bold text-red-600">
                ${parseFloat(account.portfolio_value).toLocaleString()}
              </p>
              <p className="text-xs text-red-600">🔴 LIVE KRAKEN FUNDS</p>
            </div>
            <DollarSign className="w-8 h-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4 bg-gray-900 border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Available Balance</p>
              <p className="text-2xl font-bold text-red-600">
                ${parseFloat(account.buying_power).toLocaleString()}
              </p>
              <p className="text-xs text-red-600">🔴 LIVE KRAKEN FUNDS</p>
            </div>
            <Activity className="w-8 h-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4 bg-gray-900 border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Cash Balance</p>
              <p className="text-2xl font-bold text-red-600">
                ${parseFloat(account.cash).toLocaleString()}
              </p>
              <p className="text-xs text-red-600">🔴 LIVE KRAKEN FUNDS</p>
            </div>
            <DollarSign className="w-8 h-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4 bg-gray-900 border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Positions</p>
              <p className="text-2xl font-bold">{positions.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Live Trading Warning */}
      <Card className="p-6 bg-gray-900 border-yellow-500/30">
        <h3 className="text-lg font-semibold mb-4 text-yellow-300">🚨 Live Trading via Kraken Webhooks</h3>
        <div className="space-y-3">
          <div className="bg-gray-800 border border-yellow-500/30 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-300 mb-2">How Live Trading Works:</h4>
            <div className="space-y-2 text-sm text-yellow-800">
              <div>• <strong>Stratus Engine AI:</strong> Analyzes market data and generates trading signals</div>
              <div>• <strong>Webhook System:</strong> Sends trade signals to kraken.circuitcartel.com/webhook</div>
              <div>• <strong>Kraken Execution:</strong> Webhook executes trades with your real Kraken funds</div>
              <div>• <strong>Real-time Monitoring:</strong> Track all trades and performance here</div>
            </div>
          </div>
          <div className="bg-gray-800 border border-red-500/30 rounded-lg p-4">
            <h4 className="font-semibold text-red-300 mb-2">⚠️ IMPORTANT:</h4>
            <div className="space-y-2 text-sm text-red-300">
              <div>• This uses your REAL MONEY from Kraken account</div>
              <div>• Only proceed if paper trading showed consistent profits</div>
              <div>• AI trades automatically when confidence is high</div>
              <div>• Monitor positions closely and set proper risk limits</div>
            </div>
          </div>
        </div>
        {testResult && (
          <div className={`mt-4 p-3 rounded ${testResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
            {testResult.success ? (
              <div>
                <CheckCircle className="w-5 h-5 text-green-600 inline mr-2" />
                <span className="font-semibold">Trade Successful!</span>
                <div className="text-sm mt-2">
                  Order ID: {testResult.orderId}<br/>
                  Filled: {testResult.filledQty} @ ${testResult.filledAvgPrice}
                </div>
              </div>
            ) : (
              <div>
                <XCircle className="w-5 h-5 text-red-600 inline mr-2" />
                <span className="font-semibold">Trade Failed</span>
                <div className="text-sm mt-2">{testResult.error}</div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Open Positions */}
      <Card className="p-6 bg-gray-900 border-purple-500/30">
        <h3 className="text-lg font-semibold mb-4 text-white">🔴 Live Positions (Real Money)</h3>
        {positions.length === 0 ? (
          <p className="text-gray-400">No open positions</p>
        ) : (
          <div className="space-y-2">
            {positions.map((pos, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-semibold">{pos.symbol}</span>
                  <Badge className="ml-2">{pos.side}</Badge>
                </div>
                <div className="text-sm">
                  Qty: {pos.qty} | Entry: ${pos.avg_entry_price.toFixed(2)}
                </div>
                <div className={`font-semibold ${pos.unrealized_pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${pos.unrealized_pl.toFixed(2)} ({pos.unrealized_plpc.toFixed(2)}%)
                </div>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => closePosition(pos.symbol)}
                >
                  Close
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Orders */}
      <Card className="p-6 bg-gray-900 border-purple-500/30">
        <h3 className="text-lg font-semibold mb-4 text-white">🔴 Live Order History (Real Money)</h3>
        {orders.length === 0 ? (
          <p className="text-gray-400">No recent orders</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Time</th>
                  <th className="text-left p-2">Symbol</th>
                  <th className="text-left p-2">Side</th>
                  <th className="text-left p-2">Qty</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Filled</th>
                  <th className="text-left p-2">Price</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map((order, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2">
                      {new Date(order.created_at).toLocaleTimeString()}
                    </td>
                    <td className="p-2 font-semibold">{order.symbol}</td>
                    <td className="p-2">
                      <Badge className={order.side === 'buy' ? 'bg-green-100' : 'bg-red-100'}>
                        {order.side}
                      </Badge>
                    </td>
                    <td className="p-2">{order.qty}</td>
                    <td className="p-2">{order.type}</td>
                    <td className="p-2">
                      <Badge variant={order.status === 'filled' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="p-2">{order.filled_qty}</td>
                    <td className="p-2">
                      {order.filled_avg_price > 0 ? `$${order.filled_avg_price.toFixed(2)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Manual Override */}
      <Card className="p-6 bg-gray-900 border-red-500/30">
        <h3 className="text-lg font-semibold mb-4 text-red-300">🚨 Emergency Manual Override</h3>
        <div className="bg-gray-800 border border-red-500/30 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-300">
            <strong>WARNING:</strong> Manual trades override AI system and execute immediately with real money.
            Only use in emergency situations or when you're 100% confident in the trade.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {['BTCUSD', 'ETHUSD', 'ADAUSD', 'SOLUSD', 'LINKUSD'].map(symbol => (
            <div key={symbol} className="flex flex-col gap-2">
              <span className="text-center font-semibold">{symbol}</span>
              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => placeOrder(symbol, 1, 'buy')}
              >
                Buy 1
              </Button>
              <Button 
                size="sm" 
                className="bg-red-600 hover:bg-red-700"
                onClick={() => placeOrder(symbol, 1, 'sell')}
              >
                Sell 1
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}