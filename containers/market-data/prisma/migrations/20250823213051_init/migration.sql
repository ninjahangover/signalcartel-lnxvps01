/*
  Warnings:

  - You are about to drop the column `price` on the `MarketData` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `MarketDataCollection` table. All the data in the column will be lost.
  - You are about to drop the column `lastCollection` on the `MarketDataCollection` table. All the data in the column will be lost.
  - Added the required column `close` to the `MarketData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `high` to the `MarketData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `low` to the `MarketData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `open` to the `MarketData` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."MarketData" DROP COLUMN "price",
ADD COLUMN     "close" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "ema20" DOUBLE PRECISION,
ADD COLUMN     "high" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "low" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "open" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "rsi" DOUBLE PRECISION,
ALTER COLUMN "source" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."MarketDataCollection" DROP COLUMN "isActive",
DROP COLUMN "lastCollection",
ADD COLUMN     "completeness" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "dataPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "interval" INTEGER,
ADD COLUMN     "lastCollected" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "newestData" TIMESTAMP(3),
ADD COLUMN     "oldestData" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';
