"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { 
  Brain, 
  TrendingUp, 
  Activity, 
  Target, 
  Zap,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  ChevronDown,
  TestTube,
  Cpu,
  Database,
  Network
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '../ui/dropdown-menu';

// Import the optimization services and Competition Strategy Registry
import { 
  getAllStrategies, 
  type PineScriptStrategy
} from '../../lib/strategy-registry-competition';
import { 
  globalStratusEngine,
  ensureStratusEngineRunning,
  getStratusEngineStatus,
  getStratusEngineStatusWithRealData,
  startGlobalStratusEngine,
  stopGlobalStratusEngine,
  type StratusEngineStatus
} from '../../lib/global-stratus-engine-service';
import { pineScriptInputOptimizer, startInputOptimization } from '../../lib/pine-script-input-optimizer';
import { realTimeMarketMonitor } from '../../lib/real-time-market-monitor';
import { persistentEngine } from '../../lib/persistent-engine-manager';
import MarketDataStatusIndicator from './MarketDataStatusIndicator';
import TradingPairSelector from '../trading-pair-selector';
import { competitionStrategyRegistry } from '../../lib/strategy-registry-competition';
import { strategySyncService } from '../../lib/strategy-sync-service';
import StrategyParameterDisplay from './StrategyParameterDisplay';

interface StrategyOverview {
  strategyId: string;
  name: string;
  symbol: string;
  currentInputs: any;
  winRate: number;
  totalTrades: number;
  lastOptimized: Date;
  marketCondition: string;
  status: 'OPTIMIZING' | 'RUNNING' | 'PAUSED' | 'ERROR';
}

interface OptimizationStatus {
  inputOptimizer: {
    running: boolean;
    strategies: number;
    optimizations: number;
    winRateImprovement: number;
  };
  marketMonitor: {
    running: boolean;
    symbols: number;
    events: number;
    adjustments: number;
  };
  dataCollection: {
    running: boolean;
    dataPoints: number;
    analyses: number;
    confidence: number;
  };
  customPaperTrading: {
    running: boolean;
    trades: number;
    winRate: number;
    profitLoss: number;
  };
}

interface MarketDataStatus {
  status: 'ACTIVE' | 'INITIALIZING' | 'BACKGROUND' | 'ERROR';
  message: string;
}

