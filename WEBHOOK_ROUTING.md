# Stratus Engine Webhook Routing

## Overview

The Stratus Engine uses intelligent routing to ensure that paper trades and live trades are executed on the correct platforms with the appropriate APIs.

## Trading Mode Routing

### Paper Trading (Default)
- **Platform**: Alpaca
- **API**: Direct Alpaca Paper Trading API
- **Endpoint**: `https://paper-api.alpaca.markets`
- **Execution**: Real-time via `alpacaPaperTradingService.placeOrder()`
- **Safety**: No real money involved

### Live Trading
- **Platform**: Kraken
- **API**: kraken.circuitcartel.com/webhook
- **Endpoint**: `https://kraken.circuitcartel.com/webhook`
- **Execution**: HTTP POST to webhook endpoint
- **Safety**: REAL MONEY - only use when ready

## Webhook URL Structure

### Paper Trading (Default)
```
POST /api/pine-script-webhook
POST /api/pine-script-webhook?mode=paper
```

### Live Trading
```
POST /api/pine-script-webhook?mode=live
```

## Configuration

The routing logic is defined in `/src/lib/config.ts`:

```typescript
TRADING_MODES: {
  PAPER_TRADING_PLATFORM: 'alpaca',   // Direct Alpaca API
  LIVE_TRADING_PLATFORM: 'kraken',    // Webhook to kraken.circuitcartel.com
  DEFAULT_MODE: 'paper'                // Safe default
}
```

## Request/Response Examples

### Paper Trading Request
```bash
curl -X POST http://localhost:3000/api/pine-script-webhook?mode=paper \
  -H "Content-Type: application/json" \
  -d '{
    "strategy_id": "rsi_macd_scalper_v3",
    "action": "BUY",
    "symbol": "BTCUSD",
    "price": 43250.50,
    "quantity": 0.01
  }'
```

### Response
```json
{
  "message": "Alert processed successfully with optimization",
  "tradingMode": "paper",
  "platform": "alpaca",
  "executionMethod": "Alpaca Paper Trading via Direct API",
  "optimizationApplied": true,
  "aiConfidence": "87.3%"
}
```

### Live Trading Request
```bash
curl -X POST http://localhost:3000/api/pine-script-webhook?mode=live \
  -H "Content-Type: application/json" \
  -d '{
    "strategy_id": "rsi_macd_scalper_v3",
    "action": "BUY",
    "symbol": "BTCUSD",
    "price": 43250.50,
    "quantity": 0.01
  }'
```

### Response
```json
{
  "message": "Alert processed successfully with optimization",
  "tradingMode": "live",
  "platform": "kraken",
  "executionMethod": "Kraken Live Trading via kraken.circuitcartel.com/webhook",
  "optimizationApplied": true,
  "aiConfidence": "87.3%"
}
```

## Testing

Run the routing test to verify correct behavior:

```bash
node test-trading-routing.js
```

## Safety Features

1. **Default to Paper Trading**: If no mode is specified, defaults to safe paper trading
2. **Clear Execution Methods**: Response always shows exactly which API will be used
3. **No Accidental Live Trading**: Must explicitly specify `mode=live`
4. **Separate API Credentials**: Paper and live use completely different credentials

## Integration Points

### Stratus Engine Dashboard
- Paper Trading tab shows Alpaca integration status
- Live Trading tab shows Kraken webhook status

### Pine Script Strategies
- No changes needed to Pine Script code
- Stratus Engine handles routing automatically based on mode

### AI Optimization
- Same optimization logic applies to both paper and live
- Real-time parameter adjustment works for both modes