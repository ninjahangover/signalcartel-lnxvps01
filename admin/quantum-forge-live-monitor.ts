#!/usr/bin/env npx tsx
/**
 * QUANTUM FORGE™ Live Trading Monitor
 * Real-time dashboard for monitoring trading activity, phase transitions, and performance
 */

import { PrismaClient } from '@prisma/client';
import { phaseManager } from '../src/lib/quantum-forge-phase-config';
import { adaptivePhaseManager } from '../src/lib/quantum-forge-adaptive-phase-manager';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Log file setup
const LOG_DIR = '/tmp/signalcartel-logs';
const TRADE_LOG = path.join(LOG_DIR, 'quantum-forge-trades.log');
const PHASE_LOG = path.join(LOG_DIR, 'quantum-forge-phases.log');
const ERROR_LOG = path.join(LOG_DIR, 'quantum-forge-errors.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

interface MonitorState {
  lastTradeCount: number;
  lastPositionCount: number;
  lastPhase: number;
  startTime: Date;
  sessionStats: {
    tradesGenerated: number;
    positionsOpened: number;
    positionsClosed: number;
    totalPnL: number;
    winCount: number;
    lossCount: number;
  };
}

let monitorState: MonitorState = {
  lastTradeCount: 0,
  lastPositionCount: 0,
  lastPhase: 0,
  startTime: new Date(),
  sessionStats: {
    tradesGenerated: 0,
    positionsOpened: 0,
    positionsClosed: 0,
    totalPnL: 0,
    winCount: 0,
    lossCount: 0
  }
};

function logToFile(logFile: string, message: string) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, logEntry);
}

function colorText(text: string, color: 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray'): string {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m'
  };
  const reset = '\x1b[0m';
  return `${colors[color]}${text}${reset}`;
}

function formatNumber(num: number, decimals: number = 2): string {
  if (Math.abs(num) >= 1000) {
    return num.toLocaleString();
  }
  return num.toFixed(decimals);
}

