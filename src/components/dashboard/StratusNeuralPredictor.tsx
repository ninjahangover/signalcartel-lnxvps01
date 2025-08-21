'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, TrendingDown, Zap, AlertCircle, CheckCircle2, Clock, Sparkles } from 'lucide-react';

interface MarkovState {
  name: string;
  probability: number;
  icon: React.ReactNode;
  color: string;
}

interface LLNMetrics {
  convergenceStatus: string;
  overallReliability: number;
  recommendedMinTrades: number;
  currentAverageConfidence: number;
}

interface MarkovVisualizationProps {
  currentState?: string;
  nextStateProbabilities?: Map<string, number>;
  llnMetrics?: LLNMetrics;
  expectedReturn?: number;
  sampleSize?: number;
  convergenceScore?: number;
}

export default function StratusNeuralPredictor({
  currentState = 'SIDEWAYS_LOW_VOL',
  nextStateProbabilities = new Map(),
  llnMetrics = {
    convergenceStatus: 'LEARNING',
    overallReliability: 0.45,
    recommendedMinTrades: 25,
    currentAverageConfidence: 0.55
  },
  expectedReturn = 2.5,
  sampleSize = 150,
  convergenceScore = 0.72
}: MarkovVisualizationProps) {
  const [animatedReliability, setAnimatedReliability] = useState(0);

  useEffect(() => {
    // Animate reliability score
    const timer = setTimeout(() => {
      setAnimatedReliability(llnMetrics.overallReliability * 100);
    }, 100);
    return () => clearTimeout(timer);
  }, [llnMetrics.overallReliability]);

  // Define state icons and colors
  const getStateIcon = (state: string) => {
    const stateMap: Record<string, { icon: React.ReactNode; color: string }> = {
      'TRENDING_UP_STRONG': { icon: <TrendingUp className="w-4 h-4" />, color: 'text-green-500' },
      'TRENDING_UP_WEAK': { icon: <TrendingUp className="w-4 h-4" />, color: 'text-green-400' },
      'SIDEWAYS_HIGH_VOL': { icon: <Activity className="w-4 h-4" />, color: 'text-yellow-500' },
      'SIDEWAYS_LOW_VOL': { icon: <Activity className="w-4 h-4" />, color: 'text-gray-500' },
      'TRENDING_DOWN_WEAK': { icon: <TrendingDown className="w-4 h-4" />, color: 'text-red-400' },
      'TRENDING_DOWN_STRONG': { icon: <TrendingDown className="w-4 h-4" />, color: 'text-red-500' },
      'BREAKOUT_UP': { icon: <Zap className="w-4 h-4" />, color: 'text-green-600' },
      'BREAKOUT_DOWN': { icon: <Zap className="w-4 h-4" />, color: 'text-red-600' },
      'REVERSAL_UP': { icon: <TrendingUp className="w-4 h-4" />, color: 'text-blue-500' },
      'REVERSAL_DOWN': { icon: <TrendingDown className="w-4 h-4" />, color: 'text-orange-500' }
    };
    return stateMap[state] || { icon: <Activity className="w-4 h-4" />, color: 'text-gray-400' };
  };

  // Convert next state probabilities to sorted array
  const sortedStates = Array.from(nextStateProbabilities.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([state, prob]) => ({
      name: state,
      probability: prob,
      ...getStateIcon(state)
    }));

  // Get convergence status color
  const getConvergenceColor = (status: string) => {
    switch (status) {
      case 'CONVERGED': return 'text-green-500';
      case 'CONVERGING': return 'text-yellow-500';
      case 'LEARNING': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  // Get confidence badge variant
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return { variant: 'default' as const, text: 'High Confidence' };
    if (confidence >= 0.5) return { variant: 'secondary' as const, text: 'Moderate Confidence' };
    return { variant: 'outline' as const, text: 'Low Confidence' };
  };

  const confidenceBadge = getConfidenceBadge(llnMetrics.currentAverageConfidence);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Stratus Neural Predictor */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            Stratus Neural Predictor™
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Current State */}
          <div className="mb-4">
            <div className="text-sm text-muted-foreground mb-1">Market DNA Signature</div>
            <div className="flex items-center gap-2">
              <span className={getStateIcon(currentState).color}>
                {getStateIcon(currentState).icon}
              </span>
              <span className="font-medium">
                {currentState.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Next State Probabilities */}
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">Quantum State Predictions</div>
            {sortedStates.length > 0 ? (
              sortedStates.map((state, index) => (
                <div key={state.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`${index === 0 ? 'font-medium' : ''} ${state.color}`}>
                        {state.icon}
                      </span>
                      <span className={index === 0 ? 'font-medium' : ''}>
                        {state.name.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className={`${index === 0 ? 'font-medium' : ''} text-sm`}>
                      {(state.probability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={state.probability * 100} className="h-1.5" />
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No predictions available</div>
            )}
          </div>

          {/* Expected Return */}
          <div className="mt-4 p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">AI Profit Forecast</span>
              <span className={`font-medium ${expectedReturn > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {expectedReturn > 0 ? '+' : ''}{expectedReturn.toFixed(2)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stratus Intelligence Engine */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            Stratus Intelligence Engine™
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Convergence Status */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Learning Evolution</span>
              <Badge className={getConvergenceColor(llnMetrics.convergenceStatus)}>
                {llnMetrics.convergenceStatus}
              </Badge>
            </div>
            <Progress value={convergenceScore * 100} className="h-2" />
            <div className="text-xs text-muted-foreground mt-1">
              {(convergenceScore * 100).toFixed(0)}% converged
            </div>
          </div>

          {/* Overall Reliability */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Neural Confidence</span>
              <span className="text-sm font-medium">{animatedReliability.toFixed(1)}%</span>
            </div>
            <Progress value={animatedReliability} className="h-2" />
          </div>

          {/* Confidence Level */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">AI Certainty Level</span>
              <Badge variant={confidenceBadge.variant}>
                {confidenceBadge.text}
              </Badge>
            </div>
          </div>

          {/* Sample Size & Trades Needed */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <CheckCircle2 className="w-3 h-3" />
                Training Data
              </div>
              <div className="font-medium">{sampleSize}</div>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <Clock className="w-3 h-3" />
                Evolution Points
              </div>
              <div className="font-medium">{llnMetrics.recommendedMinTrades}</div>
            </div>
          </div>

          {/* Info Alert */}
          {llnMetrics.overallReliability < 0.5 && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-yellow-800 dark:text-yellow-200">
                🧠 Stratus Brain is still learning. Feed it {llnMetrics.recommendedMinTrades} more trading patterns 
                to unlock maximum prediction power.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}