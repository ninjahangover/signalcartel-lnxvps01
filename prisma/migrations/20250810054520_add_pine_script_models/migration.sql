-- CreateTable
CREATE TABLE "PineStrategy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pineScriptCode" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "strategyType" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL DEFAULT '1h',
    "tradingPairs" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isOptimized" BOOLEAN NOT NULL DEFAULT false,
    "currentWinRate" REAL,
    "totalTrades" INTEGER NOT NULL DEFAULT 0,
    "profitLoss" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastOptimizedAt" DATETIME,
    CONSTRAINT "PineStrategy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StrategyParameter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "strategyId" TEXT NOT NULL,
    "parameterName" TEXT NOT NULL,
    "parameterType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "currentValue" TEXT NOT NULL,
    "originalValue" TEXT NOT NULL,
    "minValue" TEXT,
    "maxValue" TEXT,
    "isOptimizable" BOOLEAN NOT NULL DEFAULT true,
    "optimizationPriority" INTEGER NOT NULL DEFAULT 1,
    "volatilityAdjustment" BOOLEAN NOT NULL DEFAULT false,
    "volumeAdjustment" BOOLEAN NOT NULL DEFAULT false,
    "momentumAdjustment" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastChangedAt" DATETIME,
    CONSTRAINT "StrategyParameter_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "PineStrategy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StrategyOptimization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "strategyId" TEXT NOT NULL,
    "optimizationType" TEXT NOT NULL,
    "triggerReason" TEXT NOT NULL,
    "parametersChanged" TEXT NOT NULL,
    "previousParameters" TEXT NOT NULL,
    "marketVolatility" REAL,
    "marketMomentum" REAL,
    "volumeAverage" REAL,
    "marketRegime" TEXT,
    "backtestResults" TEXT,
    "confidenceScore" REAL,
    "wasApplied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" DATETIME,
    CONSTRAINT "StrategyOptimization_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "PineStrategy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StrategyPerformance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "strategyId" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "totalTrades" INTEGER NOT NULL,
    "winningTrades" INTEGER NOT NULL,
    "losingTrades" INTEGER NOT NULL,
    "winRate" REAL NOT NULL,
    "totalPnL" REAL NOT NULL,
    "avgWin" REAL NOT NULL,
    "avgLoss" REAL NOT NULL,
    "maxDrawdown" REAL NOT NULL,
    "sharpeRatio" REAL,
    "avgVolatility" REAL,
    "avgVolume" REAL,
    "marketTrend" TEXT,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StrategyPerformance_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "PineStrategy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "open" REAL NOT NULL,
    "high" REAL NOT NULL,
    "low" REAL NOT NULL,
    "close" REAL NOT NULL,
    "volume" REAL NOT NULL,
    "rsi" REAL,
    "sma20" REAL,
    "sma50" REAL,
    "bollinger_upper" REAL,
    "bollinger_lower" REAL,
    "atr" REAL,
    "volatility" REAL,
    "momentum" REAL,
    "volumeProfile" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "StrategyParameter_strategyId_parameterName_key" ON "StrategyParameter"("strategyId", "parameterName");

-- CreateIndex
CREATE INDEX "MarketData_symbol_timeframe_idx" ON "MarketData"("symbol", "timeframe");

-- CreateIndex
CREATE INDEX "MarketData_timestamp_idx" ON "MarketData"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "MarketData_symbol_timeframe_timestamp_key" ON "MarketData"("symbol", "timeframe", "timestamp");
