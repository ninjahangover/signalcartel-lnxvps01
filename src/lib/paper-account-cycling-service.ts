/**
 * Paper Account Cycling Service
 * 
 * Manages automated cycling of paper trading accounts to provide
 * fresh testing environments and maintain historical performance data
 */

import { alpacaPaperTradingService } from './alpaca-paper-trading-service';
import type { AlpacaPaperAccount } from './alpaca-paper-trading-service';

export interface CyclingConfig {
  // Time-based cycling
  maxAccountAge: number; // hours
  dailyResetTime?: string; // "09:30" for market open
  weeklyResetDay?: number; // 0 = Sunday, 1 = Monday, etc.
  
  // Performance-based cycling
  maxTrades?: number; // Cycle after X trades
  maxDrawdown?: number; // Cycle if drawdown exceeds X%
  minWinRate?: number; // Cycle if win rate falls below X%
  
  // User behavior cycling
  maxInactivityHours?: number; // Cycle if no activity for X hours
  resetOnUserRequest?: boolean;
  
  // Account limits
  maxConcurrentAccounts?: number; // Per user
  preserveHistoryDays?: number; // How long to keep archived data
}

export interface CyclingTrigger {
  type: 'time' | 'performance' | 'inactivity' | 'user_request' | 'system';
  reason: string;
  timestamp: Date;
  previousAccountId?: string;
  newAccountId?: string;
  performanceSnapshot?: any;
}

export interface PerformanceSnapshot {
  accountId: string;
  startDate: Date;
  endDate: Date;
  initialBalance: number;
  finalBalance: number;
  totalTrades: number;
  winningTrades: number;
  winRate: number;
  totalPnL: number;
  maxDrawdown: number;
  sharpeRatio?: number;
  topSymbols: string[];
  tradingDays: number;
}

class PaperAccountCyclingService {
  private static instance: PaperAccountCyclingService;
  private cyclingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private userConfigs: Map<string, CyclingConfig> = new Map();
  
  // Default configuration
  private defaultConfig: CyclingConfig = {
    maxAccountAge: 24 * 7, // 7 days
    dailyResetTime: "09:30", // Market open
    maxTrades: 1000,
    maxDrawdown: 50, // 50%
    minWinRate: 20, // 20%
    maxInactivityHours: 72, // 3 days
    resetOnUserRequest: true,
    maxConcurrentAccounts: 3,
    preserveHistoryDays: 90
  };

  private constructor() {
    this.startGlobalCyclingScheduler();
  }

  static getInstance(): PaperAccountCyclingService {
    if (!PaperAccountCyclingService.instance) {
      PaperAccountCyclingService.instance = new PaperAccountCyclingService();
    }
    return PaperAccountCyclingService.instance;
  }

  /**
   * Set cycling configuration for a user
   */
  setUserConfig(userId: string, config: Partial<CyclingConfig>): void {
    const fullConfig = { ...this.defaultConfig, ...config };
    this.userConfigs.set(userId, fullConfig);
    
    // Restart monitoring for this user
    this.stopUserMonitoring(userId);
    this.startUserMonitoring(userId);
    
    console.log('📋 Updated cycling config for user:', userId, fullConfig);
  }

  /**
   * Get cycling configuration for a user
   */
  getUserConfig(userId: string): CyclingConfig {
    return this.userConfigs.get(userId) || this.defaultConfig;
  }

  /**
   * Start monitoring a user's account for cycling triggers
   */
  async startUserMonitoring(userId: string): Promise<void> {
    const config = this.getUserConfig(userId);
    
    // Set up periodic checks every hour
    const intervalId = setInterval(async () => {
      try {
        await this.checkCyclingTriggers(userId);
      } catch (error) {
        console.error(`❌ Error checking cycling triggers for user ${userId}:`, error);
      }
    }, 60 * 60 * 1000); // 1 hour
    
    this.cyclingIntervals.set(userId, intervalId);
    
    console.log('👀 Started monitoring account cycling for user:', userId);
  }

  /**
   * Stop monitoring a user's account
   */
  stopUserMonitoring(userId: string): void {
    const intervalId = this.cyclingIntervals.get(userId);
    if (intervalId) {
      clearInterval(intervalId);
      this.cyclingIntervals.delete(userId);
      console.log('⏹️ Stopped monitoring account cycling for user:', userId);
    }
  }

