import { prisma } from '../src/lib/prisma.js';

console.log('🔍 CHECKING AVAILABLE DATA FOR OVERVIEW DASHBOARD');
console.log('='.repeat(60));

async function checkDashboardData() {
  try {
    // Get current phase status
    let currentPhase = { phase: 0, name: 'Phase detection failed' };
    let progress = { currentTrades: 0, progress: 0 };
    
    try {
      const phaseModule = await import('../src/lib/quantum-forge-phase-config.ts');
      const phaseManager = phaseModule.default?.phaseManager;
      currentPhase = await phaseManager.getCurrentPhase();
      progress = await phaseManager.getProgressToNextPhase();
    } catch (phaseError) {
      console.log('⚠️ Phase system not available, using fallback data');
    }
    
    console.log('📊 PHASE STATUS:');
    console.log('  Current Phase:', currentPhase.phase, '-', currentPhase.name);
    console.log('  Entry Trades:', progress.currentTrades);
    console.log('  Progress:', progress.progress + '%');
    console.log();
    
    // Get trade counts
    const totalManagedTrades = await prisma.managedTrade.count();
    const tradesWithPnL = await prisma.managedTrade.count({
      where: { pnl: { not: null } }
    });
    const winningTrades = await prisma.managedTrade.count({
      where: { pnl: { gt: 0 } }
    });
    const losingTrades = await prisma.managedTrade.count({
      where: { pnl: { lt: 0 } }
    });
    
    console.log('📈 TRADE STATISTICS:');
    console.log('  Total Managed Trades:', totalManagedTrades);
    console.log('  Trades with P&L:', tradesWithPnL);
    console.log('  Winning Trades:', winningTrades);
    console.log('  Losing Trades:', losingTrades);
    if (tradesWithPnL > 0) {
      console.log('  Win Rate:', ((winningTrades / tradesWithPnL) * 100).toFixed(1) + '%');
    }
    console.log();
    
    // Get P&L data
    const pnlData = await prisma.managedTrade.findMany({
      where: { pnl: { not: null } },
      select: { pnl: true }
    });
    
    if (pnlData.length > 0) {
      const totalPnL = pnlData.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const avgPnL = totalPnL / pnlData.length;
      const maxWin = Math.max(...pnlData.map(t => t.pnl || 0));
      const maxLoss = Math.min(...pnlData.map(t => t.pnl || 0));
      
      console.log('💰 P&L ANALYSIS:');
      console.log('  Total P&L: $' + totalPnL.toFixed(2));
      console.log('  Average P&L per trade: $' + avgPnL.toFixed(2));
      console.log('  Max Win: $' + maxWin.toFixed(2));
      console.log('  Max Loss: $' + maxLoss.toFixed(2));
      console.log();
    }
    
    // Get recent trading activity
    const last24h = await prisma.managedTrade.count({
      where: { executedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
    });
    
    const lastHour = await prisma.managedTrade.count({
      where: { executedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } }
    });
    
    console.log('⏱️ RECENT ACTIVITY:');
    console.log('  Last 24 hours:', last24h, 'trades');
    console.log('  Last hour:', lastHour, 'trades');
    console.log();
    
    // Get position data
    const totalPositions = await prisma.managedPosition.count();
    const openPositions = await prisma.managedPosition.count({
      where: { status: 'open' }
    });
    
    console.log('📦 POSITION DATA:');
    console.log('  Total Positions:', totalPositions);
    console.log('  Open Positions:', openPositions);
    console.log();
    
    // Get AI system data if available
    try {
      const intuitionCount = await prisma.intuitionAnalysis.count();
      console.log('🧠 AI SYSTEMS DATA:');
      console.log('  Mathematical Intuition analyses:', intuitionCount);
    } catch (e) {
      console.log('🧠 AI SYSTEMS DATA:');
      console.log('  Mathematical Intuition analyses: Table not found');
    }
    console.log();
    
    console.log('✅ DASHBOARD DATA ASSESSMENT COMPLETE');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error checking dashboard data:', error.message);
  }
}

checkDashboardData();