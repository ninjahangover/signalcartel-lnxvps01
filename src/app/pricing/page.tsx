"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import MarketingNav from '../../components/marketing-nav';

function PricingContent() {
  const searchParams = useSearchParams();
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
      <MarketingNav currentPage="/pricing" />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Exclusive Access
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Signal Cartel is currently available by invitation only. Join our exclusive waitlist 
            to be among the first to access The Stratus Engine™ advanced trading platform.
          </p>
          <div className="bg-gold-500/20 border border-gold-400 text-gold-300 px-6 py-4 rounded-lg max-w-2xl mx-auto mb-8">
            <h3 className="font-semibold mb-2">🎯 Invite Only Platform</h3>
            <p className="text-sm">We're carefully selecting traders to ensure the highest quality experience. Request access below or ask for a personal invitation.</p>
          </div>
        </div>
      </section>

      {/* Waitlist Signup */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-black/50 p-8 md:p-12 rounded-xl border border-gold-400/50">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Join the Waitlist</h2>
              <p className="text-gray-300 mb-6">
                Be among the first to experience the future of AI-powered trading. We'll notify you when access becomes available.
              </p>
            </div>
            
            <form className="max-w-2xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">First Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-gold-400 focus:outline-none"
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Last Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-gold-400 focus:outline-none"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-white text-sm font-medium mb-2">Email Address</label>
                <input 
                  type="email" 
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-gold-400 focus:outline-none"
                  placeholder="Enter your email address"
                />
              </div>
              
              <div>
                <label className="block text-white text-sm font-medium mb-2">Trading Experience</label>
                <select className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-gold-400 focus:outline-none">
                  <option value="">Select your experience level</option>
                  <option value="beginner">Beginner (0-1 years)</option>
                  <option value="intermediate">Intermediate (1-3 years)</option>
                  <option value="advanced">Advanced (3-5 years)</option>
                  <option value="expert">Expert (5+ years)</option>
                  <option value="institutional">Institutional Trader</option>
                </select>
              </div>
              
              <div>
                <label className="block text-white text-sm font-medium mb-2">How did you hear about us?</label>
                <select className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-gold-400 focus:outline-none">
                  <option value="">Please select</option>
                  <option value="referral">Personal Referral</option>
                  <option value="social">Social Media</option>
                  <option value="search">Search Engine</option>
                  <option value="community">Trading Community</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="text-center pt-4">
                <button 
                  type="submit"
                  className="bg-gold-500 hover:bg-gold-600 text-black font-bold px-8 py-4 rounded-lg text-lg transition-colors"
                >
                  Request Access
                </button>
                <p className="text-gray-400 text-sm mt-4">
                  We respect your privacy. Your information will never be shared with third parties.
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* What You'll Get */}
      <section className="py-16 px-6 bg-black/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">What You'll Get Access To</h2>
            <p className="text-gray-300">Exclusive features available only to Signal Cartel members</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-black/50 p-6 rounded-xl border border-gold-400/20">
              <div className="text-gold-400 text-3xl mb-4">🧠</div>
              <h3 className="text-xl font-bold text-white mb-3">The Stratus Engine™</h3>
              <p className="text-gray-300">
                Advanced AI trading engine with neural network predictions and adaptive learning algorithms.
              </p>
            </div>
            
            <div className="bg-black/50 p-6 rounded-xl border border-gold-400/20">
              <div className="text-gold-400 text-3xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-white mb-3">Real-Time Analytics</h3>
              <p className="text-gray-300">
                Live market analysis, sentiment tracking, and predictive insights powered by machine learning.
              </p>
            </div>
            
            <div className="bg-black/50 p-6 rounded-xl border border-gold-400/20">
              <div className="text-gold-400 text-3xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-white mb-3">Precision Trading</h3>
              <p className="text-gray-300">
                Automated execution with risk management, position sizing, and portfolio optimization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-8">
            <div className="bg-black/40 p-6 rounded-xl border border-gold-400/20">
              <h3 className="text-xl font-bold text-white mb-3">
                How does the invitation process work?
              </h3>
              <p className="text-gray-300">
                We review applications carefully and send invitations based on trading experience, 
                fit with our platform, and availability. The process typically takes 1-2 weeks.
              </p>
            </div>

            <div className="bg-black/40 p-6 rounded-xl border border-gold-400/20">
              <h3 className="text-xl font-bold text-white mb-3">
                Can I get an invitation through a referral?
              </h3>
              <p className="text-gray-300">
                Yes! If you know someone who already has access to Signal Cartel, 
                they can refer you directly, which expedites the process significantly.
              </p>
            </div>

            <div className="bg-black/40 p-6 rounded-xl border border-gold-400/20">
              <h3 className="text-xl font-bold text-white mb-3">
                What exchanges do you support?
              </h3>
              <p className="text-gray-300">
                We currently support Kraken with plans to add Coinbase Pro, Binance, 
                and other major exchanges. Contact us if you need support for a specific exchange.
              </p>
            </div>

            <div className="bg-black/40 p-6 rounded-xl border border-gold-400/20">
              <h3 className="text-xl font-bold text-white mb-3">
                Is my trading data secure?
              </h3>
              <p className="text-gray-300">
                Absolutely. We use enterprise-grade security including end-to-end encryption, 
                secure API key storage, and SOC 2 compliance. Your trading data 
                and credentials are never stored in plain text.
              </p>
            </div>

            <div className="bg-black/40 p-6 rounded-xl border border-gold-400/20">
              <h3 className="text-xl font-bold text-white mb-3">
                What happens after I get invited?
              </h3>
              <p className="text-gray-300">
                Once accepted, you'll receive personalized onboarding, access to The Stratus Engine™, 
                and direct support from our team to optimize your trading strategy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Join the Elite?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Request access to Signal Cartel and discover why exclusive members consistently outperform the market.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="bg-gold-500 hover:bg-gold-600 text-black px-8 py-4 rounded-lg font-bold text-lg transition-colors">
              Request Invitation
            </Link>
            <Link href="/features" className="border border-gold-400 text-gold-400 hover:bg-gold-400 hover:text-black px-8 py-4 rounded-lg font-bold text-lg transition-colors">
              Learn More
            </Link>
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
                Elevating wealth through intelligent trading solutions.
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
            <p>&copy; 2024 Signal Cartel. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center text-white">Loading...</div>}>
      <PricingContent />
    </Suspense>
  );
}