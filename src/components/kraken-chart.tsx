"use client";

import React, { useState, useEffect } from 'react';
import marketDataService, { MarketData } from '../lib/market-data-service';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import RealTimeChart from './real-time-chart';

export default function KrakenChart() {
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSD');
  const [marketData, setMarketData] = useState<MarketData | null>(null);

  const symbols = ['BTCUSD', 'ETHUSD', 'EURUSD', 'GBPUSD'];

  useEffect(() => {
    const unsubscribe = marketDataService.subscribe(selectedSymbol, (data: MarketData) => {
      setMarketData(data);
    });

    return () => {
      unsubscribe();
    };
  }, [selectedSymbol]);

  const formatPrice = (price: number | undefined | null) => {
    if (price == null || isNaN(price)) return '0.00';
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatPercentage = (percent: number | undefined | null) => {
    if (percent == null || isNaN(percent)) return '0.00%';
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Market Data</h2>
          <p className="text-gray-600">Real-time price charts and market analysis</p>
        </div>
        <Badge variant="default">LIVE</Badge>
      </div>

      {/* Symbol Selection */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          {symbols.map((symbol) => (
            <Button
              key={symbol}
              variant={selectedSymbol === symbol ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSymbol(symbol)}
            >
              {symbol}
            </Button>
          ))}
        </div>
      </Card>

      {/* Current Price Display */}
      <Card className="p-6">
        {marketData ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-600">Current Price</div>
              <div className="text-3xl font-bold">
                ${formatPrice(marketData?.price)}
              </div>
              <div className={`text-sm ${(marketData?.changePercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(marketData?.changePercent)}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600">24h High</div>
              <div className="text-xl font-semibold">${formatPrice(marketData?.high24h)}</div>
              <div className="text-sm text-gray-600">24h Low</div>
              <div className="text-xl font-semibold">${formatPrice(marketData?.low24h)}</div>
            </div>

            <div>
              <div className="text-sm text-gray-600">Bid / Ask</div>
              <div className="text-lg">
                <span className="text-red-600">${formatPrice(marketData?.bid)}</span>
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-green-600">${formatPrice(marketData?.ask)}</span>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600">Volume</div>
              <div className="text-xl font-semibold">
                {(marketData?.volume || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                {marketData?.timestamp ? new Date(marketData.timestamp).toLocaleTimeString() : 'Loading...'}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
              <div className="h-6 bg-gray-200 rounded w-1/4 mx-auto"></div>
              <p className="text-gray-500">Loading market data for {selectedSymbol}...</p>
            </div>
          </div>
        )}
      </Card>

      <Tabs defaultValue="chart" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chart">Chart</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          <RealTimeChart
            symbol={selectedSymbol}
            height={450}
            showControls={true}
            className="bg-white"
          />
        </TabsContent>

        <TabsContent value="analysis">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Technical Analysis</h3>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-600">Technical indicators and analysis</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
