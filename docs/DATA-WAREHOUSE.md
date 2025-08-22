# QUANTUM FORGE™ Data Warehouse

## 🎯 **Strategic Overview**

The Data Warehouse is a separate PostgreSQL database optimized for long-term analytics and pattern recognition. It complements the operational SQLite database by providing:

- **Long-term Data Storage**: Years of historical market data and trading activity
- **Advanced Analytics**: Complex queries for strategy optimization and market analysis  
- **Pattern Recognition**: Multi-year trend analysis and seasonal effect detection
- **Performance Optimization**: Separate from real-time operations for better performance

## 🏗️ **Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    QUANTUM FORGE™ ECOSYSTEM                  │
├─────────────────────────────────────────────────────────────┤
│  Operational DB (SQLite)     │   Data Warehouse (PostgreSQL)│
│  ├─ Real-time trades         │   ├─ Historical trades       │
│  ├─ Active strategies        │   ├─ Market cycles           │
│  ├─ 7-day optimization       │   ├─ Seasonal patterns       │
│  └─ High I/O performance     │   └─ Multi-year analysis     │
└─────────────────────────────────────────────────────────────┘
```

## 📊 **Database Schema**

### Core Tables

1. **`historical_market_data`** - Time-series market data with technical indicators
2. **`historical_trades`** - Complete trading history with context and performance metrics
3. **`strategy_performance_snapshots`** - Daily performance summaries by strategy
4. **`market_regimes`** - Bull/bear/sideways market classification periods

### Key Features

- **Monthly Partitioning**: Automatic partitioning for performance
- **Pre-calculated Indicators**: RSI, MACD, Bollinger Bands, etc.
- **Quality Scoring**: Data completeness and accuracy tracking
- **Market Context**: Regime detection and volatility classification

## 🚀 **Quick Start**

### 1. Start the Warehouse

```bash
# Start PostgreSQL data warehouse
docker-compose -f containers/database/postgres-warehouse.yml up -d

# Verify it's running
docker ps | grep warehouse
```

### 2. Test the Connection

```bash
# Run the test script
npx tsx -r dotenv/config test-warehouse-setup.ts
```

### 3. Set Up Environment Variables

```bash
# Copy example config
cp containers/database/.env.warehouse.example .env.warehouse

# Edit with your settings
nano .env.warehouse
```

## 🔄 **Data Pipeline**

### Automatic Sync Process

The warehouse automatically syncs data from the operational database:

1. **Trades**: New trades are synced every hour
2. **Market Data**: Price and indicator data synced in batches
3. **Performance Metrics**: Daily snapshots generated automatically
4. **Market Regimes**: Trend analysis updated weekly

### Manual Sync

```typescript
import { syncToWarehouse } from './src/lib/warehouse-data-pipeline';

// Sync all data types
await syncToWarehouse();

// Or sync specific data
await warehouseDataPipeline.syncTrades(1000);
await warehouseDataPipeline.syncMarketData('BTCUSD', 5000);
```

## 📈 **Analytics Capabilities**

### Long-term Strategy Analysis

```typescript
import { getLongTermStrategyAnalytics } from './src/lib/warehouse-data-pipeline';

// Get 1 year of strategy performance
const analytics = await getLongTermStrategyAnalytics('RSI_Strategy', 365);

// Analyze weekly trends, win rates, and market conditions
console.log(analytics);
```

### Built-in Views

- **`v_strategy_performance_30d`** - Recent strategy performance
- **`v_daily_volume_trend`** - Trading volume trends by symbol
- **`v_current_market_conditions`** - Current market regime classification

### Custom Analytics Queries

```sql
-- Strategy performance during different market regimes
SELECT 
    h.strategy_name,
    mr.regime_type,
    COUNT(*) as trades,
    AVG(h.pnl) as avg_pnl,
    AVG(CASE WHEN h.pnl > 0 THEN 1.0 ELSE 0.0 END) as win_rate
FROM historical_trades h
JOIN market_regimes mr ON h.symbol = mr.symbol 
    AND h.timestamp BETWEEN mr.start_date AND COALESCE(mr.end_date, CURRENT_DATE)
