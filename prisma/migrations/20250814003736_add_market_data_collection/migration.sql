-- CreateTable
CREATE TABLE "MarketDataCollection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "interval" INTEGER NOT NULL DEFAULT 60,
    "dataPoints" INTEGER NOT NULL DEFAULT 0,
    "completeness" REAL NOT NULL DEFAULT 0.0,
    "oldestData" DATETIME,
    "newestData" DATETIME,
    "lastCollected" DATETIME,
    "lastError" TEXT,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "errorDetails" TEXT,
    "avgResponseTime" REAL,
    "successRate" REAL NOT NULL DEFAULT 100.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MarketData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL DEFAULT '1m',
    "timestamp" DATETIME NOT NULL,
    "open" REAL NOT NULL,
    "high" REAL NOT NULL,
    "low" REAL NOT NULL,
    "close" REAL NOT NULL,
    "volume" REAL NOT NULL DEFAULT 0.0,
    "rsi" REAL,
    "macd" REAL,
    "macdSignal" REAL,
    "ema20" REAL,
    "ema50" REAL,
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
INSERT INTO "new_MarketData" ("atr", "bollinger_lower", "bollinger_upper", "close", "createdAt", "high", "id", "low", "momentum", "open", "rsi", "sma20", "sma50", "symbol", "timeframe", "timestamp", "volatility", "volume", "volumeProfile") SELECT "atr", "bollinger_lower", "bollinger_upper", "close", "createdAt", "high", "id", "low", "momentum", "open", "rsi", "sma20", "sma50", "symbol", "timeframe", "timestamp", "volatility", "volume", "volumeProfile" FROM "MarketData";
DROP TABLE "MarketData";
ALTER TABLE "new_MarketData" RENAME TO "MarketData";
CREATE INDEX "MarketData_symbol_timeframe_idx" ON "MarketData"("symbol", "timeframe");
CREATE INDEX "MarketData_timestamp_idx" ON "MarketData"("timestamp");
CREATE UNIQUE INDEX "MarketData_symbol_timeframe_timestamp_key" ON "MarketData"("symbol", "timeframe", "timestamp");
CREATE TABLE "new_PaperAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "platformAccountId" TEXT NOT NULL,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "initialBalance" REAL NOT NULL DEFAULT 1000000.0,
    "currentBalance" REAL NOT NULL,
    "dayTradingBuyingPower" REAL,
    "buyingPower" REAL,
    "equity" REAL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "lastResetAt" DATETIME,
    "totalTrades" INTEGER NOT NULL DEFAULT 0,
    "winningTrades" INTEGER NOT NULL DEFAULT 0,
    "totalPnL" REAL NOT NULL DEFAULT 0.0,
    "maxDrawdown" REAL NOT NULL DEFAULT 0.0,
    "bestDay" REAL NOT NULL DEFAULT 0.0,
    "worstDay" REAL NOT NULL DEFAULT 0.0,
    CONSTRAINT "PaperAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PaperAccount" ("apiKey", "apiSecret", "bestDay", "buyingPower", "createdAt", "currentBalance", "dayTradingBuyingPower", "equity", "expiresAt", "id", "initialBalance", "lastResetAt", "maxDrawdown", "platform", "platformAccountId", "status", "totalPnL", "totalTrades", "userId", "winningTrades", "worstDay") SELECT "apiKey", "apiSecret", "bestDay", "buyingPower", "createdAt", "currentBalance", "dayTradingBuyingPower", "equity", "expiresAt", "id", "initialBalance", "lastResetAt", "maxDrawdown", "platform", "platformAccountId", "status", "totalPnL", "totalTrades", "userId", "winningTrades", "worstDay" FROM "PaperAccount";
DROP TABLE "PaperAccount";
ALTER TABLE "new_PaperAccount" RENAME TO "PaperAccount";
CREATE INDEX "PaperAccount_userId_idx" ON "PaperAccount"("userId");
CREATE INDEX "PaperAccount_status_idx" ON "PaperAccount"("status");
CREATE INDEX "PaperAccount_platform_idx" ON "PaperAccount"("platform");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "MarketDataCollection_symbol_key" ON "MarketDataCollection"("symbol");

-- CreateIndex
CREATE INDEX "MarketDataCollection_symbol_idx" ON "MarketDataCollection"("symbol");

-- CreateIndex
CREATE INDEX "MarketDataCollection_status_idx" ON "MarketDataCollection"("status");

-- CreateIndex
CREATE INDEX "MarketDataCollection_enabled_idx" ON "MarketDataCollection"("enabled");
