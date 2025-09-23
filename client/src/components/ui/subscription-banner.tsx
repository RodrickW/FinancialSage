import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function SubscriptionBanner() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    isPremium: boolean;
    isOnFreeTrial: boolean;
    trialDaysLeft: number;
    trialEndsAt: string | null;
    hasStartedTrial: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const response = await apiRequest("GET", "/api/subscription/status");
        if (response.ok) {
          const data = await response.json();
          setSubscriptionStatus(data);
        }
      } catch (error) {
        console.error("Error checking subscription status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, []);

  const startFreeTrial = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest("POST", "/api/start-free-trial", { planType: 'standard' });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.checkoutUrl) {
          // Redirect to Stripe checkout
          window.location.href = data.checkoutUrl;
        } else if (data.redirectToManage) {
          // User already has a trial, redirect to subscription management
          setLocation("/subscribe");
        } else {
          toast({
            title: "Error",
            description: data.message || "Unable to start free trial. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to start free trial. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error starting free trial:", error);
      toast({
        title: "Error",
        description: "Failed to start free trial. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return null;
  
  // Don't show if user is already premium (includes demo users and paid subscribers)
  if (subscriptionStatus?.isPremium) return null;
  
  // For users on trial, only show banner when trial is ending soon (7 days or less)
  if (subscriptionStatus?.isOnFreeTrial && subscriptionStatus?.trialDaysLeft > 7) {
    return null;
  }
  
  // Don't show if user has started trial but it's not currently active
  if (subscriptionStatus?.hasStartedTrial && !subscriptionStatus?.isOnFreeTrial) {
    return null;
  }

  // Don't show subscription banner for users who haven't started trial - let TrialGate handle it
  if (!subscriptionStatus?.hasStartedTrial && !subscriptionStatus?.isOnFreeTrial) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-primary to-primary/90 text-white p-3 px-4 shadow-md">
      <div className="flex flex-col md:flex-row items-center justify-between">
        <div className="text-center md:text-left mb-3 md:mb-0">
          <p className="font-medium">
            {subscriptionStatus?.isOnFreeTrial 
              ? `Your free trial ends in ${subscriptionStatus.trialDaysLeft} days` 
              : "Start your 14-day free trial of Mind My Money!"}
          </p>
          <p className="text-sm text-white/80">
            {subscriptionStatus?.isOnFreeTrial 
              ? "Continue with your Standard subscription after your trial ends." 
              : "Full access to all features - credit card required for trial setup."}
          </p>
        </div>
        <div className="flex gap-3">
          {subscriptionStatus?.isOnFreeTrial ? (
            <>
              <Button 
                variant="secondary" 
                className="bg-white text-primary hover:bg-white/90 hover:text-primary/90"
                onClick={() => setLocation("/subscribe")}
              >
                Upgrade Now
              </Button>
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-primary"
                onClick={() => setLocation("/cancel-trial")}
              >
                Cancel Trial
              </Button>
            </>
          ) : (
            <Button 
              variant="secondary" 
              className="bg-white text-teal-700 hover:bg-white/90 hover:text-teal-800"
              disabled={isLoading}
              onClick={startFreeTrial}
            >
              Start Free Trial
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}