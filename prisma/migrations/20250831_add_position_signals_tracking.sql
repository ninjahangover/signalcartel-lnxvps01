-- Create table to store original strategy signals for each position
CREATE TABLE IF NOT EXISTS position_signals (
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

-- Create table for trade learning and pattern recognition
CREATE TABLE IF NOT EXISTS trade_learning (
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
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_position_signals_trade_id ON position_signals(unique_trade_id);
CREATE INDEX idx_position_signals_updated ON position_signals(updated_at);
CREATE INDEX idx_trade_learning_trade_id ON trade_learning(unique_trade_id);
CREATE INDEX idx_trade_learning_symbol ON trade_learning(symbol);
CREATE INDEX idx_trade_learning_strategy ON trade_learning(strategy);
CREATE INDEX idx_trade_learning_pnl ON trade_learning(realized_pnl);
CREATE INDEX idx_trade_learning_created ON trade_learning(created_at);

-- Add unique_trade_id to ManagedPosition if not exists
ALTER TABLE "ManagedPosition" 
ADD COLUMN IF NOT EXISTS unique_trade_id TEXT UNIQUE;

-- Create index on unique_trade_id
CREATE INDEX IF NOT EXISTS idx_managed_position_trade_id 
ON "ManagedPosition"(unique_trade_id);

-- Function to generate unique trade IDs
CREATE OR REPLACE FUNCTION generate_unique_trade_id(
  strategy TEXT,
  symbol TEXT
) RETURNS TEXT AS $$
BEGIN
  RETURN CONCAT(
    strategy, '-',
    symbol, '-',
    TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS'), '-',
    SUBSTR(MD5(RANDOM()::TEXT), 1, 8)
  );
END;
$$ LANGUAGE plpgsql;

-- View for real-time position analysis
CREATE OR REPLACE VIEW position_analysis_view AS
SELECT 
  mp.id,
  mp.unique_trade_id,
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
LEFT JOIN position_signals ps ON mp.id = ps.position_id
WHERE mp.status = 'open';

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_position_signals_updated_at 
BEFORE UPDATE ON position_signals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trade_learning_updated_at
BEFORE UPDATE ON trade_learning
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();