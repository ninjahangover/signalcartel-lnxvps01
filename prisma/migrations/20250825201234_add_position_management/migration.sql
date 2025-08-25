-- CreateTable
CREATE TABLE "public"."ManagedPosition" (
    "id" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "entryPrice" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "entryTradeId" TEXT NOT NULL,
    "entryTime" TIMESTAMP(3) NOT NULL,
    "exitPrice" DOUBLE PRECISION,
    "exitTradeId" TEXT,
    "exitTime" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'open',
    "realizedPnL" DOUBLE PRECISION,
    "unrealizedPnL" DOUBLE PRECISION,
    "stopLoss" DOUBLE PRECISION,
    "takeProfit" DOUBLE PRECISION,
    "maxHoldTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManagedPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ManagedTrade" (
    "id" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "strategy" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL,
    "pnl" DOUBLE PRECISION,
    "isEntry" BOOLEAN NOT NULL,

    CONSTRAINT "ManagedTrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExitStrategy" (
    "id" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "symbol" TEXT,
    "takeProfitPercent" DOUBLE PRECISION,
    "stopLossPercent" DOUBLE PRECISION,
    "trailingStopPercent" DOUBLE PRECISION,
    "maxHoldMinutes" INTEGER,
    "reverseSignalExit" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExitStrategy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ManagedPosition_strategy_symbol_idx" ON "public"."ManagedPosition"("strategy", "symbol");

-- CreateIndex
CREATE INDEX "ManagedPosition_status_idx" ON "public"."ManagedPosition"("status");

-- CreateIndex
CREATE INDEX "ManagedPosition_entryTime_idx" ON "public"."ManagedPosition"("entryTime");

-- CreateIndex
CREATE INDEX "ManagedPosition_symbol_status_idx" ON "public"."ManagedPosition"("symbol", "status");

-- CreateIndex
CREATE INDEX "ManagedTrade_positionId_idx" ON "public"."ManagedTrade"("positionId");

-- CreateIndex
CREATE INDEX "ManagedTrade_strategy_symbol_idx" ON "public"."ManagedTrade"("strategy", "symbol");

-- CreateIndex
CREATE INDEX "ManagedTrade_executedAt_idx" ON "public"."ManagedTrade"("executedAt");

-- CreateIndex
CREATE INDEX "ManagedTrade_isEntry_idx" ON "public"."ManagedTrade"("isEntry");

-- CreateIndex
CREATE INDEX "ExitStrategy_strategy_idx" ON "public"."ExitStrategy"("strategy");

-- CreateIndex
CREATE UNIQUE INDEX "ExitStrategy_strategy_symbol_key" ON "public"."ExitStrategy"("strategy", "symbol");

-- AddForeignKey
ALTER TABLE "public"."ManagedPosition" ADD CONSTRAINT "ManagedPosition_entryTradeId_fkey" FOREIGN KEY ("entryTradeId") REFERENCES "public"."ManagedTrade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ManagedPosition" ADD CONSTRAINT "ManagedPosition_exitTradeId_fkey" FOREIGN KEY ("exitTradeId") REFERENCES "public"."ManagedTrade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ManagedTrade" ADD CONSTRAINT "ManagedTrade_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "public"."ManagedPosition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
