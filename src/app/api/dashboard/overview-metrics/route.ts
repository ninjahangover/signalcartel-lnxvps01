import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching overview dashboard metrics...');
    
    // Get current phase status
    let currentPhase = { phase: 0, name: 'Data Collection Phase' };
    let progress = { currentTrades: 0, progress: 0, tradesNeeded: 100 };
    
    try {
      // Manual phase calculation using direct database count
      console.log('🔍 Starting phase calculation...');
      
      // Direct count of entry trades
      const totalTrades = await prisma.managedTrade.count();
      const positionCount = await prisma.managedPosition.count();
      
      // Use the larger of the two as entry trades (more accurate)
      const entryTrades = Math.max(positionCount, Math.floor(totalTrades / 2));
      console.log(`🔍 Entry trades calculation - Positions: ${positionCount}, Total trades: ${totalTrades}, Using: ${entryTrades}`);
      
      console.log(`🔍 Phase calculation - Entry trades: ${entryTrades} (positions: ${positionCount}, total: ${totalTrades})`);
      
      // Phase determination logic (simplified but working)
      let phaseNumber = 0;
      let phaseName = 'Maximum Data Collection Phase';
      let tradesNeeded = 100;
      
      if (entryTrades >= 2000) {
        phaseNumber = 4;
        phaseName = 'Full QUANTUM FORGE™';
        tradesNeeded = 0;
      } else if (entryTrades >= 1000) {
        phaseNumber = 3;
        phaseName = 'Order Book Intelligence Phase';
        tradesNeeded = 2000 - entryTrades;
      } else if (entryTrades >= 500) {
        phaseNumber = 2;
        phaseName = 'Multi-Source Sentiment Phase';
        tradesNeeded = 1000 - entryTrades;
      } else if (entryTrades >= 100) {
        phaseNumber = 1;
        phaseName = 'Basic Sentiment Phase';
        tradesNeeded = 500 - entryTrades;
      } else {
        phaseNumber = 0;
        phaseName = 'Maximum Data Collection Phase';
        tradesNeeded = 100 - entryTrades;
      }
      
      // Calculate progress
      const phaseRanges = [100, 400, 500, 1000]; // Range sizes for each phase
      const phaseStarts = [0, 100, 500, 1000];   // Start points for each phase
      
      let phaseProgress = 0;
      if (phaseNumber < 4) {
        const phaseStart = phaseStarts[phaseNumber];
        const phaseRange = phaseRanges[phaseNumber];
        const progressInPhase = entryTrades - phaseStart;
        phaseProgress = Math.round((progressInPhase / phaseRange) * 100);
      } else {
        phaseProgress = 100; // Phase 4 is complete
      }
      
      currentPhase = { phase: phaseNumber, name: phaseName };
      progress = { 
        currentTrades: entryTrades, 
        progress: Math.max(0, phaseProgress), 
        tradesNeeded: Math.max(0, tradesNeeded) 
      };
      
      console.log(`✅ Manual phase calculation: Phase ${phaseNumber} - ${phaseName}, ${entryTrades} trades, ${phaseProgress}% progress`);
      
    } catch (phaseError) {
      console.error('❌ Phase calculation error:', phaseError);
      console.log('⚠️ Using absolute fallback');
    }
    
    // Get trade statistics
    const totalTrades = await prisma.managedTrade.count();
    const tradesWithPnL = await prisma.managedTrade.count({
      where: { pnl: { not: null } }
    });
    const winningTrades = await prisma.managedTrade.count({
      where: { pnl: { gt: 0 } }
    });
    const losingTrades = await prisma.managedTrade.count({
      where: { pnl: { lt: 0 } }
    });
    
    const winRate = tradesWithPnL > 0 ? (winningTrades / tradesWithPnL) * 100 : 0;
    
    // Get P&L data
    const pnlData = await prisma.managedTrade.findMany({
      where: { pnl: { not: null } },
      select: { pnl: true }
    });
    
    let totalPnL = 0;
    let avgPnL = 0;
    let maxWin = 0;
    let maxLoss = 0;
    
    if (pnlData.length > 0) {
      totalPnL = pnlData.reduce((sum, t) => sum + (t.pnl || 0), 0);
      avgPnL = totalPnL / pnlData.length;
      maxWin = Math.max(...pnlData.map(t => t.pnl || 0));
      maxLoss = Math.min(...pnlData.map(t => t.pnl || 0));
    }
    
    // Get recent activity
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const last24hTrades = await prisma.managedTrade.count({
      where: { executedAt: { gte: oneDayAgo } }
    });
    
    const lastHourTrades = await prisma.managedTrade.count({
      where: { executedAt: { gte: oneHourAgo } }
    });
    
    // Get position data
    const totalPositions = await prisma.managedPosition.count();
    const openPositions = await prisma.managedPosition.count({
      where: { status: 'open' }
    });
    
    // Get AI systems data
    let intuitionAnalyses = 0;
    try {
      intuitionAnalyses = await prisma.intuitionAnalysis.count();
    } catch (e) {
      // Table doesn't exist yet
      console.log('⚠️ IntuitionAnalysis table not found');
    }
    
    // Calculate system health based on performance metrics
    let systemHealth: 'excellent' | 'good' | 'warning' | 'critical' = 'good';
    
    if (winRate >= 70 && totalPnL > 50 && lastHourTrades > 10) {
      systemHealth = 'excellent';
    } else if (winRate >= 60 && totalPnL >= 0 && lastHourTrades > 5) {
      systemHealth = 'good';
    } else if (winRate >= 50 && totalPnL >= -20) {
      systemHealth = 'warning';
    } else {
      systemHealth = 'critical';
    }
    
    // Calculate portfolio value (starting with $10,000 base + P&L)
    const portfolioValue = 10000 + totalPnL;
    const tradingVelocity = last24hTrades / 24; // trades per hour
    
    const metrics = {
      // Phase Information
      currentPhase,
      progress,
      
      // Trading Statistics
      totalTrades,
      tradesWithPnL,
      winningTrades,
      losingTrades,
      winRate,
      
      // P&L Analysis
      totalPnL,
      avgPnL,
      maxWin,
      maxLoss,
      
      // Recent Activity
      last24hTrades,
      lastHourTrades,
      
      // Position Data
      totalPositions,
      openPositions,
      
      // AI Systems
      intuitionAnalyses,
      
      // Performance Metrics
      portfolioValue,
      tradingVelocity,
      systemHealth
    };
    
    console.log(`✅ Dashboard metrics loaded: ${totalTrades} trades, ${winRate.toFixed(1)}% win rate, $${totalPnL.toFixed(2)} P&L`);
    
    return NextResponse.json({
      success: true,
      data: metrics
    });
    
  } catch (error) {
    console.error('❌ Error fetching dashboard metrics:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch dashboard metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}