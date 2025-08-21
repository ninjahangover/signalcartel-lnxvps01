"use client";

import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { krakenApiService } from '../lib/kraken-api-service';
import marketDataService from '../lib/market-data-service';

interface KrakenAccountDashboardProps {
  isConnected: boolean;
}

interface PaperTradingAccount {
  totalValue: number;
  availableBalance: number;
  unrealizedPnL: number;
  realizedPnL: number;
  positions: Array<{
    symbol: string;
    side: 'long' | 'short';
    size: number;
    entryPrice: number;
    currentPrice: number;
    pnl: number;
    pnlPercent: number;
  }>;
  orders: Array<{
    id: string;
    symbol: string;
    side: 'buy' | 'sell';
    type: 'market' | 'limit' | 'stop';
    amount: number;
    price?: number;
    status: 'pending' | 'filled' | 'cancelled';
    timestamp: Date;
  }>;
}

interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

export default function KrakenAccountDashboard({ isConnected }: KrakenAccountDashboardProps) {
  const [accountData, setAccountData] = useState<any>(null);
  const [paperAccount, setPaperAccount] = useState<PaperTradingAccount>({
    totalValue: 100000, // DEMO DATA - Use RealTradingDashboard for real Alpaca trades
    availableBalance: 85234.57,
    unrealizedPnL: 2847.93,
    realizedPnL: 1523.48,
    positions: [
      {
        symbol: 'BTCUSD',
        side: 'long',
        size: 0.5,
        entryPrice: 120000.00,
        currentPrice: 121000.00,
        pnl: 565.00,
        pnlPercent: 2.68
      },
      {
        symbol: 'ETHUSD',
        side: 'long',
        size: 2.0,
        entryPrice: 2580.00,
        currentPrice: 2695.50,
        pnl: 231.00,
        pnlPercent: 4.48
      }
    ],
    orders: [
      {
        id: 'ORDER-001',
        symbol: 'BTCUSD',
        side: 'buy',
        type: 'limit',
        amount: 0.25,
        price: 41000.00,
        status: 'pending',
        timestamp: new Date()
      }
    ]
  });
  const [marketOverview, setMarketOverview] = useState<{
    favorites: MarketData[];
    topTraded: MarketData[];
    gainers: MarketData[];
    losers: MarketData[];
    newListings: MarketData[];
  }>({
    favorites: [],
    topTraded: [],
    gainers: [],
    losers: [],
    newListings: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<'spot' | 'margin' | 'futures'>('spot');

  useEffect(() => {
    if (isConnected) {
      fetchAccountData();
      fetchMarketOverview();
    } else {
      setAccountData(null);
      setError(null);
    }
  }, [isConnected]);

  // Effect to fetch prices for assets when account data changes
  useEffect(() => {
    if (accountData?.balance) {
      fetchPricesForAssets();
    }
  }, [accountData?.balance]);

  const fetchAccountData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await krakenApiService.getAccountInfo();
      console.log('🔍 DEBUG: Raw account data from API:', data);
      console.log('🔍 DEBUG: Raw balance data:', data?.balance);
      console.log('🔍 DEBUG: Balance keys:', data?.balance ? Object.keys(data.balance) : 'No balance');
      
      // Log all assets for debugging (removed overly aggressive filtering)
      if (data?.balance) {
        console.log(`🏦 === COMPLETE BALANCE BREAKDOWN ===`);
        Object.entries(data.balance).forEach(([asset, amount]) => {
          const numericAmount = parseFloat(amount as string);
          console.log(`📊 Asset: "${asset}" | Balance: ${amount} | Numeric: ${numericAmount} | Length: ${asset.length}`);
        });
        console.log(`🏦 === END BALANCE BREAKDOWN ===`);
      }
      setAccountData(data);

      // Get all assets with balances > 0 and tell market data service to fetch prices
      if (data?.balance) {
        const assetsWithBalances = Object.entries(data.balance)
          .filter(([asset, amount]) => {
            const numericAmount = parseFloat(amount as string);
            
            // Skip fee assets
            if (asset === 'KFEE' || asset.startsWith('KFEE')) {
              console.log(`⏭️ Skipping fee asset: ${asset} = ${numericAmount}`);
              return false;
            }
            
            // Keep all assets with any positive balance - let the price lookup handle the rest
            return numericAmount > 0.00001;
          })
          .map(([asset]) => {
            // Convert Kraken asset names to trading pairs for price fetching
            const assetMap: { [key: string]: string | null } = {
              // Bitcoin variations
              'XXBT': 'XBTUSD',
              'BTC': 'XBTUSD',
              'XBT': 'XBTUSD',

              // Ethereum variations
              'XETH': 'XETHZUSD',
              'ETH': 'XETHZUSD',

              // XRP variations
              'XXRP': 'XXRPZUSD',
              'XRP': 'XXRPZUSD',

              // Litecoin variations
              'XLTC': 'XLTCZUSD',
              'LTC': 'XLTCZUSD',

              // Dogecoin variations
              'XDOGE': 'XDGUSD',
              'DOGE': 'XDGUSD', 
              'XXDG': 'XDGUSD',

              // Single character assets (these might be valid Kraken assets)
              'A': 'AUSD',
              'B': 'BUSD',

              // User's specific assets
              'ADA': 'ADAUSD',      // Cardano
              'SOL': 'SOLUSD',      // Solana
              'ALGO': 'ALGOUSD',    // Algorand  
              'LINK': 'LINKUSD',    // Chainlink
              'CQT': 'CQTUSD',      // Covalent
              'SUI': 'SUIUSD',      // Sui
              'USDT': 'USDTZUSD',   // Tether
              'VAULTA': 'VAULTAUSD', // Vaulta (may need to check actual pair)
              
              // Other cryptocurrencies
              'MATIC': 'MATICUSD',
              'DOT': 'DOTUSD',
              'ATOM': 'ATOMUSD',
              'AVAX': 'AVAXUSD',
              'UNI': 'UNIUSD',

              // Skip fiat currencies - they don't need price data
              'ZUSD': null,
              'USD': null,
              'ZEUR': null,
              'EUR': null,
              'ZGBP': null,
              'GBP': null,
              'ZCAD': null,
              'CAD': null,
              'ZJPY': null,
              'JPY': null,
              'ZAUD': null,
              'AUD': null,
              'KFEE': null, // Kraken fee credits
            };
            
            const mapped = assetMap[asset];
            if (mapped === null) {
              console.log(`⏭️ Skipping fiat currency or fee asset: ${asset}`);
              return null;
            }
            if (mapped === undefined) {
              console.warn(`⚠️ Unknown asset from Kraken balance: ${asset}, will try to map dynamically`);
              // Try to create a reasonable mapping for unknown assets
              // For single-character assets, try both direct and common patterns
              if (asset.length === 1) {
                return `${asset}USD`; // Try A -> AUSD, B -> BUSD pattern
              }
              return `${asset}USD`; // Most assets have USD pairs
            }
            return mapped;
          })
          .filter((asset): asset is string => asset !== null); // Remove null values

        console.log(`📊 Portfolio: Found ${assetsWithBalances.length} assets with balances, fetching prices:`, assetsWithBalances);

        // Tell market data service to fetch prices for these assets
        marketDataService.setUserAssets(assetsWithBalances);
        
        // Also start polling to ensure we get fresh prices
        marketDataService.startPolling();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch account data');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch prices for all assets in the portfolio
  const fetchPricesForAssets = async () => {
    if (!accountData?.balance) return;

    console.log('🚀 Fetching prices for all portfolio assets...');
    
    const assetsToFetch = Object.entries(accountData.balance)
      .filter(([asset, amount]) => {
        const numericAmount = parseFloat(amount as string);
        return numericAmount > 0.00001 && 
               asset !== 'ZUSD' && 
               asset !== 'USD' && 
               !asset.startsWith('KFEE');
      })
      .map(([asset]) => asset);

    // Fetch prices for each asset
    const pricePromises = assetsToFetch.map(async (asset) => {
      const assetToTradingPair: { [key: string]: string } = {
        'XXBT': 'XBTUSD', 'BTC': 'XBTUSD', 'XBT': 'XBTUSD',
        'XETH': 'XETHZUSD', 'ETH': 'XETHZUSD',
        'XXRP': 'XXRPZUSD', 'XRP': 'XXRPZUSD',
        'XLTC': 'XLTCZUSD', 'LTC': 'XLTCZUSD',
        'XDOGE': 'XDGUSD', 'DOGE': 'XDGUSD', 'XXDG': 'XDGUSD',
        // User's specific assets
        'ADA': 'ADAUSD', 'SOL': 'SOLUSD', 'ALGO': 'ALGOUSD',
        'LINK': 'LINKUSD', 'CQT': 'CQTUSD', 'SUI': 'SUIUSD',
        'USDT': 'USDTZUSD', 'VAULTA': 'VAULTAUSD',
        // Other assets
        'MATIC': 'MATICUSD', 'DOT': 'DOTUSD',
        'ATOM': 'ATOMUSD', 'AVAX': 'AVAXUSD', 'UNI': 'UNIUSD',
      };

      const tradingPair = assetToTradingPair[asset];
      if (tradingPair) {
        const price = await getDirectKrakenPrice(tradingPair);
        console.log(`💰 Fetched price for ${asset}: $${price}`);
        return { asset, price };
      }
      return { asset, price: 0 };
    });

    try {
      const results = await Promise.all(pricePromises);
      console.log('✅ Finished fetching all asset prices:', results);
      
      // Force a re-render to update portfolio calculation
      setAccountData(prev => prev ? { ...prev, _lastUpdated: Date.now() } : prev);
    } catch (error) {
      console.error('❌ Error fetching asset prices:', error);
    }
  };

  const fetchMarketOverview = async () => {
    // Simulate market data - in production this would fetch from Kraken's public API
    const sampleMarkets: MarketData[] = [
      { symbol: 'BTCUSD', price: 121000.00, change24h: 1150.00, changePercent24h: 2.73, volume24h: 25487.39, high24h: 122000.00, low24h: 119000.00 },
      { symbol: 'ETHUSD', price: 2695.50, change24h: 87.30, changePercent24h: 3.35, volume24h: 142587.20, high24h: 2750.00, low24h: 2580.00 },
      { symbol: 'XRPUSD', price: 0.6234, change24h: -0.0156, changePercent24h: -2.44, volume24h: 8547123.45, high24h: 0.6480, low24h: 0.6180 },
      { symbol: 'SOLUSD', price: 98.75, change24h: 4.83, changePercent24h: 5.14, volume24h: 45632.87, high24h: 102.50, low24h: 93.20 },
      { symbol: 'ADAUSD', price: 0.4567, change24h: -0.0234, changePercent24h: -4.87, volume24h: 12458736.21, high24h: 0.4890, low24h: 0.4520 }
    ];

    setMarketOverview({
      favorites: sampleMarkets.slice(0, 3),
      topTraded: [...sampleMarkets].sort((a, b) => b.volume24h - a.volume24h),
      gainers: [...sampleMarkets].filter(m => m.changePercent24h > 0).sort((a, b) => b.changePercent24h - a.changePercent24h),
      losers: [...sampleMarkets].filter(m => m.changePercent24h < 0).sort((a, b) => a.changePercent24h - b.changePercent24h),
      newListings: sampleMarkets.slice(-2)
    });
  };

  // Cache for trading pair mappings
  const [tradingPairs, setTradingPairs] = useState<{ [key: string]: string }>({});

  // Fetch available trading pairs from Kraken API
  const fetchTradingPairs = async () => {
    try {
      console.log('🔍 Fetching available trading pairs from Kraken...');
      
      const response = await fetch('/api/kraken-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'AssetPairs',
          params: {}
        })
      });

      const data = await response.json();
      console.log('📊 Kraken trading pairs response:', data);

      if (data.result) {
        const pairs: { [key: string]: string } = {};
        
        // Build mappings for your specific assets
        const yourAssets = ['XXBT', 'XETH', 'ADA', 'ALGO', 'CQT', 'XXDG', 'XXRP', 'XLTC', 'SOL', 'LINK', 'A'];
        
        for (const [pairName, pairInfo] of Object.entries(data.result)) {
          const info = pairInfo as any;
          const base = info.base;
          
          // Map your assets to their USD trading pairs
          if (yourAssets.includes(base) && pairName.includes('USD')) {
            pairs[base] = pairName;
            console.log(`✅ Found trading pair: ${base} → ${pairName}`);
          }
        }
        
        setTradingPairs(pairs);
        console.log('🎯 Final trading pair mappings:', pairs);
      }
    } catch (error) {
      console.error('❌ Failed to fetch trading pairs:', error);
    }
  };

  // Fetch trading pairs on component mount
  useEffect(() => {
    fetchTradingPairs();
  }, []);

  const getAssetPrice = (asset: string): number => {
    console.log(`🔍 Looking up price for asset: ${asset}`);
    
    // Handle USD/fiat currencies first
    if (asset === 'ZUSD' || asset === 'USD') {
      console.log(`💵 ${asset} is USD, returning price: 1`);
      return 1;
    }

    // Debug: Show what we're working with
    console.log(`🔍 Current trading pairs state:`, tradingPairs);
    console.log(`🔍 Market data service status:`, {
      isPolling: marketDataService.getAllData ? Object.keys(marketDataService.getAllData()).length : 'no getAllData method'
    });
    
    // Comprehensive asset-to-trading-pair mapping (fallback to hardcoded reliable mappings)
    const assetToTradingPair: { [key: string]: string } = {
      // Bitcoin variations
      'XXBT': 'XBTUSD',
      'BTC': 'XBTUSD', 
      'XBT': 'XBTUSD',
      
      // Ethereum variations
      'XETH': 'XETHZUSD',
      'ETH': 'XETHZUSD',
      
      // XRP variations  
      'XXRP': 'XXRPZUSD',
      'XRP': 'XXRPZUSD',
      
      // Litecoin variations
      'XLTC': 'XLTCZUSD', 
      'LTC': 'XLTCZUSD',
      
      // Dogecoin variations
      'XDOGE': 'XDGUSD',
      'DOGE': 'XDGUSD',
      'XXDG': 'XDGUSD',
      
      // User's specific assets
      'ADA': 'ADAUSD',      // Cardano
      'SOL': 'SOLUSD',      // Solana
      'ALGO': 'ALGOUSD',    // Algorand
      'LINK': 'LINKUSD',    // Chainlink
      'CQT': 'CQTUSD',      // Covalent Query Token
      'SUI': 'SUIUSD',      // Sui
      'USDT': 'USDTZUSD',   // Tether
      'VAULTA': 'VAULTAUSD', // Vaulta
      
      // Other cryptocurrencies
      'MATIC': 'MATICUSD',
      'DOT': 'DOTUSD',
      'ATOM': 'ATOMUSD',
      'AVAX': 'AVAXUSD',
      'UNI': 'UNIUSD',
    };

    // Try dynamic mapping first, then fallback to hardcoded
    let tradingPair = tradingPairs[asset] || assetToTradingPair[asset] || null;
    console.log(`📊 Asset ${asset} maps to trading pair: ${tradingPair}`);
    console.log(`📊 Dynamic mapping: ${tradingPairs[asset]}`);
    console.log(`📊 Static mapping: ${assetToTradingPair[asset]}`);
    
    if (!tradingPair) {
      console.error(`❌ NO TRADING PAIR FOUND FOR ${asset}`);
      console.log(`📊 Available static mappings:`, Object.keys(assetToTradingPair));
      console.log(`📊 Available dynamic mappings:`, Object.keys(tradingPairs));
    }

    if (tradingPair) {
      // Get real-time price from market data service
      let realPrice = marketDataService.getPrice(tradingPair);
      console.log(`💰 Market data price for ${asset} (${tradingPair}): ${realPrice}`);

      if (realPrice > 0) {
        return realPrice;
      }
      
      // If market data service doesn't have it, check our cache
      console.warn(`⚠️ Market data service has no price for ${tradingPair}, checking cache...`);
      
      const cached = priceCache[tradingPair];
      if (cached && (Date.now() - cached.timestamp) < 60000) { // Cache valid for 1 minute
        console.log(`💰 Using cached price for ${tradingPair}: $${cached.price}`);
        return cached.price;
      }
      
      // If no cached price, trigger immediate fetch and return 0 for now
      console.warn(`⚠️ No cached price for ${tradingPair}, triggering immediate fetch...`);
      fetchPriceAndRefresh(tradingPair);
      return 0;
    }

    console.error(`❌ No trading pair mapping found for asset: ${asset}`);
    return 0;
  };

  // Function to fetch price and trigger portfolio refresh
  const fetchPriceAndRefresh = async (tradingPair: string) => {
    const price = await getDirectKrakenPrice(tradingPair);
    if (price > 0) {
      // Trigger a re-render by updating the account data timestamp
      setAccountData(prev => prev ? { ...prev, _lastUpdated: Date.now() } : prev);
    }
  };

  // Cache for fetched prices to avoid repeated API calls
  const [priceCache, setPriceCache] = useState<{ [key: string]: { price: number, timestamp: number } }>({});

  // Helper function to get price directly from Kraken API when market data service fails
  const getDirectKrakenPrice = async (tradingPair: string): Promise<number> => {
    try {
      // Check cache first (valid for 30 seconds)
      const cached = priceCache[tradingPair];
      if (cached && (Date.now() - cached.timestamp) < 30000) {
        console.log(`💰 Using cached price for ${tradingPair}: $${cached.price}`);
        return cached.price;
      }

      console.log(`📈 Fetching fresh price for ${tradingPair} from Kraken API...`);

      const response = await fetch('/api/kraken-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: 'Ticker',
          params: { pair: tradingPair }
        }),
      });

      if (!response.ok) {
        console.error(`❌ API request failed for ${tradingPair}: ${response.status}`);
        return 0;
      }

      const data = await response.json();
      console.log(`📊 Kraken API response for ${tradingPair}:`, data);

      if (data.error && data.error.length > 0) {
        console.error(`❌ Kraken API error for ${tradingPair}:`, data.error);
        return 0;
      }

      if (data.result && Object.keys(data.result).length > 0) {
        const pairData = Object.values(data.result)[0] as any;
        const price = parseFloat(pairData.c[0]); // Current price
        
        // Cache the price
        setPriceCache(prev => ({
          ...prev,
          [tradingPair]: { price, timestamp: Date.now() }
        }));

        console.log(`✅ Successfully fetched price for ${tradingPair}: $${price.toLocaleString()}`);
        return price;
      }

      console.error(`❌ No price data found for ${tradingPair}`);
      return 0;
    } catch (error) {
      console.error(`❌ Error fetching price for ${tradingPair}:`, error);
      return 0;
    }
  };

  const getTotalPortfolioValue = (): number => {
    if (!accountData?.balance) return 0;
    let total = 0;
    const breakdown: string[] = [];

    console.log('📊 PORTFOLIO CALCULATION BREAKDOWN:');
    console.log('=====================================');
    console.log('🏦 Raw account balance data:', accountData.balance);
    console.log('🏦 Asset count:', Object.keys(accountData.balance).length);
    console.log('🏦 All asset names:', Object.keys(accountData.balance));
    
    // Also check what's in the market data service
    console.log('📈 Available market data:', {
      XBTUSD: marketDataService.getPrice('XBTUSD'),
      BTCUSD: marketDataService.getPrice('BTCUSD'),
      ETHUSD: marketDataService.getPrice('ETHUSD'),
      available_data: marketDataService.getAllData()
    });

    for (const [asset, amount] of Object.entries(accountData.balance)) {
      const numericAmount = parseFloat(amount as string);

      // Skip known fee assets or other non-tradeable assets
      if (asset === 'KFEE' || asset.startsWith('KFEE') || asset === 'FEE') {
        console.log(`⏭️ Skipping fee asset ${asset}: ${numericAmount}`);
        continue;
      }

      // Skip very small balances
      if (numericAmount <= 0.00001) {
        console.log(`⏭️ Skipping ${asset}: ${numericAmount} (negligible balance)`);
        continue;
      }

      console.log(`💼 Processing asset: ${asset} with balance: ${numericAmount}`);
      const price = getAssetPrice(asset);
      const value = numericAmount * price;
      
      // Log detailed information for debugging
      if (price === 0) {
        console.warn(`⚠️ No price data for ${asset} (balance: ${numericAmount}) - skipping portfolio calculation`);
        // Skip assets with no price data
        continue;
      } else {
        console.log(`✅ ${asset}: ${numericAmount} × $${price.toLocaleString()} = $${value.toFixed(2)}`);
      }
      
      total += value;
      breakdown.push(`${asset}: $${value.toFixed(2)}`);
    }

    console.log('=====================================');
    console.log(`🎯 TOTAL PORTFOLIO VALUE: ${total.toFixed(2)}`);
    console.log(`📝 Breakdown: ${breakdown.join(', ')}`);
    console.log('=====================================');

    return total;
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    });
  };

  const formatPercentage = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  if (!isConnected) {
    return (
      <Card className="p-8">
        <div className="text-center text-gray-500">
          <h3 className="text-lg font-semibold mb-2">Account Dashboard</h3>
          <p>Connect to your Kraken account to view portfolio and trading data</p>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading account data...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8">
        <div className="text-center text-red-600">
          <h3 className="text-lg font-semibold mb-2">Error</h3>
          <p>{error}</p>
          <Button onClick={fetchAccountData} className="mt-4">Retry</Button>
        </div>
      </Card>
    );
  }

  const realPortfolioValue = getTotalPortfolioValue();

  return (
    <div className="space-y-6">
      {/* Account Type Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Account Overview</h2>
          <p className="text-gray-600">Real-time account data and paper trading performance</p>
        </div>
        <div className="flex space-x-2">
          {(['spot', 'margin', 'futures'] as const).map((type) => (
            <Button
              key={type}
              variant={selectedAccount === type ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedAccount(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-4 border-blue-200 bg-blue-50">
          <h3 className="text-sm font-medium text-blue-700 mb-1">Real Account Value</h3>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(realPortfolioValue)}</p>
          <p className="text-sm text-blue-600">Spot Trading</p>
        </Card>

        <Card className="p-4 border-green-200 bg-green-50">
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-sm font-medium text-green-700">Total Portfolio Value</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchPricesForAssets}
              className="text-xs px-2 py-1 h-6"
            >
              Refresh Prices
            </Button>
          </div>
          <p className="text-2xl font-bold text-green-900">{formatCurrency(getTotalPortfolioValue())}</p>
          <p className="text-sm text-green-600">Real Kraken Account</p>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Open Orders</h3>
          <p className="text-2xl font-bold text-blue-600">
            {Object.keys(accountData?.openOrders || {}).length}
          </p>
          <p className="text-sm text-gray-500">Active Orders</p>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Trade Count</h3>
          <p className="text-2xl font-bold text-purple-600">
            {accountData?.tradesCount || 0}
          </p>
          <p className="text-sm text-gray-500">Completed Trades</p>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="balances" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="markets">Markets</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="balances">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Real Account Balances */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Real Account Balances</h3>
              <div className="space-y-3">
                {accountData?.balance && Object.entries(accountData.balance).map(([asset, amount]) => {
                  const numericAmount = parseFloat(amount as string);
                  
                  // Skip fee assets
                  if (asset === 'KFEE' || asset.startsWith('KFEE')) {
                    return null;
                  }
                  
                  const price = getAssetPrice(asset);
                  const value = numericAmount * price;

                  if (numericAmount <= 0) return null;

                  return (
                    <div key={asset} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">
                            {asset.replace('X', '').replace('Z', '')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{asset.replace('X', '').replace('Z', '')}</p>
                          <p className="text-sm text-gray-600">{numericAmount.toFixed(8)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(value)}</p>
                        <p className="text-sm text-gray-600">{formatCurrency(price)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Paper Trading Balances */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Live Kraken Account</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Total Portfolio Value:</span>
                      <p className="font-bold text-blue-900">{formatCurrency(getTotalPortfolioValue())}</p>
                    </div>
                    <div>
                      <span className="text-blue-700">Open Orders:</span>
                      <p className="font-bold text-blue-900">{Object.keys(accountData?.openOrders || {}).length}</p>
                    </div>
                    <div>
                      <span className="text-blue-700">Total Trades:</span>
                      <p className="font-bold text-blue-900">{accountData?.tradesCount || 0}</p>
                    </div>
                    <div>
                      <span className="text-blue-700">Data Source:</span>
                      <p className="font-bold text-green-600">Live Kraken API</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Asset Allocation</h4>
                  <div className="space-y-2">
                    {accountData?.balance && Object.entries(accountData.balance)
                      .filter(([asset, amount]) => {
                        const numericAmount = parseFloat(amount as string);
                        
                        // Skip fee assets
                        if (asset === 'KFEE' || asset.startsWith('KFEE')) {
                          return false;
                        }
                        
                        // Filter by USD value, not token amount (Bitcoin has small amounts but high value)
                        const value = numericAmount * getAssetPrice(asset);
                        return value > 1.0; // Show assets worth more than $1
                      })
                      .slice(0, 5)
                      .map(([asset, amount]) => (
                        <div key={asset} className="flex justify-between text-sm">
                          <span>{asset}:</span>
                          <span>{parseFloat(amount as string).toFixed(6)}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Open Orders */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Open Orders</h3>
              <div className="space-y-3">
                {Object.entries(accountData?.openOrders || {}).map(([orderId, order]: [string, any]) => (
                  <div key={orderId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant={order.descr?.type === 'buy' ? 'default' : 'secondary'}>
                        {order.descr?.type?.toUpperCase() || 'UNKNOWN'}
                      </Badge>
                      <div>
                        <p className="font-medium">{order.descr?.pair || 'N/A'}</p>
                        <p className="text-sm text-gray-600">{order.descr?.ordertype?.toUpperCase() || 'LIMIT'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{order.vol || '0'}</p>
                      <p className="text-sm text-gray-600">{order.price ? formatCurrency(order.price) : 'Market'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Conditional Orders */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Conditional Orders</h3>
              <div className="text-center py-8 text-gray-500">
                <p>No conditional orders</p>
                <Button variant="outline" size="sm" className="mt-2">Create Stop Loss</Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="positions">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Asset Holdings</h3>
            <div className="space-y-4">
              {Object.entries(accountData?.balance || {})
                .filter(([asset, amount]) => {
                  const numericAmount = parseFloat(amount as string);
                  
                  // Skip fee assets
                  if (asset === 'KFEE' || asset.startsWith('KFEE')) {
                    return false;
                  }
                  
                  return numericAmount > 0.001;
                })
                .map(([asset, amount], index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Asset</p>
                      <p className="font-medium">{asset}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Balance</p>
                      <p className="font-medium">{parseFloat(amount as string).toFixed(6)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">USD Value</p>
                      <p className="font-medium">{formatCurrency(parseFloat(amount as string) * getAssetPrice(asset))}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">% of Portfolio</p>
                      <p className="font-medium">{(((parseFloat(amount as string) * getAssetPrice(asset)) / getTotalPortfolioValue()) * 100).toFixed(2)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="markets">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Favorites */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Favorites</h3>
              <div className="space-y-3">
                {marketOverview.favorites.map((market) => (
                  <div key={market.symbol} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{market.symbol}</p>
                      <p className="text-sm text-gray-600">{formatCurrency(market.price)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${market.changePercent24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(market.changePercent24h)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Top Traded */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Traded</h3>
              <div className="space-y-3">
                {marketOverview.topTraded.slice(0, 5).map((market) => (
                  <div key={market.symbol} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{market.symbol}</p>
                      <p className="text-sm text-gray-600">Vol: {market.volume24h.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(market.price)}</p>
                      <p className={`text-xs ${market.changePercent24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(market.changePercent24h)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Gainers & Losers */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Gainers & Losers</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-green-600 mb-2">Top Gainers</h4>
                  {marketOverview.gainers.slice(0, 3).map((market) => (
                    <div key={market.symbol} className="flex items-center justify-between mb-2">
                      <span className="text-sm">{market.symbol}</span>
                      <span className="text-sm font-medium text-green-600">
                        {formatPercentage(market.changePercent24h)}
                      </span>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-red-600 mb-2">Top Losers</h4>
                  {marketOverview.losers.slice(0, 3).map((market) => (
                    <div key={market.symbol} className="flex items-center justify-between mb-2">
                      <span className="text-sm">{market.symbol}</span>
                      <span className="text-sm font-medium text-red-600">
                        {formatPercentage(market.changePercent24h)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Trading History</h3>
            <div className="text-center py-8 text-gray-500">
              <p>Trading history will appear here</p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Portfolio Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Performance Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Return:</span>
                    <span className="font-medium text-green-600">+4.37%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sharpe Ratio:</span>
                    <span className="font-medium">1.84</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Drawdown:</span>
                    <span className="font-medium text-red-600">-2.15%</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Risk Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Portfolio Beta:</span>
                    <span className="font-medium">0.85</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Volatility:</span>
                    <span className="font-medium">12.4%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VaR (95%):</span>
                    <span className="font-medium text-red-600">-$1,247</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
