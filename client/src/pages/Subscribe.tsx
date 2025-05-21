import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useLocation } from 'wouter';

// Load Stripe outside of component
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const features = [
  "Unlimited account connections",
  "Advanced spending analytics",
  "AI-powered financial coaching",
  "Smart budget recommendations",
  "Goal planning tools",
  "Credit score monitoring",
  "Premium customer support"
];

const SubscriptionForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/subscription/success",
      },
    });

    if (error) {
      toast({
        title: "Subscription failed",
        description: error.message,
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="space-y-4">
        <PaymentElement />
        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
          disabled={isLoading || !stripe}
        >
          {isLoading ? "Processing..." : "Start 7-Day Free Trial"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          No charge for 7 days. Cancel anytime.
        </p>
      </div>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await apiRequest("POST", "/api/get-or-create-subscription");
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error("Error setting up subscription:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Button 
        variant="ghost" 
        className="mb-4" 
        onClick={() => setLocation("/")}
      >
        ← Back to Dashboard
      </Button>
      
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-4 bg-gradient-to-r from-teal-400 to-emerald-500 bg-clip-text text-transparent">
            Unlock Premium Features
          </h1>
          <p className="mb-6 text-lg">
            Start your 7-day free trial today and take control of your financial future.
          </p>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Premium Plan</CardTitle>
              <CardDescription>
                <span className="text-2xl font-bold">$8.99</span>
                <span className="text-muted-foreground">/month</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-5 w-5 text-emerald-500 mr-2" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Free for 7 days. Cancel anytime before trial ends.
              </p>
            </CardFooter>
          </Card>
        </div>
        
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
          {clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <SubscriptionForm />
            </Elements>
          ) : (
            <p>Unable to load payment form. Please try again later.</p>
          )}
        </div>
      </div>
    </div>
  );
}