# Archived Alert Services

This directory contains legacy alert services that have been replaced by the unified Telegram alert system.

## Archived Files (August 22, 2025)

### NTFY Services (Deprecated due to daily limits)
- `ntfy-alerts.ts` - Original NTFY alert service
- `smart-ntfy-alerts.ts` - Enhanced NTFY with batching (hit daily limits)

### Old Telegram Services (Replaced by unified service)
- `telegram-bot-service.ts` - Legacy Telegram bot service
- `telegram-simple.ts` - Simple Telegram implementation

## Replacement

All functionality has been consolidated into:
- `src/lib/telegram-alert-service.ts` - Unified Telegram alert service

## Reason for Archival

These services were archived as part of the migration from NTFY to Telegram alerts:

1. **NTFY Limitations**: NTFY service hit daily message quotas, causing alert failures
2. **Service Fragmentation**: Multiple Telegram implementations caused inconsistency  
3. **Code Cleanup**: User requested to "archive all of the services to keep things clean"
4. **Unified Implementation**: "The all should have the same kind of implementation as far as alerts and optimizations"

## Migration Status

✅ **Completed Migration**
- QUANTUM FORGE™ Custom Paper Trading Engine
- AI Optimization Engine (Pine Script Input Optimizer)  
- Strategy Execution Engine
- Stability Monitoring Scripts

All systems now use the unified `telegramAlerts` service with consistent messaging format.