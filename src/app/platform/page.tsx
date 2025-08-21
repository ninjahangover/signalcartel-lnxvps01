import Link from 'next/link';
import MarketingNav from '../../components/marketing-nav';

export default function PlatformPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <MarketingNav />

      {/* Hero Section */}
      <section className="pt-24 pb-20 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
              Elite Trading <span className="bg-gradient-to-r from-yellow-400 to-purple-500 bg-clip-text text-transparent">Platform</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Access professional-grade trading tools powered by AI, designed for serious traders who demand results
            </p>
            <Link href="/auth/signup">
              <button className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold px-8 py-4 text-lg rounded">
                Access Platform
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-white">Platform Features</h2>
            <p className="text-xl text-gray-300">Everything you need for professional trading</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-gray-800 p-8 rounded-xl border border-yellow-400/20">
              <h3 className="text-2xl font-bold text-yellow-400 mb-4">🤖 AI Strategy Engine</h3>
              <p className="text-gray-300">
                Advanced machine learning algorithms that optimize your trading strategies in real-time
              </p>
            </div>
            
            <div className="bg-gray-800 p-8 rounded-xl border border-purple-400/20">
              <h3 className="text-2xl font-bold text-purple-400 mb-4">📊 Live Trading Dashboard</h3>
              <p className="text-gray-300">
                Professional TradingView charts with real-time Kraken data and advanced analytics
              </p>
            </div>
            
            <div className="bg-gray-800 p-8 rounded-xl border border-green-400/20">
              <h3 className="text-2xl font-bold text-green-400 mb-4">🔒 Risk Management</h3>
              <p className="text-gray-300">
                Sophisticated risk controls and position management tools to protect your capital
              </p>
            </div>

            <div className="bg-gray-800 p-8 rounded-xl border border-blue-400/20">
              <h3 className="text-2xl font-bold text-blue-400 mb-4">📈 Performance Analytics</h3>
              <p className="text-gray-300">
                Detailed performance metrics, backtesting, and strategy optimization insights
              </p>
            </div>
            
            <div className="bg-gray-800 p-8 rounded-xl border border-red-400/20">
              <h3 className="text-2xl font-bold text-red-400 mb-4">⚡ Real-Time Execution</h3>
              <p className="text-gray-300">
                Lightning-fast trade execution with direct API integration to major exchanges
              </p>
            </div>
            
            <div className="bg-gray-800 p-8 rounded-xl border border-indigo-400/20">
              <h3 className="text-2xl font-bold text-indigo-400 mb-4">🧠 Pine Script Integration</h3>
              <p className="text-gray-300">
                Seamless integration with your existing Pine Script strategies and TradingView alerts
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Access */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6 text-white">
              Ready to Access the Platform?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join elite traders using Signal Cartel's advanced trading platform
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/auth/signup">
                <button className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold px-8 py-4 text-lg rounded">
                  Start Free Trial
                </button>
              </Link>
              <Link href="/pricing">
                <button className="border-2 border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white px-8 py-4 text-lg rounded">
                  View Pricing
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}