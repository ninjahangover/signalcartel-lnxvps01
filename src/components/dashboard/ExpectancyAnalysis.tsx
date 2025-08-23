"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Calculator, 
  TrendingUp, 
  DollarSign,
  Target,
  BarChart3,
  Zap,
  AlertTriangle,
  CheckCircle,
  TrendingDown
} from 'lucide-react';

interface ExpectancyData {
  strategies: Array<{
    strategyName: string;
    expectancy: number;
    winProbability: number;
    lossProbability: number;
    averageWin: number;
    averageLoss: number;
    totalTrades: number;
    profitFactor: number;
    kellyPercent: number;
    expectedValuePer1000: number;
  }>;
  summary: {
    avgExpectancy: number;
    bestStrategy: { name: string; expectancy: number } | null;
    worstStrategy: { name: string; expectancy: number } | null;
    profitableStrategies: number;
  };
}

export default function ExpectancyAnalysis() {
  const [data, setData] = useState<ExpectancyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpectancyData = async () => {
    try {
      setError(null);
      const response = await fetch('/api/expectancy/dashboard');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch expectancy data');
      }

      setData(result.data);
    } catch (err) {
      console.error('Error fetching expectancy data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpectancyData();
    const interval = setInterval(fetchExpectancyData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getExpectancyColor = (expectancy: number) => {
    if (expectancy >= 5) return 'text-green-600 bg-green-50 border-green-200';
    if (expectancy >= 0) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getExpectancyIcon = (expectancy: number) => {
    if (expectancy >= 5) return CheckCircle;
    if (expectancy >= 0) return Target;
    return AlertTriangle;
  };

  const getProfitFactorColor = (profitFactor: number) => {
    if (profitFactor >= 2) return 'text-green-600';
    if (profitFactor >= 1.5) return 'text-yellow-600';
    if (profitFactor >= 1) return 'text-blue-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mr-3" />
        <span className="text-lg">Analyzing Strategy Expectancy...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">No expectancy data available</p>
        <p className="text-sm">Start trading to generate expectancy analysis</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Expectancy Formula Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-800 mb-2">
            E = (W × A) - (L × B)
          </div>
          <div className="text-sm text-green-700">
            <strong>W</strong> = Win Probability • <strong>A</strong> = Average Win • <strong>L</strong> = Loss Probability • <strong>B</strong> = Average Loss
          </div>
          <div className="text-xs text-green-600 mt-1">
            Positive expectancy = profitable strategy over time
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-white rounded-lg border border-green-200">
          <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-600">
            ${data.summary.avgExpectancy.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Average Expectancy</div>
        </div>
        
        <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
          <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-600">
            {data.summary.profitableStrategies}
          </div>
          <div className="text-sm text-gray-600">Profitable Strategies</div>
        </div>
        
        <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
          <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <div className="text-lg font-bold text-purple-600">
            {data.summary.bestStrategy?.name?.split(' ')[0] || 'None'}
          </div>
          <div className="text-sm text-gray-600">Best Strategy</div>
          <div className="text-xs text-green-600 font-mono mt-1">
            ${data.summary.bestStrategy?.expectancy.toFixed(2) || '0.00'}
          </div>
        </div>

        <div className="text-center p-4 bg-white rounded-lg border border-orange-200">
          <BarChart3 className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-orange-600">
            {data.strategies.length}
          </div>
          <div className="text-sm text-gray-600">Total Strategies</div>
        </div>
      </div>

      {/* Strategy Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.strategies.map((strategy) => {
          const ExpectancyIcon = getExpectancyIcon(strategy.expectancy);
          
          return (
            <div 
              key={strategy.strategyName} 
              className={`p-5 rounded-lg border ${getExpectancyColor(strategy.expectancy)}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">
                  {strategy.strategyName.split(' ').slice(0, 3).join(' ')}
                </h4>
                <div className="flex items-center gap-2">
                  <ExpectancyIcon className="w-5 h-5" />
                  <Badge variant={strategy.expectancy >= 0 ? 'default' : 'destructive'}>
                    ${strategy.expectancy.toFixed(2)}
                  </Badge>
                </div>
              </div>
              
              {/* Expectancy Formula Breakdown */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Win Rate (W)</div>
                    <div className="font-bold text-green-600">
                      {(strategy.winProbability * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Loss Rate (L)</div>
                    <div className="font-bold text-red-600">
                      {(strategy.lossProbability * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Avg Win (A)</div>
                    <div className="font-bold text-green-600">
                      +${strategy.averageWin.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Avg Loss (B)</div>
                    <div className="font-bold text-red-600">
                      -${strategy.averageLoss.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Expectancy Calculation */}
                <div className="pt-3 border-t">
                  <div className="text-xs text-gray-600 mb-1">Expectancy Calculation:</div>
                  <div className="font-mono text-sm">
                    <span className="text-green-600">{(strategy.winProbability * 100).toFixed(0)}% × ${strategy.averageWin.toFixed(2)}</span>
                    {' - '}
                    <span className="text-red-600">{(strategy.lossProbability * 100).toFixed(0)}% × ${strategy.averageLoss.toFixed(2)}</span>
                  </div>
                  <div className="font-mono text-sm mt-1">
                    = <span className={strategy.expectancy >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${((strategy.winProbability * strategy.averageWin) - (strategy.lossProbability * strategy.averageLoss)).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Additional Metrics */}
                <div className="grid grid-cols-2 gap-4 text-sm pt-2">
                  <div>
                    <div className="text-gray-600">Profit Factor</div>
                    <div className={`font-bold ${getProfitFactorColor(strategy.profitFactor)}`}>
                      {strategy.profitFactor.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Sample Size</div>
                    <div className="font-medium">
                      {strategy.totalTrades} trades
                    </div>
                  </div>
                </div>

                {/* Expected Value per $1000 */}
                <div className="bg-white/50 p-3 rounded border">
                  <div className="text-xs text-gray-600">Expected profit per $1000 invested:</div>
                  <div className={`text-lg font-bold ${strategy.expectedValuePer1000 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${strategy.expectedValuePer1000.toFixed(2)}
                  </div>
                </div>

                {/* Statistical Confidence */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Statistical Confidence</span>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={Math.min(100, (strategy.totalTrades / 30) * 100)} 
                      className="w-16 h-2" 
                    />
                    <span className={strategy.totalTrades >= 30 ? 'text-green-600' : 'text-orange-600'}>
                      {strategy.totalTrades >= 30 ? 'High' : 'Building'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expectancy Insights */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Expectancy Formula Insights
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-semibold text-blue-800 mb-2">📊 Mathematical Foundation</h5>
            <ul className="space-y-1 text-blue-700">
              <li>• Positive expectancy = long-term profitability</li>
              <li>• Higher expectancy = better risk-adjusted returns</li>
              <li>• Formula accounts for both frequency and magnitude</li>
              <li>• Best strategies balance win rate with profit size</li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold text-blue-800 mb-2">🎯 Strategy Optimization</h5>
            <ul className="space-y-1 text-blue-700">
              <li>• Focus on strategies with highest expectancy</li>
              <li>• Improve average win or reduce average loss</li>
              <li>• 30+ trades needed for statistical confidence</li>
              <li>• Use expectancy data in your position sizer</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}