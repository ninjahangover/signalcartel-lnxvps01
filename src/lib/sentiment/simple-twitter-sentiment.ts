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
      console.error('Error fetching Twitter sentiment:', error);
      
      // Return neutral sentiment on error
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
    
    try {
      // 1. Fear & Greed Index (real market sentiment)
      const fearGreedData = await this.getFearGreedIndex();
      if (fearGreedData) {
        sentimentSources.push({
          text: `Market Fear & Greed Index: ${fearGreedData.value_classification} (${fearGreedData.value}/100)`,
          created_at: new Date().toISOString(),
          source: 'fear_greed_index',
          sentiment_score: (fearGreedData.value - 50) / 50 // Convert 0-100 to -1 to 1
        });
      }
      
      // 2. Reddit sentiment from crypto subreddits
      const redditData = await this.getRedditSentiment(symbol);
      sentimentSources.push(...redditData);
      
      // 3. News sentiment
      const newsData = await this.getNewsSentiment(symbol);
      sentimentSources.push(...newsData);
      
      // 4. On-chain metrics sentiment
      const onChainData = await this.getOnChainSentiment(symbol);
      if (onChainData) sentimentSources.push(onChainData);
      
    } catch (error) {
      console.error('Error fetching real sentiment data:', error);
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
      const response = await fetch('https://api.alternative.me/fng/');
      const data = await response.json();
      if (data.data && data.data[0]) {
        return data.data[0];
      }
    } catch (error) {
      console.error('Error fetching Fear & Greed Index:', error);
    }
    return null;
  }

  /**
   * Get Reddit sentiment from crypto subreddits
   */
  private async getRedditSentiment(symbol: string): Promise<any[]> {
    const sentimentData = [];
    
    try {
      // Use Reddit's JSON API (no auth required for public posts)
      const subreddits = ['Bitcoin', 'CryptoCurrency', 'ethereum'];
      
      for (const subreddit of subreddits) {
        try {
          const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=10`);
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
          console.warn(`Error fetching from r/${subreddit}:`, error);
        }
      }
    } catch (error) {
      console.error('Error fetching Reddit sentiment:', error);
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
        const response = await fetch('https://blockchain.info/q/24hrtransactioncount');
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