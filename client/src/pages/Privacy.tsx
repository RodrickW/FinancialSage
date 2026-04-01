import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChessCrownLogo } from '@/components/Logo';
import { ArrowLeft, Shield, Lock, Eye, UserCheck, Database, Globe } from 'lucide-react';

export default function Privacy() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-primary/8 to-primary/10">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-primary/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <ChessCrownLogo className="w-8 h-8" color="text-primary" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Mind My Money
              </span>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setLocation('/')}
              className="border-primary/20 text-primary hover:bg-primary/5"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your privacy and security are our top priorities. Learn how we protect and handle your financial data.
          </p>
          <p className="text-sm text-gray-500">
            Last updated: January 2024
          </p>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Information We Collect */}
          <Card className="border-primary/20">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg flex items-center justify-center mr-4">
                  <Database className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Information We Collect</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">Financial Information</h3>
                  <p className="text-gray-600 mb-3">
                    When you connect your bank accounts and financial institutions through our secure Plaid integration, we collect:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                    <li>Account balances and transaction history</li>
                    <li>Account types and institution names</li>
                    <li>Transaction categories and merchant information</li>
                    <li>Credit score data (Premium plan only)</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">Personal Information</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                    <li>Name, email address, and contact information</li>
                    <li>Account preferences and settings</li>
                    <li>Financial goals and budget preferences</li>
                    <li>Usage data and app interactions</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">Technical Information</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                    <li>Device information and IP address</li>
                    <li>Browser type and operating system</li>
                    <li>App usage analytics and performance data</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Your Information */}
          <Card className="border-primary/20">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg flex items-center justify-center mr-4">
                  <UserCheck className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">How We Use Your Information</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Provide AI-Powered Financial Coaching</h3>
                    <p className="text-gray-600">Analyze your spending patterns and provide personalized recommendations through Money Mind AI.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Track Financial Goals</h3>
                    <p className="text-gray-600">Monitor your progress toward savings goals, budgets, and financial milestones.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Generate Insights and Analytics</h3>
                    <p className="text-gray-600">Create spending reports, budget recommendations, and financial health assessments.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Improve Our Services</h3>
                    <p className="text-gray-600">Enhance app functionality, develop new features, and improve user experience.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Communicate with You</h3>
                    <p className="text-gray-600">Send account updates, security notifications, and important service announcements.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card className="border-primary/20">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-100 to-emerald-100 rounded-lg flex items-center justify-center mr-4">
                  <Lock className="w-6 h-6 text-cyan-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Data Security & Protection</h2>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6 rounded-lg border border-primary/20">
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">Bank-Level Encryption</h3>
                  <p className="text-gray-600">
                    All your financial data is protected with 256-bit SSL encryption, the same security standard used by major banks and financial institutions.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">Secure Data Storage</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                    <li>Data stored in SOC 2 Type II compliant data centers</li>
                    <li>Regular security audits and vulnerability assessments</li>
                    <li>Multi-factor authentication for account access</li>
                    <li>Automated threat detection and monitoring</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">Plaid Integration</h3>
                  <p className="text-gray-600">
                    We use Plaid, a trusted and regulated financial technology company, to securely connect to your bank accounts. 
                    Plaid is used by thousands of financial apps and maintains the highest security standards.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Data Sharing */}
          <Card className="border-emerald-300 bg-emerald-50/50">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center mr-4">
                  <Globe className="w-6 h-6 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">AI Coaching & Third-Party AI Service</h2>
              </div>

              <div className="space-y-5">
                <div className="bg-white p-5 rounded-lg border border-emerald-200">
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">Who processes your data</h3>
                  <p className="text-gray-600">
                    Our Money Mind AI Coach feature is powered by <strong>OpenAI, LLC</strong> (openai.com), a third-party artificial intelligence service. When you use the AI Coach, a summary of your financial information is sent to OpenAI's servers to generate personalized coaching advice.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-lg border border-emerald-200">
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">What data is sent to OpenAI</h3>
                  <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-2">
                    <li>Account balances and account types (e.g., checking, savings)</li>
                    <li>Spending totals broken down by category (e.g., groceries, dining, transport)</li>
                    <li>Budget amounts and how much of each budget has been used</li>
                    <li>Savings goal names and progress amounts</li>
                    <li>Your first name (for personalized responses)</li>
                    <li>Questions you type into the AI chat</li>
                  </ul>
                  <p className="text-gray-500 text-sm mt-3">
                    <strong>We never send:</strong> your bank credentials, full account numbers, Social Security Number, or any government-issued ID.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-lg border border-emerald-200">
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">How OpenAI uses this data</h3>
                  <p className="text-gray-600">
                    OpenAI uses your data solely to generate the AI coaching response you requested. Per OpenAI's API data usage policy, data submitted via the API is <strong>not used to train OpenAI's models</strong> and is not retained beyond the processing of your request. You can review OpenAI's privacy policy at <a href="https://openai.com/policies/privacy-policy" className="text-emerald-600 underline" target="_blank" rel="noopener noreferrer">openai.com/policies/privacy-policy</a>.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-lg border border-emerald-200">
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">Your consent</h3>
                  <p className="text-gray-600">
                    Before your data is sent to OpenAI for the first time, the app displays a clear disclosure dialog that explains what data will be shared and with whom. You must explicitly agree before any data is transmitted. You can decline at any time — this only affects the AI coaching feature; all other app features remain fully available.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Sharing */}
          <Card className="border-primary/20">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center mr-4">
                  <Globe className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Data Sharing & Third Parties</h2>
              </div>
              
              <div className="space-y-6">
                <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                  <h3 className="text-lg font-semibold mb-3 text-red-800">We Never Sell Your Data</h3>
                  <p className="text-red-700">
                    Your financial information is never sold, rented, or shared with advertisers or marketing companies. Your privacy is not for sale.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">Third-Party Services We Use</h3>
                  <p className="text-gray-600 mb-3">We share data with these trusted service providers only as necessary to operate the app:</p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                    <li><strong>Plaid (plaid.com):</strong> Secure bank account connection and transaction data retrieval</li>
                    <li><strong>OpenAI (openai.com):</strong> AI-powered financial coaching — see the AI section above for full details</li>
                    <li><strong>Stripe (stripe.com):</strong> Payment processing for web subscriptions</li>
                    <li><strong>RevenueCat (revenuecat.com):</strong> Apple In-App Purchase management for the iOS app</li>
                    <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and users</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card className="border-primary/20">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-teal-100 rounded-lg flex items-center justify-center mr-4">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Your Privacy Rights</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">Access & Control</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>View all data we have about you</li>
                    <li>Download your financial data</li>
                    <li>Correct inaccurate information</li>
                    <li>Update your preferences anytime</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">Data Management</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Delete your account and data</li>
                    <li>Disconnect bank accounts anytime</li>
                    <li>Opt out of marketing communications</li>
                    <li>Request data portability</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Questions About Privacy?</h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                We're committed to transparency about how we handle your data. If you have any questions about this privacy policy or your data, please don't hesitate to contact us.
              </p>
              <div className="space-y-2">
                <p className="text-gray-700"><strong>Email:</strong> mindmymoney@gmail.com</p>
              </div>
              <div className="mt-6">
                <Button 
                  onClick={() => setLocation('/')}
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white"
                >
                  Return to Homepage
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}