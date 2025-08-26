'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  DollarSign,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface RealPriceData {
  btc: number;
  eth: number;
  ada: number;
  sol: number;
  timestamp: Date;
}

export default function RealBTCPrice() {
  const [priceData, setPriceData] = useState<RealPriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch REAL prices from external APIs via our new endpoint
  const fetchRealPrices = async (): Promise<RealPriceData> => {
    try {
      console.log('🔥 FETCHING REAL PRICES FROM EXTERNAL APIS...');
      
      // Use our new test-real-price endpoint that fetches from Kraken + CoinGecko
      const response = await fetch('/api/test-real-price');
      if (!response.ok) throw new Error('Failed to fetch real prices');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch real prices');
      }
      
      const realData: RealPriceData = {
        btc: data.data.btc || 0,
        eth: data.data.eth || 0,
        ada: data.data.ada || 0,
        sol: data.data.sol || 0,
        timestamp: new Date(data.data.timestamp)
      };

      console.log('✅ REAL PRICES FETCHED:');
      console.log('  • BTC: $' + realData.btc.toLocaleString());
      console.log('  • ETH: $' + realData.eth.toLocaleString());
      console.log('  • ADA: $' + realData.ada.toFixed(4));
      console.log('  • SOL: $' + realData.sol.toFixed(2));

      return realData;
      
    } catch (error) {
      console.error('❌ REAL PRICE FETCH FAILED:', error);
      throw error; // NO FALLBACKS - LET IT FAIL
    }
  };

  useEffect(() => {
    const updatePrices = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const realData = await fetchRealPrices();
        setPriceData(realData);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Failed to fetch real prices:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch real market data');
        // DO NOT set any fallback data - let it fail visibly
      } finally {
        setLoading(false);
      }
    };

    updatePrices(); // Initial load
    
    // Update every 30 seconds
    const interval = setInterval(updatePrices, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="bg-gray-900 border-blue-500/30 p-6">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-400 font-semibold">Fetching REAL Market Data...</p>
          <p className="text-gray-500 text-sm mt-1">Kraken + CoinGecko APIs</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-500/30 p-6">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 font-semibold mb-2">REAL DATA FETCH FAILED</p>
          <p className="text-red-300 text-sm mb-4">{error}</p>
          <div className="bg-red-950/30 border border-red-500/20 rounded-lg p-3 mb-4">
            <p className="text-xs text-red-200">
              🚨 NO FALLBACK DATA - REAL APIs ONLY
            </p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            size="sm"
            className="bg-red-600 hover:bg-red-700"
          >
            <RefreshCw className="w-3 h-3 mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (!priceData) {
    return (
      <Card className="bg-gray-900 border-red-500/30 p-6">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 font-semibold">No Real Data Available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-green-500/30 p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-green-400 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            🔥 REAL LIVE PRICES
          </h3>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <CheckCircle className="w-3 h-3 mr-1" />
              REAL APIs
            </Badge>
          </div>
        </div>
        <p className="text-gray-400 text-sm mt-1">
          Updated: {lastUpdate.toLocaleTimeString()}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-sm text-gray-400">Bitcoin</div>
          <div className="text-2xl font-bold text-orange-400">
            ${priceData.btc.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-orange-300">BTC/USD</div>
        </div>

        <div className="text-center">
          <div className="text-sm text-gray-400">Ethereum</div>
          <div className="text-2xl font-bold text-blue-400">
            ${priceData.eth.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-blue-300">ETH/USD</div>
        </div>

        <div className="text-center">
          <div className="text-sm text-gray-400">Cardano</div>
          <div className="text-2xl font-bold text-purple-400">
            ${priceData.ada.toFixed(4)}
          </div>
          <div className="text-xs text-purple-300">ADA/USD</div>
        </div>

        <div className="text-center">
          <div className="text-sm text-gray-400">Solana</div>
          <div className="text-2xl font-bold text-green-400">
            ${priceData.sol.toFixed(2)}
          </div>
          <div className="text-xs text-green-300">SOL/USD</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-green-500/20">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span className="text-green-300">Kraken API</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span className="text-green-300">CoinGecko API</span>
            </div>
          </div>
          <div className="text-gray-400">
            Auto-refresh: 30s
          </div>
        </div>
      </div>
    </Card>
  );
}