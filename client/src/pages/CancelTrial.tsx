import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import TopNav from '@/components/TopNav';
import BottomNavigation from '@/components/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Loader2, AlertTriangle, CheckCircle, CreditCard, Smartphone,
  ArrowLeft, Sparkles, Target, MessageCircle, TrendingUp, Crown, ChevronDown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SubscriptionStatus {
  tier: 'free' | 'plus' | 'pro';
  tierDisplayName: string;
  isPremium: boolean;
  subscriptionStatus: string | null;
  isOnFreeTrial?: boolean;
  trialDaysLeft?: number;
  trialEndsAt?: string | null;
  hasStartedTrial?: boolean;
  hasActiveSubscription: boolean;
  subscriptionSource: 'stripe' | 'apple' | 'none';
  hasStripeSubscription: boolean;
  hasAppleSubscription: boolean;
  isCancelled: boolean;
  subscriptionPeriod?: string | null;
  billingStatusVerified?: boolean;
  billingNeedsAttention?: boolean;
  canManageBilling?: boolean;
  canRestartSubscription?: boolean;
  canResumeSubscription?: boolean;
  stripeStatus?: string | null;
  isPaused?: boolean;
}

export default function CancelTrial() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);
  const [nativePurchaseNotice, setNativePurchaseNotice] = useState('');

  const isMobileApp = typeof window !== 'undefined' && (
    localStorage.getItem('isMobileApp') === 'true' ||
    sessionStorage.getItem('isMobileApp') === 'true' ||
    (window as any).isMobileApp === true ||
    (window as any).ReactNativeWebView !== undefined
  );

  const { data: userData, isLoading: userLoading } = useQuery<any>({
    queryKey: ['/api/users/profile']
  });

  const { data: subscriptionStatus, dataUpdatedAt: statusUpdatedAt, isLoading: statusLoading, isError: statusError, refetch: refetchStatus } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription/status'],
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const user = userData;

  useEffect(() => {
    if (statusUpdatedAt) {
      // The status endpoint reconciles access after returning from Stripe.
      void queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
    }
  }, [statusUpdatedAt, queryClient]);

  useEffect(() => {
    const onFocus = () => { void refetchStatus(); };
    window.addEventListener('focus', onFocus);
    if (new URLSearchParams(window.location.search).get('billing') === 'returned') {
      void refetchStatus();
    }
    return () => window.removeEventListener('focus', onFocus);
  }, [refetchStatus]);

  const portalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/subscription/billing-portal', {});
      return response.json();
    },
    onSuccess: (data) => {
      if (data?.url) window.location.assign(data.url);
      else toast({ title: 'Billing portal unavailable', description: 'Please try again in a moment.', variant: 'destructive' });
    },
    onError: (error: any) => toast({ title: 'Could not open billing', description: error.message || 'Please try again.', variant: 'destructive' }),
  });

  const resumeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/subscription/resume', {});
      const result = await response.json();
      if (result?.success === false) throw new Error(result.error || 'Could not resume subscription');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
      toast({ title: 'Resume requested', description: 'Checking payment and access. You may still need to settle an outstanding invoice in Manage billing.' });
    },
    onError: (error: any) => toast({ title: 'Could not resume subscription', description: error.message || 'Please try again.', variant: 'destructive' }),
  });

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
      toast({ title: 'Subscription Cancelled', description: data.message, duration: 5000 });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
      setShowCancelConfirm(false);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to cancel subscription.', variant: 'destructive' });
    },
  });

  const downgradeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/subscription/downgrade');
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to downgrade');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Plan Changed', description: data.message, duration: 5000 });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
      setShowDowngradeConfirm(false);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to downgrade.', variant: 'destructive' });
    },
  });

  if (statusLoading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const tier = subscriptionStatus?.tier || 'free';
  const tierDisplayName = subscriptionStatus?.tierDisplayName || 'Basic';
  const isOnTrial = subscriptionStatus?.isOnFreeTrial;
  const hasActiveSubscription = subscriptionStatus?.hasActiveSubscription;
  const subscriptionSource = subscriptionStatus?.subscriptionSource || 'none';
  const isCancelled = subscriptionStatus?.isCancelled;
  const isPaidPremium = hasActiveSubscription && !isOnTrial;
  const hasStripeSubscription = !!subscriptionStatus?.hasStripeSubscription;
  const needsAttention = !!subscriptionStatus?.billingNeedsAttention;
  const canManageStripeBilling = subscriptionSource === 'stripe' && hasStripeSubscription && !!subscriptionStatus?.canManageBilling;
  const hasScheduledCancellation = !!isCancelled && (!!hasActiveSubscription || !!subscriptionStatus?.canResumeSubscription);
  const hasEnded = !!isCancelled && !hasStripeSubscription && !hasActiveSubscription;
  const billingVerified = !statusError && subscriptionStatus?.billingStatusVerified === true;

  const startOrRestartPlan = () => {
    if (!billingVerified || subscriptionStatus?.canRestartSubscription !== true) {
      setNativePurchaseNotice('Refresh your subscription status before starting another plan.');
      return;
    }
    if (isMobileApp) {
      const bridge = (window as any).ReactNativeWebView;
      if (bridge?.postMessage) {
        bridge.postMessage(JSON.stringify({ type: 'SHOW_PAYWALL' }));
      } else {
        setNativePurchaseNotice('The purchase screen is not available right now. Please reopen the app and try again.');
      }
      return;
    }
    setLocation('/pricing');
  };
  const billingPeriod = subscriptionStatus?.subscriptionPeriod;

  const tierColor = tier === 'pro'
    ? 'from-violet-600 to-indigo-600'
    : tier === 'plus'
    ? 'from-emerald-600 to-teal-600'
    : 'from-gray-400 to-gray-500';

  const tierBadgeClass = tier === 'pro'
    ? 'bg-violet-100 text-violet-800'
    : tier === 'plus'
    ? 'bg-emerald-100 text-emerald-800'
    : 'bg-gray-100 text-gray-600';

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
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

        {statusError && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="font-semibold text-red-900">We couldn’t check your subscription.</p>
              <p className="mt-1 text-sm text-red-800">Your plan details haven’t been verified. Retry before making a billing change.</p>
              <Button className="mt-4" variant="outline" onClick={() => refetchStatus()}>Retry subscription check</Button>
            </CardContent>
          </Card>
        )}
        {!statusError && !billingVerified && (
          <Card className="mb-6 border-amber-300 bg-amber-50">
            <CardContent className="pt-6">
              <p className="font-semibold text-amber-950">Subscription status is still being verified.</p>
              <p className="mt-1 text-sm text-amber-900">We won’t label this account as free or start a new plan until the check completes.</p>
              <Button className="mt-4" variant="outline" onClick={() => refetchStatus()}>Retry subscription check</Button>
            </CardContent>
          </Card>
        )}

        {billingVerified && <>
        {needsAttention && (
          <Card className="mb-6 border-amber-300 bg-amber-50">
            <CardContent className="pt-6">
              <p className="font-semibold text-amber-950">{subscriptionStatus?.isPaused ? 'Subscription paused' : 'Payment needs attention'}</p>
              <p className="mt-1 text-sm text-amber-900">Your existing subscription is still on file. Update your card and pay any outstanding invoices in billing. If your plan is paused, you can then resume it here.</p>
              {canManageStripeBilling && <Button className="mt-4" onClick={() => portalMutation.mutate()} disabled={portalMutation.isPending}>
                {portalMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Opening billing…</> : 'Update payment method'}
              </Button>}
              {subscriptionSource === 'apple' && <a className="mt-4 inline-flex text-sm font-medium text-amber-950 underline" href="https://apps.apple.com/account/subscriptions">Manage subscriptions with Apple</a>}
              {subscriptionStatus?.isPaused && subscriptionStatus?.canResumeSubscription && (
                <Button variant="outline" className="mt-4 ml-2" onClick={() => {
                  if (window.confirm('Resume your subscription? Billing may restart immediately and your saved payment method may be charged.')) resumeMutation.mutate();
                }} disabled={resumeMutation.isPending || portalMutation.isPending}>
                  {resumeMutation.isPending ? 'Resuming…' : 'Resume subscription'}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
        {nativePurchaseNotice && <Card className="mb-6 border-amber-300 bg-amber-50"><CardContent className="pt-5 text-sm text-amber-950" role="alert">{nativePurchaseNotice}</CardContent></Card>}

        {!statusError && !needsAttention && subscriptionStatus?.isPaused && (
          <Card className="mb-6 border-amber-300 bg-amber-50">
            <CardContent className="pt-6">
              <p className="font-semibold text-amber-950">Subscription paused</p>
              <p className="mt-1 text-sm text-amber-900">Your plan is paused. Resume it when you’re ready to continue.</p>
              {subscriptionStatus.canResumeSubscription && <Button className="mt-4" onClick={() => {
                if (window.confirm('Resume your subscription? Billing may restart immediately and your saved payment method may be charged.')) resumeMutation.mutate();
              }} disabled={resumeMutation.isPending}>
                {resumeMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Resuming…</> : 'Resume subscription'}
              </Button>}
            </CardContent>
          </Card>
        )}

        {/* Current Plan Card */}
        <Card className="mb-6 border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl">Your Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">

              {/* Active paid subscription */}
              {isPaidPremium && !isCancelled && (
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${tierColor} flex items-center justify-center`}>
                      {tier === 'pro' ? <Crown className="w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5 text-white" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{tierDisplayName} Plan</p>
                        <Badge className={tierBadgeClass}>{tierDisplayName}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {subscriptionSource === 'apple' ? 'Subscribed via Apple' : `${billingPeriod === 'annual' ? 'Annual' : 'Monthly'} billing via Stripe`}
                      </p>
                    </div>
                  </div>
                  <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                </div>
              )}

              {/* Active trial */}
              {isOnTrial && !isCancelled && (
                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-700" />
                    <div>
                      <p className="font-medium text-blue-900">Free Trial Active</p>
                      <p className="text-sm text-emerald-800">{subscriptionStatus?.trialDaysLeft} days remaining</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cancelled */}
              {hasScheduledCancellation && (
                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-900">Cancellation scheduled</p>
                      <p className="text-sm text-yellow-700">Your access continues through the current period. You can resume before it ends.</p>
                    </div>
                  </div>
                  {subscriptionStatus?.canResumeSubscription && <Button size="sm" variant="outline" onClick={() => {
                    if (window.confirm('Resume your subscription now?')) resumeMutation.mutate();
                  }} disabled={resumeMutation.isPending}>{resumeMutation.isPending ? 'Resuming…' : 'Resume'}</Button>}
                </div>
              )}

              {/* No active subscription */}
              {hasEnded && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">Subscription ended</p>
                      <p className="text-sm text-gray-600">Your plan has ended. You can start again whenever you’re ready.</p>
                    </div>
                  </div>
                  <Button className="ml-3" onClick={startOrRestartPlan}>Restart subscription</Button>
                </div>
              )}
              {!hasActiveSubscription && !isCancelled && !needsAttention && subscriptionStatus?.billingStatusVerified !== false && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">Free Account</p>
                      <p className="text-sm text-gray-600">Upgrade to unlock AI coaching and premium features</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upgrade Options - free users only */}
        {subscriptionStatus?.canRestartSubscription === true && !hasActiveSubscription && !hasStripeSubscription && !needsAttention && (!isCancelled || hasEnded) && (
          <Card className="mb-6 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
            <CardHeader>
              <CardTitle className="text-xl text-emerald-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Upgrade Your Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-white rounded-lg border border-emerald-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-100 text-emerald-800 font-semibold">Plus</Badge>
                    <span className="font-medium text-gray-900">$5.99/month</span>
                    <span className="text-sm text-gray-500">or $49/year</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[['Sparkles','AI Financial Interview'],['TrendingUp','AI-Generated Budget'],['Target','30-Day Money Reset'],['MessageCircle','20 AI Messages/month']].map(([, label], i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <Button className="w-full bg-gradient-to-r from-emerald-700 to-emerald-500 text-white" onClick={startOrRestartPlan}>
                  Upgrade to Plus
                </Button>
              </div>

              <div className="p-4 bg-white rounded-lg border-2 border-violet-300 relative">
                <div className="absolute -top-3 left-4">
                  <Badge className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                    <Crown className="w-3 h-3 mr-1" />Best Value
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mb-3 mt-2">
                  <Badge className="bg-violet-100 text-violet-800 font-semibold">Pro</Badge>
                  <span className="font-medium text-gray-900">$9.99/month</span>
                  <span className="text-sm text-gray-500">or $89/year</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {['Everything in Plus','Unlimited AI Coaching','Advanced Insights','Priority Support'].map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-violet-600" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white" onClick={startOrRestartPlan}>
                  Upgrade to Pro
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mobile App Notice */}
        {subscriptionSource === 'apple' && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Smartphone className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <p className="font-medium text-blue-900">Mobile App Subscription</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Apple handles this subscription. Manage or cancel it from your Apple account.
                  </p>
                  <a className="mt-3 inline-block text-sm font-semibold text-blue-800 underline" href="https://apps.apple.com/account/subscriptions">Open Apple subscriptions</a>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {canManageStripeBilling && (
          <Card className="mb-6 border-emerald-200">
            <CardHeader><CardTitle className="text-lg">Billing & payment</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">Update your payment method, view invoices, or manage billing securely with Stripe.</p>
              <Button className="w-full" onClick={() => portalMutation.mutate()} disabled={portalMutation.isPending}>
                {portalMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Opening billing…</> : needsAttention ? 'Update payment method' : 'Manage billing'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Downgrade: Pro → Plus (Stripe web only) */}
        {tier === 'pro' && isPaidPremium && !isCancelled && subscriptionSource === 'stripe' && !isMobileApp && (
          <Card className="mb-6 border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="text-lg text-amber-900 flex items-center gap-2">
                <ChevronDown className="w-5 h-5" />
                Switch to Plus
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!showDowngradeConfirm ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Downgrade from Pro to Plus ($5.99/month or $49/year). You'll keep access to AI coaching with a 20-message monthly limit. Advanced insights will no longer be available.
                  </p>
                  <div className="bg-white rounded-lg p-3 border border-amber-200">
                    <p className="text-xs text-amber-800 font-medium">What you'll lose:</p>
                    <ul className="text-xs text-gray-600 mt-1 space-y-1">
                      <li>• Unlimited AI coach messages (limited to 20/month on Plus)</li>
                      <li>• Financial Health Report</li>
                      <li>• Advanced AI Insights</li>
                    </ul>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setLocation('/')} className="flex-1">Keep Pro</Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-amber-400 text-amber-800 hover:bg-amber-100"
                      onClick={() => setShowDowngradeConfirm(true)}
                    >
                      Downgrade to Plus
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-100 border border-amber-300 rounded-lg">
                    <p className="font-medium text-amber-900 mb-1">Confirm downgrade to Plus?</p>
                    <p className="text-sm text-amber-700">
                      Your plan will switch immediately with a prorated credit applied to your account.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowDowngradeConfirm(false)} className="flex-1" disabled={downgradeMutation.isPending}>
                      Go Back
                    </Button>
                    <Button
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                      onClick={() => downgradeMutation.mutate()}
                      disabled={downgradeMutation.isPending}
                    >
                      {downgradeMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                      ) : 'Yes, Switch to Plus'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Cancel Options */}
        {hasActiveSubscription && !isCancelled && !needsAttention && !isMobileApp && (
          <Card className="border-red-200">
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
                      <p className="text-sm text-gray-600 mt-1">Your subscription was purchased through the App Store. To cancel:</p>
                      <ol className="text-sm text-gray-600 mt-3 space-y-2 list-decimal list-inside">
                        <li>Open <strong>Settings</strong> on your iPhone</li>
                        <li>Tap your name → <strong>Subscriptions</strong></li>
                        <li>Find <strong>Mind My Money</strong> and tap <strong>Cancel Subscription</strong></li>
                      </ol>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setLocation('/')} className="w-full">Back to Dashboard</Button>
                </div>
              ) : (
                <>
                  {!showCancelConfirm ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                        <CreditCard className="w-6 h-6 text-gray-600 mt-1" />
                        <div>
                          <p className="font-medium text-gray-900">Cancel {tierDisplayName} Plan</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {isOnTrial
                              ? "Cancel your free trial. You won't be charged when the trial ends."
                              : "Your subscription will be cancelled at the end of your current billing period."}
                          </p>
                        </div>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                          <strong>Before you cancel:</strong> You'll lose access to AI coaching, analytics, budget tracking, and all premium features.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setLocation('/')} className="flex-1">Keep Subscription</Button>
                        <Button variant="destructive" onClick={() => setShowCancelConfirm(true)} className="flex-1" data-testid="button-cancel-subscription">
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
                            : "Your subscription will be cancelled at the end of your current billing period."}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setShowCancelConfirm(false)} className="flex-1" disabled={cancelMutation.isPending}>Go Back</Button>
                        <Button variant="destructive" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending} className="flex-1" data-testid="button-confirm-cancel">
                          {cancelMutation.isPending ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Cancelling...</>
                          ) : 'Yes, Cancel'}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        </>}
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
