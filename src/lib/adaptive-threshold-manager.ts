/**
 * Adaptive Threshold Manager
 * 
 * This is the CORE of Stratus Engine - AI automatically adjusts all thresholds
 * based on performance to achieve optimal win rates.
 * 
 * The AI LEARNS and ADAPTS in real-time!
 */

export interface AdaptiveThresholds {
  // Trading decision thresholds
  minAIConfidence: number;           // Starts at 0.5, AI lowers if too restrictive
  minMarketConfidence: number;       // Starts at 0.6, AI adjusts based on success
  aiScoreBuyThreshold: number;       // Starts at 75, AI lowers to find opportunities
  aiScoreSellThreshold: number;      // Starts at 25, AI raises to find opportunities
  
  // Risk management
  maxDrawdownPercent: number;        // Dynamic based on performance
  positionSizeMultiplier: number;    // AI adjusts based on win rate
  
  // Time and volume filters
  enableTimeRestrictions: boolean;   // AI can disable if limiting profits
  minVolumeThreshold: number;        // AI adjusts based on market conditions
  
  // Learning metrics
  totalTrades: number;
  successfulTrades: number;
  currentWinRate: number;
  lastAdjustment: Date;
  adjustmentCount: number;
}

class AdaptiveThresholdManager {
  private static instance: AdaptiveThresholdManager;
  private thresholds: AdaptiveThresholds;
  private performanceHistory: any[] = [];
  private isLearning: boolean = true;
  
  private constructor() {
    // Start with conservative defaults
    this.thresholds = {
      minAIConfidence: 0.5,
      minMarketConfidence: 0.6,
      aiScoreBuyThreshold: 75,
      aiScoreSellThreshold: 25,
      maxDrawdownPercent: 20,
      positionSizeMultiplier: 1.0,
      enableTimeRestrictions: true,
      minVolumeThreshold: 10000,
      totalTrades: 0,
      successfulTrades: 0,
      currentWinRate: 0,
      lastAdjustment: new Date(),
      adjustmentCount: 0
    };
    
    // Load saved thresholds if they exist
    this.loadThresholds();
    
    // Start the adaptive learning loop
    this.startAdaptiveLearning();
  }
  
  static getInstance(): AdaptiveThresholdManager {
    if (!AdaptiveThresholdManager.instance) {
      AdaptiveThresholdManager.instance = new AdaptiveThresholdManager();
    }
    return AdaptiveThresholdManager.instance;
  }
  
  /**
   * Get current thresholds for trade validation
   * This is what the webhook processor should use!
   */
  getThresholds(): AdaptiveThresholds {
    return { ...this.thresholds };
  }
  
  /**
   * Record trade outcome and trigger learning
   */
  async recordTradeOutcome(
    executed: boolean,
    successful: boolean | null,
    blockedReason?: string
  ): Promise<void> {
    this.thresholds.totalTrades++;
    
    if (executed && successful !== null) {
      if (successful) {
        this.thresholds.successfulTrades++;
      }
      this.thresholds.currentWinRate = 
        (this.thresholds.successfulTrades / this.thresholds.totalTrades) * 100;
    }
    
    // Record performance data
    this.performanceHistory.push({
      timestamp: new Date(),
      executed,
      successful,
      blockedReason,
      thresholdsAtTime: { ...this.thresholds }
    });
    
    // Trigger adaptive learning
    if (this.isLearning) {
      await this.performAdaptiveLearning(executed, successful, blockedReason);
    }
  }
  
