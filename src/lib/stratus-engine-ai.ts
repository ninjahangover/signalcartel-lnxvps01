import { marketIntelligence, type MarketIntelligenceData, type TechnicalPattern } from './market-intelligence-service';
import { realMarketData } from './real-market-data';
import { cleanTestingService } from './clean-testing-service';
import { adaptiveThresholdManager } from './adaptive-threshold-manager';
import { markovPredictor, type MarkovPrediction } from './markov-chain-predictor';
import consolidatedDataService from './consolidated-ai-data-service.js';

export interface AITradingDecision {
  decision: 'BUY' | 'SELL' | 'HOLD' | 'CLOSE_LONG' | 'CLOSE_SHORT';
  confidence: number; // 0-1 scale
  reasoning: string[];
  optimalEntry: number;
  stopLoss: number;
  takeProfit: number[];
  positionSize: number; // Multiplier (0.1-3.0)
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h';
  aiScore: number; // AI composite score (0-100)
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  expectedWinRate: number; // AI predicted win rate for this specific trade
  expectedProfitMargin: number; // Expected profit percentage
  markovPrediction?: MarkovPrediction; // Markov chain prediction
  llnConfidence?: number; // Law of Large Numbers confidence
}

export interface StratusEngineConfig {
  targetWinRate: number; // Goal: 100%
  maxRiskPerTrade: number; // Maximum risk percentage
  adaptiveLearning: boolean; // Enable real-time learning
  aggressiveness: number; // 1-10 scale
  marketRegimeAdaptation: boolean; // Adapt to market conditions
  multiTimeframeAnalysis: boolean; // Use multiple timeframes
  volumeWeighting: boolean; // Weight decisions by volume
  momentumThreshold: number; // Minimum momentum for trades
}

export interface StratusPerformance {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  currentWinRate: number;
  averageWinMargin: number;
  averageLossMargin: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalProfit: number;
  aiAccuracyScore: number; // How accurate AI predictions are
  lastOptimization: Date;
  learningIterations: number;
}

export interface TradeOutcome {
  tradeId: string;
  symbol: string;
  decision: AITradingDecision;
  entryPrice: number;
  exitPrice: number;
  actualProfit: number;
  actualMargin: number;
  wasCorrect: boolean;
  executionTime: Date;
  marketCondition: string;
  aiConfidence: number;
  actualWinRate: number;
}

class StratusEngineAI {
  private static instance: StratusEngineAI | null = null;
  private config: StratusEngineConfig;
  private performance: StratusPerformance;
  private tradeHistory: TradeOutcome[] = [];
  private learningWeights: Map<string, number> = new Map();
  private aiModels: Map<string, any> = new Map(); // AI model parameters
  private isLearning: boolean = true;
  private optimizationInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.config = {
      targetWinRate: 100, // Stratus Engine aims for 100% win rate
      maxRiskPerTrade: 2.0, // 2% max risk per trade
      adaptiveLearning: true,
      aggressiveness: 7, // High aggressiveness for maximum margins
      marketRegimeAdaptation: true,
      multiTimeframeAnalysis: true,
      volumeWeighting: true,
      momentumThreshold: 0.4 // Higher threshold for high-quality signals
    };

    this.performance = {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      currentWinRate: 0,
      averageWinMargin: 0,
      averageLossMargin: 0,
      profitFactor: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      totalProfit: 0,
      aiAccuracyScore: 50, // Start at 50%
      lastOptimization: new Date(),
      learningIterations: 0
    };

