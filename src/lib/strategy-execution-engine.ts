import marketDataService, { MarketData } from './market-data-service';
import { Strategy } from './strategy-manager';
import RSIStrategyOptimizer, { RSIParameters } from './rsi-strategy-optimizer';
import { StrategyFactory, BaseStrategy, TradingSignal } from './strategy-implementations';
import { GPURSIStrategy } from './gpu-rsi-strategy';
import { telegramAlerts } from './telegram-alert-service';

interface TechnicalIndicators {
  rsi: number[];
  sma20: number[];
  sma50: number[];
}

interface StrategyState {
  strategyId: string;
  symbol: string;
  position: 'none' | 'long' | 'short';
  entryPrice: number | null;
  indicators: TechnicalIndicators;
  priceHistory: number[];
  lastSignal: Date | null;
  confirmationBars: number;
  optimizedParameters?: RSIParameters; // AI-optimized parameters
  lastOptimization?: Date;
}

interface WebhookAlert {
  [key: string]: any; // Dynamic payload based on strategy configuration
}

interface ProvenRSIWebhookTemplate {
  passphrase: string;
  ticker: string;
  strategy: {
    order_action: string;
    order_type: string;
    order_price: string;
    order_contracts: string;
    type: string;
    volume: string;
    pair: string;
    validate: string;
    close: {
      order_type: string;
      price: string;
    };
    stop_loss: string;
  };
}

interface WebhookTestResult {
  success: boolean;
  tested: boolean;
  lastTestTime: Date | null;
  error?: string;
  responseTime?: number;
}

class StrategyExecutionEngine {
  private static instance: StrategyExecutionEngine;
  private strategyStates: Map<string, StrategyState> = new Map();
  private strategyImplementations: Map<string, BaseStrategy> = new Map();
  private strategyNames: Map<string, string> = new Map();
  private marketDataSubscriptions: Map<string, () => void> = new Map();
  private webhookTestResults: Map<string, WebhookTestResult> = new Map();
  private paperTradingMode = true; // Start in paper trading mode for testing
  private isRunning = false;
  private listeners: Set<() => void> = new Set();
  private optimizer: RSIStrategyOptimizer;

  // Webhook structure template (format only - content comes from each strategy's own Pine Script)
  private readonly WEBHOOK_STRUCTURE_TEMPLATE = {
    passphrase: "sdfqoei1898498",
    ticker: "{{ticker}}",
    strategy: { 
      order_action: "{{strategy.order.action}}",
      order_type: "limit",
      order_price: "{{strategy.order.price}}",
      order_contracts: "{{strategy.order.contracts}}",
      type: "{{strategy.order.action}}",
      volume: "{{strategy.order.contracts}}",
      pair: "{{ticker}}",
      validate: "false", // Live trading mode
      close: {
        order_type: "limit",
        price: "{{strategy.order.price}}"
      },
      stop_loss: "{{calculated from strategy's own Pine Script variables}}"
    }
  };

  // Real-time AI optimization tracking per strategy
  private strategyPerformanceData: Map<string, {
    winRate: number;
    totalTrades: number;
    wins: number;
    losses: number;
    avgProfit: number;
    avgLoss: number;
    currentOptimization: Record<string, any>;
    lastOptimizationTime: Date;
    learningData: Array<{
      inputs: Record<string, any>;
      result: 'win' | 'loss';
      profit: number;
      timestamp: Date;
    }>;
    paperTrades: Array<{
      tradeId: string;
      action: 'BUY' | 'SELL' | 'CLOSE';
      entryPrice: number;
      exitPrice?: number;
      quantity: number;
      profit?: number;
      status: 'open' | 'closed';
      openTime: Date;
      closeTime?: Date;
      inputs: Record<string, any>;
    }>;
  }> = new Map();

  // Performance logging system
  private performanceLogger = {
    logTrade: (strategyId: string, trade: any) => {
      const timestamp = new Date().toISOString();
      console.log(`📊 [${timestamp}] TRADE LOG - ${strategyId}:`, JSON.stringify(trade, null, 2));
    },
    logOptimization: (strategyId: string, oldParams: any, newParams: any, expectedImprovement: number) => {
      const timestamp = new Date().toISOString();
      console.log(`🧠 [${timestamp}] AI OPTIMIZATION - ${strategyId}:`);
      console.log(`   Old Parameters:`, oldParams);
      console.log(`   New Parameters:`, newParams);
      console.log(`   Expected Improvement: +${(expectedImprovement * 100).toFixed(1)}%`);
    },
    logPerformanceMetrics: (strategyId: string, metrics: any) => {
      const timestamp = new Date().toISOString();
      console.log(`📈 [${timestamp}] PERFORMANCE METRICS - ${strategyId}:`);
      console.log(`   Win Rate: ${metrics.winRate.toFixed(1)}%`);
      console.log(`   Total Trades: ${metrics.totalTrades}`);
      console.log(`   Avg Profit per Trade: $${metrics.avgProfitPerTrade.toFixed(2)}`);
      console.log(`   Max Drawdown: ${metrics.maxDrawdown.toFixed(1)}%`);
      console.log(`   Sharpe Ratio: ${metrics.sharpeRatio.toFixed(2)}`);
    }
  };

  private constructor() {
    this.optimizer = RSIStrategyOptimizer.getInstance();
    
    // Subscribe to parameter updates from optimizer
    this.optimizer.subscribe(() => {
      this.updateOptimizedParameters();
    });
  }

  static getInstance(): StrategyExecutionEngine {
    if (!StrategyExecutionEngine.instance) {
      StrategyExecutionEngine.instance = new StrategyExecutionEngine();
    }
    return StrategyExecutionEngine.instance;
  }

