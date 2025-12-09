import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import TopNav from '@/components/TopNav';
import BottomNavigation from '@/components/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, AlertTriangle, CheckCircle, CreditCard, Smartphone, ArrowLeft } from 'lucide-react';

export default function CancelTrial() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/users/profile']
  });

  const { data: subscriptionStatus, isLoading: statusLoading } = useQuery({
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
  const isPremium = user?.isPremium;
  const hasStripeSubscription = user?.stripeSubscriptionId;
  const hasAppleSubscription = user?.revenuecatUserId;
  const isCancelled = subscriptionStatus?.subscriptionStatus === 'cancelled';

  const getSubscriptionType = () => {
    if (hasAppleSubscription && !hasStripeSubscription) return 'apple';
    if (hasStripeSubscription) return 'stripe';
    return 'none';
  };

  const subscriptionType = getSubscriptionType();

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
              {isOnTrial && (
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">Free Trial Active</p>
                      <p className="text-sm text-blue-700">
                        {subscriptionStatus?.trialDaysLeft} days remaining
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isPremium && !isOnTrial && (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Premium Subscription Active</p>
                      <p className="text-sm text-green-700">
                        {subscriptionType === 'apple' ? 'Subscribed via Apple' : 'Subscribed via Web'}
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

              {!isOnTrial && !isPremium && !isCancelled && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">No Active Subscription</p>
                      <p className="text-sm text-gray-600">
                        Subscribe to access premium features
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cancel Options */}
        {(isOnTrial || isPremium) && !isCancelled && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-xl text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Cancel Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {subscriptionType === 'apple' ? (
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
                          Cancel Subscription
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
            Need help? <a href="/feedback" className="text-blue-600 hover:underline">Contact support</a>
          </p>
        </div>
      </main>
      
      <BottomNavigation user={user} />
    </div>
  );
}