  /**
   * Check if any cycling triggers are met for a user
   */
  async checkCyclingTriggers(userId: string): Promise<CyclingTrigger | null> {
    const config = this.getUserConfig(userId);
    
    try {
      // Get current paper account for user (would fetch from database)
      const currentAccount = await this.getCurrentPaperAccount(userId);
      if (!currentAccount) {
        console.log('ℹ️ No active paper account found for user:', userId);
        return null;
      }

      // Check time-based triggers
      const timeCheck = this.checkTimeTriggers(currentAccount, config);
      if (timeCheck) {
        await this.cycleAccount(userId, timeCheck);
        return timeCheck;
      }

      // Check performance-based triggers
      const performanceCheck = await this.checkPerformanceTriggers(currentAccount, config);
      if (performanceCheck) {
        await this.cycleAccount(userId, performanceCheck);
        return performanceCheck;
      }

      // Check inactivity triggers
      const inactivityCheck = await this.checkInactivityTriggers(currentAccount, config);
      if (inactivityCheck) {
        await this.cycleAccount(userId, inactivityCheck);
        return inactivityCheck;
      }

      return null;

    } catch (error) {
      console.error('❌ Error checking cycling triggers:', error);
      return null;
    }
  }

  /**
   * Check time-based cycling triggers
   */
  private checkTimeTriggers(account: AlpacaPaperAccount, config: CyclingConfig): CyclingTrigger | null {
    const now = new Date();
    const accountAge = (now.getTime() - account.createdAt.getTime()) / (1000 * 60 * 60); // hours

    // Check maximum age
    if (accountAge >= config.maxAccountAge) {
      return {
        type: 'time',
        reason: `Account has reached maximum age of ${config.maxAccountAge} hours`,
        timestamp: now,
        previousAccountId: account.id
      };
    }

    // Check daily reset time
    if (config.dailyResetTime) {
      const [hour, minute] = config.dailyResetTime.split(':').map(Number);
      const resetTime = new Date(now);
      resetTime.setHours(hour, minute, 0, 0);
      
      // If it's past reset time today and account was created before reset time
      if (now >= resetTime && account.createdAt < resetTime) {
        return {
          type: 'time',
          reason: `Daily reset at ${config.dailyResetTime}`,
          timestamp: now,
          previousAccountId: account.id
        };
      }
    }

    // Check weekly reset
    if (config.weeklyResetDay !== undefined) {
      const daysSinceReset = this.getDaysSinceWeekday(now, config.weeklyResetDay);
      const accountDays = (now.getTime() - account.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceReset === 0 && accountDays >= 1) {
        return {
          type: 'time',
          reason: `Weekly reset on day ${config.weeklyResetDay}`,
          timestamp: now,
          previousAccountId: account.id
        };
      }
    }

    return null;
  }

  /**
   * Check performance-based cycling triggers
   */
  private async checkPerformanceTriggers(account: AlpacaPaperAccount, config: CyclingConfig): Promise<CyclingTrigger | null> {
    // Get account performance metrics (would fetch from database)
    const performance = await this.getAccountPerformance(account.id);
    if (!performance) return null;

    const now = new Date();

    // Check maximum trades
    if (config.maxTrades && performance.totalTrades >= config.maxTrades) {
      return {
        type: 'performance',
        reason: `Reached maximum trades limit of ${config.maxTrades}`,
        timestamp: now,
        previousAccountId: account.id,
        performanceSnapshot: performance
      };
    }

    // Check maximum drawdown
    if (config.maxDrawdown && performance.maxDrawdown >= config.maxDrawdown) {
      return {
        type: 'performance',
        reason: `Maximum drawdown of ${performance.maxDrawdown}% exceeded limit of ${config.maxDrawdown}%`,
        timestamp: now,
        previousAccountId: account.id,
        performanceSnapshot: performance
      };
    }

    // Check minimum win rate (only if enough trades)
    if (config.minWinRate && performance.totalTrades >= 20 && performance.winRate < config.minWinRate) {
      return {
        type: 'performance',
        reason: `Win rate of ${performance.winRate}% below minimum of ${config.minWinRate}%`,
        timestamp: now,
        previousAccountId: account.id,
        performanceSnapshot: performance
      };
    }

    return null;
  }

  /**
   * Check inactivity-based cycling triggers
   */
  private async checkInactivityTriggers(account: AlpacaPaperAccount, config: CyclingConfig): Promise<CyclingTrigger | null> {
    if (!config.maxInactivityHours) return null;

    // Get last activity timestamp (would fetch from database)
    const lastActivity = await this.getLastActivityTime(account.id);
    if (!lastActivity) return null;

    const now = new Date();
    const inactiveHours = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

    if (inactiveHours >= config.maxInactivityHours) {
      return {
        type: 'inactivity',
        reason: `No activity for ${Math.round(inactiveHours)} hours (limit: ${config.maxInactivityHours})`,
        timestamp: now,
        previousAccountId: account.id
      };
    }

    return null;
  }

