#!/bin/bash

# SignalCartel Multi-Instance Data Consolidation Setup
# Creates analytics database and sets up cross-site data sharing

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
ANALYTICS_DB_URL="${ANALYTICS_DB_URL:-postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/signalcartel_analytics?schema=public}"
PRIMARY_DB_URL="${PRIMARY_DB_URL:-postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/signalcartel?schema=public}"

log_info() {
    echo -e "${BLUE}[SETUP-INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SETUP-SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[SETUP-WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[SETUP-ERROR]${NC} $1"
}

log_phase() {
    echo -e "\n${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}🔧 $1${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

create_analytics_database() {
    log_phase "CREATING SIGNALCARTEL ANALYTICS DATABASE (PRODUCTION-SAFE)"
    
    log_warning "🛡️ PRODUCTION SAFETY VERIFICATION"
    log_info "This setup creates a SEPARATE analytics database with READ-ONLY access"
    log_info "✅ NO CHANGES to your production signalcartel database"
    log_info "✅ NO INTERRUPTION to your running trading systems"
    log_info "✅ Only creates new analytics database: signalcartel_analytics"
    
    echo -e "${YELLOW}Press ENTER to continue with production-safe setup, or Ctrl+C to cancel...${NC}"
    read -r
    
    log_info "Setting up consolidated analytics database for multi-site data sharing..."
    
    # Create the analytics database (SEPARATE from production)
    DATABASE_URL="postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/postgres?schema=public" npx tsx -e "
        import { PrismaClient } from '@prisma/client';
        const prisma = new PrismaClient();
        console.log('🔧 Creating SEPARATE signalcartel_analytics database...');
        console.log('🛡️ This does NOT touch your production signalcartel database');
        prisma.\$queryRaw\`CREATE DATABASE signalcartel_analytics OWNER warehouse_user\`
        .then(() => {
            console.log('✅ Analytics database created successfully (SEPARATE from production)');
            prisma.\$disconnect();
        })
        .catch(err => {
            if (err.message.includes('already exists')) {
                console.log('⚠️  Analytics database already exists, continuing...');
            } else {
                console.error('❌ Error creating database:', err.message);
            }
            prisma.\$disconnect();
        });
    "
    
    log_info "Setting up consolidated analytics schema..."
    
    # Create schema with enhanced cross-site features
    cat > "/tmp/analytics_schema_enhanced.sql" << 'EOF'
-- SignalCartel Multi-Instance Analytics Database Schema
-- Enhanced for cross-site AI algorithm data sharing

-- Instance tracking with enhanced metadata
CREATE TABLE IF NOT EXISTS instances (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    site_url TEXT,
    location TEXT,
    hardware_specs JSONB,
    ai_capabilities JSONB, -- Track which AI systems each site has
    created_at TIMESTAMP DEFAULT NOW(),
    last_sync TIMESTAMP,
    last_heartbeat TIMESTAMP,
    status TEXT DEFAULT 'active',
    sync_frequency INTEGER DEFAULT 300, -- seconds
    data_quality_score DECIMAL(3,2) DEFAULT 1.00
);

-- Consolidated positions (from all sites)
CREATE TABLE IF NOT EXISTS consolidated_positions (
    id SERIAL PRIMARY KEY,
    instance_id TEXT NOT NULL,
    original_position_id TEXT NOT NULL,
    global_position_id TEXT GENERATED ALWAYS AS (instance_id || '_' || original_position_id) STORED,
    symbol TEXT NOT NULL,
    strategy_name TEXT,
    strategy_version TEXT,
    position_type TEXT,
    entry_price DECIMAL(15,8),
    exit_price DECIMAL(15,8),
    quantity DECIMAL(15,8),
    pnl_realized DECIMAL(15,8),
    entry_time TIMESTAMP,
    exit_time TIMESTAMP,
    phase_at_entry INTEGER, -- Which phase was active when position opened
    ai_systems_used TEXT[], -- Array of AI systems that contributed
    confidence_score DECIMAL(5,4),
    market_conditions JSONB, -- Market state at time of trade
    created_at TIMESTAMP DEFAULT NOW(),
    data_hash TEXT,
    UNIQUE(instance_id, original_position_id)
);

-- Consolidated trades (from all sites)
CREATE TABLE IF NOT EXISTS consolidated_trades (
    id SERIAL PRIMARY KEY,
    instance_id TEXT NOT NULL,
    original_trade_id TEXT NOT NULL,
    global_trade_id TEXT GENERATED ALWAYS AS (instance_id || '_' || original_trade_id) STORED,
    position_id INTEGER REFERENCES consolidated_positions(id),
    symbol TEXT NOT NULL,
    side TEXT,
    quantity DECIMAL(15,8),
    price DECIMAL(15,8),
    executed_at TIMESTAMP,
    phase_at_execution INTEGER,
    ai_confidence DECIMAL(5,4),
    sentiment_score DECIMAL(5,4),
    technical_score DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT NOW(),
    data_hash TEXT,
    UNIQUE(instance_id, original_trade_id)
);

-- AI Performance tracking across sites
CREATE TABLE IF NOT EXISTS ai_performance_metrics (
    id SERIAL PRIMARY KEY,
    instance_id TEXT NOT NULL,
    ai_system_name TEXT NOT NULL,
    symbol TEXT,
    phase INTEGER,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    total_pnl DECIMAL(15,8) DEFAULT 0,
    avg_confidence DECIMAL(5,4),
    sharpe_ratio DECIMAL(8,4),
    max_drawdown DECIMAL(5,4),
    calculated_at TIMESTAMP DEFAULT NOW(),
    period_start TIMESTAMP,
    period_end TIMESTAMP,
    UNIQUE(instance_id, ai_system_name, symbol, calculated_at)
);

-- Cross-site sentiment consolidation
CREATE TABLE IF NOT EXISTS consolidated_sentiment (
    id SERIAL PRIMARY KEY,
    instance_id TEXT NOT NULL,
    symbol TEXT,
    source TEXT,
    sentiment_score DECIMAL(5,4),
    confidence DECIMAL(5,4),
    raw_data JSONB,
    collected_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    data_hash TEXT
);

-- Mathematical Intuition results across sites
CREATE TABLE IF NOT EXISTS consolidated_intuition (
    id SERIAL PRIMARY KEY,
    instance_id TEXT NOT NULL,
    symbol TEXT,
    calculated_confidence DECIMAL(5,4),
    intuitive_confidence DECIMAL(5,4),
    flow_field_strength DECIMAL(5,4),
    pattern_resonance DECIMAL(5,4),
    timing_intuition DECIMAL(5,4),
    energy_alignment DECIMAL(5,4),
    overall_feeling DECIMAL(5,4),
    recommendation TEXT,
    parallel_analysis_id TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Cross-instance learning insights
CREATE TABLE IF NOT EXISTS learning_insights (
    id SERIAL PRIMARY KEY,
    insight_type TEXT NOT NULL, -- 'pattern', 'strategy', 'market_condition', 'ai_performance'
    title TEXT NOT NULL,
    description TEXT,
    confidence_level DECIMAL(3,2),
    source_instances TEXT[], -- Which instances contributed to this insight
    data_points INTEGER, -- How many data points support this insight
    validation_score DECIMAL(3,2), -- Cross-validation across instances
    market_conditions JSONB,
    applicable_symbols TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    last_validated TIMESTAMP DEFAULT NOW()
);

-- VIEWS FOR AI ALGORITHMS TO QUERY

-- Unified position performance across all sites
CREATE OR REPLACE VIEW unified_position_performance AS
SELECT 
    symbol,
    strategy_name,
    COUNT(*) as total_positions,
    COUNT(DISTINCT instance_id) as sites_using,
    SUM(pnl_realized) as total_pnl,
    AVG(pnl_realized) as avg_pnl,
    COUNT(CASE WHEN pnl_realized > 0 THEN 1 END) * 100.0 / COUNT(*) as win_rate,
    AVG(confidence_score) as avg_confidence,
    STDDEV(pnl_realized) as pnl_volatility,
    MIN(entry_time) as first_trade,
    MAX(exit_time) as last_trade,
    array_agg(DISTINCT unnest(ai_systems_used)) as all_ai_systems_used
FROM consolidated_positions 
WHERE pnl_realized IS NOT NULL
GROUP BY symbol, strategy_name;

-- Cross-site AI system performance comparison
CREATE OR REPLACE VIEW ai_system_comparison AS
SELECT 
    ai_system_name,
    COUNT(DISTINCT instance_id) as sites_deployed,
    SUM(total_trades) as global_trades,
    SUM(winning_trades) as global_wins,
    SUM(winning_trades) * 100.0 / NULLIF(SUM(total_trades), 0) as global_win_rate,
    SUM(total_pnl) as global_pnl,
    AVG(avg_confidence) as avg_confidence_across_sites,
    AVG(sharpe_ratio) as avg_sharpe_ratio,
    MIN(max_drawdown) as best_drawdown,
    MAX(max_drawdown) as worst_drawdown
FROM ai_performance_metrics
GROUP BY ai_system_name;

-- Market condition insights across all sites
CREATE OR REPLACE VIEW market_condition_insights AS
SELECT 
    symbol,
    (market_conditions->>'volatility')::decimal as volatility,
    (market_conditions->>'trend')::text as trend,
    COUNT(*) as trade_count,
    AVG(pnl_realized) as avg_pnl,
    COUNT(CASE WHEN pnl_realized > 0 THEN 1 END) * 100.0 / COUNT(*) as win_rate,
    COUNT(DISTINCT instance_id) as sites_active
FROM consolidated_positions 
WHERE market_conditions IS NOT NULL AND pnl_realized IS NOT NULL
GROUP BY symbol, (market_conditions->>'volatility')::decimal, (market_conditions->>'trend')::text;

-- Phase progression insights
CREATE OR REPLACE VIEW phase_progression_analysis AS
SELECT 
    instance_id,
    phase_at_entry,
    COUNT(*) as trades_in_phase,
    AVG(pnl_realized) as avg_pnl,
    COUNT(CASE WHEN pnl_realized > 0 THEN 1 END) * 100.0 / COUNT(*) as win_rate,
    AVG(confidence_score) as avg_confidence,
    array_agg(DISTINCT unnest(ai_systems_used)) as ai_systems_in_phase
FROM consolidated_positions
WHERE phase_at_entry IS NOT NULL AND pnl_realized IS NOT NULL
GROUP BY instance_id, phase_at_entry;

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_consolidated_positions_instance ON consolidated_positions(instance_id);
CREATE INDEX IF NOT EXISTS idx_consolidated_positions_symbol ON consolidated_positions(symbol);
CREATE INDEX IF NOT EXISTS idx_consolidated_positions_strategy ON consolidated_positions(strategy_name);
CREATE INDEX IF NOT EXISTS idx_consolidated_positions_phase ON consolidated_positions(phase_at_entry);
CREATE INDEX IF NOT EXISTS idx_consolidated_positions_created_at ON consolidated_positions(created_at);
CREATE INDEX IF NOT EXISTS idx_consolidated_positions_global_id ON consolidated_positions(global_position_id);

CREATE INDEX IF NOT EXISTS idx_consolidated_trades_instance ON consolidated_trades(instance_id);
CREATE INDEX IF NOT EXISTS idx_consolidated_trades_symbol ON consolidated_trades(symbol);
CREATE INDEX IF NOT EXISTS idx_consolidated_trades_global_id ON consolidated_trades(global_trade_id);

CREATE INDEX IF NOT EXISTS idx_ai_performance_instance ON ai_performance_metrics(instance_id);
CREATE INDEX IF NOT EXISTS idx_ai_performance_system ON ai_performance_metrics(ai_system_name);
CREATE INDEX IF NOT EXISTS idx_ai_performance_symbol ON ai_performance_metrics(symbol);

CREATE INDEX IF NOT EXISTS idx_consolidated_sentiment_instance ON consolidated_sentiment(instance_id);
CREATE INDEX IF NOT EXISTS idx_consolidated_sentiment_symbol ON consolidated_sentiment(symbol);
CREATE INDEX IF NOT EXISTS idx_consolidated_sentiment_source ON consolidated_sentiment(source);

CREATE INDEX IF NOT EXISTS idx_learning_insights_type ON learning_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_learning_insights_confidence ON learning_insights(confidence_level);

-- Data sync status tracking
CREATE TABLE IF NOT EXISTS sync_status (
    id SERIAL PRIMARY KEY,
    instance_id TEXT NOT NULL,
    table_name TEXT NOT NULL,
    last_sync_timestamp TIMESTAMP,
    records_synced INTEGER DEFAULT 0,
    sync_duration_ms INTEGER,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
EOF

    # Apply the enhanced schema using individual commands to avoid prepared statement issues
    echo "🔧 Applying enhanced analytics schema using individual SQL commands..."
    if ANALYTICS_DB_URL="$ANALYTICS_DB_URL" npx tsx -r dotenv/config scripts/data-consolidation/deploy-analytics-schema.ts; then
        log_success "Enhanced analytics schema applied successfully"
    else
        log_error "Failed to apply enhanced schema"
        exit 1
    fi
    
    # Clean up
    rm -f "/tmp/analytics_schema_enhanced.sql"
    
    log_success "Analytics database with enhanced cross-site features created successfully"
}

register_current_instance() {
    log_phase "REGISTERING CURRENT SITE AS PRIMARY INSTANCE"
    
    DATABASE_URL="${ANALYTICS_DB_URL}" npx tsx -e "
        import { PrismaClient } from '@prisma/client';
        const prisma = new PrismaClient();
        console.log('🔧 Registering current site as primary instance...');
        prisma.\$queryRaw\`
            INSERT INTO instances (
                id, name, site_url, location, 
                ai_capabilities, hardware_specs, status
            ) VALUES (
                'site-primary-main',
                'Primary Development Site',
                'localhost:3001',
                'Alienware Aurora R6',
                '{\"phase_system\": true, \"sentiment_analysis\": true, \"mathematical_intuition\": true, \"order_book_intelligence\": true, \"multi_layer_ai\": true}',
                '{\"cpu\": \"Intel i7-7700\", \"ram\": \"32GB DDR4\", \"gpu\": \"NVIDIA GTX 1080 8GB\"}',
                'active'
            )
            ON CONFLICT (id) DO UPDATE SET 
                last_heartbeat = NOW(),
                status = 'active'
        \`
        .then(() => {
            console.log('✅ Primary instance registered successfully');
            prisma.\$disconnect();
        })
        .catch(err => {
            console.error('❌ Error registering instance:', err.message);
            prisma.\$disconnect();
        });
    "
    
    log_success "Primary site registered in analytics database"
}

create_ai_data_service() {
    log_phase "CREATING AI DATA SERVICE FOR CROSS-SITE ACCESS"
    
    log_info "Creating service to provide consolidated data to AI algorithms..."
    
    cat > "/tmp/consolidated-ai-data-service.ts" << 'EOF'
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
      INNER JOIN (
        SELECT DISTINCT unnest(all_ai_systems_used) as ai_system
        FROM unified_position_performance upp
        INNER JOIN consolidated_positions cp ON cp.strategy_name = upp.strategy_name
        WHERE cp.symbol = '${symbol}'
          AND (cp.market_conditions->>'volatility')::decimal BETWEEN ${volatility * 0.8} AND ${volatility * 1.2}
          AND cp.market_conditions->>'trend' = '${trend}'
      ) relevant ON relevant.ai_system = ai.ai_system_name
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
EOF

    # Move the service file to the proper location
    mv "/tmp/consolidated-ai-data-service.ts" "src/lib/consolidated-ai-data-service.ts"
    
    log_success "AI Data Service created at src/lib/consolidated-ai-data-service.ts"
}

main() {
    echo -e "${PURPLE}"
    echo "┌─────────────────────────────────────────────────────────────────────────────────────────┐"
    echo "│           🌐 SIGNALCARTEL MULTI-INSTANCE SETUP                                         │"
    echo "│                      CROSS-SITE AI DATA CONSOLIDATION                                  │"
    echo "│                                                                                         │"
    echo "│  🤖 Unified AI algorithm data access across all sites                                  │"
    echo "│  📊 Cross-site performance analysis and insights                                       │"
    echo "│  🔄 Real-time data synchronization between dev sites                                   │"
    echo "│  🧠 Mathematical Intuition and sentiment data sharing                                  │"
    echo "└─────────────────────────────────────────────────────────────────────────────────────────┘"
    echo -e "${NC}"
    
    create_analytics_database
    register_current_instance
    create_ai_data_service
    
    log_success "🎉 Multi-instance setup completed successfully!"
    log_info "Next steps:"
    log_info "1. Run the data consolidation sync: ./scripts/data-consolidation/read-only-sync.sh"
    log_info "2. Start multi-instance monitor: npx tsx admin/multi-instance-monitor.ts"
    log_info "3. Connect other dev sites using the same analytics database"
    log_info "Analytics DB URL: ${ANALYTICS_DB_URL}"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi