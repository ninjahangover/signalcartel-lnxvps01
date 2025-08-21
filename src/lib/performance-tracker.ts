import AlertGenerationEngine, { VariableChange, GeneratedAlert } from './alert-generation-engine';
import StrategyManager, { Strategy } from './strategy-manager';

interface PerformanceMetrics {
  strategyId: string;
  timeWindow: string;
  totalAlerts: number;
  executedTrades: number;
  winRate: number;
  avgReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  profitFactor: number;
  timestamp: Date;
}

interface VariableEffectiveness {
  strategyId: string;
  variableName: string;
  currentValue: any;
  effectiveness: number; // -1 to 1, where 1 is most effective
  sampleSize: number;
  lastEvaluated: Date;
  recommendedAction: 'increase' | 'decrease' | 'maintain' | 'optimize';
  recommendedValue?: any;
}

interface AutoAdjustmentRule {
  strategyId: string;
  variableName: string;
  condition: {
    metric: 'winRate' | 'avgReturn' | 'sharpeRatio';
    threshold: number;
    comparison: 'below' | 'above';
  };
  adjustment: {
    action: 'increase' | 'decrease' | 'set';
    amount: number | any;
    maxAdjustment?: number;
  };
  enabled: boolean;
  lastTriggered?: Date;
}

