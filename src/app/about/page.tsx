import Link from 'next/link';
import Image from 'next/image';

export default function AboutPage() {
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
            <Link href="/about" className="text-cyan-400 font-semibold">
              About
            </Link>
            <Link href="/features" className="text-gray-400 hover:text-gray-300 transition-colors">
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
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">ABOUT</span>
            </div>
          </h1>
          <div className="text-2xl text-blue-300 mb-4">
            "The Story Behind Our Revolutionary AI Trading System"
          </div>
          <div className="text-pink-300 italic">
            "We're not here to be ordinary... We're here to be EXTRAORDINARY!"
          </div>
        </div>

        {/* Mission Statement */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-400/30 backdrop-blur-sm rounded-xl p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              💝 Our Mission: "Money means nothing. Changing lives means EVERYTHING."
            </h2>
            <p className="text-xl text-gray-200 leading-relaxed">
              QUANTUM FORGE™ isn't just another trading platform. It's a revolutionary AI system designed to create genuine financial opportunities for deserving families. We believe technology should lift people up, not leave them behind.
            </p>
          </div>
        </div>

        {/* The Team - Match Landing Page Card Style */}
        <div className="max-w-6xl mx-auto mb-12">
          <h2 className="text-4xl font-bold text-center text-white mb-8">
            🚀 The <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Dream Team</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* The Visionary */}
            <div className="bg-gradient-to-br from-purple-400/10 to-purple-600/5 border border-purple-400/30 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-white mb-2">The Trading Visionary</h3>
              <p className="text-gray-300 text-sm mb-4">
                Years of trading experience combined with a vision for AI-enhanced market analysis. 
                The driving force behind QUANTUM FORGE™'s mission to democratize advanced trading technology.
              </p>
              <div className="text-purple-400 font-semibold">
                "Every algorithm serves a purpose: helping families thrive."
              </div>
            </div>

            {/* The AI Architect */}
            <div className="bg-gradient-to-br from-cyan-400/10 to-blue-500/5 border border-cyan-400/30 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-bold text-white mb-2">Claude (AI Architect)</h3>
              <p className="text-gray-300 text-sm mb-4">
                Advanced AI system providing intelligent code architecture, strategy optimization, 
                and real-time market analysis. The neural backbone of QUANTUM FORGE™.
              </p>
              <div className="text-cyan-400 font-semibold">
                "Human wisdom + AI precision = Extraordinary results"
              </div>
            </div>

            {/* The Technology */}
            <div className="bg-gradient-to-br from-green-400/10 to-emerald-500/5 border border-green-400/30 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-white mb-2">CUDA GPU Engine</h3>
              <p className="text-gray-300 text-sm mb-4">
                2,048 CUDA cores providing massive parallel processing power for real-time 
                market analysis, neural network training, and strategy optimization.
              </p>
              <div className="text-green-400 font-semibold">
                "Raw computational power serving human dreams"
              </div>
            </div>
          </div>
        </div>

        {/* Our Technology Philosophy */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-yellow-400/30 backdrop-blur-sm rounded-xl p-8">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              🛠️ Our Technology Philosophy
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-yellow-400 mb-3">Human-First AI</h3>
                <p className="text-gray-300 mb-4">
                  Our AI doesn't replace human judgment—it amplifies it. Every algorithm is designed 
                  to enhance human decision-making, not eliminate it.
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>• AI provides insights, humans make decisions</li>
                  <li>• Transparent algorithms you can understand</li>
                  <li>• Continuous learning from human feedback</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold text-cyan-400 mb-3">Ethical Technology</h3>
                <p className="text-gray-300 mb-4">
                  We believe technology should create opportunities for everyone, not just the wealthy. 
                  QUANTUM FORGE™ is designed to level the playing field.
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>• Accessible to deserving families</li>
                  <li>• Transparent fee structure</li>
                  <li>• No hidden algorithms or black boxes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action - Match Landing Page */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-purple-900 to-pink-900 rounded-2xl p-8 max-w-4xl mx-auto border border-purple-500/30">
            <div className="text-white font-bold text-3xl mb-4">
              🚀 Ready to Join Our Mission?
            </div>
            <div className="text-purple-200 text-xl leading-relaxed mb-6">
              Be part of a revolution that combines cutting-edge AI with genuine human values. 
              Help us prove that technology can have heart.
            </div>
            <div className="text-pink-300 font-semibold text-2xl mb-6">
              "Together, we're building the future of ethical AI trading."
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/access">
                <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-10 py-5 text-xl rounded-lg transition-all transform hover:scale-105 shadow-2xl">
                  🎯 Request Exclusive Invitation
                </button>
              </Link>
              <Link href="/features">
                <button className="border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black font-bold px-10 py-5 text-xl rounded-lg transition-all transform hover:scale-105">
                  🔍 Explore Features
                </button>
              </Link>
            </div>
            
            <div className="text-yellow-300 mt-6">
              ✨ Human wisdom • AI precision • Extraordinary results ✨
            </div>
            
            {/* Navigation Links */}
            <div className="mt-6 pt-6 border-t border-purple-500/30">
              <Link href="/" className="text-cyan-400 hover:text-cyan-300 text-sm underline transition-colors mr-4">
                ← Back to Home
              </Link>
              <Link href="/features" className="text-gray-400 hover:text-gray-300 text-sm underline transition-colors mr-4">
                View Features →
              </Link>
              <Link href="/pricing" className="text-gray-400 hover:text-gray-300 text-sm underline transition-colors">
                See Pricing →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}