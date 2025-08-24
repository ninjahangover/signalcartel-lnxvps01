-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "subscriptionTier" TEXT NOT NULL DEFAULT 'none',
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'inactive',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "krakenApiKey" TEXT,
    "krakenSecretKey" TEXT,
    "apiKeysVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."AdminLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PineStrategy" (
    "id" TEXT NOT NULL,
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
    "currentWinRate" DOUBLE PRECISION,
    "totalTrades" INTEGER NOT NULL DEFAULT 0,
    "profitLoss" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastOptimizedAt" TIMESTAMP(3),

    CONSTRAINT "PineStrategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StrategyParameter" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastChangedAt" TIMESTAMP(3),

    CONSTRAINT "StrategyParameter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StrategyOptimization" (
    "id" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "optimizationType" TEXT NOT NULL,
    "triggerReason" TEXT NOT NULL,
    "parametersChanged" TEXT NOT NULL,
    "previousParameters" TEXT NOT NULL,
    "marketVolatility" DOUBLE PRECISION,
    "marketMomentum" DOUBLE PRECISION,
    "volumeAverage" DOUBLE PRECISION,
    "marketRegime" TEXT,
    "backtestResults" TEXT,
    "confidenceScore" DOUBLE PRECISION,
    "wasApplied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3),

    CONSTRAINT "StrategyOptimization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StrategyPerformance" (
    "id" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "totalTrades" INTEGER NOT NULL,
    "winningTrades" INTEGER NOT NULL,
    "losingTrades" INTEGER NOT NULL,
    "winRate" DOUBLE PRECISION NOT NULL,
    "totalPnL" DOUBLE PRECISION NOT NULL,
    "avgWin" DOUBLE PRECISION NOT NULL,
    "avgLoss" DOUBLE PRECISION NOT NULL,
    "maxDrawdown" DOUBLE PRECISION NOT NULL,
    "sharpeRatio" DOUBLE PRECISION,
    "avgVolatility" DOUBLE PRECISION,
    "avgVolume" DOUBLE PRECISION,
    "marketTrend" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StrategyPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MarketData" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL DEFAULT '1m',
    "timestamp" TIMESTAMP(3) NOT NULL,
    "open" DOUBLE PRECISION NOT NULL,
    "high" DOUBLE PRECISION NOT NULL,
    "low" DOUBLE PRECISION NOT NULL,
    "close" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "rsi" DOUBLE PRECISION,
    "macd" DOUBLE PRECISION,
    "macdSignal" DOUBLE PRECISION,
    "ema20" DOUBLE PRECISION,
    "ema50" DOUBLE PRECISION,
    "sma20" DOUBLE PRECISION,
    "sma50" DOUBLE PRECISION,
    "bollinger_upper" DOUBLE PRECISION,
    "bollinger_lower" DOUBLE PRECISION,
    "atr" DOUBLE PRECISION,
    "volatility" DOUBLE PRECISION,
    "momentum" DOUBLE PRECISION,
    "volumeProfile" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MarketDataCollection" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "interval" INTEGER NOT NULL DEFAULT 60,
    "dataPoints" INTEGER NOT NULL DEFAULT 0,
    "completeness" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "oldestData" TIMESTAMP(3),
    "newestData" TIMESTAMP(3),
    "lastCollected" TIMESTAMP(3),
    "lastError" TEXT,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "errorDetails" TEXT,
    "avgResponseTime" DOUBLE PRECISION,
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketDataCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TradingSignal" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "currentPrice" DOUBLE PRECISION NOT NULL,
    "targetPrice" DOUBLE PRECISION,
    "stopLoss" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION NOT NULL,
    "timeframe" TEXT,
    "indicators" TEXT,
    "marketRegime" TEXT,
    "volume" DOUBLE PRECISION,
    "executed" BOOLEAN NOT NULL DEFAULT false,
    "executedAt" TIMESTAMP(3),
    "executionPrice" DOUBLE PRECISION,
    "outcome" TEXT,
    "pnl" DOUBLE PRECISION,
    "pnlPercent" DOUBLE PRECISION,
    "holdingPeriod" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradingSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaperAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "platformAccountId" TEXT NOT NULL,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "initialBalance" DOUBLE PRECISION NOT NULL DEFAULT 1000000.0,
    "currentBalance" DOUBLE PRECISION NOT NULL,
    "dayTradingBuyingPower" DOUBLE PRECISION,
    "buyingPower" DOUBLE PRECISION,
    "equity" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "lastResetAt" TIMESTAMP(3),
    "totalTrades" INTEGER NOT NULL DEFAULT 0,
    "winningTrades" INTEGER NOT NULL DEFAULT 0,
    "totalPnL" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "maxDrawdown" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "bestDay" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "worstDay" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "PaperAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaperTradingSession" (
    "id" TEXT NOT NULL,
    "paperAccountId" TEXT NOT NULL,
    "sessionName" TEXT,
    "strategy" TEXT,
    "sessionStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionEnd" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startingBalance" DOUBLE PRECISION NOT NULL,
    "startingEquity" DOUBLE PRECISION,
    "endingBalance" DOUBLE PRECISION,
    "endingEquity" DOUBLE PRECISION,
    "totalTrades" INTEGER NOT NULL DEFAULT 0,
    "winningTrades" INTEGER NOT NULL DEFAULT 0,
    "winRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalPnL" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "maxDrawdown" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "sharpeRatio" DOUBLE PRECISION,
    "marketRegime" TEXT,
    "avgVolatility" DOUBLE PRECISION,
    "primarySymbols" TEXT,
    "notes" TEXT,
    "performanceNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaperTradingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaperPosition" (
    "id" TEXT NOT NULL,
    "paperAccountId" TEXT NOT NULL,
    "sessionId" TEXT,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "avgEntryPrice" DOUBLE PRECISION NOT NULL,
    "currentPrice" DOUBLE PRECISION NOT NULL,
    "unrealizedPnL" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "realizedPnL" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "marketValue" DOUBLE PRECISION NOT NULL,
    "stopLoss" DOUBLE PRECISION,
    "takeProfit" DOUBLE PRECISION,
    "maxPositionValue" DOUBLE PRECISION,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "strategy" TEXT,
    "entryReason" TEXT,
    "exitReason" TEXT,
    "holdingPeriod" INTEGER,
    "maxGain" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "maxLoss" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "PaperPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaperOrder" (
    "id" TEXT NOT NULL,
    "paperAccountId" TEXT NOT NULL,
    "positionId" TEXT,
    "platformOrderId" TEXT,
    "clientOrderId" TEXT,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "orderType" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "limitPrice" DOUBLE PRECISION,
    "stopPrice" DOUBLE PRECISION,
    "filledPrice" DOUBLE PRECISION,
    "filledQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "timeInForce" TEXT NOT NULL DEFAULT 'day',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filledAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "strategy" TEXT,
    "orderReason" TEXT,

    CONSTRAINT "PaperOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaperTrade" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "positionId" TEXT,
    "orderId" TEXT,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "fees" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "netValue" DOUBLE PRECISION NOT NULL,
    "pnl" DOUBLE PRECISION,
    "pnlPercent" DOUBLE PRECISION,
    "isEntry" BOOLEAN NOT NULL,
    "tradeType" TEXT NOT NULL,
    "strategy" TEXT,
    "signalSource" TEXT,
    "confidence" DOUBLE PRECISION,
    "marketCondition" TEXT,
    "volatility" DOUBLE PRECISION,
    "volume" DOUBLE PRECISION,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaperTrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaperPerformanceSnapshot" (
    "id" TEXT NOT NULL,
    "paperAccountId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period" TEXT NOT NULL,
    "accountBalance" DOUBLE PRECISION NOT NULL,
    "equity" DOUBLE PRECISION NOT NULL,
    "totalPnL" DOUBLE PRECISION NOT NULL,
    "dailyPnL" DOUBLE PRECISION NOT NULL,
    "tradesCount" INTEGER NOT NULL,
    "winningTrades" INTEGER NOT NULL,
    "winRate" DOUBLE PRECISION NOT NULL,
    "avgWin" DOUBLE PRECISION NOT NULL,
    "avgLoss" DOUBLE PRECISION NOT NULL,
    "profitFactor" DOUBLE PRECISION,
    "maxDrawdown" DOUBLE PRECISION NOT NULL,
    "currentDrawdown" DOUBLE PRECISION NOT NULL,
    "sharpeRatio" DOUBLE PRECISION,
    "sortinoRatio" DOUBLE PRECISION,
    "volatility" DOUBLE PRECISION,
    "openPositions" INTEGER NOT NULL,
    "totalExposure" DOUBLE PRECISION NOT NULL,
    "longExposure" DOUBLE PRECISION NOT NULL,
    "shortExposure" DOUBLE PRECISION NOT NULL,
    "marketCondition" TEXT,
    "benchmarkReturn" DOUBLE PRECISION,
    "correlation" DOUBLE PRECISION,

    CONSTRAINT "PaperPerformanceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SentimentData" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "tweetCount" INTEGER,
    "positiveCount" INTEGER,
    "negativeCount" INTEGER,
    "neutralCount" INTEGER,
    "keywords" TEXT,
    "rawData" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processingTime" INTEGER,

    CONSTRAINT "SentimentData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EnhancedTradingSignal" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "technicalScore" DOUBLE PRECISION NOT NULL,
    "technicalAction" TEXT NOT NULL,
    "sentimentScore" DOUBLE PRECISION,
    "sentimentConfidence" DOUBLE PRECISION,
    "sentimentConflict" BOOLEAN NOT NULL DEFAULT false,
    "combinedConfidence" DOUBLE PRECISION NOT NULL,
    "finalAction" TEXT NOT NULL,
    "confidenceBoost" DOUBLE PRECISION,
    "wasExecuted" BOOLEAN NOT NULL DEFAULT false,
    "executeReason" TEXT,
    "tradeId" TEXT,
    "signalTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executionTime" TIMESTAMP(3),

    CONSTRAINT "EnhancedTradingSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "public"."VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "StrategyParameter_strategyId_parameterName_key" ON "public"."StrategyParameter"("strategyId", "parameterName");

-- CreateIndex
CREATE INDEX "MarketData_symbol_timeframe_idx" ON "public"."MarketData"("symbol", "timeframe");

-- CreateIndex
CREATE INDEX "MarketData_timestamp_idx" ON "public"."MarketData"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "MarketData_symbol_timeframe_timestamp_key" ON "public"."MarketData"("symbol", "timeframe", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "MarketDataCollection_symbol_key" ON "public"."MarketDataCollection"("symbol");

-- CreateIndex
CREATE INDEX "MarketDataCollection_symbol_idx" ON "public"."MarketDataCollection"("symbol");

-- CreateIndex
CREATE INDEX "MarketDataCollection_status_idx" ON "public"."MarketDataCollection"("status");

-- CreateIndex
CREATE INDEX "MarketDataCollection_enabled_idx" ON "public"."MarketDataCollection"("enabled");

-- CreateIndex
CREATE INDEX "TradingSignal_symbol_idx" ON "public"."TradingSignal"("symbol");

-- CreateIndex
CREATE INDEX "TradingSignal_strategy_idx" ON "public"."TradingSignal"("strategy");

-- CreateIndex
CREATE INDEX "TradingSignal_executed_idx" ON "public"."TradingSignal"("executed");

-- CreateIndex
CREATE INDEX "TradingSignal_createdAt_idx" ON "public"."TradingSignal"("createdAt");

-- CreateIndex
CREATE INDEX "PaperAccount_userId_idx" ON "public"."PaperAccount"("userId");

-- CreateIndex
CREATE INDEX "PaperAccount_status_idx" ON "public"."PaperAccount"("status");

-- CreateIndex
CREATE INDEX "PaperAccount_platform_idx" ON "public"."PaperAccount"("platform");

-- CreateIndex
CREATE INDEX "PaperTradingSession_paperAccountId_idx" ON "public"."PaperTradingSession"("paperAccountId");

-- CreateIndex
CREATE INDEX "PaperTradingSession_isActive_idx" ON "public"."PaperTradingSession"("isActive");

-- CreateIndex
CREATE INDEX "PaperTradingSession_sessionStart_idx" ON "public"."PaperTradingSession"("sessionStart");

-- CreateIndex
CREATE INDEX "PaperPosition_paperAccountId_idx" ON "public"."PaperPosition"("paperAccountId");

-- CreateIndex
CREATE INDEX "PaperPosition_symbol_idx" ON "public"."PaperPosition"("symbol");

-- CreateIndex
CREATE INDEX "PaperPosition_isOpen_idx" ON "public"."PaperPosition"("isOpen");

-- CreateIndex
CREATE INDEX "PaperPosition_openedAt_idx" ON "public"."PaperPosition"("openedAt");

-- CreateIndex
CREATE INDEX "PaperOrder_paperAccountId_idx" ON "public"."PaperOrder"("paperAccountId");

-- CreateIndex
CREATE INDEX "PaperOrder_symbol_idx" ON "public"."PaperOrder"("symbol");

-- CreateIndex
CREATE INDEX "PaperOrder_status_idx" ON "public"."PaperOrder"("status");

-- CreateIndex
CREATE INDEX "PaperOrder_submittedAt_idx" ON "public"."PaperOrder"("submittedAt");

-- CreateIndex
CREATE INDEX "PaperTrade_sessionId_idx" ON "public"."PaperTrade"("sessionId");

-- CreateIndex
CREATE INDEX "PaperTrade_symbol_idx" ON "public"."PaperTrade"("symbol");

-- CreateIndex
CREATE INDEX "PaperTrade_executedAt_idx" ON "public"."PaperTrade"("executedAt");

-- CreateIndex
CREATE INDEX "PaperTrade_isEntry_idx" ON "public"."PaperTrade"("isEntry");

-- CreateIndex
CREATE INDEX "PaperPerformanceSnapshot_paperAccountId_idx" ON "public"."PaperPerformanceSnapshot"("paperAccountId");

-- CreateIndex
CREATE INDEX "PaperPerformanceSnapshot_snapshotDate_idx" ON "public"."PaperPerformanceSnapshot"("snapshotDate");

-- CreateIndex
CREATE INDEX "PaperPerformanceSnapshot_period_idx" ON "public"."PaperPerformanceSnapshot"("period");

-- CreateIndex
CREATE INDEX "SentimentData_symbol_timestamp_idx" ON "public"."SentimentData"("symbol", "timestamp");

-- CreateIndex
CREATE INDEX "SentimentData_source_timestamp_idx" ON "public"."SentimentData"("source", "timestamp");

-- CreateIndex
CREATE INDEX "SentimentData_score_confidence_idx" ON "public"."SentimentData"("score", "confidence");

-- CreateIndex
CREATE INDEX "EnhancedTradingSignal_symbol_signalTime_idx" ON "public"."EnhancedTradingSignal"("symbol", "signalTime");

-- CreateIndex
CREATE INDEX "EnhancedTradingSignal_strategy_signalTime_idx" ON "public"."EnhancedTradingSignal"("strategy", "signalTime");

-- CreateIndex
CREATE INDEX "EnhancedTradingSignal_wasExecuted_idx" ON "public"."EnhancedTradingSignal"("wasExecuted");

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdminLog" ADD CONSTRAINT "AdminLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PineStrategy" ADD CONSTRAINT "PineStrategy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StrategyParameter" ADD CONSTRAINT "StrategyParameter_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "public"."PineStrategy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StrategyOptimization" ADD CONSTRAINT "StrategyOptimization_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "public"."PineStrategy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StrategyPerformance" ADD CONSTRAINT "StrategyPerformance_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "public"."PineStrategy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaperAccount" ADD CONSTRAINT "PaperAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaperTradingSession" ADD CONSTRAINT "PaperTradingSession_paperAccountId_fkey" FOREIGN KEY ("paperAccountId") REFERENCES "public"."PaperAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaperPosition" ADD CONSTRAINT "PaperPosition_paperAccountId_fkey" FOREIGN KEY ("paperAccountId") REFERENCES "public"."PaperAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaperOrder" ADD CONSTRAINT "PaperOrder_paperAccountId_fkey" FOREIGN KEY ("paperAccountId") REFERENCES "public"."PaperAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaperOrder" ADD CONSTRAINT "PaperOrder_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "public"."PaperPosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaperTrade" ADD CONSTRAINT "PaperTrade_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."PaperTradingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaperTrade" ADD CONSTRAINT "PaperTrade_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "public"."PaperPosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaperTrade" ADD CONSTRAINT "PaperTrade_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."PaperOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