  /**
   * CORE AI LEARNING ALGORITHM
   * This is where the magic happens - AI adjusts thresholds automatically
   */
  private async performAdaptiveLearning(
    executed: boolean,
    successful: boolean | null,
    blockedReason?: string
  ): Promise<void> {
    console.log('🧠 Stratus AI Learning Engine analyzing performance...');
    
    // If trades are being blocked too often, lower thresholds
    if (!executed && blockedReason) {
      console.log(`📉 Trade blocked: ${blockedReason}. AI adjusting thresholds...`);
      
      if (blockedReason.includes('AI confidence too low')) {
        // Lower AI confidence requirement
        this.thresholds.minAIConfidence = Math.max(0.2, this.thresholds.minAIConfidence * 0.9);
        console.log(`✅ AI confidence threshold lowered to ${(this.thresholds.minAIConfidence * 100).toFixed(1)}%`);
      }
      
      if (blockedReason.includes('Market analysis confidence too low')) {
        // Lower market confidence requirement
        this.thresholds.minMarketConfidence = Math.max(0.3, this.thresholds.minMarketConfidence * 0.9);
        console.log(`✅ Market confidence threshold lowered to ${(this.thresholds.minMarketConfidence * 100).toFixed(1)}%`);
      }
      
      if (blockedReason.includes('Suboptimal trading time')) {
        // Disable time restrictions if they're blocking too many trades
        const blockedByTime = this.performanceHistory.filter(p => 
          p.blockedReason?.includes('Suboptimal trading time')
        ).length;
        
        if (blockedByTime > 5) {
          this.thresholds.enableTimeRestrictions = false;
          console.log('✅ Time restrictions disabled - trade any time!');
        }
      }
      
      if (blockedReason.includes('Insufficient market volume')) {
        // Lower volume threshold
        this.thresholds.minVolumeThreshold = Math.max(100, this.thresholds.minVolumeThreshold * 0.8);
        console.log(`✅ Volume threshold lowered to ${this.thresholds.minVolumeThreshold}`);
      }
    }
    
    // Adjust AI score thresholds based on HOLD decisions
    const recentTrades = this.performanceHistory.slice(-20);
    const holdDecisions = recentTrades.filter(t => t.blockedReason?.includes('HOLD')).length;
    
    if (holdDecisions > 10) {
      // Too many HOLDs - widen the trading range
      this.thresholds.aiScoreBuyThreshold = Math.max(50, this.thresholds.aiScoreBuyThreshold - 5);
      this.thresholds.aiScoreSellThreshold = Math.min(50, this.thresholds.aiScoreSellThreshold + 5);
      console.log(`✅ AI trading range widened: BUY>${this.thresholds.aiScoreBuyThreshold}, SELL<${this.thresholds.aiScoreSellThreshold}`);
    }
    
    // If win rate is high, increase position sizes
    if (this.thresholds.currentWinRate > 70 && this.thresholds.totalTrades > 10) {
      this.thresholds.positionSizeMultiplier = Math.min(3, this.thresholds.positionSizeMultiplier * 1.1);
      console.log(`✅ High win rate! Position size multiplier increased to ${this.thresholds.positionSizeMultiplier.toFixed(2)}x`);
    }
    
    // If win rate is low, tighten thresholds
    if (this.thresholds.currentWinRate < 40 && this.thresholds.totalTrades > 10) {
      this.thresholds.minAIConfidence = Math.min(0.8, this.thresholds.minAIConfidence * 1.1);
      this.thresholds.aiScoreBuyThreshold = Math.min(80, this.thresholds.aiScoreBuyThreshold + 2);
      this.thresholds.aiScoreSellThreshold = Math.max(20, this.thresholds.aiScoreSellThreshold - 2);
      console.log('📈 Low win rate - tightening thresholds for better quality trades');
    }
    
    // Save updated thresholds
    this.thresholds.lastAdjustment = new Date();
    this.thresholds.adjustmentCount++;
    this.saveThresholds();
    
    console.log('🎯 Current Adaptive Thresholds:', {
      aiConfidence: `${(this.thresholds.minAIConfidence * 100).toFixed(1)}%`,
      marketConfidence: `${(this.thresholds.minMarketConfidence * 100).toFixed(1)}%`,
      buyThreshold: this.thresholds.aiScoreBuyThreshold,
      sellThreshold: this.thresholds.aiScoreSellThreshold,
      winRate: `${this.thresholds.currentWinRate.toFixed(1)}%`,
      adjustments: this.thresholds.adjustmentCount
    });
  }
  
  /**
   * Start adaptive learning loop
   */
  private startAdaptiveLearning(): void {
    // Check performance every 5 minutes and auto-adjust
    setInterval(() => {
      this.analyzeAndOptimize();
    }, 5 * 60 * 1000);
    
    console.log('🚀 Stratus Adaptive Learning Engine started!');
    console.log('📊 AI will automatically adjust thresholds based on performance');
  }
  
