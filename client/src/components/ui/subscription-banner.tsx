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
      const response = await apiRequest("POST", "/api/start-free-trial");
      
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus({
          isPremium: data.isPremium,
          isOnFreeTrial: true,
          trialDaysLeft: data.trialDaysLeft,
          trialEndsAt: data.trialEndsAt
        });
        
        toast({
          title: "Free trial started!",
          description: "You now have access to all premium features for 7 days.",
        });
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
  
  // Don't show if user is already premium
  if (subscriptionStatus?.isPremium) return null;

  return (
    <div className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white p-3 px-4 shadow-md">
      <div className="flex flex-col md:flex-row items-center justify-between">
        <div className="text-center md:text-left mb-3 md:mb-0">
          <p className="font-medium">
            {subscriptionStatus?.isOnFreeTrial 
              ? `Your free trial ends in ${subscriptionStatus.trialDaysLeft} days` 
              : "Unlock all premium features with a 7-day free trial!"}
          </p>
          <p className="text-sm text-white/80">
            {subscriptionStatus?.isOnFreeTrial 
              ? "Continue with a premium subscription after your trial ends." 
              : "No credit card required to start."}
          </p>
        </div>
        <div>
          {subscriptionStatus?.isOnFreeTrial ? (
            <Button 
              variant="secondary" 
              className="bg-white text-teal-700 hover:bg-white/90 hover:text-teal-800"
              onClick={() => setLocation("/subscribe")}
            >
              Upgrade Now
            </Button>
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