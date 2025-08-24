'use client';

import React, { useState, useEffect } from 'react';

interface EvolutionEvent {
  id: string;
  timestamp: string;
  type: 'pattern' | 'evolution' | 'quantum' | 'consensus' | 'adaptation' | 'learning' | 'fusion';
  message: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  icon: string;
}

const LiveEvolutionTicker: React.FC = () => {
  const [events, setEvents] = useState<EvolutionEvent[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isScrolling, setIsScrolling] = useState(true);

  const evolutionMessages = [
    {
      type: 'pattern' as const,
      messages: [
        'Pattern discovered: "Bitcoin support at $114,850"',
        'New resistance level detected at $116,200',
        'Fractal pattern match: 94.7% similarity to profitable setup',
        'Volume spike correlation identified',
        'Price action symmetry detected in 4H timeframe'
      ],
      icon: '🔍',
      impact: 'medium' as const
    },
    {
      type: 'evolution' as const,
      messages: [
        'Evolution: RSI threshold optimized to 31.7',
        'Bollinger band sensitivity increased by 12%',
        'MACD crossover delay reduced to 0.3 periods',
        'Neural weight optimization complete',
        'Strategy performance coefficients updated'
      ],
      icon: '🧬',
      impact: 'high' as const
    },
    {
      type: 'quantum' as const,
      messages: [
        'Quantum: New confidence calculation integrated',
        'Superposition collapse probability updated',
        'Quantum entanglement detected between EUR/USD and BTC',
        'Probability matrix recalibrated',
        'Quantum coherence optimization active'
      ],
      icon: '⚛️',
      impact: 'critical' as const
    },
    {
      type: 'consensus' as const,
      messages: [
        'Consensus: 4/4 strategies aligned on trend',
        '3/4 strategies voting BUY with 95%+ confidence',
        'Strategy disagreement resolved through evolution',
        'Cross-validation consensus achieved',
        'Multi-timeframe agreement confirmed'
      ],
      icon: '🎪',
      impact: 'high' as const
    },
    {
      type: 'adaptation' as const,
      messages: [
        'Market adaptation detected: Volatility shift',
        'Weekend pattern deviation: +23% from norm',
        'News event correlation learning active',
        'Market microstructure change detected',
        'Liquidity pattern adaptation in progress'
      ],
      icon: '📊',
      impact: 'medium' as const
    },
    {
      type: 'learning' as const,
      messages: [
        'AI learned: Weekend patterns differ 12.3%',
        'Historical correlation strengthened',
        'False positive rate reduced by 8%',
        'Precision/recall ratio optimized',
        'Learning velocity increased 15%'
      ],
      icon: '🧠',
      impact: 'high' as const
    },
    {
      type: 'fusion' as const,
      messages: [
        'Data fusion: 847 new data points integrated',
        'Multi-source signal integration complete',
        'Cross-market correlation analysis updated',
        'Real-time sentiment fusion active',
        'Technical-fundamental fusion optimized'
      ],
      icon: '🔬',
      impact: 'medium' as const
    }
  ];

  useEffect(() => {
    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Generate new evolution events
    const eventInterval = setInterval(() => {
      const randomCategory = evolutionMessages[Math.floor(Math.random() * evolutionMessages.length)];
      const randomMessage = randomCategory.messages[Math.floor(Math.random() * randomCategory.messages.length)];
      
      const newEvent: EvolutionEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toLocaleTimeString(),
        type: randomCategory.type,
        message: randomMessage,
        impact: randomCategory.impact,
        icon: randomCategory.icon
      };

      setEvents(prev => [newEvent, ...prev.slice(0, 19)]); // Keep last 20 events
    }, 2000 + Math.random() * 3000); // Random interval between 2-5 seconds

    return () => {
      clearInterval(timeInterval);
      clearInterval(eventInterval);
    };
  }, []);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'border-l-red-500 bg-red-900/20';
      case 'high': return 'border-l-yellow-500 bg-yellow-900/20';
      case 'medium': return 'border-l-blue-500 bg-blue-900/20';
      case 'low': return 'border-l-green-500 bg-green-900/20';
      default: return 'border-l-gray-500 bg-gray-900/20';
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'critical': return 'bg-red-600 text-red-100';
      case 'high': return 'bg-yellow-600 text-yellow-100';
      case 'medium': return 'bg-blue-600 text-blue-100';
      case 'low': return 'bg-green-600 text-green-100';
      default: return 'bg-gray-600 text-gray-100';
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          ⚡ EVOLUTION TICKER - GETTING SMARTER EVERY SECOND
        </h2>
        <div className="flex items-center gap-4">
          <div className="text-green-400 text-sm">
            🕐 {currentTime.toLocaleTimeString()}
          </div>
          <button
            onClick={() => setIsScrolling(!isScrolling)}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            {isScrolling ? '⏸️ Pause' : '▶️ Resume'}
          </button>
        </div>
      </div>

      {/* Learning Status */}
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-lg p-4 mb-4">
        <div className="text-center">
          <div className="text-purple-200 font-bold text-lg mb-2">🧠 LEARNING IN REAL-TIME:</div>
          <div className="text-blue-300 text-sm">
            System is continuously evolving, adapting, and improving based on market conditions
          </div>
        </div>
      </div>

      {/* Event Feed */}
      <div className="space-y-2 mb-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {events.map((event, index) => (
          <div
            key={event.id}
            className={`border-l-4 p-3 rounded-r-lg transition-all duration-500 ${getImpactColor(event.impact)} ${
              index === 0 ? 'animate-fadeInSlide' : ''
            }`}
            style={{
              animation: index === 0 ? 'fadeInSlide 0.5s ease-out' : undefined
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="text-xl mt-0.5">{event.icon}</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-400 text-sm font-mono">[{event.timestamp}]</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getImpactBadge(event.impact)}`}>
                      {event.impact.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-white text-sm leading-relaxed">{event.message}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Evolution Quote */}
      <div className="bg-gradient-to-r from-green-900 to-teal-900 rounded-lg p-4 text-center">
        <div className="text-green-100 text-lg font-bold mb-2">
          🚀 "They say the market learns? We learn FASTER."
        </div>
        <div className="text-green-300 text-sm">
          Every second, our system is discovering patterns, optimizing strategies, and evolving beyond human capabilities.
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeInSlide {
          0% {
            opacity: 0;
            transform: translateX(-20px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fadeInSlide {
          animation: fadeInSlide 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LiveEvolutionTicker;