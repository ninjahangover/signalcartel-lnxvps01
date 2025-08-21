interface CleanTestingSession {
  id: string;
  strategyName: string;
  startTime: Date;
  endTime?: Date;
  positionsClosed: boolean;
  closedPositionsCount: number;
  totalClosedValue?: number;
  status: 'active' | 'completed' | 'failed';
  metrics: {
    trades: number;
    wins: number;
    losses: number;
    totalProfit: number;
    winRate: number;
    maxDrawdown: number;
    avgProfitPerTrade: number;
    sharpeRatio?: number;
    profitFactor?: number;
  };
  trades: Array<{
    id: string;
    timestamp: Date;
    pair: string;
    side: 'buy' | 'sell';
    quantity: number;
    price: number;
    profit?: number;
    isWin?: boolean;
  }>;
}

interface CleanTestingStore {
  activeSessions: Map<string, CleanTestingSession>;
  completedSessions: CleanTestingSession[];
  totalSessions: number;
}

class CleanTestingService {
  private store: CleanTestingStore = {
    activeSessions: new Map(),
    completedSessions: [],
    totalSessions: 0
  };

  // Start a new clean testing session
  startCleanTestingSession(
    strategyName: string,
    positionsClosed: boolean,
    closedPositionsCount: number = 0,
    totalClosedValue: number = 0
  ): string {
    const sessionId = `clean_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: CleanTestingSession = {
      id: sessionId,
      strategyName,
      startTime: new Date(),
      positionsClosed,
      closedPositionsCount,
      totalClosedValue,
      status: 'active',
      metrics: {
        trades: 0,
        wins: 0,
        losses: 0,
        totalProfit: 0,
        winRate: 0,
        maxDrawdown: 0,
        avgProfitPerTrade: 0
      },
      trades: []
    };

    this.store.activeSessions.set(sessionId, session);
    this.store.totalSessions++;

    console.log(`🧹 Started clean testing session: ${sessionId}`, {
      strategy: strategyName,
      positionsClosed,
      closedPositionsCount,
      totalClosedValue
    });

    // Store in localStorage for persistence across page reloads
    if (typeof window !== 'undefined') {
      this.saveToLocalStorage();
    }

    return sessionId;
  }

  // Add a trade to an active testing session
  addTradeToSession(sessionId: string, trade: {
    pair: string;
    side: 'buy' | 'sell';
    quantity: number;
    price: number;
    profit?: number;
    isWin?: boolean;
  }): boolean {
    const session = this.store.activeSessions.get(sessionId);
    if (!session) {
      console.warn(`⚠️ Session not found: ${sessionId}`);
      return false;
    }

    const tradeWithId = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date(),
      ...trade
    };

    session.trades.push(tradeWithId);
    session.metrics.trades++;

    // Update metrics if profit is provided
    if (trade.profit !== undefined) {
      session.metrics.totalProfit += trade.profit;
      
      if (trade.isWin || trade.profit > 0) {
        session.metrics.wins++;
      } else {
        session.metrics.losses++;
      }

      // Recalculate derived metrics
      session.metrics.winRate = session.metrics.trades > 0 
        ? (session.metrics.wins / session.metrics.trades) * 100 
        : 0;
        
      session.metrics.avgProfitPerTrade = session.metrics.trades > 0
        ? session.metrics.totalProfit / session.metrics.trades
        : 0;

      // Update max drawdown (simplified calculation)
      const runningPnL = session.trades.reduce((sum, t) => sum + (t.profit || 0), 0);
      if (runningPnL < session.metrics.maxDrawdown) {
        session.metrics.maxDrawdown = runningPnL;
      }
    }

    console.log(`📊 Added trade to session ${sessionId}:`, tradeWithId);

    if (typeof window !== 'undefined') {
      this.saveToLocalStorage();
    }

    return true;
  }

  // Complete a testing session
  completeSession(sessionId: string, finalMetrics?: Partial<CleanTestingSession['metrics']>): boolean {
    const session = this.store.activeSessions.get(sessionId);
    if (!session) {
      console.warn(`⚠️ Session not found: ${sessionId}`);
      return false;
    }

    session.endTime = new Date();
    session.status = 'completed';

    // Update with final metrics if provided
    if (finalMetrics) {
      session.metrics = { ...session.metrics, ...finalMetrics };
    }

    // Calculate final derived metrics
    if (session.metrics.wins > 0 && session.metrics.losses > 0) {
      const avgWin = session.trades
        .filter(t => (t.profit || 0) > 0)
        .reduce((sum, t) => sum + (t.profit || 0), 0) / session.metrics.wins;
      
      const avgLoss = Math.abs(session.trades
        .filter(t => (t.profit || 0) <= 0)
        .reduce((sum, t) => sum + (t.profit || 0), 0) / session.metrics.losses);

      session.metrics.profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;
    }

    // Move to completed sessions
    this.store.completedSessions.push(session);
    this.store.activeSessions.delete(sessionId);

    const duration = session.endTime.getTime() - session.startTime.getTime();
    console.log(`✅ Completed clean testing session: ${sessionId}`, {
      duration: `${Math.round(duration / 1000 / 60)} minutes`,
      trades: session.metrics.trades,
      winRate: session.metrics.winRate.toFixed(1) + '%',
      totalProfit: session.metrics.totalProfit
    });

    if (typeof window !== 'undefined') {
      this.saveToLocalStorage();
    }

    return true;
  }

  // Get active session
  getActiveSession(sessionId: string): CleanTestingSession | null {
    return this.store.activeSessions.get(sessionId) || null;
  }

  // Get all active sessions
  getAllActiveSessions(): CleanTestingSession[] {
    return Array.from(this.store.activeSessions.values());
  }

  // Get completed sessions
  getCompletedSessions(limit?: number): CleanTestingSession[] {
    const sessions = this.store.completedSessions
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    
    return limit ? sessions.slice(0, limit) : sessions;
  }

  // Get session analytics
  getSessionAnalytics(sessionId: string) {
    const session = this.getActiveSession(sessionId) || 
      this.store.completedSessions.find(s => s.id === sessionId);
    
    if (!session) return null;

    const duration = (session.endTime || new Date()).getTime() - session.startTime.getTime();
    
    return {
      session,
      analytics: {
        duration: Math.round(duration / 1000 / 60), // minutes
        tradesPerHour: session.metrics.trades > 0 
          ? (session.metrics.trades / (duration / 1000 / 60 / 60)) 
          : 0,
        profitPerHour: duration > 0 
          ? (session.metrics.totalProfit / (duration / 1000 / 60 / 60))
          : 0,
        bestTrade: session.trades.reduce((best, trade) => 
          (trade.profit || 0) > (best?.profit || 0) ? trade : best, session.trades[0]),
        worstTrade: session.trades.reduce((worst, trade) => 
          (trade.profit || 0) < (worst?.profit || 0) ? trade : worst, session.trades[0]),
        consecutiveWins: this.calculateConsecutiveWins(session.trades),
        consecutiveLosses: this.calculateConsecutiveLosses(session.trades)
      }
    };
  }

  // Calculate consecutive wins
  private calculateConsecutiveWins(trades: CleanTestingSession['trades']): number {
    let maxWins = 0;
    let currentWins = 0;

    for (const trade of trades) {
      if (trade.profit && trade.profit > 0) {
        currentWins++;
        maxWins = Math.max(maxWins, currentWins);
      } else {
        currentWins = 0;
      }
    }

    return maxWins;
  }

  // Calculate consecutive losses
  private calculateConsecutiveLosses(trades: CleanTestingSession['trades']): number {
    let maxLosses = 0;
    let currentLosses = 0;

    for (const trade of trades) {
      if (trade.profit && trade.profit <= 0) {
        currentLosses++;
        maxLosses = Math.max(maxLosses, currentLosses);
      } else {
        currentLosses = 0;
      }
    }

    return maxLosses;
  }

  // Persistence methods
  private saveToLocalStorage(): void {
    try {
      const data = {
        activeSessions: Array.from(this.store.activeSessions.entries()),
        completedSessions: this.store.completedSessions,
        totalSessions: this.store.totalSessions
      };
      localStorage.setItem('cleanTestingStore', JSON.stringify(data, this.dateReplacer));
    } catch (error) {
      console.error('Failed to save clean testing store:', error);
    }
  }

  loadFromLocalStorage(): void {
    try {
      const data = localStorage.getItem('cleanTestingStore');
      if (data) {
        const parsed = JSON.parse(data, this.dateReviver);
        this.store.activeSessions = new Map(parsed.activeSessions || []);
        this.store.completedSessions = parsed.completedSessions || [];
        this.store.totalSessions = parsed.totalSessions || 0;
        
        console.log('📊 Loaded clean testing store from localStorage', {
          activeSessions: this.store.activeSessions.size,
          completedSessions: this.store.completedSessions.length
        });
      }
    } catch (error) {
      console.error('Failed to load clean testing store:', error);
    }
  }

  // JSON serialization helpers
  private dateReplacer(key: string, value: any): any {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }
    return value;
  }

  private dateReviver(key: string, value: any): any {
    if (value && typeof value === 'object' && value.__type === 'Date') {
      return new Date(value.value);
    }
    return value;
  }

  // Clear all data (for testing/development)
  clearAllData(): void {
    this.store = {
      activeSessions: new Map(),
      completedSessions: [],
      totalSessions: 0
    };
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cleanTestingStore');
    }
    
    console.log('🧹 Cleared all clean testing data');
  }
}

// Export singleton instance
export const cleanTestingService = new CleanTestingService();

// Export types
export type { CleanTestingSession, CleanTestingStore };