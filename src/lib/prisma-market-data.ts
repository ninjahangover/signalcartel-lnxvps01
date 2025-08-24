import { PrismaClient } from '.prisma/market-data-client';

// Configure PostgreSQL client for market data
const marketDataDatabaseUrl = process.env.NODE_ENV === 'production' 
  ? 'postgresql://warehouse_user:quantum_forge_warehouse_2024@signalcartel-warehouse:5432/marketdata?schema=public'
  : 'postgresql://warehouse_user:quantum_forge_warehouse_2024@localhost:5433/marketdata?schema=public';

const globalForMarketDataPrisma = globalThis as unknown as {
  marketDataPrisma: PrismaClient | undefined;
};

export const marketDataPrisma = globalForMarketDataPrisma.marketDataPrisma ?? 
  new PrismaClient({
    datasources: {
      db: {
        url: marketDataDatabaseUrl
      }
    }
  });

if (process.env.NODE_ENV !== 'production') globalForMarketDataPrisma.marketDataPrisma = marketDataPrisma;