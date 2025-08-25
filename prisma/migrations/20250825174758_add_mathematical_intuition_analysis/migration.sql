-- CreateTable
CREATE TABLE "public"."IntuitionAnalysis" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "originalConfidence" DOUBLE PRECISION NOT NULL,
    "signalPrice" DOUBLE PRECISION NOT NULL,
    "flowFieldResonance" DOUBLE PRECISION NOT NULL,
    "patternResonance" DOUBLE PRECISION NOT NULL,
    "temporalIntuition" DOUBLE PRECISION NOT NULL,
    "overallIntuition" DOUBLE PRECISION NOT NULL,
    "expectancyScore" DOUBLE PRECISION NOT NULL,
    "winRateProjection" DOUBLE PRECISION NOT NULL,
    "riskRewardRatio" DOUBLE PRECISION NOT NULL,
    "recommendation" TEXT NOT NULL,
    "performanceGap" DOUBLE PRECISION NOT NULL,
    "confidenceGap" DOUBLE PRECISION NOT NULL,
    "flowFieldData" TEXT,
    "patternData" TEXT,
    "temporalData" TEXT,
    "actualOutcome" TEXT,
    "actualPnL" DOUBLE PRECISION,
    "intuitionAccuracy" BOOLEAN,
    "calculationAccuracy" BOOLEAN,
    "outperformed" TEXT,
    "marketConditions" TEXT,
    "learningWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "analysisTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcomeTime" TIMESTAMP(3),

    CONSTRAINT "IntuitionAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IntuitionPerformance" (
    "id" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalAnalyses" INTEGER NOT NULL,
    "intuitionRecommended" INTEGER NOT NULL,
    "calculationRecommended" INTEGER NOT NULL,
    "intuitionCorrect" INTEGER NOT NULL,
    "calculationCorrect" INTEGER NOT NULL,
    "intuitionAccuracy" DOUBLE PRECISION NOT NULL,
    "calculationAccuracy" DOUBLE PRECISION NOT NULL,
    "intuitionAvgPnL" DOUBLE PRECISION NOT NULL,
    "calculationAvgPnL" DOUBLE PRECISION NOT NULL,
    "intuitionTotalPnL" DOUBLE PRECISION NOT NULL,
    "calculationTotalPnL" DOUBLE PRECISION NOT NULL,
    "performanceAdvantage" DOUBLE PRECISION NOT NULL,
    "avgIntuitionConfidence" DOUBLE PRECISION NOT NULL,
    "avgCalculationConfidence" DOUBLE PRECISION NOT NULL,
    "confidenceCorrelation" DOUBLE PRECISION NOT NULL,
    "strongTrendingPerformance" DOUBLE PRECISION NOT NULL,
    "rangingMarketPerformance" DOUBLE PRECISION NOT NULL,
    "volatileMarketPerformance" DOUBLE PRECISION NOT NULL,
    "improvementRate" DOUBLE PRECISION NOT NULL,
    "convergenceRate" DOUBLE PRECISION NOT NULL,
    "optimalBlendRatio" DOUBLE PRECISION NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntuitionPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IntuitionAnalysis_symbol_analysisTime_idx" ON "public"."IntuitionAnalysis"("symbol", "analysisTime");

-- CreateIndex
CREATE INDEX "IntuitionAnalysis_strategy_analysisTime_idx" ON "public"."IntuitionAnalysis"("strategy", "analysisTime");

-- CreateIndex
CREATE INDEX "IntuitionAnalysis_recommendation_idx" ON "public"."IntuitionAnalysis"("recommendation");

-- CreateIndex
CREATE INDEX "IntuitionAnalysis_actualOutcome_idx" ON "public"."IntuitionAnalysis"("actualOutcome");

-- CreateIndex
CREATE INDEX "IntuitionPerformance_timeframe_periodStart_idx" ON "public"."IntuitionPerformance"("timeframe", "periodStart");

-- CreateIndex
CREATE INDEX "IntuitionPerformance_calculatedAt_idx" ON "public"."IntuitionPerformance"("calculatedAt");
