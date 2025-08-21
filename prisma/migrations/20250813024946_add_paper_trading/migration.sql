-- CreateTable
CREATE TABLE "PaperAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "platformAccountId" TEXT NOT NULL,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "initialBalance" REAL NOT NULL DEFAULT 100000.0,
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

-- CreateTable
CREATE TABLE "PaperTradingSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paperAccountId" TEXT NOT NULL,
    "sessionName" TEXT,
    "strategy" TEXT,
    "sessionStart" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionEnd" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startingBalance" REAL NOT NULL,
    "startingEquity" REAL,
    "endingBalance" REAL,
    "endingEquity" REAL,
    "totalTrades" INTEGER NOT NULL DEFAULT 0,
    "winningTrades" INTEGER NOT NULL DEFAULT 0,
    "winRate" REAL NOT NULL DEFAULT 0.0,
    "totalPnL" REAL NOT NULL DEFAULT 0.0,
    "maxDrawdown" REAL NOT NULL DEFAULT 0.0,
    "sharpeRatio" REAL,
    "marketRegime" TEXT,
    "avgVolatility" REAL,
    "primarySymbols" TEXT,
    "notes" TEXT,
    "performanceNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaperTradingSession_paperAccountId_fkey" FOREIGN KEY ("paperAccountId") REFERENCES "PaperAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaperPosition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paperAccountId" TEXT NOT NULL,
    "sessionId" TEXT,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "avgEntryPrice" REAL NOT NULL,
    "currentPrice" REAL NOT NULL,
    "unrealizedPnL" REAL NOT NULL DEFAULT 0.0,
    "realizedPnL" REAL NOT NULL DEFAULT 0.0,
    "totalCost" REAL NOT NULL,
    "marketValue" REAL NOT NULL,
    "stopLoss" REAL,
    "takeProfit" REAL,
    "maxPositionValue" REAL,
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "strategy" TEXT,
    "entryReason" TEXT,
    "exitReason" TEXT,
    "holdingPeriod" INTEGER,
    "maxGain" REAL NOT NULL DEFAULT 0.0,
    "maxLoss" REAL NOT NULL DEFAULT 0.0,
    CONSTRAINT "PaperPosition_paperAccountId_fkey" FOREIGN KEY ("paperAccountId") REFERENCES "PaperAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaperOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paperAccountId" TEXT NOT NULL,
    "positionId" TEXT,
    "platformOrderId" TEXT,
    "clientOrderId" TEXT,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "orderType" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "limitPrice" REAL,
    "stopPrice" REAL,
    "filledPrice" REAL,
    "filledQuantity" REAL NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "timeInForce" TEXT NOT NULL DEFAULT 'day',
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filledAt" DATETIME,
    "cancelledAt" DATETIME,
    "strategy" TEXT,
    "orderReason" TEXT,
    CONSTRAINT "PaperOrder_paperAccountId_fkey" FOREIGN KEY ("paperAccountId") REFERENCES "PaperAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PaperOrder_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "PaperPosition" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaperTrade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "positionId" TEXT,
    "orderId" TEXT,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "price" REAL NOT NULL,
    "value" REAL NOT NULL,
    "commission" REAL NOT NULL DEFAULT 0.0,
    "fees" REAL NOT NULL DEFAULT 0.0,
    "netValue" REAL NOT NULL,
    "pnl" REAL,
    "pnlPercent" REAL,
    "isEntry" BOOLEAN NOT NULL,
    "tradeType" TEXT NOT NULL,
    "strategy" TEXT,
    "signalSource" TEXT,
    "confidence" REAL,
    "marketCondition" TEXT,
    "volatility" REAL,
    "volume" REAL,
    "executedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaperTrade_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PaperTradingSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PaperTrade_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "PaperPosition" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PaperTrade_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PaperOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaperPerformanceSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paperAccountId" TEXT NOT NULL,
    "snapshotDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period" TEXT NOT NULL,
    "accountBalance" REAL NOT NULL,
    "equity" REAL NOT NULL,
    "totalPnL" REAL NOT NULL,
    "dailyPnL" REAL NOT NULL,
    "tradesCount" INTEGER NOT NULL,
    "winningTrades" INTEGER NOT NULL,
    "winRate" REAL NOT NULL,
    "avgWin" REAL NOT NULL,
    "avgLoss" REAL NOT NULL,
    "profitFactor" REAL,
    "maxDrawdown" REAL NOT NULL,
    "currentDrawdown" REAL NOT NULL,
    "sharpeRatio" REAL,
    "sortinoRatio" REAL,
    "volatility" REAL,
    "openPositions" INTEGER NOT NULL,
    "totalExposure" REAL NOT NULL,
    "longExposure" REAL NOT NULL,
    "shortExposure" REAL NOT NULL,
    "marketCondition" TEXT,
    "benchmarkReturn" REAL,
    "correlation" REAL
);

-- CreateIndex
CREATE INDEX "PaperAccount_userId_idx" ON "PaperAccount"("userId");

-- CreateIndex
CREATE INDEX "PaperAccount_status_idx" ON "PaperAccount"("status");

-- CreateIndex
CREATE INDEX "PaperAccount_platform_idx" ON "PaperAccount"("platform");

-- CreateIndex
CREATE INDEX "PaperTradingSession_paperAccountId_idx" ON "PaperTradingSession"("paperAccountId");

-- CreateIndex
CREATE INDEX "PaperTradingSession_isActive_idx" ON "PaperTradingSession"("isActive");

-- CreateIndex
CREATE INDEX "PaperTradingSession_sessionStart_idx" ON "PaperTradingSession"("sessionStart");

-- CreateIndex
CREATE INDEX "PaperPosition_paperAccountId_idx" ON "PaperPosition"("paperAccountId");

-- CreateIndex
CREATE INDEX "PaperPosition_symbol_idx" ON "PaperPosition"("symbol");

-- CreateIndex
CREATE INDEX "PaperPosition_isOpen_idx" ON "PaperPosition"("isOpen");

-- CreateIndex
CREATE INDEX "PaperPosition_openedAt_idx" ON "PaperPosition"("openedAt");

-- CreateIndex
CREATE INDEX "PaperOrder_paperAccountId_idx" ON "PaperOrder"("paperAccountId");

-- CreateIndex
CREATE INDEX "PaperOrder_symbol_idx" ON "PaperOrder"("symbol");

-- CreateIndex
CREATE INDEX "PaperOrder_status_idx" ON "PaperOrder"("status");

-- CreateIndex
CREATE INDEX "PaperOrder_submittedAt_idx" ON "PaperOrder"("submittedAt");

-- CreateIndex
CREATE INDEX "PaperTrade_sessionId_idx" ON "PaperTrade"("sessionId");

-- CreateIndex
CREATE INDEX "PaperTrade_symbol_idx" ON "PaperTrade"("symbol");

-- CreateIndex
CREATE INDEX "PaperTrade_executedAt_idx" ON "PaperTrade"("executedAt");

-- CreateIndex
CREATE INDEX "PaperTrade_isEntry_idx" ON "PaperTrade"("isEntry");

-- CreateIndex
CREATE INDEX "PaperPerformanceSnapshot_paperAccountId_idx" ON "PaperPerformanceSnapshot"("paperAccountId");

-- CreateIndex
CREATE INDEX "PaperPerformanceSnapshot_snapshotDate_idx" ON "PaperPerformanceSnapshot"("snapshotDate");

-- CreateIndex
CREATE INDEX "PaperPerformanceSnapshot_period_idx" ON "PaperPerformanceSnapshot"("period");
