import Link from 'next/link';
import Image from 'next/image';
import MarketingNav from '../../components/marketing-nav';

export default function LegacyLandingPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <MarketingNav currentPage="/legacy" />

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
              <span className="w-4 h-4 mr-2">🌟</span>
              Beyond AI • Beyond Trading • Changing Lives Through Technology
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight drop-shadow-2xl">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">QUANTUM</span><br />
              <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 bg-clip-text text-transparent drop-shadow-lg">FORGE™</span>
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
                <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-200 via-purple-300 to-purple-400 bg-clip-text text-transparent drop-shadow-2xl">QUANTUM FORGE™</h2>
              </div>
              <div className="text-2xl md:text-3xl text-blue-300 mb-6">
                "Revolutionary AI-Enhanced Trading System"
              </div>
              
              <p className="text-xl md:text-2xl text-gray-100 mb-6 max-w-4xl mx-auto leading-relaxed drop-shadow-lg">
                <strong className="text-cyan-300">We're not here to be ordinary... We're here to be EXTRAORDINARY!</strong> 
                Revolutionary GPU-accelerated AI that learns, evolves, and adapts with neural network precision and quantum processing power.
              </p>
            </div>

            <div className="bg-gradient-to-r from-pink-900/50 to-purple-900/50 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-purple-500/30 shadow-2xl">
              <div className="text-pink-300 font-bold text-2xl mb-4">
                💝 "Money means nothing. Changing lives means EVERYTHING."
              </div>
              <p className="text-purple-200 text-lg leading-relaxed">
                Every algorithm is designed with heart. Every optimization serves humanity. 
                This isn't just about trading - it's about providing supplemental income to deserving families, 
                creating opportunities that lift everyone up, and building technology that truly matters.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-6">
              <Link href="/">
                <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-4 text-lg rounded-lg flex items-center justify-center transform hover:scale-105 transition-all">
                  <span className="w-5 h-5 mr-2">🚀</span>
                  Experience AI Showcase
                </button>
              </Link>
              <Link href="/auth/signup">
                <button className="border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black px-8 py-4 text-lg rounded-lg flex items-center justify-center transform hover:scale-105 transition-all">
                  <span className="w-5 h-5 mr-2">⚡</span>
                  Join the Revolution
                </button>
              </Link>
            </div>
            
            <div className="text-center">
              <Link href="/" className="text-yellow-300 hover:text-yellow-200 text-sm underline">
                ← Back to AI Intelligence Showcase
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
              The <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">QUANTUM FORGE™</span> Advantage
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Revolutionary AI technology meets human wisdom. Where extraordinary becomes possible.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-purple-400/10 to-purple-600/5 border border-purple-400/30 backdrop-blur-sm rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-2xl">🧠</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Neural Evolution Engine</h3>
              <p className="text-gray-300 leading-relaxed">
                Self-improving AI that learns from every market movement, evolving strategies in real-time with neural network precision that gets smarter every second.
              </p>
            </div>

            <div className="bg-gradient-to-br from-cyan-400/10 to-blue-500/5 border border-cyan-400/30 backdrop-blur-sm rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-2xl">⚡</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">GPU Quantum Processing</h3>
              <p className="text-gray-300 leading-relaxed">
                CUDA-accelerated computation processing 32 parallel strategies with the rhythm of AI consciousness - like watching the heartbeat of artificial intelligence.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-400/10 to-emerald-500/5 border border-green-400/30 backdrop-blur-sm rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-2xl">💝</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Lives Changed Technology</h3>
              <p className="text-gray-300 leading-relaxed">
                Technology designed with heart to provide supplemental income to deserving families. Every algorithm serves humanity, every optimization changes lives.
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
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">QUANTUM FORGE™</span> Performance
            </h2>

            <div className="grid md:grid-cols-4 gap-8 mb-12">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">82.4%</div>
                <div className="text-gray-300">AI Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-cyan-400 mb-2">2,048</div>
                <div className="text-gray-300">CUDA Cores</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">127x</div>
                <div className="text-gray-300">GPU Advantage</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-pink-400 mb-2">12</div>
                <div className="text-gray-300">Lives Helped</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30">
              <p className="text-xl text-purple-100 mb-6">
                "This isn't just a trading system. This is proof that we can build technology with heart, intelligence without limits, and create financial opportunity that lifts everyone up."
              </p>
              <p className="text-pink-300 font-semibold">- QUANTUM FORGE™ Philosophy</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-900/80 to-pink-900/60">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              🌟 <span className="bg-gradient-to-r from-yellow-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">INVITE ONLY</span> 🌟
            </h2>
            <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/50 rounded-2xl p-8 mb-8">
              <div className="text-yellow-300 font-bold text-2xl mb-4">
                🔒 EXCLUSIVE ACCESS • VERIFIED MEMBERS ONLY
              </div>
              <p className="text-yellow-100 text-xl mb-4">
                QUANTUM FORGE™ is not available to the general public. Our revolutionary AI technology is reserved for qualified individuals who share our mission.
              </p>
              <p className="text-orange-200 text-lg">
                "We're not here to be ordinary... We're here to be EXTRAORDINARY!"
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-purple-500/30">
              <div className="text-pink-300 font-bold text-xl mb-3">
                💝 "Money means nothing. Changing lives means EVERYTHING."
              </div>
              <p className="text-purple-200">
                If you believe in technology with heart and AI that serves humanity, request your invitation below.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-6">
              <Link href="/auth/signup">
                <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-10 py-5 text-xl rounded-lg flex items-center justify-center transform hover:scale-105 transition-all shadow-2xl">
                  <span className="w-6 h-6 mr-3">🎯</span>
                  Request Exclusive Invitation
                </button>
              </Link>
              <Link href="/access">
                <button className="border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black font-bold px-10 py-5 text-xl rounded-lg flex items-center justify-center transform hover:scale-105 transition-all">
                  <span className="w-6 h-6 mr-3">💌</span>
                  Contact for Access
                </button>
              </Link>
            </div>
            
            <div className="text-gray-400 text-sm">
              * All applications are carefully reviewed. Only qualified candidates committed to our mission will be accepted.
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
                <li><Link href="/" className="hover:text-electric-purple transition-colors">AI Showcase</Link></li>
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