import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔥 FETCHING REAL PRICES FROM EXTERNAL APIs...');
    
    // Fetch BTC and ETH from Kraken API
    const krakenResponse = await fetch('https://api.kraken.com/0/public/Ticker?pair=XXBTZUSD,XETHZUSD', {
      headers: {
        'User-Agent': 'SignalCartel/1.0'
      }
    });
    
    if (!krakenResponse.ok) {
      throw new Error('Failed to fetch from Kraken API');
    }
    
    const krakenData = await krakenResponse.json();
    console.log('Kraken API response received');
    
    // Extract BTC and ETH prices from Kraken response
    const btcPrice = parseFloat(krakenData.result?.XXBTZUSD?.c?.[0] || '0');
    const ethPrice = parseFloat(krakenData.result?.XETHZUSD?.c?.[0] || '0');
    
    // Try to fetch ADA and SOL from CoinGecko API (with rate limiting handling)
    let adaPrice = 0;
    let solPrice = 0;
    let coinGeckoError = '';
    
    try {
      const coinsResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=cardano,solana&vs_currencies=usd', {
        headers: {
          'User-Agent': 'SignalCartel/1.0'
        }
      });
      
      if (coinsResponse.ok) {
        const coinsData = await coinsResponse.json();
        
        // Check if we got rate limited
        if (coinsData.status?.error_code === 429) {
          coinGeckoError = 'Rate limited';
          console.log('⚠️ CoinGecko rate limited, using fallback approach...');
          
          // Fallback: Use approximate values based on recent market data
          // These will be replaced with more accurate data when rate limit resets
          adaPrice = 0.35; // Approximate ADA price
          solPrice = 140;  // Approximate SOL price
        } else {
          adaPrice = coinsData.cardano?.usd || 0;
          solPrice = coinsData.solana?.usd || 0;
          console.log('CoinGecko API response received successfully');
        }
      } else {
        throw new Error(`CoinGecko API returned ${coinsResponse.status}`);
      }
    } catch (error) {
      coinGeckoError = error instanceof Error ? error.message : 'Unknown error';
      console.log(`⚠️ CoinGecko failed: ${coinGeckoError}, using fallback values...`);
      
      // Conservative fallback values
      adaPrice = 0.35; 
      solPrice = 140;
    }
    
    const realPrices = {
      btc: btcPrice,
      eth: ethPrice,
      ada: adaPrice,
      sol: solPrice,
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ REAL PRICES FETCHED:', {
      BTC: `$${btcPrice.toLocaleString()}`,
      ETH: `$${ethPrice.toLocaleString()}`, 
      ADA: `$${adaPrice.toFixed(4)}`,
      SOL: `$${solPrice.toFixed(2)}`
    });
    
    return NextResponse.json({
      success: true,
      data: realPrices,
      source: 'external_apis',
      message: coinGeckoError 
        ? `Kraken prices (BTC/ETH) + CoinGecko fallback (ADA/SOL) - ${coinGeckoError}`
        : 'Real prices fetched from Kraken (BTC/ETH) and CoinGecko (ADA/SOL)',
      apis: {
        kraken: 'BTC, ETH - live',
        coingecko: coinGeckoError ? `ADA, SOL - fallback (${coinGeckoError})` : 'ADA, SOL - live'
      }
    });
    
  } catch (error) {
    console.error('❌ REAL PRICE FETCH FAILED:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to fetch real prices from external APIs'
    }, { status: 500 });
  }
}