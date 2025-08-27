/**
 * Consolidated AI Data Service
 * Provides unified access to data from all SignalCartel sites for AI algorithms
 */

import { PrismaClient } from '@prisma/client';

interface ConsolidatedDataConfig {
  analyticsDbUrl: string;
  instanceId: string;
}

interface UnifiedTradeData {
  globalTradeId: string;
  symbol: string;
  strategy: string;
  pnl: number;
  winRate: number;
  confidence: number;
  aiSystemsUsed: string[];
  phase: number;
  marketConditions: any;
  siteOrigin: string;
}

interface CrossSiteInsight {
  type: 'pattern' | 'strategy' | 'market_condition' | 'ai_performance';
  title: string;
  description: string;
  confidence: number;
  sourceInstances: string[];
  dataPoints: number;
  applicableSymbols: string[];
}

export class ConsolidatedAIDataService {
  private analyticsDb: PrismaClient;
  private instanceId: string;

  constructor(config: ConsolidatedDataConfig) {
    this.analyticsDb = new PrismaClient({
      datasources: {
        db: { url: config.analyticsDbUrl }
      }
    });
    this.instanceId = config.instanceId;
  }

  /**
   * Get unified performance data across all sites for a specific strategy
   */
  async getUnifiedStrategyPerformance(strategyName: string, symbol?: string): Promise<any> {
    const whereClause = symbol 
      ? `WHERE strategy_name = '${strategyName}' AND symbol = '${symbol}'`
      : `WHERE strategy_name = '${strategyName}'`;
    
    return await this.analyticsDb.$queryRawUnsafe(`
      SELECT * FROM unified_position_performance ${whereClause}
    `);
  }

  /**
   * Get AI system performance comparison across all sites
   */
  async getAISystemComparison(aiSystem?: string): Promise<any> {
    const whereClause = aiSystem ? `WHERE ai_system_name = '${aiSystem}'` : '';
    
    return await this.analyticsDb.$queryRawUnsafe(`
      SELECT * FROM ai_system_comparison ${whereClause}
      ORDER BY global_win_rate DESC
    `);
  }

  /**
   * Get market condition insights from all sites
   */
  async getMarketConditionInsights(symbol: string): Promise<any> {
    return await this.analyticsDb.$queryRawUnsafe(`
      SELECT * FROM market_condition_insights 
      WHERE symbol = '${symbol}'
      ORDER BY trade_count DESC
    `);
  }

  /**
   * Get phase progression analysis across all sites
   */
  async getPhaseProgressionInsights(): Promise<any> {
    return await this.analyticsDb.$queryRawUnsafe(`
      SELECT * FROM phase_progression_analysis
      ORDER BY instance_id, phase_at_entry
    `);
  }

  /**
   * Get learning insights that can be applied to current trading
   */
  async getLearningInsights(
    insightType?: string, 
    symbol?: string, 
    minConfidence: number = 0.7
  ): Promise<CrossSiteInsight[]> {
    let whereClause = `WHERE confidence_level >= ${minConfidence}`;
    
    if (insightType) {
      whereClause += ` AND insight_type = '${insightType}'`;
    }
    
    if (symbol) {
      whereClause += ` AND '${symbol}' = ANY(applicable_symbols)`;
    }
    
    const insights = await this.analyticsDb.$queryRawUnsafe(`
      SELECT * FROM learning_insights 
      ${whereClause}
      ORDER BY confidence_level DESC, validation_score DESC
      LIMIT 50
    `);
    
    return insights as CrossSiteInsight[];
  }

  /**
   * Get best performing AI systems for a specific market condition
   */
  async getBestAIForMarketCondition(
    symbol: string, 
    volatility: number, 
    trend: string
  ): Promise<any> {
    return await this.analyticsDb.$queryRawUnsafe(`
      SELECT 
        ai.ai_system_name,
        ai.global_win_rate,
        ai.global_pnl,
        ai.avg_confidence_across_sites,
        ai.sites_deployed
      FROM ai_system_comparison ai
      WHERE ai.global_win_rate > 0
      ORDER BY ai.global_win_rate DESC, ai.global_pnl DESC
      LIMIT 10
    `);
  }

  /**
   * Update instance heartbeat and sync status
   */
  async updateInstanceStatus(stats: any): Promise<void> {
    await this.analyticsDb.$queryRawUnsafe(`
      UPDATE instances 
      SET 
        last_heartbeat = NOW(),
        status = 'active',
        data_quality_score = ${stats.dataQualityScore || 1.0}
      WHERE id = '${this.instanceId}'
    `);
  }

  /**
   * Close database connections
   */
  async disconnect(): Promise<void> {
    await this.analyticsDb.$disconnect();
  }
}

// Export singleton for easy access
const consolidatedDataService = new ConsolidatedAIDataService({
  analyticsDbUrl: process.env.ANALYTICS_DB_URL || 
    'postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/signalcartel_analytics?schema=public',
  instanceId: process.env.INSTANCE_ID || 'site-primary-main'
});

export { consolidatedDataService };
export default consolidatedDataService;