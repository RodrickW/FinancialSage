import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { X, Clock, AlertCircle } from 'lucide-react';

export default function TrialAlert() {
  const [isVisible, setIsVisible] = useState(true);
  const [, setLocation] = useLocation();

  // Get subscription status
  const { data: subscriptionStatus } = useQuery({
    queryKey: ['/api/subscription/status'],
    retry: false
  });

  if (!isVisible || !subscriptionStatus || !subscriptionStatus.isOnFreeTrial) {
    return null;
  }

  const daysLeft = subscriptionStatus.trialDaysLeft;
  
  // Only show alert when trial is ending soon (7 days or less)
  if (daysLeft > 7) {
    return null;
  }

  const getAlertColor = () => {
    if (daysLeft <= 1) return 'bg-red-600';
    if (daysLeft <= 3) return 'bg-orange-500';
    return 'bg-yellow-500';
  };

  const getAlertMessage = () => {
    if (daysLeft <= 1) return 'Your trial expires tomorrow!';
    if (daysLeft <= 3) return `Only ${daysLeft} days left in your trial`;
    return `${daysLeft} days remaining in your trial`;
  };

  return (
    <div className={`w-full ${getAlertColor()} text-white py-2 px-4 relative`}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          {daysLeft <= 1 ? (
            <AlertCircle className="w-5 h-5 animate-pulse" />
          ) : (
            <Clock className="w-5 h-5" />
          )}
          <div>
            <span className="font-medium">{getAlertMessage()}</span>
            <span className="ml-2 text-sm opacity-90">
              Upgrade now to keep all your premium features.
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            size="sm"
            variant="secondary" 
            className="bg-white text-gray-800 hover:bg-gray-100 font-medium"
            onClick={() => setLocation("/subscribe")}
          >
            Upgrade Now
          </Button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-white hover:text-gray-200 p-1"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}