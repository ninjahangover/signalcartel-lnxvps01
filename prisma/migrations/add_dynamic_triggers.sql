-- Migration to add dynamic trigger tracking tables

-- Table to track dynamic trigger executions
CREATE TABLE IF NOT EXISTS "DynamicTriggerExecution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "triggerId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "type" TEXT NOT NULL CHECK ("type" IN ('long', 'short')),
    "entryTime" TIMESTAMP(3) NOT NULL,
    "entryPrice" DECIMAL(20,8) NOT NULL,
    "exitTime" TIMESTAMP(3),
    "exitPrice" DECIMAL(20,8),
    "positionSize" DECIMAL(10,8) NOT NULL,
    "confidence" DECIMAL(5,4) NOT NULL,
    "isTestPosition" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active' CHECK ("status" IN ('pending', 'active', 'filled', 'closed', 'cancelled')),
    "stopLoss" DECIMAL(20,8),
    "takeProfit" TEXT, -- JSON array of take profit levels
    "pnl" DECIMAL(20,8),
    "exitReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table to track dynamic trigger performance metrics
CREATE TABLE IF NOT EXISTS "DynamicTriggerPerformance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "triggerType" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "totalTrades" INTEGER NOT NULL DEFAULT 0,
    "winningTrades" INTEGER NOT NULL DEFAULT 0,
    "losingTrades" INTEGER NOT NULL DEFAULT 0,
    "winRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "avgReturn" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "totalReturn" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "sharpeRatio" DECIMAL(8,4),
    "maxDrawdown" DECIMAL(8,4),
    "profitFactor" DECIMAL(8,4),
    "bestTrade" DECIMAL(10,6),
    "worstTrade" DECIMAL(10,6),
    "marketRegime" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table to track market regime detections
CREATE TABLE IF NOT EXISTS "MarketRegimeDetection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "regime" TEXT NOT NULL,
    "confidence" DECIMAL(5,4) NOT NULL,
    "stability" DECIMAL(5,4) NOT NULL,
    "expectedDuration" INTEGER NOT NULL, -- in minutes
    "detectionMethod" TEXT NOT NULL, -- 'ml', 'statistical', 'microstructure', 'ensemble'
    "features" TEXT, -- JSON object with features used for detection
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table to track system alerts
CREATE TABLE IF NOT EXISTS "DynamicTriggerAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL CHECK ("type" IN ('performance', 'risk', 'opportunity', 'system')),
    "severity" TEXT NOT NULL CHECK ("severity" IN ('info', 'warning', 'critical')),
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "triggerIds" TEXT, -- JSON array of related trigger IDs
    "metrics" TEXT, -- JSON object with relevant metrics
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table to track performance comparisons
CREATE TABLE IF NOT EXISTS "PerformanceComparison" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "period" TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    
    -- Dynamic trigger stats
    "dtTotalTrades" INTEGER NOT NULL DEFAULT 0,
    "dtWinRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "dtAvgReturn" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "dtTotalReturn" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "dtSharpeRatio" DECIMAL(8,4),
    "dtMaxDrawdown" DECIMAL(8,4),
    "dtVolatility" DECIMAL(8,4),
    
    -- Manual trading stats
    "manualTotalTrades" INTEGER NOT NULL DEFAULT 0,
    "manualWinRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "manualAvgReturn" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "manualTotalReturn" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "manualSharpeRatio" DECIMAL(8,4),
    "manualMaxDrawdown" DECIMAL(8,4),
    "manualVolatility" DECIMAL(8,4),
    
    -- Comparison metrics
    "outperformance" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "riskAdjustedOutperformance" DECIMAL(8,4),
    "consistencyScore" DECIMAL(5,4),
    "recommendations" TEXT, -- JSON array of recommendations
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table to track adaptive parameter changes
CREATE TABLE IF NOT EXISTS "AdaptiveParameterChange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parameter" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "previousValue" DECIMAL(20,8) NOT NULL,
    "newValue" DECIMAL(20,8) NOT NULL,
    "changeReason" TEXT NOT NULL,
    "marketRegime" TEXT,
    "confidence" DECIMAL(5,4),
    "expectedImprovement" DECIMAL(8,4),
    "actualImprovement" DECIMAL(8,4),
    "validatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS "DynamicTriggerExecution_symbol_entryTime_idx" ON "DynamicTriggerExecution"("symbol", "entryTime");
CREATE INDEX IF NOT EXISTS "DynamicTriggerExecution_status_isTestPosition_idx" ON "DynamicTriggerExecution"("status", "isTestPosition");
CREATE INDEX IF NOT EXISTS "DynamicTriggerPerformance_triggerType_symbol_idx" ON "DynamicTriggerPerformance"("triggerType", "symbol");
CREATE INDEX IF NOT EXISTS "MarketRegimeDetection_symbol_timestamp_idx" ON "MarketRegimeDetection"("symbol", "timestamp");
CREATE INDEX IF NOT EXISTS "DynamicTriggerAlert_resolved_severity_idx" ON "DynamicTriggerAlert"("resolved", "severity");
CREATE INDEX IF NOT EXISTS "PerformanceComparison_period_endDate_idx" ON "PerformanceComparison"("period", "endDate");
CREATE INDEX IF NOT EXISTS "AdaptiveParameterChange_parameter_symbol_idx" ON "AdaptiveParameterChange"("parameter", "symbol");

-- Add comments for documentation
COMMENT ON TABLE "DynamicTriggerExecution" IS 'Tracks execution and lifecycle of dynamic triggers';
COMMENT ON TABLE "DynamicTriggerPerformance" IS 'Aggregated performance metrics for trigger types';
COMMENT ON TABLE "MarketRegimeDetection" IS 'Historical market regime classifications';
COMMENT ON TABLE "DynamicTriggerAlert" IS 'System alerts and notifications';
COMMENT ON TABLE "PerformanceComparison" IS 'Comparison between dynamic triggers and manual trading';
COMMENT ON TABLE "AdaptiveParameterChange" IS 'Tracks adaptive parameter optimizations';