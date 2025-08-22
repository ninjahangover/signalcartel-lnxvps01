-- QUANTUM FORGE™ Data Warehouse Schema
-- Optimized for long-term analytics and pattern recognition

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- =====================================================
-- HISTORICAL MARKET DATA (Time Series Optimized)
-- =====================================================

CREATE TABLE historical_market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    timeframe VARCHAR(10) NOT NULL DEFAULT '1m',
    
    -- OHLCV Data
    open DECIMAL(20,8) NOT NULL,
    high DECIMAL(20,8) NOT NULL,
    low DECIMAL(20,8) NOT NULL,
    close DECIMAL(20,8) NOT NULL,
    volume DECIMAL(20,8) DEFAULT 0.0,
    
    -- Technical Indicators (Pre-calculated for performance)
    rsi DECIMAL(8,4),
    macd DECIMAL(12,8),
    macd_signal DECIMAL(12,8),
    ema20 DECIMAL(20,8),
    ema50 DECIMAL(20,8),
    sma20 DECIMAL(20,8),
    sma50 DECIMAL(20,8),
    bollinger_upper DECIMAL(20,8),
    bollinger_lower DECIMAL(20,8),
    atr DECIMAL(12,8),
    volatility DECIMAL(8,4),
    momentum DECIMAL(8,4),
    
    -- Data Quality & Sourcing
    data_source VARCHAR(50) DEFAULT 'kraken',
    quality_score DECIMAL(3,2) DEFAULT 1.0,
    gaps_filled BOOLEAN DEFAULT FALSE,
    
    -- Partitioning Helper
    year_month INTEGER GENERATED ALWAYS AS (
        EXTRACT(YEAR FROM timestamp) * 100 + EXTRACT(MONTH FROM timestamp)
    ) STORED,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions for the last 24 months and next 12 months
DO $$
DECLARE
    start_date DATE := DATE_TRUNC('month', NOW() - INTERVAL '24 months');
    end_date DATE := DATE_TRUNC('month', NOW() + INTERVAL '12 months');
    partition_date DATE := start_date;
    partition_name TEXT;
    next_partition_date DATE;
BEGIN
    WHILE partition_date < end_date LOOP
        next_partition_date := partition_date + INTERVAL '1 month';
        partition_name := 'historical_market_data_' || TO_CHAR(partition_date, 'YYYY_MM');
        
        EXECUTE FORMAT('CREATE TABLE %I PARTITION OF historical_market_data 
                       FOR VALUES FROM (%L) TO (%L)',
                       partition_name, partition_date, next_partition_date);
        
        partition_date := next_partition_date;
    END LOOP;
END $$;

-- =====================================================
-- HISTORICAL TRADES (All Trading Activity)
-- =====================================================

CREATE TABLE historical_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Trade Identification
    trade_session_id VARCHAR(100),
    strategy_name VARCHAR(100) NOT NULL,
    engine_type VARCHAR(50) DEFAULT 'QUANTUM_FORGE',
    
    -- Symbol & Market Info
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('BUY', 'SELL')),
    
    -- Trade Execution Details
    quantity DECIMAL(20,8) NOT NULL,
    price DECIMAL(20,8) NOT NULL,
    total_value DECIMAL(20,8) GENERATED ALWAYS AS (quantity * price) STORED,
    
    -- Profit & Loss
    pnl DECIMAL(20,8),
    pnl_percentage DECIMAL(8,4),
    fees DECIMAL(20,8) DEFAULT 0.0,
    
    -- Timestamps
    timestamp TIMESTAMPTZ NOT NULL,
    entry_time TIMESTAMPTZ,
    exit_time TIMESTAMPTZ,
    
    -- Market Context at Trade Time
    market_price DECIMAL(20,8),
    market_rsi DECIMAL(8,4),
    market_volatility DECIMAL(8,4),
    trend_direction VARCHAR(10),
    
    -- Strategy Context
    confidence_score DECIMAL(5,4),
    risk_score DECIMAL(5,4),
    position_size_reasoning TEXT,
    
    -- Trade Classification
    trade_type VARCHAR(20) DEFAULT 'SPOT',
    is_paper_trade BOOLEAN DEFAULT TRUE,
    
    -- Performance Metrics
    holding_duration_minutes INTEGER,
    slippage_bps INTEGER,
    execution_quality VARCHAR(20),
    
    -- Partitioning Helper  
    year_month INTEGER GENERATED ALWAYS AS (
        EXTRACT(YEAR FROM timestamp) * 100 + EXTRACT(MONTH FROM timestamp)
    ) STORED,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions for trades
