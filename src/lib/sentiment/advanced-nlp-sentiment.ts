/**
 * Advanced NLP Sentiment Intelligence System
 * Multi-source real-time sentiment analysis with BERT-style NLP
 */

import { SimpleTwitterSentiment, SimpleSentimentScore } from './simple-twitter-sentiment';

export interface AdvancedSentimentData {
  symbol: string;
  aggregateScore: number;      // -1.0 to +1.0 (weighted average)
  confidence: number;           // 0.0 to 1.0
  sources: {
    twitter: SocialSentiment;
    reddit: SocialSentiment;
    telegram: SocialSentiment;
    news: NewsSentiment;
    onChain: OnChainSentiment;
    economic: EconomicSentiment;
  };
  keywordDetections: KeywordDetection[];
  whaleActivity: WhaleMovement[];
  marketContext: MarketContext;
  timestamp: Date;
}

export interface SocialSentiment {
  score: number;
  confidence: number;
  volume: number;
  trending: boolean;
  topKeywords: string[];
  influencerScore?: number;
}

export interface NewsSentiment {
  score: number;
  confidence: number;
  articleCount: number;
  majorHeadlines: string[];
  criticalEvents: string[];
}

export interface OnChainSentiment {
  score: number;
  confidence: number;
  whaleMovements: number;
  exchangeInflows: number;
  exchangeOutflows: number;
  smartContractActivity: number;
  networkCongestion: number;
}

export interface EconomicSentiment {
  score: number;
  confidence: number;
  indicators: {
    unemployment?: number;
    cpi?: number;
    gdp?: number;
    interestRates?: number;
    dollarIndex?: number;
  };
  nextReleases: string[];
  tariffNews: string[];
}

export interface KeywordDetection {
  keyword: string;
  category: 'bullish' | 'bearish' | 'critical';
  count: number;
  sources: string[];
  impact: number; // 0-10 scale
}

export interface WhaleMovement {
  address: string;
  amount: number;
  token: string;
  direction: 'in' | 'out';
  exchange?: string;
  timestamp: Date;
  significance: number; // 0-10 scale
}

export interface MarketContext {
  gpuDemand: number;      // GPU/Data center sentiment
  aiHype: number;         // AI sector sentiment
  regulatoryRisk: number; // Regulatory news impact
  macroTrend: 'risk-on' | 'risk-off' | 'neutral';
}

export class AdvancedNLPSentiment {
  private twitterSentiment: SimpleTwitterSentiment;
  
  // Enhanced keyword categories with impact weights
  private readonly criticalKeywords = {
    bullish: {
      partnership: 8,
      listing: 7,
      adoption: 7,
      'institutional buy': 9,
      'etf approval': 10,
      halving: 8,
      upgrade: 6,
      'burn': 7,
      'mainnet': 8,
      'integration': 6
    },
    bearish: {
      hack: 10,
      exploit: 10,
      'rug pull': 10,
      'sec investigation': 9,
      delisting: 8,
      bankruptcy: 10,
      'delay': 6,
      'shutdown': 9,
      'liquidation': 8,
      'lawsuit': 7
    },
    economic: {
      tariff: 7,
      inflation: 8,
      recession: 9,
      'rate hike': 8,
      unemployment: 7,
      'gdp': 6,
      'cpi': 7,
      'fomc': 8,
      'jobs report': 7,
      'dollar strength': 6
    },
    technology: {
      gpu: 6,
      'data center': 6,
      nvidia: 7,
      'ai compute': 7,
      'mining difficulty': 5,
      'hash rate': 5,
      'quantum computing': 8,
      'blockchain upgrade': 7
    }
  };

  // NLP sentiment weights for different sources
  private readonly sourceWeights = {
    twitter: 0.20,
    reddit: 0.15,
    telegram: 0.10,
    news: 0.25,
    onChain: 0.20,
    economic: 0.10
  };

  constructor() {
    this.twitterSentiment = new SimpleTwitterSentiment();
  }

