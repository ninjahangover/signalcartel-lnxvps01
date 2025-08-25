'use client';

import { useState, useEffect } from 'react';
import { 
  Brain, 
  Zap, 
  Target, 
  TrendingUp, 
  Activity,
  Eye,
  Clock,
  BarChart3,
  Sparkles,
  Waves,
  Timer,
  Calculator
} from 'lucide-react';

interface IntuitionData {
  overview: {
    totalAnalyses: number;
    intuitionRecommended: number;
    calculationRecommended: number;
    intuitionRate: number;
    avgIntuitionScore: number;
    avgExpectancyScore: number;
    avgPerformanceGap: number;
    avgFlowField: number;
    avgPatternResonance: number;
    avgTemporalIntuition: number;
  };
  strategyBreakdown: Array<{
    strategy: string;
    totalAnalyses: number;
    intuitionRecommended: number;
    avgIntuitionScore: number;
    avgExpectancyScore: number;
    avgPerformanceGap: number;
    intuitionRate: number;
  }>;
  hourlyTrends: Array<{
    hour: string;
    avgIntuition: number;
    avgExpectancy: number;
    analysisCount: number;
    intuitionRecommended: number;
  }>;
  recentAnalyses: Array<{
    id: string;
    timestamp: string;
    symbol: string;
    strategy: string;
    signalType: string;
    flowFieldResonance: number;
    patternResonance: number;
    temporalIntuition: number;
    overallIntuition: number;
    expectancyScore: number;
    winRateProjection: number;
    riskRewardRatio: number;
    recommendation: string;
    performanceGap: number;
    confidenceGap: number;
  }>;
  timeframe: string;
}

