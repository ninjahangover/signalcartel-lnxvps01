'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface SentimentSignal {
  id: string;
  timestamp: string;
  strategy: string;
  symbol: string;
  originalAction: string;
  finalAction: string;
  originalConfidence: number;
  enhancedConfidence: number;
  sentimentScore: number;
  sentimentConflict: boolean;
  wasExecuted: boolean;
  reason: string;
}

interface StrategyBreakdown {
  strategy: string;
  totalSignals: number;
  executedSignals: number;
  sentimentBoosts: number;
  sentimentConflicts: number;
  avgSentimentScore: number;
  avgConfidenceBoost: number;
  executionRate: number;
  boostRate: number;
  conflictRate: number;
  netBenefit: number;
}

interface SentimentOverview {
  totalSignals: number;
  executedSignals: number;
  executionRate: number;
  sentimentBoosts: number;
  sentimentConflicts: number;
  boostRate: number;
  conflictRate: number;
  netBenefit: number;
  avgSentimentScore: number;
  avgConfidenceChange: number;
}

interface SentimentTrend {
  hour: string;
  avgSentiment: number;
  signalCount: number;
  executedCount: number;
}

interface SentimentData {
  overview: SentimentOverview;
  strategyBreakdown: StrategyBreakdown[];
  recentSignals: SentimentSignal[];
  sentimentTrends: SentimentTrend[];
  timeframe: string;
}

const SentimentAnalysisDashboard: React.FC = () => {
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('24');
  const [selectedStrategy, setSelectedStrategy] = useState('all');

  const fetchSentimentData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sentiment-analysis?hours=${timeframe}&strategy=${selectedStrategy}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch sentiment analysis data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentimentData();
    const interval = setInterval(fetchSentimentData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [timeframe, selectedStrategy]);

  const getSentimentColor = (score: number): string => {
    if (score > 0.6) return '#10B981'; // Green - Bullish
    if (score > 0.4) return '#F59E0B'; // Yellow - Neutral
    return '#EF4444'; // Red - Bearish
  };

  const getConfidenceColor = (change: number): string => {
    if (change > 0) return '#10B981';
    if (change < 0) return '#EF4444';
    return '#6B7280';
  };

  if (loading && !data) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="h-32 bg-gray-700 rounded mb-4"></div>
          <div className="h-48 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="text-red-400">
          <h3 className="text-lg font-semibold mb-2">Error Loading Sentiment Data</h3>
          <p>{error}</p>
          <button 
            onClick={fetchSentimentData}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const pieData = [
    { name: 'Executed', value: data.overview.executedSignals, color: '#10B981' },
    { name: 'Skipped', value: data.overview.totalSignals - data.overview.executedSignals, color: '#6B7280' }
  ];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Timeframe</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white"
            >
              <option value="1">Last Hour</option>
              <option value="6">Last 6 Hours</option>
              <option value="24">Last 24 Hours</option>
              <option value="72">Last 3 Days</option>
              <option value="168">Last Week</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Strategy Filter</label>
            <select
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white"
            >
              <option value="all">All Strategies</option>
              {data.strategyBreakdown.map(strategy => (
                <option key={strategy.strategy} value={strategy.strategy}>
                  {strategy.strategy}
                </option>
              ))}
            </select>
          </div>
          
          <div className="ml-auto">
            <div className="text-sm text-gray-400">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Total Signals</div>
          <div className="text-2xl font-bold text-white">{data.overview.totalSignals}</div>
          <div className="text-xs text-gray-500">Last {data.timeframe}</div>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Execution Rate</div>
          <div className="text-2xl font-bold text-white">{data.overview.executionRate.toFixed(1)}%</div>
          <div className="text-xs text-gray-500">{data.overview.executedSignals} executed</div>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Sentiment Impact</div>
          <div className={`text-2xl font-bold ${data.overview.netBenefit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {data.overview.netBenefit >= 0 ? '+' : ''}{data.overview.netBenefit.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">
            {data.overview.sentimentBoosts} boosts, {data.overview.sentimentConflicts} conflicts
          </div>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Avg Sentiment</div>
          <div className={`text-2xl font-bold`} style={{ color: getSentimentColor(data.overview.avgSentimentScore) }}>
            {data.overview.avgSentimentScore.toFixed(3)}
          </div>
          <div className="text-xs text-gray-500">
            {data.overview.avgSentimentScore > 0.5 ? 'Bullish' : data.overview.avgSentimentScore < -0.5 ? 'Bearish' : 'Neutral'}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Trend Chart */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">🔮 Sentiment Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.sentimentTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="hour" 
                stroke="#9CA3AF"
                tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              />
              <YAxis stroke="#9CA3AF" domain={[-1, 1]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: any) => [value.toFixed(3), 'Sentiment']}
              />
              <Line type="monotone" dataKey="avgSentiment" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Signal Execution Pie Chart */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">📊 Signal Execution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Strategy Performance Table */}
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🏆 Per-Strategy Sentiment Impact</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 text-gray-400">Strategy</th>
                <th className="text-right py-2 text-gray-400">Signals</th>
                <th className="text-right py-2 text-gray-400">Execution Rate</th>
                <th className="text-right py-2 text-gray-400">Sentiment Boost</th>
                <th className="text-right py-2 text-gray-400">Conflicts</th>
                <th className="text-right py-2 text-gray-400">Net Benefit</th>
                <th className="text-right py-2 text-gray-400">Avg Sentiment</th>
              </tr>
            </thead>
            <tbody>
              {data.strategyBreakdown.map((strategy) => (
                <tr key={strategy.strategy} className="border-b border-gray-800">
                  <td className="py-2 text-white font-medium">{strategy.strategy}</td>
                  <td className="py-2 text-right text-white">{strategy.totalSignals}</td>
                  <td className="py-2 text-right text-white">{strategy.executionRate.toFixed(1)}%</td>
                  <td className="py-2 text-right text-green-400">{strategy.boostRate.toFixed(1)}%</td>
                  <td className="py-2 text-right text-red-400">{strategy.conflictRate.toFixed(1)}%</td>
                  <td className={`py-2 text-right font-semibold ${strategy.netBenefit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {strategy.netBenefit >= 0 ? '+' : ''}{strategy.netBenefit.toFixed(1)}%
                  </td>
                  <td className="py-2 text-right" style={{ color: getSentimentColor(strategy.avgSentimentScore) }}>
                    {strategy.avgSentimentScore.toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Signals Timeline */}
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🕐 Recent Sentiment-Enhanced Signals</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {data.recentSignals.map((signal) => (
            <div key={signal.id} className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${signal.wasExecuted ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <div>
                    <div className="text-white font-medium">{signal.strategy}</div>
                    <div className="text-sm text-gray-400">{new Date(signal.timestamp).toLocaleString()}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white">
                    {signal.originalAction} → {signal.finalAction}
                    {signal.sentimentConflict && <span className="ml-2 text-orange-400">⚠️</span>}
                  </div>
                  <div className="text-sm text-gray-400">
                    {(signal.originalConfidence * 100).toFixed(1)}% → {(signal.enhancedConfidence * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-sm text-gray-300">{signal.reason}</div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Sentiment:</span>
                  <span 
                    className="text-xs font-medium"
                    style={{ color: getSentimentColor(signal.sentimentScore) }}
                  >
                    {signal.sentimentScore.toFixed(3)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SentimentAnalysisDashboard;