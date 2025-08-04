import { useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import { MoneyMindLogo } from '@/components/Logo';
import { useLocation } from 'wouter';
import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';
import BottomNavigation from '@/components/BottomNavigation';
import { useQuery } from '@tanstack/react-query';
// Removed mock data imports - using real API data only

const plans = [
  {
    name: "Monthly Plan",
    price: "$9.99",
    period: "month",
    description: "Complete financial management with AI coaching",
    features: [
      "Bank connections",
      "AI coaching",
      "Spending analytics",
      "Budget tracking",
      "Goal tracking",
      "Email support"
    ],
    planType: "monthly",
    popular: false,
    available: true
  },
  {
    name: "Annual Plan",
    price: "$95.99",
    originalPrice: "$119.88",
    period: "year",
    savings: "Save $23.89",
    description: "Same great features with significant savings",
    monthlyEquivalent: "Only $8.00/month when paid annually",
    features: [
      "Bank connections",
      "AI coaching", 
      "Spending analytics",
      "Budget tracking",
      "Goal tracking",
      "Email support",
      "2 months free",
      "Best value option"
    ],
    planType: "annual",
    popular: true,
    available: true
  }
];

export default function Subscribe() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  // Get the user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/users/profile']
  });

  const user = userData as any;

  const handleStartTrial = async (planType: string) => {
    setIsLoading(planType);
    
    try {
      const response = await apiRequest('POST', '/api/start-free-trial', { planType });
      const data = await response.json();
      
      if (data.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl;
      } else if (data.redirectToManage) {
        // User already has a trial, show current status
        toast({
          title: "Trial Already Active",
          description: "You already have an active trial. Manage your subscription below.",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Unable to start free trial. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error starting trial:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50">
      <div className="lg:flex">
        <div className="hidden lg:block lg:w-64 lg:fixed lg:inset-y-0">
          <Sidebar user={user} />
        </div>
        
        <div className="lg:pl-64 flex-1">
          <TopNav title="Choose Your Plan" isPremium={user?.isPremium || false} />
          
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center mb-12">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 p-3">
                <MoneyMindLogo className="w-10 h-10" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Unlock Your Financial Potential
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Start your 30-day free trial with complete financial management
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {plans.map((plan, index) => (
                <Card key={index} className={`relative border-2 shadow-lg ${plan.popular ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50' : 'border-teal-200'}`}>
                  {plan.popular && plan.available && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-1">
                        Best Value - {plan.savings}
                      </Badge>
                    </div>
                  )}
                  {plan.popular && !plan.available && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gray-500 text-white">
                        Coming Soon
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <div className="flex items-center">
                        <span className="text-4xl font-bold">{plan.price}</span>
                        {plan.price !== "Coming Soon" && <span className="text-gray-500 ml-2">/{plan.period}</span>}
                      </div>
                      {plan.originalPrice && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm text-gray-500 line-through">{plan.originalPrice}</span>
                          <span className="text-sm font-medium text-green-600">{plan.savings}</span>
                        </div>
                      )}
                      {plan.monthlyEquivalent && (
                        <p className="text-sm text-gray-600 mt-1">{plan.monthlyEquivalent}</p>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <Check className={`w-5 h-5 mr-3 flex-shrink-0 ${plan.available ? 'text-green-500' : 'text-gray-400'}`} />
                          <span className={`${plan.available ? 'text-gray-600' : 'text-gray-400'}`}>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  
                  <CardFooter>
                    <Button 
                      className={`w-full py-3 text-base font-medium ${plan.available 
                        ? 'bg-teal-500 hover:bg-teal-600 text-white' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      variant={plan.available ? 'default' : 'secondary'}
                      onClick={() => plan.available && handleStartTrial(plan.planType)}
                      disabled={!plan.available || isLoading === plan.planType}
                    >
                      {plan.available && isLoading === plan.planType ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Starting Trial...
                        </>
                      ) : plan.available ? (
                        'Start 30-Day Free Trial'
                      ) : (
                        'Coming Soon'
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            <div className="mt-12 text-center">
              <div className="flex items-center justify-center gap-8 text-sm text-gray-500 mb-6">
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  30-day free trial
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Cancel anytime
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  Secure payment required
                </div>
              </div>
              
              <p className="text-gray-500">
                A payment method is required to start your trial. You'll be charged according to your selected plan after 30 days unless you cancel.
                <br />
                Monthly: $9.99/month • Annual: $95.99/year (Save $23.89)
                <br />
                <a href="/cancel-trial" className="text-blue-600 hover:underline text-sm">
                  Need to cancel? Click here
                </a>
              </p>
            </div>
          </main>
        </div>
      </div>
      
      <div className="lg:hidden">
        <BottomNavigation user={user as any} />
      </div>
    </div>
  );
}