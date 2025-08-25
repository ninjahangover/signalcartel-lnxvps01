/**
 * Simple Twitter Sentiment Analyzer
 * Phase 1: Keyword-based sentiment analysis for crypto mentions
 */

export interface SimpleSentimentScore {
  symbol: string;
  score: number;        // -1.0 (very bearish) to +1.0 (very bullish)
  confidence: number;   // 0.0 to 1.0 (based on tweet volume and keyword density)
  timestamp: Date;
  tweetCount: number;   // Number of tweets analyzed
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
}

export interface TwitterConfig {
  bearerToken?: string; // Twitter API v2 Bearer Token
  maxTweets?: number;   // Max tweets to analyze per request
  timeWindowMinutes?: number; // Time window for tweet collection
}

export class SimpleTwitterSentiment {
  private config: TwitterConfig;
  
  // Bullish keywords for crypto
  private readonly bullishKeywords = [
    'moon', 'pump', 'bullish', 'up', 'rise', 'buy', 'hodl', 'breakout',
    'rally', 'surge', 'bull', 'green', 'gains', 'profit', 'long',
    '🚀', '📈', '💎', '🌙', '🔥', '💪'
  ];
  
  // Bearish keywords for crypto
  private readonly bearishKeywords = [
    'dump', 'crash', 'bearish', 'down', 'fall', 'sell', 'rekt', 'drop',
    'red', 'loss', 'bear', 'short', 'correction', 'dip', 'tank',
    '📉', '💸', '😭', '🩸', '⬇️', '📊'
  ];

  constructor(config: TwitterConfig = {}) {
    this.config = {
      maxTweets: 100,
      timeWindowMinutes: 60,
      ...config
    };
  }

  /**
   * Get Bitcoin sentiment from recent Twitter mentions
   */
  async getBTCSentiment(): Promise<SimpleSentimentScore> {
    return this.getSymbolSentiment('BTC', ['BTC', 'Bitcoin', '#Bitcoin', '$BTC']);
  }

  /**
   * Get Ethereum sentiment from recent Twitter mentions
   */
  async getETHSentiment(): Promise<SimpleSentimentScore> {
    return this.getSymbolSentiment('ETH', ['ETH', 'Ethereum', '#Ethereum', '$ETH']);
  }

  /**
   * Get sentiment for a specific crypto symbol
   */
  async getSymbolSentiment(symbol: string, searchTerms: string[]): Promise<SimpleSentimentScore> {
    try {
      // For now, simulate Twitter data (replace with real API call)
      const tweets = await this.fetchTweets(searchTerms);
      
      return this.analyzeTweets(symbol, tweets);
    } catch (error) {
      console.error('Error fetching multi-source sentiment:', error);
      
      // Return neutral sentiment on error with reduced confidence
      return {
        symbol,
        score: 0,
        confidence: 0.1, // Low confidence to indicate error state
        timestamp: new Date(),
        tweetCount: 0,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0
      };
    }
  }

