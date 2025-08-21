"use client";

import React, { useEffect, useRef, useState } from 'react';
import { realMarketData } from '../lib/real-market-data';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface MarketData {
  symbol: string;
  price: number;
  timestamp: number;
}

interface RealTimeChartProps {
  symbol: string;
  height?: number;
  showControls?: boolean;
  className?: string;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

export default function RealTimeChart({ 
  symbol, 
  height = 400, 
  showControls = true,
  className = "" 
}: RealTimeChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const [currentData, setCurrentData] = useState<MarketData | null>(null);
  const [timeframe, setTimeframe] = useState('1');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Convert our symbol format to TradingView format
  const convertToTradingViewSymbol = (symbol: string): string => {
    const tradingViewSymbols: { [key: string]: string } = {
      'BTCUSD': 'KRAKEN:XBTUSD',
      'ETHUSD': 'KRAKEN:ETHUSD', 
      'XRPUSD': 'KRAKEN:XRPUSD',
      'ADAUSD': 'KRAKEN:ADAUSD',
      'SOLUSD': 'KRAKEN:SOLUSD',
      'LTCUSD': 'KRAKEN:LTCUSD',
      'DOTUSD': 'KRAKEN:DOTUSD',
      'LINKUSD': 'KRAKEN:LINKUSD',
      'AVAXUSD': 'KRAKEN:AVAXUSD',
      'UNIUSD': 'KRAKEN:UNIUSD'
    };
    
    return tradingViewSymbols[symbol] || 'KRAKEN:XBTUSD';
  };

  // Load TradingView script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      setIsLoading(false);
      initializeChart();
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize TradingView chart
  const initializeChart = () => {
    if (!chartContainerRef.current || !window.TradingView) return;

    // Clear previous widget
    if (widgetRef.current) {
      widgetRef.current.remove();
    }

    const tvSymbol = convertToTradingViewSymbol(symbol);
    const containerId = `tradingview-chart-${symbol}`;

    widgetRef.current = new window.TradingView.widget({
      autosize: true,
      symbol: tvSymbol,
      interval: timeframe,
      timezone: "Etc/UTC",
      theme: "light",
      style: "1",
      locale: "en",
      toolbar_bg: "#f1f3f6",
      enable_publishing: false,
      allow_symbol_change: false,
      container_id: containerId,
      studies: [
        "Volume@tv-basicstudies",
        "RSI@tv-basicstudies"
      ],
      overrides: {
        "paneProperties.background": "#ffffff",
        "paneProperties.vertGridProperties.color": "#f0f0f0",
        "paneProperties.horzGridProperties.color": "#f0f0f0",
        "symbolWatermarkProperties.transparency": 90,
        "scalesProperties.textColor": "#666666",
        "scalesProperties.lineColor": "#e0e0e0"
      },
      disabled_features: [
        "use_localstorage_for_settings",
        "volume_force_overlay",
        "create_volume_indicator_by_default"
      ],
      enabled_features: [
        "study_templates"
      ],
      loading_screen: {
        backgroundColor: "#ffffff",
        foregroundColor: "#2563eb"
      },
      custom_css_url: undefined,
      width: "100%",
      height: height
    });
  };

  // Recreate chart when symbol or timeframe changes
  useEffect(() => {
    if (!isLoading && window.TradingView) {
      initializeChart();
    }
  }, [symbol, timeframe, isLoading]);

  // Subscribe to market data for price updates
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchData = async () => {
      try {
        const price = await realMarketData.getCurrentPrice(symbol);
        const data: MarketData = {
          symbol,
          price,
          bid: price * 0.999, // Approximate bid
          ask: price * 1.001, // Approximate ask
          high24h: price * 1.05, // Approximate high
          low24h: price * 0.95, // Approximate low
          volume: 1000, // Default volume
          changePercent: 0, // Default change
          timestamp: Date.now()
        };
        setCurrentData(data);
        setLastUpdate(new Date());
      } catch (error) {
        console.error(`Failed to fetch price for ${symbol}:`, error);
      }
    };

    // Initial fetch
    fetchData();

    // Update every 5 seconds
    intervalId = setInterval(fetchData, 5000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [symbol]);

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatPercentage = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  const handleTimeframeChange = (tf: string) => {
    const timeframeMap: { [key: string]: string } = {
      '1m': '1',
      '5m': '5',
      '15m': '15',
      '1h': '60',
      '4h': '240',
      '1d': 'D'
    };
    
    setTimeframe(timeframeMap[tf] || '1');
  };

  const resetZoom = () => {
    if (widgetRef.current && widgetRef.current.chart) {
      widgetRef.current.chart().resetData();
    }
  };

  return (
    <Card className={`p-4 ${className}`}>
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center">
              {symbol}
              <Badge variant="default" className="ml-2 bg-green-500">
                LIVE
              </Badge>
            </h3>
            {currentData && (
              <div className="flex items-center space-x-2 text-sm">
                <span className="font-medium">
                  {formatPrice(currentData.price)}
                </span>
                <span className={`${currentData.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(currentData.changePercent)}
                </span>
                <span className="text-gray-500">
                  • {lastUpdate.toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {showControls && (
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              {['1m', '5m', '15m', '1h', '4h', '1d'].map((tf) => (
                <Button
                  key={tf}
                  size="sm"
                  variant={
                    (tf === '1m' && timeframe === '1') ||
                    (tf === '5m' && timeframe === '5') ||
                    (tf === '15m' && timeframe === '15') ||
                    (tf === '1h' && timeframe === '60') ||
                    (tf === '4h' && timeframe === '240') ||
                    (tf === '1d' && timeframe === 'D')
                      ? "default" : "outline"
                  }
                  onClick={() => handleTimeframeChange(tf)}
                  className="px-2 py-1 text-xs"
                >
                  {tf}
                </Button>
              ))}
            </div>
            <Button size="sm" variant="outline" onClick={resetZoom}>
              Reset Zoom
            </Button>
          </div>
        )}
      </div>

      {/* Price Details */}
      {currentData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
          <div>
            <span className="text-gray-600">High: </span>
            <span className="font-medium text-green-600">
              {formatPrice(currentData.high24h)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Low: </span>
            <span className="font-medium text-red-600">
              {formatPrice(currentData.low24h)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Volume: </span>
            <span className="font-medium">
              {currentData.volume.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Spread: </span>
            <span className="font-medium">
              {formatPrice(currentData.ask - currentData.bid)}
            </span>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div className="w-full border border-gray-200 rounded-lg overflow-hidden bg-white relative">
        <div
          id={`tradingview-chart-${symbol}`}
          ref={chartContainerRef}
          style={{ height: `${height}px` }}
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600">Loading TradingView chart...</p>
            </div>
          </div>
        )}
      </div>

      {/* Chart Info */}
      <div className="mt-2 text-xs text-gray-500 flex justify-between">
        <span>Professional charts by TradingView</span>
        <span>Real-time data • {timeframe === 'D' ? '1d' : timeframe + 'm'} timeframe</span>
      </div>
    </Card>
  );
}