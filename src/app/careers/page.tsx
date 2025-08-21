import Link from 'next/link';
import MarketingNav from '../../components/marketing-nav';

export default function CareersPage() {
  const openPositions = [
    {
      title: "Senior AI/ML Engineer",
      department: "Engineering",
      location: "San Francisco, CA / Remote",
      type: "Full-time",
      description: "Build and optimize machine learning models for trading signal generation. Work with our quantitative team to improve The Stratus Engine™."
    },
    {
      title: "Quantitative Analyst",
      department: "Trading",
      location: "New York, NY",
      type: "Full-time", 
      description: "Develop and backtest trading strategies, perform statistical analysis, and work closely with our AI team to improve model performance."
    },
    {
      title: "Senior Frontend Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      description: "Build responsive, high-performance user interfaces for our trading platform using React, Next.js, and modern web technologies."
    },
    {
      title: "DevOps Engineer",
      department: "Infrastructure",
      location: "San Francisco, CA / Remote",
      type: "Full-time",
      description: "Manage our cloud infrastructure, implement CI/CD pipelines, and ensure 99.9% uptime for our critical trading systems."
    },
    {
      title: "Security Engineer",
      department: "Security",
      location: "New York, NY / Remote",
      type: "Full-time",
      description: "Strengthen our security posture, conduct security audits, and ensure compliance with SOC 2 and other security frameworks."
    },
    {
      title: "Product Manager",
      department: "Product",
      location: "New York, NY",
      type: "Full-time",
      description: "Drive product strategy and roadmap for Signal Cartel, work closely with engineering and design to deliver exceptional user experiences."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
      <MarketingNav />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Join the Future of Trading
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Help us build the next generation of AI-powered trading technology. 
            Work with world-class engineers, traders, and AI researchers to revolutionize financial markets.
          </p>
        </div>
      </section>

      {/* Why Join Us */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Why Signal Cartel?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-black/40 p-8 rounded-xl border border-gold-400/20 text-center">
              <div className="w-16 h-16 bg-gold-400 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-black font-bold text-xl">🚀</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Cutting-Edge Technology</h3>
              <p className="text-gray-300">
                Work with the latest AI/ML technologies, distributed systems, and real-time trading infrastructure.
              </p>
            </div>

            <div className="bg-black/40 p-8 rounded-xl border border-gold-400/20 text-center">
              <div className="w-16 h-16 bg-gold-400 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-black font-bold text-xl">💡</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">High Impact Work</h3>
              <p className="text-gray-300">
                Your work directly impacts thousands of traders and millions of dollars in trading volume.
              </p>
            </div>

            <div className="bg-black/40 p-8 rounded-xl border border-gold-400/20 text-center">
              <div className="w-16 h-16 bg-gold-400 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-black font-bold text-xl">🌟</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">World-Class Team</h3>
              <p className="text-gray-300">
                Learn from and work alongside experts from Google, Goldman Sachs, Citadel, and other top organizations.
              </p>
            </div>

            <div className="bg-black/40 p-8 rounded-xl border border-gold-400/20 text-center">
              <div className="w-16 h-16 bg-gold-400 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-black font-bold text-xl">⚖️</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Work-Life Balance</h3>
              <p className="text-gray-300">
                Flexible schedules, unlimited PTO, and remote-first culture that values results over hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Benefits & Perks
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-black/40 p-6 rounded-xl border border-gold-400/20">
              <h3 className="text-lg font-bold text-white mb-3">💰 Competitive Compensation</h3>
              <p className="text-gray-300">
                Top-tier salaries plus significant equity packages. Annual performance bonuses based on company and individual success.
              </p>
            </div>

            <div className="bg-black/40 p-6 rounded-xl border border-gold-400/20">
              <h3 className="text-lg font-bold text-white mb-3">🏥 Health & Wellness</h3>
              <p className="text-gray-300">
                Comprehensive health, dental, and vision insurance. Mental health support and wellness stipends.
              </p>
            </div>

            <div className="bg-black/40 p-6 rounded-xl border border-gold-400/20">
              <h3 className="text-lg font-bold text-white mb-3">🏖️ Time Off</h3>
              <p className="text-gray-300">
                Unlimited PTO policy, 12 company holidays, and quarterly company-wide break weeks.
              </p>
            </div>

            <div className="bg-black/40 p-6 rounded-xl border border-gold-400/20">
              <h3 className="text-lg font-bold text-white mb-3">📚 Learning & Development</h3>
              <p className="text-gray-300">
                $5,000 annual learning budget, conference attendance, and internal tech talks with industry experts.
              </p>
            </div>

            <div className="bg-black/40 p-6 rounded-xl border border-gold-400/20">
              <h3 className="text-lg font-bold text-white mb-3">🏠 Remote-First</h3>
              <p className="text-gray-300">
                Work from anywhere with flexible hours. Home office setup budget and co-working space allowances.
              </p>
            </div>

            <div className="bg-black/40 p-6 rounded-xl border border-gold-400/20">
              <h3 className="text-lg font-bold text-white mb-3">🚀 Equity & Growth</h3>
              <p className="text-gray-300">
                Meaningful equity stakes in a fast-growing fintech company. Clear career progression paths.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Open Positions
            </h2>
            <p className="text-xl text-gray-300">
              Join our growing team and help shape the future of AI-powered trading
            </p>
          </div>

          <div className="space-y-6">
            {openPositions.map((position, index) => (
              <div key={index} className="bg-black/40 p-8 rounded-xl border border-gold-400/20 hover:border-gold-400/50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <h3 className="text-2xl font-bold text-white">{position.title}</h3>
                      <span className="bg-gold-400 text-black px-3 py-1 rounded-full text-sm font-semibold">
                        {position.department}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mb-4 text-gray-300">
                      <span>📍 {position.location}</span>
                      <span>💼 {position.type}</span>
                    </div>
                    <p className="text-gray-300">{position.description}</p>
                  </div>
                  <div className="mt-6 lg:mt-0 lg:ml-8">
                    <Link 
                      href={`/contact?position=${encodeURIComponent(position.title)}`}
                      className="bg-gold-500 hover:bg-gold-600 text-black px-6 py-3 rounded-lg font-semibold transition-colors inline-block"
                    >
                      Apply Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-300 mb-6">
              Don't see a position that fits? We're always looking for exceptional talent.
            </p>
            <Link 
              href="/contact?inquiry=careers"
              className="border border-gold-400 text-gold-400 hover:bg-gold-400 hover:text-black px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

      {/* Culture */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Our Culture
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Our Values</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gold-400 mb-2">🎯 Excellence</h4>
                  <p className="text-gray-300">
                    We strive for excellence in everything we do. From code quality to customer service, 
                    we believe in doing things right the first time.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gold-400 mb-2">🤝 Collaboration</h4>
                  <p className="text-gray-300">
                    We believe the best solutions come from diverse perspectives working together. 
                    We encourage open communication and cross-team collaboration.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gold-400 mb-2">🔍 Curiosity</h4>
                  <p className="text-gray-300">
                    We're always learning, experimenting, and pushing boundaries. We encourage 
                    taking calculated risks and learning from failures.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gold-400 mb-2">🏆 Ownership</h4>
                  <p className="text-gray-300">
                    We take ownership of our work and its impact. Every team member is empowered 
                    to make decisions and drive results.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Life at Signal Cartel</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gold-400 mb-2">🏢 Flexible Work Environment</h4>
                  <p className="text-gray-300">
                    Work from our beautiful offices in NYC, SF, and London, or from anywhere in the world. 
                    We provide top-tier equipment and support for remote work.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gold-400 mb-2">🎉 Team Events</h4>
                  <p className="text-gray-300">
                    Regular team building events, quarterly off-sites, and annual company retreats 
                    in amazing locations around the world.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gold-400 mb-2">📈 Growth Opportunities</h4>
                  <p className="text-gray-300">
                    Clear career progression paths, mentorship programs, and opportunities to lead 
                    high-impact projects and teams.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gold-400 mb-2">🌍 Diverse & Inclusive</h4>
                  <p className="text-gray-300">
                    We're committed to building a diverse and inclusive workplace where everyone 
                    can do their best work and feel valued.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Join Us?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Be part of a team that's revolutionizing trading with AI. Apply today 
            and help us build the future of financial technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact?inquiry=careers" className="bg-gold-500 hover:bg-gold-600 text-black px-8 py-4 rounded-lg font-bold text-lg transition-colors">
              View All Positions
            </Link>
            <a href="mailto:careers@signalcartel.com" className="border border-gold-400 text-gold-400 hover:bg-gold-400 hover:text-black px-8 py-4 rounded-lg font-bold text-lg transition-colors">
              Email Careers Team
            </a>
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