DO $$
DECLARE
    start_date DATE := DATE_TRUNC('month', NOW() - INTERVAL '24 months');
    end_date DATE := DATE_TRUNC('month', NOW() + INTERVAL '12 months');
    partition_date DATE := start_date;
    partition_name TEXT;
    next_partition_date DATE;
BEGIN
    WHILE partition_date < end_date LOOP
        next_partition_date := partition_date + INTERVAL '1 month';
        partition_name := 'historical_trades_' || TO_CHAR(partition_date, 'YYYY_MM');
        
        EXECUTE FORMAT('CREATE TABLE %I PARTITION OF historical_trades 
                       FOR VALUES FROM (%L) TO (%L)',
                       partition_name, partition_date, next_partition_date);
        
        partition_date := next_partition_date;
    END LOOP;
END $$;

-- =====================================================
-- STRATEGY PERFORMANCE ANALYTICS
-- =====================================================

CREATE TABLE strategy_performance_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Strategy Identification
    strategy_name VARCHAR(100) NOT NULL,
    engine_type VARCHAR(50) DEFAULT 'QUANTUM_FORGE',
    snapshot_date DATE NOT NULL,
    
    -- Performance Metrics
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5,4) GENERATED ALWAYS AS (
        CASE WHEN total_trades > 0 
        THEN winning_trades::DECIMAL / total_trades 
        ELSE 0 END
    ) STORED,
    
    -- Financial Metrics
    total_pnl DECIMAL(20,8) DEFAULT 0.0,
    average_win DECIMAL(20,8) DEFAULT 0.0,
    average_loss DECIMAL(20,8) DEFAULT 0.0,
    largest_win DECIMAL(20,8) DEFAULT 0.0,
    largest_loss DECIMAL(20,8) DEFAULT 0.0,
    
    -- Risk Metrics
    max_drawdown DECIMAL(20,8) DEFAULT 0.0,
    sharpe_ratio DECIMAL(8,4),
    profit_factor DECIMAL(8,4),
    
    -- Activity Metrics
    avg_holding_minutes INTEGER,
    trades_per_day DECIMAL(8,2),
    
    -- Market Conditions
    market_regime VARCHAR(20), -- 'BULL', 'BEAR', 'SIDEWAYS'
    volatility_regime VARCHAR(20), -- 'LOW', 'MEDIUM', 'HIGH'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(strategy_name, engine_type, snapshot_date)
);

-- =====================================================
-- MARKET REGIME DETECTION
-- =====================================================

CREATE TABLE market_regimes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL,
    
    -- Regime Classification
    regime_type VARCHAR(20) NOT NULL, -- 'BULL', 'BEAR', 'SIDEWAYS'
    volatility_regime VARCHAR(20) NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH'
    
    -- Time Range
    start_date DATE NOT NULL,
    end_date DATE,
    duration_days INTEGER,
    
    -- Regime Characteristics
    price_change_percent DECIMAL(8,4),
    avg_volatility DECIMAL(8,4),
    max_drawdown DECIMAL(8,4),
    
    -- Supporting Data
    classification_confidence DECIMAL(5,4),
    supporting_indicators JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- OPTIMIZED INDEXES FOR ANALYTICS
-- =====================================================

-- Historical Market Data Indexes
CREATE INDEX idx_historical_market_symbol_timestamp 
    ON historical_market_data (symbol, timestamp DESC);
CREATE INDEX idx_historical_market_timeframe 
    ON historical_market_data (timeframe, timestamp DESC);
CREATE INDEX idx_historical_market_year_month 
    ON historical_market_data (year_month, symbol);

-- Historical Trades Indexes  
CREATE INDEX idx_historical_trades_symbol_timestamp 
    ON historical_trades (symbol, timestamp DESC);
CREATE INDEX idx_historical_trades_strategy 
    ON historical_trades (strategy_name, timestamp DESC);
CREATE INDEX idx_historical_trades_pnl 
    ON historical_trades (pnl DESC) WHERE pnl IS NOT NULL;
CREATE INDEX idx_historical_trades_session 
    ON historical_trades (trade_session_id, timestamp);

-- Strategy Performance Indexes
CREATE INDEX idx_strategy_performance_name_date 
    ON strategy_performance_snapshots (strategy_name, snapshot_date DESC);