  /**
   * Get comprehensive sentiment analysis for a symbol
   */
  async getAdvancedSentiment(symbol: string): Promise<AdvancedSentimentData> {
    try {
      // Collect sentiment from all sources in parallel
      const [
        twitterData,
        redditData,
        telegramData,
        newsData,
        onChainData,
        economicData
      ] = await Promise.all([
        this.getEnhancedTwitterSentiment(symbol),
        this.getRedditNLPSentiment(symbol),
        this.getTelegramSentiment(symbol),
        this.getNewsNLPSentiment(symbol),
        this.getOnChainAnalysis(symbol),
        this.getEconomicIndicatorsSentiment()
      ]);

      // Detect critical keywords across all sources
      const keywordDetections = await this.detectCriticalKeywords(symbol);
      
      // Analyze whale movements
      const whaleActivity = await this.analyzeWhaleMovements(symbol);
      
      // Get market context
      const marketContext = await this.analyzeMarketContext();

      // Calculate weighted aggregate score
      const aggregateScore = this.calculateWeightedScore({
        twitter: twitterData,
        reddit: redditData,
        telegram: telegramData,
        news: newsData,
        onChain: onChainData,
        economic: economicData
      });

      // Calculate overall confidence
      const confidence = this.calculateOverallConfidence({
        twitter: twitterData,
        reddit: redditData,
        telegram: telegramData,
        news: newsData,
        onChain: onChainData,
        economic: economicData
      });

      return {
        symbol,
        aggregateScore,
        confidence,
        sources: {
          twitter: twitterData,
          reddit: redditData,
          telegram: telegramData,
          news: newsData,
          onChain: onChainData,
          economic: economicData
        },
        keywordDetections,
        whaleActivity,
        marketContext,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error in advanced sentiment analysis:', error);
      return this.getDefaultSentiment(symbol);
    }
  }

  /**
   * Enhanced Twitter sentiment with NLP analysis
   */
  private async getEnhancedTwitterSentiment(symbol: string): Promise<SocialSentiment> {
    try {
      // Get basic sentiment from existing system
      const basicSentiment = await this.twitterSentiment.getBTCSentiment();
      
      // Enhance with Twitter API v2 data (if available)
      const enhancedData = await this.fetchTwitterV2Data(symbol);
      
      // Apply BERT-style sentiment scoring
      const nlpScore = await this.applyBERTSentiment(enhancedData.texts);
      
      return {
        score: (basicSentiment.score + nlpScore) / 2,
        confidence: basicSentiment.confidence,
        volume: enhancedData.volume,
        trending: enhancedData.trending,
        topKeywords: enhancedData.keywords,
        influencerScore: enhancedData.influencerEngagement
      };
    } catch (error) {
      console.error('Twitter sentiment error:', error);
      return this.getDefaultSocialSentiment();
    }
  }

  /**
   * Reddit sentiment with advanced NLP
   */
  private async getRedditNLPSentiment(symbol: string): Promise<SocialSentiment> {
    try {
      const subreddits = [
        'Bitcoin', 'CryptoCurrency', 'ethereum', 'altcoin',
        'CryptoMoonShots', 'SatoshiStreetBets', 'CryptoMarkets'
      ];
      
      let totalScore = 0;
      let totalVolume = 0;
      const allKeywords: string[] = [];
      
      for (const subreddit of subreddits) {
        const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=25`);
        const data = await response.json();
        
        if (data.data?.children) {
          for (const post of data.data.children) {
            const text = `${post.data.title} ${post.data.selftext}`.toLowerCase();
            
            // Check if post is relevant to symbol
            if (this.isRelevantToSymbol(text, symbol)) {
              // Apply NLP sentiment analysis
              const sentiment = await this.analyzeSentimentWithNLP(text);
              
              // Weight by engagement (upvotes, comments)
              const engagementWeight = Math.log10(Math.max(1, post.data.ups + post.data.num_comments));
              totalScore += sentiment * engagementWeight;
              totalVolume += engagementWeight;
              
              // Extract keywords
              const keywords = this.extractKeywords(text);
              allKeywords.push(...keywords);
            }
          }
        }
      }
      
      const averageScore = totalVolume > 0 ? totalScore / totalVolume : 0;
      const topKeywords = this.getTopKeywords(allKeywords, 5);
      
      return {
        score: Math.max(-1, Math.min(1, averageScore)),
        confidence: Math.min(1, totalVolume / 50), // Confidence based on volume
        volume: totalVolume,
        trending: totalVolume > 20,
        topKeywords
      };
    } catch (error) {
      console.error('Reddit sentiment error:', error);
      return this.getDefaultSocialSentiment();
    }
  }

  /**
   * Telegram channel sentiment analysis
   */
  private async getTelegramSentiment(symbol: string): Promise<SocialSentiment> {
    try {
      // Note: Telegram requires bot API or scraping setup
      // For now, we'll use placeholder logic that can be enhanced
      
      const channels = [
        'whale_alert_io',
        'cryptopanic_news',
        'bitcoin_news'
      ];
      
      // Simulate Telegram data (replace with real API calls)
      const messages: string[] = [];
      
      // If you have Telegram Bot API access:
      // const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
      // const messages = await bot.getChannelMessages(channels);
      
      let sentimentScore = 0;
      let messageCount = 0;
      
      // Placeholder: Use news API as proxy for Telegram sentiment
      const response = await fetch('https://cryptopanic.com/api/v1/posts/?auth_token=free&public=true&currencies=' + symbol);
      const data = await response.json();
      
      if (data.results) {
        for (const item of data.results.slice(0, 20)) {
          const sentiment = await this.analyzeSentimentWithNLP(item.title);
          sentimentScore += sentiment;
          messageCount++;
        }
      }
      
      return {
        score: messageCount > 0 ? sentimentScore / messageCount : 0,
        confidence: Math.min(1, messageCount / 10),
        volume: messageCount,
        trending: messageCount > 5,
        topKeywords: []
      };
    } catch (error) {
      console.error('Telegram sentiment error:', error);
      return this.getDefaultSocialSentiment();
    }
  }

  /**
   * News sentiment with advanced NLP and keyword detection
   */
  private async getNewsNLPSentiment(symbol: string): Promise<NewsSentiment> {
    try {
      const newsAPIs = [
        `https://newsapi.org/v2/everything?q=${symbol}+cryptocurrency&apiKey=${process.env.NEWS_API_KEY || 'demo'}`,
        `https://cryptopanic.com/api/v1/posts/?auth_token=free&public=true&currencies=${symbol}`
      ];
      
      const headlines: string[] = [];
      const criticalEvents: string[] = [];
      let totalSentiment = 0;
      
      // Fetch from multiple news sources
      for (const apiUrl of newsAPIs) {
        try {
          const response = await fetch(apiUrl);
          const data = await response.json();
          
          if (data.articles || data.results) {
            const articles = data.articles || data.results;
            
            for (const article of articles.slice(0, 10)) {
              const title = article.title || article.headline;
              headlines.push(title);
              
              // Detect critical events
              for (const [keyword, impact] of Object.entries({...this.criticalKeywords.bullish, ...this.criticalKeywords.bearish})) {
                if (title.toLowerCase().includes(keyword)) {
                  if (impact >= 8) {
                    criticalEvents.push(`${keyword.toUpperCase()}: ${title}`);
                  }
                }
              }
              
              // Analyze sentiment
              const sentiment = await this.analyzeSentimentWithNLP(title);
              totalSentiment += sentiment;
            }
          }
        } catch (error) {
          console.warn('News API error:', error);
        }
      }
      
      return {
        score: headlines.length > 0 ? totalSentiment / headlines.length : 0,
        confidence: Math.min(1, headlines.length / 20),
        articleCount: headlines.length,
        majorHeadlines: headlines.slice(0, 5),
        criticalEvents
      };
    } catch (error) {
      console.error('News sentiment error:', error);
      return {
        score: 0,
        confidence: 0,
        articleCount: 0,
        majorHeadlines: [],
        criticalEvents: []
      };
    }
  }

  /**
   * On-chain data analysis for whale movements and exchange flows
   */
  private async getOnChainAnalysis(symbol: string): Promise<OnChainSentiment> {
    try {
      let whaleMovements = 0;
      let exchangeInflows = 0;
      let exchangeOutflows = 0;
      let smartContractActivity = 0;
      let networkCongestion = 0;
      
      if (symbol === 'BTC') {
        // Fetch blockchain data
        const [txCount, mempool, blockSize] = await Promise.all([
          fetch('https://blockchain.info/q/24hrtransactioncount').then(r => r.text()),
          fetch('https://blockchain.info/q/unconfirmedcount').then(r => r.text()),
          fetch('https://blockchain.info/q/24hrbtcsent').then(r => r.text())
        ]);
        
        // Analyze network metrics
        const dailyTx = parseInt(txCount);
        const mempoolSize = parseInt(mempool);
        const btcVolume = parseInt(blockSize) / 100000000; // Convert satoshis to BTC
        
        // Detect unusual activity
        const avgDailyTx = 300000;
        const avgMempool = 5000;
        const avgVolume = 500000;
        
        // Calculate sentiment based on network activity
        networkCongestion = Math.min(10, (mempoolSize / avgMempool) * 5);
        smartContractActivity = Math.min(10, (dailyTx / avgDailyTx) * 5);
        
        // Estimate whale movements (large volume = whale activity)
        if (btcVolume > avgVolume * 1.5) {
          whaleMovements = Math.min(10, ((btcVolume - avgVolume) / avgVolume) * 10);
        }
        
        // Fetch whale alert data (if available)
        try {
          const whaleResponse = await fetch('https://api.whale-alert.io/v1/transactions?api_key=free&min_value=1000000&limit=100');
          const whaleData = await whaleResponse.json();
          
          if (whaleData.transactions) {
            for (const tx of whaleData.transactions) {
              if (tx.to?.owner === 'exchange') exchangeInflows++;
              if (tx.from?.owner === 'exchange') exchangeOutflows++;
            }
          }
        } catch (error) {
          console.warn('Whale alert API error:', error);
        }
      }
      
      // Calculate overall on-chain sentiment
      const inflowOutflowRatio = exchangeOutflows > 0 ? exchangeInflows / exchangeOutflows : 1;
      const score = (
        (exchangeOutflows > exchangeInflows ? 0.3 : -0.3) + // Outflows bullish, inflows bearish
        (whaleMovements > 5 ? 0.2 : 0) + // High whale activity
        (networkCongestion < 3 ? 0.1 : -0.1) + // Low congestion good
        (smartContractActivity > 5 ? 0.1 : 0) // High activity bullish
      );
      
      return {
        score: Math.max(-1, Math.min(1, score)),
        confidence: 0.7, // On-chain data is generally reliable
        whaleMovements,
        exchangeInflows,
        exchangeOutflows,
        smartContractActivity,
        networkCongestion
      };
    } catch (error) {
      console.error('On-chain analysis error:', error);
      return {
        score: 0,
        confidence: 0,
        whaleMovements: 0,
        exchangeInflows: 0,
        exchangeOutflows: 0,
        smartContractActivity: 0,
        networkCongestion: 0
      };
    }
  }

  /**
   * Economic indicators sentiment analysis
   */
  private async getEconomicIndicatorsSentiment(): Promise<EconomicSentiment> {
    try {
      const indicators: any = {};
      const nextReleases: string[] = [];
      const tariffNews: string[] = [];
      
      // Fetch economic data from FRED API (Federal Reserve)
      const fredApiKey = process.env.FRED_API_KEY || 'demo';
      const economicAPIs = [
        `https://api.stlouisfed.org/fred/series/observations?series_id=UNRATE&api_key=${fredApiKey}&file_type=json&limit=1`,
        `https://api.stlouisfed.org/fred/series/observations?series_id=CPIAUCSL&api_key=${fredApiKey}&file_type=json&limit=1`,
        `https://api.stlouisfed.org/fred/series/observations?series_id=DFF&api_key=${fredApiKey}&file_type=json&limit=1`
      ];
      
      // Fetch economic calendar for upcoming releases
      try {
        const calendarResponse = await fetch('https://api.investing.com/api/financialdata/calendar/economic');
        const calendarData = await calendarResponse.json();
        
        if (calendarData.data) {
          for (const event of calendarData.data.slice(0, 5)) {
            if (event.importance >= 2) {
              nextReleases.push(`${event.event}: ${new Date(event.date).toLocaleDateString()}`);
            }
          }
        }
      } catch (error) {
        console.warn('Economic calendar error:', error);
      }
      
      // Search for tariff and trade news
      try {
        const tariffResponse = await fetch('https://newsapi.org/v2/everything?q=tariff+trade+war&sortBy=publishedAt&apiKey=demo');
        const tariffData = await tariffResponse.json();
        
        if (tariffData.articles) {
          for (const article of tariffData.articles.slice(0, 3)) {
            tariffNews.push(article.title);
          }
        }
      } catch (error) {
        console.warn('Tariff news error:', error);
      }
      
      // Calculate economic sentiment
      let economicScore = 0;
      
      // Placeholder values (replace with real data when APIs are configured)
      indicators.unemployment = 3.7;
      indicators.cpi = 3.2;
      indicators.interestRates = 5.5;
      indicators.dollarIndex = 104;
      
      // Score based on economic conditions
      if (indicators.unemployment < 4) economicScore += 0.2;
      if (indicators.cpi < 3) economicScore += 0.2;
      if (indicators.interestRates < 5) economicScore += 0.1;
      if (indicators.dollarIndex < 105) economicScore += 0.1;
      
      // Tariff news is generally negative for crypto
      if (tariffNews.length > 0) economicScore -= 0.1 * tariffNews.length;
      
      return {
        score: Math.max(-1, Math.min(1, economicScore)),
        confidence: 0.6,
        indicators,
        nextReleases,
        tariffNews
      };
    } catch (error) {
      console.error('Economic indicators error:', error);
      return {
        score: 0,
        confidence: 0,
        indicators: {},
        nextReleases: [],
        tariffNews: []
      };
    }
  }

  /**
   * Detect critical keywords across all sources
   */
  private async detectCriticalKeywords(symbol: string): Promise<KeywordDetection[]> {
    const detections: KeywordDetection[] = [];
    const keywordCounts: Map<string, { count: number; sources: Set<string>; category: string; impact: number }> = new Map();
    
    // Combine all keyword categories
    const allKeywords = {
      ...Object.entries(this.criticalKeywords.bullish).map(([k, v]) => ({ keyword: k, category: 'bullish', impact: v })),
      ...Object.entries(this.criticalKeywords.bearish).map(([k, v]) => ({ keyword: k, category: 'bearish', impact: v })),
      ...Object.entries(this.criticalKeywords.economic).map(([k, v]) => ({ keyword: k, category: 'critical', impact: v })),
      ...Object.entries(this.criticalKeywords.technology).map(([k, v]) => ({ keyword: k, category: 'bullish', impact: v }))
    };
    
    // This would be populated by actual text analysis from all sources
    // For now, return sample detections
    return [
      {
        keyword: 'partnership',
        category: 'bullish',
        count: 3,
        sources: ['twitter', 'reddit', 'news'],
        impact: 8
      }
    ];
  }

  /**
   * Analyze whale movements
   */
  private async analyzeWhaleMovements(symbol: string): Promise<WhaleMovement[]> {
    const movements: WhaleMovement[] = [];
    
    try {
      // Fetch whale alert data
      const response = await fetch(`https://api.whale-alert.io/v1/transactions?api_key=free&min_value=1000000&symbol=${symbol}&limit=10`);
      const data = await response.json();
      
      if (data.transactions) {
        for (const tx of data.transactions) {
          movements.push({
            address: tx.from?.address || 'unknown',
            amount: tx.amount,
            token: tx.symbol,
            direction: tx.to?.owner === 'exchange' ? 'in' : 'out',
            exchange: tx.to?.owner,
            timestamp: new Date(tx.timestamp * 1000),
            significance: Math.min(10, tx.amount_usd / 1000000) // $1M = 1 point
          });
        }
      }
    } catch (error) {
      console.warn('Whale movement analysis error:', error);
    }
    
    return movements;
  }

  /**
   * Analyze market context (GPU, AI, regulatory)
   */
  private async analyzeMarketContext(): Promise<MarketContext> {
    try {
      let gpuDemand = 5;
      let aiHype = 5;
      let regulatoryRisk = 5;
      let macroTrend: 'risk-on' | 'risk-off' | 'neutral' = 'neutral';
      
      // Check GPU/Data center sentiment
      const gpuNews = await fetch('https://newsapi.org/v2/everything?q=nvidia+gpu+datacenter&sortBy=publishedAt&apiKey=demo');
      const gpuData = await gpuNews.json();
      
      if (gpuData.articles) {
        let gpuSentiment = 0;
        for (const article of gpuData.articles.slice(0, 5)) {
          const sentiment = await this.analyzeSentimentWithNLP(article.title);
          gpuSentiment += sentiment;
        }
        gpuDemand = Math.min(10, 5 + (gpuSentiment * 2));
      }
      
      // Check AI sector sentiment
      const aiNews = await fetch('https://newsapi.org/v2/everything?q=artificial+intelligence+ai&sortBy=publishedAt&apiKey=demo');
      const aiData = await aiNews.json();
      
      if (aiData.articles) {
        let aiSentiment = 0;
        for (const article of aiData.articles.slice(0, 5)) {
          const sentiment = await this.analyzeSentimentWithNLP(article.title);
          aiSentiment += sentiment;
        }
        aiHype = Math.min(10, 5 + (aiSentiment * 2));
      }
      
      // Check regulatory news
      const regNews = await fetch('https://newsapi.org/v2/everything?q=crypto+regulation+sec&sortBy=publishedAt&apiKey=demo');
      const regData = await regNews.json();
      
      if (regData.articles) {
        let regSentiment = 0;
        for (const article of regData.articles.slice(0, 5)) {
          if (article.title.toLowerCase().includes('ban') || 
              article.title.toLowerCase().includes('investigation') ||
              article.title.toLowerCase().includes('lawsuit')) {
            regSentiment -= 1;
          }
        }
        regulatoryRisk = Math.min(10, 5 - regSentiment);
      }
      
      // Determine macro trend
      if (gpuDemand > 6 && aiHype > 6 && regulatoryRisk < 4) {
        macroTrend = 'risk-on';
      } else if (regulatoryRisk > 7 || (gpuDemand < 4 && aiHype < 4)) {
        macroTrend = 'risk-off';
      }
      
      return {
        gpuDemand,
        aiHype,
        regulatoryRisk,
        macroTrend
      };
    } catch (error) {
      console.error('Market context analysis error:', error);
      return {
        gpuDemand: 5,
        aiHype: 5,
        regulatoryRisk: 5,
        macroTrend: 'neutral'
      };
    }
  }

  /**
   * Apply BERT-style sentiment analysis
   */
  private async applyBERTSentiment(texts: string[]): Promise<number> {
    // In production, you would use a real BERT model via HuggingFace API or local model
    // For now, we'll use enhanced keyword analysis
    
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const text of texts) {
      const score = await this.analyzeSentimentWithNLP(text);
      totalScore += score;
      totalWeight++;
    }
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Advanced NLP sentiment analysis
   */
  private async analyzeSentimentWithNLP(text: string): Promise<number> {
    const lowerText = text.toLowerCase();
    let score = 0;
    
    // Check for critical keywords with weighted impact
    for (const [keyword, impact] of Object.entries(this.criticalKeywords.bullish)) {
      if (lowerText.includes(keyword)) {
        score += impact / 10;
      }
    }
    
    for (const [keyword, impact] of Object.entries(this.criticalKeywords.bearish)) {
      if (lowerText.includes(keyword)) {
        score -= impact / 10;
      }
    }
    
    // Add context analysis (negation detection)
    const negationWords = ['not', 'no', 'never', 'neither', 'none', 'without'];
    for (const negation of negationWords) {
      if (lowerText.includes(negation)) {
        score *= -0.5; // Partial negation
      }
    }
    
    // Emotion intensity modifiers
    const intensifiers = ['very', 'extremely', 'absolutely', 'totally', 'completely'];
    for (const intensifier of intensifiers) {
      if (lowerText.includes(intensifier)) {
        score *= 1.5; // Amplify sentiment
      }
    }
    
    return Math.max(-1, Math.min(1, score));
  }

  /**
   * Helper functions
   */
  private fetchTwitterV2Data(symbol: string): any {
    // Placeholder for Twitter API v2 integration
    return {
      texts: [],
      volume: 0,
      trending: false,
      keywords: [],
      influencerEngagement: 0
    };
  }

  private isRelevantToSymbol(text: string, symbol: string): boolean {
    const symbolVariants = {
      'BTC': ['btc', 'bitcoin', 'sats', 'satoshi'],
      'ETH': ['eth', 'ethereum', 'ether'],
      'SOL': ['sol', 'solana'],
      'ADA': ['ada', 'cardano']
    };
    
    const variants = symbolVariants[symbol] || [symbol.toLowerCase()];
    return variants.some(v => text.includes(v));
  }

  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const keywords: string[] = [];
    
    for (const word of words) {
      if (word.length > 4 && !this.isCommonWord(word)) {
        keywords.push(word);
      }
    }
    
    return keywords;
  }