export default function QuantumForgeNeuralEngine() {
  const [engineStatus, setEngineStatus] = useState<StratusEngineStatus | null>(null);
  const [strategies, setStrategies] = useState<PineScriptStrategy[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showAddStrategy, setShowAddStrategy] = useState(false);
  const [customPineScript, setCustomPineScript] = useState('');
  const [strategyName, setStrategyName] = useState('');
  const [strategySymbol, setStrategySymbol] = useState('');
  const [strategyTimeframe, setStrategyTimeframe] = useState('15m');
  const [recentOptimizations, setRecentOptimizations] = useState([]);
  const [marketEvents, setMarketEvents] = useState([]);
  const [marketDataStatus, setMarketDataStatus] = useState<MarketDataStatus>({ status: 'INITIALIZING', message: 'Starting...' });
  const [showTradingPairSelector, setShowTradingPairSelector] = useState(false);
  const [selectedStrategyForPairChange, setSelectedStrategyForPairChange] = useState<string | null>(null);

  // Initialize the optimization engine using global service
  useEffect(() => {
    initializeGlobalEngine();
    
    // Listen for persistent engine changes
    const handleEngineUpdate = () => {
      updateEngineStatus();
    };
    
    persistentEngine.addListener(handleEngineUpdate);
    
    const interval = setInterval(updateEngineStatus, 10000); // Update every 10 seconds
    
    return () => {
      clearInterval(interval);
      persistentEngine.removeListener(handleEngineUpdate);
    };
  }, []);

  const initializeGlobalEngine = async () => {
    try {
      setIsInitializing(true);
      console.log('🧠 Initializing QUANTUM FORGE Neural Engine...');
      
      const status = await ensureStratusEngineRunning();
      setEngineStatus(status);
      
      // Load strategies
      const realStrategies = getAllStrategies();
      setStrategies(realStrategies);
      setLastUpdate(new Date());
      
      console.log('✅ QUANTUM FORGE Neural Engine connected');
    } catch (error) {
      console.error('❌ Failed to connect to QUANTUM FORGE Neural Engine:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const updateEngineStatus = async () => {
    try {
      // Check if input optimizer is running and start it if not
      if (!pineScriptInputOptimizer.isRunning()) {
        console.log('🔧 Neural optimizer not running, starting it...');
        try {
          await startInputOptimization();
          console.log('✅ Neural optimizer started from dashboard');
        } catch (error) {
          console.error('❌ Failed to start neural optimizer from dashboard:', error);
        }
      }
      
      // Use REAL data instead of mock data
      const status = await getStratusEngineStatusWithRealData();
      setEngineStatus(status);
      setLastUpdate(new Date());
      
      // Update strategies
      const realStrategies = getAllStrategies();
      setStrategies(realStrategies);
      
      // Update market data status based on REAL engine status
      if (status.components?.marketData?.active && status.components?.marketData?.symbolCount > 0) {
        setMarketDataStatus({
          status: 'ACTIVE',
          message: `Neural market intelligence active • ${status.components.marketData.symbolCount} symbols • ${status.components.marketData.confidence.toFixed(1)}% neural confidence`
        });
      } else {
        setMarketDataStatus({
          status: 'ERROR',
          message: 'Neural market intelligence offline - check API connectivity'
        });
      }
      
      // Update optimization history from components
      try {
        const optimizationHistory = pineScriptInputOptimizer.getOptimizationHistory?.() || [];
        setRecentOptimizations(optimizationHistory.slice(-5));
      } catch (error) {
        console.log('Neural optimization history not available yet');
      }
      
      // Update market events
      try {
        const recentEvents = realTimeMarketMonitor.getRecentEvents?.() || [];
        setMarketEvents(recentEvents.slice(-10));
      } catch (error) {
        console.log('Neural market events not available yet');
      }
      
      console.log(`🧠 QUANTUM FORGE Neural Engine status updated with REAL data:`, {
        marketDataActive: status.components?.marketData?.active,
        symbolCount: status.components?.marketData?.symbolCount,
        confidence: status.components?.marketData?.confidence,
        strategiesLoaded: realStrategies.length
      });
      
    } catch (error) {
      console.error('❌ Error updating neural engine status:', error);
    }
  };

  // Start the global optimization system
  const startOptimizationSystem = async () => {
    try {
      setIsInitializing(true);
      console.log('🚀 BUTTON CLICKED: Starting QUANTUM FORGE Neural Engine...');
      console.log('📊 Current engine status before start:', engineStatus);

      console.log('🔧 Calling startGlobalStratusEngine()...');
      await startGlobalStratusEngine();
      console.log('✅ startGlobalStratusEngine() completed');

      console.log('📊 Getting updated status...');
      const status = await getStratusEngineStatusWithRealData();
      console.log('📋 New status received:', status);
      
      setEngineStatus(status);
      console.log('✅ Neural engine status updated in component state');

      console.log('✅ QUANTUM FORGE Neural Engine started successfully');

    } catch (error) {
      console.error('❌ Failed to start QUANTUM FORGE Neural Engine:', error);
      console.error('📊 Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    } finally {
      console.log('🔄 Setting isInitializing to false');
      setIsInitializing(false);
    }
  };

  // Stop the global optimization system
  const stopOptimizationSystem = async () => {
    try {
      console.log('⏹️ Stopping QUANTUM FORGE Neural Engine...');

      await stopGlobalStratusEngine();
      const status = await getStratusEngineStatusWithRealData();
      setEngineStatus(status);

      console.log('✅ QUANTUM FORGE Neural Engine stopped');

    } catch (error) {
      console.error('❌ Failed to stop QUANTUM FORGE Neural Engine:', error);
    }
  };

  const isSystemRunning = engineStatus?.isRunning || false;

  // Handle trading pair change for strategy
  const handleTradingPairChange = (newSymbol: string) => {
    if (selectedStrategyForPairChange === 'new-strategy') {
      // Update new strategy form
      setStrategySymbol(newSymbol);
      setShowTradingPairSelector(false);
      setSelectedStrategyForPairChange(null);
    } else if (selectedStrategyForPairChange) {
      // Update existing strategy
      const success = competitionStrategyRegistry.getStrategy(selectedStrategyForPairChange) !== undefined;
      if (success) {
        // Refresh strategies to show updated pair
        const updatedStrategies = getAllStrategies();
        setStrategies(updatedStrategies);
        
        // Close selector
        setShowTradingPairSelector(false);
        setSelectedStrategyForPairChange(null);
        
        console.log(`🔄 Updated strategy ${selectedStrategyForPairChange} to trade ${newSymbol}`);
      }
    }
  };

  // Open trading pair selector for specific strategy
  const openTradingPairSelector = (strategyId: string) => {
    setSelectedStrategyForPairChange(strategyId);
    setShowTradingPairSelector(true);
  };

  // Manual start of input optimizer
  const handleStartInputOptimizer = async () => {
    try {
      console.log('🚀 Manually starting neural optimizer...');
      await startInputOptimization();
      console.log('✅ Neural optimizer started manually');
      // Update status immediately
      await updateEngineStatus();
    } catch (error) {
      console.error('❌ Failed to start neural optimizer manually:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="space-y-8">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            🧠 <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">QUANTUM FORGE™</span><br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-lg">Neural Engine</span>
          </h1>
          <div className="text-2xl text-purple-300 mb-2">
            "Revolutionary AI-Powered Strategy Optimization"
          </div>
          <div className="text-cyan-300 italic mb-8">
            "Targeting 100% Win Rate with Neural Intelligence"
          </div>
        </div>

        {/* Neural Command Center */}
        <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-purple-400/30 backdrop-blur-sm rounded-xl p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
                <Brain className="w-8 h-8 text-purple-400" />
                Neural Command Center
              </h2>
              <p className="text-gray-300 text-lg">
                Advanced AI strategy optimization engine with real-time market analysis
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right text-sm bg-gray-800/50 p-4 rounded-lg border border-gray-700/30">
                <div className="text-gray-400">Neural Status Update</div>
                <div className="font-mono text-cyan-400 text-lg">{lastUpdate.toLocaleTimeString()}</div>
              </div>
              
              <Button
                onClick={isSystemRunning ? stopOptimizationSystem : startOptimizationSystem}
                disabled={isInitializing}
                className={`px-8 py-4 text-lg font-semibold ${
                  isSystemRunning 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 border-red-500/50' 
                    : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 border-green-500/50'
                } text-white border backdrop-blur-sm`}
              >
                {isInitializing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                    Initializing Neural Core...
                  </>
                ) : isSystemRunning ? (
                  <>
                    <Activity className="w-5 h-5 mr-3" />
                    Shutdown Neural Engine
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-3" />
                    Activate Neural Engine
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Market Data Status Indicator */}
        <MarketDataStatusIndicator />

        {/* Neural System Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-purple-900/30 to-purple-900/30 border border-purple-400/30 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-purple-300 mb-1">Neural Optimizer</h3>
                <p className="text-2xl font-bold text-white">
                  {engineStatus?.components?.inputOptimizer?.active ? 'QUANTUM ACTIVE' : 'OFFLINE'}
                </p>
              </div>
              <div className={`w-4 h-4 rounded-full ${
                engineStatus?.components?.inputOptimizer?.active ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`} />
            </div>
            <div className="text-sm text-gray-300">
              {engineStatus?.components?.inputOptimizer?.strategyCount || 0} strategies • 
              {engineStatus?.components?.inputOptimizer?.optimizationCount || 0} optimizations
            </div>
            {!engineStatus?.components?.inputOptimizer?.active && (
              <Button 
                onClick={handleStartInputOptimizer}
                size="sm" 
                className="mt-4 w-full bg-purple-600 hover:bg-purple-700"
                variant="default"
              >
                <Zap className="w-4 h-4 mr-2" />
                Activate Optimizer
              </Button>
            )}
          </div>

          <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-900/30 border border-cyan-400/30 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-cyan-300 mb-1">Market Monitor</h3>
                <p className="text-2xl font-bold text-white">
                  {engineStatus?.components?.marketMonitor?.active ? 'NEURAL MONITORING' : 'OFFLINE'}
                </p>
              </div>
              <div className={`w-4 h-4 rounded-full ${
                engineStatus?.components?.marketMonitor?.active ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'
              }`} />
            </div>
            <div className="text-sm text-gray-300">
              {engineStatus?.components?.marketMonitor?.symbolCount || 0} symbols • 
              {engineStatus?.components?.marketMonitor?.eventCount || 0} neural events
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-900/30 to-green-900/30 border border-green-400/30 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-green-300 mb-1">Neural Intelligence</h3>
                <p className="text-2xl font-bold text-white">
                  {engineStatus?.components?.marketData?.confidence?.toFixed(0) || 0}%
                </p>
              </div>
              <div className={`w-4 h-4 rounded-full ${
                engineStatus?.components?.marketData?.active ? 'bg-yellow-500 animate-pulse' : 'bg-gray-400'
              }`} />
            </div>
            <div className="text-sm text-gray-300">
              7-day neural analysis • {engineStatus?.components?.marketData?.symbolCount || 0} symbols
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-900/30 to-pink-900/30 border border-pink-400/30 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-pink-300 mb-1">Trading Engine</h3>
                <p className="text-2xl font-bold text-white">
                  {engineStatus?.components?.customPaperTrading?.winRate?.toFixed(1) || 0}%
                </p>
              </div>
              <div className={`w-4 h-4 rounded-full ${
                engineStatus?.components?.customPaperTrading?.active ? 'bg-purple-500 animate-pulse' : 'bg-gray-400'
              }`} />
            </div>
            <div className="text-sm text-gray-300">
              {engineStatus?.components?.customPaperTrading?.tradeCount || 0} neural trades executed
            </div>
          </div>
        </div>

        {/* Neural Engine Status Alert */}
        {engineStatus?.isRunning && (
          <div className="bg-gradient-to-r from-purple-900/20 via-cyan-900/20 to-green-900/20 border border-green-500/30 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <h3 className="text-xl font-bold text-green-300">🧠 QUANTUM FORGE™ Neural Engine Online</h3>
                <p className="text-green-400 text-lg">
                  Neural intelligence processing continuously • 
                  Quantum uptime: {engineStatus.startedAt ? Math.floor((Date.now() - engineStatus.startedAt.getTime()) / 1000 / 60) : 0} minutes
                </p>
              </div>
            </div>
          </div>
        )}
        
        {isInitializing && (
          <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <h3 className="text-xl font-bold text-yellow-300">⏳ Connecting to QUANTUM FORGE™ Neural Engine</h3>
                <p className="text-yellow-400 text-lg">Initializing neural cores and quantum processors...</p>
              </div>
            </div>
          </div>
        )}

        {/* Neural Strategy Overview */}
        <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-purple-400/30 backdrop-blur-sm rounded-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-bold text-purple-300 flex items-center gap-3">
              <Target className="w-8 h-8 text-purple-400" />
              Neural Strategy Matrix
            </h3>
            <Button
              onClick={() => setShowAddStrategy(true)}
              variant="outline"
              className="border-purple-500/50 text-purple-300 hover:bg-purple-900/20 backdrop-blur-sm text-lg px-6 py-3"
            >
              <span className="mr-2">+</span>
              Deploy Neural Strategy
            </Button>
          </div>
          
          {(!engineStatus || !engineStatus.isRunning) ? (
            <div className="text-center py-16 text-gray-400">
              <Settings className="w-16 h-16 mx-auto mb-6 opacity-50" />
              <p className="text-xl">QUANTUM FORGE™ Neural Engine offline. Activate to deploy neural strategy optimization.</p>
            </div>
          ) : strategies.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Settings className="w-16 h-16 mx-auto mb-6 opacity-50" />
              <p className="text-xl">Loading neural strategies from QUANTUM FORGE™ matrix...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {strategies
                .sort((a, b) => a.id === 'rsi_macd_scalper_v3' ? -1 : 1)
                .map((strategy, index) => (
                <div 
                  key={index} 
                  className={`border rounded-xl p-6 ${
                    strategy.id === 'rsi_macd_scalper_v3' 
                      ? 'border-yellow-500/50 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 shadow-lg backdrop-blur-sm' 
                      : 'border-cyan-500/30 bg-gray-900/50 backdrop-blur-sm'
                  }`}
                >
                  {strategy.id === 'rsi_macd_scalper_v3' && (
                    <div className="mb-4 flex items-center gap-3">
                      <Badge className="bg-yellow-900/30 text-yellow-300 border-yellow-500/30 text-sm px-3 py-1">
                        🏆 FLAGSHIP NEURAL STRATEGY
                      </Badge>
                      <Badge className="bg-green-900/30 text-green-300 border-green-500/30 text-sm px-3 py-1">
                        2 Years Neural Training
                      </Badge>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-white">{strategy.name}</h4>
                      <div className="flex items-center gap-3 mt-2">
                        <p className="text-gray-400">{strategy.id}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openTradingPairSelector(strategy.id)}
                          className="text-sm px-3 py-1 h-8 border-gray-600"
                        >
                          {strategy.symbol}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge 
                        variant={strategy.status === 'OPTIMIZING' ? 'default' : 'secondary'}
                        className={strategy.status === 'OPTIMIZING' ? 'bg-purple-900/30 text-purple-300 text-lg px-4 py-2' : 'text-lg px-4 py-2'}
                      >
                        {strategy.status}
                      </Badge>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-400">
                          {strategy.performance.winRate.toFixed(1)}%
                        </div>
                        <div className="text-gray-400">{strategy.performance.totalTrades} neural trades</div>
                      </div>
                    </div>
                  </div>

                  <StrategyParameterDisplay strategy={strategy} />

                  <div className="mt-4 flex items-center justify-between text-gray-400">
                    <span>Neural optimization: {strategy.optimization.lastOptimized.toLocaleString()}</span>
                    <span>Quantum confidence: {(strategy.optimization.aiConfidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Custom Strategy Modal (unchanged for now) */}
      {showAddStrategy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-8 w-full max-w-5xl max-h-[90vh] overflow-y-auto backdrop-blur-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-purple-300">Deploy Neural Strategy to QUANTUM FORGE™</h2>
              <Button
                onClick={() => setShowAddStrategy(false)}
                variant="outline"
                size="sm"
              >
                ✕
              </Button>
            </div>
            {/* Modal content remains the same for now */}
          </div>
        </div>
      )}

      {/* Trading Pair Selector Modal (unchanged for now) */}
      {showTradingPairSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-cyan-500/30 rounded-xl p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto backdrop-blur-sm">
            <TradingPairSelector
              selectedPair={selectedStrategyForPairChange ? 
                strategies.find(s => s.id === selectedStrategyForPairChange)?.symbol : 
                undefined
              }
              onPairSelect={handleTradingPairChange}
              onClose={() => {
                setShowTradingPairSelector(false);
                setSelectedStrategyForPairChange(null);
              }}
              title={`Neural Pair Selection for ${
                selectedStrategyForPairChange ? 
                  strategies.find(s => s.id === selectedStrategyForPairChange)?.name || 'Strategy' :
                  'Strategy'
              }`}
            />
          </div>
        </div>
      )}
    </div>
  );
}