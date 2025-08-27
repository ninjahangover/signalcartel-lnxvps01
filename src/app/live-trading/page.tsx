'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LivePosition {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  timestamp: string;
  aiStrategy: string;
  aiConfidence: number;
  aiSystems: string[];
  aiDecision: string;
  mathematicalIntuition?: number;
}

interface LiveOrder {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  quantity: number;
  price?: number;
  status: 'pending' | 'open' | 'filled' | 'cancelled';
  filled: number;
  remaining: number;
  timestamp: string;
  strategy?: string;
  aiConfidence?: number;
  aiSystems?: string[];
  aiReason?: string;
}

interface RecentTrade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  value: number;
  pnl?: number;
  pnlPercent?: number;
  fees: number;
  timestamp: string;
  strategy: string;
  aiConfidence?: number;
  aiSystems?: string[];
  aiReason?: string;
  mathematicalIntuition?: number;
  sentimentScore?: number;
  orderBookSignal?: number;
  phase: number;
}

interface AccountBalance {
  total: number;
  available: number;
  inOrders: number;
  unrealizedPnL: number;
  dailyPnL: number;
  totalPnL: number;
}

interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
  intensity: number; // 0-1 for heat map
}

interface OrderBookData {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  midPrice: number;
}

interface AISystemStatus {
  name: string;
  status: 'active' | 'inactive' | 'processing';
  lastUpdate: string;
  confidence: number;
  signal: 'bullish' | 'bearish' | 'neutral';
  processingTime: number;
}

interface QuantumForgeStatus {
  currentPhase: number;
  phaseName: string;
  tradesCompleted: number;
  tradesNeeded: number;
  progressPercent: number;
  aiSystems: AISystemStatus[];
  globalConfidence: number;
  activeStrategies: number;
  marketCondition: 'bull' | 'bear' | 'sideways';
}

