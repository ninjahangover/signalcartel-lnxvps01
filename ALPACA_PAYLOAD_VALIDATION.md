# Alpaca Paper Trading Payload Validation

## Overview

The Stratus Engine now includes comprehensive payload validation for Alpaca Paper Trading API integration. This ensures that Pine Script webhook data is properly formatted and validated before being sent to Alpaca's API.

## Validation Process

### 1. Symbol Validation
```typescript
// Input: BTCUSD, ETHUSD, AAPL, etc.
// Output: BTC, ETH, AAPL (removes USD/USDT suffix)
// Validation: 1-5 uppercase letters only
```

### 2. Action/Side Validation
```typescript
// Accepted inputs: 'BUY', 'SELL', 'buy', 'sell'
// Output: 'buy' | 'sell'
// Sources: action, side, strategy.order_action
```

### 3. Quantity Validation
```typescript
// Sources: quantity, qty, strategy.order_contracts, strategy.position_size
// Validation: 
//   - Must be positive number
//   - Maximum 10,000 shares for safety
//   - Supports fractional shares
```

### 4. Price and Order Type
```typescript
// Market Order: No price specified
// Limit Order: Price specified
// Sources: price, limit_price, strategy.order_price
// Validation: Must be positive, max $1,000,000/share
```

### 5. Time in Force
```typescript
// Default: 'day'
// Valid options: 'day', 'gtc', 'ioc', 'fok'
// Sources: time_in_force, timeInForce, strategy.time_in_force
```

## Supported Webhook Formats

### Standard Format
```json
{
  "strategy_id": "rsi_macd_scalper_v3",
  "action": "BUY",
  "symbol": "BTCUSD",
  "price": 43250.50,
  "quantity": 0.01,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Alternative Format
```json
{
  "action": "SELL",
  "ticker": "ETHUSD",
  "qty": 0.5,
  "limit_price": 2500.00,
  "time_in_force": "gtc"
}
```

### Strategy Object Format
```json
{
  "strategy_id": "fibonacci_master",
  "symbol": "SOLUSD",
  "strategy": {
    "order_action": "buy",
    "order_contracts": 2.5,
    "order_price": 180.25,
    "time_in_force": "day"
  }
}
```

## Alpaca API Payload Output

### Market Order Example
```json
{
  "symbol": "BTC",
  "qty": "0.01",
  "side": "buy",
  "type": "market",
  "time_in_force": "day"
}
```

### Limit Order Example
```json
{
  "symbol": "ETH",
  "qty": "0.5", 
  "side": "sell",
  "type": "limit",
  "time_in_force": "gtc",
  "limit_price": "2500.00"
}
```

## Error Handling

### Validation Errors
- **Missing Symbol**: `Missing required field: symbol`
- **Missing Action**: `Missing required field: action/side`
- **Invalid Side**: `Invalid side: HOLD. Must be 'buy' or 'sell'`
- **Invalid Quantity**: `Invalid quantity: -1. Must be a positive number`
- **Quantity Too Large**: `Quantity too large: 50000. Maximum 10,000 shares for safety`
- **Invalid Symbol**: `Invalid Alpaca symbol format: BTC123. Must be 1-5 uppercase letters`
- **Price Too High**: `Price too high: 2000000. Maximum $1,000,000 per share for safety`
- **Invalid Time in Force**: `Invalid time_in_force: forever. Must be one of: day, gtc, ioc, fok`

### Error Response Format
```json
{
  "platform": "alpaca",
  "success": false,
  "error": "Missing required field: symbol",
  "webhookData": { "action": "BUY", "quantity": 1 },
  "validationPassed": false,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Testing

### Run Validation Tests
```bash
node test-alpaca-payload-validation.js
```

### Test Specific Format
```bash
curl -X POST http://localhost:3000/api/pine-script-webhook?mode=paper \
  -H "Content-Type: application/json" \
  -d '{
    "action": "BUY",
    "symbol": "BTCUSD", 
    "quantity": 0.01,
    "price": 43250.50
  }'
```

## Integration Notes

### Pine Script Webhooks
- No changes needed to existing Pine Script strategies
- Multiple webhook formats supported automatically
- Validation happens before API call

### Alpaca API Requirements
- Uses Paper Trading endpoint: `https://paper-api.alpaca.markets/v2/orders`
- Requires API key and secret (in .env.local)
- All orders are paper trading only (no real money)

### Stratus Engine Integration
- Validation runs before every Alpaca order
- Failed validation prevents API call
- Detailed logging for debugging
- Returns structured error responses

## Safety Features

1. **Input Validation**: All fields validated before processing
2. **Reasonable Limits**: Max quantity and price limits
3. **Symbol Conversion**: Automatic USD suffix removal
4. **Error Handling**: Graceful failure with detailed messages
5. **Paper Trading Only**: No risk to real money
6. **Comprehensive Logging**: Full audit trail of all orders