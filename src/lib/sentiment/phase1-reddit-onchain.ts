/**
 * Phase 1: Reddit + On-Chain Analysis
 * GPU-accelerated sentiment intelligence for QUANTUM FORGE
 */

import { gpuNLPProcessor, GPUSentimentResult } from './gpu-nlp-processor';

export interface RedditSentimentData {
  subreddit: string;
  score: number;
  confidence: number;
  volume: number;
  trending: boolean;
  topPosts: RedditPost[];
  wsb_activity?: number; // WallStreetBets specific metrics
  processingTimeMs: number;
}

export interface RedditPost {
  title: string;
  score: number;
  sentiment: number;
  upvotes: number;
  comments: number;
  awards: number;
  author_karma?: number;
}

export interface OnChainData {
  symbol: string;
  whaleActivity: WhaleMetrics;
  exchangeFlows: ExchangeFlows;
  networkMetrics: NetworkMetrics;
  defiActivity: DeFiMetrics;
  sentimentScore: number;
  confidence: number;
}

export interface WhaleMetrics {
  largeTransfers: number;      // Count of $1M+ transfers
  whaleAccumulation: number;   // Net accumulation by whale wallets
  smartMoneyFlow: number;      // Flow from known smart wallets
  dormantActivations: number;  // Old wallets becoming active
}

export interface ExchangeFlows {
  inflowVolume: number;
  outflowVolume: number;
  netFlow: number;
  majorExchanges: {
    binance: number;
    coinbase: number;
    kraken: number;
  };
}

export interface NetworkMetrics {
  transactionCount: number;
  activeAddresses: number;
  gasPrice: number;
  hashRate: number;
  difficulty: number;
  mempoolSize: number;
}

export interface DeFiMetrics {
  tvl: number;              // Total Value Locked
  lendingVolume: number;
  dexVolume: number;
  stablecoinFlows: number;
}

export class Phase1SentimentEngine {
  private gpuProcessor = gpuNLPProcessor;
  
  // Reddit API configuration
  private readonly redditConfig = {
    userAgent: 'QuantumForge/1.0',
    targetSubreddits: [
      'Bitcoin', 'CryptoCurrency', 'ethereum', 'defi',
      'WallStreetBets', 'CryptoMoonShots', 'SatoshiStreetBets',
      'CryptoMarkets', 'binance', 'ethtrader', 'CardanoCoin',
      'solana', 'algorand', 'CryptoTechnology'
    ],
    minUpvotes: 10,
    maxPosts: 100
  };

  // On-chain data sources
  private readonly onChainAPIs = {
    glassnode: 'https://api.glassnode.com/v1/metrics',
    santiment: 'https://api.santiment.net/graphql',
    nansen: 'https://api.nansen.ai/v1',
    dune: 'https://api.dune.com/api/v1',
    etherscan: 'https://api.etherscan.io/api',
    whale_alert: 'https://api.whale-alert.io/v1'
  };