  /**
   * Analyze array of real sentiment data for overall sentiment
   */
  private analyzeTweets(symbol: string, sentimentData: any[]): SimpleSentimentScore {
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    let totalWeightedScore = 0;
    let totalWeight = 0;

    sentimentData.forEach(item => {
      // Handle items with pre-calculated sentiment scores
      let sentiment: number;
      let weight = 1;
      
      if (item.sentiment_score !== undefined) {
        sentiment = item.sentiment_score;
        // Weight by source reliability
        if (item.source === 'fear_greed_index') weight = 3; // High weight for market index
        else if (item.source?.includes('reddit')) weight = item.upvotes ? Math.min(item.upvotes / 100, 2) : 1;
        else if (item.source === 'coindesk_news') weight = 2; // Medium weight for news
        else if (item.source === 'onchain_metrics') weight = 2.5; // High weight for on-chain data
      } else {
        // Fallback: analyze text sentiment
        sentiment = this.analyzeSentimentScore(item.text);
      }
      
      totalWeightedScore += sentiment * weight;
      totalWeight += weight;
      
      if (sentiment > 0.1) positiveCount++;
      else if (sentiment < -0.1) negativeCount++;
      else neutralCount++;
    });

    const totalItems = sentimentData.length;
    
    if (totalItems === 0) {
      return {
        symbol,
        score: 0,
        confidence: 0,
        timestamp: new Date(),
        tweetCount: 0,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0
      };
    }

    // Calculate weighted average sentiment score
    const score = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    
    // Improved confidence calculation based on:
    // 1. Data source diversity
    // 2. Volume of sentiment data
    // 3. Sentiment strength/agreement
    const sourceTypes = new Set(sentimentData.map(item => item.source?.split('_')[0] || 'unknown'));
    const diversityBonus = Math.min(sourceTypes.size / 4, 1.0); // More source types = higher confidence
    const volumeConfidence = Math.min(totalItems / 10, 1.0); // More data points = higher confidence
    const sentimentStrength = Math.abs(score); // Stronger sentiment = higher confidence
    
    // Base confidence from real data sources
    let baseConfidence = 0.6; // Start higher than simulated data
    
    // Boost confidence based on factors
    const confidence = Math.min(1.0, baseConfidence + (diversityBonus * 0.2) + (volumeConfidence * 0.15) + (sentimentStrength * 0.05));

    return {
      symbol,
      score: Math.max(-1, Math.min(1, score)), // Clamp between -1 and 1
      confidence: Math.max(0, Math.min(1, confidence)), // Clamp between 0 and 1
      timestamp: new Date(),
      tweetCount: totalItems,
      positiveCount,
      negativeCount,
      neutralCount
    };
  }

  /**
   * Analyze individual text for sentiment score
   */
  private analyzeSentimentScore(text: string): number {
    const lowerText = text.toLowerCase();
    
    let positiveScore = 0;
    let negativeScore = 0;

    // Count bullish keywords
    this.bullishKeywords.forEach(keyword => {
      const matches = lowerText.split(keyword.toLowerCase()).length - 1;
      positiveScore += matches;
    });

    // Count bearish keywords
    this.bearishKeywords.forEach(keyword => {
      const matches = lowerText.split(keyword.toLowerCase()).length - 1;
      negativeScore += matches;
    });

    // Normalize to -1 to 1 range
    const totalKeywords = positiveScore + negativeScore;
    if (totalKeywords === 0) return 0;

    return (positiveScore - negativeScore) / Math.max(totalKeywords, 1);
  }

  /**
   * Fetch real sentiment data from multiple sources
   */
  private async fetchTweets(searchTerms: string[]): Promise<any[]> {
    // Use real data sources instead of simulated data
    const sentimentData = await this.getRealSentimentData(searchTerms[0]);
    return sentimentData;
  }

  /**
   * Get real sentiment data from multiple sources
   */
  private async getRealSentimentData(symbol: string): Promise<any[]> {
    const sentimentSources = [];
    
    // Fetch all sources in parallel with individual error handling
    const [fearGreedResult, redditResult, newsResult, onChainResult] = await Promise.allSettled([
      this.getFearGreedIndex(),
      this.getRedditSentiment(symbol),
      this.getNewsSentiment(symbol),
      this.getOnChainSentiment(symbol)
    ]);
    
    // 1. Fear & Greed Index
    if (fearGreedResult.status === 'fulfilled' && fearGreedResult.value) {
      sentimentSources.push({
        text: `Market Fear & Greed Index: ${fearGreedResult.value.value_classification} (${fearGreedResult.value.value}/100)`,
        created_at: new Date().toISOString(),
        source: 'fear_greed_index',
        sentiment_score: (fearGreedResult.value.value - 50) / 50
      });
    }
    
    // 2. Reddit sentiment
    if (redditResult.status === 'fulfilled' && redditResult.value) {
      sentimentSources.push(...redditResult.value);
    }
    
    // 3. News sentiment  
    if (newsResult.status === 'fulfilled' && newsResult.value) {
      sentimentSources.push(...newsResult.value);
    }
    
    // 4. On-chain sentiment
    if (onChainResult.status === 'fulfilled' && onChainResult.value) {
      sentimentSources.push(onChainResult.value);
    }
    
    // Ensure we always have some data
    if (sentimentSources.length === 0) {
      return [{
        text: "No sentiment data available",
        created_at: new Date().toISOString(),
        source: 'fallback',
        sentiment_score: 0
      }];
    }
    
    return sentimentSources;
  }

