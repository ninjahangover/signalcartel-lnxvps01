-- DEV2-SPECIFIC AI TRACKING TABLES (FIXED VERSION)
-- These tables are ONLY for dev2 testing and won't affect dev1

-- Create dev2-specific position signals table
CREATE TABLE IF NOT EXISTS position_signals_dev2 (
  position_id TEXT PRIMARY KEY,
  unique_trade_id TEXT UNIQUE NOT NULL,
  original_signal JSONB NOT NULL,
  current_signal JSONB,
  signal_validations JSONB DEFAULT '[]'::jsonb,
  ai_decisions JSONB DEFAULT '[]'::jsonb,
  performance_metrics JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create dev2-specific trade learning table
CREATE TABLE IF NOT EXISTS trade_learning_dev2 (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  unique_trade_id TEXT NOT NULL,
  position_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  strategy TEXT NOT NULL,
  entry_signals JSONB NOT NULL,
  entry_price DECIMAL(20, 8) NOT NULL,
  entry_time TIMESTAMP NOT NULL,
  entry_confidence DECIMAL(5, 2),
  exit_signals JSONB,
  exit_price DECIMAL(20, 8),
  exit_time TIMESTAMP,
  exit_reason TEXT,
  realized_pnl DECIMAL(20, 8),
  pnl_percent DECIMAL(10, 4),
  hold_time_minutes INTEGER,
  max_drawdown_percent DECIMAL(10, 4),
  max_profit_percent DECIMAL(10, 4),
  ai_recommendations JSONB DEFAULT '[]'::jsonb,
  pattern_matches JSONB DEFAULT '[]'::jsonb,
  regime_changes JSONB DEFAULT '[]'::jsonb,
  success_factors JSONB,
  failure_factors JSONB,
  optimization_suggestions JSONB,
  test_variant TEXT DEFAULT 'dev2_ai_enhanced',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_position_signals_dev2_trade_id ON position_signals_dev2(unique_trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_learning_dev2_trade_id ON trade_learning_dev2(unique_trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_learning_dev2_symbol ON trade_learning_dev2(symbol);

-- Add dev2 unique_trade_id column
ALTER TABLE "ManagedPosition" 
ADD COLUMN IF NOT EXISTS unique_trade_id_dev2 TEXT;

-- Create index
CREATE INDEX IF NOT EXISTS idx_managed_position_trade_id_dev2 
ON "ManagedPosition"(unique_trade_id_dev2);

-- Simple A/B comparison view
CREATE OR REPLACE VIEW ab_test_comparison AS
SELECT 
  'dev1' as variant,
  COUNT(*) as total_positions,
  COUNT(CASE WHEN status = 'closed' AND "realizedPnL" > 0 THEN 1 END) as wins,
  COUNT(CASE WHEN status = 'closed' AND "realizedPnL" < 0 THEN 1 END) as losses,
  AVG(CASE WHEN status = 'closed' THEN "realizedPnL" END) as avg_pnl,
  SUM(CASE WHEN status = 'closed' THEN "realizedPnL" END) as total_pnl
FROM "ManagedPosition"
WHERE unique_trade_id_dev2 IS NULL
  AND "createdAt" > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
  'dev2' as variant,
  COUNT(*) as total_positions,
  COUNT(CASE WHEN status = 'closed' AND "realizedPnL" > 0 THEN 1 END) as wins,
  COUNT(CASE WHEN status = 'closed' AND "realizedPnL" < 0 THEN 1 END) as losses,
  AVG(CASE WHEN status = 'closed' THEN "realizedPnL" END) as avg_pnl,
  SUM(CASE WHEN status = 'closed' THEN "realizedPnL" END) as total_pnl
FROM "ManagedPosition"
WHERE unique_trade_id_dev2 IS NOT NULL
  AND "createdAt" > NOW() - INTERVAL '24 hours';