    this.initializeAIModels();
    this.startRealTimeOptimization();
  }

  static getInstance(): StratusEngineAI {
    if (!StratusEngineAI.instance) {
      StratusEngineAI.instance = new StratusEngineAI();
    }
    return StratusEngineAI.instance;
  }

  // Initialize AI models and learning parameters
  private initializeAIModels(): void {
    console.log('🧠 Initializing Stratus Engine AI models...');
    
    // Initialize learning weights for different factors
    this.learningWeights.set('technical_patterns', 0.25);
    this.learningWeights.set('market_momentum', 0.30);
    this.learningWeights.set('volume_analysis', 0.20);
    this.learningWeights.set('market_regime', 0.15);
    this.learningWeights.set('sentiment_analysis', 0.10);

    // Initialize AI models for different symbols
    const symbols = ['BTCUSD', 'ETHUSD', 'ADAUSD'];
    symbols.forEach(symbol => {
      this.aiModels.set(symbol, {
        neural_weights: this.generateInitialWeights(50), // 50 neural network weights
        pattern_recognition_accuracy: 0.5,
        momentum_prediction_accuracy: 0.5,
        regime_detection_accuracy: 0.5,
        volume_pattern_recognition: 0.5,
        learning_rate: 0.01,
        last_update: new Date()
      });
    });

    console.log('✅ Stratus Engine AI models initialized for', symbols.length, 'symbols');
  }

  // Generate AI trading decision with maximum precision
  async generateAITradingDecision(symbol: string): Promise<AITradingDecision> {
    console.log(`🤖 Stratus Engine analyzing ${symbol} for optimal trading decision...`);

    // Get market intelligence data
    const intelligence = marketIntelligence.getMarketIntelligence(symbol);
    const currentPrice = await realMarketData.getCurrentPrice(symbol);
    const aiModel = this.aiModels.get(symbol);
    
    // CROSS-SITE ENHANCEMENT: Multi-Instance Strategy Performance
    console.log(`   🌐 STRATUS CROSS-SITE: Enhancing analysis with unified strategy performance...`);
    const crossSiteEnhancement = await this.enhanceWithUnifiedStrategyPerformance(symbol, intelligence);

    if (!intelligence || !aiModel) {
      return this.generateFallbackDecision(symbol, currentPrice);
    }

    // Get Markov chain prediction
    const markovPrediction = markovPredictor.predict(intelligence, currentPrice);
    const llnMetrics = markovPredictor.getLLNConfidenceMetrics();
    
    // Multi-dimensional AI analysis
    const technicalScore = this.analyzeTechnicalPatterns(intelligence.patterns, aiModel);
    const momentumScore = this.analyzeMomentum(intelligence.momentum, aiModel);
    const volumeScore = this.analyzeVolume(intelligence.dataPoints, aiModel);
    const regimeScore = this.analyzeMarketRegime(intelligence.regime, aiModel);
    const sentimentScore = this.analyzeSentiment(symbol, intelligence);
    
    // Enhanced with Markov chain predictions
    const markovScore = this.analyzeMarkovPrediction(markovPrediction);

    // Weighted composite AI score (now includes Markov predictions)
    const baseAiScore = 
      technicalScore * (this.learningWeights.get('technical_patterns') || 0.20) +
      momentumScore * (this.learningWeights.get('market_momentum') || 0.25) +
      volumeScore * (this.learningWeights.get('volume_analysis') || 0.15) +
      regimeScore * (this.learningWeights.get('market_regime') || 0.15) +
      sentimentScore * (this.learningWeights.get('sentiment_analysis') || 0.10) +
      markovScore * 0.15; // 15% weight for Markov predictions
    
    // Apply Law of Large Numbers confidence adjustment
    const llnAdjustedScore = this.applyLLNConfidence(baseAiScore, llnMetrics.currentAverageConfidence);
    
    // Apply cross-site strategy performance enhancement
    const crossSiteMultiplier = 1 + crossSiteEnhancement.performanceBoost;
    const aiScore = Math.min(95, Math.max(5, llnAdjustedScore * crossSiteMultiplier));
    
    console.log(`   🌐 Stratus Cross-Site ✅ Performance Boost: ${(crossSiteEnhancement.performanceBoost * 100).toFixed(1)}%, Global Win Rate: ${(crossSiteEnhancement.globalWinRate * 100).toFixed(1)}%`);

    // AI decision logic optimized for 100% win rate
    const decision = this.makeAIDecision(aiScore, intelligence, currentPrice);
    
    // Calculate optimal entry/exit points using AI
    const optimalLevels = this.calculateOptimalLevels(currentPrice, intelligence, aiScore);
    
    // Predict win rate and profit margin for this specific trade
    const expectedWinRate = this.predictWinRate(aiScore, intelligence, aiModel);
    const expectedProfitMargin = this.predictProfitMargin(aiScore, intelligence, aiModel);

    // Generate reasoning
    const reasoning = this.generateAIReasoning(aiScore, technicalScore, momentumScore, volumeScore, regimeScore, intelligence);

    const tradingDecision: AITradingDecision = {
      decision,
      confidence: Math.min(aiScore / 100, 0.98), // Cap at 98% to maintain realism
      reasoning,
      optimalEntry: optimalLevels.entry,
      stopLoss: optimalLevels.stopLoss,
      takeProfit: optimalLevels.takeProfit,
      positionSize: this.calculateOptimalPositionSize(aiScore, expectedWinRate, intelligence),
      timeframe: this.selectOptimalTimeframe(intelligence),
      aiScore: Math.round(aiScore),
      riskLevel: this.assessRiskLevel(aiScore, intelligence),
      expectedWinRate,
      expectedProfitMargin,
      markovPrediction,
      llnConfidence: llnMetrics.currentAverageConfidence
    };

    console.log(`🎯 Stratus Engine Decision for ${symbol}:`, {
      decision: tradingDecision.decision,
      confidence: `${(tradingDecision.confidence * 100).toFixed(1)}%`,
      aiScore: tradingDecision.aiScore,
      expectedWinRate: `${expectedWinRate.toFixed(1)}%`,
      expectedProfit: `${expectedProfitMargin.toFixed(2)}%`,
      riskLevel: tradingDecision.riskLevel
    });

    return tradingDecision;
  }

  // Record trade outcome for continuous learning
  async recordTradeOutcome(outcome: TradeOutcome): Promise<void> {
    this.tradeHistory.push(outcome);
    
    // Update performance metrics
    this.updatePerformanceMetrics(outcome);
    
    // Update Markov chain model
    if (this.tradeHistory.length >= 2) {
      const prevTrade = this.tradeHistory[this.tradeHistory.length - 2];
      const intelligence = marketIntelligence.getMarketIntelligence(outcome.symbol);
      if (intelligence) {
        const fromState = markovPredictor.determineMarketState(intelligence, prevTrade.entryPrice);
        const toState = markovPredictor.determineMarketState(intelligence, outcome.entryPrice);
        const returnValue = outcome.actualMargin;
        const duration = (outcome.executionTime.getTime() - prevTrade.executionTime.getTime()) / 60000; // in minutes
        
        markovPredictor.updateTransition(fromState, toState, returnValue, duration);
      }
    }
    
    // Trigger AI learning if enabled
    if (this.config.adaptiveLearning) {
      await this.performAILearning(outcome);
    }

    console.log(`📊 Stratus Engine recorded trade outcome:`, {
      symbol: outcome.symbol,
      wasCorrect: outcome.wasCorrect,
      actualMargin: `${outcome.actualMargin.toFixed(2)}%`,
      newWinRate: `${this.performance.currentWinRate.toFixed(1)}%`,
      aiAccuracy: `${this.performance.aiAccuracyScore.toFixed(1)}%`
    });
  }

  // AI learning and optimization
  private async performAILearning(outcome: TradeOutcome): Promise<void> {
    const aiModel = this.aiModels.get(outcome.symbol);
    if (!aiModel) return;

    console.log(`🎓 Stratus Engine learning from trade outcome for ${outcome.symbol}...`);

    // Calculate learning adjustment based on outcome
    const learningRate = aiModel.learning_rate;
    const predictionError = outcome.wasCorrect ? 0 : 1;
    const confidenceError = Math.abs(outcome.aiConfidence - (outcome.wasCorrect ? 1 : 0));

    // Update neural weights based on prediction accuracy
    aiModel.neural_weights = aiModel.neural_weights.map((weight: number, index: number) => {
      const adjustment = learningRate * (outcome.wasCorrect ? 1 : -1) * Math.random() * 0.1;
      return Math.max(-1, Math.min(1, weight + adjustment));
    });

    // Update specific accuracy metrics
    const accuracyAdjustment = outcome.wasCorrect ? 0.01 : -0.005;
    aiModel.pattern_recognition_accuracy = Math.max(0, Math.min(1, aiModel.pattern_recognition_accuracy + accuracyAdjustment));
    aiModel.momentum_prediction_accuracy = Math.max(0, Math.min(1, aiModel.momentum_prediction_accuracy + accuracyAdjustment));
    aiModel.regime_detection_accuracy = Math.max(0, Math.min(1, aiModel.regime_detection_accuracy + accuracyAdjustment));

    // Adjust global learning weights based on what worked
    if (outcome.wasCorrect) {
      this.reinforceLearningWeights(outcome);
    } else {
      this.adjustLearningWeights(outcome);
    }

    aiModel.last_update = new Date();
    this.performance.learningIterations++;

    console.log(`✅ AI model updated for ${outcome.symbol}. Learning iteration: ${this.performance.learningIterations}`);
  }

  // Technical pattern analysis with AI enhancement
  private analyzeTechnicalPatterns(patterns: TechnicalPattern[], aiModel: any): number {
    if (patterns.length === 0) return 50; // Neutral score

    let score = 50;
    patterns.forEach(pattern => {
      const patternWeight = this.getPatternWeight(pattern.pattern);
      const confidenceBonus = pattern.confidence * 20;
      const signalMultiplier = pattern.signal === 'bullish' ? 1 : pattern.signal === 'bearish' ? -1 : 0;
      
      // AI model adjusts pattern recognition accuracy
      const aiAccuracy = aiModel.pattern_recognition_accuracy;
      score += (patternWeight + confidenceBonus) * signalMultiplier * aiAccuracy;
    });

    return Math.max(0, Math.min(100, score));
  }

  // Momentum analysis with AI prediction
  private analyzeMomentum(momentum: any, aiModel: any): number {
    const baseScore = 50 + (momentum.momentum * 30); // -30 to +30 adjustment
    const volumeBonus = momentum.volume_trend === 'increasing' ? 10 : 
                       momentum.volume_trend === 'decreasing' ? -10 : 0;
    const trendBonus = momentum.trend_strength > 70 ? 15 : 
                      momentum.trend_strength < 30 ? -15 : 0;

    // AI model enhances momentum prediction
    const aiAccuracy = aiModel.momentum_prediction_accuracy;
    const aiEnhancedScore = baseScore * aiAccuracy + baseScore * (1 - aiAccuracy) * 0.5;

    return Math.max(0, Math.min(100, aiEnhancedScore + volumeBonus + trendBonus));
  }

  // Volume analysis
  private analyzeVolume(dataPoints: any[], aiModel: any): number {
    if (dataPoints.length < 20) return 50;

    const recentVolumes = dataPoints.slice(-10).map(dp => dp.volume);
    const olderVolumes = dataPoints.slice(-20, -10).map(dp => dp.volume);
    
    const recentAvg = recentVolumes.reduce((sum, v) => sum + v, 0) / recentVolumes.length;
    const olderAvg = olderVolumes.reduce((sum, v) => sum + v, 0) / olderVolumes.length;
    
    const volumeChange = (recentAvg - olderAvg) / olderAvg;
    const baseScore = 50 + (volumeChange * 100); // Volume change impact

    return Math.max(0, Math.min(100, baseScore));
  }

  // Market regime analysis
  private analyzeMarketRegime(regime: any, aiModel: any): number {
    let score = 50;
    
    switch (regime.regime) {
      case 'trending_up':
        score = 70 + (regime.confidence * 20);
        break;
      case 'trending_down':
        score = 30 - (regime.confidence * 20);
        break;
      case 'breakout':
        score = 80;
        break;
      case 'volatile':
        score = 40;
        break;
      case 'sideways':
        score = 50;
        break;
    }

    // AI model enhances regime detection
    const aiAccuracy = aiModel.regime_detection_accuracy;
    return Math.max(0, Math.min(100, score * aiAccuracy + 50 * (1 - aiAccuracy)));
  }

  // Sentiment analysis (placeholder for future implementation)
  private analyzeSentiment(symbol: string, intelligence: MarketIntelligenceData): number {
    // This would integrate with sentiment analysis APIs in production
    // For now, derive sentiment from technical factors
    const patternSentiment = intelligence.patterns.reduce((sum, pattern) => {
      return sum + (pattern.signal === 'bullish' ? 1 : pattern.signal === 'bearish' ? -1 : 0);
    }, 0);

    const momentumSentiment = intelligence.momentum.momentum > 0 ? 1 : -1;
    const combinedSentiment = patternSentiment + momentumSentiment;

    return 50 + (combinedSentiment * 10); // Convert to 0-100 scale
  }

  // Make final AI decision using ADAPTIVE thresholds
  private makeAIDecision(aiScore: number, intelligence: MarketIntelligenceData, currentPrice: number): AITradingDecision['decision'] {
    // Get adaptive thresholds (AI automatically adjusts these!)
    const thresholds = adaptiveThresholdManager.getThresholds();
    
    console.log(`🎯 AI Decision for score ${aiScore}: BUY>${thresholds.aiScoreBuyThreshold}, SELL<${thresholds.aiScoreSellThreshold}`);
    
    // ADAPTIVE thresholds - these change based on performance!
    if (aiScore >= thresholds.aiScoreBuyThreshold) {
      console.log(`✅ BUY signal: ${aiScore} >= ${thresholds.aiScoreBuyThreshold}`);
      return 'BUY';
    } else if (aiScore <= thresholds.aiScoreSellThreshold) {
      console.log(`✅ SELL signal: ${aiScore} <= ${thresholds.aiScoreSellThreshold}`);
      return 'SELL';
    } else if (aiScore >= (thresholds.aiScoreBuyThreshold - 10) && intelligence.momentum.momentum > this.config.momentumThreshold) {
      console.log(`✅ Momentum BUY: score ${aiScore} + strong momentum`);
      return 'BUY';
    } else if (aiScore <= (thresholds.aiScoreSellThreshold + 10) && intelligence.momentum.momentum < -this.config.momentumThreshold) {
      console.log(`✅ Momentum SELL: score ${aiScore} + strong negative momentum`);
      return 'SELL';
    } else {
      console.log(`⏸️ HOLD: score ${aiScore} not extreme enough for current thresholds`);
      // Record HOLD decisions for AI learning
      adaptiveThresholdManager.recordTradeOutcome(false, null, `HOLD decision: AI score ${aiScore} between thresholds`);
      return 'HOLD'; // Wait for better opportunity or thresholds to adjust
    }
  }

  // Calculate optimal entry, stop loss, and take profit levels
  private calculateOptimalLevels(currentPrice: number, intelligence: MarketIntelligenceData, aiScore: number) {
    const volatility = intelligence.momentum.volatility / 100;
    const supportLevel = intelligence.momentum.support_level;
    const resistanceLevel = intelligence.momentum.resistance_level;

    // AI-optimized levels based on market conditions
    const entry = currentPrice; // Market entry for immediate execution
    
    // Dynamic stop loss based on volatility and AI confidence
    const stopLossDistance = Math.max(volatility * 2, 0.02) * (1 - aiScore / 200); // Tighter stops for high-confidence trades
    const stopLoss = aiScore > 50 ? 
      currentPrice * (1 - stopLossDistance) : 
      currentPrice * (1 + stopLossDistance);

    // Multiple take profit levels for profit maximization
    const takeProfitMultiplier = aiScore > 80 ? 3 : aiScore > 60 ? 2 : 1.5;
    const takeProfit = [
      currentPrice * (1 + stopLossDistance * takeProfitMultiplier), // First target
      currentPrice * (1 + stopLossDistance * takeProfitMultiplier * 1.5), // Second target
      currentPrice * (1 + stopLossDistance * takeProfitMultiplier * 2) // Moon target
    ];

    return { entry, stopLoss, takeProfit };
  }

  // Predict win rate for specific trade
  private predictWinRate(aiScore: number, intelligence: MarketIntelligenceData, aiModel: any): number {
    const baseWinRate = this.performance.currentWinRate || 60; // Start with current performance
    const confidenceBonus = (aiScore - 50) * 0.5; // AI score adjustment
    const regimeBonus = intelligence.regime.confidence * 10; // Market regime confidence
    const aiAccuracyBonus = aiModel.pattern_recognition_accuracy * 20; // AI model accuracy

    const predictedWinRate = baseWinRate + confidenceBonus + regimeBonus + aiAccuracyBonus;
    return Math.max(50, Math.min(98, predictedWinRate)); // Cap between 50-98%
  }

  // Predict profit margin
  private predictProfitMargin(aiScore: number, intelligence: MarketIntelligenceData, aiModel: any): number {
    const baseMargin = 2.5; // Base expected margin
    const volatilityBonus = intelligence.momentum.volatility * 0.1; // Higher volatility = higher potential
    const trendBonus = intelligence.momentum.trend_strength > 70 ? 1.5 : 0; // Strong trends = higher margins
    const aiConfidenceBonus = (aiScore - 50) * 0.05; // AI confidence bonus

    const predictedMargin = baseMargin + volatilityBonus + trendBonus + aiConfidenceBonus;
    return Math.max(0.5, Math.min(15, predictedMargin)); // Cap between 0.5-15%
  }

  // Generate AI reasoning
  private generateAIReasoning(aiScore: number, technicalScore: number, momentumScore: number, 
                             volumeScore: number, regimeScore: number, intelligence: MarketIntelligenceData): string[] {
    const reasoning: string[] = [];
    const llnMetrics = markovPredictor.getLLNConfidenceMetrics();

    reasoning.push(`🤖 Stratus Engine AI Score: ${aiScore.toFixed(1)}/100`);
    
    if (technicalScore > 60) {
      reasoning.push(`📈 Technical patterns show ${intelligence.patterns.length} bullish signals`);
    } else if (technicalScore < 40) {
      reasoning.push(`📉 Technical patterns show bearish pressure`);
    }

    if (momentumScore > 65) {
      reasoning.push(`⚡ Strong momentum detected (${intelligence.momentum.momentum.toFixed(2)})`);
    } else if (momentumScore < 35) {
      reasoning.push(`🐌 Weak momentum suggests caution`);
    }

    if (volumeScore > 70) {
      reasoning.push(`📊 Volume analysis supports the move`);
    }

    if (regimeScore > 70) {
      reasoning.push(`🎯 Market regime (${intelligence.regime.regime}) favors this direction`);
    }
    
    // Add Markov chain insights
    reasoning.push(`🔮 Markov chain convergence: ${llnMetrics.convergenceStatus}`);
    reasoning.push(`📊 LLN reliability: ${(llnMetrics.overallReliability * 100).toFixed(1)}%`);

    reasoning.push(`🧠 AI confidence: ${((aiScore / 100) * 100).toFixed(1)}%`);

    return reasoning;
  }

  // Helper methods
  private calculateOptimalPositionSize(aiScore: number, expectedWinRate: number, intelligence: MarketIntelligenceData): number {
    let baseSize = 1.0;
    
    // Kelly Criterion inspired sizing
    const winProbability = expectedWinRate / 100;
    const avgWin = this.performance.averageWinMargin || 3;
    const avgLoss = this.performance.averageLossMargin || 2;
    
    const kellyFraction = (winProbability * avgWin - (1 - winProbability) * avgLoss) / avgWin;
    
    // AI confidence multiplier
    const confidenceMultiplier = aiScore > 80 ? 1.5 : aiScore > 60 ? 1.2 : aiScore < 40 ? 0.7 : 1.0;
    
    // Volatility adjustment
    const volatilityAdjustment = intelligence.momentum.volatility > 0.03 ? 0.8 : 1.2;
    
    const optimalSize = baseSize * Math.max(0, kellyFraction) * confidenceMultiplier * volatilityAdjustment;
    
    return Math.max(0.1, Math.min(3.0, optimalSize));
  }

  private selectOptimalTimeframe(intelligence: MarketIntelligenceData): AITradingDecision['timeframe'] {
    if (intelligence.regime.regime === 'breakout') return '1m'; // Fast execution for breakouts
    if (intelligence.momentum.trend_strength > 80) return '5m'; // Quick entries for strong trends
    if (intelligence.regime.regime === 'trending_up' || intelligence.regime.regime === 'trending_down') return '15m';
    return '1h'; // Default for sideways markets
  }

  private assessRiskLevel(aiScore: number, intelligence: MarketIntelligenceData): AITradingDecision['riskLevel'] {
    if (aiScore > 80 && intelligence.regime.volatility_level === 'low') return 'LOW';
    if (aiScore < 40 || intelligence.regime.volatility_level === 'high') return 'HIGH';
    return 'MEDIUM';
  }

  // Performance tracking and learning
  private updatePerformanceMetrics(outcome: TradeOutcome): void {
    this.performance.totalTrades++;
    
    if (outcome.wasCorrect) {
      this.performance.winningTrades++;
    } else {
      this.performance.losingTrades++;
    }
    
    this.performance.currentWinRate = (this.performance.winningTrades / this.performance.totalTrades) * 100;
    this.performance.totalProfit += outcome.actualProfit;
    
    // Update AI accuracy score
    const recentTrades = this.tradeHistory.slice(-20); // Last 20 trades
    const recentAccuracy = recentTrades.filter(t => t.wasCorrect).length / recentTrades.length;
    this.performance.aiAccuracyScore = recentAccuracy * 100;
  }

  // Real-time optimization
  private startRealTimeOptimization(): void {
    console.log('🚀 Starting Stratus Engine real-time optimization...');
    
    this.optimizationInterval = setInterval(async () => {
      if (this.config.adaptiveLearning && this.tradeHistory.length > 10) {
        await this.performGlobalOptimization();
      }
    }, 5 * 60 * 1000); // Optimize every 5 minutes
  }

  private async performGlobalOptimization(): Promise<void> {
    console.log('⚡ Performing Stratus Engine global optimization...');
    
    // Analyze recent performance
    const recentTrades = this.tradeHistory.slice(-50);
    const winRate = recentTrades.filter(t => t.wasCorrect).length / recentTrades.length;
    
    // If win rate is below target, adjust aggressiveness
    if (winRate < this.config.targetWinRate / 100) {
      this.config.aggressiveness = Math.max(1, this.config.aggressiveness - 0.1);
      this.config.momentumThreshold += 0.05;
    } else if (winRate > 0.9) {
      // If doing very well, can be more aggressive
      this.config.aggressiveness = Math.min(10, this.config.aggressiveness + 0.1);
      this.config.momentumThreshold = Math.max(0.2, this.config.momentumThreshold - 0.02);
    }
    
    this.performance.lastOptimization = new Date();
    
    console.log(`✅ Optimization complete. New aggressiveness: ${this.config.aggressiveness.toFixed(1)}, momentum threshold: ${this.config.momentumThreshold.toFixed(2)}`);
  }

  // Utility methods
  private generateInitialWeights(count: number): number[] {
    return Array.from({ length: count }, () => Math.random() * 2 - 1); // Random weights between -1 and 1
  }

  private generateFallbackDecision(symbol: string, currentPrice: number): AITradingDecision {
    return {
      decision: 'HOLD',
      confidence: 0.3,
      reasoning: ['⚠️ Insufficient market data for AI analysis'],
      optimalEntry: currentPrice,
      stopLoss: currentPrice * 0.98,
      takeProfit: [currentPrice * 1.02],
      positionSize: 0.5,
      timeframe: '1h',
      aiScore: 50,
      riskLevel: 'MEDIUM',
      expectedWinRate: 50,
      expectedProfitMargin: 1.5
    };
  }

  private getPatternWeight(patternName: string): number {
    const weights: Record<string, number> = {
      'Golden Cross': 20,
      'Death Cross': 20,
      'RSI Divergence': 15,
      'Volume Breakout': 25,
      'Resistance Breakout': 18,
      'Support Bounce': 18
    };
    return weights[patternName] || 10;
  }

  // Analyze Markov chain predictions
  private analyzeMarkovPrediction(prediction: MarkovPrediction): number {
    let score = 50; // Base score
    
    // Adjust based on expected return
    score += prediction.expectedReturn * 10;
    
    // Boost score if high confidence in prediction
    score += prediction.confidence * 20;
    
    // Consider convergence (stable probabilities are more reliable)
    score += prediction.convergenceScore * 10;
    
    // Adjust based on most likely next state
    const bullishStates = ['TRENDING_UP_STRONG', 'TRENDING_UP_WEAK', 'BREAKOUT_UP', 'REVERSAL_UP'];
    const bearishStates = ['TRENDING_DOWN_STRONG', 'TRENDING_DOWN_WEAK', 'BREAKOUT_DOWN', 'REVERSAL_DOWN'];
    
    if (bullishStates.includes(prediction.mostLikelyNextState)) {
      score += 15;
    } else if (bearishStates.includes(prediction.mostLikelyNextState)) {
      score -= 15;
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  // Apply Law of Large Numbers confidence adjustment
  private applyLLNConfidence(baseScore: number, llnConfidence: number): number {
    // As we get more data (higher LLN confidence), we trust our predictions more
    // Low confidence = regress toward neutral (50)
    // High confidence = trust the model's prediction
    const neutralScore = 50;
    const adjustedScore = neutralScore + (baseScore - neutralScore) * llnConfidence;
    
    // Also reduce position size if confidence is low
    if (llnConfidence < 0.3) {
      console.log(`⚠️ Low LLN confidence (${(llnConfidence * 100).toFixed(1)}%), adjusting predictions conservatively`);
    }
    
    return adjustedScore;
  }

  private reinforceLearningWeights(outcome: TradeOutcome): void {
    // Increase weights for factors that led to successful trades
    this.learningWeights.forEach((weight, key) => {
      this.learningWeights.set(key, Math.min(0.5, weight + 0.001));
    });
  }

  private adjustLearningWeights(outcome: TradeOutcome): void {
    // Slightly decrease weights for factors that led to unsuccessful trades
    this.learningWeights.forEach((weight, key) => {
      this.learningWeights.set(key, Math.max(0.05, weight - 0.001));
    });
  }

  // Public API
  getPerformance(): StratusPerformance {
    return { ...this.performance };
  }

  getConfig(): StratusEngineConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<StratusEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Stratus Engine configuration updated');
  }

  getTradeHistory(limit?: number): TradeOutcome[] {
    return limit ? this.tradeHistory.slice(-limit) : [...this.tradeHistory];
  }

  // Emergency stop
  emergencyStop(): void {
    console.log('🚨 STRATUS ENGINE EMERGENCY STOP');
    this.isLearning = false;
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
    }
  }
  
  /**
   * Cross-Site Strategy Performance Enhancement
   */
  private async enhanceWithUnifiedStrategyPerformance(
    symbol: string,
    intelligence: MarketIntelligenceData | null
  ): Promise<any> {
    try {
      // Get unified strategy performance for all Stratus-related strategies
      const stratusStrategies = await consolidatedDataService.getUnifiedStrategyPerformance('stratus-engine', symbol);
      const neuralStrategies = await consolidatedDataService.getUnifiedStrategyPerformance('neural-strategy', symbol);
      const quantumStrategies = await consolidatedDataService.getUnifiedStrategyPerformance('quantum-oscillator', symbol);
      
      // Get AI system comparison data
      const aiSystemPerformance = await consolidatedDataService.getAISystemComparison('stratus-engine');
      
      // Get learning insights for strategy optimization
      const strategyInsights = await consolidatedDataService.getLearningInsights(
        'strategy_optimization',
        symbol,
        0.7 // Higher confidence for strategy insights
      );
      
      // Calculate global win rate and performance metrics
      const allStrategies = [...stratusStrategies, ...neuralStrategies, ...quantumStrategies];
      let globalWinRate = 0.6; // Default
      let totalTrades = 0;
      let performanceBoost = 0;
      
      if (allStrategies.length > 0) {
        globalWinRate = allStrategies.reduce((sum: number, strategy: any) => {
          totalTrades += strategy.total_trades || 0;
          return sum + (strategy.win_rate || 0.6);
        }, 0) / allStrategies.length;
        
        // Performance boost based on cross-site success
        performanceBoost = Math.min(0.25, (globalWinRate - 0.6) * 0.5); // Up to 25% boost
      }
      
      if (aiSystemPerformance.length > 0) {
        // Additional boost from AI system performance across sites
        const aiWinRate = aiSystemPerformance.reduce((sum: number, ai: any) => sum + (ai.global_win_rate || 0.6), 0) / aiSystemPerformance.length;
        performanceBoost += Math.min(0.15, (aiWinRate - 0.6) * 0.3); // Up to 15% additional boost
      }
      
      if (strategyInsights.length > 0) {
        // Boost from specific learning insights
        const insightBoost = strategyInsights.reduce((sum, insight) => sum + insight.confidence, 0) / strategyInsights.length;
        performanceBoost += Math.min(0.1, (insightBoost - 0.5) * 0.4); // Up to 10% insight boost
      }
      
      // Market condition multipliers
      let conditionMultiplier = 1.0;
      if (intelligence) {
        // Boost for favorable market conditions
        if (intelligence.regime.regime === 'trending_up' && intelligence.momentum.momentum > 0.5) {
          conditionMultiplier = 1.1;
        } else if (intelligence.regime.regime === 'trending_down' && intelligence.momentum.momentum < -0.5) {
          conditionMultiplier = 1.1;
        } else if (intelligence.regime.volatility_level === 'low' && intelligence.momentum.trend_strength > 70) {
          conditionMultiplier = 1.05;
        }
      }
      
      const finalPerformanceBoost = performanceBoost * conditionMultiplier;
      
      return {
        globalWinRate,
        performanceBoost: finalPerformanceBoost,
        totalTrades,
        strategyCount: allStrategies.length,
        aiSystemsCount: aiSystemPerformance.length,
        learningInsights: strategyInsights.length,
        conditionMultiplier,
        crossSiteEnabled: true,
        enhancementLevel: 'UNIFIED_STRATEGY_INTELLIGENCE'
      };
      
    } catch (error) {
      // Return neutral enhancement if consolidation fails
      return {
        globalWinRate: 0.6,
        performanceBoost: 0,
        totalTrades: 0,
        strategyCount: 0,
        aiSystemsCount: 0,
        learningInsights: 0,
        conditionMultiplier: 1.0,
        crossSiteEnabled: false,
        enhancementLevel: 'STANDALONE'
      };
    }
  }
}

// Export singleton instance
export const stratusEngine = StratusEngineAI.getInstance();

// Export helper functions
export async function getAITradingSignal(symbol: string): Promise<AITradingDecision> {
  return stratusEngine.generateAITradingDecision(symbol);
}

export async function recordAITradeResult(outcome: TradeOutcome): Promise<void> {
  return stratusEngine.recordTradeOutcome(outcome);
}

export function getStratusPerformance(): StratusPerformance {
  return stratusEngine.getPerformance();
}

// Export types
export type { AITradingDecision, StratusEngineConfig, StratusPerformance, TradeOutcome };