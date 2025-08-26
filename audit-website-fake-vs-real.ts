#!/usr/bin/env npx tsx
/**
 * COMPREHENSIVE WEBSITE AUDIT - FAKE vs REAL DATA
 * Systematically checks every page and API endpoint to identify fake/mock data
 */

import { writeFileSync } from 'fs';

console.log('🕵️ COMPREHENSIVE WEBSITE AUDIT - FAKE vs REAL DATA');
console.log('=' .repeat(80));
console.log('Systematically checking every page and API endpoint...');
console.log('');

interface AuditResult {
  page: string;
  url: string;
  status: 'REAL' | 'FAKE' | 'MIXED' | 'ERROR';
  fakeElements: string[];
  realElements: string[];
  notes: string[];
}

class WebsiteAuditor {
  private results: AuditResult[] = [];
  private baseUrl = 'http://localhost:3001';

  async auditPage(pagePath: string, pageName: string): Promise<AuditResult> {
    const result: AuditResult = {
      page: pageName,
      url: `${this.baseUrl}${pagePath}`,
      status: 'ERROR',
      fakeElements: [],
      realElements: [],
      notes: []
    };

    try {
      console.log(`🔍 Auditing: ${pageName} (${pagePath})`);
      
      const response = await fetch(result.url, {
        headers: { 'User-Agent': 'SignalCartel-Audit/1.0' }
      });

      if (!response.ok) {
        result.notes.push(`HTTP ${response.status}: ${response.statusText}`);
        console.log(`   ❌ Failed: HTTP ${response.status}`);
        return result;
      }

      const content = await response.text();
      
      // Check for common fake data patterns
      this.checkForFakePatterns(content, result);
      
      console.log(`   ✅ Audited: ${result.fakeElements.length} fake elements, ${result.realElements.length} real elements`);
      
    } catch (error) {
      result.notes.push(`Error: ${error.message}`);
      console.log(`   ❌ Error: ${error.message}`);
    }

    return result;
  }

  async auditAPI(apiPath: string, apiName: string): Promise<AuditResult> {
    const result: AuditResult = {
      page: apiName,
      url: `${this.baseUrl}${apiPath}`,
      status: 'ERROR',
      fakeElements: [],
      realElements: [],
      notes: []
    };

    try {
      console.log(`🔍 Auditing API: ${apiName} (${apiPath})`);
      
      const response = await fetch(result.url);

      if (!response.ok) {
        result.notes.push(`HTTP ${response.status}: ${response.statusText}`);
        console.log(`   ❌ Failed: HTTP ${response.status}`);
        return result;
      }

      const data = await response.json();
      
      // Check API response for fake vs real data
      this.checkAPIData(data, result);
      
      console.log(`   ✅ API Audited: ${result.fakeElements.length} fake elements, ${result.realElements.length} real elements`);
      
    } catch (error) {
      result.notes.push(`Error: ${error.message}`);
      console.log(`   ❌ Error: ${error.message}`);
    }

    return result;
  }