class PerformanceTracker {
  private static instance: PerformanceTracker;
  private performanceHistory: PerformanceMetrics[] = [];
  private variableEffectiveness: Map<string, VariableEffectiveness[]> = new Map();
  private autoAdjustmentRules: Map<string, AutoAdjustmentRule[]> = new Map();
  private listeners: Set<() => void> = new Set();
  private trackingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeDefaultRules();
  }

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  // Start performance tracking
  startTracking(intervalMinutes: number = 5): void {
    if (this.trackingInterval) return;

    this.trackingInterval = setInterval(() => {
      this.evaluateAllStrategies();
    }, intervalMinutes * 60 * 1000);

    console.log(`📊 Performance tracking started (interval: ${intervalMinutes} minutes)`);
  }

  stopTracking(): void {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
      console.log('📊 Performance tracking stopped');
    }
  }

  // Evaluate all active strategies
  private async evaluateAllStrategies(): Promise<void> {
    const strategyManager = StrategyManager.getInstance();
    const alertEngine = AlertGenerationEngine.getInstance();
    const strategies = strategyManager.getStrategies();

    for (const strategy of strategies) {
      if (strategy.status === 'active') {
        await this.evaluateStrategy(strategy);
      }
    }

    this.notifyListeners();
  }

  // Evaluate single strategy performance
  async evaluateStrategy(strategy: Strategy): Promise<PerformanceMetrics> {
    const alertEngine = AlertGenerationEngine.getInstance();
    const alertStats = alertEngine.getAlertStats(strategy.id);
    const recentAlerts = alertStats.recentAlerts.filter(
      alert => alert.timestamp.getTime() > Date.now() - (24 * 60 * 60 * 1000) // Last 24 hours
    );

    // Calculate performance metrics
    const metrics: PerformanceMetrics = {
      strategyId: strategy.id,
      timeWindow: '24h',
      totalAlerts: recentAlerts.length,
      executedTrades: recentAlerts.filter(a => a.executionStatus === 'sent').length,
      winRate: this.calculateWinRate(recentAlerts),
      avgReturn: this.calculateAverageReturn(recentAlerts),
      sharpeRatio: this.calculateSharpeRatio(recentAlerts),
      maxDrawdown: this.calculateMaxDrawdown(recentAlerts),
      profitFactor: this.calculateProfitFactor(recentAlerts),
      timestamp: new Date()
    };

    // Store metrics
    this.performanceHistory.push(metrics);
    
    // Keep only last 100 performance records per strategy
    const strategyMetrics = this.performanceHistory.filter(m => m.strategyId === strategy.id);
    if (strategyMetrics.length > 100) {
      const toRemove = strategyMetrics.slice(0, strategyMetrics.length - 100);
      this.performanceHistory = this.performanceHistory.filter(m => !toRemove.includes(m));
    }

    // Evaluate variable effectiveness
    await this.evaluateVariableEffectiveness(strategy, metrics);

    // Check auto-adjustment rules
    await this.checkAutoAdjustmentRules(strategy, metrics);

    console.log(`📈 Performance evaluated for ${strategy.name}: Win Rate ${(metrics.winRate * 100).toFixed(1)}%, Avg Return ${metrics.avgReturn.toFixed(2)}%`);

    return metrics;
  }

  // Evaluate how effective each variable is
  private async evaluateVariableEffectiveness(strategy: Strategy, currentMetrics: PerformanceMetrics): Promise<void> {
    const alertEngine = AlertGenerationEngine.getInstance();
    const variableChanges = alertEngine.getVariableChangeHistory(strategy.id);
    
    if (!this.variableEffectiveness.has(strategy.id)) {
      this.variableEffectiveness.set(strategy.id, []);
    }

    const strategyEffectiveness = this.variableEffectiveness.get(strategy.id)!;

    // Analyze recent variable changes
    const recentChanges = variableChanges.filter(
      change => change.timestamp.getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000) // Last 7 days
    );

    for (const variableName of Object.keys(strategy.config)) {
      const variableChanges = recentChanges.filter(c => c.variableName === variableName);
      
      if (variableChanges.length > 0) {
        const effectiveness = this.calculateVariableEffectiveness(variableChanges, currentMetrics);
        
        let existing = strategyEffectiveness.find(ve => ve.variableName === variableName);
        if (!existing) {
          existing = {
            strategyId: strategy.id,
            variableName,
            currentValue: strategy.config[variableName],
            effectiveness: 0,
            sampleSize: 0,
            lastEvaluated: new Date(),
            recommendedAction: 'maintain'
          };
          strategyEffectiveness.push(existing);
        }

        existing.effectiveness = effectiveness.score;
        existing.sampleSize = variableChanges.length;
        existing.lastEvaluated = new Date();
        existing.recommendedAction = effectiveness.recommendedAction;
        existing.recommendedValue = effectiveness.recommendedValue;
        existing.currentValue = strategy.config[variableName];
      }
    }
  }

  // Calculate variable effectiveness score
  private calculateVariableEffectiveness(changes: VariableChange[], currentMetrics: PerformanceMetrics): {
    score: number;
    recommendedAction: 'increase' | 'decrease' | 'maintain' | 'optimize';
    recommendedValue?: any;
  } {
    if (changes.length === 0) return { score: 0, recommendedAction: 'maintain' };

    let totalImpact = 0;
    let positiveChanges = 0;
    let negativeChanges = 0;

    for (const change of changes) {
      if (change.performanceAfterChange !== undefined && change.performanceBeforeChange !== undefined) {
        const impact = change.performanceAfterChange - change.performanceBeforeChange;
        totalImpact += impact;
        
        if (impact > 0.01) { // 1% improvement threshold
          positiveChanges++;
        } else if (impact < -0.01) { // 1% degradation threshold
          negativeChanges++;
        }
      }
    }

    const avgImpact = totalImpact / changes.length;
    const effectiveness = Math.max(-1, Math.min(1, avgImpact * 10)); // Scale to -1 to 1

    // Determine recommended action
    let recommendedAction: 'increase' | 'decrease' | 'maintain' | 'optimize';
    let recommendedValue: any;

    if (effectiveness > 0.3 && positiveChanges > negativeChanges) {
      recommendedAction = 'optimize';
      // Find the most successful change
      const bestChange = changes.reduce((best, current) => {
        const bestImpact = best.performanceAfterChange! - best.performanceBeforeChange!;
        const currentImpact = current.performanceAfterChange! - current.performanceBeforeChange!;
        return currentImpact > bestImpact ? current : best;
      });
      recommendedValue = bestChange.newValue;
    } else if (effectiveness > 0.1) {
      recommendedAction = 'maintain';
    } else if (effectiveness < -0.1) {
      recommendedAction = 'optimize';
    } else {
      recommendedAction = 'maintain';
    }

    return { score: effectiveness, recommendedAction, recommendedValue };
  }

  // Check and execute auto-adjustment rules
  private async checkAutoAdjustmentRules(strategy: Strategy, metrics: PerformanceMetrics): Promise<void> {
    const rules = this.autoAdjustmentRules.get(strategy.id) || [];
    const alertEngine = AlertGenerationEngine.getInstance();

    for (const rule of rules) {
      if (!rule.enabled) continue;

      // Check if rule should be triggered
      const shouldTrigger = this.evaluateRuleCondition(rule, metrics);
      
      if (shouldTrigger) {
        // Avoid triggering too frequently
        const cooldownPeriod = 60 * 60 * 1000; // 1 hour
        if (rule.lastTriggered && Date.now() - rule.lastTriggered.getTime() < cooldownPeriod) {
          continue;
        }

        const currentValue = strategy.config[rule.variableName];
        let newValue = this.calculateNewValue(rule, currentValue);

        // Apply adjustment limits
        if (rule.adjustment.maxAdjustment !== undefined) {
          const maxChange = Math.abs(currentValue * rule.adjustment.maxAdjustment);
          const actualChange = Math.abs(newValue - currentValue);
          
          if (actualChange > maxChange) {
            if (newValue > currentValue) {
              newValue = currentValue + maxChange;
            } else {
              newValue = currentValue - maxChange;
            }
          }
        }

        if (newValue !== currentValue) {
          // Apply the adjustment
          alertEngine.updateStrategyVariables(
            strategy.id,
            { [rule.variableName]: newValue },
            `Auto-adjustment: ${rule.condition.metric} ${rule.condition.comparison} ${rule.condition.threshold}`
          );

          rule.lastTriggered = new Date();

          console.log(`🤖 Auto-adjustment triggered for ${strategy.name}: ${rule.variableName} ${currentValue} → ${newValue}`);
        }
      }
    }
  }

  // Evaluate if rule condition is met
  private evaluateRuleCondition(rule: AutoAdjustmentRule, metrics: PerformanceMetrics): boolean {
    let metricValue: number;

    switch (rule.condition.metric) {
      case 'winRate':
        metricValue = metrics.winRate;
        break;
      case 'avgReturn':
        metricValue = metrics.avgReturn;
        break;
      case 'sharpeRatio':
        metricValue = metrics.sharpeRatio;
        break;
      default:
        return false;
    }

    if (rule.condition.comparison === 'below') {
      return metricValue < rule.condition.threshold;
    } else {
      return metricValue > rule.condition.threshold;
    }
  }

  // Calculate new value based on adjustment rule
  private calculateNewValue(rule: AutoAdjustmentRule, currentValue: any): any {
    switch (rule.adjustment.action) {
      case 'increase':
        if (typeof currentValue === 'number') {
          return currentValue + rule.adjustment.amount;
        }
        break;
      case 'decrease':
        if (typeof currentValue === 'number') {
          return currentValue - rule.adjustment.amount;
        }
        break;
      case 'set':
        return rule.adjustment.amount;
    }
    return currentValue;
  }

  // Initialize default auto-adjustment rules
  private initializeDefaultRules(): void {
    // These rules will be applied to all RSI strategies by default
    const defaultRules: AutoAdjustmentRule[] = [
      {
        strategyId: '', // Will be set per strategy
        variableName: 'oversoldLevel',
        condition: {
          metric: 'winRate',
          threshold: 0.5, // 50%
          comparison: 'below'
        },
        adjustment: {
          action: 'decrease',
          amount: 2,
          maxAdjustment: 0.2 // Max 20% change
        },
        enabled: true
      },
      {
        strategyId: '',
        variableName: 'overboughtLevel',
        condition: {
          metric: 'winRate',
          threshold: 0.5,
          comparison: 'below'
        },
        adjustment: {
          action: 'increase',
          amount: 2,
          maxAdjustment: 0.2
        },
        enabled: true
      }
    ];

    // Apply default rules to all strategies
    const strategyManager = StrategyManager.getInstance();
    const strategies = strategyManager.getStrategies();

    for (const strategy of strategies) {
      if (strategy.type === 'RSI_PULLBACK') {
        const strategyRules = defaultRules.map(rule => ({
          ...rule,
          strategyId: strategy.id
        }));
        this.autoAdjustmentRules.set(strategy.id, strategyRules);
      }
    }
  }

  // Add custom auto-adjustment rule
  addAutoAdjustmentRule(strategyId: string, rule: Omit<AutoAdjustmentRule, 'strategyId'>): void {
    const rules = this.autoAdjustmentRules.get(strategyId) || [];
    rules.push({ ...rule, strategyId });
    this.autoAdjustmentRules.set(strategyId, rules);
    
    console.log(`📋 Auto-adjustment rule added for strategy ${strategyId}: ${rule.variableName}`);
    this.notifyListeners();
  }

  // Performance calculation helpers
  private calculateWinRate(alerts: GeneratedAlert[]): number {
    // Simplified calculation - in production, track actual trade outcomes
    const executedAlerts = alerts.filter(a => a.executionStatus === 'sent');
    if (executedAlerts.length === 0) return 0;
    
    // Simulate win rate based on confidence levels
    const avgConfidence = executedAlerts.reduce((sum, a) => sum + a.confidence, 0) / executedAlerts.length;
    return Math.min(1, avgConfidence / 100);
  }

  private calculateAverageReturn(alerts: GeneratedAlert[]): number {
    // Simplified calculation based on alert quality
    const executedAlerts = alerts.filter(a => a.executionStatus === 'sent');
    if (executedAlerts.length === 0) return 0;
    
    return executedAlerts.reduce((sum, a) => sum + (a.confidence - 50) / 10, 0) / executedAlerts.length;
  }

  private calculateSharpeRatio(alerts: GeneratedAlert[]): number {
    const returns = alerts.map(a => (a.confidence - 50) / 10);
    if (returns.length === 0) return 0;
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev === 0 ? 0 : avgReturn / stdDev;
  }

  private calculateMaxDrawdown(alerts: GeneratedAlert[]): number {
    // Simplified drawdown calculation
    let peak = 0;
    let maxDrawdown = 0;
    let running = 0;
    
    for (const alert of alerts) {
      running += (alert.confidence - 50) / 10;
      peak = Math.max(peak, running);
      maxDrawdown = Math.min(maxDrawdown, (running - peak) / peak);
    }
    
    return Math.abs(maxDrawdown);
  }

  private calculateProfitFactor(alerts: GeneratedAlert[]): number {
    let profits = 0;
    let losses = 0;
    
    for (const alert of alerts) {
      const return_ = (alert.confidence - 50) / 10;
      if (return_ > 0) {
        profits += return_;
      } else {
        losses += Math.abs(return_);
      }
    }
    
    return losses === 0 ? profits : profits / losses;
  }

  // API methods
  getPerformanceHistory(strategyId?: string): PerformanceMetrics[] {
    if (strategyId) {
      return this.performanceHistory.filter(m => m.strategyId === strategyId);
    }
    return [...this.performanceHistory];
  }

  getVariableEffectiveness(strategyId: string): VariableEffectiveness[] {
    return this.variableEffectiveness.get(strategyId) || [];
  }

  getAutoAdjustmentRules(strategyId: string): AutoAdjustmentRule[] {
    return this.autoAdjustmentRules.get(strategyId) || [];
  }

  toggleAutoAdjustmentRule(strategyId: string, variableName: string, enabled: boolean): void {
    const rules = this.autoAdjustmentRules.get(strategyId) || [];
    const rule = rules.find(r => r.variableName === variableName);
    if (rule) {
      rule.enabled = enabled;
      console.log(`🔄 Auto-adjustment rule ${enabled ? 'enabled' : 'disabled'} for ${strategyId}.${variableName}`);
      this.notifyListeners();
    }
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback());
  }
}

export default PerformanceTracker;
export type { PerformanceMetrics, VariableEffectiveness, AutoAdjustmentRule };