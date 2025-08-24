'use client';

import React, { useState, useEffect } from 'react';

interface StrategyVote {
  id: string;
  name: string;
  vote: 'BUY' | 'SELL' | 'HOLD' | 'CLOSE';
  confidence: number;
  status: 'ACTIVE' | 'LEARNING' | 'OFFLINE';
  icon: string;
  reasoning: string;
}

interface ConsensusData {
  currentDecision: {
    action: 'BUY' | 'SELL' | 'HOLD' | 'CLOSE';
    symbol: string;
    price: number;
    consensus: number;
    totalStrategies: number;
    combinedConfidence: number;
    expectedWinRate: number;
  };
  strategies: StrategyVote[];
  historicalConsensus: {
    totalVotes: number;
    consensusWinRate: number;
    description: string;
  };
}

const StrategyConsensusWarRoom: React.FC = () => {
  const [data, setData] = useState<ConsensusData>({
    currentDecision: {
      action: 'BUY',
      symbol: 'Bitcoin',
      price: 114995,
      consensus: 3,
      totalStrategies: 4,
      combinedConfidence: 95.7,
      expectedWinRate: 94.1
    },
    strategies: [
      {
        id: 'rsi_enhanced',
        name: 'RSI Enhanced',
        vote: 'BUY',
        confidence: 92.3,
        status: 'ACTIVE',
        icon: '🏆',
        reasoning: 'Strong oversold signal with momentum confirmation'
      },
      {
        id: 'bollinger_neural',
        name: 'Bollinger Neural',
        vote: 'BUY',
        confidence: 87.1,
        status: 'ACTIVE',
        icon: '🎪',
        reasoning: 'Price touching lower band with reversal pattern'
      },
      {
        id: 'macd_evolution',
        name: 'MACD Evolution',
        vote: 'HOLD',
        confidence: 72.4,
        status: 'LEARNING',
        icon: '🧠',
        reasoning: 'Mixed signals, waiting for trend confirmation'
      },
      {
        id: 'quantum_oscillator',
        name: 'Quantum Oscillator',
        vote: 'BUY',
        confidence: 95.7,
        status: 'ACTIVE',
        icon: '⚡',
        reasoning: 'Quantum probability collapse indicates strong buy'
      }
    ],
    historicalConsensus: {
      totalVotes: 247,
      consensusWinRate: 94.1,
      description: 'Consensus trades win 94.1% of the time'
    }
  });

  const [votingAnimation, setVotingAnimation] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate live voting updates
      setData(prev => ({
        ...prev,
        strategies: prev.strategies.map(strategy => ({
          ...strategy,
          confidence: Math.max(70, strategy.confidence + (Math.random() - 0.5) * 5),
          vote: Math.random() > 0.8 ? 
            (['BUY', 'SELL', 'HOLD'] as const)[Math.floor(Math.random() * 3)] : 
            strategy.vote
        })),
        currentDecision: {
          ...prev.currentDecision,
          combinedConfidence: 90 + Math.random() * 10,
          price: 114000 + Math.random() * 2000
        }
      }));

      // Trigger voting animation
      const randomStrategy = Math.floor(Math.random() * 4);
      setVotingAnimation(`strategy_${randomStrategy}`);
      setTimeout(() => setVotingAnimation(null), 1000);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const getVoteColor = (vote: string) => {
    switch (vote) {
      case 'BUY': return 'text-green-400 bg-green-900';
      case 'SELL': return 'text-red-400 bg-red-900';
      case 'HOLD': return 'text-yellow-400 bg-yellow-900';
      case 'CLOSE': return 'text-purple-400 bg-purple-900';
      default: return 'text-gray-400 bg-gray-900';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '🟢';
      case 'LEARNING': return '🟡';
      case 'OFFLINE': return '🔴';
      default: return '⚪';
    }
  };

  const agreeingStrategies = data.strategies.filter(s => s.vote === data.currentDecision.action);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          🎪 STRATEGY CONSENSUS WAR ROOM
        </h2>
        <div className="text-green-400 font-semibold text-sm flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          LIVE VOTING
        </div>
      </div>

      {/* Current Decision */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-4 mb-6">
        <div className="text-center">
          <div className="text-blue-200 font-semibold mb-2">🗳️ CURRENT VOTE:</div>
          <div className="text-white text-2xl font-bold">
            {data.currentDecision.action} {data.currentDecision.symbol} @ ${data.currentDecision.price.toLocaleString()}
          </div>
          <div className="text-blue-300 mt-2">
            {data.currentDecision.consensus}/{data.currentDecision.totalStrategies} STRATEGIES AGREE
          </div>
        </div>
      </div>

      {/* Strategy Votes */}
      <div className="space-y-4 mb-6">
        {data.strategies.map((strategy, index) => {
          const isAgreeing = strategy.vote === data.currentDecision.action;
          const animationClass = votingAnimation === `strategy_${index}` ? 'animate-pulse scale-105' : '';
          
          return (
            <div 
              key={strategy.id}
              className={`p-4 rounded-lg border transition-all duration-500 ${animationClass} ${
                isAgreeing ? 
                'bg-green-900 border-green-600' : 
                'bg-gray-800 border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{strategy.icon}</div>
                  <div>
                    <div className="text-white font-bold flex items-center gap-2">
                      {strategy.name}
                      {getStatusIcon(strategy.status)}
                    </div>
                    <div className="text-sm text-gray-300">{strategy.reasoning}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${getVoteColor(strategy.vote)}`}>
                      {isAgreeing ? '✅' : '❌'} {strategy.vote}
                    </div>
                    <div className="text-white text-lg font-bold mt-1">
                      {strategy.confidence.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Consensus Result */}
      <div className={`rounded-lg p-4 mb-6 ${
        data.currentDecision.consensus >= 3 ? 
        'bg-gradient-to-r from-green-800 to-emerald-800' : 
        'bg-gradient-to-r from-red-800 to-pink-800'
      }`}>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-white font-bold text-lg mb-1">
              🏆 CONSENSUS: {data.currentDecision.consensus}/{data.currentDecision.totalStrategies} AGREE
            </div>
            <div className={`font-bold text-xl ${
              data.currentDecision.consensus >= 3 ? 'text-green-200' : 'text-red-200'
            }`}>
              {data.currentDecision.consensus >= 3 ? '→ EXECUTE APPROVED' : '→ INSUFFICIENT CONSENSUS'}
            </div>
          </div>
          <div>
            <div className="text-white font-bold text-lg mb-1">
              📊 Combined Confidence: {data.currentDecision.combinedConfidence.toFixed(1)}%
            </div>
            <div className="text-blue-200">
              ⚡ Expected Win Rate: {data.currentDecision.expectedWinRate}%
            </div>
          </div>
        </div>
      </div>

      {/* Historical Performance */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-lg p-4">
        <div className="text-center">
          <div className="text-purple-200 font-semibold mb-2">🎯 HISTORICAL CONSENSUS PERFORMANCE</div>
          <div className="text-white text-xl font-bold">
            {data.historicalConsensus.description}
          </div>
          <div className="text-purple-300 mt-1">
            Based on {data.historicalConsensus.totalVotes} consensus votes
          </div>
          <div className="mt-3 text-yellow-300 font-semibold">
            💡 When 3+ strategies agree = MAXIMUM WIN PROBABILITY
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyConsensusWarRoom;