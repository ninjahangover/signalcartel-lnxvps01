-- DEV2-SPECIFIC AI TRACKING TABLES
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
  
  -- Entry conditions
  entry_signals JSONB NOT NULL,
  entry_price DECIMAL(20, 8) NOT NULL,
  entry_time TIMESTAMP NOT NULL,
  entry_confidence DECIMAL(5, 2),
  
  -- Exit conditions
  exit_signals JSONB,
  exit_price DECIMAL(20, 8),
  exit_time TIMESTAMP,
  exit_reason TEXT,
  
  -- Performance
  realized_pnl DECIMAL(20, 8),
  pnl_percent DECIMAL(10, 4),
  hold_time_minutes INTEGER,
  max_drawdown_percent DECIMAL(10, 4),
  max_profit_percent DECIMAL(10, 4),
  
  -- AI analysis
  ai_recommendations JSONB DEFAULT '[]'::jsonb,
  pattern_matches JSONB DEFAULT '[]'::jsonb,
  regime_changes JSONB DEFAULT '[]'::jsonb,
  
  -- Learning metrics
  success_factors JSONB,
  failure_factors JSONB,
  optimization_suggestions JSONB,
  
  -- Dev2 A/B test tracking
  test_variant TEXT DEFAULT 'dev2_ai_enhanced',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for dev2 tables
CREATE INDEX idx_position_signals_dev2_trade_id ON position_signals_dev2(unique_trade_id);
CREATE INDEX idx_position_signals_dev2_updated ON position_signals_dev2(updated_at);
CREATE INDEX idx_trade_learning_dev2_trade_id ON trade_learning_dev2(unique_trade_id);
CREATE INDEX idx_trade_learning_dev2_symbol ON trade_learning_dev2(symbol);
CREATE INDEX idx_trade_learning_dev2_strategy ON trade_learning_dev2(strategy);
CREATE INDEX idx_trade_learning_dev2_pnl ON trade_learning_dev2(realized_pnl);

-- Add dev2-specific unique_trade_id column (won't affect dev1 positions)
ALTER TABLE "ManagedPosition" 
ADD COLUMN IF NOT EXISTS unique_trade_id_dev2 TEXT;

-- Create index for dev2 trade IDs
CREATE INDEX IF NOT EXISTS idx_managed_position_trade_id_dev2 
ON "ManagedPosition"(unique_trade_id_dev2);

-- Dev2-specific view for real-time position analysis
CREATE OR REPLACE VIEW position_analysis_dev2 AS
SELECT 
  mp.id,
  mp.unique_trade_id_dev2,
  mp.strategy,
  mp.symbol,
  mp.side,
  mp.status,
  mp."entryPrice",
  mp.quantity,
  mp."entryTime",
  mp."unrealizedPnL",
  mp."realizedPnL",
  ps.original_signal,
  ps.current_signal,
  ps.signal_validations,
  ps.ai_decisions,
  EXTRACT(EPOCH FROM (NOW() - mp."entryTime"))/60 as hold_time_minutes,
  CASE 
    WHEN mp."unrealizedPnL" IS NOT NULL 
    THEN (mp."unrealizedPnL" / (mp."entryPrice" * mp.quantity)) * 100
    ELSE 0
  END as unrealized_pnl_percent
FROM "ManagedPosition" mp
LEFT JOIN position_signals_dev2 ps ON mp.id = ps.position_id
WHERE mp.status = 'open' 
  AND mp.strategy LIKE '%dev2%' -- Only dev2 positions
  OR mp.unique_trade_id_dev2 IS NOT NULL;

-- A/B Test comparison view
CREATE OR REPLACE VIEW ab_test_comparison AS
SELECT 
  'dev1' as variant,
  COUNT(*) as total_positions,
  COUNT(CASE WHEN status = 'closed' AND "realizedPnL" > 0 THEN 1 END) as wins,
  COUNT(CASE WHEN status = 'closed' AND "realizedPnL" < 0 THEN 1 END) as losses,
  AVG(CASE WHEN status = 'closed' THEN "realizedPnL" END) as avg_pnl,
  SUM(CASE WHEN status = 'closed' THEN "realizedPnL" END) as total_pnl
FROM "ManagedPosition"
WHERE unique_trade_id_dev2 IS NULL -- Dev1 positions
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
WHERE unique_trade_id_dev2 IS NOT NULL -- Dev2 positions
  AND "createdAt" > NOW() - INTERVAL '24 hours';

-- Trigger for dev2 tables
CREATE OR REPLACE FUNCTION update_dev2_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_position_signals_dev2_updated 
BEFORE UPDATE ON position_signals_dev2
FOR EACH ROW EXECUTE FUNCTION update_dev2_updated_at();

CREATE TRIGGER update_trade_learning_dev2_updated
BEFORE UPDATE ON trade_learning_dev2
FOR EACH ROW EXECUTE FUNCTION update_dev2_updated_at();