  /**
   * Cycle to a new paper trading account
   */
  async cycleAccount(userId: string, trigger: CyclingTrigger): Promise<AlpacaPaperAccount | null> {
    try {
      console.log('🔄 Cycling paper trading account:', {
        userId,
        trigger: trigger.type,
        reason: trigger.reason
      });

      // Archive current account performance
      if (trigger.previousAccountId) {
        await this.archiveAccountPerformance(trigger.previousAccountId, trigger);
      }

      // Create new paper trading account
      const newAccount = await alpacaPaperTradingService.cycleAccount(userId);
      if (!newAccount) {
        throw new Error('Failed to create new paper trading account');
      }

      // Update trigger with new account ID
      trigger.newAccountId = newAccount.id;

      // Save cycling event to database
      await this.saveCyclingEvent(userId, trigger);

      // Send notification to user
      await this.notifyUserOfCycle(userId, trigger, newAccount);

      console.log('✅ Successfully cycled to new paper trading account:', {
        oldAccountId: trigger.previousAccountId,
        newAccountId: newAccount.id,
        newBalance: `$${newAccount.currentBalance.toLocaleString()}`
      });

      return newAccount;

    } catch (error) {
      console.error('❌ Failed to cycle paper trading account:', error);
      return null;
    }
  }

  /**
   * Manually trigger account cycling (user request)
   */
  async manualCycle(userId: string, reason: string = 'User requested reset'): Promise<AlpacaPaperAccount | null> {
    const config = this.getUserConfig(userId);
    
    if (!config.resetOnUserRequest) {
      throw new Error('Manual resets are disabled for this user');
    }

    const trigger: CyclingTrigger = {
      type: 'user_request',
      reason,
      timestamp: new Date()
    };

    return this.cycleAccount(userId, trigger);
  }

  /**
   * Get historical performance snapshots for a user
   */
  async getPerformanceHistory(userId: string, limit: number = 10): Promise<PerformanceSnapshot[]> {
    // Would fetch from database
    // For now, return empty array
    return [];
  }

  /**
   * Start global cycling scheduler
   */
  private startGlobalCyclingScheduler(): void {
    // Check for cycling triggers every hour for all active users
    setInterval(async () => {
      try {
        const activeUsers = await this.getActiveUsers();
        for (const userId of activeUsers) {
          if (!this.cyclingIntervals.has(userId)) {
            await this.startUserMonitoring(userId);
          }
        }
      } catch (error) {
        console.error('❌ Error in global cycling scheduler:', error);
      }
    }, 60 * 60 * 1000); // 1 hour

    console.log('⏰ Global cycling scheduler started');
  }

  // Helper methods (would integrate with database)
  private async getCurrentPaperAccount(userId: string): Promise<AlpacaPaperAccount | null> {
    // Would fetch from database
    return null;
  }

  private async getAccountPerformance(accountId: string): Promise<PerformanceSnapshot | null> {
    // Would fetch from database
    return null;
  }

  private async getLastActivityTime(accountId: string): Promise<Date | null> {
    // Would fetch from database
    return null;
  }

  private async archiveAccountPerformance(accountId: string, trigger: CyclingTrigger): Promise<void> {
    // Would save to database
    console.log('📁 Archiving account performance:', accountId);
  }

  private async saveCyclingEvent(userId: string, trigger: CyclingTrigger): Promise<void> {
    // Would save to database
    console.log('💾 Saving cycling event:', { userId, trigger: trigger.type, reason: trigger.reason });
  }

  private async notifyUserOfCycle(userId: string, trigger: CyclingTrigger, newAccount: AlpacaPaperAccount): Promise<void> {
    // Would send notification (email, in-app, etc.)
    console.log('📧 Notifying user of account cycle:', {
      userId,
      reason: trigger.reason,
      newBalance: `$${newAccount.currentBalance.toLocaleString()}`
    });
  }

  private async getActiveUsers(): Promise<string[]> {
    // Would fetch from database
    return [];
  }

  private getDaysSinceWeekday(date: Date, targetWeekday: number): number {
    const currentWeekday = date.getDay();
    let daysSince = currentWeekday - targetWeekday;
    if (daysSince < 0) daysSince += 7;
    return daysSince;
  }

  /**
   * Get cycling statistics for a user
   */
  async getCyclingStats(userId: string): Promise<{
    totalCycles: number;
    avgAccountDuration: number; // hours
    cycleTriggers: Record<string, number>;
    bestPerformance: PerformanceSnapshot | null;
    worstPerformance: PerformanceSnapshot | null;
  }> {
    // Would fetch from database
    return {
      totalCycles: 0,
      avgAccountDuration: 0,
      cycleTriggers: {},
      bestPerformance: null,
      worstPerformance: null
    };
  }

  /**
   * Clean up expired performance data
   */
  async cleanupExpiredData(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.defaultConfig.preserveHistoryDays!);
    
    // Would delete from database where createdAt < cutoffDate
    console.log('🗑️ Cleaning up performance data older than:', cutoffDate);
  }
}

// Export singleton instance
export const paperAccountCyclingService = PaperAccountCyclingService.getInstance();

export default PaperAccountCyclingService;