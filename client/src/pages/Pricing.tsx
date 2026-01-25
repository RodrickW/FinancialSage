import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CheckCircle, ArrowLeft, Loader2, Crown, Sparkles, Zap } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionStatus {
  tier: 'free' | 'plus' | 'pro';
  isPremium: boolean;
  hasActiveSubscription: boolean;
}

export default function Pricing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAnnual, setIsAnnual] = useState(true);
  
  const { data: subscriptionStatus } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription/status']
  });
  
  const checkoutMutation = useMutation({
    mutationFn: async ({ tier, period }: { tier: 'plus' | 'pro', period: 'monthly' | 'annual' }) => {
      const response = await apiRequest('POST', '/api/subscription/checkout', { tier, period });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout",
        variant: "destructive"
      });
    }
  });

  const handleSubscribe = (tier: 'plus' | 'pro') => {
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
                      disabled={checkoutMutation.isPending || isCurrentPlan}
                    >
                      {checkoutMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
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
