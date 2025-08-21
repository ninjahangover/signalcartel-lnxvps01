'use client';

import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { 
  Search, 
  Star, 
  TrendingUp, 
  Filter,
  X,
  Check
} from 'lucide-react';
import { 
  CRYPTO_TRADING_PAIRS, 
  POPULAR_PAIRS, 
  searchPairs, 
  groupPairsByBaseAsset 
} from '../lib/crypto-trading-pairs';

interface TradingPairSelectorProps {
  selectedPair?: string;
  onPairSelect: (symbol: string) => void;
  onClose?: () => void;
  title?: string;
  showPopularOnly?: boolean;
}

export default function TradingPairSelector({
  selectedPair,
  onPairSelect,
  onClose,
  title = "Select Trading Pair",
  showPopularOnly = false
}: TradingPairSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'usd' | 'usdt' | 'popular'>('popular');
  const [showFavorites, setShowFavorites] = useState(false);

  // Filter pairs based on search and category
  const filteredPairs = useMemo(() => {
    let pairs = showPopularOnly ? 
      CRYPTO_TRADING_PAIRS.filter(p => POPULAR_PAIRS.includes(p.symbol)) : 
      CRYPTO_TRADING_PAIRS;

    // Apply search filter
    if (searchQuery) {
      pairs = searchPairs(searchQuery);
    }

    // Apply category filter
    switch (selectedCategory) {
      case 'usd':
        pairs = pairs.filter(p => p.quoteAsset === 'USD');
        break;
      case 'usdt':
        pairs = pairs.filter(p => p.quoteAsset === 'USDT');
        break;
      case 'popular':
        pairs = pairs.filter(p => POPULAR_PAIRS.includes(p.symbol));
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    return pairs;
  }, [searchQuery, selectedCategory, showPopularOnly]);

  // Group pairs by base asset for better organization
  const groupedPairs = useMemo(() => {
    const grouped: Record<string, typeof filteredPairs> = {};
    filteredPairs.forEach(pair => {
      if (!grouped[pair.baseAsset]) {
        grouped[pair.baseAsset] = [];
      }
      grouped[pair.baseAsset].push(pair);
    });
    return grouped;
  }, [filteredPairs]);

  const handlePairSelect = (symbol: string) => {
    onPairSelect(symbol);
    if (onClose) onClose();
  };

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">{title}</h3>
        {onClose && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search trading pairs (e.g., BTC, ETH, Bitcoin)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'popular' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('popular')}
            className="text-xs"
          >
            <Star className="w-3 h-3 mr-1" />
            Popular
          </Button>
          <Button
            variant={selectedCategory === 'usd' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('usd')}
            className="text-xs"
          >
            USD Pairs
          </Button>
          <Button
            variant={selectedCategory === 'usdt' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('usdt')}
            className="text-xs"
          >
            USDT Pairs
          </Button>
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className="text-xs"
          >
            <Filter className="w-3 h-3 mr-1" />
            All Pairs
          </Button>
        </div>
      </div>

      {/* Currently Selected */}
      {selectedPair && (
        <Card className="p-3 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800">Current</Badge>
              <span className="font-semibold">{selectedPair}</span>
            </div>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
        </Card>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        {filteredPairs.length} trading pairs available
      </div>

      {/* Trading Pairs Grid */}
      <div className="max-h-96 overflow-y-auto space-y-4">
        {Object.keys(groupedPairs).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No trading pairs found matching your criteria</p>
          </div>
        ) : (
          Object.entries(groupedPairs)
            .sort(([a], [b]) => {
              // Sort popular assets first
              const aPopular = POPULAR_PAIRS.some(p => p.startsWith(a));
              const bPopular = POPULAR_PAIRS.some(p => p.startsWith(b));
              if (aPopular && !bPopular) return -1;
              if (!aPopular && bPopular) return 1;
              return a.localeCompare(b);
            })
            .map(([baseAsset, pairs]) => (
              <div key={baseAsset} className="space-y-2">
                {/* Base Asset Header */}
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-700">{baseAsset}</h4>
                  {POPULAR_PAIRS.some(p => p.startsWith(baseAsset)) && (
                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      Popular
                    </Badge>
                  )}
                </div>

                {/* Pair Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {pairs.map((pair) => (
                    <Button
                      key={pair.symbol}
                      variant={selectedPair === pair.symbol ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePairSelect(pair.symbol)}
                      className={`text-xs ${
                        selectedPair === pair.symbol 
                          ? 'bg-blue-600 text-white' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {selectedPair === pair.symbol && (
                          <Check className="w-3 h-3" />
                        )}
                        <span>{pair.displayName}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            ))
        )}
      </div>

      {/* Popular Pairs Quick Select */}
      {selectedCategory !== 'popular' && !showPopularOnly && (
        <Card className="p-4 bg-gray-50">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            Quick Select - Popular Pairs
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {POPULAR_PAIRS.slice(0, 16).map((symbol) => (
              <Button
                key={symbol}
                variant={selectedPair === symbol ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePairSelect(symbol)}
                className="text-xs"
              >
                {symbol.replace('USD', '').replace('USDT', '')}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Info */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• USD pairs: Trade directly against US Dollar</p>
        <p>• USDT pairs: Trade against Tether (USDT) stablecoin</p>
        <p>• Popular pairs have higher liquidity and tighter spreads</p>
      </div>
    </div>
  );
}