WHERE h.timestamp >= NOW() - INTERVAL '1 year'
GROUP BY h.strategy_name, mr.regime_type
ORDER BY avg_pnl DESC;
```

## 🛠️ **Maintenance**

### Automatic Maintenance

- **Partition Management**: New monthly partitions created automatically
- **Data Cleanup**: Old data (>2 years) removed automatically
- **Performance Monitoring**: Built-in pg_stat_statements extension

### Manual Maintenance

```sql
-- Create new partitions
SELECT create_monthly_partitions();

-- Check data completeness
SELECT calculate_data_completeness('BTCUSD', '2024-01-01', '2024-12-31');

-- Clean up old data
DELETE FROM historical_market_data WHERE timestamp < NOW() - INTERVAL '2 years';
```

## 🔧 **Configuration**

### PostgreSQL Optimizations

The warehouse is configured for analytics workloads:

- **Shared Buffers**: 256MB for data caching
- **Effective Cache Size**: 1GB for query planning
- **Random Page Cost**: 1.1 (optimized for SSD)
- **Statistics Target**: 100 for better query plans

### Storage Strategy

- **Persistent Storage**: `/home/telgkb9/signalcartel-data/warehouse`
- **Backup Ready**: Volume mounted for easy backup access
- **Scalable**: Can be moved to larger storage as needed

## 📊 **Performance Benefits**

### Operational DB vs Warehouse

| Feature | Operational (SQLite) | Warehouse (PostgreSQL) |
|---------|---------------------|------------------------|
| **Purpose** | Real-time trading | Long-term analytics |
| **Data Retention** | 7 days optimal | Years of history |
| **Query Complexity** | Simple, fast | Complex analytics |
| **Partitioning** | No | Monthly partitions |
| **Concurrent Access** | Limited | High concurrency |
| **Indexing** | Basic | Advanced B-tree/GIN |

### Use Cases

#### Operational Database
- ✅ Real-time trade execution
- ✅ Strategy parameter optimization  
- ✅ 7-day rolling analysis
- ✅ Dashboard data feeds

#### Data Warehouse
- ✅ Multi-year trend analysis
- ✅ Seasonal pattern detection
- ✅ Market regime classification
- ✅ Strategy backtesting on historical data
- ✅ Advanced risk modeling
- ✅ Regulatory reporting

## 🔮 **Future Enhancements**

### Phase 2 Features

1. **Real-time Analytics**: Stream processing for live insights
2. **Machine Learning Integration**: Feature engineering for AI models
3. **Cross-market Analysis**: Multi-exchange correlation analysis
4. **Risk Analytics**: VaR calculations and stress testing
5. **Compliance Reporting**: Automated regulatory reports

### Advanced Analytics

1. **Predictive Models**: Train ML models on historical patterns
2. **Portfolio Optimization**: Multi-strategy portfolio analysis
3. **Market Microstructure**: Order book and liquidity analysis
4. **Social Sentiment**: Integration with news and social data

## 🚀 **Getting Started Commands**

```bash
# 1. Start the warehouse
docker-compose -f containers/database/postgres-warehouse.yml up -d

# 2. Test the setup
npx tsx -r dotenv/config test-warehouse-setup.ts

# 3. Start automatic syncing (add to strategy engine)
# The pipeline will automatically sync data every hour

# 4. Access PostgreSQL directly
docker exec -it signalcartel-warehouse psql -U warehouse_user -d quantum_forge_warehouse

# 5. Run analytics queries
SELECT * FROM v_strategy_performance_30d;
```

## 💡 **Integration with QUANTUM FORGE™**

The warehouse integrates seamlessly with your existing QUANTUM FORGE™ system:

- **Automatic Discovery**: Strategies automatically detect warehouse availability
- **Graceful Degradation**: System works normally if warehouse is offline
- **Enhanced Analytics**: Long-term data improves strategy optimization
- **Future-Proof**: Ready for advanced AI/ML algorithm development

This data warehouse positions QUANTUM FORGE™ for advanced analytics and gives you the foundation for sophisticated strategy development using years of historical data patterns.