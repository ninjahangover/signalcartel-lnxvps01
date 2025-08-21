#!/usr/bin/env tsx

/**
 * Simple Alpaca Paper Trading Verification
 * 
 * Quick verification just for Alpaca paper trading functionality
 * Run with: npx tsx verify-alpaca-only.ts
 */

// Load environment variables from .env.local and .env
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load .env.local first (takes priority)
try {
  const envLocalPath = join(process.cwd(), '.env.local');
  const envLocalContent = readFileSync(envLocalPath, 'utf8');
  const envLocalVars = envLocalContent.split('\n')
    .filter(line => line.includes('=') && !line.startsWith('#'))
    .reduce((acc, line) => {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').replace(/^"(.*)"$/, '$1');
      acc[key.trim()] = value.trim();
      return acc;
    }, {} as Record<string, string>);
  
  Object.assign(process.env, envLocalVars);
} catch (error) {
  console.log('⚠️ Could not load .env.local, using .env fallback');
}

// Load .env as fallback
config();

console.log('🔍 ALPACA PAPER TRADING VERIFICATION');
console.log('='.repeat(60));

interface TestResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string;
  critical: boolean;
}

class AlpacaVerifier {
  private results: TestResult[] = [];

  async runVerification(): Promise<boolean> {
    console.log('📊 Starting Alpaca paper trading verification...\n');

    await this.testApiConnection();
    await this.testAccountStatus();
    await this.testOrderCapability();
    await this.testPositionsAccess();

    this.printResults();
    
    const criticalFailures = this.results.filter(r => r.status === 'FAIL' && r.critical);
    return criticalFailures.length === 0;
  }

  private async testApiConnection(): Promise<void> {
    console.log('🔐 Testing API Connection...');
    
    try {
      const apiKey = process.env.ALPACA_PAPER_API_KEY || process.env.NEXT_PUBLIC_ALPACA_PAPER_API_KEY;
      const apiSecret = process.env.ALPACA_PAPER_API_SECRET || process.env.NEXT_PUBLIC_ALPACA_PAPER_API_SECRET;

      if (!apiKey || !apiSecret) {
        this.results.push({
          category: 'API Connection',
          test: 'Credentials Available',
          status: 'FAIL',
          details: 'Alpaca API credentials not found in environment',
          critical: true
        });
        return;
      }

      const headers = {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret
      };

      const response = await fetch('https://paper-api.alpaca.markets/v2/account', {
        headers
      });

      if (response.ok) {
        this.results.push({
          category: 'API Connection',
          test: 'Alpaca API Access',
          status: 'PASS',
          details: 'Successfully connected to Alpaca paper trading API',
          critical: true
        });
      } else {
        const error = await response.text();
        this.results.push({
          category: 'API Connection',
          test: 'Alpaca API Access',
          status: 'FAIL',
          details: `API connection failed: ${response.status} - ${error}`,
          critical: true
        });
      }
    } catch (error) {
      this.results.push({
        category: 'API Connection',
        test: 'Alpaca API Access',
        status: 'FAIL',
        details: `Connection error: ${error.message}`,
        critical: true
      });
    }
  }