  private checkForFakePatterns(content: string, result: AuditResult): void {
    // Common fake/mock data patterns
    const fakePatterns = [
      // Numbers that are clearly fake
      { pattern: /\$1,?234,?567/gi, name: 'Fake dollar amounts ($1,234,567)' },
      { pattern: /lorem ipsum/gi, name: 'Lorem ipsum placeholder text' },
      { pattern: /fake|mock|demo|sample|test|placeholder/gi, name: 'Fake/mock/demo keywords' },
      { pattern: /99\.9[0-9]%|100\.0%/gi, name: 'Suspiciously perfect percentages' },
      { pattern: /\$99,999|\$100,000/gi, name: 'Round fake dollar amounts' },
      
      // Fake data indicators
      { pattern: /hardcoded|static|simulated/gi, name: 'Hardcoded/simulated data mentions' },
      { pattern: /Math\.random|random\(\)/gi, name: 'Random number generators' },
      { pattern: /const.*=.*\[\s*\{.*score.*\}/gi, name: 'Hardcoded data arrays' },
      
      // Suspicious claims
      { pattern: /47 Data Sources/gi, name: 'Fake "47 Data Sources" claim' },
      { pattern: /2\.8K Keywords/gi, name: 'Fake "2.8K Keywords" claim' },
      { pattern: /13K\+ Signals/gi, name: 'Fake "13K+ Signals" claim' },
      
      // Common fake chart data
      { pattern: /score:\s*0\.[0-9]+,.*confidence:\s*0\.[0-9]+/gi, name: 'Hardcoded score/confidence pairs' }
    ];

    const realPatterns = [
      // Real data indicators
      { pattern: /api\.alternative\.me/gi, name: 'Real Fear & Greed API' },
      { pattern: /blockchain\.info/gi, name: 'Real Blockchain.info API' },
      { pattern: /reddit\.com.*\.json/gi, name: 'Real Reddit API' },
      { pattern: /coindesk\.com.*rss/gi, name: 'Real CoinDesk RSS' },
      { pattern: /cointelegraph\.com.*rss/gi, name: 'Real CoinTelegraph RSS' },
      { pattern: /api\.coingecko\.com/gi, name: 'Real CoinGecko API' },
      
      // Real-time data indicators
      { pattern: /timestamp.*new Date/gi, name: 'Real timestamps' },
      { pattern: /fetch\(.*http/gi, name: 'Real API calls' },
      { pattern: /Real-time API data/gi, name: 'Real data verification labels' }
    ];

    // Check for fake patterns
    fakePatterns.forEach(({ pattern, name }) => {
      if (pattern.test(content)) {
        result.fakeElements.push(name);
      }
    });

    // Check for real patterns  
    realPatterns.forEach(({ pattern, name }) => {
      if (pattern.test(content)) {
        result.realElements.push(name);
      }
    });

    // Determine overall status
    if (result.fakeElements.length > 0 && result.realElements.length > 0) {
      result.status = 'MIXED';
    } else if (result.fakeElements.length > 0) {
      result.status = 'FAKE';
    } else if (result.realElements.length > 0) {
      result.status = 'REAL';
    } else {
      result.status = 'REAL'; // Assume real if no patterns detected
    }
  }

  private checkAPIData(data: any, result: AuditResult): void {
    const dataStr = JSON.stringify(data, null, 2);
    
    // Check for fake API data patterns
    const fakeAPIPatterns = [
      { pattern: /"mock|"fake|"demo|"test|"sample/gi, name: 'Mock/fake data in API response' },
      { pattern: /"score":\s*0\.5[0-9]*,/gi, name: 'Suspicious 0.5x scores (likely fake)' },
      { pattern: /"confidence":\s*0\.5[0-9]*,/gi, name: 'Suspicious 0.5x confidence (likely fake)' },
      { pattern: /1234567|9999999|1000000/gi, name: 'Fake number patterns' },
      { pattern: /"success":\s*false/gi, name: 'API returning errors/failures' }
    ];

    const realAPIPatterns = [
      { pattern: /"timestamp":\s*"[0-9]{4}-/gi, name: 'Real timestamps in ISO format' },
      { pattern: /"value":\s*"[0-9]+"/gi, name: 'Real numeric values from APIs' },
      { pattern: /"tx_count":\s*[0-9]+/gi, name: 'Real transaction counts' },
      { pattern: /"upvotes":\s*[0-9]+/gi, name: 'Real Reddit upvote counts' },
      { pattern: /"sources":\s*\[[^\]]+\]/gi, name: 'Real source arrays' },
      { pattern: /"success":\s*true/gi, name: 'API returning successful responses' }
    ];

    // Check for fake patterns in API data
    fakeAPIPatterns.forEach(({ pattern, name }) => {
      if (pattern.test(dataStr)) {
        result.fakeElements.push(name);
      }
    });

    // Check for real patterns in API data
    realAPIPatterns.forEach(({ pattern, name }) => {
      if (pattern.test(dataStr)) {
        result.realElements.push(name);
      }
    });

    // Special checks for specific API endpoints
    if (data.data?.sources) {
      const sources = data.data.sources;
      if (Array.isArray(sources) && sources.length > 0) {
        result.realElements.push(`${sources.length} real sentiment sources`);
        
        // Check if sources have real metadata
        sources.forEach((source: any, index: number) => {
          if (source.metadata && Object.keys(source.metadata).length > 0) {
            result.realElements.push(`Source ${index + 1} (${source.name}) has real metadata`);
          }
        });
      }
    }

    // Determine status
    if (result.fakeElements.length > 0 && result.realElements.length > 0) {
      result.status = 'MIXED';
    } else if (result.fakeElements.length > 0) {
      result.status = 'FAKE';
    } else if (result.realElements.length > 0) {
      result.status = 'REAL';
    }
  }

  async runFullAudit(): Promise<void> {
    console.log('🚀 Starting comprehensive website audit...');
    console.log('');

    // Pages to audit
    const pages = [
      { path: '/', name: 'Landing Page' },
      { path: '/dashboard', name: 'Main Dashboard' },
      { path: '/quantum-forge', name: 'Quantum Forge Page' },
      { path: '/charts', name: 'Charts Page' },
      { path: '/manual-trading', name: 'Manual Trading Page' },
      { path: '/mathematical-intuition', name: 'Mathematical Intuition Page' },
      { path: '/strategies', name: 'Strategies Page' }
    ];

    // API endpoints to audit
    const apis = [
      { path: '/api/health', name: 'Health API' },
      { path: '/api/multi-source-sentiment?symbol=BTC', name: 'Multi-Source Sentiment API' },
      { path: '/api/quantum-forge/status', name: 'Quantum Forge Status API' },
      { path: '/api/quantum-forge/portfolio', name: 'Portfolio API' },
      { path: '/api/quantum-forge/dashboard', name: 'Quantum Forge Dashboard API' },
      { path: '/api/real-btc-price', name: 'Real BTC Price API' },
      { path: '/api/market-data/status', name: 'Market Data Status API' },
      { path: '/api/sentiment-analysis?hours=1', name: 'Sentiment Analysis API' },
      { path: '/api/position-management/portfolio', name: 'Position Management API' },
      { path: '/api/expectancy/dashboard', name: 'Expectancy Dashboard API' }
    ];

    // Audit pages
    console.log('📄 AUDITING PAGES:');
    console.log('-'.repeat(40));
    for (const page of pages) {
      const result = await this.auditPage(page.path, page.name);
      this.results.push(result);
      await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
    }

    console.log('');
    console.log('🔌 AUDITING API ENDPOINTS:');
    console.log('-'.repeat(40));
    for (const api of apis) {
      const result = await this.auditAPI(api.path, api.name);
      this.results.push(result);
      await new Promise(resolve => setTimeout(resolve, 300)); // Rate limiting
    }

    console.log('');
    this.generateReport();
  }

  private generateReport(): void {
    console.log('📊 COMPREHENSIVE AUDIT RESULTS');
    console.log('=' .repeat(80));
    console.log('');

    const realCount = this.results.filter(r => r.status === 'REAL').length;
    const fakeCount = this.results.filter(r => r.status === 'FAKE').length;
    const mixedCount = this.results.filter(r => r.status === 'MIXED').length;
    const errorCount = this.results.filter(r => r.status === 'ERROR').length;

    console.log('🎯 SUMMARY STATISTICS:');
    console.log(`   ✅ Real: ${realCount}`);
    console.log(`   ❌ Fake: ${fakeCount}`);
    console.log(`   ⚠️  Mixed: ${mixedCount}`);
    console.log(`   💥 Error: ${errorCount}`);
    console.log(`   📊 Total: ${this.results.length}`);
    console.log('');

    console.log('🔍 DETAILED RESULTS:');
    console.log('-'.repeat(80));

    this.results.forEach(result => {
      const statusIcon = {
        'REAL': '✅',
        'FAKE': '❌', 
        'MIXED': '⚠️',
        'ERROR': '💥'
      }[result.status];

      console.log(`${statusIcon} ${result.page}`);
      console.log(`   URL: ${result.url}`);
      
      if (result.fakeElements.length > 0) {
        console.log(`   🚨 FAKE ELEMENTS (${result.fakeElements.length}):`);
        result.fakeElements.forEach(fake => {
          console.log(`      - ${fake}`);
        });
      }
      
      if (result.realElements.length > 0) {
        console.log(`   ✅ REAL ELEMENTS (${result.realElements.length}):`);
        result.realElements.slice(0, 3).forEach(real => { // Limit to first 3
          console.log(`      - ${real}`);
        });
        if (result.realElements.length > 3) {
          console.log(`      - ... and ${result.realElements.length - 3} more`);
        }
      }
      
      if (result.notes.length > 0) {
        console.log(`   📝 NOTES:`);
        result.notes.forEach(note => {
          console.log(`      - ${note}`);
        });
      }
      
      console.log('');
    });

    console.log('🎊 AUDIT COMPLETE');
    console.log('=' .repeat(80));

    if (fakeCount > 0 || mixedCount > 0) {
      console.log('⚠️  FAKE DATA DETECTED - Action required to remove BS elements');
      console.log(`   ${fakeCount} pages/APIs contain fake data`);
      console.log(`   ${mixedCount} pages/APIs contain mixed real/fake data`);
    } else {
      console.log('🎉 NO FAKE DATA DETECTED - Website appears to use real data only');
    }

    // Write detailed report to file
    const reportContent = this.generateFileReport();
    const reportPath = '/home/telgkb9/depot/dev-signalcartel/website-audit-report.txt';
    writeFileSync(reportPath, reportContent, 'utf-8');
    console.log(`📄 Detailed report saved: ${reportPath}`);
  }

  private generateFileReport(): string {
    const lines = [];
    lines.push('SIGNALCARTEL WEBSITE AUDIT REPORT - FAKE vs REAL DATA');
    lines.push('=' .repeat(80));
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(`Audited: ${this.results.length} pages and API endpoints`);
    lines.push('');

    const realCount = this.results.filter(r => r.status === 'REAL').length;
    const fakeCount = this.results.filter(r => r.status === 'FAKE').length;
    const mixedCount = this.results.filter(r => r.status === 'MIXED').length;
    const errorCount = this.results.filter(r => r.status === 'ERROR').length;

    lines.push('SUMMARY:');
    lines.push(`✅ Real: ${realCount}`);
    lines.push(`❌ Fake: ${fakeCount}`);
    lines.push(`⚠️ Mixed: ${mixedCount}`);
    lines.push(`💥 Error: ${errorCount}`);
    lines.push('');

    lines.push('DETAILED AUDIT RESULTS:');
    lines.push('=' .repeat(80));

    this.results.forEach(result => {
      lines.push(`${result.status}: ${result.page}`);
      lines.push(`URL: ${result.url}`);
      
      if (result.fakeElements.length > 0) {
        lines.push(`FAKE ELEMENTS (${result.fakeElements.length}):`);
        result.fakeElements.forEach(fake => lines.push(`  - ${fake}`));
      }
      
      if (result.realElements.length > 0) {
        lines.push(`REAL ELEMENTS (${result.realElements.length}):`);
        result.realElements.forEach(real => lines.push(`  - ${real}`));
      }
      
      if (result.notes.length > 0) {
        lines.push(`NOTES:`);
        result.notes.forEach(note => lines.push(`  - ${note}`));
      }
      
      lines.push('');
    });

    return lines.join('\n');
  }
}

// Run the audit
const auditor = new WebsiteAuditor();
auditor.runFullAudit().catch(console.error);