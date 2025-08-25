import { NextRequest, NextResponse } from 'next/server';

// Real-time price data from Kraken/Binance
async function getRealMarketPrice(symbol: string): Promise<number> {
  try {
    // Convert our symbols to exchange format
    const symbolMap: Record<string, string> = {
      'BTCUSDT': 'XXBTZUSD',
      'ETHUSDT': 'XETHZUSD',
      'ADAUSDT': 'ADAUSD',
      'SOLUSDT': 'SOLUSD'
    };
    
    const krakenSymbol = symbolMap[symbol] || 'XXBTZUSD';
    
    // Fetch from Kraken API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${krakenSymbol}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      const data = await response.json();
      const tickerData = Object.values(data.result)[0] as any;
      return parseFloat(tickerData.c[0]); // Current price
    }
  } catch (error) {
    console.error(`Failed to fetch real price for ${symbol}:`, error);
  }
  
  // Fallback to Binance US
  try {
    const binanceSymbol = symbol.replace('USDT', 'USD');
    const response = await fetch(`https://api.binance.us/api/v3/ticker/price?symbol=${binanceSymbol}`);
    if (response.ok) {
      const data = await response.json();
      return parseFloat(data.price);
    }
  } catch (error) {
    console.error(`Binance US fallback failed for ${symbol}:`, error);
  }
  
  // Last resort - CoinGecko
  try {
    const coinMap: Record<string, string> = {
      'BTCUSDT': 'bitcoin',
      'ETHUSDT': 'ethereum',
      'ADAUSDT': 'cardano',
      'SOLUSDT': 'solana'
    };
    
    const coinId = coinMap[symbol];
    if (coinId) {
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
      if (response.ok) {
        const data = await response.json();
        return data[coinId].usd;
      }
    }
  } catch (error) {
    console.error(`CoinGecko fallback failed for ${symbol}:`, error);
  }
  
  // Should never reach here with real APIs - this means all APIs failed
  console.error(`CRITICAL: All real price APIs failed for ${symbol}`);
  throw new Error(`REAL PRICE FETCH FAILED - All APIs down for ${symbol}`);
}

