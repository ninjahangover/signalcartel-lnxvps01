import Link from 'next/link';
import MarketingNav from '../../components/marketing-nav';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <MarketingNav currentPage="/features" />

      {/* Hero Section */}
      <section className="pt-24 pb-20 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-gold-400/5 via-transparent to-gold-400/10"></div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gold-400/20 text-gold-400 border border-gold-400/30 backdrop-blur-sm px-4 py-2 rounded-full inline-flex items-center mb-6">
              <span className="mr-2">⭐</span>
              Elite Trading Features
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-white">Features That</span><br />
              <span className="bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">Separate The Elite</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
              Discover why sophisticated investors choose Signal Cartel. Every feature is designed for precision, performance, and profit maximization.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/auth/signup" className="bg-gradient-to-r from-gold-400 to-gold-600 hover:from-gold-500 hover:to-gold-700 text-black font-bold px-8 py-6 text-lg shadow-2xl shadow-gold-400/25 rounded-lg inline-flex items-center justify-center transition-all">
                <span className="mr-2">🚀</span>
                Experience Elite Features
              </Link>
              <Link href="/about" className="border-2 border-gold-400 text-gold-400 hover:bg-gold-400 hover:text-black backdrop-blur-sm px-8 py-6 text-lg rounded-lg inline-flex items-center justify-center transition-all">
                <span className="mr-2">🧠</span>
                Meet The Team
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Trading Features */}
      <section className="py-20 bg-black/70">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Elite Trading <span className="bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">Arsenal</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Professional-grade tools that give you the competitive edge. Each feature is engineered for institutional-level performance and precision.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* AI Strategy Engine */}
            <div className="bg-gray-800/50 border border-gold-400/20 backdrop-blur-sm hover:border-gold-400/40 transition-all duration-300 hover:scale-105 rounded-xl p-6">
              <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-black font-bold text-xl">🧠</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">AI Strategy Engine</h3>
              <p className="text-gray-300 mb-4">
                Three elite AI strategies: RSI Pullback, Fibonacci Retracement, and AI Momentum. Each powered by machine learning and continuously optimized for market conditions.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gold-400">
                  <span className="mr-2">✓</span>
                  Self-optimizing algorithms
                </div>
                <div className="flex items-center text-sm text-gold-400">
                  <span className="mr-2">✓</span>
                  Multi-timeframe analysis
                </div>
                <div className="flex items-center text-sm text-gold-400">
                  <span className="mr-2">✓</span>
                  Risk-adjusted positioning
                </div>
              </div>
            </div>

            {/* 50+ Elite Trading Pairs */}
            <div className="bg-gray-800/50 border border-gold-400/20 backdrop-blur-sm hover:border-gold-400/40 transition-all duration-300 hover:scale-105 rounded-xl p-6">
              <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-black font-bold text-xl">🌐</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">50+ Elite Trading Pairs</h3>
              <p className="text-gray-300 mb-4">
                Comprehensive coverage of major cryptocurrencies, DeFi tokens, and emerging opportunities with real-time data from premium exchanges.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gold-400">
                  <span className="mr-2">✓</span>
                  Major pairs (BTC, ETH, ADA)
                </div>
                <div className="flex items-center text-sm text-gold-400">
                  <span className="mr-2">✓</span>
                  DeFi opportunities (LINK, DOT)
                </div>
                <div className="flex items-center text-sm text-gold-400">
                  <span className="mr-2">✓</span>
                  Emerging high-growth assets
                </div>
              </div>
            </div>

            {/* Lightning Execution */}
            <div className="bg-gray-800/50 border border-gold-400/20 backdrop-blur-sm hover:border-gold-400/40 transition-all duration-300 hover:scale-105 rounded-xl p-6">
              <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-black font-bold text-xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Lightning Execution</h3>
              <p className="text-gray-300 mb-4">
                Sub-second trade execution through advanced webhook integration with CircuitCartel and other premium trading platforms.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gold-400">
                  <span className="mr-2">✓</span>
                  89ms average execution speed
                </div>
                <div className="flex items-center text-sm text-gold-400">
                  <span className="mr-2">✓</span>
                  Direct exchange integration
                </div>
                <div className="flex items-center text-sm text-gold-400">
                  <span className="mr-2">✓</span>
                  TradingView compatibility
                </div>
              </div>
            </div>

            {/* Advanced Charting */}
            <div className="bg-gray-800/50 border border-gold-400/20 backdrop-blur-sm hover:border-gold-400/40 transition-all duration-300 hover:scale-105 rounded-xl p-6">
              <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-black font-bold text-xl">📊</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Advanced Charting</h3>
              <p className="text-gray-300 mb-4">
                Professional-grade charts with real-time data, multiple timeframes, and technical indicators that rival institutional trading platforms.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gold-400">
                  <span className="mr-2">✓</span>
                  Real-time price feeds
                </div>
                <div className="flex items-center text-sm text-gold-400">
                  <span className="mr-2">✓</span>
                  Multi-timeframe analysis
                </div>
                <div className="flex items-center text-sm text-gold-400">
                  <span className="mr-2">✓</span>
                  Professional indicators
                </div>
              </div>
            </div>

            {/* Enterprise Security */}
            <div className="bg-gray-800/50 border border-gold-400/20 backdrop-blur-sm hover:border-gold-400/40 transition-all duration-300 hover:scale-105 rounded-xl p-6">
              <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-black font-bold text-xl">🛡️</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Enterprise Security</h3>
              <p className="text-gray-300 mb-4">
                Bank-level security with encrypted API management, secure webhook processing, and comprehensive safety measures protecting your capital.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gold-400">
                  <span className="mr-2">✓</span>
                  256-bit encryption
                </div>
                <div className="flex items-center text-sm text-gold-400">
                  <span className="mr-2">✓</span>
                  Secure API key storage
                </div>
                <div className="flex items-center text-sm text-gold-400">
                  <span className="mr-2">✓</span>
                  Test mode protection
                </div>
              </div>
            </div>

            {/* Live Trading Controller */}
            <div className="bg-gray-800/50 border border-gold-400/20 backdrop-blur-sm hover:border-gold-400/40 transition-all duration-300 hover:scale-105 rounded-xl p-6">
              <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-black font-bold text-xl">📡</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Live Trading Controller</h3>
              <p className="text-gray-300 mb-4">
                Real-time market monitoring with intelligent signal generation, portfolio tracking, and automated risk management for any trading pair.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gold-400">
                  <span className="mr-2">✓</span>
                  Real-time signal generation
                </div>
                <div className="flex items-center text-sm text-gold-400">
                  <span className="mr-2">✓</span>
                  Portfolio performance tracking
                </div>
                <div className="flex items-center text-sm text-gold-400">
                  <span className="mr-2">✓</span>
                  Automated risk controls
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Trading Tools */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Professional <span className="bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">Trading Tools</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Everything you need to trade like a professional. From risk management to performance analytics, we provide institutional-grade tools.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="text-3xl font-bold text-white mb-6">Risk Management Suite</h3>
              <p className="text-gray-300 mb-6">
                Sophisticated risk controls that protect your capital while maximizing profit potential. Our AI calculates optimal position sizes, stop losses, and take profits for every trade.
              </p>
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gold-400 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-black font-bold">🎯</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Dynamic Position Sizing</h4>
                    <p className="text-gray-400 text-sm">AI-calculated position sizes based on volatility and risk tolerance</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gold-400 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-black font-bold">⚠️</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Intelligent Stop Losses</h4>
                    <p className="text-gray-400 text-sm">ATR-based stop losses that adapt to market volatility</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gold-400 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-black font-bold">💰</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Profit Optimization</h4>
                    <p className="text-gray-400 text-sm">Take profit levels optimized for maximum returns</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/30 p-8 rounded-2xl border border-gold-400/20">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gold-400 mb-2">2.1:1</div>
                  <div className="text-gray-300 text-sm">Average Risk/Reward</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gold-400 mb-2">1.5%</div>
                  <div className="text-gray-300 text-sm">Max Position Risk</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gold-400 mb-2">94%</div>
                  <div className="text-gray-300 text-sm">Capital Preservation</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gold-400 mb-2">ATR</div>
                  <div className="text-gray-300 text-sm">Volatility Based</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="bg-gray-800/30 p-8 rounded-2xl border border-gold-400/20">
                <h4 className="text-xl font-bold text-white mb-4">Performance Analytics Dashboard</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Win Rate</span>
                    <span className="text-gold-400 font-bold">68.7%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gold-400 h-2 rounded-full" style={{width: '68.7%'}}></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Profit Factor</span>
                    <span className="text-gold-400 font-bold">1.87</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Sharpe Ratio</span>
                    <span className="text-gold-400 font-bold">1.24</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Max Drawdown</span>
                    <span className="text-green-400 font-bold">-8.2%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 md:order-2">
              <h3 className="text-3xl font-bold text-white mb-6">Performance Analytics</h3>
              <p className="text-gray-300 mb-6">
                Comprehensive performance tracking and analysis tools that help you optimize your trading strategies and improve long-term profitability.
              </p>
              <div className="space-y-4">
                <div className="flex items-center text-gold-400">
                  <span className="mr-3">📈</span>
                  <span>Real-time P&L tracking</span>
                </div>
                <div className="flex items-center text-gold-400">
                  <span className="mr-3">📊</span>
                  <span>Advanced performance metrics</span>
                </div>
                <div className="flex items-center text-gold-400">
                  <span className="mr-3">🎯</span>
                  <span>Strategy comparison tools</span>
                </div>
                <div className="flex items-center text-gold-400">
                  <span className="mr-3">📋</span>
                  <span>Detailed trade history</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Collaboration Message */}
      <section className="py-20 bg-black/70">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-gradient-to-r from-purple-900/50 to-gold-400/10 rounded-2xl p-8 border border-gold-400/20">
            <h2 className="text-3xl font-bold text-white mb-6">
              Built Through <span className="bg-gradient-to-r from-gold-400 to-purple-400 bg-clip-text text-transparent">Human-AI Collaboration</span>
            </h2>
            <p className="text-xl text-gray-200 mb-6">
              Every feature you see here was created through genuine collaboration between NinjaHangover's trading expertise and Claude's technical innovation. This isn't just marketing—it's the result of real partnership.
            </p>
            <p className="text-lg text-purple-300 mb-8">
              <strong className="text-gold-400">"Together We Rise!"</strong> — Experience what's possible when human creativity and AI ingenuity work as true partners.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/about" className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-black px-8 py-4 rounded-lg font-bold text-lg transition-colors inline-block">
                🤝 Meet Our Collaborative Team
              </Link>
              <Link href="/auth/signup" className="border-2 border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-black px-8 py-4 rounded-lg font-bold text-lg transition-colors inline-block">
                🚀 Start Trading Today
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-black/50 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold text-gold-400 mb-4">Signal Cartel</div>
              <p className="text-gray-400">
                Elite trading features built through genuine human-AI collaboration. <strong className="text-purple-400">Together We Rise!</strong>
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">API Docs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Risk Disclosure</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Signal Cartel. Elite features through genuine collaboration. <strong className="text-gold-400">Together We Rise!</strong></p>
          </div>
        </div>
      </footer>
    </div>
  );
}