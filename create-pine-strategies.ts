/**
 * Create Essential Pine Script Strategies
 * Populates database with the core strategies needed for the enhanced system
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createPineScriptStrategies() {
  console.log('🌲 Creating Essential Pine Script Strategies...');
  
  const userId = 'admin-001';
  
  // Strategy 1: Enhanced RSI Strategy
  const rsiStrategy = await prisma.pineStrategy.upsert({
    where: { id: 'enhanced-rsi-strategy' },
    update: {},
    create: {
      id: 'enhanced-rsi-strategy',
      userId,
      name: 'Enhanced RSI Technical Analysis',
      description: 'Advanced RSI strategy with dynamic thresholds and momentum confirmation',
      pineScriptCode: `// Enhanced RSI Strategy
//@version=5
strategy("Enhanced RSI Technical Analysis", overlay=true)

// Input Parameters (AI-Optimizable)
rsi_length = input(14, "RSI Length")
rsi_overbought = input(70, "Overbought Level") 
rsi_oversold = input(30, "Oversold Level")
momentum_threshold = input(0.5, "Momentum Threshold")
stop_loss_percent = input(2.0, "Stop Loss %")
take_profit_percent = input(4.0, "Take Profit %")

// Calculate RSI and momentum
rsi = ta.rsi(close, rsi_length)
momentum = ta.change(close, 5) / close * 100

// Entry conditions with momentum confirmation
long_condition = rsi < rsi_oversold and momentum > momentum_threshold
short_condition = rsi > rsi_overbought and momentum < -momentum_threshold

// Execute trades
if long_condition
    strategy.entry("Long", strategy.long)
    strategy.exit("Exit Long", "Long", stop=close*(1-stop_loss_percent/100), limit=close*(1+take_profit_percent/100))

if short_condition  
    strategy.entry("Short", strategy.short)
    strategy.exit("Exit Short", "Short", stop=close*(1+stop_loss_percent/100), limit=close*(1-take_profit_percent/100))`,
      version: '2.0',
      strategyType: 'technical',
      timeframe: '15m',
      tradingPairs: JSON.stringify(['BTCUSD', 'ETHUSD', 'SOLUSD']),
      isActive: true,
      isOptimized: false
    }
  });

  // Strategy 2: Fear & Greed Sentiment Strategy  
  const sentimentStrategy = await prisma.pineStrategy.upsert({
    where: { id: 'fear-greed-sentiment-strategy' },
    update: {},
    create: {
      id: 'fear-greed-sentiment-strategy',
      userId,
      name: 'Fear & Greed Index Strategy',
      description: 'Sentiment-based strategy using Fear & Greed Index with technical confirmation',
      pineScriptCode: `// Fear & Greed Sentiment Strategy
//@version=5
strategy("Fear & Greed Index Strategy", overlay=true)

// Input Parameters
fear_threshold = input(25, "Fear Threshold (Buy)")
greed_threshold = input(75, "Greed Threshold (Sell)")
ema_period = input(20, "EMA Confirmation Period")
volume_threshold = input(1.2, "Volume Multiplier")
position_size = input(0.02, "Position Size %")

// Technical indicators for confirmation
ema = ta.ema(close, ema_period)
volume_ratio = volume / ta.sma(volume, 20)

// Sentiment-based entries (simulated - would connect to real Fear & Greed API)
sentiment_score = 50 // Placeholder - AI system provides real sentiment
price_above_ema = close > ema
strong_volume = volume_ratio > volume_threshold

// Entry conditions
fear_buy = sentiment_score < fear_threshold and price_above_ema and strong_volume
greed_sell = sentiment_score > greed_threshold and close < ema and strong_volume

if fear_buy
    strategy.entry("Sentiment Long", strategy.long, qty_percent=position_size*100)
    
if greed_sell
    strategy.entry("Sentiment Short", strategy.short, qty_percent=position_size*100)`,
      version: '2.0', 
      strategyType: 'sentiment',
      timeframe: '1h',
      tradingPairs: JSON.stringify(['BTCUSD', 'ETHUSD']),
      isActive: true,
      isOptimized: false
    }
  });

  // Strategy 3: Mathematical Intuition Strategy
  const mathStrategy = await prisma.pineStrategy.upsert({
    where: { id: 'mathematical-intuition-strategy' },
    update: {},
    create: {
      id: 'mathematical-intuition-strategy',
      userId,
      name: 'Mathematical Intuition Engine',
      description: 'AI-driven mathematical analysis with flow field and pattern recognition',
      pineScriptCode: `// Mathematical Intuition Strategy
//@version=5
strategy("Mathematical Intuition Engine", overlay=true)

// Input Parameters
intuition_threshold = input(0.65, "Intuition Confidence Threshold")
flow_strength_min = input(0.4, "Minimum Flow Strength")
pattern_resonance_min = input(0.5, "Pattern Resonance Minimum")
risk_per_trade = input(1.5, "Risk Per Trade %")
reward_ratio = input(2.5, "Risk:Reward Ratio")

// Mathematical indicators (simplified - AI provides real calculations)
flow_strength = 0.5 // AI-calculated flow field strength
pattern_resonance = 0.5 // AI-calculated pattern resonance  
overall_intuition = 0.5 // AI-calculated mathematical intuition

// Entry conditions based on AI mathematical analysis
strong_intuition = overall_intuition > intuition_threshold
strong_flow = flow_strength > flow_strength_min
good_pattern = pattern_resonance > pattern_resonance_min

long_signal = strong_intuition and strong_flow and good_pattern and ta.change(close) > 0
short_signal = strong_intuition and strong_flow and good_pattern and ta.change(close) < 0

if long_signal
    strategy.entry("Math Long", strategy.long)
    strategy.exit("Exit Math Long", "Math Long", 
                  stop=close*(1-risk_per_trade/100), 
                  limit=close*(1+risk_per_trade*reward_ratio/100))

if short_signal
    strategy.entry("Math Short", strategy.short)
    strategy.exit("Exit Math Short", "Math Short",
                  stop=close*(1+risk_per_trade/100),
                  limit=close*(1-risk_per_trade*reward_ratio/100))`,
      version: '2.0',
      strategyType: 'ai_mathematical',
      timeframe: '5m',
      tradingPairs: JSON.stringify(['BTCUSD', 'ETHUSD', 'SOLUSD']),
      isActive: true,
      isOptimized: false
    }
  });

  // Strategy 4: Multi-Source Sentiment Strategy
  const multiSentimentStrategy = await prisma.pineStrategy.upsert({
    where: { id: 'multi-source-sentiment-strategy' },
    update: {},
    create: {
      id: 'multi-source-sentiment-strategy',
      userId,
      name: 'Multi-Source Sentiment Analysis',
      description: 'Advanced sentiment fusion from Reddit, Twitter, news, and on-chain data',
      pineScriptCode: `// Multi-Source Sentiment Strategy  
//@version=5
strategy("Multi-Source Sentiment Analysis", overlay=true)

// Input Parameters
sentiment_confidence_min = input(0.7, "Min Sentiment Confidence")
reddit_weight = input(0.3, "Reddit Sentiment Weight")
news_weight = input(0.4, "News Sentiment Weight") 
onchain_weight = input(0.3, "On-Chain Sentiment Weight")
macd_confirm = input(true, "Require MACD Confirmation")

// Technical confirmation indicators
[macd_line, signal_line, _] = ta.macd(close, 12, 26, 9)
macd_bullish = macd_line > signal_line
macd_bearish = macd_line < signal_line

// Sentiment scores (AI-provided)
reddit_sentiment = 0.5
news_sentiment = 0.5  
onchain_sentiment = 0.5
combined_confidence = 0.5

// Calculate weighted sentiment
weighted_sentiment = reddit_sentiment * reddit_weight + 
                     news_sentiment * news_weight + 
                     onchain_sentiment * onchain_weight

// Entry conditions
bullish_sentiment = weighted_sentiment > 0.6 and combined_confidence > sentiment_confidence_min
bearish_sentiment = weighted_sentiment < 0.4 and combined_confidence > sentiment_confidence_min

long_entry = bullish_sentiment and (not macd_confirm or macd_bullish)
short_entry = bearish_sentiment and (not macd_confirm or macd_bearish)

if long_entry
    strategy.entry("Sentiment Long", strategy.long)
    
if short_entry  
    strategy.entry("Sentiment Short", strategy.short)`,
      version: '2.0',
      strategyType: 'multi_sentiment',
      timeframe: '30m',
      tradingPairs: JSON.stringify(['BTCUSD', 'ETHUSD', 'SOLUSD']),
      isActive: true,
      isOptimized: false
    }
  });

  // Create strategy parameters for optimization
  const strategies = [rsiStrategy, sentimentStrategy, mathStrategy, multiSentimentStrategy];
  
  for (const strategy of strategies) {
    console.log(`📝 Creating parameters for ${strategy.name}...`);
    
    // Create optimizable parameters based on strategy type
    if (strategy.id === 'enhanced-rsi-strategy') {
      await createRSIParameters(strategy.id);
    } else if (strategy.id === 'fear-greed-sentiment-strategy') {
      await createSentimentParameters(strategy.id);
    } else if (strategy.id === 'mathematical-intuition-strategy') {
      await createMathParameters(strategy.id);
    } else if (strategy.id === 'multi-source-sentiment-strategy') {
      await createMultiSentimentParameters(strategy.id);
    }
  }

  console.log('✅ Successfully created all Pine Script strategies!');
  console.log(`📊 Created ${strategies.length} strategies ready for AI optimization`);
  return strategies;
}

async function createRSIParameters(strategyId: string) {
  const parameters = [
    { name: 'rsi_length', value: '14', type: 'integer', category: 'technical', min: '5', max: '30', isOptimizable: true, priority: 1 },
    { name: 'rsi_overbought', value: '70', type: 'integer', category: 'technical', min: '65', max: '85', isOptimizable: true, priority: 2 },
    { name: 'rsi_oversold', value: '30', type: 'integer', category: 'technical', min: '15', max: '35', isOptimizable: true, priority: 2 },
    { name: 'momentum_threshold', value: '0.5', type: 'float', category: 'technical', min: '0.1', max: '1.0', isOptimizable: true, priority: 3 },
    { name: 'stop_loss_percent', value: '2.0', type: 'float', category: 'risk_management', min: '1.0', max: '5.0', isOptimizable: true, priority: 1 },
    { name: 'take_profit_percent', value: '4.0', type: 'float', category: 'risk_management', min: '2.0', max: '8.0', isOptimizable: true, priority: 1 }
  ];

  for (const param of parameters) {
    await prisma.strategyParameter.upsert({
      where: { 
        strategyId_parameterName: {
          strategyId,
          parameterName: param.name
        }
      },
      update: {},
      create: {
        strategyId,
        parameterName: param.name,
        parameterType: param.type,
        category: param.category,
        currentValue: param.value,
        originalValue: param.value,
        minValue: param.min,
        maxValue: param.max,
        isOptimizable: param.isOptimizable,
        optimizationPriority: param.priority
      }
    });
  }
}

async function createSentimentParameters(strategyId: string) {
  const parameters = [
    { name: 'fear_threshold', value: '25', type: 'integer', category: 'sentiment', min: '10', max: '40', isOptimizable: true, priority: 1 },
    { name: 'greed_threshold', value: '75', type: 'integer', category: 'sentiment', min: '60', max: '90', isOptimizable: true, priority: 1 },
    { name: 'ema_period', value: '20', type: 'integer', category: 'technical', min: '10', max: '50', isOptimizable: true, priority: 2 },
    { name: 'volume_threshold', value: '1.2', type: 'float', category: 'technical', min: '1.0', max: '2.0', isOptimizable: true, priority: 3 },
    { name: 'position_size', value: '0.02', type: 'float', category: 'risk_management', min: '0.01', max: '0.05', isOptimizable: true, priority: 2 }
  ];

  for (const param of parameters) {
    await prisma.strategyParameter.upsert({
      where: { 
        strategyId_parameterName: {
          strategyId,
          parameterName: param.name
        }
      },
      update: {},
      create: {
        strategyId,
        parameterName: param.name,
        parameterType: param.type,
        category: param.category,
        currentValue: param.value,
        originalValue: param.value,
        minValue: param.min,
        maxValue: param.max,
        isOptimizable: param.isOptimizable,
        optimizationPriority: param.priority
      }
    });
  }
}

async function createMathParameters(strategyId: string) {
  const parameters = [
    { name: 'intuition_threshold', value: '0.65', type: 'float', category: 'ai_mathematical', min: '0.5', max: '0.9', isOptimizable: true, priority: 1 },
    { name: 'flow_strength_min', value: '0.4', type: 'float', category: 'ai_mathematical', min: '0.2', max: '0.8', isOptimizable: true, priority: 1 },
    { name: 'pattern_resonance_min', value: '0.5', type: 'float', category: 'ai_mathematical', min: '0.3', max: '0.8', isOptimizable: true, priority: 1 },
    { name: 'risk_per_trade', value: '1.5', type: 'float', category: 'risk_management', min: '0.5', max: '3.0', isOptimizable: true, priority: 2 },
    { name: 'reward_ratio', value: '2.5', type: 'float', category: 'risk_management', min: '1.5', max: '4.0', isOptimizable: true, priority: 2 }
  ];

  for (const param of parameters) {
    await prisma.strategyParameter.upsert({
      where: { 
        strategyId_parameterName: {
          strategyId,
          parameterName: param.name
        }
      },
      update: {},
      create: {
        strategyId,
        parameterName: param.name,
        parameterType: param.type,
        category: param.category,
        currentValue: param.value,
        originalValue: param.value,
        minValue: param.min,
        maxValue: param.max,
        isOptimizable: param.isOptimizable,
        optimizationPriority: param.priority
      }
    });
  }
}

async function createMultiSentimentParameters(strategyId: string) {
  const parameters = [
    { name: 'sentiment_confidence_min', value: '0.7', type: 'float', category: 'sentiment', min: '0.5', max: '0.9', isOptimizable: true, priority: 1 },
    { name: 'reddit_weight', value: '0.3', type: 'float', category: 'sentiment', min: '0.1', max: '0.5', isOptimizable: true, priority: 2 },
    { name: 'news_weight', value: '0.4', type: 'float', category: 'sentiment', min: '0.2', max: '0.6', isOptimizable: true, priority: 2 },
    { name: 'onchain_weight', value: '0.3', type: 'float', category: 'sentiment', min: '0.1', max: '0.5', isOptimizable: true, priority: 2 },
    { name: 'macd_confirm', value: 'true', type: 'boolean', category: 'technical', min: 'false', max: 'true', isOptimizable: true, priority: 3 }
  ];

  for (const param of parameters) {
    await prisma.strategyParameter.upsert({
      where: { 
        strategyId_parameterName: {
          strategyId,
          parameterName: param.name
        }
      },
      update: {},
      create: {
        strategyId,
        parameterName: param.name,
        parameterType: param.type,
        category: param.category,
        currentValue: param.value,
        originalValue: param.value,
        minValue: param.min,
        maxValue: param.max,
        isOptimizable: param.isOptimizable,
        optimizationPriority: param.priority
      }
    });
  }
}

// Run the creation script
createPineScriptStrategies()
  .then(() => {
    console.log('🎯 Database populated with Pine Script strategies!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error creating strategies:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });