import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CheckCircle, ArrowLeft, Loader2, Crown, Sparkles, Zap, AlertTriangle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionStatus {
  tier: 'free' | 'plus' | 'pro';
  isPremium: boolean;
  hasActiveSubscription: boolean;
  billingStatusVerified?: boolean;
  billingNeedsAttention?: boolean;
  canManageBilling?: boolean;
  canRestartSubscription?: boolean;
  subscriptionSource?: 'stripe' | 'apple' | 'none';
  hasStripeSubscription?: boolean;
}

export default function Pricing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAnnual, setIsAnnual] = useState(true);
  const [nativeNotice, setNativeNotice] = useState('');
  const [promoCode, setPromoCode] = useState('');
  
  const { data: subscriptionStatus, isLoading: statusLoading, isError: statusError, refetch: refetchStatus } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription/status'],
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/subscription/billing-portal', {});
      return response.json();
    },
    onSuccess: (data) => {
      if (data?.url) window.location.assign(data.url);
      else toast({ title: 'Billing portal unavailable', description: 'Please try again.', variant: 'destructive' });
    },
    onError: (error: any) => toast({ title: 'Could not open billing', description: error.message || 'Please try again.', variant: 'destructive' }),
  });
  
  const checkoutMutation = useMutation({
    mutationFn: async ({ tier, period }: { tier: 'plus' | 'pro', period: 'monthly' | 'annual' }) => {
      const response = await apiRequest('POST', '/api/subscription/checkout', {
        tier, period, ...(promoCode.trim() ? { promoCode: promoCode.trim().toUpperCase() } : {}),
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.mobile) {
        // Backend detected a mobile request — trigger native paywall
        if ((window as any).ReactNativeWebView) {
          (window as any).ReactNativeWebView.postMessage(
            JSON.stringify({ type: 'SHOW_PAYWALL' })
          );
        } else {
          setNativeNotice('Your app is preparing the purchase screen. Please return to the app or try again shortly.');
        }
        return;
      }
      if (data.requiresBillingRecovery && data.billingUrl) {
        window.location.assign(data.billingUrl);
        return;
      }
      if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout",
        variant: "destructive"
      });
    }
  });

  const isMobileApp =
    typeof window !== 'undefined' &&
    (localStorage.getItem('isMobileApp') === 'true' ||
      sessionStorage.getItem('isMobileApp') === 'true' ||
      (window as any).isMobileApp === true);

  const hasStripeSubscription = !!subscriptionStatus?.hasStripeSubscription;
  const hasActiveAppleSubscription = subscriptionStatus?.subscriptionSource === 'apple' && !!subscriptionStatus?.hasActiveSubscription;
  const existingStripeNeedsRecovery = hasStripeSubscription;
  const statusVerified = !statusError && subscriptionStatus?.billingStatusVerified === true;

  const handleSubscribe = (tier: 'plus' | 'pro') => {
    setNativeNotice('');
    if (statusLoading || !statusVerified) {
      setNativeNotice('Refresh your subscription status before starting another plan.');
      return;
    }
    if (hasStripeSubscription) {
      if (subscriptionStatus?.canManageBilling) portalMutation.mutate();
      return;
    }
    if (hasActiveAppleSubscription || subscriptionStatus?.canRestartSubscription !== true) return;
    // Check ReactNativeWebView directly — most reliable signal, always live regardless of render timing
    if ((window as any).ReactNativeWebView) {
      (window as any).ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'SHOW_PAYWALL' })
      );
      return;
    }
    if (isMobileApp) {
      // isMobileApp flag set but bridge not ready — don't fall through to Stripe
      setNativeNotice('The in-app purchase screen is not available right now. Please reopen the app and try again.');
      return;
    }
    checkoutMutation.mutate({ 
      tier, 
      period: isAnnual ? 'annual' : 'monthly' 
    });
  };

  const currentTier = subscriptionStatus?.tier || 'free';

  const plans = [
    {
      tier: 'free' as const,
      name: 'Basic',
      icon: Zap,
      description: 'Essential money tracking',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        'Bank account linking',
        'Spending snapshot',
        'Top categories view',
        'Daily check-in',
        'Basic dashboard'
      ]
    },
    {
      tier: 'plus' as const,
      name: 'Plus',
      icon: Sparkles,
      description: 'Transform your habits',
      monthlyPrice: 5.99,
      annualPrice: 49,
      popular: true,
      features: [
        'Everything in Basic',
        'AI Financial Interview',
        'AI-Generated Budget',
        '30-Day Money Reset',
        'Weekly AI Insights',
        'AI-Assisted Goals',
        '20 AI messages/month'
      ]
    },
    {
      tier: 'pro' as const,
      name: 'Pro',
      icon: Crown,
      description: 'Complete transformation',
      monthlyPrice: 9.99,
      annualPrice: 89,
      features: [
        'Everything in Plus',
        'Unlimited AI Coach',
        'Advanced Insights',
        'Goal Optimization',
        'Priority Support'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => setLocation('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {statusLoading && <div className="mb-6 rounded-xl border border-emerald-200 bg-white/80 p-4 text-sm text-gray-600" role="status">Checking your subscription…</div>}
        {statusError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-red-700" />
              <div className="flex-1">
                <p className="font-semibold text-red-900">We couldn’t verify your subscription.</p>
                <p className="mt-1 text-sm text-red-800">To avoid creating a duplicate plan, retry the check before subscribing.</p>
                <Button className="mt-3" variant="outline" onClick={() => refetchStatus()}>Retry subscription check</Button>
              </div>
            </div>
          </div>
        )}
        {!statusLoading && !statusError && subscriptionStatus?.billingStatusVerified === false && (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4">
            <p className="font-semibold text-amber-950">Your subscription is still being verified.</p>
            <p className="mt-1 text-sm text-amber-900">We’ll hold off on starting a new plan until we can confirm your current billing status.</p>
            <Button className="mt-3" variant="outline" onClick={() => refetchStatus()}>Retry subscription check</Button>
          </div>
        )}
        {!statusLoading && !statusError && (existingStripeNeedsRecovery || hasActiveAppleSubscription) && (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4">
            <p className="font-semibold text-amber-950">{subscriptionStatus?.billingNeedsAttention ? 'Payment needs attention' : 'You already have a subscription'}</p>
            <p className="mt-1 text-sm text-amber-900">
              {existingStripeNeedsRecovery
                ? 'Manage your existing Stripe subscription instead of starting another plan.'
                : 'Your plan is managed by Apple. Manage or review it through your Apple account.'}
            </p>
            {existingStripeNeedsRecovery && subscriptionStatus?.canManageBilling && (
              <Button className="mt-3" onClick={() => portalMutation.mutate()} disabled={portalMutation.isPending}>
                {portalMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Opening billing…</> : subscriptionStatus?.billingNeedsAttention ? 'Update payment method' : 'Manage billing'}
              </Button>
            )}
            {hasActiveAppleSubscription && <a className="mt-3 inline-block text-sm font-semibold text-amber-950 underline" href="https://apps.apple.com/account/subscriptions">Manage with Apple</a>}
          </div>
        )}
        {nativeNotice && <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950" role="alert">{nativeNotice}</div>}

        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-gray-600 mb-6">
            Start free, upgrade when you're ready to transform
          </p>
          
          <div className="flex items-center justify-center gap-3">
            <Label htmlFor="billing-toggle" className={!isAnnual ? 'font-semibold' : 'text-gray-500'}>
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
            />
            <Label htmlFor="billing-toggle" className={isAnnual ? 'font-semibold' : 'text-gray-500'}>
              Annual
            </Label>
            {isAnnual && (
              <Badge className="bg-green-100 text-green-700 ml-2">
                Save up to 30%
              </Badge>
            )}
          </div>
        </div>

        <div className="mx-auto mb-8 max-w-lg rounded-xl border bg-white p-4">
          <Label htmlFor="annual-promo">Annual subscription discount code</Label>
          <Input id="annual-promo" className="mt-2" value={promoCode}
            onChange={event => setPromoCode(event.target.value)} maxLength={40}
            autoCapitalize="characters" autoComplete="off" placeholder="Enter code"
            aria-describedby="promo-terms" />
          <p id="promo-terms" className="mt-2 text-sm text-gray-600">
            {promoCode.trim() ? <>Event offer: 50% off your first annual payment. Plus $24.50 for the first year,
            then $49/year; Pro $44.50 for the first year, then $89/year. Taxes may apply.
            Ends November 15, 2026 at 11:59 PM Central. Limited to 100 redemptions,
            one per billing customer. No stacking or unpaid-invoice discounts.
            Redeem in a web browser, not Apple in-app purchases. Your code and final
            total will be verified at checkout.</> : 'Have an event code? Enter it here before choosing an annual plan. Discounts are verified at checkout.'}
          </p>
          {!isAnnual && promoCode.trim() && (
            <p className="mt-2 text-sm text-amber-800" role="alert">Select Annual to use EVENT50.</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            const isCurrentPlan = currentTier === plan.tier;
            const canUpgrade = plan.tier !== 'free' && !isCurrentPlan && 
              (plan.tier === 'pro' || (plan.tier === 'plus' && currentTier === 'free'));
            
            return (
              <Card 
                key={plan.tier}
                className={`relative border-2 transition-all ${
                  plan.popular 
                    ? 'border-emerald-400 shadow-lg md:scale-105 z-10' 
                    : isCurrentPlan
                    ? 'border-blue-300 bg-blue-50/50'
                    : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      Current Plan
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-2">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                    <plan.icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <p className="text-sm text-gray-500">{plan.description}</p>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold">
                        {price === 0 ? 'Free' : `$${price}`}
                      </span>
                      {price > 0 && (
                        <span className="text-gray-500 ml-1">
                          /{isAnnual ? 'year' : 'month'}
                        </span>
                      )}
                    </div>
                    {isAnnual && plan.monthlyPrice > 0 && (
                      <p className="text-sm text-emerald-600 mt-1">
                        ${(plan.annualPrice / 12).toFixed(2)}/month
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.tier === 'free' ? (
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      disabled={isCurrentPlan}
                    >
                      {isCurrentPlan ? 'Current Plan' : 'Start Free'}
                    </Button>
                  ) : (
                    <Button
                      className={`w-full ${
                        plan.popular
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white'
                          : 'bg-gray-800 hover:bg-gray-900 text-white'
                      }`}
                      onClick={() => handleSubscribe(plan.tier)}
                      disabled={checkoutMutation.isPending || portalMutation.isPending || statusLoading || statusError || !statusVerified || isCurrentPlan || existingStripeNeedsRecovery || hasActiveAppleSubscription || subscriptionStatus?.canRestartSubscription === false}
                    >
                      {checkoutMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : existingStripeNeedsRecovery ? (
                        'Manage existing subscription'
                      ) : hasActiveAppleSubscription ? (
                        'Managed by Apple'
                      ) : isCurrentPlan ? (
                        'Current Plan'
                      ) : canUpgrade ? (
                        `Upgrade to ${plan.name}`
                      ) : (
                        `Get ${plan.name}`
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Secure payment powered by Stripe • Cancel anytime</p>
        </div>
      </div>
    </div>
  );
}
