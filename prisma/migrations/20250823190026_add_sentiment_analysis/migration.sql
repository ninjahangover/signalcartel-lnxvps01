-- CreateTable
CREATE TABLE "SentimentData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "confidence" REAL NOT NULL,
    "tweetCount" INTEGER,
    "positiveCount" INTEGER,
    "negativeCount" INTEGER,
    "neutralCount" INTEGER,
    "keywords" TEXT,
    "rawData" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processingTime" INTEGER
);

-- CreateTable
CREATE TABLE "EnhancedTradingSignal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "technicalScore" REAL NOT NULL,
    "technicalAction" TEXT NOT NULL,
    "sentimentScore" REAL,
    "sentimentConfidence" REAL,
    "sentimentConflict" BOOLEAN NOT NULL DEFAULT false,
    "combinedConfidence" REAL NOT NULL,
    "finalAction" TEXT NOT NULL,
    "confidenceBoost" REAL,
    "wasExecuted" BOOLEAN NOT NULL DEFAULT false,
    "executeReason" TEXT,
    "tradeId" TEXT,
    "signalTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executionTime" DATETIME
);

-- CreateIndex
CREATE INDEX "SentimentData_symbol_timestamp_idx" ON "SentimentData"("symbol", "timestamp");

-- CreateIndex
CREATE INDEX "SentimentData_source_timestamp_idx" ON "SentimentData"("source", "timestamp");

-- CreateIndex
CREATE INDEX "SentimentData_score_confidence_idx" ON "SentimentData"("score", "confidence");

-- CreateIndex
CREATE INDEX "EnhancedTradingSignal_symbol_signalTime_idx" ON "EnhancedTradingSignal"("symbol", "signalTime");

-- CreateIndex
CREATE INDEX "EnhancedTradingSignal_strategy_signalTime_idx" ON "EnhancedTradingSignal"("strategy", "signalTime");

-- CreateIndex
CREATE INDEX "EnhancedTradingSignal_wasExecuted_idx" ON "EnhancedTradingSignal"("wasExecuted");