  private async testAccountStatus(): Promise<void> {
    console.log('💰 Testing Account Status...');
    
    try {
      const apiKey = process.env.ALPACA_PAPER_API_KEY || process.env.NEXT_PUBLIC_ALPACA_PAPER_API_KEY;
      const apiSecret = process.env.ALPACA_PAPER_API_SECRET || process.env.NEXT_PUBLIC_ALPACA_PAPER_API_SECRET;

      const headers = {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret
      };

      const response = await fetch('https://paper-api.alpaca.markets/v2/account', {
        headers
      });

      if (response.ok) {
        const account = await response.json();
        
        console.log(`   Account Status: ${account.status}`);
        console.log(`   Equity: $${parseFloat(account.equity).toLocaleString()}`);
        console.log(`   Buying Power: $${parseFloat(account.buying_power).toLocaleString()}`);
        console.log(`   Pattern Day Trader: ${account.pattern_day_trader}`);

        if (account.status === 'ACTIVE') {
          this.results.push({
            category: 'Account Status',
            test: 'Account Active',
            status: 'PASS',
            details: `Account active with $${parseFloat(account.equity).toLocaleString()} equity`,
            critical: true
          });
        } else {
          this.results.push({
            category: 'Account Status',
            test: 'Account Active',
            status: 'FAIL',
            details: `Account status: ${account.status} (must be ACTIVE)`,
            critical: true
          });
        }

        if (parseFloat(account.buying_power) > 1000) {
          this.results.push({
            category: 'Account Status',
            test: 'Sufficient Buying Power',
            status: 'PASS',
            details: `Buying power: $${parseFloat(account.buying_power).toLocaleString()}`,
            critical: false
          });
        } else {
          this.results.push({
            category: 'Account Status',
            test: 'Sufficient Buying Power',
            status: 'WARNING',
            details: `Low buying power: $${parseFloat(account.buying_power).toLocaleString()}`,
            critical: false
          });
        }
      }
    } catch (error) {
      this.results.push({
        category: 'Account Status',
        test: 'Account Information',
        status: 'FAIL',
        details: `Failed to get account info: ${error.message}`,
        critical: true
      });
    }
  }

  private async testOrderCapability(): Promise<void> {
    console.log('📋 Testing Order Capabilities...');
    
    try {
      const apiKey = process.env.ALPACA_PAPER_API_KEY || process.env.NEXT_PUBLIC_ALPACA_PAPER_API_KEY;
      const apiSecret = process.env.ALPACA_PAPER_API_SECRET || process.env.NEXT_PUBLIC_ALPACA_PAPER_API_SECRET;

      const headers = {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret
      };

      // Test getting orders (should work even if no orders exist)
      const ordersResponse = await fetch('https://paper-api.alpaca.markets/v2/orders?status=all&limit=5', {
        headers
      });

      if (ordersResponse.ok) {
        const orders = await ordersResponse.json();
        console.log(`   Recent Orders: ${orders.length} found`);
        
        this.results.push({
          category: 'Trading Capabilities',
          test: 'Orders API Access',
          status: 'PASS',
          details: `Can access orders API (${orders.length} recent orders)`,
          critical: false
        });
      } else {
        this.results.push({
          category: 'Trading Capabilities',
          test: 'Orders API Access',
          status: 'FAIL',
          details: `Cannot access orders API: ${ordersResponse.status}`,
          critical: true
        });
      }

      // Test clock endpoint for market status
      const clockResponse = await fetch('https://paper-api.alpaca.markets/v2/clock', {
        headers
      });

      if (clockResponse.ok) {
        const clock = await clockResponse.json();
        console.log(`   Market Status: ${clock.is_open ? 'OPEN' : 'CLOSED'}`);
        
        this.results.push({
          category: 'Trading Capabilities',
          test: 'Market Clock Access',
          status: 'PASS',
          details: `Market is currently ${clock.is_open ? 'OPEN' : 'CLOSED'}`,
          critical: false
        });
      } else {
        this.results.push({
          category: 'Trading Capabilities',
          test: 'Market Clock Access',
          status: 'WARNING',
          details: 'Cannot access market clock API',
          critical: false
        });
      }
    } catch (error) {
      this.results.push({
        category: 'Trading Capabilities',
        test: 'Trading API Access',
        status: 'FAIL',
        details: `Failed to test trading capabilities: ${error.message}`,
        critical: true
      });
    }
  }

