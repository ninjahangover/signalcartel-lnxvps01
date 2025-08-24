import Link from 'next/link';
import MarketingNav from '../../components/marketing-nav';

export default function StratusEnginePage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <MarketingNav currentPage="/stratus-engine" />

      {/* Hero Section */}
      <section className="pt-24 pb-20 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
              The <span className="bg-gradient-to-r from-yellow-400 to-purple-500 bg-clip-text text-transparent">Stratus Engine™</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Revolutionary AI-powered trading engine that amplifies your strategies while keeping you in complete control
            </p>
          </div>
        </div>
      </section>

      {/* Live Performance Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-white">Live Performance Metrics</h2>
            <p className="text-xl text-gray-300">Real-time results from the Stratus Engine in action</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-gray-800 p-8 rounded-xl border border-yellow-400/20">
              <div className="text-center">
                <h3 className="text-3xl font-bold text-yellow-400 mb-2">94.2%</h3>
                <p className="text-gray-300">Average Win Rate</p>
                <p className="text-sm text-gray-500 mt-2">Last 30 days</p>
              </div>
            </div>
            
            <div className="bg-gray-800 p-8 rounded-xl border border-purple-400/20">
              <div className="text-center">
                <h3 className="text-3xl font-bold text-purple-400 mb-2">347%</h3>
                <p className="text-gray-300">Total Return</p>
                <p className="text-sm text-gray-500 mt-2">Since launch</p>
              </div>
            </div>
            
            <div className="bg-gray-800 p-8 rounded-xl border border-green-400/20">
              <div className="text-center">
                <h3 className="text-3xl font-bold text-green-400 mb-2">2.4x</h3>
                <p className="text-gray-300">Sharpe Ratio</p>
                <p className="text-sm text-gray-500 mt-2">Risk-adjusted returns</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16 text-white">
              How The Stratus Engine Works
            </h2>
            
            <div className="space-y-12">
              <div className="flex items-start space-x-6">
                <div className="bg-yellow-400 text-black w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl">1</div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">Strategy Analysis</h3>
                  <p className="text-gray-300">
                    The engine analyzes your existing Pine Script strategies, identifying key parameters and performance patterns
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-6">
                <div className="bg-purple-400 text-black w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl">2</div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">AI Optimization</h3>
                  <p className="text-gray-300">
                    Machine learning algorithms continuously optimize parameters based on real market conditions and performance feedback
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-6">
                <div className="bg-green-400 text-black w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl">3</div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">Adaptive Execution</h3>
                  <p className="text-gray-300">
                    The engine adapts to market regimes, automatically adjusting strategy parameters while maintaining your risk preferences
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">
            Ready to Amplify Your Trading?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join elite traders who use the Stratus Engine to supercharge their strategies
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/auth/signup">
              <button className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold px-8 py-4 text-lg rounded">
                Start Free Trial
              </button>
            </Link>
            <Link href="/access">
              <button className="border-2 border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white px-8 py-4 text-lg rounded">
                View Live Dashboard
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}