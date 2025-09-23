import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { AlertCircle } from "lucide-react";

export default function SubscriptionCancel() {
  const [, setLocation] = useLocation();

  return (
    <div className="container max-w-md mx-auto h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <div className="bg-gray-200 w-20 h-20 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="w-12 h-12 text-gray-500" />
      </div>
      
      <h1 className="text-2xl font-bold mb-2">Subscription Cancelled</h1>
      
      <p className="mb-8 text-muted-foreground">
        Your subscription process was cancelled. You can try again anytime when you're ready.
      </p>
      
      <div className="space-y-4">
        <Button 
          onClick={() => setLocation("/subscribe")}
          className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 w-full"
        >
          Try Again
        </Button>
        
        <Button 
          variant="outline"
          onClick={() => setLocation("/")}
          className="w-full"
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}