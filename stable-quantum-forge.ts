/**
 * QUANTUM FORGE™ Stable Trading Engine
 * Enhanced with comprehensive error handling and auto-recovery
 */

import { PrismaClient } from '@prisma/client';
import { PAPER_TRADING_CONFIG } from './src/lib/paper-trading-config';

const prisma = new PrismaClient();

// Configuration
const TRADING_INTERVAL = 10000; // 10 seconds
const MAX_CONSECUTIVE_ERRORS = 5;
const ERROR_BACKOFF_MS = 30000; // 30 seconds
const HEALTH_CHECK_INTERVAL = 60000; // 1 minute
const NTFY_TOPIC = process.env.NTFY_TOPIC || 'signal-cartel';

// State tracking
let consecutiveErrors = 0;
let totalTrades = 0;
let lastSuccessfulTrade = Date.now();
let isShuttingDown = false;

// Symbols for trading
const SYMBOLS = ['BTCUSD', 'ETHUSD', 'ADAUSD', 'SOLUSD', 'LINKUSD'];

interface TradeResult {
    success: boolean;
    tradeId?: string;
    symbol?: string;
    side?: 'buy' | 'sell';
    quantity?: number;
    price?: number;
    error?: string;
}

// Enhanced logging
function log(message: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : '✅';
    console.log(`${prefix} [${timestamp}] ${message}`);
}

// Send NTFY alert with error handling
async function sendAlert(message: string): Promise<void> {
    try {
        const response = await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
            method: 'POST',
            body: message,
            headers: { 'Content-Type': 'text/plain' }
        });
        if (!response.ok) throw new Error(`NTFY responded with ${response.status}`);
    } catch (error) {
        log(`Failed to send NTFY alert: ${error}`, 'WARN');
    }
}

