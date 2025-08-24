'use client';

import React, { useState, useEffect } from 'react';

interface ImpactMetrics {
  currentPerformance: number;
  averageTradesPerMonth: number;
  monthlyGeneration: number;
  accountsSupported: Array<{
    id: string;
    amount: number;
    description: string;
    status: 'active' | 'pending' | 'helping';
    icon: string;
    story: string;
  }>;
  reserveFund: number;
  totalLivesHelped: number;
  payItForwardStats: {
    volunteeredHours: number;
    description: string;
  };
  rippleEffect: number;
}

const SocialImpactCounter: React.FC = () => {
  const [metrics, setMetrics] = useState<ImpactMetrics>({
    currentPerformance: 34.20,
    averageTradesPerMonth: 180,
    monthlyGeneration: 6156,
    accountsSupported: [
      {
        id: 'family_01',
        amount: 500,
        description: 'Family pays rent',
        status: 'active',
        icon: '🏠',
        story: 'Single mother of 2, now has stable housing'
      },
      {
        id: 'student_01',
        amount: 500,
        description: 'Student pays tuition',
        status: 'active',
        icon: '🎓',
        story: 'First-generation college student, studying nursing'
      },
      {
        id: 'senior_01',
        amount: 500,
        description: 'Senior buys medication',
        status: 'helping',
        icon: '💊',
        story: 'Retired teacher, diabetes medication covered'
      },
      {
        id: 'parent_01',
        amount: 500,
        description: 'Parent buys groceries',
        status: 'active',
        icon: '🛒',
        story: 'Working dad, kids never go hungry anymore'
      }
    ],
    reserveFund: 4156,
    totalLivesHelped: 12,
    payItForwardStats: {
      volunteeredHours: 247,
      description: 'This month our recipients volunteered 247 hours to help others in their communities. The ripple continues...'
    },
    rippleEffect: 8.7
  });

  const [heartbeat, setHeartbeat] = useState(false);
  const [countUp, setCountUp] = useState(0);

  useEffect(() => {
    // Heartbeat animation for the mission statement
    const heartbeatInterval = setInterval(() => {
      setHeartbeat(prev => !prev);
    }, 2000);

    // Count up animation for lives helped
    const countInterval = setInterval(() => {
      setCountUp(prev => {
        if (prev < metrics.totalLivesHelped) {
          return prev + 1;
        }
        return prev;
      });
    }, 200);

    // Simulate real-time updates
    const updateInterval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        currentPerformance: 30 + Math.random() * 10,
        monthlyGeneration: 5500 + Math.random() * 1000,
        totalLivesHelped: 12 + Math.floor(Math.random() * 3),
        payItForwardStats: {
          ...prev.payItForwardStats,
          volunteeredHours: 240 + Math.floor(Math.random() * 20)
        },
        rippleEffect: 8 + Math.random() * 2
      }));
    }, 5000);

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(countInterval);
      clearInterval(updateInterval);
    };
  }, [metrics.totalLivesHelped]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-900 border-green-500';
      case 'helping': return 'bg-blue-900 border-blue-500';
      case 'pending': return 'bg-yellow-900 border-yellow-500';
      default: return 'bg-gray-900 border-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '✅';
      case 'helping': return '💝';
      case 'pending': return '⏳';
      default: return '⚪';
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
      {/* Mission Statement */}
      <div className="text-center mb-6">
        <div className={`text-2xl font-bold text-pink-300 transition-transform duration-500 ${
          heartbeat ? 'scale-110' : 'scale-100'
        }`}>
          💝 "Money means nothing. Changing lives means everything."
        </div>
      </div>

      {/* Impact Calculation */}
      <div className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-lg p-4 mb-6">
        <h3 className="text-white font-bold text-lg mb-4 text-center">
          🌍 POTENTIAL IMPACT CALCULATION:
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-purple-200 font-semibold">Current Performance:</div>
            <div className="text-white text-xl font-bold">
              ${metrics.currentPerformance.toFixed(2)} per trade
            </div>
          </div>
          <div>
            <div className="text-purple-200 font-semibold">× Average Trades/Month:</div>
            <div className="text-white text-xl font-bold">{metrics.averageTradesPerMonth}</div>
          </div>
          <div>
            <div className="text-purple-200 font-semibold">= Monthly Generation:</div>
            <div className="text-green-400 text-xl font-bold">
              ${metrics.monthlyGeneration.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Account Distribution */}
      <div className="mb-6">
        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          🎯 SUPPLEMENTAL INCOME DISTRIBUTION:
        </h3>
        
        <div className="space-y-3">
          {metrics.accountsSupported.map((account) => (
            <div key={account.id} className={`rounded-lg border p-4 ${getStatusColor(account.status)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{account.icon}</div>
                  <div>
                    <div className="text-white font-bold flex items-center gap-2">
                      Account {account.id.split('_')[1]}: ${account.amount}/month
                      {getStatusIcon(account.status)}
                    </div>
                    <div className="text-gray-300 text-sm">{account.description}</div>
                    <div className="text-gray-400 text-xs mt-1">{account.story}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Reserve Fund */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-lg border border-blue-500 p-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">💰</div>
              <div>
                <div className="text-white font-bold">
                  Reserve Fund: ${metrics.reserveFund.toLocaleString()}/month
                </div>
                <div className="text-blue-300 text-sm">→ Scale to help more families</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lives Helped Counter */}
      <div className="bg-gradient-to-r from-green-900 to-emerald-900 rounded-lg p-4 mb-6">
        <div className="text-center">
          <div className="text-green-200 font-semibold mb-2">💪 LIVES POTENTIALLY HELPED:</div>
          <div className="text-green-100 text-4xl font-bold mb-2">
            {countUp} families and growing...
          </div>
          <div className="text-green-300 text-sm">
            Each account represents real families with real needs
          </div>
        </div>
      </div>

      {/* Pay It Forward Tracker */}
      <div className="bg-gradient-to-r from-orange-900 to-yellow-900 rounded-lg p-4 mb-6">
        <h3 className="text-orange-200 font-bold text-lg mb-3 flex items-center gap-2">
          🔄 PAY IT FORWARD TRACKER:
        </h3>
        
        <div className="text-center">
          <div className="text-orange-100 text-2xl font-bold mb-2">
            {metrics.payItForwardStats.volunteeredHours} hours volunteered
          </div>
          <div className="text-orange-200 text-sm leading-relaxed">
            "{metrics.payItForwardStats.description}"
          </div>
        </div>
      </div>

      {/* Ripple Effect */}
      <div className="bg-gradient-to-r from-pink-900 to-purple-900 rounded-lg p-4">
        <div className="text-center">
          <div className="text-pink-200 font-semibold mb-2">🌊 RIPPLE EFFECT MULTIPLIER:</div>
          <div className="text-pink-100 text-3xl font-bold mb-2">
            {metrics.rippleEffect.toFixed(1)}x impact
          </div>
          <div className="text-pink-300 text-sm">
            Every person we help goes on to help {metrics.rippleEffect.toFixed(1)} others
          </div>
          <div className="text-yellow-300 font-semibold mt-3">
            ✨ The kindness engine is exponential ✨
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialImpactCounter;