'use client';

import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar 
} from 'recharts';
import { 
  Brain, Activity, Zap, TrendingUp, TrendingDown, 
  Users, Coins, Smartphone, Newspaper, Globe, 
  AlertTriangle, CheckCircle, Clock, Target,
  Cpu, Database, Layers, Eye, DollarSign, Settings, BarChart3
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import SystemIntelligenceShowcase from './SystemIntelligenceShowcase';
import QuantumBrainFlow from './QuantumBrainFlow';
import OrderBookIntelligenceDashboard from './OrderBookIntelligenceDashboard';

interface QuantumSentimentData {
  symbol: string;
  overallScore: number;
  overallConfidence: number;
  sentiment: 'EXTREME_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'EXTREME_BEARISH';
  sources: {
    twitter: { score: number; confidence: number; volume: number };
    reddit: { score: number; confidence: number; volume: number; trending: boolean };
    onChain: { score: number; confidence: number; whaleTransfers: number };
    news?: { score: number; confidence: number; headlines: string[] };
    economic?: { score: number; confidence: number; indicators: any };
  };
  criticalEvents: Array<{
    type: string;
    severity: string;
    description: string;
    impact: number;
  }>;
  whaleAlerts: Array<{
    amount: number;
    type: string;
    timestamp: string;
  }>;
  marketContext: {
    trend: string;
    volatility: string;
    volume: string;
  };
  tradingSignal: {
    action: string;
    confidence: number;
    reason: string;
    riskLevel: string;
  };
  processingMetrics: {
    totalTimeMs: number;
    gpuTimeMs: number;
    sourcesProcessed: number;
    tokensAnalyzed: number;
  };
  timestamp: string;
}

interface SentimentHistory {
  timestamp: string;
  overallScore: number;
  twitterScore: number;
  redditScore: number;
  onChainScore: number;
  confidence: number;
  tradingAction: string;
}

interface SentimentStats {
  totalAnalyses: number;
  avgConfidence: number;
  avgProcessingTime: number;
  sourcesActive: number;
  gpuAcceleration: boolean;
  recentAlerts: number;
  accuracyRate: number;
}

const QuantumForgeSentimentDashboard: React.FC = () => {
  const [currentSentiment, setCurrentSentiment] = useState<QuantumSentimentData | null>(null);
  const [sentimentHistory, setSentimentHistory] = useState<SentimentHistory[]>([]);
  const [sentimentStats, setSentimentStats] = useState<SentimentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [activeTab, setActiveTab] = useState('live');

  const fetchQuantumSentiment = async () => {
    try {
      setRefreshing(true);
      const [currentResponse, historyResponse, statsResponse] = await Promise.all([
        fetch('/api/quantum-forge-sentiment/current?symbol=' + selectedSymbol),
        fetch('/api/quantum-forge-sentiment/history?symbol=' + selectedSymbol + '&hours=24'),
        fetch('/api/quantum-forge-sentiment/stats')
      ]);

      if (currentResponse.ok) {
        const currentData = await currentResponse.json();
        setCurrentSentiment(currentData.data);
      }

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setSentimentHistory(historyData.data);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setSentimentStats(statsData.data);
      }

      setError(null);
    } catch (err) {
      console.error('Sentiment fetch error:', err);
      setError('Failed to fetch sentiment data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQuantumSentiment();
    const interval = setInterval(fetchQuantumSentiment, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const getSentimentColor = (sentiment: string | number): string => {
    if (typeof sentiment === 'string') {
      switch (sentiment) {
        case 'EXTREME_BULLISH': return '#10B981';
        case 'BULLISH': return '#22C55E';
        case 'NEUTRAL': return '#F59E0B';
        case 'BEARISH': return '#EF4444';
        case 'EXTREME_BEARISH': return '#DC2626';
        default: return '#6B7280';
      }
    } else {
      if (sentiment > 0.3) return '#10B981';
      if (sentiment > 0.1) return '#22C55E';
      if (sentiment > -0.1) return '#F59E0B';
      if (sentiment > -0.3) return '#EF4444';
      return '#DC2626';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'EXTREME_BULLISH':
        return <TrendingUp className="w-6 h-6 text-green-400" />;
      case 'BULLISH':
        return <TrendingUp className="w-6 h-6 text-green-500" />;
      case 'NEUTRAL':
        return <Activity className="w-6 h-6 text-yellow-400" />;
      case 'BEARISH':
        return <TrendingDown className="w-6 h-6 text-red-500" />;
      case 'EXTREME_BEARISH':
        return <TrendingDown className="w-6 h-6 text-red-400" />;
      default:
        return <Activity className="w-6 h-6 text-gray-400" />;
    }
  };

  const getActionColor = (action: string): string => {
    if (action.includes('BUY')) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (action.includes('SELL')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (action === 'HOLD') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Loading QUANTUM FORGE™ Sentiment Intelligence...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Brain className="w-8 h-8 text-purple-400" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  QUANTUM FORGE™ Sentiment Intelligence
                </h1>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Zap className="w-4 h-4 mr-1" />
                GPU Accelerated
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="bg-gray-800 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
                <option value="SOL">Solana (SOL)</option>
              </select>
              
              <Button
                onClick={fetchQuantumSentiment}
                disabled={refreshing}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {refreshing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Activity className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </div>

          {/* Real-time Status */}
          {currentSentiment && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Live Analysis Active</span>
                </div>
                <span>Last Updated: {new Date(currentSentiment.timestamp).toLocaleString()}</span>
                <span>Processing Time: {currentSentiment.processingMetrics.totalTimeMs}ms</span>
                <span>GPU Acceleration: {currentSentiment.processingMetrics.gpuTimeMs > 0 ? '✅' : '❌'}</span>
              </div>
              
              {/* Technical Specs Teaser */}
              <div className="hidden lg:flex items-center space-x-4 text-xs">
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  47 Data Sources
                </Badge>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                  2.8K Keywords
                </Badge>
                <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30">
                  Neural ML
                </Badge>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  13K+ Signals
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-6 bg-red-900/20 border-red-500/30">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-8 w-full bg-gray-800 border border-purple-500/30">
            <TabsTrigger value="live" className="data-[state=active]:bg-purple-600">
              <Eye className="w-4 h-4 mr-2" />
              Live Analysis
            </TabsTrigger>
            <TabsTrigger value="sources" className="data-[state=active]:bg-purple-600">
              <Layers className="w-4 h-4 mr-2" />
              Multi-Source
            </TabsTrigger>
            <TabsTrigger value="intelligence" className="data-[state=active]:bg-purple-600">
              <Settings className="w-4 h-4 mr-2" />
              System Intelligence
            </TabsTrigger>
            <TabsTrigger value="flow" className="data-[state=active]:bg-purple-600">
              <Brain className="w-4 h-4 mr-2" />
              Decision Flow
            </TabsTrigger>
            <TabsTrigger value="signals" className="data-[state=active]:bg-purple-600">
              <Target className="w-4 h-4 mr-2" />
              Trading Signals
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-purple-600">
              <Cpu className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="orderbook" className="data-[state=active]:bg-purple-600">
              <BarChart3 className="w-4 h-4 mr-2" />
              Order Book
            </TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-purple-600">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Critical Events
            </TabsTrigger>
          </TabsList>

          {/* Live Analysis Tab */}
          <TabsContent value="live" className="mt-6">
            {currentSentiment ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                {/* Overall Sentiment */}
                <Card className="bg-gray-900 border-purple-500/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2 text-lg">
                      {getSentimentIcon(currentSentiment.sentiment)}
                      <span>Overall Sentiment</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="text-3xl font-bold" style={{ color: getSentimentColor(currentSentiment.sentiment) }}>
                          {currentSentiment.sentiment}
                        </div>
                        <div className="text-xl text-gray-400">
                          {(currentSentiment.overallScore * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full transition-all duration-500"
                          style={{ 
                            width: `${Math.abs(currentSentiment.overallScore) * 100}%`,
                            backgroundColor: getSentimentColor(currentSentiment.sentiment)
                          }}
                        />
                      </div>
                      <div className="text-center">
                        <span className="text-sm text-gray-400">
                          Confidence: {(currentSentiment.overallConfidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Trading Signal */}
                <Card className="bg-gray-900 border-purple-500/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2 text-lg">
                      <Target className="w-5 h-5 text-purple-400" />
                      <span>Trading Signal</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Badge className={`w-full justify-center py-2 text-lg font-bold ${getActionColor(currentSentiment.tradingSignal.action)}`}>
                        {currentSentiment.tradingSignal.action}
                      </Badge>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-300">
                          {(currentSentiment.tradingSignal.confidence * 100).toFixed(1)}% Confidence
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          Risk: {currentSentiment.tradingSignal.riskLevel}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 text-center">
                        {currentSentiment.tradingSignal.reason}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Market Context */}
                <Card className="bg-gray-900 border-purple-500/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2 text-lg">
                      <Globe className="w-5 h-5 text-cyan-400" />
                      <span>Market Context</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Trend:</span>
                        <span className="text-white font-medium">{currentSentiment.marketContext.trend}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Volatility:</span>
                        <span className="text-white font-medium">{currentSentiment.marketContext.volatility}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Volume:</span>
                        <span className="text-white font-medium">{currentSentiment.marketContext.volume}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Processing Metrics */}
                <Card className="bg-gray-900 border-purple-500/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2 text-lg">
                      <Cpu className="w-5 h-5 text-pink-400" />
                      <span>GPU Metrics</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Time:</span>
                        <span className="text-green-400 font-medium">{currentSentiment.processingMetrics.totalTimeMs}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">GPU Time:</span>
                        <span className="text-purple-400 font-medium">{currentSentiment.processingMetrics.gpuTimeMs}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Sources:</span>
                        <span className="text-cyan-400 font-medium">{currentSentiment.processingMetrics.sourcesProcessed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Tokens:</span>
                        <span className="text-pink-400 font-medium">{currentSentiment.processingMetrics.tokensAnalyzed}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-gray-900 border-purple-500/30">
                <CardContent className="p-12 text-center">
                  <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No current sentiment data available</p>
                  <p className="text-gray-500 text-sm mt-2">Click refresh to analyze sentiment for {selectedSymbol}</p>
                </CardContent>
              </Card>
            )}

            {/* Sentiment History Chart */}
            {sentimentHistory.length > 0 && (
              <Card className="bg-gray-900 border-purple-500/30 mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-purple-400" />
                    <span>24-Hour Sentiment Trends</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={sentimentHistory}>
                      <defs>
                        <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="timestamp" 
                        stroke="#9CA3AF" 
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      />
                      <YAxis 
                        stroke="#9CA3AF" 
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        domain={[-1, 1]}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #8B5CF6',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="overallScore" 
                        stroke="#8B5CF6" 
                        fill="url(#sentimentGradient)" 
                        strokeWidth={2}
                        name="Overall Sentiment"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="twitterScore" 
                        stroke="#3B82F6" 
                        strokeWidth={1}
                        dot={false}
                        name="Twitter"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="redditScore" 
                        stroke="#F59E0B" 
                        strokeWidth={1}
                        dot={false}
                        name="Reddit"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="onChainScore" 
                        stroke="#10B981" 
                        strokeWidth={1}
                        dot={false}
                        name="On-Chain"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* System Intelligence Tab */}
          <TabsContent value="intelligence" className="mt-6">
            <SystemIntelligenceShowcase />
          </TabsContent>

          {/* Decision Flow Tab */}
          <TabsContent value="flow" className="mt-6">
            <QuantumBrainFlow />
          </TabsContent>

          {/* Multi-Source Tab */}
          <TabsContent value="sources" className="mt-6">
            {currentSentiment && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Twitter Sentiment */}
                <Card className="bg-gray-900 border-blue-500/30">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Smartphone className="w-5 h-5 text-blue-400" />
                      <span>Twitter / X</span>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        {(currentSentiment.sources.twitter.confidence * 100).toFixed(0)}%
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold" style={{ color: getSentimentColor(currentSentiment.sources.twitter.score) }}>
                          {(currentSentiment.sources.twitter.score * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-400">Sentiment Score</div>
                      </div>
                      <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-blue-400 transition-all duration-500"
                          style={{ width: `${Math.abs(currentSentiment.sources.twitter.score) * 100}%` }}
                        />
                      </div>
                      <div className="text-sm text-gray-400 text-center">
                        Volume: {currentSentiment.sources.twitter.volume} tweets
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Reddit Sentiment */}
                <Card className="bg-gray-900 border-orange-500/30">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-orange-400" />
                      <span>Reddit</span>
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                        {(currentSentiment.sources.reddit.confidence * 100).toFixed(0)}%
                      </Badge>
                      {currentSentiment.sources.reddit.trending && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          🔥 Trending
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold" style={{ color: getSentimentColor(currentSentiment.sources.reddit.score) }}>
                          {(currentSentiment.sources.reddit.score * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-400">Sentiment Score</div>
                      </div>
                      <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-orange-400 transition-all duration-500"
                          style={{ width: `${Math.abs(currentSentiment.sources.reddit.score) * 100}%` }}
                        />
                      </div>
                      <div className="text-sm text-gray-400 text-center">
                        Volume: {currentSentiment.sources.reddit.volume} posts
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* On-Chain Sentiment */}
                <Card className="bg-gray-900 border-green-500/30">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Coins className="w-5 h-5 text-green-400" />
                      <span>On-Chain</span>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        {(currentSentiment.sources.onChain.confidence * 100).toFixed(0)}%
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold" style={{ color: getSentimentColor(currentSentiment.sources.onChain.score) }}>
                          {(currentSentiment.sources.onChain.score * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-400">Sentiment Score</div>
                      </div>
                      <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-green-400 transition-all duration-500"
                          style={{ width: `${Math.abs(currentSentiment.sources.onChain.score) * 100}%` }}
                        />
                      </div>
                      <div className="text-sm text-gray-400 text-center">
                        Whale Transfers: {currentSentiment.sources.onChain.whaleTransfers}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Other tabs can be implemented similarly */}
          <TabsContent value="signals" className="mt-6">
            <Card className="bg-gray-900 border-purple-500/30">
              <CardContent className="p-12 text-center">
                <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Trading Signals Analysis</p>
                <p className="text-gray-500 text-sm mt-2">Historical trading signal performance and recommendations</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="mt-6">
            <Card className="bg-gray-900 border-purple-500/30">
              <CardContent className="p-12 text-center">
                <Cpu className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Performance Analytics</p>
                <p className="text-gray-500 text-sm mt-2">GPU processing performance and optimization metrics</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Order Book Intelligence Tab */}
          <TabsContent value="orderbook" className="mt-6">
            <OrderBookIntelligenceDashboard />
          </TabsContent>

          <TabsContent value="alerts" className="mt-6">
            {currentSentiment && (
              <div className="space-y-6">
                {/* Critical Events */}
                {currentSentiment.criticalEvents.length > 0 ? (
                  <Card className="bg-gray-900 border-red-500/30">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-red-400">
                        <AlertTriangle className="w-5 h-5" />
                        <span>Critical Events</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {currentSentiment.criticalEvents.map((event, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border-l-4 border-red-500">
                            <div>
                              <div className="font-medium text-white">{event.type}</div>
                              <div className="text-sm text-gray-400">{event.description}</div>
                            </div>
                            <div className="text-right">
                              <Badge className={`${event.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                {event.severity}
                              </Badge>
                              <div className="text-sm text-gray-400 mt-1">
                                Impact: {event.impact > 0 ? '+' : ''}{event.impact}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-gray-900 border-green-500/30">
                    <CardContent className="p-6 text-center">
                      <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <p className="text-green-400 text-lg">No Critical Events</p>
                      <p className="text-gray-500 text-sm mt-2">All systems operating normally</p>
                    </CardContent>
                  </Card>
                )}

                {/* Whale Alerts */}
                {currentSentiment.whaleAlerts.length > 0 && (
                  <Card className="bg-gray-900 border-blue-500/30">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-blue-400">
                        <DollarSign className="w-5 h-5" />
                        <span>Whale Alerts</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {currentSentiment.whaleAlerts.map((alert, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                            <div>
                              <div className="font-medium text-white">{alert.type}</div>
                              <div className="text-sm text-gray-400">{new Date(alert.timestamp).toLocaleString()}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-blue-400">
                                ${(alert.amount / 1000000).toFixed(1)}M
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default QuantumForgeSentimentDashboard;