-- CreateTable
CREATE TABLE "public"."LiveTradingSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionName" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "exchange" TEXT NOT NULL DEFAULT 'kraken',
    "mode" TEXT NOT NULL DEFAULT 'validate',
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "startedAt" TIMESTAMP(3),
    "stoppedAt" TIMESTAMP(3),
    "initialCapital" DOUBLE PRECISION NOT NULL,
    "currentCapital" DOUBLE PRECISION NOT NULL,
    "totalExposure" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "maxDailyLoss" DOUBLE PRECISION NOT NULL,
    "maxPositionSize" DOUBLE PRECISION NOT NULL,
    "maxTotalExposure" DOUBLE PRECISION NOT NULL DEFAULT 80.0,
    "totalTrades" INTEGER NOT NULL DEFAULT 0,
    "winningTrades" INTEGER NOT NULL DEFAULT 0,
    "totalPnL" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "dailyPnL" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "maxDrawdown" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "averageWin" DOUBLE PRECISION,
    "averageLoss" DOUBLE PRECISION,
    "profitFactor" DOUBLE PRECISION,
    "sharpeRatio" DOUBLE PRECISION,
    "emergencyStopTriggered" BOOLEAN NOT NULL DEFAULT false,
    "emergencyStopReason" TEXT,
    "emergencyStopTime" TIMESTAMP(3),
    "sessionNotes" TEXT,
    "riskParameters" TEXT,
    "tradingHours" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveTradingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LivePosition" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "entryPrice" DOUBLE PRECISION NOT NULL,
    "entryValue" DOUBLE PRECISION NOT NULL,
    "entryTime" TIMESTAMP(3) NOT NULL,
    "entryTradeIds" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "currentPrice" DOUBLE PRECISION,
    "unrealizedPnL" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "exitPrice" DOUBLE PRECISION,
    "exitValue" DOUBLE PRECISION,
    "exitTime" TIMESTAMP(3),
    "exitTradeIds" TEXT,
    "realizedPnL" DOUBLE PRECISION,
    "stopLossPrice" DOUBLE PRECISION,
    "takeProfitPrice" DOUBLE PRECISION,
    "trailingStopPrice" DOUBLE PRECISION,
    "maxHoldTime" INTEGER,
    "totalCommissions" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalFees" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "netPnL" DOUBLE PRECISION,
    "positionNotes" TEXT,
    "marketConditions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LivePosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LiveTrade" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "positionId" TEXT,
    "exchangeOrderId" TEXT,
    "exchangeTradeId" TEXT,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "fees" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "netValue" DOUBLE PRECISION NOT NULL,
    "purpose" TEXT NOT NULL,
    "isEntry" BOOLEAN NOT NULL,
    "strategy" TEXT NOT NULL,
    "signalConfidence" DOUBLE PRECISION,
    "signalSource" TEXT,
    "preTradeRisk" TEXT,
    "portfolioImpact" DOUBLE PRECISION,
    "requestedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "executedAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "orderStatus" TEXT NOT NULL DEFAULT 'pending',
    "fillStatus" TEXT NOT NULL DEFAULT 'unfilled',
    "filledQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "remainingQuantity" DOUBLE PRECISION NOT NULL,
    "marketPrice" DOUBLE PRECISION,
    "spread" DOUBLE PRECISION,
    "slippage" DOUBLE PRECISION,
    "marketCondition" TEXT,
    "pnl" DOUBLE PRECISION,
    "pnlPercent" DOUBLE PRECISION,
    "holdingPeriod" INTEGER,
    "tradeNotes" TEXT,
    "riskNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveTrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LiveTradeFailure" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "intendedPrice" DOUBLE PRECISION,
    "strategy" TEXT NOT NULL,
    "failureType" TEXT NOT NULL,
    "errorCode" TEXT,
    "errorMessage" TEXT NOT NULL,
    "exchangeResponse" TEXT,
    "portfolioState" TEXT,
    "riskAssessment" TEXT,
    "signalSource" TEXT,
    "signalConfidence" DOUBLE PRECISION,
    "marketCondition" TEXT,
    "retryAttempted" BOOLEAN NOT NULL DEFAULT false,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "alternativeAction" TEXT,
    "opportunityCost" DOUBLE PRECISION,
    "riskAvoided" DOUBLE PRECISION,
    "wasPreventable" BOOLEAN,
    "lessonLearned" TEXT,
    "systemImprovement" TEXT,
    "attemptedAt" TIMESTAMP(3) NOT NULL,
    "failedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "LiveTradeFailure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LivePerformanceSnapshot" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "snapshotTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "intervalType" TEXT NOT NULL,
    "accountBalance" DOUBLE PRECISION NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "totalExposure" DOUBLE PRECISION NOT NULL,
    "availableMargin" DOUBLE PRECISION NOT NULL,
    "totalPnL" DOUBLE PRECISION NOT NULL,
    "dailyPnL" DOUBLE PRECISION NOT NULL,
    "unrealizedPnL" DOUBLE PRECISION NOT NULL,
    "realizedPnL" DOUBLE PRECISION NOT NULL,
    "tradesCount" INTEGER NOT NULL,
    "winningTrades" INTEGER NOT NULL,
    "losingTrades" INTEGER NOT NULL,
    "winRate" DOUBLE PRECISION NOT NULL,
    "currentDrawdown" DOUBLE PRECISION NOT NULL,
    "maxDrawdown" DOUBLE PRECISION NOT NULL,
    "riskExposure" DOUBLE PRECISION NOT NULL,
    "leverageRatio" DOUBLE PRECISION,
    "openPositions" INTEGER NOT NULL,
    "longPositions" INTEGER NOT NULL,
    "shortPositions" INTEGER NOT NULL,
    "avgPositionSize" DOUBLE PRECISION NOT NULL,
    "profitFactor" DOUBLE PRECISION,
    "sharpeRatio" DOUBLE PRECISION,
    "sortinoRatio" DOUBLE PRECISION,
    "calmarRatio" DOUBLE PRECISION,
    "marketVolatility" DOUBLE PRECISION,
    "correlationToMarket" DOUBLE PRECISION,
    "marketCondition" TEXT,
    "executionLatency" DOUBLE PRECISION,
    "apiResponseTime" DOUBLE PRECISION,
    "systemUptime" DOUBLE PRECISION NOT NULL DEFAULT 100.0,

    CONSTRAINT "LivePerformanceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LiveTradingSystemHealth" (
    "id" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "processId" INTEGER NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "uptime" INTEGER NOT NULL,
    "lastHeartbeat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cpuUsage" DOUBLE PRECISION NOT NULL,
    "memoryUsage" DOUBLE PRECISION NOT NULL,
    "diskUsage" DOUBLE PRECISION,
    "networkLatency" DOUBLE PRECISION,
    "activeSessions" INTEGER NOT NULL DEFAULT 0,
    "pendingOrders" INTEGER NOT NULL DEFAULT 0,
    "apiCallsPerMin" INTEGER NOT NULL DEFAULT 0,
    "errorRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "krakenStatus" TEXT NOT NULL DEFAULT 'unknown',
    "krakenLatency" DOUBLE PRECISION,
    "dataFeedStatus" TEXT NOT NULL DEFAULT 'unknown',
    "lastMarketData" TIMESTAMP(3),
    "totalExposure" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "riskLimit" DOUBLE PRECISION NOT NULL,
    "emergencyStops" INTEGER NOT NULL DEFAULT 0,
    "activeAlerts" TEXT,
    "warningMessages" TEXT,
    "criticalIssues" TEXT,
    "lastRecoveryTime" TIMESTAMP(3),
    "recoveryCount" INTEGER NOT NULL DEFAULT 0,
    "backupStatus" TEXT NOT NULL DEFAULT 'unknown',
    "reportTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveTradingSystemHealth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserLiveTradingSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "liveTradingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "maxDailyRisk" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "maxPositionSize" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "maxSimultaneousPos" INTEGER NOT NULL DEFAULT 3,
    "preferredExchange" TEXT NOT NULL DEFAULT 'kraken',
    "exchangeApiKey" TEXT,
    "exchangeApiSecret" TEXT,
    "exchangePassphrase" TEXT,
    "testMode" BOOLEAN NOT NULL DEFAULT true,
    "riskTolerance" TEXT NOT NULL DEFAULT 'conservative',
    "emergencyStopEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emergencyStopLoss" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "tradingHours" TEXT,
    "weekendTrading" BOOLEAN NOT NULL DEFAULT false,
    "holidayTrading" BOOLEAN NOT NULL DEFAULT false,
    "enableEmailAlerts" BOOLEAN NOT NULL DEFAULT true,
    "enableSmsAlerts" BOOLEAN NOT NULL DEFAULT false,
    "emergencyContacts" TEXT,
    "liveTradingStartDate" TIMESTAMP(3),
    "totalLiveCapital" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "lifetimePnL" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "bestSession" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "worstSession" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLiveTradeAt" TIMESTAMP(3),

    CONSTRAINT "UserLiveTradingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LiveTradingSession_userId_idx" ON "public"."LiveTradingSession"("userId");

-- CreateIndex
CREATE INDEX "LiveTradingSession_status_idx" ON "public"."LiveTradingSession"("status");

-- CreateIndex
CREATE INDEX "LiveTradingSession_exchange_idx" ON "public"."LiveTradingSession"("exchange");

-- CreateIndex
CREATE INDEX "LiveTradingSession_startedAt_idx" ON "public"."LiveTradingSession"("startedAt");

-- CreateIndex
CREATE INDEX "LivePosition_sessionId_idx" ON "public"."LivePosition"("sessionId");

-- CreateIndex
CREATE INDEX "LivePosition_symbol_idx" ON "public"."LivePosition"("symbol");

-- CreateIndex
CREATE INDEX "LivePosition_status_idx" ON "public"."LivePosition"("status");

-- CreateIndex
CREATE INDEX "LivePosition_strategy_idx" ON "public"."LivePosition"("strategy");

-- CreateIndex
CREATE INDEX "LivePosition_entryTime_idx" ON "public"."LivePosition"("entryTime");

-- CreateIndex
CREATE INDEX "LiveTrade_sessionId_idx" ON "public"."LiveTrade"("sessionId");

-- CreateIndex
CREATE INDEX "LiveTrade_symbol_idx" ON "public"."LiveTrade"("symbol");

-- CreateIndex
CREATE INDEX "LiveTrade_strategy_idx" ON "public"."LiveTrade"("strategy");

-- CreateIndex
CREATE INDEX "LiveTrade_executedAt_idx" ON "public"."LiveTrade"("executedAt");

-- CreateIndex
CREATE INDEX "LiveTrade_orderStatus_idx" ON "public"."LiveTrade"("orderStatus");

-- CreateIndex
CREATE INDEX "LiveTrade_isEntry_idx" ON "public"."LiveTrade"("isEntry");

-- CreateIndex
CREATE INDEX "LiveTrade_exchangeOrderId_idx" ON "public"."LiveTrade"("exchangeOrderId");

-- CreateIndex
CREATE INDEX "LiveTradeFailure_sessionId_idx" ON "public"."LiveTradeFailure"("sessionId");

-- CreateIndex
CREATE INDEX "LiveTradeFailure_failureType_idx" ON "public"."LiveTradeFailure"("failureType");

-- CreateIndex
CREATE INDEX "LiveTradeFailure_symbol_idx" ON "public"."LiveTradeFailure"("symbol");

-- CreateIndex
CREATE INDEX "LiveTradeFailure_strategy_idx" ON "public"."LiveTradeFailure"("strategy");

-- CreateIndex
CREATE INDEX "LiveTradeFailure_failedAt_idx" ON "public"."LiveTradeFailure"("failedAt");

-- CreateIndex
CREATE INDEX "LivePerformanceSnapshot_sessionId_idx" ON "public"."LivePerformanceSnapshot"("sessionId");

-- CreateIndex
CREATE INDEX "LivePerformanceSnapshot_snapshotTime_idx" ON "public"."LivePerformanceSnapshot"("snapshotTime");

-- CreateIndex
CREATE INDEX "LivePerformanceSnapshot_intervalType_idx" ON "public"."LivePerformanceSnapshot"("intervalType");

-- CreateIndex
CREATE INDEX "LiveTradingSystemHealth_hostname_idx" ON "public"."LiveTradingSystemHealth"("hostname");

-- CreateIndex
CREATE INDEX "LiveTradingSystemHealth_status_idx" ON "public"."LiveTradingSystemHealth"("status");

-- CreateIndex
CREATE INDEX "LiveTradingSystemHealth_reportTime_idx" ON "public"."LiveTradingSystemHealth"("reportTime");

-- CreateIndex
CREATE INDEX "LiveTradingSystemHealth_lastHeartbeat_idx" ON "public"."LiveTradingSystemHealth"("lastHeartbeat");

-- CreateIndex
CREATE UNIQUE INDEX "UserLiveTradingSettings_userId_key" ON "public"."UserLiveTradingSettings"("userId");

-- CreateIndex
CREATE INDEX "UserLiveTradingSettings_userId_idx" ON "public"."UserLiveTradingSettings"("userId");

-- CreateIndex
CREATE INDEX "UserLiveTradingSettings_liveTradingEnabled_idx" ON "public"."UserLiveTradingSettings"("liveTradingEnabled");

-- AddForeignKey
ALTER TABLE "public"."LiveTradingSession" ADD CONSTRAINT "LiveTradingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LivePosition" ADD CONSTRAINT "LivePosition_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."LiveTradingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LiveTrade" ADD CONSTRAINT "LiveTrade_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."LiveTradingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LiveTrade" ADD CONSTRAINT "LiveTrade_entryPosition_fkey" FOREIGN KEY ("positionId") REFERENCES "public"."LivePosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LiveTrade" ADD CONSTRAINT "LiveTrade_exitPosition_fkey" FOREIGN KEY ("positionId") REFERENCES "public"."LivePosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LiveTradeFailure" ADD CONSTRAINT "LiveTradeFailure_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."LiveTradingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LivePerformanceSnapshot" ADD CONSTRAINT "LivePerformanceSnapshot_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."LiveTradingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserLiveTradingSettings" ADD CONSTRAINT "UserLiveTradingSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