  /**
   * Periodic optimization check
   */
  private async analyzeAndOptimize(): Promise<void> {
    const recentHistory = this.performanceHistory.slice(-50);
    if (recentHistory.length < 10) return; // Need enough data
    
    const blockedTrades = recentHistory.filter(t => !t.executed).length;
    const executedTrades = recentHistory.filter(t => t.executed).length;
    const blockRate = blockedTrades / recentHistory.length;
    
    console.log(`📊 Periodic Analysis: ${executedTrades} executed, ${blockedTrades} blocked (${(blockRate * 100).toFixed(1)}% block rate)`);
    
    // If blocking too many trades, aggressively lower thresholds
    if (blockRate > 0.7) {
      console.log('⚠️ Block rate too high! AI aggressively lowering thresholds...');
      this.thresholds.minAIConfidence *= 0.7;
      this.thresholds.minMarketConfidence *= 0.7;
      this.thresholds.aiScoreBuyThreshold -= 10;
      this.thresholds.aiScoreSellThreshold += 10;
      this.thresholds.enableTimeRestrictions = false;
      this.saveThresholds();
    }
    
    // If not enough trades, slightly lower thresholds
    if (executedTrades < 5) {
      console.log('📉 Not enough trades - AI loosening thresholds...');
      this.thresholds.minAIConfidence *= 0.95;
      this.thresholds.minMarketConfidence *= 0.95;
      this.saveThresholds();
    }
  }
  
  /**
   * Force aggressive mode for testing
   */
  enableAggressiveMode(): void {
    console.log('🔥 AGGRESSIVE MODE ENABLED - AI will trade more frequently!');
    this.thresholds.minAIConfidence = 0.2;
    this.thresholds.minMarketConfidence = 0.3;
    this.thresholds.aiScoreBuyThreshold = 45;
    this.thresholds.aiScoreSellThreshold = 55;
    this.thresholds.enableTimeRestrictions = false;
    this.thresholds.minVolumeThreshold = 0;
    this.saveThresholds();
  }
  
  /**
   * Save thresholds to storage
   */
  private saveThresholds(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('stratusAdaptiveThresholds', JSON.stringify(this.thresholds));
    }
    // In production, save to database
  }
  
  /**
   * Load thresholds from storage
   */
  private loadThresholds(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stratusAdaptiveThresholds');
      if (saved) {
        try {
          const loaded = JSON.parse(saved);
          this.thresholds = { ...this.thresholds, ...loaded };
          console.log('📂 Loaded adaptive thresholds from previous session');
        } catch (error) {
          console.error('Failed to load thresholds:', error);
        }
      }
    }
  }
  
  /**
   * Get current stats for UI display
   */
  getStats(): any {
    return {
      thresholds: this.thresholds,
      recentPerformance: this.performanceHistory.slice(-20),
      isLearning: this.isLearning,
      recommendation: this.getRecommendation()
    };
  }
  
  private getRecommendation(): string {
    if (this.thresholds.totalTrades < 10) {
      return 'Gathering data - AI needs more trades to optimize';
    }
    if (this.thresholds.currentWinRate > 80) {
      return 'Excellent performance! AI will increase position sizes';
    }
    if (this.thresholds.currentWinRate < 40) {
      return 'AI is tightening thresholds to improve quality';
    }
    return 'AI is actively optimizing for better performance';
  }
}

// Export singleton instance
export const adaptiveThresholdManager = AdaptiveThresholdManager.getInstance();

// Helper function to check if trade should execute with adaptive thresholds
export function shouldExecuteWithAdaptiveThresholds(
  aiConfidence: number,
  marketConfidence: number,
  aiScore: number,
  action: string
): { execute: boolean; reason?: string } {
  const thresholds = adaptiveThresholdManager.getThresholds();
  
  // Check AI confidence
  if (aiConfidence < thresholds.minAIConfidence) {
    return { 
      execute: false, 
      reason: `AI confidence too low: ${(aiConfidence * 100).toFixed(1)}% < ${(thresholds.minAIConfidence * 100).toFixed(1)}%` 
    };
  }
  
  // Check market confidence
  if (marketConfidence < thresholds.minMarketConfidence) {
    return { 
      execute: false, 
      reason: `Market confidence too low: ${(marketConfidence * 100).toFixed(1)}% < ${(thresholds.minMarketConfidence * 100).toFixed(1)}%` 
    };
  }
  
  // Check AI score thresholds for buy/sell decision
  if (action === 'buy' && aiScore < thresholds.aiScoreBuyThreshold) {
    return { 
      execute: false, 
      reason: `AI score too low for BUY: ${aiScore} < ${thresholds.aiScoreBuyThreshold}` 
    };
  }
  
  if (action === 'sell' && aiScore > thresholds.aiScoreSellThreshold) {
    return { 
      execute: false, 
      reason: `AI score too high for SELL: ${aiScore} > ${thresholds.aiScoreSellThreshold}` 
    };
  }
  
  return { execute: true };
}

export default AdaptiveThresholdManager;