export default function LiveTradingPage() {
  const [account, setAccount] = useState<AccountBalance>({
    total: 0,
    available: 0,
    inOrders: 0,
    unrealizedPnL: 0,
    dailyPnL: 0,
    totalPnL: 0
  });

  const [positions, setPositions] = useState<LivePosition[]>([]);

  const [openOrders, setOpenOrders] = useState<LiveOrder[]>([]);

  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);

  const [orderBook, setOrderBook] = useState<OrderBookData>({
    bids: [
      { price: 65120, size: 0.125, total: 0.125, intensity: 0.9 },
      { price: 65115, size: 0.080, total: 0.205, intensity: 0.7 },
      { price: 65110, size: 0.156, total: 0.361, intensity: 0.8 },
      { price: 65105, size: 0.092, total: 0.453, intensity: 0.5 },
      { price: 65100, size: 0.234, total: 0.687, intensity: 1.0 }
    ],
    asks: [
      { price: 65125, size: 0.089, total: 0.089, intensity: 0.6 },
      { price: 65130, size: 0.167, total: 0.256, intensity: 0.8 },
      { price: 65135, size: 0.123, total: 0.379, intensity: 0.7 },
      { price: 65140, size: 0.098, total: 0.477, intensity: 0.5 },
      { price: 65145, size: 0.201, total: 0.678, intensity: 0.9 }
    ],
    spread: 5,
    midPrice: 65122.5
  });

  const [liveTradingEnabled, setLiveTradingEnabled] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('connected');
  const [cacheStatus, setCacheStatus] = useState<{
    enabled: boolean;
    refreshCycle?: string;
    hitRate?: number;
    lastUpdate?: string;
  }>({ enabled: false });

  const [quantumForgeStatus, setQuantumForgeStatus] = useState<QuantumForgeStatus>({
    currentPhase: 0,
    phaseName: 'Loading QUANTUM FORGE™...',
    tradesCompleted: 0,
    tradesNeeded: 0,
    progressPercent: 0,
    globalConfidence: 0,
    activeStrategies: 0,
    marketCondition: 'sideways',
    aiSystems: []
  });

  // REAL QUANTUM FORGE™ live data updates
  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        setConnectionStatus('connected');
        const startTime = Date.now();

        // Fetch real positions with caching
        const positionsRes = await fetch('/api/position-management/portfolio');
        if (positionsRes.ok) {
          const positionsData = await positionsRes.json();
          setPositions(positionsData.data?.positions || []);
          
          // Update cache status if available
          if (positionsData.cache) {
            setCacheStatus({
              enabled: positionsData.cache.enabled,
              refreshCycle: positionsData.cache.refresh_cycle,
              lastUpdate: new Date().toISOString()
            });
          }
        }

        // Fetch real account data with caching
        const accountRes = await fetch('/api/quantum-forge/portfolio');
        if (accountRes.ok) {
          const accountData = await accountRes.json();
          const portfolioData = accountData.data;
          if (portfolioData) {
            setAccount({
              total: portfolioData.totalValue || 0,
              available: portfolioData.availableBalance || 0,
              inOrders: 0, // TODO: Calculate from open orders
              unrealizedPnL: portfolioData.unrealizedPnL || 0,
              dailyPnL: portfolioData.performance?.dailyPnL || 0,
              totalPnL: portfolioData.performance?.totalPnL || 0
            });
          }
        }

        // Fetch QUANTUM FORGE™ real-time status with intelligent caching
        const statusRes = await fetch('/api/quantum-forge/realtime');
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          const phaseData = statusData.data?.phase;
          const realtimeData = statusData.data?.realtime;
          
          if (phaseData) {
            setQuantumForgeStatus({
              currentPhase: phaseData.current || 0,
              phaseName: phaseData.name || 'Unknown',
              tradesCompleted: phaseData.totalTrades || 0,
              tradesNeeded: phaseData.tradesNeeded || 0,
              progressPercent: phaseData.isMaxPhase ? 100 : 
                Math.round(((phaseData.totalTrades || 0) / ((phaseData.totalTrades || 0) + (phaseData.tradesNeeded || 1))) * 100),
              aiSystems: [], // TODO: Map real AI system data
              globalConfidence: 85, // TODO: Get from AI systems
              activeStrategies: 4, // TODO: Get from strategies data
              marketCondition: 'bull' // TODO: Determine from market data
            });
          }

          // Update recent trades from realtime endpoint
          if (statusData.data?.recentTrades) {
            setRecentTrades(statusData.data.recentTrades.map((trade: any) => ({
              id: trade.id,
              symbol: trade.symbol,
              side: trade.side,
              quantity: trade.quantity,
              price: trade.price,
              value: trade.price * trade.quantity,
              pnl: trade.pnl,
              fees: 0, // TODO: Calculate fees
              timestamp: trade.time,
              strategy: 'QUANTUM FORGE™',
              phase: phaseData?.current || 0
            })));
          }

          // Update cache status from realtime endpoint
          if (statusData.cache) {
            setCacheStatus(prev => ({
              ...prev,
              enabled: statusData.cache.enabled,
              refreshCycle: statusData.cache.refresh_cycle,
              lastUpdate: new Date().toISOString()
            }));
          }
        }

        const fetchTime = Date.now() - startTime;
        console.log(`🔥 Live data fetched in ${fetchTime}ms with intelligent caching`);
        
      } catch (error) {
        console.error('Failed to fetch live data:', error);
        setConnectionStatus('error');
      }
    };

    // Initial load
    fetchLiveData();
    setConnectionStatus('connected');

    // Update every 2 seconds with REAL data
    const interval = setInterval(fetchLiveData, 2000);

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatPercent = (percent: number) => 
    `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;

  const getPnLColor = (pnl: number) => 
    pnl >= 0 ? 'text-green-600' : 'text-red-600';

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 0.8) return 'bg-red-500';
    if (intensity >= 0.6) return 'bg-orange-500';
    if (intensity >= 0.4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-400 bg-green-900/20';
    if (confidence >= 80) return 'text-blue-400 bg-blue-900/20';
    if (confidence >= 70) return 'text-yellow-400 bg-yellow-900/20';
    return 'text-red-400 bg-red-900/20';
  };

  const getSignalColor = (signal: 'bullish' | 'bearish' | 'neutral') => {
    if (signal === 'bullish') return 'text-green-400';
    if (signal === 'bearish') return 'text-red-400';
    return 'text-gray-400';
  };

  const getSystemStatusIcon = (status: 'active' | 'inactive' | 'processing') => {
    if (status === 'active') return '✅';
    if (status === 'processing') return '⚡';
    return '❌';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">🔥 QUANTUM FORGE™ Live Trading</h1>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
              {connectionStatus === 'connected' ? '✅ Kraken Connected' : '❌ Disconnected'}
            </Badge>
            <Badge variant={cacheStatus.enabled ? 'default' : 'secondary'}>
              {cacheStatus.enabled ? `⚡ Cache Active (${cacheStatus.refreshCycle})` : '🐌 No Cache'}
            </Badge>
            <Badge variant={liveTradingEnabled ? 'default' : 'secondary'}>
              {liveTradingEnabled ? '🔥 LIVE TRADING' : '📄 Paper Mode'}
            </Badge>
            <Badge variant="outline">Phase {quantumForgeStatus.currentPhase} - {quantumForgeStatus.phaseName}</Badge>
            <Badge variant="outline" className={getConfidenceColor(quantumForgeStatus.globalConfidence)}>
              🧠 AI Confidence: {quantumForgeStatus.globalConfidence.toFixed(1)}%
            </Badge>
            <Badge variant="outline" className={getSignalColor(quantumForgeStatus.marketCondition === 'bull' ? 'bullish' : quantumForgeStatus.marketCondition === 'bear' ? 'bearish' : 'neutral')}>
              📈 {quantumForgeStatus.marketCondition.toUpperCase()} MARKET
            </Badge>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold">{formatCurrency(account.total)}</div>
          <div className={`text-sm ${getPnLColor(account.dailyPnL)}`}>
            Today: {account.dailyPnL >= 0 ? '+' : ''}{formatCurrency(account.dailyPnL)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {quantumForgeStatus.activeStrategies} AI Strategies Active
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        
        {/* Left Column - Account & AI Status */}
        <div className="col-span-3 space-y-4">

          {/* QUANTUM FORGE™ AI Status */}
          <Card className="bg-gray-900 border-gray-700 border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                🧠 QUANTUM FORGE™ AI Status
                <Badge variant="outline" className="text-xs">
                  Phase {quantumForgeStatus.currentPhase}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {quantumForgeStatus.aiSystems.map((system) => (
                  <div key={system.name} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getSystemStatusIcon(system.status)}</span>
                      <div>
                        <div className="text-sm font-medium">{system.name}</div>
                        <div className="text-xs text-gray-400">{system.lastUpdate}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-mono ${getConfidenceColor(system.confidence)}`}>
                        {system.confidence}%
                      </div>
                      <div className={`text-xs ${getSignalColor(system.signal)}`}>
                        {system.signal.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-2 border-t border-gray-700">
                <div className="flex justify-between text-sm">
                  <span>Global Confidence</span>
                  <span className={`font-mono ${getConfidenceColor(quantumForgeStatus.globalConfidence)}`}>
                    {quantumForgeStatus.globalConfidence.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Progress to Next Phase</span>
                  <span className="font-mono text-blue-400">
                    {quantumForgeStatus.progressPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Account Balance */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Account Balance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Equity</span>
                <span className="font-mono">{formatCurrency(account.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Available</span>
                <span className="font-mono">{formatCurrency(account.available)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">In Orders</span>
                <span className="font-mono">{formatCurrency(account.inOrders)}</span>
              </div>
              <hr className="border-gray-700" />
              <div className="flex justify-between">
                <span className="text-gray-400">Unrealized P&L</span>
                <span className={`font-mono ${getPnLColor(account.unrealizedPnL)}`}>
                  {account.unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(account.unrealizedPnL)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total P&L</span>
                <span className={`font-mono ${getPnLColor(account.totalPnL)}`}>
                  {account.totalPnL >= 0 ? '+' : ''}{formatCurrency(account.totalPnL)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Open Positions */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Open Positions</CardTitle>
            </CardHeader>
            <CardContent>
              {positions.length === 0 ? (
                <div className="text-gray-400 text-center py-4">No open positions</div>
              ) : (
                <div className="space-y-4">
                  {positions.map((pos) => (
                    <div key={pos.id} className="border border-gray-700 rounded p-3 bg-gray-800/50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {pos.symbol}
                            <Badge variant={pos.side === 'long' ? 'default' : 'destructive'} className="text-xs">
                              {pos.side.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            🧠 {pos.aiStrategy}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-mono ${getPnLColor(pos.unrealizedPnL)}`}>
                            {pos.unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(pos.unrealizedPnL)}
                          </div>
                          <div className={`text-xs ${getPnLColor(pos.unrealizedPnLPercent)}`}>
                            {formatPercent(pos.unrealizedPnLPercent)}
                          </div>
                        </div>
                      </div>
                      
                      {/* AI Decision Info */}
                      <div className="mb-2 p-2 bg-blue-900/20 rounded text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-blue-400 font-medium">AI Decision</span>
                          <Badge className={`text-xs ${getConfidenceColor(pos.aiConfidence)}`}>
                            {pos.aiConfidence}% Confidence
                          </Badge>
                        </div>
                        <div className="text-gray-300 text-xs">
                          {pos.aiDecision}
                        </div>
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {pos.aiSystems.map((system) => (
                            <Badge key={system} variant="outline" className="text-xs px-1 py-0">
                              {system}
                            </Badge>
                          ))}
                        </div>
                        {pos.mathematicalIntuition && (
                          <div className="mt-1 text-xs text-green-400">
                            📊 Mathematical Intuition: {(pos.mathematicalIntuition * 100).toFixed(1)}%
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-gray-400 space-y-1">
                        <div>Qty: {pos.quantity}</div>
                        <div>Entry: {formatCurrency(pos.entryPrice)}</div>
                        <div>Current: {formatCurrency(pos.currentPrice)}</div>
                        <div className="text-gray-500">
                          {new Date(pos.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Center Column - Order Book & Trading */}
        <div className="col-span-6 space-y-4">
          
          {/* Order Book with AI Analysis */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Order Book - BTCUSD</CardTitle>
                  <div className="text-sm text-gray-400">
                    Spread: {formatCurrency(orderBook.spread)} | Mid: {formatCurrency(orderBook.midPrice)}
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-blue-900/50 text-blue-400 mb-1">
                    🧠 Order Book AI: {quantumForgeStatus.aiSystems[3]?.confidence}%
                  </Badge>
                  <div className="text-xs text-gray-400">
                    Signal: <span className={getSignalColor(quantumForgeStatus.aiSystems[3]?.signal)}>
                      {quantumForgeStatus.aiSystems[3]?.signal.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {/* Asks (Sells) */}
                {orderBook.asks.slice().reverse().map((ask, idx) => (
                  <div key={`ask-${idx}`} className="flex justify-between items-center py-1 relative">
                    <div 
                      className={`absolute inset-0 ${getIntensityColor(ask.intensity)} opacity-20`}
                      style={{ width: `${ask.intensity * 100}%` }}
                    />
                    <span className="font-mono text-red-400 relative z-10">{formatCurrency(ask.price)}</span>
                    <span className="font-mono text-sm text-gray-300 relative z-10">{ask.size.toFixed(3)}</span>
                    <span className="font-mono text-xs text-gray-400 relative z-10">{ask.total.toFixed(3)}</span>
                  </div>
                ))}
                
                {/* Spread Line */}
                <div className="border-t border-gray-600 my-2 text-center">
                  <span className="text-xs text-gray-400 bg-gray-900 px-2">
                    SPREAD: {formatCurrency(orderBook.spread)}
                  </span>
                </div>
                
                {/* Bids (Buys) */}
                {orderBook.bids.map((bid, idx) => (
                  <div key={`bid-${idx}`} className="flex justify-between items-center py-1 relative">
                    <div 
                      className={`absolute inset-0 ${getIntensityColor(bid.intensity)} opacity-20`}
                      style={{ width: `${bid.intensity * 100}%` }}
                    />
                    <span className="font-mono text-green-400 relative z-10">{formatCurrency(bid.price)}</span>
                    <span className="font-mono text-sm text-gray-300 relative z-10">{bid.size.toFixed(3)}</span>
                    <span className="font-mono text-xs text-gray-400 relative z-10">{bid.total.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Manual Trading Controls */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Manual Trading</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button className="bg-green-600 hover:bg-green-700">
                  🚀 BUY BTCUSD
                </Button>
                <Button variant="destructive">
                  📉 SELL BTCUSD  
                </Button>
              </div>
              <div className="text-xs text-gray-400 mt-2 text-center">
                Manual trades bypass AI filters
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Orders & Activity */}
        <div className="col-span-3 space-y-4">
          
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800">
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="trades">Trades</TabsTrigger>
            </TabsList>
            
            <TabsContent value="orders">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Open Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  {openOrders.length === 0 ? (
                    <div className="text-gray-400 text-center py-4">No open orders</div>
                  ) : (
                    <div className="space-y-3">
                      {openOrders.map((order) => (
                        <div key={order.id} className="border border-gray-700 rounded p-3 bg-gray-800/30">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {order.symbol}
                                <Badge variant={order.side === 'buy' ? 'default' : 'destructive'} className="text-xs">
                                  {order.side.toUpperCase()} {order.type.toUpperCase()}
                                </Badge>
                              </div>
                              {order.strategy && (
                                <div className="text-xs text-blue-400 mt-1">🧠 {order.strategy}</div>
                              )}
                            </div>
                            <Button variant="outline" size="sm">Cancel</Button>
                          </div>

                          {/* AI Information */}
                          {order.aiConfidence && (
                            <div className="mb-2 p-2 bg-blue-900/20 rounded text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-blue-400">AI Decision</span>
                                <Badge className={`text-xs ${getConfidenceColor(order.aiConfidence)}`}>
                                  {order.aiConfidence}% Confidence
                                </Badge>
                              </div>
                              {order.aiReason && (
                                <div className="text-gray-300 mb-2">{order.aiReason}</div>
                              )}
                              {order.aiSystems && (
                                <div className="flex gap-1 flex-wrap">
                                  {order.aiSystems.map((system) => (
                                    <Badge key={system} variant="outline" className="text-xs px-1 py-0">
                                      {system}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="text-xs text-gray-400 space-y-1">
                            <div>Qty: {order.quantity} ({order.filled} filled)</div>
                            {order.price && <div>Price: {formatCurrency(order.price)}</div>}
                            <div className="text-gray-500">
                              {new Date(order.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="trades">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Recent Trades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {recentTrades.map((trade) => (
                      <div key={trade.id} className="border border-gray-700 rounded p-3 bg-gray-800/30">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {trade.symbol}
                              <Badge variant={trade.side === 'buy' ? 'default' : 'destructive'} className="text-xs">
                                {trade.side.toUpperCase()}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Phase {trade.phase}
                              </Badge>
                            </div>
                            <div className="text-xs text-blue-400 mt-1">🧠 {trade.strategy}</div>
                          </div>
                          {trade.pnl !== undefined && (
                            <div className={`text-right ${getPnLColor(trade.pnl)}`}>
                              <div className="font-mono">{trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}</div>
                              {trade.pnlPercent && (
                                <div className="text-xs">{formatPercent(trade.pnlPercent)}</div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Comprehensive AI Analysis */}
                        {trade.aiConfidence && (
                          <div className="mb-3 p-2 bg-blue-900/20 rounded text-xs">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-blue-400 font-medium">AI Analysis</span>
                              <Badge className={`text-xs ${getConfidenceColor(trade.aiConfidence)}`}>
                                {trade.aiConfidence}% Confidence
                              </Badge>
                            </div>
                            
                            {trade.aiReason && (
                              <div className="text-gray-300 mb-2 text-xs">
                                {trade.aiReason}
                              </div>
                            )}

                            {/* AI System Badges */}
                            {trade.aiSystems && (
                              <div className="flex gap-1 mb-2 flex-wrap">
                                {trade.aiSystems.map((system) => (
                                  <Badge key={system} variant="outline" className="text-xs px-1 py-0">
                                    {system}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {/* AI Metrics */}
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              {trade.mathematicalIntuition && (
                                <div className="text-center">
                                  <div className="text-green-400 font-mono">
                                    {(trade.mathematicalIntuition * 100).toFixed(0)}%
                                  </div>
                                  <div className="text-gray-500">Math</div>
                                </div>
                              )}
                              {trade.sentimentScore && (
                                <div className="text-center">
                                  <div className="text-purple-400 font-mono">
                                    {(trade.sentimentScore * 100).toFixed(0)}%
                                  </div>
                                  <div className="text-gray-500">Sentiment</div>
                                </div>
                              )}
                              {trade.orderBookSignal && (
                                <div className="text-center">
                                  <div className="text-orange-400 font-mono">
                                    {(trade.orderBookSignal * 100).toFixed(0)}%
                                  </div>
                                  <div className="text-gray-500">Order Book</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-gray-400 space-y-1">
                          <div>Qty: {trade.quantity} @ {formatCurrency(trade.price)}</div>
                          <div>Value: {formatCurrency(trade.value)} | Fees: {formatCurrency(trade.fees)}</div>
                          <div className="text-gray-500">
                            {new Date(trade.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}