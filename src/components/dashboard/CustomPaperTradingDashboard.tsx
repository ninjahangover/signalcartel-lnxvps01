"use client";

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  DollarSign,
  BarChart3,
  Brain,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  Play,
  Square,
  Zap
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface CustomPaperTradeData {
  id: string;
  sessionId: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  value: number;
  pnl?: number;
  pnlPercent?: number;
  isEntry: boolean;
  strategy: string;
  confidence: number;
  executedAt: string;
}

interface TradingSessionData {
  id: string;
  sessionName: string;
  strategy: string;
  startingBalance: number;
  endingBalance?: number;
  totalTrades: number;
  winningTrades: number;
  winRate: number;
  totalPnL: number;
  isActive: boolean;
  sessionStart: string;
  sessionEnd?: string;
}

interface TradingSignalData {
  id: string;
  symbol: string;
  strategy: string;
  signalType: string;
  currentPrice: number;
  confidence: number;
  volume: number;
  indicators: any;
  createdAt: string;
}

export default function CustomPaperTradingDashboard() {
  const [trades, setTrades] = useState<CustomPaperTradeData[]>([]);
  const [sessions, setSessions] = useState<TradingSessionData[]>([]);
  const [signals, setSignals] = useState<TradingSignalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch custom paper trading data from database
  const fetchCustomTradingData = async () => {
    try {
      const response = await fetch('/api/custom-paper-trading/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch custom trading data');
      }
      
      const data = await response.json();
      
      setTrades(data.trades || []);
      setSessions(data.sessions || []);
      setSignals(data.signals || []);
      setLastUpdate(new Date());
      setLoading(false);
      setError(null);
      
    } catch (err) {
      console.error('Failed to fetch custom trading data:', err);
      setError('Failed to load trading data. Please check if custom paper trading engine is running.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomTradingData();
    
    // Auto-refresh every 10 seconds if enabled
    const interval = autoRefresh ? setInterval(fetchCustomTradingData, 10000) : null;
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Calculate overall statistics
  const stats = React.useMemo(() => {
    const totalTrades = trades.length;
    const completedTrades = trades.filter(t => t.pnl !== undefined && t.pnl !== null);
    const winningTrades = completedTrades.filter(t => t.pnl! > 0).length;
    const winRate = completedTrades.length > 0 ? (winningTrades / completedTrades.length) * 100 : 0;
    const totalPnL = completedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalVolume = trades.reduce((sum, t) => sum + t.value, 0);
    const avgTradeSize = totalTrades > 0 ? totalVolume / totalTrades : 0;
    
    // Get active sessions
    const activeSessions = sessions.filter(s => s.isActive);
    const totalSessionPnL = sessions.reduce((sum, s) => sum + s.totalPnL, 0);
    
    return {
      totalTrades,
      completedTrades: completedTrades.length,
      winningTrades,
      winRate,
      totalPnL,
      totalVolume,
      avgTradeSize,
      activeSessions: activeSessions.length,
      totalSessionPnL,
      recentSignals: signals.length
    };
  }, [trades, sessions, signals]);

  // Get recent trades for display
  const recentTrades = trades.slice(0, 10);
  const recentSignals = signals.slice(0, 5);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-600"></div>
          <span className="ml-4 text-gray-600">Loading custom paper trading data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-8">
        <div className="flex items-center justify-center text-red-600">
          <AlertCircle className="w-8 h-8 mr-4" />
          <div>
            <h3 className="font-semibold">Error Loading Data</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-gold-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Custom Paper Trading Dashboard</h2>
              <p className="text-gray-600">Real-time LLN & Markov Data Generation</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live</span>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-gold-600 focus:ring-gold-500"
              />
              <span className="text-sm text-gray-600">Auto-refresh</span>
            </label>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* LLN & Markov Status */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className={`p-4 rounded-lg border-2 ${
            stats.totalTrades >= 50 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center gap-3">
              <Brain className={`w-6 h-6 ${stats.totalTrades >= 50 ? 'text-green-600' : 'text-yellow-600'}`} />
              <div>
                <h4 className={`font-semibold ${stats.totalTrades >= 50 ? 'text-green-800' : 'text-yellow-800'}`}>
                  Law of Large Numbers
                </h4>
                <p className={`text-sm ${stats.totalTrades >= 50 ? 'text-green-700' : 'text-yellow-700'}`}>
                  {stats.totalTrades >= 50 ? '✅ ACTIVE' : `${50 - stats.totalTrades} trades needed`}
                </p>
              </div>
            </div>
          </div>
          <div className={`p-4 rounded-lg border-2 ${
            stats.totalTrades >= 10 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center gap-3">
              <Target className={`w-6 h-6 ${stats.totalTrades >= 10 ? 'text-green-600' : 'text-yellow-600'}`} />
              <div>
                <h4 className={`font-semibold ${stats.totalTrades >= 10 ? 'text-green-800' : 'text-yellow-800'}`}>
                  Markov Chain Analysis
                </h4>
                <p className={`text-sm ${stats.totalTrades >= 10 ? 'text-green-700' : 'text-yellow-700'}`}>
                  {stats.totalTrades >= 10 ? '✅ READY' : `${10 - stats.totalTrades} trades needed`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Trades</p>
                <p className="text-2xl font-bold text-blue-700">{stats.totalTrades}</p>
                <p className="text-xs text-blue-600">{stats.completedTrades} completed</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Win Rate</p>
                <p className="text-2xl font-bold text-green-700">{stats.winRate.toFixed(1)}%</p>
                <p className="text-xs text-green-600">{stats.winningTrades} wins</p>
              </div>
              <Target className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Total P&L</p>
                <p className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  ${stats.totalPnL.toFixed(2)}
                </p>
                <p className="text-xs text-purple-600">Session P&L: ${stats.totalSessionPnL.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600 opacity-50" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gold-50 to-gold-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gold-600 text-sm font-medium">Total Volume</p>
                <p className="text-2xl font-bold text-gold-700">${(stats.totalVolume / 1000).toFixed(1)}K</p>
                <p className="text-xs text-gold-600">Avg: ${stats.avgTradeSize.toFixed(0)}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-gold-600 opacity-50" />
            </div>
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      {sessions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Play className="w-6 h-6 text-gold-600" />
            <h3 className="text-xl font-bold text-gray-900">Active Trading Sessions</h3>
          </div>
          
          <div className="space-y-3">
            {sessions.filter(s => s.isActive).map((session) => (
              <div key={session.id} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-green-800">{session.sessionName}</h4>
                    <p className="text-sm text-green-700">
                      Strategy: {session.strategy} • Started: {new Date(session.sessionStart).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-700">{session.totalTrades}</div>
                      <div className="text-xs text-green-600">Trades</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-700">{session.winRate.toFixed(1)}%</div>
                      <div className="text-xs text-green-600">Win Rate</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-bold ${session.totalPnL >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        ${session.totalPnL.toFixed(2)}
                      </div>
                      <div className="text-xs text-green-600">P&L</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Trades */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-6 h-6 text-gold-600" />
          <h3 className="text-xl font-bold text-gray-900">Recent Trades</h3>
          <Badge variant="secondary">{recentTrades.length} trades</Badge>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2">Time</th>
                <th className="text-left py-2">Symbol</th>
                <th className="text-left py-2">Side</th>
                <th className="text-right py-2">Quantity</th>
                <th className="text-right py-2">Price</th>
                <th className="text-right py-2">Value</th>
                <th className="text-right py-2">P&L</th>
                <th className="text-center py-2">Type</th>
              </tr>
            </thead>
            <tbody>
              {recentTrades.map((trade) => (
                <tr key={trade.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2">{new Date(trade.executedAt).toLocaleTimeString()}</td>
                  <td className="py-2 font-medium">{trade.symbol}</td>
                  <td className="py-2">
                    <Badge variant={trade.side === 'buy' ? 'default' : 'destructive'}>
                      {trade.side.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-2 text-right">{trade.quantity.toFixed(6)}</td>
                  <td className="py-2 text-right">${trade.price.toFixed(2)}</td>
                  <td className="py-2 text-right">${trade.value.toFixed(2)}</td>
                  <td className={`py-2 text-right font-medium ${
                    trade.pnl === undefined ? 'text-gray-400' :
                    trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {trade.pnl === undefined ? 'Open' : 
                     trade.pnl >= 0 ? `+$${trade.pnl.toFixed(2)}` : `-$${Math.abs(trade.pnl).toFixed(2)}`}
                  </td>
                  <td className="py-2 text-center">
                    <Badge variant={trade.isEntry ? 'outline' : 'secondary'}>
                      {trade.isEntry ? 'Entry' : 'Exit'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Signals */}
      {recentSignals.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-6 h-6 text-gold-600" />
            <h3 className="text-xl font-bold text-gray-900">Recent Trading Signals</h3>
            <Badge variant="secondary">{recentSignals.length} signals</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentSignals.map((signal) => (
              <div key={signal.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{signal.symbol}</span>
                  <Badge variant={signal.signalType === 'BUY' ? 'default' : 'destructive'}>
                    {signal.signalType}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Price: ${signal.currentPrice.toFixed(2)}</p>
                  <p>Confidence: {(signal.confidence * 100).toFixed(0)}%</p>
                  <p>Volume: ${signal.volume.toFixed(0)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(signal.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex gap-4">
          <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900">🚀 Custom Paper Trading Engine Status</h3>
            <p className="text-blue-700 text-sm mt-1">
              This dashboard shows real trades from your custom paper trading engine. All data is stored in the database and updates every 10 seconds.
            </p>
            <div className="flex gap-4 text-sm text-blue-600 mt-2">
              <span>• Database-driven: Direct integration</span>
              <span>• Real market data: Kraken API</span>
              <span>• No API restrictions: Any trade size</span>
              <span>• LLN & Markov ready: {stats.totalTrades >= 50 ? 'Active' : 'Collecting data'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}