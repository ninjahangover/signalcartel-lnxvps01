'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../ui/card';

interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
}

interface OrderBookData {
  symbol: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  midPrice?: number;
  spreadPercent?: number;
  timestamp: string;
}

interface TradingOrderBookVisualProps {
  data: OrderBookData;
  maxLevels?: number;
}

export default function TradingOrderBookVisual({ data, maxLevels = 15 }: TradingOrderBookVisualProps) {
  const [previousData, setPreviousData] = useState<OrderBookData | null>(null);
  const [animatedEntries, setAnimatedEntries] = useState<Set<string>>(new Set());

  // Calculate max volume for heat map intensity
  const maxVolume = useMemo(() => {
    const allEntries = [...(data.bids || []), ...(data.asks || [])];
    return Math.max(...allEntries.map(entry => entry.total || 0));
  }, [data]);

  // Track changes for animations
  useEffect(() => {
    if (previousData) {
      const newAnimated = new Set<string>();
      
      // Check for changes in bids
      data.bids?.forEach((bid, index) => {
        const prevBid = previousData.bids?.[index];
        if (!prevBid || prevBid.price !== bid.price || prevBid.quantity !== bid.quantity) {
          newAnimated.add(`bid-${index}`);
        }
      });

      // Check for changes in asks
      data.asks?.forEach((ask, index) => {
        const prevAsk = previousData.asks?.[index];
        if (!prevAsk || prevAsk.price !== ask.price || prevAsk.quantity !== ask.quantity) {
          newAnimated.add(`ask-${index}`);
        }
      });

      setAnimatedEntries(newAnimated);
      
      // Clear animations after 2 seconds
      setTimeout(() => setAnimatedEntries(new Set()), 2000);
    }
    
    setPreviousData(data);
  }, [data]);

  // Calculate heat map intensity (0-100)
  const getHeatIntensity = (volume: number): number => {
    if (maxVolume === 0) return 0;
    return Math.min(100, (volume / maxVolume) * 100);
  };

  // Format price with appropriate decimals
  const formatPrice = (price: number): string => {
    return price >= 1000 ? price.toFixed(2) : price.toFixed(4);
  };

  // Format quantity with appropriate decimals
  const formatQuantity = (quantity: number): string => {
    return quantity >= 1 ? quantity.toFixed(3) : quantity.toFixed(6);
  };

  // Format volume for display
  const formatVolume = (volume: number): string => {
    if (volume >= 1000000) return `$${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `$${(volume / 1000).toFixed(0)}K`;
    return `$${volume.toFixed(0)}`;
  };

  const spread = data.midPrice && data.asks?.[0] && data.bids?.[0] 
    ? data.asks[0].price - data.bids[0].price 
    : 0;

  const spreadPercent = data.midPrice && spread 
    ? (spread / data.midPrice) * 100 
    : 0;

  return (
    <Card className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-purple-400/30 backdrop-blur-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          🔥 Live Order Book
        </h2>
        <div className="text-right">
          <div className="text-sm text-gray-400">Spread</div>
          <div className="text-lg font-bold text-yellow-400">
            {spreadPercent.toFixed(4)}%
          </div>
        </div>
      </div>

      <div className="space-y-1">
        {/* Header */}
        <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-gray-400 border-b border-gray-700 pb-2">
          <div className="text-right">Price</div>
          <div className="text-center">Size</div>
          <div className="text-center">Total</div>
          <div></div>
        </div>

        {/* Asks (Sell Orders) - Red */}
        <div className="space-y-0.5">
          {data.asks?.slice(0, maxLevels).reverse().map((ask, index) => {
            const realIndex = data.asks!.length - 1 - index;
            const intensity = getHeatIntensity(ask.total);
            const isAnimated = animatedEntries.has(`ask-${realIndex}`);
            
            return (
              <div
                key={`ask-${realIndex}`}
                className={`grid grid-cols-4 gap-2 text-sm py-1 px-2 rounded-sm relative overflow-hidden transition-all duration-300 ${
                  isAnimated ? 'ring-2 ring-red-400/50 animate-pulse' : ''
                }`}
                style={{
                  background: `linear-gradient(to left, rgba(239, 68, 68, ${intensity / 400}) 0%, rgba(239, 68, 68, ${intensity / 600}) 100%)`
                }}
              >
                {/* Volume heat map background */}
                <div 
                  className="absolute inset-y-0 right-0 bg-red-500/10 transition-all duration-500"
                  style={{ width: `${intensity}%` }}
                />
                
                <div className="text-right font-mono text-red-300 relative z-10">
                  ${formatPrice(ask.price)}
                </div>
                <div className="text-center font-mono text-gray-300 relative z-10">
                  {formatQuantity(ask.quantity)}
                </div>
                <div className="text-center font-mono text-gray-400 text-xs relative z-10">
                  {formatVolume(ask.total)}
                </div>
                <div className="flex justify-center relative z-10">
                  {intensity > 70 && (
                    <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  )}
                </div>
                
                {/* Movement indicator */}
                {isAnimated && (
                  <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
                    <div className="w-1 h-1 bg-red-400 rounded-full animate-ping" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mid Price Spread */}
        {data.midPrice && (
          <div className="py-3 my-2 border-t border-b border-gray-600">
            <div className="text-center">
              <div className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                ${formatPrice(data.midPrice)}
              </div>
              <div className="text-xs text-gray-400">
                Spread: ${spread.toFixed(2)} ({spreadPercent.toFixed(3)}%)
              </div>
            </div>
          </div>
        )}

        {/* Bids (Buy Orders) - Green */}
        <div className="space-y-0.5">
          {data.bids?.slice(0, maxLevels).map((bid, index) => {
            const intensity = getHeatIntensity(bid.total);
            const isAnimated = animatedEntries.has(`bid-${index}`);
            
            return (
              <div
                key={`bid-${index}`}
                className={`grid grid-cols-4 gap-2 text-sm py-1 px-2 rounded-sm relative overflow-hidden transition-all duration-300 ${
                  isAnimated ? 'ring-2 ring-green-400/50 animate-pulse' : ''
                }`}
                style={{
                  background: `linear-gradient(to left, rgba(34, 197, 94, ${intensity / 400}) 0%, rgba(34, 197, 94, ${intensity / 600}) 100%)`
                }}
              >
                {/* Volume heat map background */}
                <div 
                  className="absolute inset-y-0 right-0 bg-green-500/10 transition-all duration-500"
                  style={{ width: `${intensity}%` }}
                />
                
                <div className="text-right font-mono text-green-300 relative z-10">
                  ${formatPrice(bid.price)}
                </div>
                <div className="text-center font-mono text-gray-300 relative z-10">
                  {formatQuantity(bid.quantity)}
                </div>
                <div className="text-center font-mono text-gray-400 text-xs relative z-10">
                  {formatVolume(bid.total)}
                </div>
                <div className="flex justify-center relative z-10">
                  {intensity > 70 && (
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  )}
                </div>
                
                {/* Movement indicator */}
                {isAnimated && (
                  <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
                    <div className="w-1 h-1 bg-green-400 rounded-full animate-ping" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Market Depth Visualization */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="text-sm font-semibold text-gray-400 mb-2">Market Depth</div>
          <div className="flex items-end justify-center space-x-1 h-12">
            {data.bids?.slice(0, 10).reverse().map((bid, index) => (
              <div
                key={`depth-bid-${index}`}
                className="bg-green-500/30 min-w-[2px] transition-all duration-500"
                style={{
                  height: `${(bid.total / maxVolume) * 100}%`,
                  minHeight: '2px'
                }}
              />
            ))}
            <div className="w-0.5 bg-yellow-400 h-full" />
            {data.asks?.slice(0, 10).map((ask, index) => (
              <div
                key={`depth-ask-${index}`}
                className="bg-red-500/30 min-w-[2px] transition-all duration-500"
                style={{
                  height: `${(ask.total / maxVolume) * 100}%`,
                  minHeight: '2px'
                }}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Bids</span>
            <span>Asks</span>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex justify-between items-center text-xs text-gray-400">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-2 bg-green-500/30 rounded-sm" />
                <span>Bid Depth</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-2 bg-red-500/30 rounded-sm" />
                <span>Ask Depth</span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              <span>Large Orders</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}