  /**
   * Get Fear & Greed Index (free API)
   */
  private async getFearGreedIndex(): Promise<any> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch('https://api.alternative.me/fng/', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      if (data.data && data.data[0]) {
        return data.data[0];
      }
    } catch (error) {
      console.error('Error fetching Fear & Greed Index:', error);
    }
    return null;
  }

  private lastRedditFetch: number = 0;
  private redditCache: any[] = [];
  private redditRetryCount: number = 0;
  private maxRedditRetries: number = 3;
  
  /**
   * Get Reddit sentiment from crypto subreddits with enhanced rate limiting
   */
  private async getRedditSentiment(symbol: string): Promise<any[]> {
    // Enhanced rate limiting: 5 minutes cache to reduce API pressure
    const now = Date.now();
    const cacheTimeout = 5 * 60 * 1000; // 5 minutes instead of 1 minute
    
    if (this.redditCache.length > 0 && (now - this.lastRedditFetch) < cacheTimeout) {
      // console.log('Using cached Reddit data to avoid rate limits'); // Reduced console noise
      return this.redditCache;
    }
    
    const sentimentData = [];
    
    try {
      // Reduced to single subreddit to minimize rate limit exposure
      const subreddits = ['Bitcoin']; // Reduced from 3 to 1 subreddit
      
      for (const subreddit of subreddits) {
        try {
          // Exponential backoff for rate limiting
          if (this.redditRetryCount > 0) {
            const backoffDelay = Math.min(1000 * Math.pow(2, this.redditRetryCount), 10000);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
          }
          
          const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=10`, { // Increased limit to get more data per request
            headers: {
              'User-Agent': 'SignalCartel/1.0 (Quantum Forge Trading Platform)',
              'Accept': 'application/json',
              'Cache-Control': 'max-age=300' // 5 minute cache header
            },
            signal: AbortSignal.timeout(4000) // Increased timeout to 4 seconds
          });
          
          if (response.status === 429) {
            this.redditRetryCount = Math.min(this.redditRetryCount + 1, this.maxRedditRetries);
            console.warn(`Rate limited on r/${subreddit}, retry count: ${this.redditRetryCount}`);
            
            // If max retries reached, use cached data if available
            if (this.redditRetryCount >= this.maxRedditRetries && this.redditCache.length > 0) {
              console.warn('Max Reddit retries reached, using stale cache data');
              return this.redditCache;
            }
            continue;
          }
          
          if (!response.ok) {
            throw new Error(`Reddit API returned ${response.status}: ${response.statusText}`);
          }
          
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            console.warn(`r/${subreddit} returned non-JSON content, skipping`);
            continue;
          }
          
          const data = await response.json();
          
          if (data.data && data.data.children) {
            data.data.children.forEach((post: any) => {
              const title = post.data.title.toLowerCase();
              const selftext = post.data.selftext.toLowerCase();
              const text = `${title} ${selftext}`;
              
              // Only include posts mentioning our symbol
              if (text.includes(symbol.toLowerCase()) || text.includes('btc') || text.includes('bitcoin')) {
                const sentimentScore = this.analyzeSentimentScore(text);
                sentimentData.push({
                  text: post.data.title,
                  created_at: new Date(post.data.created_utc * 1000).toISOString(),
                  source: `reddit_${subreddit}`,
                  sentiment_score: sentimentScore,
                  upvotes: post.data.ups,
                  comments: post.data.num_comments
                });
              }
            });
          }
        } catch (error) {
          // Only log warnings for non-timeout errors to reduce console noise
          if (!error.message.includes('timeout') && !error.message.includes('aborted')) {
            console.warn(`Error fetching from r/${subreddit}:`, error.message);
          }
        }
      }
      
      // Cache results and timestamp, reset retry count on success
      if (sentimentData.length > 0) {
        this.redditCache = sentimentData;
        this.lastRedditFetch = now;
        this.redditRetryCount = 0; // Reset retry count on successful fetch
        console.log(`✅ Reddit sentiment updated: ${sentimentData.length} data points cached for 5 minutes`);
      }
      
    } catch (error) {
      console.error('Error fetching Reddit sentiment:', error.message);
      
      // Return stale cache data if available during errors
      if (this.redditCache.length > 0) {
        console.warn('Using stale Reddit cache due to API error');
        return this.redditCache;
      }
    }
    
    return sentimentData;
  }

  /**
   * Get news sentiment from financial APIs
   */
  private async getNewsSentiment(symbol: string): Promise<any[]> {
    const sentimentData = [];
    
    try {
      // Use free news API or RSS feeds
      const keywords = symbol === 'BTC' ? 'Bitcoin' : symbol;
      
      // CoinDesk RSS feed (free)
      const response = await fetch('https://www.coindesk.com/arc/outboundfeeds/rss/');
      const text = await response.text();
      
      // Simple RSS parsing to extract headlines
      const titleMatches = text.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g);
      
      if (titleMatches) {
        titleMatches.slice(0, 10).forEach(match => {
          const title = match.replace(/<title><!\[CDATA\[/, '').replace(/\]\]><\/title>/, '');
          
          if (title.toLowerCase().includes(keywords.toLowerCase()) || 
              title.toLowerCase().includes('crypto') || 
              title.toLowerCase().includes('bitcoin')) {
            
            const sentimentScore = this.analyzeSentimentScore(title);
            sentimentData.push({
              text: title,
              created_at: new Date().toISOString(),
              source: 'coindesk_news',
              sentiment_score: sentimentScore
            });
          }
        });
      }
    } catch (error) {
      console.error('Error fetching news sentiment:', error);
    }
    
    return sentimentData;
  }

  /**
   * Get on-chain metrics sentiment
   */
  private async getOnChainSentiment(symbol: string): Promise<any> {
    try {
      if (symbol === 'BTC') {
        // Use free blockchain.info API for basic metrics
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch('https://blockchain.info/q/24hrtransactioncount', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        const txCount = parseInt(await response.text());
        
        // Simple sentiment based on transaction volume
        // Higher tx count = more activity = more bullish sentiment
        const avgTxCount = 300000; // Approximate daily average
        const sentimentScore = Math.min(1, Math.max(-1, (txCount - avgTxCount) / avgTxCount));
        
        return {
          text: `Bitcoin network activity: ${txCount.toLocaleString()} transactions in 24h`,
          created_at: new Date().toISOString(),
          source: 'onchain_metrics',
          sentiment_score: sentimentScore,
          tx_count: txCount
        };
      }
    } catch (error) {
      console.error('Error fetching on-chain sentiment:', error);
    }
    
    return null;
  }

  /**
   * Check if sentiment conflicts with a trading signal
   */
  checkSentimentConflict(action: 'BUY' | 'SELL', sentiment: SimpleSentimentScore, threshold: number = 0.3): boolean {
    if (sentiment.confidence < 0.5) return false; // Don't use low-confidence sentiment
    
    if (action === 'BUY' && sentiment.score < -threshold) return true; // Buying in bearish sentiment
    if (action === 'SELL' && sentiment.score > threshold) return true; // Selling in bullish sentiment
    
    return false;
  }

  /**
   * Calculate sentiment boost for trading confidence
   */
  calculateSentimentBoost(sentiment: SimpleSentimentScore, maxBoost: number = 0.2): number {
    if (sentiment.confidence < 0.5) return 1.0; // No boost for low confidence
    
    const sentimentStrength = Math.abs(sentiment.score);
    const boost = 1.0 + (sentimentStrength * sentiment.confidence * maxBoost);
    
    return Math.min(boost, 1.0 + maxBoost); // Cap the maximum boost
  }
}

// Export default instance
export const twitterSentiment = new SimpleTwitterSentiment();