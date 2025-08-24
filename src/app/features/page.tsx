import Link from 'next/link';
import Image from 'next/image';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navigation - Match Landing Page */}
      <nav className="bg-black/50 backdrop-blur-sm border-b border-purple-500/30 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <Image 
                src="/signal.cartel.shield.trans.png" 
                alt="Signal Cartel Logo" 
                width={40} 
                height={40}
                className="w-10 h-10"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-purple-400 bg-clip-text text-transparent">
                Signal Cartel
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/about" className="text-gray-400 hover:text-gray-300 transition-colors">
              About
            </Link>
            <Link href="/features" className="text-cyan-400 font-semibold">
              Features
            </Link>
            <Link href="/pricing" className="text-gray-400 hover:text-gray-300 transition-colors">
              Pricing
            </Link>
            <Link href="/auth/login" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg transition-all">
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Match Landing Page Style */}
      <div className="p-6">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            🌟 <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">QUANTUM</span><br />
            <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 bg-clip-text text-transparent drop-shadow-lg">FORGE™</span>
            <div className="text-3xl mt-4">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">FEATURES</span>
            </div>
          </h1>
          <div className="text-2xl text-blue-300 mb-4">
            "Revolutionary AI Features That Change Lives"
          </div>
          <div className="text-pink-300 italic">
            "Technology with heart, intelligence without limits"
          </div>
        </div>

        {/* Feature Highlights - Same card style as landing page */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-purple-400/10 to-purple-600/5 border border-purple-400/30 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-bold text-white mb-2">Neural Evolution</h3>
              <p className="text-gray-300 text-sm">
                Self-improving AI that learns from every market movement, continuously adapting strategies for deserving families.
              </p>
            </div>

            <div className="bg-gradient-to-br from-cyan-400/10 to-blue-500/5 border border-cyan-400/30 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-white mb-2">CUDA Processing</h3>
              <p className="text-gray-300 text-sm">
                2,048 CUDA cores providing lightning-fast analysis to create real opportunities for real families.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-400/10 to-emerald-500/5 border border-green-400/30 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-white mb-2">Advanced Analytics</h3>
              <p className="text-gray-300 text-sm">
                Sophisticated market analysis that turns complex data into simple opportunities for financial growth.
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-400/10 to-red-500/5 border border-pink-400/30 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">💝</div>
              <h3 className="text-xl font-bold text-white mb-2">Mission Driven</h3>
              <p className="text-gray-300 text-sm">
                Every feature designed with one goal: creating financial opportunities that lift families up.
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Features */}
        <div className="max-w-6xl mx-auto mb-12">
          <h2 className="text-4xl font-bold text-center text-white mb-8">
            🚀 Features That <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Change Everything</span>
          </h2>
          
          <div className="space-y-8">
            {/* AI Trading Engine */}
            <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-400/30 backdrop-blur-sm rounded-xl p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    🧠 Sentiment-Enhanced AI Trading Engine
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Our revolutionary AI doesn't just analyze numbers - it understands market sentiment, social media trends, and news impact. This human-like intuition combined with machine precision creates trading opportunities that traditional algorithms miss.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>• Real-time sentiment analysis from multiple sources</li>
                    <li>• Neural networks that learn from market patterns</li>
                    <li>• Risk management that protects your family's future</li>
                    <li>• Transparent decision-making you can understand</li>
                  </ul>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-6 border border-cyan-400/20">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400 mb-2">4,200+</div>
                    <p className="text-gray-300 text-sm">Successful Trades Analyzed</p>
                    <div className="mt-4">
                      <div className="text-2xl font-bold text-cyan-400">49.4%</div>
                      <p className="text-gray-300 text-sm">Win Rate (Continuously Improving)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* GPU Acceleration */}
            <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-yellow-400/30 backdrop-blur-sm rounded-xl p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="bg-gray-900/50 rounded-lg p-6 border border-yellow-400/20">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-400 mb-2">2,048</div>
                    <p className="text-gray-300 text-sm">CUDA Cores Active</p>
                    <div className="mt-4">
                      <div className="text-2xl font-bold text-orange-400">847ms</div>
                      <p className="text-gray-300 text-sm">Average Analysis Speed</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    ⚡ GPU-Accelerated Market Analysis
                  </h3>
                  <p className="text-gray-300 mb-4">
                    While other platforms use basic CPU processing, QUANTUM FORGE™ harnesses the power of GPU acceleration. This means we can analyze thousands of market scenarios simultaneously, finding opportunities in milliseconds that others take minutes to discover.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>• Parallel processing of multiple trading strategies</li>
                    <li>• Real-time pattern recognition across all timeframes</li>
                    <li>• Instant risk assessment for every trade decision</li>
                    <li>• Lightning-fast execution when opportunities arise</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Human-AI Collaboration */}
            <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-400/30 backdrop-blur-sm rounded-xl p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-4">
                  🤝 Human Wisdom + AI Precision = Extraordinary Results
                </h3>
                <p className="text-gray-300 text-lg">
                  Unlike pure algorithmic trading, QUANTUM FORGE™ combines human insight with AI capabilities. You're not replaced by the machine - you're empowered by it.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl mb-3">🎯</div>
                  <h4 className="font-bold text-green-400 mb-2">Human Strategy</h4>
                  <p className="text-sm text-gray-400">Your trading experience and market intuition guide the overall direction</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">🧠</div>
                  <h4 className="font-bold text-cyan-400 mb-2">AI Enhancement</h4>
                  <p className="text-sm text-gray-400">AI amplifies your decisions with data analysis and pattern recognition</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">⚡</div>
                  <h4 className="font-bold text-purple-400 mb-2">Perfect Execution</h4>
                  <p className="text-sm text-gray-400">GPU acceleration ensures your enhanced strategies execute flawlessly</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action - Match Landing Page */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-2xl p-8 max-w-4xl mx-auto border border-purple-500/30">
            <div className="text-white font-bold text-3xl mb-4">
              🚀 Experience These Revolutionary Features
            </div>
            <div className="text-purple-200 text-xl leading-relaxed mb-6">
              Every feature in QUANTUM FORGE™ is designed with one mission: creating genuine financial opportunities for deserving families. This isn't just advanced technology - it's technology with heart.
            </div>
            <div className="text-pink-300 font-semibold text-2xl mb-6">
              "Money means nothing. Changing lives means EVERYTHING."
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/access">
                <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-10 py-5 text-xl rounded-lg transition-all transform hover:scale-105 shadow-2xl">
                  🎯 Request Exclusive Access
                </button>
              </Link>
              <Link href="/pricing">
                <button className="border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black font-bold px-10 py-5 text-xl rounded-lg transition-all transform hover:scale-105">
                  💎 View Pricing
                </button>
              </Link>
            </div>
            
            <div className="text-yellow-300 mt-6">
              ✨ Advanced features • Ethical mission • Extraordinary results ✨
            </div>
            
            {/* Navigation Links */}
            <div className="mt-6 pt-6 border-t border-purple-500/30">
              <Link href="/about" className="text-cyan-400 hover:text-cyan-300 text-sm underline transition-colors mr-4">
                ← Learn Our Story
              </Link>
              <Link href="/pricing" className="text-gray-400 hover:text-gray-300 text-sm underline transition-colors mr-4">
                View Pricing →
              </Link>
              <Link href="/" className="text-gray-400 hover:text-gray-300 text-sm underline transition-colors">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}