// Fetch real order book data from exchange APIs
async function getRealOrderBookData(symbol: string) {
  try {
    console.log(`🔥 Fetching REAL order book data for ${symbol} from Binance US...`);
    
    // Convert to Binance US format
    const binanceSymbol = symbol.replace('USDT', 'USD');
    
    // Fetch real order book from Binance US with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`https://api.binance.us/api/v3/depth?symbol=${binanceSymbol}&limit=20`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      
      // Process real bids and asks
      const bids = data.bids.map((bid: string[]) => ({
        price: parseFloat(bid[0]),
        quantity: parseFloat(bid[1]),
        total: parseFloat(bid[0]) * parseFloat(bid[1])
      }));
      
      const asks = data.asks.map((ask: string[]) => ({
        price: parseFloat(ask[0]),
        quantity: parseFloat(ask[1]),
        total: parseFloat(ask[0]) * parseFloat(ask[1])
      }));
      
      // Calculate real market metrics
      const bestBid = bids[0]?.price || 0;
      const bestAsk = asks[0]?.price || 0;
      const midPrice = (bestBid + bestAsk) / 2;
      const spreadPercent = bestAsk > 0 && bestBid > 0 ? ((bestAsk - bestBid) / midPrice) * 100 : 0;
      
      // Real liquidity calculations
      const bidDepth = bids.slice(0, 10).reduce((sum, bid) => sum + bid.total, 0);
      const askDepth = asks.slice(0, 10).reduce((sum, ask) => sum + ask.total, 0);
      const imbalanceRatio = askDepth > 0 ? bidDepth / askDepth : 1;
      
      // Real market pressure calculation
      let marketPressure = ((imbalanceRatio - 1) * 100);
      marketPressure = Math.max(-100, Math.min(100, marketPressure));
      
      // Liquidity score based on real order book depth
      const totalDepth = bidDepth + askDepth;
      const liquidityScore = Math.min(100, Math.max(10, (totalDepth / (midPrice * 50)) * 100));
      
      // Whale activity detection based on large orders
      const largeOrders = [...bids, ...asks].filter(order => order.total > midPrice * 10);
      const whaleActivityLevel = Math.min(100, largeOrders.length * 15);
      
      // Trading signal based on real order flow
      let entrySignal = 'NEUTRAL';
      let confidenceScore = 50;
      
      if (imbalanceRatio > 1.5) {
        entrySignal = imbalanceRatio > 2.0 ? 'STRONG_BUY' : 'BUY';
        confidenceScore = Math.min(95, 60 + (imbalanceRatio - 1) * 30);
      } else if (imbalanceRatio < 0.67) {
        entrySignal = imbalanceRatio < 0.5 ? 'STRONG_SELL' : 'SELL';
        confidenceScore = Math.min(95, 60 + (1 - imbalanceRatio) * 30);
      }
      
      // Adjust confidence based on liquidity
      confidenceScore = Math.min(95, confidenceScore * (liquidityScore / 70));
      
      return {
        symbol,
        timestamp: new Date().toISOString(),
        bids,
        asks,
        spreadPercent,
        midPrice,
        liquidityScore,
        marketPressure,
        institutionalFlow: marketPressure * 0.7,
        whaleActivityLevel,
        entrySignal,
        confidenceScore,
        timeframe: liquidityScore > 80 ? 'SCALP' : liquidityScore > 50 ? 'SHORT_TERM' : 'MEDIUM_TERM',
        orderFlowImbalance: (imbalanceRatio - 1) * 100,
        priceDiscoveryEfficiency: Math.min(100, Math.max(30, 100 - (spreadPercent * 10000))), // Lower spread = higher efficiency
        marketMakerActivity: Math.min(100, Math.max(20, bids.length + asks.length * 2.5)), // Based on order book depth
        bidDepth,
        askDepth,
        imbalanceRatio,
        source: 'binance_us_real'
      };
    }
  } catch (error) {
    console.error(`❌ Binance US order book failed for ${symbol}:`, error);
  }
  
  // Fallback to Kraken for order book data
  try {
    console.log(`📊 Fallback: Fetching order book from Kraken for ${symbol}...`);
    
    const symbolMap: Record<string, string> = {
      'BTCUSDT': 'XXBTZUSD',
      'ETHUSDT': 'XETHZUSD', 
      'ADAUSDT': 'ADAUSD',
      'SOLUSDT': 'SOLUSD'
    };
    
    const krakenSymbol = symbolMap[symbol] || 'XXBTZUSD';
    const response = await fetch(`https://api.kraken.com/0/public/Depth?pair=${krakenSymbol}&count=20`);
    
    if (response.ok) {
      const data = await response.json();
      const pairData = Object.values(data.result)[0] as any;
      
      if (pairData) {
        const bids = pairData.bids.map((bid: string[]) => ({
          price: parseFloat(bid[0]),
          quantity: parseFloat(bid[1]),
          total: parseFloat(bid[0]) * parseFloat(bid[1])
        }));
        
        const asks = pairData.asks.map((ask: string[]) => ({
          price: parseFloat(ask[0]),
          quantity: parseFloat(ask[1]),
          total: parseFloat(ask[0]) * parseFloat(ask[1])
        }));
        
        // Same calculations as Binance but mark as Kraken source
        const bestBid = bids[0]?.price || 0;
        const bestAsk = asks[0]?.price || 0;
        const midPrice = (bestBid + bestAsk) / 2;
        const spreadPercent = bestAsk > 0 && bestBid > 0 ? ((bestAsk - bestBid) / midPrice) * 100 : 0;
        
        const bidDepth = bids.slice(0, 10).reduce((sum, bid) => sum + bid.total, 0);
        const askDepth = asks.slice(0, 10).reduce((sum, ask) => sum + ask.total, 0);
        const imbalanceRatio = askDepth > 0 ? bidDepth / askDepth : 1;
        
        let marketPressure = ((imbalanceRatio - 1) * 100);
        marketPressure = Math.max(-100, Math.min(100, marketPressure));
        
        const totalDepth = bidDepth + askDepth;
        const liquidityScore = Math.min(100, Math.max(10, (totalDepth / (midPrice * 50)) * 100));
        
        const largeOrders = [...bids, ...asks].filter(order => order.total > midPrice * 10);
        const whaleActivityLevel = Math.min(100, largeOrders.length * 15);
        
        let entrySignal = 'NEUTRAL';
        let confidenceScore = 50;
        
        if (imbalanceRatio > 1.5) {
          entrySignal = imbalanceRatio > 2.0 ? 'STRONG_BUY' : 'BUY';
          confidenceScore = Math.min(95, 60 + (imbalanceRatio - 1) * 30);
        } else if (imbalanceRatio < 0.67) {
          entrySignal = imbalanceRatio < 0.5 ? 'STRONG_SELL' : 'SELL';
          confidenceScore = Math.min(95, 60 + (1 - imbalanceRatio) * 30);
        }
        
        confidenceScore = Math.min(95, confidenceScore * (liquidityScore / 70));
        
        return {
          symbol,
          timestamp: new Date().toISOString(),
          bids,
          asks,
          spreadPercent,
          midPrice,
          liquidityScore,
          marketPressure,
          institutionalFlow: marketPressure * 0.7,
          whaleActivityLevel,
          entrySignal,
          confidenceScore,
          timeframe: liquidityScore > 80 ? 'SCALP' : liquidityScore > 50 ? 'SHORT_TERM' : 'MEDIUM_TERM',
          orderFlowImbalance: (imbalanceRatio - 1) * 100,
          priceDiscoveryEfficiency: Math.min(100, Math.max(30, 100 - (spreadPercent * 10000))),
          marketMakerActivity: Math.min(100, Math.max(20, bids.length + asks.length * 2.5)),
          bidDepth,
          askDepth,
          imbalanceRatio,
          source: 'kraken_real'
        };
      }
    }
  } catch (error) {
    console.error(`❌ Kraken order book fallback failed for ${symbol}:`, error);
  }
  
  // All real APIs failed - throw error instead of fake data
  throw new Error(`❌ CRITICAL: All real order book APIs failed for ${symbol}. No simulated data provided.`);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BTCUSDT';
    
    console.log(`🔥 Fetching REAL order book data for ${symbol}...`);
    
    // Add timeout to prevent hanging
    const orderBookPromise = getRealOrderBookData(symbol);
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('API timeout after 5 seconds')), 5000)
    );
    
    // Get real order book data from exchange APIs with timeout
    const orderBookData = await Promise.race([orderBookPromise, timeoutPromise]);
    
    console.log(`✅ Real order book fetched for ${symbol} from ${orderBookData.source}`);
    console.log(`📊 Mid Price: $${orderBookData.midPrice.toFixed(2)}, Spread: ${orderBookData.spreadPercent.toFixed(4)}%`);
    console.log(`💧 Liquidity Score: ${orderBookData.liquidityScore.toFixed(1)}, Signal: ${orderBookData.entrySignal}`);
    
    return NextResponse.json({
      success: true,
      data: orderBookData,
      metadata: {
        realOrderBook: true,
        realPrice: true,
        source: orderBookData.source,
        timestamp: new Date().toISOString(),
        noSimulation: true
      }
    });
    
  } catch (error) {
    console.error('❌ Real Order Book API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch REAL order book data - all exchange APIs failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        realOrderBook: false,
        simulatedData: false,
        noFallback: true
      }
    }, { status: 500 });
  }
}