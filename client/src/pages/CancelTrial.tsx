import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import TopNav from '@/components/TopNav';
import BottomNavigation from '@/components/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, AlertTriangle, CheckCircle, CreditCard, Smartphone, ArrowLeft, Sparkles, Target, MessageCircle, TrendingUp, Lock, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SubscriptionStatus {
  isPremium: boolean;
  subscriptionStatus: string | null;
  isOnFreeTrial: boolean;
  trialDaysLeft: number;
  trialEndsAt: string | null;
  hasStartedTrial: boolean;
  hasActiveSubscription: boolean;
  subscriptionSource: 'stripe' | 'apple' | 'none';
  hasStripeSubscription: boolean;
  hasAppleSubscription: boolean;
  isCancelled: boolean;
}

export default function CancelTrial() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  // Detect if running in mobile app WebView
  const isMobileApp = typeof window !== 'undefined' && (
    localStorage.getItem('isMobileApp') === 'true' || 
    sessionStorage.getItem('isMobileApp') === 'true' ||
    (window as any).isMobileApp === true ||
    (window as any).ReactNativeWebView !== undefined
  );

  const { data: userData, isLoading: userLoading } = useQuery<any>({
    queryKey: ['/api/users/profile']
  });

  const { data: subscriptionStatus, isLoading: statusLoading } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription/status']
  });

  const user = userData;

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/cancel-subscription');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel subscription');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Subscription Cancelled",
        description: data.message,
        duration: 5000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
      setShowCancelConfirm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (userLoading || statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isOnTrial = subscriptionStatus?.isOnFreeTrial;
  const hasActiveSubscription = subscriptionStatus?.hasActiveSubscription;
  const subscriptionSource = subscriptionStatus?.subscriptionSource || 'none';
  const isCancelled = subscriptionStatus?.isCancelled;
  const isPaidPremium = hasActiveSubscription && !isOnTrial;

  return (
    <div className="min-h-screen bg-white">
      <TopNav title="Manage Subscription" />
      
      <main className="max-w-2xl mx-auto px-4 py-8 pb-24">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/')}
          className="mb-6 text-gray-600 hover:text-gray-800"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Current Status */}
        <Card className="mb-6 border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl text-black">Your Subscription Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isOnTrial && !isCancelled && (
                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-700" />
                    <div>
                      <p className="font-medium text-blue-900">Free Trial Active</p>
                      <p className="text-sm text-emerald-800">
                        {subscriptionStatus?.trialDaysLeft} days remaining
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isPaidPremium && !isCancelled && (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Premium Subscription Active</p>
                      <p className="text-sm text-green-700">
                        {subscriptionSource === 'apple' ? 'Subscribed via Apple' : 'Subscribed via Web (Stripe)'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isCancelled && (
                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-900">Subscription Cancelled</p>
                      <p className="text-sm text-yellow-700">
                        Access continues until your current period ends
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!hasActiveSubscription && !isCancelled && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">Free Account</p>
                      <p className="text-sm text-gray-600">
                        Upgrade to unlock AI coaching and premium features
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upgrade Options - Show for free users */}
        {!hasActiveSubscription && !isCancelled && (
          <Card className="mb-6 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
            <CardHeader>
              <CardTitle className="text-xl text-emerald-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Upgrade Your Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Plus Tier */}
              <div className="p-4 bg-white rounded-lg border border-emerald-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-100 text-emerald-800 font-semibold">Plus</Badge>
                    <span className="font-medium text-gray-900">$5.99/month</span>
                    <span className="text-sm text-gray-500">or $49/year</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>AI Financial Interview</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>AI-Generated Budget</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Target className="w-4 h-4 text-emerald-600" />
                    <span>30-Day Money Reset</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>20 AI Messages/month</span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-emerald-700 to-emerald-500 hover:from-emerald-800 hover:to-emerald-700 text-white"
                  onClick={() => setLocation('/pricing')}
                >
                  Upgrade to Plus
                </Button>
              </div>

              {/* Pro Tier */}
              <div className="p-4 bg-white rounded-lg border-2 border-emerald-400 relative">
                <div className="absolute -top-3 left-4">
                  <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                    <Crown className="w-3 h-3 mr-1" />
                    Best Value
                  </Badge>
                </div>
                <div className="flex items-center justify-between mb-3 mt-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-600 text-white font-semibold">Pro</Badge>
                    <span className="font-medium text-gray-900">$9.99/month</span>
                    <span className="text-sm text-gray-500">or $89/year</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Everything in Plus</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>Unlimited AI Coaching</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Advanced Insights</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Priority Support</span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                  onClick={() => setLocation('/pricing')}
                >
                  Upgrade to Pro
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mobile App Notice - Show when in WebView */}
        {isMobileApp && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Smartphone className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <p className="font-medium text-blue-900">Mobile App Subscription</p>
                  <p className="text-sm text-blue-700 mt-1">
                    To manage your subscription, go to your iPhone/iPad Settings → Your Name → Subscriptions → Mind My Money.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cancel Options - show if user has active subscription and not already cancelled */}
        {/* Hide Stripe cancellation UI when in mobile app */}
        {hasActiveSubscription && !isCancelled && !isMobileApp && (
          <Card className="border-red-200 web-subscription-only">
            <CardHeader>
              <CardTitle className="text-xl text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Cancel Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {subscriptionSource === 'apple' ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <Smartphone className="w-6 h-6 text-gray-600 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Apple Subscription</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Your subscription was purchased through the App Store. To cancel, you'll need to manage it through Apple:
                      </p>
                      <ol className="text-sm text-gray-600 mt-3 space-y-2 list-decimal list-inside">
                        <li>Open the <strong>Settings</strong> app on your iPhone</li>
                        <li>Tap your name at the top</li>
                        <li>Tap <strong>Subscriptions</strong></li>
                        <li>Find <strong>Mind My Money</strong> and tap it</li>
                        <li>Tap <strong>Cancel Subscription</strong></li>
                      </ol>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setLocation('/')}
                    className="w-full"
                  >
                    Back to Dashboard
                  </Button>
                </div>
              ) : (
                <>
                  {!showCancelConfirm ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                        <CreditCard className="w-6 h-6 text-gray-600 mt-1" />
                        <div>
                          <p className="font-medium text-gray-900">Web Subscription</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {isOnTrial 
                              ? "Cancel your free trial. You won't be charged when the trial ends."
                              : "Cancel your subscription. You'll continue to have access until your current billing period ends."
                            }
                          </p>
                        </div>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                          <strong>Before you cancel:</strong> You'll lose access to AI coaching, spending analytics, budget tracking, and all premium features.
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <Button 
                          variant="outline"
                          onClick={() => setLocation('/')}
                          className="flex-1"
                        >
                          Keep Subscription
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={() => setShowCancelConfirm(true)}
                          className="flex-1"
                          data-testid="button-cancel-subscription"
                        >
                          {isOnTrial ? 'Cancel Trial' : 'Cancel Subscription'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="font-medium text-red-900 mb-2">Are you sure?</p>
                        <p className="text-sm text-red-700">
                          {isOnTrial 
                            ? "Your trial will be cancelled and you won't be charged."
                            : "Your subscription will be cancelled at the end of your current billing period."
                          }
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <Button 
                          variant="outline"
                          onClick={() => setShowCancelConfirm(false)}
                          className="flex-1"
                          disabled={cancelMutation.isPending}
                        >
                          Go Back
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={() => cancelMutation.mutate()}
                          disabled={cancelMutation.isPending}
                          className="flex-1"
                          data-testid="button-confirm-cancel"
                        >
                          {cancelMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Cancelling...
                            </>
                          ) : (
                            'Yes, Cancel'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Help */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? <a href="/feedback" className="text-emerald-700 hover:underline">Contact support</a>
          </p>
        </div>
      </main>
      
      <BottomNavigation user={user} />
    </div>
  );
}
