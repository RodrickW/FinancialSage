import { useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Loader2 } from "lucide-react";
import { useLocation } from 'wouter';
import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';
import BottomNavigation from '@/components/BottomNavigation';
import { useQuery } from '@tanstack/react-query';
import { mockUserProfile } from '@/lib/utils/mockData';

const plans = [
  {
    name: "Standard",
    price: "$9.99",
    period: "month",
    description: "Essential financial management with AI coaching",
    features: [
      "Unlimited bank connections",
      "Money Mind AI coaching",
      "Basic spending analytics",
      "Budget tracking & planning",
      "Goal setting & tracking",
      "Email support"
    ],
    planType: "standard",
    popular: false
  },
  {
    name: "Premium",
    price: "$14.99",
    period: "month",
    description: "Advanced features with credit monitoring & insights",
    features: [
      "Everything in Standard",
      "Advanced AI coaching & insights",
      "Credit score monitoring",
      "Credit improvement recommendations",
      "Advanced analytics & reports",
      "Investment recommendations",
      "Priority support"
    ],
    planType: "premium",
    popular: true
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

  const user = userData || mockUserProfile;

  const handleStartTrial = async (planType: string) => {
    setIsLoading(planType);
    
    try {
      const response = await apiRequest('POST', '/api/start-free-trial', { planType });
      const data = await response.json();
      
      if (data.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl;
      } else {
        toast({
          title: "Error",
          description: "Unable to start free trial. Please try again.",
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
          <TopNav title="Choose Your Plan" isPremium={false} />
          
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center mb-12">
              <Crown className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white p-4" />
              <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Unlock Your Financial Potential
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Choose the plan that's right for you and start your 30-day free trial today
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {plans.map((plan, index) => (
                <Card key={index} className={`relative ${plan.popular ? 'border-teal-200 shadow-lg scale-105' : 'border-gray-200'}`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="flex items-center mt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-gray-500 ml-2">/{plan.period}</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  
                  <CardFooter>
                    <Button 
                      className={`w-full ${plan.popular 
                        ? 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white' 
                        : 'border-teal-200 text-teal-600 hover:bg-teal-50'
                      }`}
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => handleStartTrial(plan.planType)}
                      disabled={isLoading === plan.planType}
                    >
                      {isLoading === plan.planType ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Starting Trial...
                        </>
                      ) : (
                        'Start 30-Day Free Trial'
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
                  Secure payment
                </div>
              </div>
              
              <p className="text-gray-500">
                Your trial will begin immediately. You'll be charged after 30 days unless you cancel.
              </p>
            </div>
          </main>
        </div>
      </div>
      
      <div className="lg:hidden">
        <BottomNavigation user={user} />
      </div>
    </div>
  );
}