async function displayHeader() {
  console.clear();
  console.log(colorText('🚀 QUANTUM FORGE™ LIVE TRADING MONITOR', 'cyan'));
  console.log(colorText('=' .repeat(100), 'gray'));
  
  const uptime = Math.floor((Date.now() - monitorState.startTime.getTime()) / 1000);
  const uptimeStr = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`;
  
  console.log(colorText(`📊 Session Started: ${monitorState.startTime.toLocaleTimeString()} | Uptime: ${uptimeStr}`, 'white'));
  console.log(colorText('💡 Log Files: tail -f /tmp/signalcartel-logs/*.log', 'yellow'));
  console.log('');
}

async function displayPhaseStatus() {
  try {
    // Update trade count to get fresh data
    await phaseManager.updateTradeCount();
    
    const currentPhase = await phaseManager.getCurrentPhase();
    const progress = await phaseManager.getProgressToNextPhase();
    const overrideStatus = phaseManager.getOverrideStatus();
    
    console.log(colorText('🎯 PHASE STATUS', 'magenta'));
    console.log(colorText('-'.repeat(50), 'gray'));
    
    const phaseColor = currentPhase.phase === 0 ? 'yellow' : currentPhase.phase <= 2 ? 'cyan' : 'green';
    console.log(`${colorText('Phase:', 'white')} ${colorText(`${currentPhase.phase} - ${currentPhase.name}`, phaseColor)}`);
    console.log(`${colorText('Mode:', 'white')} ${colorText(overrideStatus.mode.toUpperCase(), 'cyan')}`);
    console.log(`${colorText('Completed Trades:', 'white')} ${colorText(progress.currentTrades.toString(), 'green')}/${currentPhase.maxTrades}`);
    console.log(`${colorText('Progress:', 'white')} ${colorText(`${progress.progress}%`, 'yellow')} (${progress.tradesNeeded} needed for next phase)`);
    console.log(`${colorText('Confidence Threshold:', 'white')} ${colorText(`${(currentPhase.features.confidenceThreshold * 100).toFixed(1)}%`, 'cyan')}`);
    
    // Log phase changes
    if (currentPhase.phase !== monitorState.lastPhase) {
      const phaseMsg = `PHASE TRANSITION: ${monitorState.lastPhase} → ${currentPhase.phase} (${currentPhase.name})`;
      logToFile(PHASE_LOG, phaseMsg);
      console.log(colorText(`🚀 ${phaseMsg}`, 'green'));
      monitorState.lastPhase = currentPhase.phase;
    }
    
  } catch (error) {
    console.log(colorText('❌ Phase status error: ' + error.message, 'red'));
    logToFile(ERROR_LOG, `Phase status error: ${error.message}`);
  }
  
  console.log('');
}

async function displayLiveActivity() {
  try {
    // Get current counts
    const totalTrades = await prisma.managedTrade.count();
    const totalPositions = await prisma.managedPosition.count();
    const openPositions = await prisma.managedPosition.count({ where: { status: 'open' } });
    const closedPositions = await prisma.managedPosition.count({ where: { status: 'closed' } });
    
    console.log(colorText('⚡ LIVE ACTIVITY', 'green'));
    console.log(colorText('-'.repeat(50), 'gray'));
    
    // Check for new trades
    const newTrades = totalTrades - monitorState.lastTradeCount;
    if (newTrades > 0) {
      console.log(colorText(`🆕 ${newTrades} NEW TRADES GENERATED!`, 'green'));
      logToFile(TRADE_LOG, `${newTrades} new trades generated (total: ${totalTrades})`);
      monitorState.sessionStats.tradesGenerated += newTrades;
    }
    
    // Check for new positions
    const newPositions = totalPositions - monitorState.lastPositionCount;
    if (newPositions > 0) {
      const newOpen = openPositions - (monitorState.lastPositionCount - closedPositions);
      const newClosed = closedPositions - (monitorState.lastPositionCount - openPositions);
      
      if (newOpen > 0) {
        console.log(colorText(`📈 ${newOpen} NEW POSITIONS OPENED!`, 'cyan'));
        logToFile(TRADE_LOG, `${newOpen} positions opened (total open: ${openPositions})`);
        monitorState.sessionStats.positionsOpened += newOpen;
      }
      
      if (newClosed > 0) {
        console.log(colorText(`💰 ${newClosed} POSITIONS CLOSED!`, 'yellow'));
        logToFile(TRADE_LOG, `${newClosed} positions closed (total closed: ${closedPositions})`);
        monitorState.sessionStats.positionsClosed += newClosed;
      }
    }
    
    console.log(`${colorText('Total Trades:', 'white')} ${colorText(totalTrades.toString(), 'cyan')}`);
    console.log(`${colorText('Open Positions:', 'white')} ${colorText(openPositions.toString(), 'green')}`);
    console.log(`${colorText('Closed Positions:', 'white')} ${colorText(closedPositions.toString(), 'yellow')}`);
    
    // Update counters
    monitorState.lastTradeCount = totalTrades;
    monitorState.lastPositionCount = totalPositions;
    
  } catch (error) {
    console.log(colorText('❌ Activity monitoring error: ' + error.message, 'red'));
    logToFile(ERROR_LOG, `Activity monitoring error: ${error.message}`);
  }
  
  console.log('');
}

async function displayRecentActivity() {
  try {
    // Get recent positions
    const recentPositions = await prisma.managedPosition.findMany({
      orderBy: { entryTime: 'desc' },
      take: 5,
      include: {
        entryTrade: true,
        exitTrade: true
      }
    });
    
    if (recentPositions.length > 0) {
      console.log(colorText('📋 RECENT POSITIONS', 'blue'));
      console.log(colorText('-'.repeat(50), 'gray'));
      
      recentPositions.forEach((pos, i) => {
        const ago = Math.floor((Date.now() - pos.entryTime.getTime()) / 1000 / 60);
        const statusColor = pos.status === 'open' ? 'green' : pos.status === 'closed' ? 'yellow' : 'gray';
        const pnlText = pos.realizedPnL ? `P&L: $${formatNumber(pos.realizedPnL)}` : 'Open';
        const pnlColor = pos.realizedPnL ? (pos.realizedPnL > 0 ? 'green' : 'red') : 'gray';
        
        console.log(`  ${i + 1}. ${colorText(pos.strategy, 'cyan')} | ${pos.symbol} ${pos.side.toUpperCase()} @ $${formatNumber(pos.entryPrice)} | ${colorText(pos.status.toUpperCase(), statusColor)} | ${colorText(pnlText, pnlColor)} | ${ago}m ago`);
      });
    }
    
  } catch (error) {
    console.log(colorText('❌ Recent activity error: ' + error.message, 'red'));
    logToFile(ERROR_LOG, `Recent activity error: ${error.message}`);
  }
  
  console.log('');
}

async function displaySessionStats() {
  try {
    console.log(colorText('📊 SESSION STATISTICS', 'magenta'));
    console.log(colorText('-'.repeat(50), 'gray'));
    
    const uptime = Math.floor((Date.now() - monitorState.startTime.getTime()) / 1000);
    const tradesPerHour = uptime > 0 ? (monitorState.sessionStats.tradesGenerated / (uptime / 3600)).toFixed(1) : '0';
    const positionsPerHour = uptime > 0 ? (monitorState.sessionStats.positionsOpened / (uptime / 3600)).toFixed(1) : '0';
    
    console.log(`${colorText('Trades Generated:', 'white')} ${colorText(monitorState.sessionStats.tradesGenerated.toString(), 'green')} (${tradesPerHour}/hour)`);
    console.log(`${colorText('Positions Opened:', 'white')} ${colorText(monitorState.sessionStats.positionsOpened.toString(), 'cyan')} (${positionsPerHour}/hour)`);
    console.log(`${colorText('Positions Closed:', 'white')} ${colorText(monitorState.sessionStats.positionsClosed.toString(), 'yellow')}`);
    
    if (monitorState.sessionStats.positionsClosed > 0) {
      const winRate = ((monitorState.sessionStats.winCount / monitorState.sessionStats.positionsClosed) * 100).toFixed(1);
      const winRateColor = parseFloat(winRate) >= 50 ? 'green' : parseFloat(winRate) >= 40 ? 'yellow' : 'red';
      console.log(`${colorText('Session Win Rate:', 'white')} ${colorText(winRate + '%', winRateColor)}`);
      console.log(`${colorText('Session P&L:', 'white')} ${colorText('$' + formatNumber(monitorState.sessionStats.totalPnL), monitorState.sessionStats.totalPnL >= 0 ? 'green' : 'red')}`);
    }
    
  } catch (error) {
    console.log(colorText('❌ Session stats error: ' + error.message, 'red'));
    logToFile(ERROR_LOG, `Session stats error: ${error.message}`);
  }
}

async function displayControls() {
  console.log('');
  console.log(colorText('🎮 MONITORING CONTROLS', 'white'));
  console.log(colorText('-'.repeat(50), 'gray'));
  console.log(colorText('Press Ctrl+C to stop monitoring', 'yellow'));
  console.log(colorText('Log files available at:', 'white'));
  console.log(colorText(`  📊 Trades: ${TRADE_LOG}`, 'cyan'));
  console.log(colorText(`  🎯 Phases: ${PHASE_LOG}`, 'cyan'));
  console.log(colorText(`  ❌ Errors: ${ERROR_LOG}`, 'cyan'));
  console.log('');
  console.log(colorText('To tail logs in another terminal:', 'yellow'));
  console.log(colorText('  tail -f /tmp/signalcartel-logs/*.log', 'green'));
  console.log('');
}

async function runMonitoringLoop() {
  console.log('🚀 Starting QUANTUM FORGE™ Live Monitor...\n');
  
  // Initial log entries
  logToFile(TRADE_LOG, 'QUANTUM FORGE™ Live Trading Monitor Started');
  logToFile(PHASE_LOG, 'Phase monitoring initialized');
  
  while (true) {
    try {
      await displayHeader();
      await displayPhaseStatus();
      await displayLiveActivity();
      await displayRecentActivity();
      await displaySessionStats();
      await displayControls();
      
      // Wait 3 seconds before next update
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.log(colorText('❌ Monitor loop error: ' + error.message, 'red'));
      logToFile(ERROR_LOG, `Monitor loop error: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log(colorText('\n🛑 Shutting down QUANTUM FORGE™ Live Monitor...', 'yellow'));
  logToFile(TRADE_LOG, 'QUANTUM FORGE™ Live Trading Monitor Stopped');
  await prisma.$disconnect();
  process.exit(0);
});

// Start monitoring
runMonitoringLoop().catch(async (error) => {
  console.error(colorText('❌ Monitor startup error: ' + error.message, 'red'));
  logToFile(ERROR_LOG, `Monitor startup error: ${error.message}`);
  await prisma.$disconnect();
  process.exit(1);
});