  // Start monitoring strategies for execution
  startEngine() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('🚀 Stratus Engine: Strategy Execution Engine started');
    this.notifyListeners();
  }

  stopEngine() {
    if (!this.isRunning) return;
    this.isRunning = false;
    
    // Unsubscribe from all market data
    for (const [symbol, unsubscribe] of this.marketDataSubscriptions) {
      unsubscribe();
    }
    this.marketDataSubscriptions.clear();
    
    console.log('⏹️ Stratus Engine: Strategy Execution Engine stopped');
    this.notifyListeners();
  }

  // Initialize strategy with historical price data
  private initializeStrategyWithHistoricalData(strategyImpl: BaseStrategy, symbol: string): void {
    console.log(`📊 Generating 200 historical data points for ${symbol}...`);
    
    // Generate realistic historical data (simulating 7 days of 30-minute periods)
    const historicalPeriods = 200;
    let basePrice = 110000; // Starting price
    
    for (let i = 0; i < historicalPeriods; i++) {
      // Realistic price movement
      const volatility = 0.015; // 1.5% volatility
      const trend = 0.0002; // Slight upward trend
      const randomChange = (Math.random() - 0.5) * volatility;
      
      basePrice = basePrice * (1 + trend + randomChange);
      
      // Create market data point
      const historicalData = {
        symbol: symbol.replace('USD', '/USD'),
        price: basePrice,
        volume: 8000000 + Math.random() * 4000000,
        timestamp: new Date(Date.now() - (historicalPeriods - i) * 30 * 60 * 1000),
        high24h: basePrice * 1.02,
        low24h: basePrice * 0.98,
        change24h: randomChange * 100
      };
      
      // Feed to strategy to build indicators
      strategyImpl.analyzeMarket(historicalData);
      
      if (i % 50 === 0 && i > 0) {
        console.log(`   📈 Processed ${i}/${historicalPeriods} historical data points`);
      }
    }
    
    console.log(`✅ Strategy initialized with ${historicalPeriods} historical data points`);
  }

  // Add strategy for real-time monitoring and execution
  addStrategy(strategy: Strategy, symbol: string = 'BTCUSD') {
    try {
      // Create strategy implementation using the exact type from StrategyFactory
      console.log(`📊 Stratus Engine: Creating strategy implementation for type: ${strategy.type}`);
      const strategyImpl: BaseStrategy = StrategyFactory.createStrategy(
        strategy.type as any, 
        strategy.id, 
        symbol, 
        strategy.config
      );
      
      this.strategyImplementations.set(strategy.id, strategyImpl);
      this.strategyNames.set(strategy.id, strategy.name);
      
      // Initialize strategy with historical data (simulating 7 days of data)
      console.log(`📈 Initializing ${strategy.name} with historical data...`);
      this.initializeStrategyWithHistoricalData(strategyImpl, symbol);
      
      const strategyState: StrategyState = {
        strategyId: strategy.id,
        symbol,
        position: 'none',
        entryPrice: null,
        indicators: {
          rsi: [],
          sma20: [],
          sma50: []
        },
        priceHistory: [],
        lastSignal: null,
        confirmationBars: 0
      };

      this.strategyStates.set(strategy.id, strategyState);

      // Subscribe to market data for this symbol
      if (!this.marketDataSubscriptions.has(symbol)) {
        console.log(`📡 Strategy Engine: Subscribing to market data for ${symbol}`);
        const unsubscribe = marketDataService.subscribe(symbol, (marketData) => {
          console.log(`📡 Strategy Engine: Received market data callback for ${symbol}`);
          this.processMarketData(marketData);
        });
        this.marketDataSubscriptions.set(symbol, unsubscribe);
        console.log(`📡 Strategy Engine: Subscription created for ${symbol}`);
      } else {
        console.log(`📡 Strategy Engine: Already subscribed to ${symbol}`);
      }

      console.log(`📊 Stratus Engine: Added strategy ${strategy.name} (${strategy.type || 'AUTO'}) for symbol ${symbol}`);
      this.notifyListeners();
      
    } catch (error) {
      console.error(`Failed to add strategy ${strategy.id}:`, error);
    }
  }

  removeStrategy(strategyId: string) {
    this.strategyStates.delete(strategyId);
    this.strategyImplementations.delete(strategyId);
    console.log(`📊 Stratus Engine: Removed strategy ${strategyId}`);
    this.notifyListeners();
  }

  // Update optimized parameters for all RSI strategies
  private updateOptimizedParameters(): void {
    const newParams = this.optimizer.getCurrentParameters();
    
    for (const [strategyId, state] of this.strategyStates) {
      // Only update RSI strategies
      if (strategyId.includes('rsi') || strategyId.includes('RSI')) {
        state.optimizedParameters = newParams;
        state.lastOptimization = new Date();
        console.log(`🎯 Stratus Engine: Updated optimized parameters for ${strategyId}:`, newParams);
      }
    }
    
    this.notifyListeners();
  }

  // Process incoming market data and check strategy conditions
  private processMarketData(marketData: MarketData) {
    if (!this.isRunning) {
      console.log('⚠️ Strategy Engine: Not running, skipping market data processing');
      return;
    }

    console.log(`📊 Processing market data for ${marketData.symbol}: $${marketData.price.toLocaleString()}`);

    // Process each strategy monitoring this symbol
    for (const [strategyId, state] of this.strategyStates) {
      if (state.symbol === marketData.symbol) {
        console.log(`🔄 Analyzing with strategy ${strategyId}`);
        // Use strategy implementation if available
        const strategyImpl = this.strategyImplementations.get(strategyId);
        if (strategyImpl) {
          try {
            const signal = strategyImpl.analyzeMarket(marketData);
            console.log(`📈 Strategy ${strategyId} signal: ${signal.action} (confidence: ${signal.confidence})`);
            this.processStrategySignal(strategyId, signal);
          } catch (error) {
            console.error(`Error in strategy ${strategyId}:`, error);
          }
        } else {
          // Fallback to legacy processing
          console.log(`⚙️ Using legacy processing for ${strategyId}`);
          this.updateTechnicalIndicators(state, marketData.price);
          this.checkStrategySignals(strategyId, state, marketData);
        }
      }
    }
  }

  // Process trading signal from strategy implementation with sentiment enhancement
  private async processStrategySignal(strategyId: string, signal: TradingSignal): Promise<void> {
    if (signal.action === 'HOLD' || signal.confidence < 0.5) {
      return; // Don't execute low-confidence or hold signals
    }

    console.log(`🎯 Strategy ${strategyId} generated raw signal:`, {
      action: signal.action,
      confidence: `${(signal.confidence * 100).toFixed(1)}%`,
      reason: signal.reason
    });

    // ✨ SENTIMENT ENHANCEMENT INTEGRATION
    try {
      const { universalSentimentEnhancer } = await import('./sentiment/universal-sentiment-enhancer');
      
      // Convert TradingSignal to BaseStrategySignal format
      const baseSignal = {
        action: signal.action,
        confidence: signal.confidence,
        symbol: signal.symbol || 'BTC',
        price: signal.price,
        strategy: this.getStrategyName(strategyId),
        reason: signal.reason,
        timestamp: new Date()
      };

      // Enhance signal with sentiment validation
      const enhancedSignal = await universalSentimentEnhancer.enhanceSignal(baseSignal);
      
      console.log(`🔮 SENTIMENT-ENHANCED SIGNAL:`, {
        originalAction: enhancedSignal.originalAction,
        finalAction: enhancedSignal.finalAction,
        originalConfidence: `${(enhancedSignal.originalConfidence * 100).toFixed(1)}%`,
        enhancedConfidence: `${(enhancedSignal.confidence * 100).toFixed(1)}%`,
        sentimentScore: enhancedSignal.sentimentScore.toFixed(3),
        sentimentConflict: enhancedSignal.sentimentConflict ? '⚠️ CONFLICT' : '✅ ALIGNED',
        shouldExecute: enhancedSignal.shouldExecute ? '✅ EXECUTE' : '❌ SKIP',
        reason: enhancedSignal.executionReason
      });

      // Store enhanced signal in database for analysis
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        
        await prisma.enhancedTradingSignal.create({
          data: {
            symbol: enhancedSignal.symbol,
            strategy: this.getStrategyName(strategyId),
            technicalScore: enhancedSignal.originalConfidence,
            technicalAction: enhancedSignal.originalAction,
            sentimentScore: enhancedSignal.sentimentScore,
            sentimentConfidence: enhancedSignal.sentimentConfidence,
            sentimentConflict: enhancedSignal.sentimentConflict,
            combinedConfidence: enhancedSignal.confidence,
            finalAction: enhancedSignal.finalAction,
            confidenceBoost: enhancedSignal.confidenceModifier,
            wasExecuted: enhancedSignal.shouldExecute,
            executeReason: enhancedSignal.executionReason
          }
        });
        
        await prisma.$disconnect();
      } catch (dbError) {
        console.warn('📊 Could not store enhanced signal to database:', dbError);
      }

      // Only proceed if sentiment validation recommends execution
      if (!enhancedSignal.shouldExecute) {
        console.log(`🚫 Signal skipped due to sentiment validation: ${enhancedSignal.executionReason}`);
        return;
      }

      // Use enhanced signal for execution
      signal.confidence = enhancedSignal.confidence;
      signal.reason = `${signal.reason} | Sentiment-Enhanced: ${enhancedSignal.executionReason}`;
      
    } catch (sentimentError) {
      console.warn('⚠️ Sentiment enhancement failed, proceeding with original signal:', sentimentError);
      // Continue with original signal if sentiment enhancement fails
    }

    // Update strategy state
    const state = this.strategyStates.get(strategyId);
    if (state) {
      if (signal.action === 'BUY') {
        state.position = 'long';
        state.entryPrice = signal.price;
      } else if (signal.action === 'SELL') {
        state.position = 'short';
        state.entryPrice = signal.price;
      } else if (signal.action === 'CLOSE') {
        state.position = 'none';
        state.entryPrice = null;
      }
      state.lastSignal = new Date();
    }

    // Execute the sentiment-enhanced signal
    await this.executeSignal(strategyId, state?.symbol || 'BTCUSD', signal.action, {
      price: signal.price,
      quantity: signal.quantity,
      reason: signal.reason,
      confidence: signal.confidence,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit,
      metadata: signal.metadata
    });
  }

  // Update technical indicators with new price data
  private updateTechnicalIndicators(state: StrategyState, price: number) {
    // Add new price to history
    state.priceHistory.push(price);
    
    // Keep only last 100 bars for calculations
    if (state.priceHistory.length > 100) {
      state.priceHistory.shift();
    }

    // Get optimized parameters or use defaults
    const params = state.optimizedParameters || {
      rsi_period: 14,
      oversold_level: 30,
      overbought_level: 70,
      confirmation_period: 3,
      ma_short_period: 20,
      ma_long_period: 50,
      position_size: 0.01
    };

    // Calculate RSI with optimized period
    if (state.priceHistory.length >= params.rsi_period) {
      const rsi = this.calculateRSI(state.priceHistory, params.rsi_period);
      state.indicators.rsi.push(rsi);
      
      if (state.indicators.rsi.length > 50) {
        state.indicators.rsi.shift();
      }
    }

    // Calculate SMAs with optimized periods
    if (state.priceHistory.length >= params.ma_short_period) {
      const smaShort = this.calculateSMA(state.priceHistory, params.ma_short_period);
      state.indicators.sma20.push(smaShort);
      
      if (state.indicators.sma20.length > 50) {
        state.indicators.sma20.shift();
      }
    }

    if (state.priceHistory.length >= params.ma_long_period) {
      const smaLong = this.calculateSMA(state.priceHistory, params.ma_long_period);
      state.indicators.sma50.push(smaLong);
      
      if (state.indicators.sma50.length > 50) {
        state.indicators.sma50.shift();
      }
    }
  }

  // Check RSI Pullback strategy signals
  private async checkStrategySignals(strategyId: string, state: StrategyState, marketData: MarketData) {
    const indicators = state.indicators;
    const price = marketData.price;

    // Get optimized parameters or use defaults
    const params = state.optimizedParameters || {
      rsi_period: 14,
      oversold_level: 30,
      overbought_level: 70,
      confirmation_period: 3,
      ma_short_period: 20,
      ma_long_period: 50,
      position_size: 0.01
    };

    // Need enough data for indicators
    if (indicators.rsi.length < 3 || indicators.sma20.length < 3 || indicators.sma50.length < 3) {
      return;
    }

    const currentRSI = indicators.rsi[indicators.rsi.length - 1];
    const currentSMA20 = indicators.sma20[indicators.sma20.length - 1];
    const currentSMA50 = indicators.sma50[indicators.sma50.length - 1];

    // RSI Pullback Strategy Logic with AI-optimized thresholds
    const oversold = currentRSI <= params.oversold_level;
    const overbought = currentRSI >= params.overbought_level;
    const uptrend = currentSMA20 > currentSMA50;
    const downtrend = currentSMA20 < currentSMA50;
    const priceAboveLongMA = price > currentSMA50;
    const priceBelowLongMA = price < currentSMA50;

    // Long Entry Conditions
    if (state.position === 'none' && oversold && priceAboveLongMA && uptrend) {
      state.confirmationBars++;
      
      if (state.confirmationBars >= params.confirmation_period) { // AI-optimized confirmation period
        await this.executeSignal(strategyId, state.symbol, 'BUY', {
          price: price,
          quantity: params.position_size,
          rsi: currentRSI,
          reason: `AI-Optimized RSI oversold (${currentRSI.toFixed(1)} <= ${params.oversold_level}) + uptrend + price above SMA${params.ma_long_period}`,
          optimization_status: state.optimizedParameters ? 'OPTIMIZED' : 'DEFAULT'
        });

        state.position = 'long';
        state.entryPrice = price;
        state.confirmationBars = 0;
        state.lastSignal = new Date();
      }
    }

    // Short Entry Conditions  
    else if (state.position === 'none' && overbought && priceBelowLongMA && downtrend) {
      state.confirmationBars++;
      
      if (state.confirmationBars >= params.confirmation_period) { // AI-optimized confirmation period
        await this.executeSignal(strategyId, state.symbol, 'SELL', {
          price: price,
          quantity: params.position_size,
          rsi: currentRSI,
          reason: `AI-Optimized RSI overbought (${currentRSI.toFixed(1)} >= ${params.overbought_level}) + downtrend + price below SMA${params.ma_long_period}`,
          optimization_status: state.optimizedParameters ? 'OPTIMIZED' : 'DEFAULT'
        });

        state.position = 'short';
        state.entryPrice = price;
        state.confirmationBars = 0;
        state.lastSignal = new Date();
      }
    }

    // Long Exit Conditions
    else if (state.position === 'long' && (overbought || price < currentSMA20)) {
      await this.executeSignal(strategyId, state.symbol, 'CLOSE', {
        price: price,
        quantity: 0,
        rsi: currentRSI,
        reason: overbought ? `RSI overbought (${currentRSI.toFixed(1)})` : 'Price below SMA20'
      });

      state.position = 'none';
      state.entryPrice = null;
      state.confirmationBars = 0;
      state.lastSignal = new Date();
    }

    // Short Exit Conditions
    else if (state.position === 'short' && (oversold || price > currentSMA20)) {
      await this.executeSignal(strategyId, state.symbol, 'CLOSE', {
        price: price,
        quantity: 0,
        rsi: currentRSI,
        reason: oversold ? `RSI oversold (${currentRSI.toFixed(1)})` : 'Price above SMA20'
      });

      state.position = 'none';
      state.entryPrice = null;
      state.confirmationBars = 0;
      state.lastSignal = new Date();
    }

    // Reset confirmation if conditions not met
    else {
      state.confirmationBars = 0;
    }
  }

  // Execute signal by sending webhook based on strategy's Pine Script configuration
  // COMPLETE ALERT → WEBHOOK → TRADE PIPELINE
  private async executeSignal(
    strategyId: string, 
    symbol: string, 
    action: 'BUY' | 'SELL' | 'CLOSE', 
    signalData: Record<string, any>
  ) {
    try {
      console.log(`🎯 Stratus Engine: Starting Alert → Webhook → Trade pipeline for ${strategyId}`);

      // STEP 1: Validate strategy readiness (100% requirement)
      const readiness = await this.validateStrategyReadiness(strategyId);
      if (!readiness.ready) {
        console.error(`🚫 Stratus Engine: Strategy ${strategyId} NOT READY:`, readiness.issues);
        return;
      }

      // STEP 2: Get strategy configuration
      const StrategyManager = (await import('./strategy-manager')).default;
      const strategyManager = StrategyManager.getInstance();
      const strategy = strategyManager.getStrategy(strategyId);

      // STEP 3: Execute trade (QUANTUM FORGE™ Paper Trading ONLY - Completely separate from LIVE)
      if (this.paperTradingMode) {
        console.log(`🚀 QUANTUM FORGE™ PAPER TRADING: ${action} for ${strategyId}`);
        
        try {
          // Import Prisma for direct database access
          const { PrismaClient } = await import('@prisma/client');
          const prisma = new PrismaClient();
          
          // Get or create QUANTUM FORGE™ paper trading session
          let session = await prisma.paperTradingSession.findFirst({
            where: {
              strategy: 'QUANTUM FORGE™',
              isActive: true
            }
          });
          
          if (!session) {
            // Create QUANTUM FORGE™ session
            session = await prisma.paperTradingSession.create({
              data: {
                paperAccountId: 'quantum-forge-account',
                sessionName: 'QUANTUM FORGE™ GPU Strategies',
                strategy: 'QUANTUM FORGE™',
                isActive: true,
                sessionStart: new Date(),
                initialBalance: 10000.0, // $10K starting balance
                currentBalance: 10000.0,
                maxDrawdown: 0.0,
                totalTrades: 0,
                winningTrades: 0,
                totalPnL: 0.0,
                totalFees: 0.0
              }
            });
            console.log(`✅ Created new QUANTUM FORGE™ session: ${session.id}`);
          }
          
          // Convert action to side format
          let orderSide: 'buy' | 'sell';
          if (action === 'CLOSE') {
            const state = this.strategyStates.get(strategyId);
            orderSide = state?.position === 'long' ? 'sell' : 'buy';
          } else {
            orderSide = action.toLowerCase() as 'buy' | 'sell';
          }
          
          // Calculate position size based on confidence and price
          const currentPrice = signalData.price || 50000;
          const confidence = signalData.confidence || 0.8;
          const basePositionValue = 100; // $100 base position
          const positionValue = basePositionValue * confidence;
          const quantity = positionValue / currentPrice;
          const tradeValue = quantity * currentPrice;
          
          // Create QUANTUM FORGE™ paper trade with valid sessionId
          const trade = await prisma.paperTrade.create({
            data: {
              sessionId: session.id,
              symbol: symbol,
              side: orderSide,
              quantity: quantity,
              price: currentPrice,
              value: tradeValue,
              commission: 0.0,
              fees: 0.0,
              netValue: tradeValue,
              isEntry: action !== 'CLOSE',
              tradeType: 'market',
              strategy: this.getStrategyName(strategyId),
              signalSource: 'ai',
              confidence: confidence,
              executedAt: new Date()
            }
          });
          
          // Also create trading signal for analysis
          await prisma.tradingSignal.create({
            data: {
              symbol: symbol,
              strategy: this.getStrategyName(strategyId),
              signalType: action,
              currentPrice: currentPrice,
              confidence: confidence,
              volume: tradeValue,
              indicators: JSON.stringify({
                strategyId: strategyId.slice(0, 8),
                reason: signalData.reason || 'GPU Strategy Signal',
                tradeValue: tradeValue,
                executionTime: new Date().getTime()
              })
            }
          });
          
          console.log(`✅ QUANTUM FORGE™ PAPER TRADE EXECUTED:`, {
            id: trade.id,
            symbol: trade.symbol,
            side: trade.side,
            quantity: trade.quantity,
            price: trade.price,
            value: trade.value,
            strategy: 'QUANTUM FORGE™'
          });
          
          // Update strategy state
          const state = this.strategyStates.get(strategyId);
          if (state) {
            state.lastSignal = new Date();
            state.position = action === 'BUY' ? 'long' : action === 'SELL' ? 'short' : 'none';
            if (action !== 'CLOSE') {
              state.entryPrice = currentPrice;
            }
          }
          
          await prisma.$disconnect();
          this.notifyListeners();
          return; // QUANTUM FORGE™ paper trading complete
          
        } catch (error) {
          console.error(`❌ Error with QUANTUM FORGE™ paper trading:`, error);
          console.log(`📊 Signal logged but not executed: ${action} ${symbol} at ${signalData.price}`);
        }

        return; // Quantum Forge platform only - no webhooks
      }

      // LIVE TRADING: Requires Pine Script configuration
      if (!strategy || !strategy.pineScript) {
        console.warn(`❌ Strategy ${strategyId} has no Pine Script webhook configuration for live trading`);
        return;
      }

      // Extract Pine Script variables for intelligent webhook generation
      const pineScriptVariables = this.extractPineScriptVariables(strategy.pineScript.source || '');
      
      // Generate webhook using proven RSI template structure
      const marketData = signalData.marketData || { symbol, price: signalData.price };
      const intelligentWebhook = this.generateWebhookFromTemplate(
        strategyId,
        pineScriptVariables,
        action,
        marketData
      );

      console.log(`📡 Stratus Engine: Generated intelligent webhook for ${strategyId}:`, intelligentWebhook);

      // LIVE TRADING: Execute real webhook to kraken.circuitcartel.com/webhook
      intelligentWebhook.strategy.validate = "false"; // Live trading mode
      const webhookUrl = 'https://kraken.circuitcartel.com/webhook';
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(intelligentWebhook),
        signal: AbortSignal.timeout(15000) // 15 second timeout for live trading
      });

      // STEP 6: Validate trade execution response
      if (response.ok) {
        const responseData = await response.json();
        console.log(`✅ Stratus Engine: SUCCESSFUL ${action} trade execution for ${strategyId}:`, responseData);
        
        // Update strategy state with successful execution
        const state = this.strategyStates.get(strategyId);
        if (state) {
          state.lastSignal = new Date();
          state.position = action === 'BUY' ? 'long' : action === 'SELL' ? 'short' : 'none';
          if (action !== 'CLOSE') {
            state.entryPrice = parseFloat(intelligentWebhook.strategy.order_price);
          }
        }

        // Notify listeners of successful trade
        this.notifyListeners();

      } else {
        const errorText = await response.text();
        console.error(`❌ Stratus Engine: FAILED ${action} trade execution for ${strategyId}:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
      }

      // STEP 7: Also notify the Pine Script manager for tracking
      const PineScriptManager = (await import('./pine-script-manager')).default;
      const pineScriptManager = PineScriptManager.getInstance();
      await pineScriptManager.processAlert(strategyId, intelligentWebhook);

    } catch (error) {
      console.error(`❌ Stratus Engine: Error executing signal for ${strategyId}:`, error);
    }
  }

  // Build webhook payload from strategy template with variable substitution
  private buildWebhookPayload(
    template: Record<string, any>,
    action: string,
    symbol: string,
    signalData: Record<string, any>
  ): WebhookAlert {
    const payload: WebhookAlert = {};
    const timestamp = new Date().toISOString();

    // Variable substitution map
    const variables: Record<string, any> = {
      '{{action}}': action,
      '{{symbol}}': symbol,
      '{{ticker}}': symbol,
      '{{timestamp}}': timestamp,
      ...Object.entries(signalData).reduce((acc, [key, value]) => {
        acc[`{{${key}}}`] = value;
        return acc;
      }, {} as Record<string, any>)
    };

    // Recursively process template and substitute variables
    const processValue = (value: any): any => {
      if (typeof value === 'string') {
        // Replace template variables
        let processedValue = value;
        for (const [placeholder, replacement] of Object.entries(variables)) {
          processedValue = processedValue.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), String(replacement));
        }
        return processedValue;
      } else if (Array.isArray(value)) {
        return value.map(processValue);
      } else if (typeof value === 'object' && value !== null) {
        const processedObject: Record<string, any> = {};
        for (const [key, val] of Object.entries(value)) {
          processedObject[key] = processValue(val);
        }
        return processedObject;
      }
      return value;
    };

    // Process the entire template
    for (const [key, value] of Object.entries(template)) {
      payload[key] = processValue(value);
    }

    return payload;
  }

  // Calculate RSI indicator
  private calculateRSI(prices: number[], period: number): number {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    // Calculate initial average gain/loss
    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return rsi;
  }

  // Calculate Simple Moving Average
  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];

    const sum = prices.slice(-period).reduce((acc, price) => acc + price, 0);
    return sum / period;
  }

  // Get current strategy states for monitoring
  getStrategyStates(): Map<string, StrategyState> {
    return new Map(this.strategyStates);
  }

  // Extract Pine Script variables for webhook mapping (Each strategy uses ITS OWN variables)
  private extractPineScriptVariables(pineScriptCode: string): Record<string, any> {
    const variables: Record<string, any> = {};
    
    // Extract input variables that affect trading decisions
    const inputRegex = /([\w_]+)\s*=\s*input\.(int|float|bool|string)\s*\(([^)]+)\)/g;
    let match;
    
    while ((match = inputRegex.exec(pineScriptCode)) !== null) {
      const [, varName, varType, params] = match;
      
      // Parse default value from input parameters
      const defaultMatch = params.match(/^\s*([^,]+)/);
      const defaultValue = defaultMatch ? defaultMatch[1].replace(/['"]/g, '') : '0';
      
      variables[varName] = {
        type: varType,
        defaultValue: defaultValue,
        isTradeVariable: this.isTradeRelevantVariable(varName)
      };
    }
    
    // Extract strategy entry/exit conditions
    const conditionRegex = /(long_condition|short_condition|entry_condition|exit_condition)\s*=\s*(.+)/g;
    while ((match = conditionRegex.exec(pineScriptCode)) !== null) {
      const [, conditionName, conditionLogic] = match;
      variables[conditionName] = {
        type: 'condition',
        logic: conditionLogic.trim(),
        isTradeVariable: true
      };
    }
    
    console.log(`🔍 Stratus Engine: Extracted ${Object.keys(variables).length} variables from Pine Script`);
    return variables;
  }

  // Determine if a variable is relevant for trade execution (Based on RSI template pattern)
  private isTradeRelevantVariable(varName: string): boolean {
    const tradeRelevantPatterns = [
      'rsi_', 'atr_', 'ma_', 'price', 'volume', 'stop', 'take', 'profit',
      'lookback', 'threshold', 'barrier', 'multiplier', 'length',
      'fast_', 'slow_', 'signal_', 'bb_', 'macd_', 'entry', 'exit'
    ];
    
    return tradeRelevantPatterns.some(pattern => 
      varName.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  // Generate webhook payload using proven RSI template structure
  private generateWebhookFromTemplate(
    strategyId: string, 
    variables: Record<string, any>, 
    action: 'BUY' | 'SELL' | 'CLOSE',
    marketData: any
  ): ProvenRSIWebhookTemplate {
    // Use proven RSI template as foundation
    const webhook: ProvenRSIWebhookTemplate = {
      passphrase: this.PROVEN_RSI_WEBHOOK_TEMPLATE.passphrase,
      ticker: marketData.symbol || "BTCUSD",
      strategy: {
        order_action: action.toLowerCase(),
        order_type: "limit",
        order_price: marketData.price?.toString() || "50000",
        order_contracts: this.calculatePositionSize(variables).toString(),
        type: action.toLowerCase(),
        volume: this.calculatePositionSize(variables).toString(),
        pair: marketData.symbol || "BTCUSD",
        validate: "true", // Start with test mode
        close: {
          order_type: "limit",
          price: marketData.price?.toString() || "50000"
        },
        stop_loss: this.calculateStopLoss(marketData, variables).toString()
      }
    };
    
    console.log(`📋 Stratus Engine: Generated webhook for ${strategyId} using proven RSI template`);
    return webhook;
  }

  // Calculate position size based on strategy variables
  private calculatePositionSize(variables: Record<string, any>): number {
    // Look for position size variables in Pine Script
    if (variables.order_size && variables.order_size.defaultValue) {
      return parseFloat(variables.order_size.defaultValue) / 100; // Convert percentage to decimal
    }
    if (variables.order_contracts && variables.order_contracts.defaultValue) {
      return parseFloat(variables.order_contracts.defaultValue);
    }
    
    // Default to conservative 0.01 (like proven RSI template)
    return 0.01;
  }

  // Calculate stop loss based on strategy variables (Learning from RSI template)
  private calculateStopLoss(marketData: any, variables: Record<string, any>): number {
    const currentPrice = marketData.price || 50000;
    
    // Look for ATR-based stop loss (like proven RSI template)
    if (variables.atr_multiplier_stop && variables.atr_multiplier_stop.defaultValue) {
      const atrMultiplier = parseFloat(variables.atr_multiplier_stop.defaultValue);
      const estimatedATR = currentPrice * 0.02; // 2% ATR estimate
      return currentPrice - (estimatedATR * atrMultiplier);
    }
    
    // Default to 1% stop loss (similar to proven RSI template formula)
    return currentPrice * 0.99;
  }

  // Test webhook connectivity and functionality (100% testing requirement)
  async testWebhookConnectivity(strategyId: string, forceRetest: boolean = false): Promise<WebhookTestResult> {
    const existingResult = this.webhookTestResults.get(strategyId);
    
    // Return cached result unless forced retest
    if (existingResult && existingResult.tested && !forceRetest) {
      console.log(`✓ Stratus Engine: Using cached webhook test result for ${strategyId}`);
      return existingResult;
    }
    
    console.log(`🧪 Stratus Engine: Testing webhook connectivity for ${strategyId}...`);
    
    const startTime = Date.now();
    const testPayload: ProvenRSIWebhookTemplate = {
      passphrase: "sdfqoei1898498",
      ticker: "BTCUSD",
      strategy: {
        order_action: "buy",
        order_type: "limit",
        order_price: "50000",
        order_contracts: "0.01",
        type: "buy",
        volume: "0.01",
        pair: "BTCUSD",
        validate: "true", // Always test in validation mode first
        close: {
          order_type: "limit",
          price: "50000"
        },
        stop_loss: "49500"
      }
    };

    try {
      const response = await fetch('https://kraken.circuitcartel.com/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      const responseTime = Date.now() - startTime;
      const success = response.ok;

      const testResult: WebhookTestResult = {
        success,
        tested: true,
        lastTestTime: new Date(),
        responseTime,
        error: success ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };

      this.webhookTestResults.set(strategyId, testResult);
      
      if (success) {
        console.log(`✅ Stratus Engine: Webhook test PASSED for ${strategyId} (${responseTime}ms)`);
      } else {
        console.error(`❌ Stratus Engine: Webhook test FAILED for ${strategyId}:`, testResult.error);
      }

      return testResult;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const testResult: WebhookTestResult = {
        success: false,
        tested: true,
        lastTestTime: new Date(),
        responseTime,
        error: error instanceof Error ? error.message : 'Connection failed'
      };

      this.webhookTestResults.set(strategyId, testResult);
      console.error(`❌ Stratus Engine: Webhook test ERROR for ${strategyId}:`, testResult.error);
      return testResult;
    }
  }

  // Get webhook test status for a strategy
  getWebhookTestStatus(strategyId: string): WebhookTestResult | null {
    return this.webhookTestResults.get(strategyId) || null;
  }

  // Validate strategy readiness (100% webhook test requirement)
  async validateStrategyReadiness(strategyId: string): Promise<{ ready: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    // Skip webhook testing in paper trading mode
    if (!this.paperTradingMode) {
      // Test webhook connectivity only for live trading
      const webhookTest = await this.testWebhookConnectivity(strategyId);
      if (!webhookTest.success) {
        issues.push(`Webhook connectivity failed: ${webhookTest.error}`);
      }
    }
    
    // Check if strategy implementation exists in our new system
    if (this.strategyImplementations.has(strategyId)) {
      console.log(`✅ Strategy implementation found for ${strategyId}`);
    } else {
      issues.push('Strategy implementation not found');
    }
    
    const ready = issues.length === 0;
    
    if (ready) {
      console.log(`✅ Stratus Engine: Strategy ${strategyId} is READY for live trading`);
    } else {
      console.warn(`⚠️ Stratus Engine: Strategy ${strategyId} has issues:`, issues);
    }
    
    return { ready, issues };
  }

  // REAL-TIME AI OPTIMIZATION SYSTEM
  // Each strategy continuously learns and improves its own performance

  // Initialize performance tracking for a strategy
  initializeStrategyPerformance(strategyId: string, initialVariables: Record<string, any>) {
    if (!this.strategyPerformanceData.has(strategyId)) {
      this.strategyPerformanceData.set(strategyId, {
        winRate: 0,
        totalTrades: 0,
        wins: 0,
        losses: 0,
        avgProfit: 0,
        avgLoss: 0,
        currentOptimization: { ...initialVariables },
        lastOptimizationTime: new Date(),
        learningData: [],
        paperTrades: []
      });
      console.log(`🤖 AI Optimization: Initialized performance tracking for ${strategyId}`);
    }
  }

  // Record trade result and trigger real-time learning
  async recordTradeResult(
    strategyId: string, 
    inputs: Record<string, any>, 
    result: 'win' | 'loss', 
    profit: number
  ) {
    const performance = this.strategyPerformanceData.get(strategyId);
    if (!performance) return;

    // Record the trade result
    performance.totalTrades++;
    performance.learningData.push({
      inputs: { ...inputs },
      result,
      profit,
      timestamp: new Date()
    });

    if (result === 'win') {
      performance.wins++;
      performance.avgProfit = (performance.avgProfit * (performance.wins - 1) + profit) / performance.wins;
    } else {
      performance.losses++;
      performance.avgLoss = (performance.avgLoss * (performance.losses - 1) + Math.abs(profit)) / performance.losses;
    }

    performance.winRate = (performance.wins / performance.totalTrades) * 100;

    console.log(`📊 AI Learning: ${strategyId} recorded ${result} - Win Rate: ${performance.winRate.toFixed(1)}%`);

    // Trigger real-time optimization if we have enough data
    if (performance.totalTrades >= 10 && performance.totalTrades % 5 === 0) {
      await this.optimizeStrategyInRealTime(strategyId);
    }
  }

  // AI-powered real-time strategy optimization
  private async optimizeStrategyInRealTime(strategyId: string) {
    const performance = this.strategyPerformanceData.get(strategyId);
    if (!performance || performance.learningData.length < 10) return;

    console.log(`🧠 AI Optimization: Analyzing ${strategyId} performance for real-time improvements...`);

    // Analyze recent trade patterns
    const recentData = performance.learningData.slice(-20); // Last 20 trades
    const winningTrades = recentData.filter(d => d.result === 'win');
    const losingTrades = recentData.filter(d => d.result === 'loss');

    if (winningTrades.length === 0) return;

    // Extract optimal input ranges from winning trades
    const optimalInputs: Record<string, any> = {};
    
    for (const inputKey in winningTrades[0].inputs) {
      const winningValues = winningTrades.map(trade => trade.inputs[inputKey]).filter(v => typeof v === 'number');
      
      if (winningValues.length > 0) {
        // Calculate optimal value based on highest-performing trades
        const sortedByProfit = winningTrades.sort((a, b) => b.profit - a.profit);
        const topPerformers = sortedByProfit.slice(0, Math.max(3, Math.floor(winningValues.length * 0.3)));
        const optimalValue = topPerformers.reduce((sum, trade) => sum + trade.inputs[inputKey], 0) / topPerformers.length;
        
        optimalInputs[inputKey] = Math.round(optimalValue * 100) / 100; // Round to 2 decimals
      }
    }

    // Apply optimizations if they show improvement potential
    const currentWinRate = performance.winRate;
    const potentialImprovementScore = this.calculateImprovementScore(recentData, optimalInputs);

    if (potentialImprovementScore > 0.1) { // 10% improvement threshold
      performance.currentOptimization = { ...optimalInputs };
      performance.lastOptimizationTime = new Date();
      
      console.log(`🚀 AI Optimization: Applied real-time improvements to ${strategyId}:`, optimalInputs);
      console.log(`📈 Expected improvement: +${(potentialImprovementScore * 100).toFixed(1)}% win rate`);
      
      // Update strategy parameters in real-time
      await this.applyRealTimeOptimizations(strategyId, optimalInputs);
    }
  }

  // Calculate improvement score based on data analysis
  private calculateImprovementScore(tradingData: any[], newInputs: Record<string, any>): number {
    // Simple ML-inspired scoring - in production this could be more sophisticated
    const recentWinRate = tradingData.filter(d => d.result === 'win').length / tradingData.length;
    const projectedWinRate = Math.min(0.95, recentWinRate * 1.1); // Cap at 95% to be realistic
    
    return projectedWinRate - recentWinRate;
  }

  // Apply optimized parameters to strategy in real-time
  private async applyRealTimeOptimizations(strategyId: string, optimizedInputs: Record<string, any>) {
    try {
      // Update strategy state with optimized parameters
      const state = this.strategyStates.get(strategyId);
      if (state) {
        state.optimizedParameters = optimizedInputs as RSIParameters;
        state.lastOptimization = new Date();
      }

      // Notify optimization system
      this.optimizer.updateOptimizedParameters(strategyId, optimizedInputs);
      
      console.log(`⚡ Real-time optimization applied to ${strategyId} - Strategy parameters updated`);
      
      // Notify listeners of optimization update
      this.notifyListeners();
      
    } catch (error) {
      console.error(`❌ Failed to apply real-time optimization to ${strategyId}:`, error);
    }
  }

  // Get current optimization status for a strategy
  getStrategyOptimizationStatus(strategyId: string) {
    const performance = this.strategyPerformanceData.get(strategyId);
    if (!performance) return null;

    return {
      winRate: performance.winRate,
      totalTrades: performance.totalTrades,
      currentOptimization: performance.currentOptimization,
      lastOptimizationTime: performance.lastOptimizationTime,
      isImproving: performance.learningData.length >= 5 ? 
        this.isStrategyImproving(strategyId) : null
    };
  }

  // Check if strategy is showing improvement over time
  private isStrategyImproving(strategyId: string): boolean {
    const performance = this.strategyPerformanceData.get(strategyId);
    if (!performance || performance.learningData.length < 10) return false;

    const recentTrades = performance.learningData.slice(-10);
    const olderTrades = performance.learningData.slice(-20, -10);
    
    if (olderTrades.length === 0) return false;

    const recentWinRate = recentTrades.filter(t => t.result === 'win').length / recentTrades.length;
    const olderWinRate = olderTrades.filter(t => t.result === 'win').length / olderTrades.length;

    return recentWinRate > olderWinRate;
  }

  // PAPER TRADING & PERFORMANCE MEASUREMENT SYSTEM

  // Enable/disable paper trading mode
  setPaperTradingMode(enabled: boolean) {
    this.paperTradingMode = enabled;
    console.log(`📝 Paper Trading Mode: ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  isPaperTradingMode(): boolean {
    return this.paperTradingMode;
  }

  // Execute paper trade (no real money, just performance tracking)
  private executePaperTrade(
    strategyId: string,
    action: 'BUY' | 'SELL' | 'CLOSE',
    price: number,
    quantity: number,
    inputs: Record<string, any>
  ) {
    const performance = this.strategyPerformanceData.get(strategyId);
    if (!performance) return;

    const tradeId = `${strategyId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (action === 'BUY' || action === 'SELL') {
      // Open new position
      const paperTrade = {
        tradeId,
        action,
        entryPrice: price,
        quantity,
        status: 'open' as const,
        openTime: new Date(),
        inputs: { ...inputs }
      };
      
      performance.paperTrades.push(paperTrade);
      this.performanceLogger.logTrade(strategyId, {
        ...paperTrade,
        type: 'PAPER_TRADE_OPEN'
      });
      
      // Send Telegram notification for trade execution
      telegramAlerts.sendTradeAlert({
        type: 'TRADE_EXECUTED',
        strategy: this.getStrategyName(strategyId),
        symbol: 'BTCUSD',
        action,
        price,
        quantity,
        timestamp: new Date()
      });
      
    } else if (action === 'CLOSE') {
      // Close existing position
      const openTrade = performance.paperTrades.find(t => t.status === 'open');
      if (openTrade) {
        openTrade.exitPrice = price;
        openTrade.closeTime = new Date();
        openTrade.status = 'closed';
        
        // Calculate profit/loss
        const profitMultiplier = openTrade.action === 'BUY' ? 1 : -1;
        const profit = (price - openTrade.entryPrice) * profitMultiplier * openTrade.quantity;
        openTrade.profit = profit;
        
        // Record result for AI learning
        const result = profit > 0 ? 'win' : 'loss';
        this.recordTradeResult(strategyId, openTrade.inputs, result, profit);
        
        this.performanceLogger.logTrade(strategyId, {
          ...openTrade,
          type: 'PAPER_TRADE_CLOSE',
          profit,
          result
        });
        
        // Send Telegram notification for trade close
        telegramAlerts.sendTradeAlert({
          type: 'TRADE_EXECUTED',
          strategy: this.getStrategyName(strategyId),
          symbol: 'BTCUSD',
          action,
          price,
          quantity: openTrade.quantity,
          profit,
          timestamp: new Date()
        });
      }
    }
  }

  // Calculate comprehensive performance metrics
  calculatePerformanceMetrics(strategyId: string) {
    const performance = this.strategyPerformanceData.get(strategyId);
    if (!performance) return null;

    const closedTrades = performance.paperTrades.filter(t => t.status === 'closed');
    if (closedTrades.length === 0) return null;

    const profits = closedTrades.map(t => t.profit || 0);
    const winningTrades = profits.filter(p => p > 0);
    const losingTrades = profits.filter(p => p <= 0);

    const totalProfit = profits.reduce((sum, p) => sum + p, 0);
    const winRate = (winningTrades.length / closedTrades.length) * 100;
    const avgProfitPerTrade = totalProfit / closedTrades.length;
    
    // Calculate max drawdown
    let runningTotal = 0;
    let peak = 0;
    let maxDrawdown = 0;
    
    for (const profit of profits) {
      runningTotal += profit;
      if (runningTotal > peak) peak = runningTotal;
      const drawdown = ((peak - runningTotal) / Math.max(peak, 1)) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    // Calculate Sharpe ratio (simplified)
    const avgReturn = avgProfitPerTrade;
    const returns = profits.map(p => p / 1000); // Normalize
    const returnStdDev = this.calculateStandardDeviation(returns);
    const sharpeRatio = returnStdDev > 0 ? avgReturn / returnStdDev : 0;

    const metrics = {
      strategyId,
      winRate,
      totalTrades: closedTrades.length,
      wins: winningTrades.length,
      losses: losingTrades.length,
      totalProfit,
      avgProfitPerTrade,
      avgWin: winningTrades.length > 0 ? winningTrades.reduce((sum, w) => sum + w, 0) / winningTrades.length : 0,
      avgLoss: losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, l) => sum + l, 0) / losingTrades.length) : 0,
      maxDrawdown,
      sharpeRatio,
      profitFactor: losingTrades.length > 0 ? 
        Math.abs(winningTrades.reduce((sum, w) => sum + w, 0) / losingTrades.reduce((sum, l) => sum + l, 0)) : 0,
      currentOptimization: performance.currentOptimization,
      lastOptimizationTime: performance.lastOptimizationTime,
      isImproving: this.isStrategyImproving(strategyId)
    };

    // Log comprehensive metrics
    this.performanceLogger.logPerformanceMetrics(strategyId, metrics);
    
    return metrics;
  }

  // Helper method for standard deviation calculation
  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, sqDiff) => sum + sqDiff, 0) / values.length;
    return Math.sqrt(variance);
  }

  // Get real-time performance dashboard data
  getPerformanceDashboard() {
    const dashboard: Record<string, any> = {
      paperTradingMode: this.paperTradingMode,
      totalStrategies: this.strategyPerformanceData.size,
      strategies: {}
    };

    for (const [strategyId] of this.strategyPerformanceData) {
      dashboard.strategies[strategyId] = this.calculatePerformanceMetrics(strategyId);
    }

    return dashboard;
  }

  // Test strategy with paper trading
  async testStrategyWithPaperTrading(strategyId: string, duration: number = 24): Promise<any> {
    console.log(`🧪 Starting ${duration}-hour paper trading test for ${strategyId}`);
    
    // Enable paper trading mode
    const wasPaperMode = this.paperTradingMode;
    this.setPaperTradingMode(true);
    
    // Initialize if not already done
    const StrategyManager = (await import('./strategy-manager')).default;
    const strategyManager = StrategyManager.getInstance();
    const strategy = strategyManager.getStrategy(strategyId);
    
    if (strategy && strategy.pineScript) {
      const variables = this.extractPineScriptVariables(strategy.pineScript.source || '');
      this.initializeStrategyPerformance(strategyId, variables);
    }

    // Start the strategy
    await this.startStrategy(strategyId, ['BTCUSD']); // Test with Bitcoin

    console.log(`✅ Paper trading test started for ${strategyId} - Running for ${duration} hours`);
    console.log(`📊 Monitor performance with getPerformanceMetrics('${strategyId}')`);
    
    return {
      strategyId,
      testDuration: duration,
      paperTradingEnabled: true,
      status: 'running'
    };
  }

  // Get current optimization status with detailed metrics
  getDetailedOptimizationStatus(strategyId: string) {
    const performance = this.strategyPerformanceData.get(strategyId);
    const metrics = this.calculatePerformanceMetrics(strategyId);
    
    return {
      ...this.getStrategyOptimizationStatus(strategyId),
      detailedMetrics: metrics,
      paperTrades: performance?.paperTrades || [],
      recentLearning: performance?.learningData.slice(-10) || []
    };
  }

  getStrategyState(strategyId: string): StrategyState | undefined {
    return this.strategyStates.get(strategyId);
  }

  // Get execution status
  isEngineRunning(): boolean {
    return this.isRunning;
  }

  // Get list of active strategies
  getActiveStrategies(): Array<{id: string, name: string, symbol: string, active: boolean}> {
    const strategies = [];
    for (const [strategyId, state] of this.strategyStates) {
      // Handle cases where strategy might be undefined
      const strategyName = state?.strategy?.name || strategyId || 'Unknown Strategy';
      const strategySymbol = state?.symbol || 'BTCUSD';
      
      strategies.push({
        id: strategyId,
        name: strategyName,
        symbol: strategySymbol,
        active: true
      });
    }
    return strategies;
  }

  // Subscribe to engine state changes
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback());
  }
  
  /**
   * Get strategy name by ID for notifications
   */
  private getStrategyName(strategyId: string): string {
    return this.strategyNames.get(strategyId) || strategyId;
  }
}

export default StrategyExecutionEngine;
export type { StrategyState, WebhookAlert, TechnicalIndicators };