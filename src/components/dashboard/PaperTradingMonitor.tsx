"use client";

/**
 * DEPRECATED: Legacy Paper Trading Monitor
 * 
 * This component has been replaced by the new PaperTradingDashboard.
 * Please use @/components/paper-trading-dashboard instead.
 * 
 * The new component provides:
 * ✅ Real Alpaca paper trading integration
 * ✅ Automated account cycling
 * ✅ Real market data
 * ✅ Better UI/UX
 * ✅ Database persistence
 */

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  DollarSign,
  BarChart3,
  Brain,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  Play,
  Square,
  Zap
} from 'lucide-react';
import PositionCleanupModal from './PositionCleanupModal';
import { cleanTestingService, type CleanTestingSession } from '../../lib/clean-testing-service';
import { stratusEngine, getAITradingSignal, type AITradingDecision } from '../../lib/stratus-engine-ai';
import { marketIntelligence, startIntelligenceCapture, getQuickTradingAdjustments } from '../../lib/market-intelligence-service';
import { alpacaPaperTradingService, paperAccountCyclingService, paperTradingEngine, getPaperAccount, startAIPaperTrading, type AlpacaPaperAccount, type PaperAccount } from '../../lib/paper-trading-engine';

interface StrategyPerformance {
  strategyId: string;
  name: string;
  status: 'running' | 'paused' | 'optimizing';
  mode: 'paper' | 'live';
  metrics: {
    winRate: number;
    totalTrades: number;
    wins: number;
    losses: number;
    totalProfit: number;
    avgProfitPerTrade: number;
    maxDrawdown: number;
    sharpeRatio: number;
    profitFactor: number;
    lastTradeTime?: string;
  };
  optimization: {
    currentParams: Record<string, any>;
    lastOptimization?: string;
    nextOptimization?: string;
    improvements: Array<{
      parameter: string;
      oldValue: any;
      newValue: any;
      timestamp: string;
    }>;
  };
  pineScriptVars: Record<string, any>;
}

