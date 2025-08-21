import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function SubscriptionSuccess() {
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Auto-redirect to dashboard after countdown
    if (countdown <= 0) {
      setLocation("/");
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, setLocation]);

  return (
    <div className="container max-w-md mx-auto h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <div className="bg-gradient-to-br from-teal-500 to-emerald-500 w-20 h-20 rounded-full flex items-center justify-center mb-6">
        <CheckCircle className="w-12 h-12 text-white" />
      </div>
      
      <h1 className="text-3xl font-bold mb-2">Subscription Successful!</h1>
      
      <p className="text-xl mb-6">
        Your 14-day free trial has started
      </p>
      
      <p className="mb-8 text-muted-foreground">
        You now have full access to all premium features. Enjoy exploring your financial insights and tools!
      </p>
      
      <Button 
        onClick={() => setLocation("/")}
        className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
      >
        Go to Dashboard ({countdown})
      </Button>
    </div>
  );
}