  private async testPositionsAccess(): Promise<void> {
    console.log('📈 Testing Positions Access...');
    
    try {
      const apiKey = process.env.ALPACA_PAPER_API_KEY || process.env.NEXT_PUBLIC_ALPACA_PAPER_API_KEY;
      const apiSecret = process.env.ALPACA_PAPER_API_SECRET || process.env.NEXT_PUBLIC_ALPACA_PAPER_API_SECRET;

      const headers = {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret
      };

      const response = await fetch('https://paper-api.alpaca.markets/v2/positions', {
        headers
      });

      if (response.ok) {
        const positions = await response.json();
        console.log(`   Current Positions: ${positions.length}`);
        
        if (positions.length > 0) {
          console.log('   Position Details:');
          positions.slice(0, 3).forEach((pos, i) => {
            console.log(`     ${i + 1}. ${pos.symbol}: ${pos.qty} shares @ $${parseFloat(pos.avg_entry_price).toFixed(2)}`);
          });
        }

        this.results.push({
          category: 'Portfolio Management',
          test: 'Positions API Access',
          status: 'PASS',
          details: `Can access positions (${positions.length} current positions)`,
          critical: false
        });
      } else {
        this.results.push({
          category: 'Portfolio Management',
          test: 'Positions API Access',
          status: 'FAIL',
          details: `Cannot access positions API: ${response.status}`,
          critical: true
        });
      }
    } catch (error) {
      this.results.push({
        category: 'Portfolio Management',
        test: 'Positions Access',
        status: 'FAIL',
        details: `Failed to access positions: ${error.message}`,
        critical: true
      });
    }
  }

  private printResults(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📋 ALPACA VERIFICATION REPORT');
    console.log('='.repeat(60));

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const warnings = this.results.filter(r => r.status === 'WARNING').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const critical = this.results.filter(r => r.status === 'FAIL' && r.critical).length;

    console.log('\n📊 Summary:');
    console.log(`   Total Tests: ${this.results.length}`);
    console.log(`   Passed: ${passed} ✅`);
    console.log(`   Warnings: ${warnings} ⚠️`);
    console.log(`   Failed: ${failed} ❌`);
    console.log(`   Critical Failures: ${critical} 🚨`);
    console.log(`   Success Rate: ${(passed / this.results.length * 100).toFixed(1)}%`);

    // Group by category
    const categories = [...new Set(this.results.map(r => r.category))];
    console.log('\n📋 By Category:');
    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.category === category);
      const categoryPassed = categoryResults.filter(r => r.status === 'PASS').length;
      console.log(`   ${category}: ${categoryPassed}/${categoryResults.length} (${(categoryPassed / categoryResults.length * 100).toFixed(1)}%)`);
    });

    // Show failures
    const failures = this.results.filter(r => r.status === 'FAIL');
    if (failures.length > 0) {
      console.log('\n❌ Failures to Address:');
      failures.forEach(failure => {
        console.log(`   - ${failure.test} ${failure.critical ? '[CRITICAL]' : ''}: ${failure.details}`);
      });
    }

    // Show warnings
    const warningResults = this.results.filter(r => r.status === 'WARNING');
    if (warningResults.length > 0) {
      console.log('\n⚠️ Warnings:');
      warningResults.forEach(warning => {
        console.log(`   - ${warning.test}: ${warning.details}`);
      });
    }

    // Show recommendations
    console.log('\n💡 Recommendations:');
    if (critical > 0) {
      console.log('   🚨 CRITICAL: Fix critical failures before proceeding to live trading');
    } else if (failed > 0) {
      console.log('   ⚠️ Fix remaining failures for optimal performance');
    } else {
      console.log('   ✅ Alpaca paper trading is ready for use!');
      console.log('   🚀 You can safely proceed with strategy testing');
    }
  }
}

async function main() {
  const verifier = new AlpacaVerifier();
  const success = await verifier.runVerification();
  
  console.log(`\n⏱️  Verification completed in ${(Date.now() / 1000).toFixed(1)} seconds`);
  
  if (success) {
    console.log('\n🎉 Alpaca Paper Trading System is ready!');
    process.exit(0);
  } else {
    console.log('\n🚨 Critical issues found - please fix before proceeding');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n💥 Verification failed:', error.message);
  process.exit(1);
});