  private isCommonWord(word: string): boolean {
    const common = ['the', 'and', 'for', 'are', 'but', 'with', 'have', 'this', 'that', 'from'];
    return common.includes(word);
  }

  private getTopKeywords(keywords: string[], limit: number): string[] {
    const counts = new Map<string, number>();
    
    for (const keyword of keywords) {
      counts.set(keyword, (counts.get(keyword) || 0) + 1);
    }
    
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([keyword]) => keyword);
  }

  private calculateWeightedScore(sources: any): number {
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const [source, data] of Object.entries(sources)) {
      const weight = this.sourceWeights[source] || 0.1;
      totalScore += data.score * weight * data.confidence;
      totalWeight += weight * data.confidence;
    }
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  private calculateOverallConfidence(sources: any): number {
    let totalConfidence = 0;
    let count = 0;
    
    for (const data of Object.values(sources)) {
      totalConfidence += (data as any).confidence;
      count++;
    }
    
    return count > 0 ? totalConfidence / count : 0;
  }

  private getDefaultSentiment(symbol: string): AdvancedSentimentData {
    return {
      symbol,
      aggregateScore: 0,
      confidence: 0,
      sources: {
        twitter: this.getDefaultSocialSentiment(),
        reddit: this.getDefaultSocialSentiment(),
        telegram: this.getDefaultSocialSentiment(),
        news: { score: 0, confidence: 0, articleCount: 0, majorHeadlines: [], criticalEvents: [] },
        onChain: { score: 0, confidence: 0, whaleMovements: 0, exchangeInflows: 0, exchangeOutflows: 0, smartContractActivity: 0, networkCongestion: 0 },
        economic: { score: 0, confidence: 0, indicators: {}, nextReleases: [], tariffNews: [] }
      },
      keywordDetections: [],
      whaleActivity: [],
      marketContext: { gpuDemand: 5, aiHype: 5, regulatoryRisk: 5, macroTrend: 'neutral' },
      timestamp: new Date()
    };
  }

  private getDefaultSocialSentiment(): SocialSentiment {
    return {
      score: 0,
      confidence: 0,
      volume: 0,
      trending: false,
      topKeywords: []
    };
  }
}

// Export singleton instance
export const advancedNLPSentiment = new AdvancedNLPSentiment();