export default function PaperTradingMonitor() {
  const [strategies, setStrategies] = useState<StrategyPerformance[]>([]);
  const [customTradingData, setCustomTradingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activityLog, setActivityLog] = useState<Array<{
    id: string;
    strategy: string;
    action: string;
    timestamp: Date;
    type: 'trade' | 'optimization' | 'webhook';
  }>>([]);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [openPositions, setOpenPositions] = useState<any[]>([]);
  const [selectedStrategyForTesting, setSelectedStrategyForTesting] = useState<string>('');
  const [activeCleanTestingSession, setActiveCleanTestingSession] = useState<string | null>(null);
  const [cleanTestingData, setCleanTestingData] = useState<CleanTestingSession | null>(null);
  const [aiDecisions, setAiDecisions] = useState<Map<string, AITradingDecision>>(new Map());
  const [stratusEngineActive, setStratusEngineActive] = useState<boolean>(false);
  const [aiPerformance, setAiPerformance] = useState<any>(null);
  const [paperAccount, setPaperAccount] = useState<PaperAccount | null>(null);
  const [paperTradingActive, setPaperTradingActive] = useState<boolean>(false);

  // REMOVED: simulateActivity() - NO FAKE ACTIVITY ALLOWED - ONLY REAL TRADING DATA

  // Check for open positions before starting strategy testing
  const handleStartTesting = async (strategyName: string) => {
    setSelectedStrategyForTesting(strategyName);
    
    try {
      const response = await fetch('/api/paper-trading/positions', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.hasOpenPositions) {
          setOpenPositions(data.positions);
          setShowPositionModal(true);
        } else {
          // No open positions, start testing directly
          startStrategyTesting(strategyName, false);
        }
      }
    } catch (error) {
      console.error('Failed to check open positions:', error);
      // If check fails, assume no positions and proceed
      startStrategyTesting(strategyName, false);
    }
  };

  // Handle position cleanup decision
  const handlePositionDecision = async (closePositions: boolean) => {
    setShowPositionModal(false);
    
    if (closePositions) {
      try {
        const response = await fetch('/api/paper-trading/positions', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'close_all',
            strategyName: selectedStrategyForTesting
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Positions closed:', result);
          
          // Add activity log entry
          const closeActivity = {
            id: Date.now().toString(),
            strategy: selectedStrategyForTesting,
            action: `Closed ${result.closedPositions} positions for clean testing`,
            timestamp: new Date(),
            type: 'trade' as const
          };
          setActivityLog(prev => [closeActivity, ...prev.slice(0, 9)]);
        }
      } catch (error) {
        console.error('Failed to close positions:', error);
      }
    }
    
    startStrategyTesting(selectedStrategyForTesting, closePositions);
  };

  // Initialize Stratus Engine AI
  const initializeStratusEngine = async () => {
    console.log('🚀 Initializing Stratus Engine AI...');
    setStratusEngineActive(true);
    
    // Start market intelligence capture for main trading pairs
    const symbols = ['BTCUSD', 'ETHUSD', 'ADAUSD'];
    await startIntelligenceCapture(symbols);
    
    // Get AI performance metrics
    const performance = stratusEngine.getPerformance();
    setAiPerformance(performance);
    
    // Start getting AI decisions for each symbol
    const decisions = new Map<string, AITradingDecision>();
    for (const symbol of symbols) {
      try {
        const decision = await getAITradingSignal(symbol);
        decisions.set(symbol, decision);
      } catch (error) {
        console.error(`Failed to get AI decision for ${symbol}:`, error);
      }
    }
    setAiDecisions(decisions);
    
    console.log('✅ Stratus Engine AI initialized with decisions for', decisions.size, 'symbols');
    
    // Start AI-driven paper trading
    if (!paperTradingActive) {
      await startAIPaperTrading(symbols);
      setPaperTradingActive(true);
      
      // Set up paper account listener
      paperTradingEngine.addListener((account: PaperAccount) => {
        console.log('🔄 Paper account updated in UI:', {
          totalBalance: `$${account.totalBalance.toFixed(2)}`,
          availableBalance: `$${account.availableBalance.toFixed(2)}`,
          positions: account.positions.length,
          trades: account.trades.length
        });
        setPaperAccount(account);
      });
      
      // Get initial account state
      const initialAccount = getPaperAccount();
      setPaperAccount(initialAccount);
      
      console.log('🚀 AI-driven paper trading started with account:', {
        totalBalance: `$${initialAccount.totalBalance.toFixed(2)}`,
        availableBalance: `$${initialAccount.availableBalance.toFixed(2)}`,
        positions: initialAccount.positions.length,
        trades: initialAccount.trades.length
      });
    }
  };

  // Start the actual strategy testing with AI enhancement
  const startStrategyTesting = async (strategyName: string, positionsClosed: boolean) => {
    console.log(`🚀 Starting AI-enhanced clean testing for strategy: ${strategyName}`);
    console.log(`📊 Positions were ${positionsClosed ? 'closed' : 'kept'} before testing`);
    
    // Initialize Stratus Engine if not already active
    if (!stratusEngineActive) {
      await initializeStratusEngine();
    }
    
    // Start clean testing session
    const sessionId = cleanTestingService.startCleanTestingSession(
      strategyName,
      positionsClosed,
      positionsClosed ? openPositions.length : 0,
      positionsClosed ? openPositions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0) : 0
    );
    
    setActiveCleanTestingSession(sessionId);
    
    // Load the session data
    const sessionData = cleanTestingService.getActiveSession(sessionId);
    setCleanTestingData(sessionData);
    
    // Add activity log entry
    const startActivity = {
      id: Date.now().toString(),
      strategy: strategyName,
      action: `🤖 Started AI-enhanced testing session ${sessionId.slice(-6)} ${positionsClosed ? '(positions closed)' : '(positions kept)'}`,
      timestamp: new Date(),
      type: 'optimization' as const
    };
    setActivityLog(prev => [startActivity, ...prev.slice(0, 9)]);
    
    console.log(`🧹 AI-enhanced clean testing session started: ${sessionId}`, {
      strategyName,
      positionsClosed,
      closedPositions: positionsClosed ? openPositions.length : 0,
      aiActive: stratusEngineActive
    });
  };

  // Fetch real data from API
  useEffect(() => {
    const fetchStrategyPerformance = async () => {
      try {
        const response = await fetch('/api/paper-trading/performance', {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch performance data');
        }
        
        const data = await response.json();
        
        if (data.strategies) {
          setStrategies(data.strategies);
        }
        
        // Update last refresh time
        setLastUpdate(new Date());
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch strategy performance:', error);
        
        // NO FAKE DATA FALLBACK - Show empty state if API fails
        setStrategies([]);
        setLoading(false);
      }
    };

    fetchStrategyPerformance();
    
    // Auto-refresh every 30 seconds
    const fetchInterval = autoRefresh ? setInterval(fetchStrategyPerformance, 30000) : null;
    
    return () => {
      if (fetchInterval) clearInterval(fetchInterval);
    };
  }, [autoRefresh]);

  // Fetch custom trading data
  useEffect(() => {
    const fetchCustomData = async () => {
      try {
        const response = await fetch('/api/custom-paper-trading/dashboard');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCustomTradingData(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch custom trading data:', error);
      }
    };

    fetchCustomData();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchCustomData, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Load clean testing service data and initialize paper trading on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      cleanTestingService.loadFromLocalStorage();
      
      // Check for any active sessions
      const activeSessions = cleanTestingService.getAllActiveSessions();
      if (activeSessions.length > 0) {
        const latestSession = activeSessions[0];
        setActiveCleanTestingSession(latestSession.id);
        setCleanTestingData(latestSession);
        console.log('📊 Loaded active clean testing session:', latestSession.id);
      }
      
      // Initialize paper trading account and set up listener
      const currentAccount = getPaperAccount();
      setPaperAccount(currentAccount);
      
      paperTradingEngine.addListener((account: PaperAccount) => {
        console.log('🔄 Paper account updated in UI (initial setup):', {
          totalBalance: `$${account.totalBalance.toFixed(2)}`,
          availableBalance: `$${account.availableBalance.toFixed(2)}`,
          positions: account.positions.length,
          trades: account.trades.length
        });
        setPaperAccount(account);
      });
      
      console.log('💰 Initialized paper trading account:', {
        totalBalance: `$${currentAccount.totalBalance.toFixed(2)}`,
        availableBalance: `$${currentAccount.availableBalance.toFixed(2)}`,
        positions: currentAccount.positions.length,
        trades: currentAccount.trades.length
      });
    }
  }, []);

  // Update clean testing data when active session changes
  useEffect(() => {
    if (activeCleanTestingSession) {
      const updateCleanTestingData = () => {
        const sessionData = cleanTestingService.getActiveSession(activeCleanTestingSession);
        if (sessionData) {
          setCleanTestingData(sessionData);
        }
      };
      
      updateCleanTestingData();
      const interval = setInterval(updateCleanTestingData, 2000); // Update every 2 seconds
      
      return () => clearInterval(interval);
    }
  }, [activeCleanTestingSession]);

  // Update AI decisions and performance periodically
  useEffect(() => {
    if (stratusEngineActive) {
      const updateAI = async () => {
        try {
          // Update AI performance
          const performance = stratusEngine.getPerformance();
          setAiPerformance(performance);
          
          // Update AI decisions for main symbols
          const symbols = ['BTCUSD', 'ETHUSD', 'ADAUSD'];
          const newDecisions = new Map<string, AITradingDecision>();
          
          for (const symbol of symbols) {
            try {
              const decision = await getAITradingSignal(symbol);
              newDecisions.set(symbol, decision);
            } catch (error) {
              console.error(`Failed to get AI decision for ${symbol}:`, error);
            }
          }
          
          setAiDecisions(newDecisions);
          
          // Add AI activity log
          const aiActivity = {
            id: Date.now().toString(),
            strategy: 'Stratus Engine',
            action: `🤖 AI analysis updated - ${newDecisions.size} signals generated`,
            timestamp: new Date(),
            type: 'optimization' as const
          };
          setActivityLog(prev => [aiActivity, ...prev.slice(0, 9)]);
          
        } catch (error) {
          console.error('Error updating AI decisions:', error);
        }
      };
      
      updateAI(); // Initial update
      const aiInterval = setInterval(updateAI, 30000); // Update every 30 seconds
      
      return () => clearInterval(aiInterval);
    }
  }, [stratusEngineActive]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'running': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'optimizing': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 70) return 'text-green-600';
    if (winRate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-gold-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Paper Trading Monitor</h2>
              <p className="text-gray-600">AI-Optimized Strategy Performance</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live</span>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-gold-600 focus:ring-gold-500"
              />
              <span className="text-sm text-gray-600">Auto-refresh</span>
            </label>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Clean Testing Status */}
        {cleanTestingData && (
          <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <h4 className="font-semibold text-green-800">Clean Testing Session Active</h4>
                  <p className="text-sm text-green-700">
                    Strategy: {cleanTestingData.strategyName} • 
                    Started: {cleanTestingData.startTime.toLocaleTimeString()} • 
                    {cleanTestingData.positionsClosed 
                      ? `${cleanTestingData.closedPositionsCount} positions closed`
                      : 'Existing positions kept'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-700">{cleanTestingData.metrics.trades}</div>
                  <div className="text-xs text-green-600">Trades</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    cleanTestingData.metrics.winRate >= 60 ? 'text-green-700' : 
                    cleanTestingData.metrics.winRate >= 40 ? 'text-yellow-700' : 'text-red-700'
                  }`}>
                    {cleanTestingData.metrics.winRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600">Win Rate</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    cleanTestingData.metrics.totalProfit >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    ${cleanTestingData.metrics.totalProfit.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600">P&L</div>
                </div>
                <button
                  onClick={() => {
                    if (activeCleanTestingSession) {
                      cleanTestingService.completeSession(activeCleanTestingSession);
                      setActiveCleanTestingSession(null);
                      setCleanTestingData(null);
                    }
                  }}
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors"
                >
                  End Session
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stratus Engine AI Status */}
        {stratusEngineActive && aiPerformance && (
          <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Brain className="w-6 h-6 text-purple-600 animate-pulse" />
                <div>
                  <h4 className="font-semibold text-purple-800 flex items-center gap-2">
                    🤖 Stratus Engine AI Active
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      v2.0
                    </span>
                  </h4>
                  <p className="text-sm text-purple-700">
                    AI Learning: {aiPerformance.learningIterations} iterations • 
                    Win Rate Target: {stratusEngine.getConfig().targetWinRate}% • 
                    Market Capture: {marketIntelligence.getActiveCaptureSymbols().length} symbols
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    aiPerformance.currentWinRate >= 80 ? 'text-green-700' : 
                    aiPerformance.currentWinRate >= 60 ? 'text-yellow-700' : 'text-red-700'
                  }`}>
                    {aiPerformance.currentWinRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-purple-600">AI Win Rate</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    aiPerformance.aiAccuracyScore >= 70 ? 'text-green-700' : 
                    aiPerformance.aiAccuracyScore >= 50 ? 'text-yellow-700' : 'text-red-700'
                  }`}>
                    {aiPerformance.aiAccuracyScore.toFixed(1)}%
                  </div>
                  <div className="text-xs text-purple-600">AI Accuracy</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    aiPerformance.totalProfit >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    ${aiPerformance.totalProfit.toFixed(2)}
                  </div>
                  <div className="text-xs text-purple-600">AI P&L</div>
                </div>
              </div>
            </div>
            
            {/* AI Trading Signals */}
            {aiDecisions.size > 0 && (
              <div className="mt-3 pt-3 border-t border-purple-200">
                <div className="text-sm font-medium text-purple-800 mb-2">🎯 Live AI Trading Signals:</div>
                <div className="flex gap-4">
                  {Array.from(aiDecisions.entries()).map(([symbol, decision]) => (
                    <div key={symbol} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-purple-100">
                      <span className="font-medium text-gray-700">{symbol?.replace('USD', '') || 'N/A'}</span>
                      <span className={`px-2 py-1 text-xs font-bold rounded ${
                        decision.decision === 'BUY' ? 'bg-green-100 text-green-700' :
                        decision.decision === 'SELL' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {decision.decision}
                      </span>
                      <span className="text-xs text-purple-600">
                        {(decision.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Paper Trading Account Status */}
        {paperAccount && (
          <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <h4 className="font-semibold text-green-800">💰 AI Paper Trading Account</h4>
                  <p className="text-sm text-green-700">
                    Active Positions: {paperAccount.positions.length} • 
                    Total Trades: {paperAccount.totalTrades} • 
                    Win Rate: {paperAccount.winRate.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">
                    ${paperAccount.totalBalance.toFixed(2)}
                  </div>
                  <div className="text-xs text-green-600">Total Balance</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-700">
                    ${paperAccount.availableBalance.toFixed(2)}
                  </div>
                  <div className="text-xs text-blue-600">Available</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    paperAccount.realizedPnL >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    ${paperAccount.realizedPnL >= 0 ? '+' : ''}${paperAccount.realizedPnL.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600">Realized P&L</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    paperAccount.unrealizedPnL >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    ${paperAccount.unrealizedPnL >= 0 ? '+' : ''}${paperAccount.unrealizedPnL.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600">Unrealized P&L</div>
                </div>
              </div>
            </div>
            
            {/* Recent Trades */}
            {paperAccount.trades.length > 0 && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <div className="text-sm font-medium text-green-800 mb-2">📈 Recent AI Trades:</div>
                <div className="flex gap-3 overflow-x-auto">
                  {paperTradingEngine.getRecentTrades(5).map((trade) => (
                    <div key={trade.id} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-green-100 min-w-fit">
                      <span className="font-medium text-gray-700">{trade.symbol?.replace('USD', '') || 'N/A'}</span>
                      <span className={`px-2 py-1 text-xs font-bold rounded ${
                        trade.side === 'BUY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {trade.side}
                      </span>
                      <span className="text-xs text-gray-600">
                        ${trade.price.toFixed(2)}
                      </span>
                      {trade.pnl !== undefined && (
                        <span className={`text-xs font-medium ${
                          trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live Custom Trading Engine Status */}
        {customTradingData && (
          <div className="mt-4 p-4 bg-gradient-to-r from-gold-50 to-green-50 border border-gold-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 text-gold-600 animate-pulse" />
                <div>
                  <h4 className="font-semibold text-gold-800">🚀 Live Custom Trading Engine</h4>
                  <p className="text-sm text-gold-700">
                    Real-time data generation for LLN & Markov optimization
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-700">{customTradingData.trades?.length || 0}</div>
                  <div className="text-xs text-blue-600">Live Trades</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-700">
                    {customTradingData.trades?.length > 0 ? 
                      ((customTradingData.trades.filter((t: any) => t.pnl > 0).length / customTradingData.trades.filter((t: any) => t.pnl !== null).length) * 100).toFixed(1) 
                      : '0.0'}%
                  </div>
                  <div className="text-xs text-green-600">Win Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-700">
                    ${(customTradingData.trades?.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0) || 0).toFixed(0)}
                  </div>
                  <div className="text-xs text-purple-600">P&L</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    (customTradingData.trades?.length || 0) >= 50 ? 'text-green-700' : 'text-yellow-700'
                  }`}>
                    {(customTradingData.trades?.length || 0) >= 50 ? 'LLN ACTIVE' : `${50 - (customTradingData.trades?.length || 0)} more`}
                  </div>
                  <div className="text-xs text-gray-600">LLN Status</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overall Statistics */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">AI Total Profit</p>
                <p className="text-2xl font-bold text-green-700">
                  ${paperAccount ? paperAccount.realizedPnL.toFixed(2) : strategies.reduce((sum, s) => sum + s.metrics.totalProfit, 0).toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Avg Win Rate</p>
                <p className="text-2xl font-bold text-blue-700">
                  {(strategies.reduce((sum, s) => sum + s.metrics.winRate, 0) / strategies.length).toFixed(1)}%
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Total Trades</p>
                <p className="text-2xl font-bold text-purple-700">
                  {strategies.reduce((sum, s) => sum + s.metrics.totalTrades, 0)}
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-600 opacity-50" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gold-50 to-gold-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gold-600 text-sm font-medium">Avg Sharpe</p>
                <p className="text-2xl font-bold text-gold-700">
                  {(strategies.reduce((sum, s) => sum + s.metrics.sharpeRatio, 0) / strategies.length).toFixed(2)}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-gold-600 opacity-50" />
            </div>
          </div>
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-gold-600" />
            <h3 className="text-xl font-bold text-gray-900">Live Activity Feed</h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Real-time updates</span>
          </div>
        </div>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {activityLog.length > 0 ? (
            activityLog.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-l-4 border-l-gold-500">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'trade' ? 'bg-green-500' :
                    activity.type === 'optimization' ? 'bg-blue-500' :
                    'bg-purple-500'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.strategy}</p>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {activity.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Waiting for trading activity...</p>
            </div>
          )}
        </div>
      </div>

      {/* Strategy Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {strategies.map((strategy) => (
          <div key={strategy.strategyId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Strategy Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg text-gray-900">{strategy.name}</h3>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(strategy.status)}`}>
                    {strategy.status.toUpperCase()}
                  </span>
                  {strategy.status === 'running' && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                  {strategy.status === 'optimizing' && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="bg-gray-100 px-2 py-1 rounded">Paper Mode</span>
                <span className="text-gray-400">ID: {strategy.strategyId}</span>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Win Rate</p>
                  <p className={`text-2xl font-bold ${getWinRateColor(strategy.metrics.winRate)}`}>
                    {strategy.metrics.winRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-400">{strategy.metrics.wins}W / {strategy.metrics.losses}L</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Profit</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${strategy.metrics.totalProfit.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400">Avg: ${strategy.metrics.avgProfitPerTrade.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Sharpe</p>
                  <p className="font-semibold">{strategy.metrics.sharpeRatio.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Profit Factor</p>
                  <p className="font-semibold">{strategy.metrics.profitFactor.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Max DD</p>
                  <p className="font-semibold text-red-600">-{strategy.metrics.maxDrawdown.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* AI Optimization Status */}
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-gold-600" />
                <h4 className="font-semibold text-sm text-gray-900">AI Optimization</h4>
              </div>
              
              <div className="space-y-2">
                <div className="text-xs">
                  <p className="text-gray-500 mb-1">Current Parameters:</p>
                  <div className="bg-white rounded p-2 font-mono text-xs">
                    {Object.entries(strategy.optimization.currentParams).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{key}:</span>
                        <span className="font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {strategy.optimization.improvements.length > 0 && (
                  <div className="text-xs">
                    <p className="text-gray-500 mb-1">Recent Optimizations:</p>
                    {strategy.optimization.improvements.slice(0, 2).map((imp, idx) => (
                      <div key={idx} className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        <span>{imp.parameter}: {imp.oldValue} → {imp.newValue}</span>
                      </div>
                    ))}
                  </div>
                )}

                {strategy.status === 'optimizing' && (
                  <div className="flex items-center gap-2 text-blue-600 text-xs">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                    <span>Optimizing parameters...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-gray-200 space-y-2">
              <button
                onClick={() => handleStartTesting(strategy.name)}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Clean Testing
              </button>
              <button
                onClick={() => setSelectedStrategy(strategy.strategyId)}
                className="w-full bg-gold-500 hover:bg-gold-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                View Detailed Analytics
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex gap-4">
          <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div className="space-y-2">
            <h3 className="font-semibold text-blue-900">📊 ALPACA PAPER TRADING (NOT WEBHOOKS)</h3>
            <p className="text-blue-700 text-sm">
              Paper trading uses Alpaca API directly - NO webhooks, NO validate:false needed! 
              Real $10K SignalCartel paper balance, real market prices, real custom trades. 
              Kraken is for LIVE trading only.
            </p>
            <div className="flex gap-4 text-sm text-blue-600">
              <span>• Paper: SignalCartel Engine ($10K balance)</span>
              <span>• Live: Kraken (real money)</span>
              <span>• NO webhooks for paper trading</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Position Cleanup Modal */}
      <PositionCleanupModal
        isOpen={showPositionModal}
        onClose={() => setShowPositionModal(false)}
        onProceed={handlePositionDecision}
        openPositions={openPositions}
        strategyName={selectedStrategyForTesting}
      />
    </div>
  );
}