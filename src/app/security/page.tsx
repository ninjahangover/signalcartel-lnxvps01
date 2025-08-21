import Link from 'next/link';
import MarketingNav from '../../components/marketing-nav';

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
      <MarketingNav />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Enterprise-Grade Security
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Your trading data, API keys, and personal information are protected by 
            institutional-level security measures used by Fortune 500 companies.
          </p>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-black/40 p-8 rounded-xl border border-gold-400/20">
              <div className="w-16 h-16 bg-gold-400 rounded-lg mb-6 flex items-center justify-center">
                <span className="text-black font-bold text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">End-to-End Encryption</h3>
              <p className="text-gray-300 mb-4">
                All data is encrypted using AES-256 encryption in transit and at rest. 
                Your API keys are never stored in plain text and are encrypted with 
                your unique encryption key.
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• AES-256 encryption</li>
                <li>• TLS 1.3 for data in transit</li>
                <li>• Client-side key encryption</li>
                <li>• Zero-knowledge architecture</li>
              </ul>
            </div>

            <div className="bg-black/40 p-8 rounded-xl border border-gold-400/20">
              <div className="w-16 h-16 bg-gold-400 rounded-lg mb-6 flex items-center justify-center">
                <span className="text-black font-bold text-2xl">🛡️</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Multi-Factor Authentication</h3>
              <p className="text-gray-300 mb-4">
                Advanced authentication system with support for TOTP, SMS, email, 
                and hardware security keys. Protect your account with multiple layers 
                of verification.
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• TOTP authenticators</li>
                <li>• Hardware security keys</li>
                <li>• SMS verification</li>
                <li>• Email confirmation</li>
              </ul>
            </div>

            <div className="bg-black/40 p-8 rounded-xl border border-gold-400/20">
              <div className="w-16 h-16 bg-gold-400 rounded-lg mb-6 flex items-center justify-center">
                <span className="text-black font-bold text-2xl">🔐</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">API Key Protection</h3>
              <p className="text-gray-300 mb-4">
                Your exchange API keys are encrypted and stored securely. We never 
                request withdrawal permissions and use read-only or limited trading 
                permissions only.
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Hardware security modules</li>
                <li>• No withdrawal permissions</li>
                <li>• Encrypted key storage</li>
                <li>• Regular key rotation</li>
              </ul>
            </div>

            <div className="bg-black/40 p-8 rounded-xl border border-gold-400/20">
              <div className="w-16 h-16 bg-gold-400 rounded-lg mb-6 flex items-center justify-center">
                <span className="text-black font-bold text-2xl">🏢</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">SOC 2 Compliance</h3>
              <p className="text-gray-300 mb-4">
                We maintain SOC 2 Type II compliance with regular third-party audits 
                of our security controls, processes, and infrastructure.
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Annual security audits</li>
                <li>• Compliance monitoring</li>
                <li>• Risk assessments</li>
                <li>• Security frameworks</li>
              </ul>
            </div>

            <div className="bg-black/40 p-8 rounded-xl border border-gold-400/20">
              <div className="w-16 h-16 bg-gold-400 rounded-lg mb-6 flex items-center justify-center">
                <span className="text-black font-bold text-2xl">🌐</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Infrastructure Security</h3>
              <p className="text-gray-300 mb-4">
                Our infrastructure is hosted on enterprise cloud providers with 
                DDoS protection, network isolation, and continuous monitoring.
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• DDoS protection</li>
                <li>• Network segmentation</li>
                <li>• Intrusion detection</li>
                <li>• 24/7 monitoring</li>
              </ul>
            </div>

            <div className="bg-black/40 p-8 rounded-xl border border-gold-400/20">
              <div className="w-16 h-16 bg-gold-400 rounded-lg mb-6 flex items-center justify-center">
                <span className="text-black font-bold text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Access Controls</h3>
              <p className="text-gray-300 mb-4">
                Role-based access controls, principle of least privilege, and 
                comprehensive audit logging ensure only authorized personnel 
                can access sensitive systems.
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Role-based permissions</li>
                <li>• Audit logging</li>
                <li>• Background checks</li>
                <li>• Regular access reviews</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance & Certifications */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Compliance & Certifications
            </h2>
            <p className="text-xl text-gray-300">
              Meeting the highest standards for data protection and financial security
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-black/40 p-6 rounded-xl border border-gold-400/20 text-center">
              <div className="text-4xl mb-4">🏛️</div>
              <h3 className="text-lg font-bold text-white mb-2">SOC 2 Type II</h3>
              <p className="text-gray-400 text-sm">Security, availability, and confidentiality controls</p>
            </div>

            <div className="bg-black/40 p-6 rounded-xl border border-gold-400/20 text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-lg font-bold text-white mb-2">ISO 27001</h3>
              <p className="text-gray-400 text-sm">Information security management system</p>
            </div>

            <div className="bg-black/40 p-6 rounded-xl border border-gold-400/20 text-center">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-lg font-bold text-white mb-2">GDPR Compliant</h3>
              <p className="text-gray-400 text-sm">European data protection regulation</p>
            </div>

            <div className="bg-black/40 p-6 rounded-xl border border-gold-400/20 text-center">
              <div className="text-4xl mb-4">⚖️</div>
              <h3 className="text-lg font-bold text-white mb-2">CCPA Compliant</h3>
              <p className="text-gray-400 text-sm">California consumer privacy act</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Practices */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Security Best Practices
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">For Your Account</h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gold-400 rounded-full flex items-center justify-center">
                    <span className="text-black font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Enable Two-Factor Authentication</h4>
                    <p className="text-gray-300">Use an authenticator app like Google Authenticator or Authy for the strongest protection.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gold-400 rounded-full flex items-center justify-center">
                    <span className="text-black font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Use Strong, Unique Passwords</h4>
                    <p className="text-gray-300">Create a unique password for Signal Cartel that you don't use anywhere else.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gold-400 rounded-full flex items-center justify-center">
                    <span className="text-black font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Monitor Account Activity</h4>
                    <p className="text-gray-300">Regularly check your account activity and report any suspicious behavior immediately.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gold-400 rounded-full flex items-center justify-center">
                    <span className="text-black font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Keep Software Updated</h4>
                    <p className="text-gray-300">Use updated browsers and operating systems to ensure you have the latest security patches.</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white mb-6">For Your API Keys</h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gold-400 rounded-full flex items-center justify-center">
                    <span className="text-black font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Limit API Permissions</h4>
                    <p className="text-gray-300">Only grant the minimum permissions required: "Query Funds" and "Query Orders". Never allow withdrawals.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gold-400 rounded-full flex items-center justify-center">
                    <span className="text-black font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Use Dedicated API Keys</h4>
                    <p className="text-gray-300">Create API keys specifically for Signal Cartel and don't share them with other services.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gold-400 rounded-full flex items-center justify-center">
                    <span className="text-black font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Regular Key Rotation</h4>
                    <p className="text-gray-300">Periodically rotate your API keys and update them in Signal Cartel for maximum security.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gold-400 rounded-full flex items-center justify-center">
                    <span className="text-black font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Monitor Exchange Activity</h4>
                    <p className="text-gray-300">Keep an eye on your exchange account for any unexpected activity or orders.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Incident Response */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Security Incident Response
            </h2>
            <p className="text-gray-300">
              In the unlikely event of a security incident, we have comprehensive procedures in place
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gold-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-black font-bold text-xl">🚨</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Immediate Detection</h3>
              <p className="text-gray-300 text-sm">
                24/7 monitoring systems detect and alert us to potential security threats within minutes.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gold-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-black font-bold text-xl">🔒</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Rapid Containment</h3>
              <p className="text-gray-300 text-sm">
                Our incident response team immediately contains threats and protects user data and systems.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gold-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-black font-bold text-xl">📢</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Transparent Communication</h3>
              <p className="text-gray-300 text-sm">
                We communicate openly with affected users and provide regular updates throughout the resolution process.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Security Team */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Questions About Security?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Our security team is available to address any concerns or questions about our security practices.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact?inquiry=security" className="bg-gold-500 hover:bg-gold-600 text-black px-8 py-4 rounded-lg font-bold text-lg transition-colors">
              Contact Security Team
            </Link>
            <a href="mailto:security@signalcartel.com" className="border border-gold-400 text-gold-400 hover:bg-gold-400 hover:text-black px-8 py-4 rounded-lg font-bold text-lg transition-colors">
              security@signalcartel.com
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