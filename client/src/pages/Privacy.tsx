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
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-lg flex items-center justify-center mr-4">
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
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">Limited Sharing</h3>
                  <p className="text-gray-600 mb-3">We only share your information in these specific circumstances:</p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                    <li><strong>Service Providers:</strong> Trusted partners who help us operate the app (like Plaid for bank connections)</li>
                    <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and users</li>
                    <li><strong>With Your Consent:</strong> When you explicitly authorize us to share specific information</li>
                    <li><strong>Anonymized Data:</strong> Aggregated, non-identifiable data for research and app improvement</li>
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