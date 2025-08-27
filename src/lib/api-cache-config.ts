/**
 * API Cache Configuration for High-Velocity Trading
 * 
 * With 300+ trades per hour, we need aggressive caching strategies
 * to prevent stale data while maintaining performance
 */

export const API_CACHE_CONFIG = {
  // Dashboard endpoints - very short cache for real-time data
  dashboard: {
    maxAge: 2, // 2 seconds cache
    staleWhileRevalidate: 1, // Allow stale for 1 second while fetching
  },
  
  // Trade data - no cache, always fresh
  trades: {
    maxAge: 0,
    noStore: true,
  },
  
  // Signals - very short cache
  signals: {
    maxAge: 3,
    staleWhileRevalidate: 2,
  },
  
  // Strategy performance - slightly longer cache
  performance: {
    maxAge: 10,
    staleWhileRevalidate: 5,
  },
  
  // Market data - medium cache
  marketData: {
    maxAge: 30,
    staleWhileRevalidate: 10,
  },
  
  // AI systems status - short cache for live intelligence
  'ai-systems': {
    maxAge: 5,
    staleWhileRevalidate: 3,
  }
};

/**
 * Generate cache headers for API responses
 */
export function getCacheHeaders(type: keyof typeof API_CACHE_CONFIG) {
  const config = API_CACHE_CONFIG[type];
  
  const headers: HeadersInit = {};
  
  if (config.noStore) {
    headers['Cache-Control'] = 'no-store, no-cache, must-revalidate';
  } else if (config.maxAge === 0) {
    headers['Cache-Control'] = 'no-cache, must-revalidate';
  } else {
    const directives = [`max-age=${config.maxAge}`];
    
    if (config.staleWhileRevalidate) {
      directives.push(`stale-while-revalidate=${config.staleWhileRevalidate}`);
    }
    
    headers['Cache-Control'] = directives.join(', ');
  }
  
  // Add timestamp for debugging
  headers['X-Cache-Generated'] = new Date().toISOString();
  
  return headers;
}

/**
 * Dashboard refresh intervals for high-velocity trading
 */
export const DASHBOARD_REFRESH_INTERVALS = {
  // Critical real-time data
  trades: 2000,        // 2 seconds for trade data
  positions: 3000,     // 3 seconds for position updates
  signals: 2000,       // 2 seconds for new signals
  
  // Performance metrics
  performance: 5000,   // 5 seconds for P&L updates
  winRate: 10000,     // 10 seconds for win rate
  
  // Less critical data
  strategies: 15000,   // 15 seconds for strategy status
  system: 30000,      // 30 seconds for system health
  
  // Phase transition monitoring
  phaseStatus: 5000,  // 5 seconds to catch phase transitions
};