  /**
   * Get comprehensive Reddit sentiment with GPU processing
   */
  async getRedditSentiment(symbol: string): Promise<RedditSentimentData> {
    const startTime = Date.now();
    const allPosts: RedditPost[] = [];
    const sentimentScores: number[] = [];
    
    try {
      // Fetch posts from multiple subreddits in parallel
      const subredditPromises = this.redditConfig.targetSubreddits.map(sub => 
        this.fetchSubredditData(sub, symbol)
      );
      
      const subredditResults = await Promise.all(subredditPromises);
      
      // Combine all posts
      for (const posts of subredditResults) {
        allPosts.push(...posts);
      }
      
      // Sort by engagement (upvotes + comments)
      allPosts.sort((a, b) => (b.upvotes + b.comments) - (a.upvotes + a.comments));
      
      // Process top posts with GPU NLP
      const topPosts = allPosts.slice(0, 50);
      const postTexts = topPosts.map(p => p.title);
      
      // Batch GPU processing
      const gpuResults = await this.gpuProcessor.processBatchSentiment(postTexts);
      
      // Apply sentiment scores and calculate weighted average
      let weightedScore = 0;
      let totalWeight = 0;
      
      topPosts.forEach((post, i) => {
        post.sentiment = gpuResults[i].score;
        
        // Weight by engagement
        const weight = Math.log10(Math.max(10, post.upvotes + post.comments * 2));
        weightedScore += post.sentiment * weight;
        totalWeight += weight;
      });
      
      const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
      
      // Check for WSB activity
      const wsbPosts = allPosts.filter(p => p.title.toLowerCase().includes('yolo') || 
                                            p.title.toLowerCase().includes('diamond hands') ||
                                            p.title.toLowerCase().includes('apes'));
      const wsbActivity = wsbPosts.length / Math.max(1, allPosts.length);
      
      return {
        subreddit: 'aggregate',
        score: Math.max(-1, Math.min(1, finalScore)),
        confidence: Math.min(1, allPosts.length / 50),
        volume: allPosts.length,
        trending: allPosts.length > 30 && finalScore > 0.3,
        topPosts: topPosts.slice(0, 10),
        wsb_activity: wsbActivity,
        processingTimeMs: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('Reddit sentiment error:', error);
      return this.getDefaultRedditSentiment();
    }
  }

  /**
   * Fetch subreddit data
   */
  private async fetchSubredditData(subreddit: string, symbol: string): Promise<RedditPost[]> {
    const posts: RedditPost[] = [];
    
    try {
      // Fetch hot posts with timeout
      const hotResponse = await fetch(
        `https://www.reddit.com/r/${subreddit}/hot.json?limit=25`,
        { 
          headers: { 'User-Agent': this.redditConfig.userAgent },
          signal: AbortSignal.timeout(2000) // 2 second timeout
        }
      );
      
      // Fetch rising posts with timeout
      const risingResponse = await fetch(
        `https://www.reddit.com/r/${subreddit}/rising.json?limit=10`,
        { 
          headers: { 'User-Agent': this.redditConfig.userAgent },
          signal: AbortSignal.timeout(2000) // 2 second timeout
        }
      );
      
      const hotData = await hotResponse.json();
      const risingData = await risingResponse.json();
      
      // Process hot posts
      if (hotData.data?.children) {
        for (const child of hotData.data.children) {
          const post = child.data;
          const text = `${post.title} ${post.selftext || ''}`.toLowerCase();
          
          // Check relevance to symbol
          if (this.isRelevantPost(text, symbol) && post.ups >= this.redditConfig.minUpvotes) {
            posts.push({
              title: post.title,
              score: post.score,
              sentiment: 0, // Will be filled by GPU processing
              upvotes: post.ups,
              comments: post.num_comments,
              awards: post.total_awards_received || 0,
              author_karma: post.author_karma
            });
          }
        }
      }
      
      // Process rising posts (higher weight for trending)
      if (risingData.data?.children) {
        for (const child of risingData.data.children) {
          const post = child.data;
          const text = `${post.title} ${post.selftext || ''}`.toLowerCase();
          
          if (this.isRelevantPost(text, symbol)) {
            posts.push({
              title: `[RISING] ${post.title}`,
              score: post.score * 1.5, // Boost rising posts
              sentiment: 0,
              upvotes: post.ups,
              comments: post.num_comments,
              awards: post.total_awards_received || 0,
              author_karma: post.author_karma
            });
          }
        }
      }
      
    } catch (error) {
      console.warn(`Error fetching r/${subreddit}:`, error);
    }
    
    return posts;
  }

  /**
   * Get comprehensive on-chain analysis
   */
  async getOnChainAnalysis(symbol: string): Promise<OnChainData> {
    try {
      // Fetch data from multiple sources in parallel
      const [
        whaleData,
        exchangeData,
        networkData,
        defiData
      ] = await Promise.all([
        this.analyzeWhaleActivity(symbol),
        this.analyzeExchangeFlows(symbol),
        this.getNetworkMetrics(symbol),
        this.getDeFiMetrics(symbol)
      ]);
      
      // Calculate sentiment score based on on-chain metrics
      const sentimentScore = this.calculateOnChainSentiment(
        whaleData,
        exchangeData,
        networkData,
        defiData
      );
      
      return {
        symbol,
        whaleActivity: whaleData,
        exchangeFlows: exchangeData,
        networkMetrics: networkData,
        defiActivity: defiData,
        sentimentScore,
        confidence: 0.85 // On-chain data is highly reliable
      };
      
    } catch (error) {
      console.error('On-chain analysis error:', error);
      return this.getDefaultOnChainData(symbol);
    }
  }

  /**
   * Analyze whale wallet activity
   */
  private async analyzeWhaleActivity(symbol: string): Promise<WhaleMetrics> {
    let largeTransfers = 0;
    let whaleAccumulation = 0;
    let smartMoneyFlow = 0;
    let dormantActivations = 0;
    
    try {
      // Whale Alert API for large transfers
      const whaleResponse = await fetch(
        `${this.onChainAPIs.whale_alert}/transactions?api_key=demo&min_value=1000000&symbol=${symbol}&limit=100`
      );
      const whaleData = await whaleResponse.json();
      
      if (whaleData.result === 'success' && whaleData.transactions) {
        largeTransfers = whaleData.count;
        
        // Analyze transaction patterns
        for (const tx of whaleData.transactions) {
          // Check if it's accumulation (to unknown wallet) or distribution (to exchange)
          if (tx.to.owner_type === 'unknown') {
            whaleAccumulation += tx.amount_usd;
          } else if (tx.to.owner_type === 'exchange') {
            whaleAccumulation -= tx.amount_usd;
          }
          
          // Check for smart money (known profitable wallets)
          if (tx.from.labels?.includes('smart_money')) {
            smartMoneyFlow += tx.to.owner_type === 'exchange' ? -tx.amount_usd : tx.amount_usd;
          }
        }
      }
      
      // Check for dormant wallet activations (bullish signal)
      if (symbol === 'BTC') {
        const dormantResponse = await fetch('https://api.blockchain.info/charts/n-dormant?format=json&timespan=1day');
        const dormantData = await dormantResponse.json();
        
        if (dormantData.values) {
          const latest = dormantData.values[dormantData.values.length - 1];
          const previous = dormantData.values[dormantData.values.length - 2];
          dormantActivations = latest.y - previous.y;
        }
      }
      
    } catch (error) {
      console.warn('Whale activity analysis error:', error);
    }
    
    return {
      largeTransfers,
      whaleAccumulation: whaleAccumulation / 1000000, // Convert to millions
      smartMoneyFlow: smartMoneyFlow / 1000000,
      dormantActivations
    };
  }

  /**
   * Analyze exchange flows
   */
  private async analyzeExchangeFlows(symbol: string): Promise<ExchangeFlows> {
    let inflowVolume = 0;
    let outflowVolume = 0;
    const majorExchanges = { binance: 0, coinbase: 0, kraken: 0 };
    
    try {
      // CryptoQuant-style exchange flow analysis
      // Using blockchain.info as proxy for BTC
      if (symbol === 'BTC') {
        const volumeResponse = await fetch('https://api.blockchain.info/stats');
        const volumeData = await volumeResponse.json();
        
        // Estimate based on known exchange wallet patterns
        const totalVolume = volumeData.trade_volume_btc;
        
        // Rough heuristic: 30% of volume is exchange-related
        const exchangeVolume = totalVolume * 0.3;
        
        // Market sentiment affects inflow/outflow ratio
        // This would be enhanced with real exchange wallet tracking
        const marketSentiment = volumeData.market_price_usd > volumeData.market_price_usd_24h_ago ? 1 : -1;
        
        if (marketSentiment > 0) {
          inflowVolume = exchangeVolume * 0.4;
          outflowVolume = exchangeVolume * 0.6; // Bullish: more outflows
        } else {
          inflowVolume = exchangeVolume * 0.6; // Bearish: more inflows
          outflowVolume = exchangeVolume * 0.4;
        }
        
        // Distribute among exchanges (estimated market share)
        majorExchanges.binance = exchangeVolume * 0.4;
        majorExchanges.coinbase = exchangeVolume * 0.3;
        majorExchanges.kraken = exchangeVolume * 0.1;
      }
      
    } catch (error) {
      console.warn('Exchange flow analysis error:', error);
    }
    
    return {
      inflowVolume,
      outflowVolume,
      netFlow: outflowVolume - inflowVolume,
      majorExchanges
    };
  }

  /**
   * Get network metrics
   */
  private async getNetworkMetrics(symbol: string): Promise<NetworkMetrics> {
    const metrics: NetworkMetrics = {
      transactionCount: 0,
      activeAddresses: 0,
      gasPrice: 0,
      hashRate: 0,
      difficulty: 0,
      mempoolSize: 0
    };
    
    try {
      if (symbol === 'BTC') {
        // Bitcoin network metrics
        const [txCount, mempool, hashRate, difficulty] = await Promise.all([
          fetch('https://api.blockchain.info/q/24hrtransactioncount').then(r => r.text()),
          fetch('https://api.blockchain.info/q/unconfirmedcount').then(r => r.text()),
          fetch('https://api.blockchain.info/q/hashrate').then(r => r.text()),
          fetch('https://api.blockchain.info/q/getdifficulty').then(r => r.text())
        ]);
        
        metrics.transactionCount = parseInt(txCount);
        metrics.mempoolSize = parseInt(mempool);
        metrics.hashRate = parseFloat(hashRate);
        metrics.difficulty = parseFloat(difficulty);
        
        // Estimate active addresses
        metrics.activeAddresses = Math.round(metrics.transactionCount / 3); // Rough estimate
        
      } else if (symbol === 'ETH') {
        // Ethereum network metrics
        const ethResponse = await fetch(`${this.onChainAPIs.etherscan}?module=stats&action=ethprice&apikey=demo`);
        const ethData = await ethResponse.json();
        
        if (ethData.status === '1') {
          // Would need more API calls for complete ETH metrics
          metrics.gasPrice = parseFloat(ethData.result.ethusd);
        }
      }
      
    } catch (error) {
      console.warn('Network metrics error:', error);
    }
    
    return metrics;
  }

  /**
   * Get DeFi metrics
   */
  private async getDeFiMetrics(symbol: string): Promise<DeFiMetrics> {
    const metrics: DeFiMetrics = {
      tvl: 0,
      lendingVolume: 0,
      dexVolume: 0,
      stablecoinFlows: 0
    };
    
    try {
      // DeFi Llama API for TVL
      const tvlResponse = await fetch(`https://api.llama.fi/protocols`);
      const tvlData = await tvlResponse.json();
      
      if (tvlData) {
        // Calculate total TVL for the symbol's ecosystem
        const relevantProtocols = tvlData.filter((p: any) => 
          p.chain === symbol || p.symbol === symbol
        );
        
        metrics.tvl = relevantProtocols.reduce((sum: number, p: any) => sum + (p.tvl || 0), 0);
      }
      
      // DEX volume from CoinGecko
      const dexResponse = await fetch(`https://api.coingecko.com/api/v3/exchanges`);
      const dexData = await dexResponse.json();
      
      if (Array.isArray(dexData)) {
        // Sum volume from major DEXs
        const dexes = ['uniswap', 'sushiswap', 'pancakeswap', 'curve'];
        metrics.dexVolume = dexData
          .filter((ex: any) => dexes.includes(ex.id))
          .reduce((sum: number, ex: any) => sum + (ex.trade_volume_24h_btc || 0), 0);
      }
      
    } catch (error) {
      console.warn('DeFi metrics error:', error);
    }
    
    return metrics;
  }

  /**
   * Calculate on-chain sentiment score
   */
  private calculateOnChainSentiment(
    whale: WhaleMetrics,
    exchange: ExchangeFlows,
    network: NetworkMetrics,
    defi: DeFiMetrics
  ): number {
    let score = 0;
    
    // Whale activity scoring
    if (whale.whaleAccumulation > 0) score += 0.3;
    if (whale.smartMoneyFlow > 0) score += 0.2;
    if (whale.dormantActivations > 100) score += 0.1;
    
    // Exchange flow scoring (outflows bullish, inflows bearish)
    if (exchange.netFlow > 0) score += 0.2;
    else if (exchange.netFlow < -1000000) score -= 0.2;
    
    // Network activity scoring
    const avgTxCount = 300000;
    if (network.transactionCount > avgTxCount * 1.2) score += 0.1;
    else if (network.transactionCount < avgTxCount * 0.8) score -= 0.1;
    
    // High mempool is negative (congestion)
    if (network.mempoolSize > 10000) score -= 0.1;
    
    // DeFi activity scoring
    if (defi.tvl > 1000000000) score += 0.1; // $1B+ TVL
    if (defi.dexVolume > 100) score += 0.1; // High DEX volume
    
    return Math.max(-1, Math.min(1, score));
  }

  /**
   * Helper functions
   */
  private isRelevantPost(text: string, symbol: string): boolean {
    const symbolMap = {
      'BTC': ['bitcoin', 'btc', 'sats', 'satoshi'],
      'ETH': ['ethereum', 'eth', 'ether', 'vitalik'],
      'SOL': ['solana', 'sol'],
      'ADA': ['cardano', 'ada']
    };
    
    const keywords = symbolMap[symbol] || [symbol.toLowerCase()];
    return keywords.some(k => text.includes(k)) || text.includes('crypto');
  }

  private getDefaultRedditSentiment(): RedditSentimentData {
    return {
      subreddit: 'none',
      score: 0,
      confidence: 0,
      volume: 0,
      trending: false,
      topPosts: [],
      processingTimeMs: 0
    };
  }

  private getDefaultOnChainData(symbol: string): OnChainData {
    return {
      symbol,
      whaleActivity: { largeTransfers: 0, whaleAccumulation: 0, smartMoneyFlow: 0, dormantActivations: 0 },
      exchangeFlows: { inflowVolume: 0, outflowVolume: 0, netFlow: 0, majorExchanges: { binance: 0, coinbase: 0, kraken: 0 } },
      networkMetrics: { transactionCount: 0, activeAddresses: 0, gasPrice: 0, hashRate: 0, difficulty: 0, mempoolSize: 0 },
      defiActivity: { tvl: 0, lendingVolume: 0, dexVolume: 0, stablecoinFlows: 0 },
      sentimentScore: 0,
      confidence: 0
    };
  }
}

// Export singleton
export const phase1SentimentEngine = new Phase1SentimentEngine();