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
   * Analyze array of tweets for sentiment
   */
  private analyzeTweets(symbol: string, tweets: any[]): SimpleSentimentScore {
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    tweets.forEach(tweet => {
      const sentiment = this.analyzeTweetSentiment(tweet.text);
      
      if (sentiment > 0.1) positiveCount++;
      else if (sentiment < -0.1) negativeCount++;
      else neutralCount++;
    });

    const totalTweets = tweets.length;
    
    if (totalTweets === 0) {
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

    // Calculate overall sentiment score
    const score = (positiveCount - negativeCount) / totalTweets;
    
    // Confidence based on volume and sentiment strength
    const sentimentActivity = (positiveCount + negativeCount) / totalTweets;
    const volumeConfidence = Math.min(totalTweets / 50, 1.0); // More tweets = higher confidence
    const confidence = sentimentActivity * volumeConfidence;

    return {
      symbol,
      score: Math.max(-1, Math.min(1, score)), // Clamp between -1 and 1
      confidence: Math.max(0, Math.min(1, confidence)), // Clamp between 0 and 1
      timestamp: new Date(),
      tweetCount: totalTweets,
      positiveCount,
      negativeCount,
      neutralCount
    };
  }

  /**
   * Analyze individual tweet for sentiment
   */
  private analyzeTweetSentiment(text: string): number {
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
   * Fetch tweets from Twitter API (or simulate for testing)
   */
  private async fetchTweets(searchTerms: string[]): Promise<any[]> {
    // TODO: Replace with actual Twitter API v2 call
    // For now, simulate realistic Twitter data
    
    if (!this.config.bearerToken) {
      console.warn('No Twitter Bearer Token provided, using simulated data');
      return this.generateSimulatedTweets();
    }

    // TODO: Implement actual Twitter API v2 call
    // const query = searchTerms.join(' OR ');
    // const response = await fetch(`https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=${this.config.maxTweets}`, {
    //   headers: {
    //     'Authorization': `Bearer ${this.config.bearerToken}`,
    //     'Content-Type': 'application/json'
    //   }
    // });
    
    return this.generateSimulatedTweets();
  }

  /**
   * Generate simulated tweets for testing (remove when Twitter API is integrated)
   */
  private generateSimulatedTweets(): any[] {
    const simulatedTweets = [
      { text: "Bitcoin is going to the moon! 🚀 Bullish on BTC", created_at: new Date().toISOString() },
      { text: "BTC dump incoming, this looks bearish 📉", created_at: new Date().toISOString() },
      { text: "HODL Bitcoin, long term bullish trend", created_at: new Date().toISOString() },
      { text: "Bitcoin crash? Time to buy the dip! 💎", created_at: new Date().toISOString() },
      { text: "BTC technical analysis shows strong resistance", created_at: new Date().toISOString() },
      { text: "Selling my Bitcoin, market looks weak", created_at: new Date().toISOString() },
      { text: "Bitcoin breakout above resistance! Bull run continues 📈", created_at: new Date().toISOString() },
      { text: "BTC price action is neutral, waiting for direction", created_at: new Date().toISOString() },
    ];

    // Return random subset for realistic variation
    const count = Math.floor(Math.random() * 20) + 10; // 10-30 tweets
    return simulatedTweets.slice(0, count);
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