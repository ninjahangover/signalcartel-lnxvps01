import Link from 'next/link';
import Image from 'next/image';
import MarketingNav from '../components/marketing-nav';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <MarketingNav currentPage="/" />

      {/* Hero Section */}
      <section className="pt-24 pb-20 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
        {/* Luxury Cityscape Background */}
        <div
          className="absolute inset-0 opacity-60 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1519501025264-65ba15a82390?ixlib=rb-4.0.3&auto=format&fit=crop&w=2064&q=80')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/70"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6 bg-purple-600/30 text-purple-200 border border-purple-400/50 backdrop-blur-sm px-4 py-2 rounded-full inline-flex items-center shadow-lg">
              <span className="w-4 h-4 mr-2">✨</span>
              Beyond 3Commas • Beyond Profit Sniper • Proactive AI Evolution
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight drop-shadow-2xl">
              <span className="text-white">Signal Cartel</span><br />
              <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-lg">Elevate Your Wealth</span>
            </h1>

            <div className="w-32 h-1 bg-gradient-to-r from-yellow-400 to-purple-500 mx-auto mb-8 shadow-lg shadow-yellow-400/50"></div>

            <div className="mb-8">
              <div className="flex items-center justify-center gap-6 mb-6">
                <Image 
                  src="/signal.cartel.shield.trans.png" 
                  alt="Signal Cartel Logo" 
                  width={120} 
                  height={120}
                  className="w-24 h-24 md:w-32 md:h-32 drop-shadow-2xl"
                  priority
                />
                <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-200 via-purple-300 to-purple-400 bg-clip-text text-transparent drop-shadow-2xl">The Stratus Engine™</h2>
              </div>
              <p className="text-xl md:text-2xl text-gray-100 mb-6 max-w-4xl mx-auto leading-relaxed drop-shadow-lg">
                <strong className="text-yellow-300">You've been waiting for AI that works WITH you, not instead of you.</strong> Finally - a platform where your successful strategies get supercharged by machine learning that adapts, optimizes, and evolves while you maintain complete control.
              </p>
            </div>

            <div className="bg-gray-900/50 rounded-2xl p-6 mb-8 border border-purple-400/30 backdrop-blur-sm shadow-2xl">
              <p className="text-xl text-purple-200 mb-4 font-semibold">"Together We Rise!"</p>
              <p className="text-gray-100 text-lg">
                Where your trading expertise meets AI amplification. Join successful auto-traders who use collaborative intelligence to scale from $50 test accounts to serious wealth-building portfolios.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/platform">
                <button className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold px-8 py-4 text-lg rounded flex items-center justify-center">
                  <span className="w-5 h-5 mr-2">🚀</span>
                  Access Elite Trading
                </button>
              </Link>
              <Link href="/stratus-engine">
                <button className="border-2 border-electric-purple text-electric-purple hover:bg-electric-purple hover:text-white px-8 py-4 text-lg rounded flex items-center justify-center">
                  <span className="w-5 h-5 mr-2">📊</span>
                  View Live Performance
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Key Features */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Why Elite Traders Choose <span className="bg-gradient-to-r from-yellow-400 to-electric-purple bg-clip-text text-transparent">Signal Cartel</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Built by traders, for traders. Enhanced by AI, controlled by you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-yellow-400/10 to-yellow-600/5 border border-yellow-400/30 backdrop-blur-sm rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-black font-bold text-2xl">🧠</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Proactive AI Intelligence</h3>
              <p className="text-gray-300 leading-relaxed">
                Not just reactive signals - AI that anticipates market shifts, optimizes your strategies in real-time, and suggests improvements before you need them.
              </p>
            </div>

            <div className="bg-gradient-to-br from-electric-purple/10 to-blue-500/5 border border-electric-purple/30 backdrop-blur-sm rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-electric-purple rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-2xl">🎯</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Your Strategy, Amplified</h3>
              <p className="text-gray-300 leading-relaxed">
                Bring your RSI mastery, Fibonacci expertise, or any proven strategy. Our AI learns your approach and enhances it with machine precision.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-400/10 to-emerald-500/5 border border-green-400/30 backdrop-blur-sm rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-black font-bold text-2xl">📈</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Scale Without Limits</h3>
              <p className="text-gray-300 leading-relaxed">
                From cautious $50 tests to confident portfolio management. Our collaborative approach grows with you, adapting to your risk tolerance and goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Performance Stats */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-black">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-12 text-white">
              Real Results from <span className="bg-gradient-to-r from-yellow-400 to-electric-purple bg-clip-text text-transparent">Collaborative Trading</span>
            </h2>

            <div className="grid md:grid-cols-4 gap-8 mb-12">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">98.5%</div>
                <div className="text-gray-300">Signal Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-electric-purple mb-2">50+</div>
                <div className="text-gray-300">Trading Pairs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">24/7</div>
                <div className="text-gray-300">Market Monitoring</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">3</div>
                <div className="text-gray-300">Elite Strategies</div>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-2xl p-8 border border-yellow-400/20">
              <p className="text-xl text-gray-200 mb-6">
                "The difference isn't just in the technology—it's in the philosophy. Signal Cartel doesn't replace your expertise; it amplifies it."
              </p>
              <p className="text-yellow-400 font-semibold">- Actual Signal Cartel Trader</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-electric-purple/80 to-yellow-400/20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Ready to <span className="text-yellow-400">Elevate Your Trading?</span>
            </h2>
            <p className="text-xl text-gray-200 mb-8">
              Join the collaborative revolution where human expertise and AI innovation create trading excellence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <button className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold px-8 py-4 text-lg rounded flex items-center justify-center">
                  <span className="w-5 h-5 mr-2">👥</span>
                  Start Your Journey
                </button>
              </Link>
              <Link href="/features">
                <button className="border-2 border-white text-white hover:bg-white hover:text-black px-8 py-4 text-lg rounded flex items-center justify-center">
                  <span className="w-5 h-5 mr-2">⭐</span>
                  Explore Features
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-yellow-400/20 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="mb-4">
                <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">Signal Cartel</span>
              </div>
              <p className="text-gray-400">
                Elite trading powered by collaborative AI. Together We Rise!
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-yellow-400">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/stratus-engine" className="hover:text-electric-purple transition-colors">The Stratus Engine™</Link></li>
                <li><Link href="/features" className="hover:text-electric-purple transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-electric-purple transition-colors">Security</Link></li>
                <li><Link href="#" className="hover:text-electric-purple transition-colors">API Access</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-yellow-400">Trading</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-electric-purple transition-colors">RSI Strategies</Link></li>
                <li><Link href="#" className="hover:text-electric-purple transition-colors">Fibonacci Trading</Link></li>
                <li><Link href="#" className="hover:text-electric-purple transition-colors">AI Momentum</Link></li>
                <li><Link href="#" className="hover:text-electric-purple transition-colors">Risk Management</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-yellow-400">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-electric-purple transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-electric-purple transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-electric-purple transition-colors">Community</Link></li>
                <li><Link href="#" className="hover:text-electric-purple transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-yellow-400/20 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Signal Cartel. Elite trading through collaborative AI. Together We Rise!</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
