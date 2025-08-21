-- CreateTable
CREATE TABLE "TradingSignal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "currentPrice" REAL NOT NULL,
    "targetPrice" REAL,
    "stopLoss" REAL,
    "confidence" REAL NOT NULL,
    "timeframe" TEXT,
    "indicators" TEXT,
    "marketRegime" TEXT,
    "volume" REAL,
    "executed" BOOLEAN NOT NULL DEFAULT false,
    "executedAt" DATETIME,
    "executionPrice" REAL,
    "outcome" TEXT,
    "pnl" REAL,
    "pnlPercent" REAL,
    "holdingPeriod" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "TradingSignal_symbol_idx" ON "TradingSignal"("symbol");

-- CreateIndex
CREATE INDEX "TradingSignal_strategy_idx" ON "TradingSignal"("strategy");

-- CreateIndex
CREATE INDEX "TradingSignal_executed_idx" ON "TradingSignal"("executed");

-- CreateIndex
CREATE INDEX "TradingSignal_createdAt_idx" ON "TradingSignal"("createdAt");
