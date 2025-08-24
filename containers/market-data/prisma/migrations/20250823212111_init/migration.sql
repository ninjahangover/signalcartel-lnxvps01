-- CreateTable
CREATE TABLE "public"."MarketData" (
    "id" SERIAL NOT NULL,
    "symbol" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,

    CONSTRAINT "MarketData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MarketDataCollection" (
    "id" SERIAL NOT NULL,
    "symbol" TEXT NOT NULL,
    "lastCollection" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,

    CONSTRAINT "MarketDataCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OHLCV" (
    "id" SERIAL NOT NULL,
    "symbol" TEXT NOT NULL,
    "open" DOUBLE PRECISION NOT NULL,
    "high" DOUBLE PRECISION NOT NULL,
    "low" DOUBLE PRECISION NOT NULL,
    "close" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "interval" TEXT NOT NULL,

    CONSTRAINT "OHLCV_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MarketStats" (
    "id" SERIAL NOT NULL,
    "symbol" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "avgPrice" DOUBLE PRECISION NOT NULL,
    "minPrice" DOUBLE PRECISION NOT NULL,
    "maxPrice" DOUBLE PRECISION NOT NULL,
    "volatility" DOUBLE PRECISION,
    "totalVolume" DOUBLE PRECISION,
    "dataPoints" INTEGER NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketData_symbol_timestamp_idx" ON "public"."MarketData"("symbol", "timestamp");

-- CreateIndex
CREATE INDEX "MarketData_timestamp_idx" ON "public"."MarketData"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "MarketDataCollection_symbol_key" ON "public"."MarketDataCollection"("symbol");

-- CreateIndex
CREATE INDEX "MarketDataCollection_symbol_idx" ON "public"."MarketDataCollection"("symbol");

-- CreateIndex
CREATE INDEX "OHLCV_symbol_interval_timestamp_idx" ON "public"."OHLCV"("symbol", "interval", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "OHLCV_symbol_timestamp_interval_key" ON "public"."OHLCV"("symbol", "timestamp", "interval");

-- CreateIndex
CREATE INDEX "MarketStats_symbol_period_idx" ON "public"."MarketStats"("symbol", "period");

-- CreateIndex
CREATE UNIQUE INDEX "MarketStats_symbol_period_calculatedAt_key" ON "public"."MarketStats"("symbol", "period", "calculatedAt");
