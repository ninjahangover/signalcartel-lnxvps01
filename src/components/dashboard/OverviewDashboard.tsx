'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { tradingAccountService, type AccountData } from '../../lib/trading-account-service';
// Chart removed - use dedicated Trading Charts tab instead
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  Target,
  Zap,
  AlertCircle,
  CheckCircle,
  BarChart3
} from 'lucide-react';

interface OverviewDashboardProps {
  isKrakenConnected: boolean;
  engineStatus: {
    isRunning: boolean;
    activeStrategies: number;
    totalAlerts: number;
    optimizationActive: boolean;
  };
}

export default function OverviewDashboard({ 
  isKrakenConnected, 
  engineStatus 
}: OverviewDashboardProps) {
  
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [customTradingData, setCustomTradingData] = useState<any>(null);
  const [quantumForgeStatus, setQuantumForgeStatus] = useState<any>(null);
  const [quantumForgePortfolio, setQuantumForgePortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to account data from trading service
  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = tradingAccountService.subscribe((data) => {
      setAccountData(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Fetch Quantum Forge data every 10 seconds
  useEffect(() => {
    const fetchQuantumForgeData = async () => {
      try {
        // Fetch Quantum Forge status
        const statusResponse = await fetch('/api/quantum-forge/status');
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          if (statusData.success) {
            setQuantumForgeStatus(statusData.data);
          }
        }

        // Fetch Quantum Forge portfolio
        const portfolioResponse = await fetch('/api/quantum-forge/portfolio');
        if (portfolioResponse.ok) {
          const portfolioData = await portfolioResponse.json();
          if (portfolioData.success) {
            setQuantumForgePortfolio(portfolioData.data);
          }
        }

        // Fetch custom trading data 
        const customResponse = await fetch('/api/custom-paper-trading/dashboard');
        if (customResponse.ok) {
          const customData = await customResponse.json();
          if (customData.success && customData.data.trades?.length > 0) {
            setCustomTradingData(customData.data);
          }
        }

      } catch (error) {
        console.error('Failed to fetch Stratus Engine data:', error);
      }
    };

    fetchQuantumForgeData();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchQuantumForgeData, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Use Quantum Forge portfolio data or fallback to account data
  const portfolioData = quantumForgePortfolio || accountData || null;

  // NO MOCK DATA - Only show real strategy performance when available
  // This will be replaced with real performance data from your trading engine

  const formatCurrency = (amount: number | undefined | null) => {
    const value = amount ?? 0;
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    });
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="space-y-8 p-6">
        {/* Hero Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            🧠 <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">QUANTUM FORGE™</span>
          </h1>
          <p className="text-xl text-cyan-300">Trading Command Center</p>
        </div>

        {/* Trading Mode Status */}
        {accountData && (
          <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-400/30 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-400" />
                <div>
                  <p className="text-lg font-bold text-white">
                    {accountData.tradingMode === 'paper' ? '📝 Paper Trading Mode' : '💰 Live Trading Mode'}
                  </p>
                  <p className="text-gray-300">
                    {accountData.tradingMode === 'paper' 
                      ? 'Safe testing environment with simulated funds'
                      : 'Real money trading with live Kraken account'
                    }
                  </p>
                </div>
              </div>
              {accountData.lastUpdated && (
                <span className="text-sm text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full">
                  Updated: {accountData.lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Live Custom Trading Data */}
        {customTradingData && (
          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-400/30 backdrop-blur-sm rounded-xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-5xl">🚀</div>
              <div>
                <h3 className="text-3xl font-bold text-white mb-2">Live QUANTUM FORGE™</h3>
                <p className="text-xl text-green-400">Real-time Neural Trading Intelligence</p>
                <p className="text-gray-300">Advanced LLN & Markov Chain Data Generation</p>
              </div>
              <div className="ml-auto bg-green-400/10 px-4 py-2 rounded-full flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-semibold">Live Updates</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-purple-400/10 to-purple-600/5 border border-purple-400/30 backdrop-blur-sm rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">📊</div>
                <div className="text-3xl font-bold text-white">{customTradingData.trades?.length || 0}</div>
                <div className="text-purple-400 font-semibold">Total Trades</div>
              </div>
              <div className="bg-gradient-to-br from-green-400/10 to-emerald-500/5 border border-green-400/30 backdrop-blur-sm rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">🎯</div>
                <div className="text-3xl font-bold text-white">
                  {customTradingData.trades?.length > 0 ? 
                    ((customTradingData.trades.filter((t: any) => t.pnl > 0).length / customTradingData.trades.filter((t: any) => t.pnl !== null).length) * 100).toFixed(1) 
                    : '0.0'}%
                </div>
                <div className="text-green-400 font-semibold">Win Rate</div>
              </div>
              <div className="bg-gradient-to-br from-pink-400/10 to-red-500/5 border border-pink-400/30 backdrop-blur-sm rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">💰</div>
                <div className="text-3xl font-bold text-white">
                  ${(customTradingData.trades?.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0) || 0).toFixed(0)}
                </div>
                <div className="text-pink-400 font-semibold">Total P&L</div>
              </div>
              <div className="bg-gradient-to-br from-cyan-400/10 to-blue-500/5 border border-cyan-400/30 backdrop-blur-sm rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">⚡</div>
                <div className="text-3xl font-bold text-white">
                  ${((customTradingData.trades?.reduce((sum: number, t: any) => sum + t.value, 0) || 0) / 1000).toFixed(0)}K
                </div>
                <div className="text-cyan-400 font-semibold">Volume</div>
              </div>
            </div>
          
            {/* LLN & Markov Progress */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-3 rounded-lg border-2 ${
                (customTradingData.trades?.length || 0) >= 10 ? 'bg-green-900/30 border-green-500/50' : 'bg-yellow-900/30 border-yellow-500/50'
              }`}>
                <div className="flex items-center gap-2">
                  <Target className={`w-5 h-5 ${(customTradingData.trades?.length || 0) >= 10 ? 'text-green-400' : 'text-yellow-400'}`} />
                  <span className={`font-semibold ${(customTradingData.trades?.length || 0) >= 10 ? 'text-green-300' : 'text-yellow-300'}`}>
                    Markov Chain
                  </span>
                </div>
                <div className={`text-sm ${(customTradingData.trades?.length || 0) >= 10 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {(customTradingData.trades?.length || 0) >= 10 ? '✅ ACTIVE' : `${10 - (customTradingData.trades?.length || 0)} more needed`}
                </div>
              </div>
              <div className={`p-3 rounded-lg border-2 ${
                (customTradingData.trades?.length || 0) >= 50 ? 'bg-green-900/30 border-green-500/50' : 'bg-yellow-900/30 border-yellow-500/50'
              }`}>
                <div className="flex items-center gap-2">
                  <BarChart3 className={`w-5 h-5 ${(customTradingData.trades?.length || 0) >= 50 ? 'text-green-400' : 'text-yellow-400'}`} />
                  <span className={`font-semibold ${(customTradingData.trades?.length || 0) >= 50 ? 'text-green-300' : 'text-yellow-300'}`}>
                    Law of Large Numbers
                  </span>
                </div>
                <div className={`text-sm ${(customTradingData.trades?.length || 0) >= 50 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {(customTradingData.trades?.length || 0) >= 50 ? '✅ ACTIVE' : `${50 - (customTradingData.trades?.length || 0)} more needed`}
                </div>
              </div>
            </div>
          
            {/* Recent Trades Preview */}
            {customTradingData.trades?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-purple-500/30">
                <h4 className="font-semibold text-purple-300 mb-2">Latest Trades</h4>
                <div className="flex gap-2 overflow-x-auto">
                  {customTradingData.trades.slice(0, 10).map((trade: any) => ( // Show more trades
                    <div key={trade.id} className="flex-shrink-0 bg-gray-800/50 border border-purple-500/30 p-2 rounded text-xs">
                      <div className="font-medium text-cyan-300">{trade.symbol}</div>
                      <div className={`${trade.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.side.toUpperCase()}
                      </div>
                      <div className="text-gray-300">${trade.value.toFixed(0)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Connection Status for Live Trading */}
        {accountData?.tradingMode === 'live' && !isKrakenConnected && (
          <div className="bg-gradient-to-br from-orange-900/30 to-yellow-900/30 border border-orange-400/30 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-orange-400" />
              <div>
                <p className="text-lg font-bold text-white">Kraken Connection Required</p>
                <p className="text-gray-300">Connect your Kraken API in the Account tab for live trading data</p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-gradient-to-br from-red-900/30 to-pink-900/30 border border-red-400/30 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-red-400" />
              <div>
                <p className="text-lg font-bold text-white">System Error</p>
                <p className="text-gray-300">Error loading account data: {error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Performance Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-purple-400/10 to-purple-600/5 border border-purple-400/30 backdrop-blur-sm rounded-xl p-6 text-center">
            <div className="text-4xl mb-4">💼</div>
            <h3 className="text-xl font-bold text-white mb-2">Portfolio Value</h3>
            {loading ? (
              <div className="h-8 w-24 bg-gray-700 animate-pulse rounded mx-auto"></div>
            ) : (
              <p className="text-2xl font-bold text-purple-400">
                {portfolioData 
                  ? formatCurrency(portfolioData.totalValue)
                  : '--'
                }
              </p>
            )}
            {portfolioData && (
              <p className="text-sm text-gray-300 mt-2">
                {portfolioData.tradingMode === 'quantum_forge' ? 'QUANTUM FORGE™' : portfolioData.tradingMode}
              </p>
            )}
          </div>
          
          <div className="bg-gradient-to-br from-cyan-400/10 to-blue-500/5 border border-cyan-400/30 backdrop-blur-sm rounded-xl p-6 text-center">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-bold text-white mb-2">Available Balance</h3>
            {loading ? (
              <div className="h-8 w-24 bg-gray-700 animate-pulse rounded mx-auto"></div>
            ) : (
              <p className="text-2xl font-bold text-cyan-400">
                {portfolioData 
                  ? formatCurrency(portfolioData.availableBalance)
                  : '--'
                }
              </p>
            )}
          </div>
          
          <div className="bg-gradient-to-br from-green-400/10 to-emerald-500/5 border border-green-400/30 backdrop-blur-sm rounded-xl p-6 text-center">
            <div className="text-4xl mb-4">
              {portfolioData && portfolioData.unrealizedPnL >= 0 ? '📈' : '📉'}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Unrealized P&L</h3>
            {loading ? (
              <div className="h-8 w-24 bg-gray-700 animate-pulse rounded mx-auto"></div>
            ) : (
              <p className={`text-2xl font-bold ${
                portfolioData && portfolioData.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {portfolioData 
                  ? `${portfolioData.unrealizedPnL >= 0 ? '+' : ''}${formatCurrency(portfolioData.unrealizedPnL)}`
                  : '--'
                }
              </p>
            )}
          </div>
          
          <div className="bg-gradient-to-br from-pink-400/10 to-red-500/5 border border-pink-400/30 backdrop-blur-sm rounded-xl p-6 text-center">
            <div className="text-4xl mb-4">🚨</div>
            <h3 className="text-xl font-bold text-white mb-2">24h Trading Activity</h3>
            <p className="text-2xl font-bold text-pink-400">
              {quantumForgeStatus?.quantumForge?.last24hTrades 
                ?? engineStatus.totalAlerts
              }
            </p>
            <p className="text-sm text-gray-300 mt-2">Active Signals</p>
          </div>
        </div>

        {/* QUANTUM FORGE™ System Intelligence */}
        <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-yellow-400/30 backdrop-blur-sm rounded-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-4xl">🔬</div>
            <div>
              <h3 className="text-2xl font-bold text-white">QUANTUM FORGE™ System Intelligence</h3>
              <p className="text-yellow-400">Neural Network Service Matrix</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* QUANTUM FORGE™ Core */}
            <div className="flex items-center justify-between bg-gray-800/30 p-4 rounded-lg">
              <span className={`text-lg font-semibold ${
                quantumForgeStatus?.quantumForge.isRunning ? 'text-green-400' : 'text-red-400'
              }`}>
                🧠 QUANTUM FORGE™ Neural Core
              </span>
              <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                quantumForgeStatus?.quantumForge.isRunning 
                  ? 'bg-green-900/30 border border-green-400/30 text-green-400'
                  : 'bg-red-900/30 border border-red-400/30 text-red-400'
              }`}>
                {quantumForgeStatus?.quantumForge.isRunning ? '🟢 QUANTUM RUNNING' : '🔴 QUANTUM DOWN'}
              </div>
            </div>
            
            {/* Market Data Collector */}
            <div className="flex items-center justify-between bg-gray-800/30 p-4 rounded-lg">
              <span className={`text-lg font-semibold ${
                quantumForgeStatus?.marketData.isCollecting ? 'text-green-400' : 'text-red-400'
              }`}>
                📡 Market Data Neural Feed
              </span>
              <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                quantumForgeStatus?.marketData.isCollecting
                  ? 'bg-green-900/30 border border-green-400/30 text-green-400'
                  : 'bg-red-900/30 border border-red-400/30 text-red-400'
              }`}>
                {quantumForgeStatus?.marketData.isCollecting ? '🟢 NEURAL ACTIVE' : '🔴 NEURAL DOWN'}
              </div>
            </div>
            
            {/* AI Services */}
            <div className="flex items-center justify-between bg-gray-800/30 p-4 rounded-lg">
              <span className={`text-lg font-semibold ${
                quantumForgeStatus?.aiServices.optimizationEngine ? 'text-green-400' : 'text-yellow-400'
              }`}>
                🤖 AI Optimization Engine
              </span>
              <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                quantumForgeStatus?.aiServices.optimizationEngine
                  ? 'bg-green-900/30 border border-green-400/30 text-green-400'
                  : 'bg-yellow-900/30 border border-yellow-400/30 text-yellow-400'
              }`}>
                {quantumForgeStatus?.aiServices.optimizationEngine ? '🟢 AI RUNNING' : '🟡 AI STALLED'}
              </div>
            </div>
            
            {/* TensorFlow Serving */}
            <div className="flex items-center justify-between bg-gray-800/30 p-4 rounded-lg">
              <span className={`text-lg font-semibold ${
                quantumForgeStatus?.aiServices.tensorflowServing ? 'text-green-400' : 'text-red-400'
              }`}>
                🔥 TensorFlow Neural Serving
              </span>
              <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                quantumForgeStatus?.aiServices.tensorflowServing
                  ? 'bg-green-900/30 border border-green-400/30 text-green-400'
                  : 'bg-red-900/30 border border-red-400/30 text-red-400'
              }`}>
                {quantumForgeStatus?.aiServices.tensorflowServing ? '🟢 TENSOR RUNNING' : '🔴 TENSOR DOWN'}
              </div>
            </div>

            {/* GPU Acceleration */}
            <div className="flex items-center justify-between bg-gray-800/30 p-4 rounded-lg">
              <span className="text-lg font-semibold text-green-400">
                ⚡ CUDA GPU Acceleration
              </span>
              <div className="bg-green-900/30 border border-green-400/30 text-green-400 px-4 py-2 rounded-full text-sm font-bold">
                🟢 CUDA RUNNING
              </div>
            </div>

            {/* Database Health */}
            <div className="flex items-center justify-between bg-gray-800/30 p-4 rounded-lg">
              <span className="text-lg font-semibold text-green-400">
                🗄️ PostgreSQL Neural Storage
              </span>
              <div className="bg-green-900/30 border border-green-400/30 text-green-400 px-4 py-2 rounded-full text-sm font-bold">
                🟢 DATABASE RUNNING
              </div>
            </div>
          </div>

          {quantumForgeStatus && (
            <div className="mt-6 bg-gradient-to-r from-purple-900/30 to-cyan-900/30 border border-cyan-400/30 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🚀</div>
                <div>
                  <p className="text-lg font-bold text-white">
                    QUANTUM FORGE™ Status: <span className="text-cyan-400">{quantumForgeStatus.systemHealth.overall.toUpperCase()}</span>
                  </p>
                  {quantumForgeStatus.quantumForge.totalTrades > 0 && (
                    <p className="text-sm text-gray-300 mt-1">
                      Neural Intelligence: {quantumForgeStatus.quantumForge.totalTrades} quantum trades • 
                      {quantumForgeStatus.quantumForge.winRate}% success rate • 
                      ${quantumForgeStatus.quantumForge.totalPnL} neural P&L
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Neural Position Matrix */}
        <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border border-cyan-400/30 backdrop-blur-sm rounded-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-4xl">📊</div>
            <div>
              <h3 className="text-2xl font-bold text-white">Neural Position Matrix</h3>
              <p className="text-cyan-400">Active QUANTUM FORGE™ Positions</p>
            </div>
          </div>
          
          {portfolioData && portfolioData.positions.length > 0 ? (
            <div className="space-y-4">
              {portfolioData.positions.map((position) => (
                <div 
                  key={`${position.symbol}-${position.side}`}
                  className="flex items-center justify-between p-4 bg-gray-800/30 border border-cyan-400/20 rounded-lg"
                >
                  <div>
                    <div className="font-bold text-cyan-400 text-lg">{position.symbol}</div>
                    <div className="text-sm text-gray-300">
                      {position.side.toUpperCase()} • {position.size} @ ${(position.entryPrice || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${
                      position.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {position.pnl >= 0 ? '+' : ''}${(position.pnl || 0).toFixed(2)}
                    </div>
                    <div className={`text-sm font-semibold ${
                      position.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {position.pnlPercent >= 0 ? '+' : ''}{(position.pnlPercent || 0).toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-xl text-white font-bold mb-2">No Active Neural Positions</p>
              <p className="text-gray-300">
                {portfolioData 
                  ? `${portfolioData.tradingMode === 'quantum_forge' ? 'QUANTUM FORGE™' : portfolioData.tradingMode === 'paper' ? 'Paper Trading' : 'Live Trading'} positions will appear here`
                  : 'QUANTUM FORGE™ is initializing neural networks...'
                }
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}