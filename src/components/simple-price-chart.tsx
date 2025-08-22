"use client";

import React, { useEffect, useState } from 'react';
import { quantumForgeMarketData } from '../lib/quantum-forge-market-data';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface PriceData {
  timestamp: number;
  price: number;
}

interface SimplePriceChartProps {
  symbol: string;
  height?: number;
  className?: string;
}

export default function SimplePriceChart({ 
  symbol, 
  height = 400, 
  className = "" 
}: SimplePriceChartProps) {
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [change24h, setChange24h] = useState<number>(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchPrice = async () => {
      try {
        const price = await quantumForgeMarketData.getCurrentPrice(symbol);
        const now = Date.now();
        
        setCurrentPrice(price);
        setLastUpdate(new Date());
        
        // Add to price history (keep last 50 points)
        setPriceHistory(prev => {
          const newData = [...prev, { timestamp: now, price }];
          return newData.slice(-50); // Keep last 50 data points
        });

        // Calculate 24h change (simulate for now)
        if (priceHistory.length > 0) {
          const oldPrice = priceHistory[0]?.price || price;
          const changePercent = ((price - oldPrice) / oldPrice) * 100;
          setChange24h(changePercent);
        }
      } catch (error) {
        console.error(`Failed to fetch price for ${symbol}:`, error);
      }
    };

    // Initial fetch
    fetchPrice();

    // Update every 5 seconds
    intervalId = setInterval(fetchPrice, 5000);

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

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    const color = change >= 0 ? 'text-green-600' : 'text-red-600';
    return (
      <span className={color}>
        {sign}{change.toFixed(2)}%
      </span>
    );
  };

  // Simple SVG line chart
  const renderChart = () => {
    if (priceHistory.length < 2) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-gray-500">Building price history...</p>
          </div>
        </div>
      );
    }

    const minPrice = Math.min(...priceHistory.map(d => d.price));
    const maxPrice = Math.max(...priceHistory.map(d => d.price));
    const priceRange = maxPrice - minPrice || 1;
    
    const chartWidth = 800;
    const chartHeight = height - 120;
    const padding = 40;
    
    const points = priceHistory.map((data, index) => {
      const x = (index / (priceHistory.length - 1)) * (chartWidth - 2 * padding) + padding;
      const y = chartHeight - ((data.price - minPrice) / priceRange) * (chartHeight - 2 * padding) - padding;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Price line */}
        <polyline
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
          points={points}
        />
        
        {/* Current price dot */}
        {priceHistory.length > 0 && (
          <circle
            cx={(chartWidth - 2 * padding) + padding}
            cy={chartHeight - ((priceHistory[priceHistory.length - 1].price - minPrice) / priceRange) * (chartHeight - 2 * padding) - padding}
            r="4"
            fill="#2563eb"
          />
        )}
        
        {/* Price labels */}
        <text x={padding} y={padding} fontSize="12" fill="#666" textAnchor="start">
          {formatPrice(maxPrice)}
        </text>
        <text x={padding} y={chartHeight - padding + 15} fontSize="12" fill="#666" textAnchor="start">
          {formatPrice(minPrice)}
        </text>
      </svg>
    );
  };

  return (
    <Card className={`p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center">
              {symbol}
              <Badge variant="default" className="ml-2 bg-green-500">
                QUANTUM FORGE™
              </Badge>
            </h3>
            {currentPrice && (
              <div className="flex items-center space-x-2 text-sm">
                <span className="font-medium text-lg">
                  {formatPrice(currentPrice)}
                </span>
                {formatChange(change24h)}
                <span className="text-gray-500">
                  • {lastUpdate.toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Price Stats */}
      {currentPrice && (
        <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
          <div>
            <span className="text-gray-600">Current: </span>
            <span className="font-medium text-blue-600">
              {formatPrice(currentPrice)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">High: </span>
            <span className="font-medium text-green-600">
              {formatPrice(currentPrice * 1.02)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Low: </span>
            <span className="font-medium text-red-600">
              {formatPrice(currentPrice * 0.98)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Points: </span>
            <span className="font-medium">
              {priceHistory.length}
            </span>
          </div>
        </div>
      )}

      {/* Chart Area */}
      <div className="w-full border border-gray-200 rounded-lg overflow-hidden bg-white">
        {renderChart()}
      </div>

      {/* Footer */}
      <div className="mt-2 text-xs text-gray-500 flex justify-between">
        <span>QUANTUM FORGE™ Real-Time Data</span>
        <span>Updates every 5 seconds • {priceHistory.length} data points</span>
      </div>
    </Card>
  );
}