import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'manual-trading', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Get current market data from Kraken webhook
app.get('/api/market-data/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // For now, return mock data - we'll connect to real Kraken webhook later
    res.json({
      symbol: symbol.toUpperCase(),
      price: symbol.toLowerCase().includes('btc') ? 113750 : 4300,
      timestamp: new Date().toISOString(),
      source: 'kraken-webhook',
      status: 'mock'
    });
  } catch (error) {
    console.error('Error fetching market data:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

// Execute manual trade
app.post('/api/manual-trade', async (req, res) => {
  try {
    const { symbol, side, quantity, orderType = 'market', limitPrice, strategy = 'manual' } = req.body;

    // Validate required fields
    if (!symbol || !side || !quantity) {
      return res.status(400).json({ error: 'Missing required fields: symbol, side, quantity' });
    }

    // Mock trade execution - we'll connect to real Alpaca API later
    const mockTradeResult = {
      success: true,
      orderId: `MOCK_${Date.now()}`,
      status: 'filled',
      price: symbol.toLowerCase().includes('btc') ? 113750 : 4300,
      quantity: parseFloat(quantity),
      symbol: symbol.toUpperCase(),
      side: side.toLowerCase(),
      strategy,
      timestamp: new Date().toISOString(),
      type: 'manual'
    };

    console.log('🎯 Manual Trade Executed:', mockTradeResult);

    res.json({
      success: true,
      trade: mockTradeResult,
      message: 'Mock trade executed successfully - ready for real integration!'
    });

  } catch (error) {
    console.error('Error executing manual trade:', error);
    res.status(500).json({ error: 'Failed to execute trade', details: error.message });
  }
});

// Get strategy status and signals
app.get('/api/strategy-status', async (req, res) => {
  try {
    res.json({
      strategies: [
        {
          name: 'RSI Pullback Pro',
          status: 'active',
          lastSignal: '2025-08-19T10:30:00Z',
          currentRSI: 45.2,
          threshold: { buy: 30, sell: 70 },
          reason: 'RSI not in oversold/overbought range'
        },
        {
          name: 'Claude Quantum Oscillator',
          status: 'active', 
          lastSignal: '2025-08-18T15:45:00Z',
          currentValue: 0.65,
          threshold: { buy: 0.8, sell: 0.2 },
          reason: 'Signal strength below threshold'
        },
        {
          name: 'Stratus Core Neural',
          status: 'active',
          lastSignal: '2025-08-20T09:15:00Z',
          confidence: 0.72,
          threshold: { minimum: 0.8 },
          reason: 'Neural confidence below minimum threshold'
        }
      ],
      marketConditions: {
        btcPrice: 113750,
        volatility: 'medium',
        trend: 'sideways',
        volume: 'normal'
      },
      status: 'All strategies loaded but no triggers met'
    });
  } catch (error) {
    console.error('Error fetching strategy status:', error);
    res.status(500).json({ error: 'Failed to fetch strategy status' });
  }
});

// Get trade history (mock data for now)
app.get('/api/trades', async (req, res) => {
  try {
    const mockTrades = [
      {
        id: '1',
        symbol: 'BTCUSD',
        side: 'buy',
        quantity: 0.01,
        price: 113500,
        strategy: 'manual',
        type: 'manual',
        status: 'filled',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '2',
        symbol: 'BTCUSD', 
        side: 'sell',
        quantity: 0.01,
        price: 114000,
        strategy: 'manual',
        type: 'manual',
        status: 'filled',
        timestamp: new Date().toISOString()
      }
    ];

    res.json(mockTrades);
  } catch (error) {
    console.error('Error fetching trades:', error);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🎯 Manual Trading Service running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
  console.log(`🚀 Ready to debug paper trading pipeline!`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Manual Trading Service shutting down...');
  process.exit(0);
});