export default function MathematicalIntuitionDashboard() {
  const [intuitionData, setIntuitionData] = useState<IntuitionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24');

  const fetchIntuitionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/intuition-analysis?hours=${selectedTimeframe}`);
      const data = await response.json();
      
      if (data.success) {
        setIntuitionData(data.data);
      } else {
        setError(data.error || 'Failed to fetch intuition data');
      }
    } catch (err) {
      setError('Network error fetching intuition data');
      console.error('Error fetching intuition data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntuitionData();
    const interval = setInterval(fetchIntuitionData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [selectedTimeframe]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-3">
              <Brain className="w-8 h-8 text-purple-400 animate-pulse" />
              <span className="text-xl text-gray-300">Loading Mathematical Intuition...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !intuitionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Brain className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 text-lg">{error || 'Failed to load intuition data'}</p>
              <button 
                onClick={fetchIntuitionData}
                className="mt-4 px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-lg text-purple-300 hover:bg-purple-600/30"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { overview, strategyBreakdown, hourlyTrends, recentAnalyses } = intuitionData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30">
              <Brain className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                MATHEMATICAL INTUITION ENGINE™
              </h1>
              <p className="text-gray-400">Revolutionary trading intelligence beyond calculation</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <select 
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-4 py-2 bg-gray-900/50 border border-gray-700/50 rounded-lg text-gray-300 focus:ring-2 focus:ring-purple-500/50"
            >
              <option value="1">Last Hour</option>
              <option value="6">Last 6 Hours</option>
              <option value="24">Last 24 Hours</option>
              <option value="72">Last 3 Days</option>
              <option value="168">Last Week</option>
            </select>
            <button 
              onClick={fetchIntuitionData}
              className="px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-lg text-purple-300 hover:bg-purple-600/30 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Total Analyses */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Analyses</p>
                <p className="text-2xl font-bold text-white">{overview.totalAnalyses.toLocaleString()}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          {/* Intuition Rate */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Intuition Rate</p>
                <p className="text-2xl font-bold text-purple-400">{overview.intuitionRate.toFixed(1)}%</p>
              </div>
              <Brain className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          {/* Performance Gap */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Performance Gap</p>
                <p className={`text-2xl font-bold ${overview.avgPerformanceGap > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {overview.avgPerformanceGap > 0 ? '+' : ''}{(overview.avgPerformanceGap * 100).toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </div>

          {/* Intuition Score */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg Intuition Score</p>
                <p className="text-2xl font-bold text-cyan-400">{(overview.avgIntuitionScore * 100).toFixed(1)}%</p>
              </div>
              <Sparkles className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
        </div>

        {/* Intuition Components */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
            <Eye className="w-5 h-5 mr-2 text-purple-400" />
            Intuition Components Analysis
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Flow Field Resonance */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 flex items-center">
                  <Waves className="w-4 h-4 mr-2 text-blue-400" />
                  Flow Field Resonance
                </span>
                <span className="text-blue-400 font-mono">{(overview.avgFlowField * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${overview.avgFlowField * 100}%` }}
                />
              </div>
            </div>

            {/* Pattern Resonance */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 flex items-center">
                  <Target className="w-4 h-4 mr-2 text-green-400" />
                  Pattern Resonance
                </span>
                <span className="text-green-400 font-mono">{(overview.avgPatternResonance * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-600 to-green-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${overview.avgPatternResonance * 100}%` }}
                />
              </div>
            </div>

            {/* Temporal Intuition */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 flex items-center">
                  <Timer className="w-4 h-4 mr-2 text-purple-400" />
                  Temporal Intuition
                </span>
                <span className="text-purple-400 font-mono">{(overview.avgTemporalIntuition * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-purple-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${overview.avgTemporalIntuition * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Intuition vs Calculation Comparison */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-400" />
            Intuition vs Calculation Performance
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Intuition Side */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-purple-400 mb-2">🧠 Mathematical Intuition</h3>
                <div className="text-3xl font-bold text-purple-400">
                  {(overview.avgIntuitionScore * 100).toFixed(1)}%
                </div>
                <p className="text-gray-400 text-sm">Average Intuition Score</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Recommended</span>
                  <span className="text-purple-400">{overview.intuitionRecommended} times</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Selection Rate</span>
                  <span className="text-purple-400">{overview.intuitionRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Calculation Side */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-blue-400 mb-2">📊 Traditional Calculation</h3>
                <div className="text-3xl font-bold text-blue-400">
                  {(overview.avgExpectancyScore * 100).toFixed(1)}%
                </div>
                <p className="text-gray-400 text-sm">Average Expectancy Score</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Recommended</span>
                  <span className="text-blue-400">{overview.calculationRecommended} times</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Selection Rate</span>
                  <span className="text-blue-400">{(100 - overview.intuitionRate).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Strategy Breakdown */}
        {strategyBreakdown.length > 0 && (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-green-400" />
              Strategy Performance Breakdown
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700/50">
                    <th className="text-left py-3 text-gray-300">Strategy</th>
                    <th className="text-center py-3 text-gray-300">Analyses</th>
                    <th className="text-center py-3 text-gray-300">Intuition Rate</th>
                    <th className="text-center py-3 text-gray-300">Avg Intuition</th>
                    <th className="text-center py-3 text-gray-300">Avg Expectancy</th>
                    <th className="text-center py-3 text-gray-300">Performance Gap</th>
                  </tr>
                </thead>
                <tbody>
                  {strategyBreakdown.map((strategy, index) => (
                    <tr key={index} className="border-b border-gray-800/50">
                      <td className="py-3 text-white font-medium">{strategy.strategy}</td>
                      <td className="py-3 text-center text-gray-300">{strategy.totalAnalyses}</td>
                      <td className="py-3 text-center text-purple-400">{strategy.intuitionRate.toFixed(1)}%</td>
                      <td className="py-3 text-center text-cyan-400">{(strategy.avgIntuitionScore * 100).toFixed(1)}%</td>
                      <td className="py-3 text-center text-blue-400">{(strategy.avgExpectancyScore * 100).toFixed(1)}%</td>
                      <td className={`py-3 text-center font-medium ${strategy.avgPerformanceGap > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {strategy.avgPerformanceGap > 0 ? '+' : ''}{(strategy.avgPerformanceGap * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Analyses */}
        {recentAnalyses.length > 0 && (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-cyan-400" />
              Recent Intuition Analyses
            </h2>
            
            <div className="space-y-4">
              {recentAnalyses.slice(0, 10).map((analysis, index) => (
                <div key={analysis.id} className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-white font-medium">{analysis.symbol}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-400">{analysis.strategy}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        analysis.signalType === 'BUY' ? 'bg-green-600/20 text-green-400' :
                        analysis.signalType === 'SELL' ? 'bg-red-600/20 text-red-400' :
                        'bg-yellow-600/20 text-yellow-400'
                      }`}>
                        {analysis.signalType}
                      </span>
                    </div>
                    <div className="text-gray-400 text-sm">
                      {new Date(analysis.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Flow Field:</span>
                      <span className="ml-2 text-blue-400">{(analysis.flowFieldResonance * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Pattern:</span>
                      <span className="ml-2 text-green-400">{(analysis.patternResonance * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Temporal:</span>
                      <span className="ml-2 text-purple-400">{(analysis.temporalIntuition * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Overall:</span>
                      <span className="ml-2 text-cyan-400 font-medium">{(analysis.overallIntuition * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700/30">
                    <div className="text-sm">
                      <span className="text-gray-400">Recommendation:</span>
                      <span className={`ml-2 font-medium ${
                        analysis.recommendation === 'intuition' ? 'text-purple-400' : 'text-blue-400'
                      }`}>
                        {analysis.recommendation === 'intuition' ? '🧠 Intuition' : '📊 Calculation'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-400">Gap:</span>
                      <span className={`ml-2 font-medium ${analysis.performanceGap > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {analysis.performanceGap > 0 ? '+' : ''}{(analysis.performanceGap * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}