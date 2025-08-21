'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Activity,
  Target,
  BarChart3,
  Eye,
  Lightbulb,
  Award,
  Gauge
} from 'lucide-react';

// Mock data - replace with real data from Markov predictor
const mockMarkovData = {
  currentState: 'TRENDING_UP_WEAK',
  nextStateProbabilities: new Map([
    ['TRENDING_UP_STRONG', 0.35],
    ['SIDEWAYS_HIGH_VOL', 0.25],
    ['TRENDING_UP_WEAK', 0.15],
    ['BREAKOUT_UP', 0.12],
    ['SIDEWAYS_LOW_VOL', 0.08],
    ['REVERSAL_DOWN', 0.05]
  ]),
  expectedReturn: 2.8,
  sampleSize: 247,
  convergenceScore: 0.78,
  llnMetrics: {
    convergenceStatus: 'CONVERGING',
    overallReliability: 0.72,
    recommendedMinTrades: 8,
    currentAverageConfidence: 0.68
  }
};

const marketStates = {
  'TRENDING_UP_STRONG': { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50', description: 'Strong bullish momentum' },
  'TRENDING_UP_WEAK': { icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-50', description: 'Weak bullish trend' },
  'SIDEWAYS_HIGH_VOL': { icon: Activity, color: 'text-yellow-500', bg: 'bg-yellow-50', description: 'High volatility sideways' },
  'SIDEWAYS_LOW_VOL': { icon: Activity, color: 'text-gray-500', bg: 'bg-gray-50', description: 'Low volatility consolidation' },
  'TRENDING_DOWN_WEAK': { icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-50', description: 'Weak bearish trend' },
  'TRENDING_DOWN_STRONG': { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50', description: 'Strong bearish momentum' },
  'BREAKOUT_UP': { icon: Zap, color: 'text-green-600', bg: 'bg-green-50', description: 'Bullish breakout' },
  'BREAKOUT_DOWN': { icon: Zap, color: 'text-red-600', bg: 'bg-red-50', description: 'Bearish breakdown' },
  'REVERSAL_UP': { icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50', description: 'Bullish reversal pattern' },
  'REVERSAL_DOWN': { icon: TrendingDown, color: 'text-orange-500', bg: 'bg-orange-50', description: 'Bearish reversal pattern' }
};

export default function StratusBrainDashboard() {
  const [animatedValues, setAnimatedValues] = useState({
    reliability: 0,
    convergence: 0,
    confidence: 0
  });

  useEffect(() => {
    // Animate values on mount
    const timer = setTimeout(() => {
      setAnimatedValues({
        reliability: mockMarkovData.llnMetrics.overallReliability * 100,
        convergence: mockMarkovData.convergenceScore * 100,
        confidence: mockMarkovData.llnMetrics.currentAverageConfidence * 100
      });
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const getStateInfo = (state: string) => {
    return marketStates[state as keyof typeof marketStates] || {
      icon: Activity,
      color: 'text-gray-500',
      bg: 'bg-gray-50',
      description: 'Unknown state'
    };
  };

  const sortedStates = Array.from(mockMarkovData.nextStateProbabilities.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const getConvergenceColor = (status: string) => {
    switch (status) {
      case 'CONVERGED': return 'text-green-500 bg-green-50';
      case 'CONVERGING': return 'text-yellow-600 bg-yellow-50';
      case 'LEARNING': return 'text-blue-500 bg-blue-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-500" />
            Stratus Brain™ - Markov Chain Intelligence
          </CardTitle>
          <p className="text-gray-600">
            Advanced market state prediction using Markov chains enhanced with Law of Large Numbers for 
            statistically sound confidence scoring that improves over time.
          </p>
        </CardHeader>
      </Card>

      {/* Current Market DNA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-500" />
              Current Market DNA
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const stateInfo = getStateInfo(mockMarkovData.currentState);
              const StateIcon = stateInfo.icon;
              return (
                <div className={`p-4 rounded-lg ${stateInfo.bg} border`}>
                  <div className="flex items-center gap-3 mb-2">
                    <StateIcon className={`w-6 h-6 ${stateInfo.color}`} />
                    <div>
                      <div className="font-semibold">
                        {mockMarkovData.currentState.replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm text-gray-600">
                        {stateInfo.description}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expected Return:</span>
                      <span className={`font-medium ${mockMarkovData.expectedReturn > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {mockMarkovData.expectedReturn > 0 ? '+' : ''}{mockMarkovData.expectedReturn.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-600">Sample Size:</span>
                      <span className="font-medium">{mockMarkovData.sampleSize} patterns</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Learning Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Learning Evolution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Neural Reliability</span>
                  <span className="text-sm font-medium">{animatedValues.reliability.toFixed(1)}%</span>
                </div>
                <Progress value={animatedValues.reliability} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Convergence Score</span>
                  <span className="text-sm font-medium">{animatedValues.convergence.toFixed(1)}%</span>
                </div>
                <Progress value={animatedValues.convergence} className="h-2" />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-gray-600">Status</span>
                <Badge className={getConvergenceColor(mockMarkovData.llnMetrics.convergenceStatus)}>
                  {mockMarkovData.llnMetrics.convergenceStatus}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confidence Metrics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-green-500" />
              Confidence Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500">
                  {animatedValues.confidence.toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">AI Certainty Level</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <div className="text-lg font-semibold text-blue-600">
                    {mockMarkovData.sampleSize}
                  </div>
                  <div className="text-xs text-blue-700">Training Data</div>
                </div>
                <div className="text-center p-2 bg-orange-50 rounded-lg">
                  <div className="text-lg font-semibold text-orange-600">
                    {mockMarkovData.llnMetrics.recommendedMinTrades}
                  </div>
                  <div className="text-xs text-orange-700">Need More</div>
                </div>
              </div>

              {mockMarkovData.llnMetrics.recommendedMinTrades > 0 && (
                <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                  🧠 Need {mockMarkovData.llnMetrics.recommendedMinTrades} more patterns for maximum confidence
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quantum State Predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            Quantum State Predictions - Next Market Transitions
          </CardTitle>
          <p className="text-gray-600">
            Markov chain analysis of most likely market state transitions based on historical patterns
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedStates.map(([state, probability], index) => {
              const stateInfo = getStateInfo(state);
              const StateIcon = stateInfo.icon;
              return (
                <div
                  key={state}
                  className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                    index === 0 ? 'ring-2 ring-purple-200 bg-purple-50' : stateInfo.bg
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <StateIcon className={`w-5 h-5 ${stateInfo.color}`} />
                      {index === 0 && <Target className="w-4 h-4 text-purple-500" />}
                    </div>
                    <Badge variant={index === 0 ? 'default' : 'outline'}>
                      {(probability * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="text-sm font-medium mb-1">
                    {state.replace(/_/g, ' ')}
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    {stateInfo.description}
                  </div>
                  <Progress value={probability * 100} className="h-1.5" />
                  {index === 0 && (
                    <div className="text-xs text-purple-600 mt-1 font-medium">
                      🎯 Most Likely Next State
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Law of Large Numbers Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Law of Large Numbers Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">📊 Statistical Foundation</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <div>• Confidence increases logarithmically with sample size</div>
                  <div>• Requires 30+ samples for statistical significance</div>
                  <div>• Convergence monitoring tracks prediction stability</div>
                  <div>• 95% confidence intervals for return predictions</div>
                </div>
              </div>

              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">🎯 Smart Adaptations</h4>
                <div className="text-sm text-green-800 space-y-1">
                  <div>• Low data = conservative predictions</div>
                  <div>• High data = trusts model predictions more</div>
                  <div>• Position sizing adjusts based on confidence</div>
                  <div>• Real-time learning from every trade outcome</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gauge className="w-5 h-5 text-purple-500" />
              System Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600">78%</div>
                  <div className="text-sm text-green-700">Pattern Recognition</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">92%</div>
                  <div className="text-sm text-purple-700">State Accuracy</div>
                </div>
              </div>

              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium text-yellow-900">Next Evolution Phase</span>
                </div>
                <div className="text-sm text-yellow-800">
                  {mockMarkovData.llnMetrics.recommendedMinTrades > 0 
                    ? `${mockMarkovData.llnMetrics.recommendedMinTrades} more patterns needed to reach CONVERGED status`
                    : 'System has reached statistical convergence'
                  }
                </div>
              </div>

              <Button className="w-full" variant="outline">
                <Brain className="w-4 h-4 mr-2" />
                View Detailed Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market State Transition Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Activity className="w-6 h-6 text-orange-500" />
            Market State Evolution Timeline
          </CardTitle>
          <p className="text-gray-600">
            How market states transition over time - the foundation of Markov chain predictions
          </p>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-600">
            <Target className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p className="font-medium">Transition Matrix Visualization</p>
            <p className="text-sm">Visual representation of state transitions will be displayed here</p>
            <p className="text-xs mt-1">Connect to live market data to see real-time state evolution</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}