CREATE INDEX idx_strategy_performance_metrics 
    ON strategy_performance_snapshots (win_rate DESC, total_pnl DESC);

-- Market Regime Indexes
CREATE INDEX idx_market_regimes_symbol_dates 
    ON market_regimes (symbol, start_date DESC, end_date);

-- =====================================================
-- ANALYTICS VIEWS
-- =====================================================

-- Strategy Performance Summary (Last 30 Days)
CREATE VIEW v_strategy_performance_30d AS
SELECT 
    strategy_name,
    COUNT(*) as total_trades,
    COUNT(*) FILTER (WHERE pnl > 0) as winning_trades,
    ROUND(AVG(CASE WHEN pnl > 0 THEN 1.0 ELSE 0.0 END) * 100, 2) as win_rate_pct,
    ROUND(SUM(pnl), 4) as total_pnl,
    ROUND(AVG(pnl), 4) as avg_pnl_per_trade,
    ROUND(MAX(pnl), 4) as largest_win,
    ROUND(MIN(pnl), 4) as largest_loss
FROM historical_trades 
WHERE timestamp >= NOW() - INTERVAL '30 days'
    AND pnl IS NOT NULL
GROUP BY strategy_name
ORDER BY total_pnl DESC;

-- Daily Trading Volume by Symbol
CREATE VIEW v_daily_volume_trend AS
SELECT 
    symbol,
    DATE(timestamp) as trade_date,
    COUNT(*) as trade_count,
    ROUND(SUM(total_value), 2) as total_volume,
    ROUND(AVG(price), 4) as avg_price
FROM historical_trades
WHERE timestamp >= NOW() - INTERVAL '90 days'
GROUP BY symbol, DATE(timestamp)
ORDER BY symbol, trade_date DESC;

-- Market Regime Analysis
CREATE VIEW v_current_market_conditions AS
SELECT 
    mr.symbol,
    mr.regime_type,
    mr.volatility_regime,
    mr.start_date,
    CURRENT_DATE - mr.start_date as days_in_regime,
    mr.classification_confidence
FROM market_regimes mr
WHERE mr.end_date IS NULL
ORDER BY mr.symbol;

-- =====================================================
-- DATA QUALITY FUNCTIONS
-- =====================================================

-- Function to calculate data completeness
CREATE OR REPLACE FUNCTION calculate_data_completeness(
    p_symbol VARCHAR(20),
    p_start_date DATE,
    p_end_date DATE
) RETURNS DECIMAL(5,4) AS $$
DECLARE
    expected_points INTEGER;
    actual_points INTEGER;
BEGIN
    -- Calculate expected 1-minute data points (market hours)
    expected_points := (p_end_date - p_start_date) * 1440; -- 1440 minutes per day
    
    -- Count actual data points
    SELECT COUNT(*) INTO actual_points
    FROM historical_market_data
    WHERE symbol = p_symbol
      AND timestamp::DATE BETWEEN p_start_date AND p_end_date
      AND timeframe = '1m';
    
    RETURN CASE 
        WHEN expected_points > 0 THEN actual_points::DECIMAL / expected_points
        ELSE 0.0 
    END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- AUTOMATED MAINTENANCE
-- =====================================================

-- Function to create new monthly partitions
CREATE OR REPLACE FUNCTION create_monthly_partitions() RETURNS void AS $$
DECLARE
    next_month DATE := DATE_TRUNC('month', NOW() + INTERVAL '1 month');
    partition_name TEXT;
    next_partition_date DATE;
BEGIN
    -- Create partitions for both tables
    FOR table_name IN SELECT unnest(ARRAY['historical_market_data', 'historical_trades']) LOOP
        next_partition_date := next_month + INTERVAL '1 month';
        partition_name := table_name || '_' || TO_CHAR(next_month, 'YYYY_MM');
        
        EXECUTE FORMAT('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I 
                       FOR VALUES FROM (%L) TO (%L)',
                       partition_name, table_name, next_month, next_partition_date);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INITIAL DATA SETUP
-- =====================================================

-- Create a sample market regime for BTCUSD
INSERT INTO market_regimes (symbol, regime_type, volatility_regime, start_date, classification_confidence)
VALUES ('BTCUSD', 'BULL', 'MEDIUM', CURRENT_DATE - INTERVAL '30 days', 0.85);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'QUANTUM FORGE™ Data Warehouse initialized successfully!';
    RAISE NOTICE 'Ready for long-term analytics and pattern recognition.';
END $$;