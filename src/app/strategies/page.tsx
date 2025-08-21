'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Strategy {
  id: string;
  name: string;
  description: string;
  strategyType: string;
  timeframe: string;
  tradingPairs: string[];
  isActive: boolean;
  isOptimized: boolean;
  currentWinRate: number | null;
  totalTrades: number;
  profitLoss: number;
  createdAt: string;
  lastOptimizedAt: string | null;
}

export default function StrategiesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Fetch strategies
  useEffect(() => {
    if (session) {
      fetchStrategies();
    }
  }, [session]);

  const fetchStrategies = async () => {
    try {
      const response = await fetch('/api/strategies');
      const data = await response.json();
      
      if (data.success) {
        setStrategies(data.strategies);
      } else {
        setError('Failed to load strategies');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error fetching strategies:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStrategy = async (strategyId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/strategies/${strategyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStrategies(strategies.map(s => 
          s.id === strategyId ? { ...s, isActive } : s
        ));
      } else {
        alert('Failed to update strategy');
      }
    } catch (err) {
      console.error('Error updating strategy:', err);
      alert('Network error');
    }
  };

  const deleteStrategy = async (strategyId: string) => {
    if (!confirm('Are you sure you want to delete this strategy?')) return;
    
    try {
      const response = await fetch(`/api/strategies/${strategyId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStrategies(strategies.filter(s => s.id !== strategyId));
      } else {
        alert('Failed to delete strategy');
      }
    } catch (err) {
      console.error('Error deleting strategy:', err);
      alert('Network error');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading strategies...</div>
      </div>
    );
  }

  if (!session) {
    return null; // Redirecting
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-black/50 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Pine Script <span className="text-yellow-400">Strategies</span>
              </h1>
              <p className="text-gray-400">
                Manage your trading strategies powered by The Stratus Engine™
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                ← Back to Dashboard
              </Link>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                + New Strategy
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-900/50 border border-red-600 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Strategies Grid */}
        {strategies.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-white mb-4">No Strategies Yet</h2>
            <p className="text-gray-400 mb-8">
              Create your first Pine Script strategy to start using The Stratus Engine™
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-8 py-3 rounded-lg font-bold transition-colors"
            >
              Create Your First Strategy
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {strategies.map((strategy) => (
              <div
                key={strategy.id}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-yellow-400/50 transition-colors"
              >
                {/* Strategy Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{strategy.name}</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm bg-purple-600/30 text-purple-300 px-2 py-1 rounded">
                        {strategy.strategyType}
                      </span>
                      <span className="text-sm bg-gray-700 text-gray-300 px-2 py-1 rounded">
                        {strategy.timeframe}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        strategy.isActive ? 'bg-green-400' : 'bg-gray-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Strategy Description */}
                {strategy.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {strategy.description}
                  </p>
                )}

                {/* Trading Pairs */}
                <div className="mb-4">
                  <p className="text-gray-400 text-xs mb-2">Trading Pairs:</p>
                  <div className="flex flex-wrap gap-1">
                    {strategy.tradingPairs.slice(0, 3).map((pair) => (
                      <span
                        key={pair}
                        className="text-xs bg-yellow-400/20 text-yellow-300 px-2 py-1 rounded"
                      >
                        {pair}
                      </span>
                    ))}
                    {strategy.tradingPairs.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{strategy.tradingPairs.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-gray-400 text-xs">Win Rate</p>
                    <p className="text-white font-bold">
                      {strategy.currentWinRate ? `${strategy.currentWinRate.toFixed(1)}%` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Total Trades</p>
                    <p className="text-white font-bold">{strategy.totalTrades}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">P&L</p>
                    <p className={`font-bold ${strategy.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {strategy.profitLoss >= 0 ? '+' : ''}{strategy.profitLoss.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Status</p>
                    <p className={`font-bold ${strategy.isOptimized ? 'text-yellow-400' : 'text-gray-500'}`}>
                      {strategy.isOptimized ? 'Optimized' : 'Manual'}
                    </p>
                  </div>
                </div>

                {/* Last Optimized */}
                {strategy.lastOptimizedAt && (
                  <div className="mb-4">
                    <p className="text-gray-400 text-xs">Last Optimized:</p>
                    <p className="text-gray-300 text-sm">
                      {new Date(strategy.lastOptimizedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleStrategy(strategy.id, !strategy.isActive)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        strategy.isActive
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {strategy.isActive ? 'Pause' : 'Start'}
                    </button>
                    <Link
                      href={`/strategies/${strategy.id}`}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      View
                    </Link>
                  </div>
                  <button
                    onClick={() => deleteStrategy(strategy.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete Strategy"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Strategy Modal - Placeholder */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Create New Strategy</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>
            <div className="text-center py-8">
              <p className="text-gray-300 mb-4">Strategy creation form coming soon!</p>
              <p className="text-sm text-gray-500">
                This will include Pine Script upload, parameter extraction, and strategy configuration.
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(false)}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}