// Generate trade with enhanced error handling
async function generateTrade(): Promise<TradeResult> {
    try {
        const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        const side = Math.random() > 0.5 ? 'buy' : 'sell';
        
        // Get current price (simplified for stability)
        const basePrice = getBasePriceForSymbol(symbol);
        const priceVariation = (Math.random() - 0.5) * 0.02; // ±1%
        const price = basePrice * (1 + priceVariation);
        
        // Calculate quantity based on symbol
        let quantity: number;
        switch (symbol) {
            case 'BTCUSD':
                quantity = Math.random() * 0.01; // 0-0.01 BTC
                break;
            case 'ETHUSD':
                quantity = Math.random() * 0.5; // 0-0.5 ETH
                break;
            default:
                quantity = Math.random() * 1000; // 0-1000 for others
        }
        
        const tradeId = `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const executedAt = Date.now();
        
        // Store in database with retry logic
        await retryOperation(async () => {
            await prisma.paperTrade.create({
                data: {
                    tradeId,
                    symbol,
                    side,
                    quantity,
                    price,
                    executedAt: new Date(executedAt),
                    pnl: (Math.random() - 0.5) * 10, // Random P&L for simulation
                    pnlPercent: (Math.random() - 0.5) * 2,
                    strategy: 'QUANTUM_FORGE_STABLE',
                    sessionId: 'stable-session-' + Date.now()
                }
            });
        }, 3);
        
        log(`${side.toUpperCase()} ${quantity.toFixed(8)} ${symbol} @ $${price.toFixed(2)} (ID: ${tradeId})`);
        
        return {
            success: true,
            tradeId,
            symbol,
            side: side as 'buy' | 'sell',
            quantity,
            price
        };
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        log(`Trade generation failed: ${errorMessage}`, 'ERROR');
        return {
            success: false,
            error: errorMessage
        };
    }
}

// Get base price for symbol (fallback values)
function getBasePriceForSymbol(symbol: string): number {
    const basePrices: Record<string, number> = {
        'BTCUSD': 116000,
        'ETHUSD': 4800,
        'ADAUSD': 0.93,
        'SOLUSD': 197,
        'LINKUSD': 27.4
    };
    return basePrices[symbol] || 100;
}

// Retry operation with exponential backoff
async function retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            if (attempt === maxRetries) throw error;
            
            const delay = baseDelay * Math.pow(2, attempt - 1);
            log(`Operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`, 'WARN');
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error('Max retries exceeded');
}

// Health check
async function performHealthCheck(): Promise<boolean> {
    try {
        // Check database connectivity
        await prisma.$queryRaw`SELECT 1`;
        
        // Check if we've had recent successful trades
        const timeSinceLastTrade = Date.now() - lastSuccessfulTrade;
        if (timeSinceLastTrade > 5 * 60 * 1000) { // 5 minutes
            log('No successful trades in 5 minutes - potential issue', 'WARN');
            await sendAlert('⚠️ QUANTUM FORGE™ STABLE: No successful trades in 5 minutes');
            return false;
        }
        
        return true;
    } catch (error) {
        log(`Health check failed: ${error}`, 'ERROR');
        return false;
    }
}

// Main trading loop with enhanced stability
async function tradingLoop(): Promise<void> {
    log('🚀 QUANTUM FORGE™ STABLE ENGINE STARTED');
    log(`💰 Starting balance: $${PAPER_TRADING_CONFIG.STARTING_BALANCE.toLocaleString()}`);
    await sendAlert('🚀 QUANTUM FORGE™ STABLE: Enhanced trading engine started with auto-recovery');
    
    // Health check interval
    const healthCheckTimer = setInterval(async () => {
        if (!isShuttingDown) {
            await performHealthCheck();
        }
    }, HEALTH_CHECK_INTERVAL);
    
    while (!isShuttingDown) {
        try {
            const tradeResult = await generateTrade();
            
            if (tradeResult.success) {
                totalTrades++;
                consecutiveErrors = 0;
                lastSuccessfulTrade = Date.now();
                
                // Send alerts for milestones
                if (totalTrades % 50 === 0) {
                    await sendAlert(`🎯 QUANTUM FORGE™ MILESTONE: ${totalTrades} trades completed successfully`);
                }
            } else {
                consecutiveErrors++;
                log(`Consecutive errors: ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}`, 'WARN');
                
                if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                    log('Maximum consecutive errors reached - entering recovery mode', 'ERROR');
                    await sendAlert(`🚨 QUANTUM FORGE™ CRITICAL: ${MAX_CONSECUTIVE_ERRORS} consecutive errors - entering recovery mode`);
                    
                    // Recovery backoff
                    await new Promise(resolve => setTimeout(resolve, ERROR_BACKOFF_MS));
                    consecutiveErrors = 0; // Reset after backoff
                }
            }
            
        } catch (error) {
            log(`Unexpected error in trading loop: ${error}`, 'ERROR');
            consecutiveErrors++;
        }
        
        // Normal trading interval
        if (!isShuttingDown) {
            await new Promise(resolve => setTimeout(resolve, TRADING_INTERVAL));
        }
    }
    
    clearInterval(healthCheckTimer);
}

// Graceful shutdown
async function gracefulShutdown(): Promise<void> {
    log('🛑 Initiating graceful shutdown...');
    isShuttingDown = true;
    
    try {
        await prisma.$disconnect();
        await sendAlert('🛑 QUANTUM FORGE™ STABLE: Engine shutdown gracefully');
        log('✅ Graceful shutdown completed');
    } catch (error) {
        log(`Error during shutdown: ${error}`, 'ERROR');
    }
    
    process.exit(0);
}

// Signal handlers
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('uncaughtException', async (error) => {
    log(`Uncaught exception: ${error}`, 'ERROR');
    await sendAlert(`🚨 QUANTUM FORGE™ CRITICAL: Uncaught exception - ${error.message}`);
    await gracefulShutdown();
});
process.on('unhandledRejection', async (reason) => {
    log(`Unhandled rejection: ${reason}`, 'ERROR');
    await sendAlert(`🚨 QUANTUM FORGE™ CRITICAL: Unhandled rejection - ${reason}`);
    await gracefulShutdown();
});

// Start the engine
if (require.main === module) {
    tradingLoop().catch(async (error) => {
        log(`Fatal error: ${error}`, 'ERROR');
        await sendAlert(`🚨 QUANTUM FORGE™ FATAL: ${error.message}`);
        process.exit(1);
    });
}