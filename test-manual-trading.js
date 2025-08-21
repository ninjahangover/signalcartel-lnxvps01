// Quick test script for manual trading functionality
const express = require('express');
const cors = require('cors');

const app = express();
const port = 3002;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'manual-trading-test', 
    timestamp: new Date().toISOString() 
  });
});

// Mock market data
app.get('/api/market-data/:symbol', (req, res) => {
  const { symbol } = req.params;
  res.json({
    symbol: symbol.toUpperCase(),
    price: symbol.toLowerCase().includes('btc') ? 113750 : 4300,
    timestamp: new Date().toISOString(),
    source: 'test-mock'
  });
});

// Mock trade execution
app.post('/api/manual-trade', (req, res) => {
  const { symbol, side, quantity, strategy = 'manual' } = req.body;
  
  if (!symbol || !side || !quantity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const mockResult = {
    success: true,
    orderId: `TEST_${Date.now()}`,
    status: 'filled',
    price: symbol.toLowerCase().includes('btc') ? 113750 : 4300,
    quantity: parseFloat(quantity),
    symbol: symbol.toUpperCase(),
    side: side.toLowerCase(),
    strategy,
    timestamp: new Date().toISOString()
  };

  console.log('🎯 Test Trade:', mockResult);
  res.json({ success: true, trade: mockResult });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🎯 Manual Trading Test Server running on port ${port}`);
});