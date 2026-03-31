import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChessCrownLogo } from '@/components/Logo';
import { ArrowLeft, FileText, CreditCard, AlertCircle, RefreshCw, Scale, Mail } from 'lucide-react';

export default function Terms() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-primary/8 to-primary/10">
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-4 rounded-2xl">
              <FileText className="w-10 h-10 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3">Terms of Use</h1>
          <p className="text-gray-500 text-base sm:text-lg">Last updated: March 2026</p>
        </div>

        <div className="space-y-6">
          <Card className="border-primary/10 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-lg mt-1 shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
                  <p className="text-gray-600 leading-relaxed">
                    By downloading, installing, or using the Mind My Money application ("App") or website at
                    mindmymoneyapp.com ("Service"), you agree to be bound by these Terms of Use ("Terms").
                    If you do not agree to these Terms, do not use the Service. These Terms apply to all users,
                    including visitors, registered users, and subscribers.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-lg mt-1 shrink-0">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Subscriptions and Billing</h2>
                  <p className="text-gray-600 leading-relaxed mb-3">
                    Mind My Money offers three subscription tiers:
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2 mb-3">
                    <li><strong>Basic (Free):</strong> Access to core features including bank connection and basic financial overview.</li>
                    <li><strong>Plus:</strong> $5.99/month or $49/year. Includes AI coaching (20 messages/month), AI-generated budgets, 30-Day Money Reset Challenge, and daily check-ins.</li>
                    <li><strong>Pro:</strong> $9.99/month or $89/year. Includes unlimited AI messaging and advanced insights.</li>
                  </ul>
                  <p className="text-gray-600 leading-relaxed mb-2">
                    Subscriptions purchased through the Apple App Store are subject to Apple's payment terms.
                    Subscriptions purchased on the web are processed by Stripe. All prices are in USD.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    Subscriptions automatically renew unless cancelled at least 24 hours before the end of the
                    current billing period. You can manage or cancel your subscription at any time through your
                    Apple ID account settings (for App Store purchases) or through your account settings on the website.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-lg mt-1 shrink-0">
                  <RefreshCw className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Cancellations and Refunds</h2>
                  <p className="text-gray-600 leading-relaxed mb-2">
                    You may cancel your subscription at any time. Cancellation takes effect at the end of the
                    current billing period — you will retain access to paid features until that date.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    For App Store purchases, refund requests must be submitted to Apple. For web purchases,
                    please contact us at support@mindmymoneyapp.com. Refunds are issued at our discretion
                    and in accordance with applicable law.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-lg mt-1 shrink-0">
                  <AlertCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Disclaimer of Financial Advice</h2>
                  <p className="text-gray-600 leading-relaxed">
                    Mind My Money provides general financial information and AI-powered coaching for educational
                    purposes only. The content provided through the Service does not constitute professional
                    financial, investment, legal, or tax advice. Always consult a qualified financial professional
                    before making significant financial decisions. We are not responsible for any financial decisions
                    made based on information provided through the Service.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-lg mt-1 shrink-0">
                  <Scale className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Acceptable Use</h2>
                  <p className="text-gray-600 leading-relaxed mb-3">You agree not to:</p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>Use the Service for any unlawful purpose or in violation of these Terms</li>
                    <li>Attempt to gain unauthorized access to any part of the Service</li>
                    <li>Reverse engineer, decompile, or disassemble any part of the App</li>
                    <li>Use the Service to transmit harmful, offensive, or fraudulent content</li>
                    <li>Share your account credentials with others</li>
                    <li>Use automated means to access the Service without our prior written consent</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-lg mt-1 shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Intellectual Property</h2>
                  <p className="text-gray-600 leading-relaxed">
                    All content, features, and functionality of the Service — including but not limited to text,
                    graphics, logos, and software — are owned by Mind My Money and protected by applicable
                    intellectual property laws. You may not copy, modify, distribute, or create derivative works
                    without our express written permission.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-lg mt-1 shrink-0">
                  <AlertCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Limitation of Liability</h2>
                  <p className="text-gray-600 leading-relaxed">
                    To the maximum extent permitted by law, Mind My Money shall not be liable for any indirect,
                    incidental, special, consequential, or punitive damages arising from your use of the Service.
                    Our total liability to you for any claim arising from these Terms or the Service shall not
                    exceed the amount you paid us in the 12 months preceding the claim.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-lg mt-1 shrink-0">
                  <Scale className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Governing Law</h2>
                  <p className="text-gray-600 leading-relaxed">
                    These Terms are governed by and construed in accordance with the laws of the United States.
                    Any disputes arising from these Terms or your use of the Service shall be resolved through
                    binding arbitration, except where prohibited by law.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-lg mt-1 shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Changes to These Terms</h2>
                  <p className="text-gray-600 leading-relaxed">
                    We may update these Terms from time to time. When we do, we will update the "Last updated"
                    date at the top of this page and notify active users by email where required. Continued use
                    of the Service after changes constitutes acceptance of the revised Terms.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-lg mt-1 shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contact Us</h2>
                  <p className="text-gray-600 leading-relaxed">
                    If you have questions about these Terms, please contact us at:
                  </p>
                  <p className="text-primary font-medium mt-2">support@mindmymoneyapp.com</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
