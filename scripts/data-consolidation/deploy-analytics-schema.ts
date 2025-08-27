#!/usr/bin/env npx tsx

/**
 * SignalCartel Analytics Database Schema Deployment
 * Deploys multi-instance consolidation schema using individual SQL commands
 */

import { PrismaClient } from '@prisma/client';

const ANALYTICS_DB_URL = process.env.ANALYTICS_DB_URL || 
  'postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5435/signalcartel_analytics?schema=public';

async function deploySchema() {
  console.log('🚀 Deploying SignalCartel Analytics Database Schema...');
  
  const prisma = new PrismaClient({
    datasources: {
      db: { url: ANALYTICS_DB_URL }
    }
  });

  try {
    // Enhanced instance tracking table with AI capabilities
    console.log('📋 Creating enhanced instances table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS instances (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        site_url TEXT,
        location TEXT,
        hardware_specs JSONB,
        ai_capabilities JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        last_sync TIMESTAMP,
        last_heartbeat TIMESTAMP,
        status TEXT DEFAULT 'active',
        sync_frequency INTEGER DEFAULT 300,
        data_quality_score DECIMAL(3,2) DEFAULT 1.00
      )
    `;

    // Enhanced consolidated positions table
    console.log('📊 Creating enhanced consolidated_positions table...');
    await prisma.$executeRaw`
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
        phase_at_entry INTEGER,
        ai_systems_used TEXT[],
        confidence_score DECIMAL(5,4),
        market_conditions JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        data_hash TEXT,
        UNIQUE(instance_id, original_position_id)
      )
    `;

    // Enhanced consolidated trades table
    console.log('💹 Creating enhanced consolidated_trades table...');
    await prisma.$executeRaw`
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
      )
    `;

    // AI Performance tracking table
    console.log('🤖 Creating ai_performance_metrics table...');
    await prisma.$executeRaw`
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
      )
    `;

    // Enhanced consolidated sentiment data table
    console.log('🧠 Creating enhanced consolidated_sentiment table...');
    await prisma.$executeRaw`
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
      )
    `;

    // Mathematical Intuition results table
    console.log('🔬 Creating consolidated_intuition table...');
    await prisma.$executeRaw`
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
      )
    `;

    // Learning insights table
    console.log('📚 Creating learning_insights table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS learning_insights (
        id SERIAL PRIMARY KEY,
        insight_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        confidence_level DECIMAL(3,2),
        source_instances TEXT[],
        data_points INTEGER,
        validation_score DECIMAL(3,2),
        market_conditions JSONB,
        applicable_symbols TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        last_validated TIMESTAMP DEFAULT NOW()
      )
    `;

    // Sync status tracking table
    console.log('🔄 Creating sync_status table...');
    await prisma.$executeRaw`
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
      )
    `;

    // Create enhanced performance indexes
    console.log('📇 Creating performance indexes...');
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_consolidated_positions_instance ON consolidated_positions(instance_id)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_consolidated_positions_symbol ON consolidated_positions(symbol)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_consolidated_positions_strategy ON consolidated_positions(strategy_name)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_consolidated_positions_phase ON consolidated_positions(phase_at_entry)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_consolidated_positions_created_at ON consolidated_positions(created_at)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_consolidated_positions_global_id ON consolidated_positions(global_position_id)`;
    
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_consolidated_trades_instance ON consolidated_trades(instance_id)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_consolidated_trades_symbol ON consolidated_trades(symbol)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_consolidated_trades_global_id ON consolidated_trades(global_trade_id)`;
    
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_ai_performance_instance ON ai_performance_metrics(instance_id)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_ai_performance_system ON ai_performance_metrics(ai_system_name)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_ai_performance_symbol ON ai_performance_metrics(symbol)`;
    
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_consolidated_sentiment_instance ON consolidated_sentiment(instance_id)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_consolidated_sentiment_symbol ON consolidated_sentiment(symbol)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_consolidated_sentiment_source ON consolidated_sentiment(source)`;
    
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_learning_insights_type ON learning_insights(insight_type)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_learning_insights_confidence ON learning_insights(confidence_level)`;

    // Create unified performance view (fixed array aggregation)
    console.log('📈 Creating unified_position_performance view...');
    await prisma.$executeRaw`
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
        MAX(exit_time) as last_trade
      FROM consolidated_positions 
      WHERE pnl_realized IS NOT NULL
      GROUP BY symbol, strategy_name
    `;

    // Create AI system comparison view
    console.log('🤖 Creating ai_system_comparison view...');
    await prisma.$executeRaw`
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
      GROUP BY ai_system_name
    `;

    // Create market condition insights view
    console.log('📊 Creating market_condition_insights view...');
    await prisma.$executeRaw`
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
      GROUP BY symbol, (market_conditions->>'volatility')::decimal, (market_conditions->>'trend')::text
    `;

    // Create phase progression analysis view (fixed array aggregation)
    console.log('🔄 Creating phase_progression_analysis view...');
    await prisma.$executeRaw`
      CREATE OR REPLACE VIEW phase_progression_analysis AS
      SELECT 
        instance_id,
        phase_at_entry,
        COUNT(*) as trades_in_phase,
        AVG(pnl_realized) as avg_pnl,
        COUNT(CASE WHEN pnl_realized > 0 THEN 1 END) * 100.0 / COUNT(*) as win_rate,
        AVG(confidence_score) as avg_confidence
      FROM consolidated_positions
      WHERE phase_at_entry IS NOT NULL AND pnl_realized IS NOT NULL
      GROUP BY instance_id, phase_at_entry
    `;

    // Register enhanced instances with AI capabilities
    console.log('🏗️ Registering instances with AI capabilities...');
    await prisma.$executeRaw`
      INSERT INTO instances (
        id, name, site_url, location, 
        ai_capabilities, hardware_specs, status
      ) VALUES (
        'site-primary-main',
        'Primary Development Site',
        'localhost:3001',
        'Alienware Aurora R6',
        '{"phase_system": true, "sentiment_analysis": true, "mathematical_intuition": true, "order_book_intelligence": true, "multi_layer_ai": true}',
        '{"cpu": "Intel i7-7700", "ram": "32GB DDR4", "gpu": "NVIDIA GTX 1080 8GB"}',
        'active'
      ),
      (
        'dev-secondary',
        'Secondary Development Instance', 
        'localhost:3002',
        'Development Server',
        '{"phase_system": true, "sentiment_analysis": true}',
        '{}',
        'active'
      )
      ON CONFLICT (id) DO UPDATE SET 
        last_heartbeat = NOW(),
        status = 'active'
    `;

    console.log('✅ Analytics database schema deployed successfully!');
    console.log(`📍 Database: ${ANALYTICS_DB_URL}`);

  } catch (error) {
    console.error('❌ Schema deployment failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  deploySchema().catch(console.error);
}

export default deploySchema;