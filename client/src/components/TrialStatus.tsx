import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Clock, CreditCard, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  isPremium: boolean;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  hasStartedTrial: boolean;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}

export function TrialStatus() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/users/profile'],
    refetchInterval: 30000, // Refresh every 30 seconds to check trial status
  });

  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
  }>({ days: 0, hours: 0, minutes: 0 });

  const [trialProgress, setTrialProgress] = useState(0);

  // Don't show trial status for existing paid users
  if (user) {
    // Check if user is a paid user with Stripe data (these users get full access regardless of trial status)
    const hasStripeData = user.stripeCustomerId || user.stripeSubscriptionId;
    const isPaidUser = user.isPremium || 
                      user.subscriptionStatus === 'active' || 
                      user.subscriptionStatus === 'trial_ended' || 
                      user.subscriptionStatus === 'canceled' ||
                      hasStripeData;
    
    if (isPaidUser) {
      return null; // Hide trial component entirely for existing paid users
    }
  }

  useEffect(() => {
    if (!user?.trialEndsAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const trialEnd = new Date(user.trialEndsAt!).getTime();
      const difference = trialEnd - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

        setTimeRemaining({ days, hours, minutes });

        // Calculate progress (14 days = 100%)
        const trialStart = new Date(trialEnd - (14 * 24 * 60 * 60 * 1000));
        const totalTrialTime = trialEnd - trialStart.getTime();
        const elapsedTime = now - trialStart.getTime();
        const progress = Math.max(0, Math.min(100, (elapsedTime / totalTrialTime) * 100));
        setTrialProgress(progress);
      } else {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0 });
        setTrialProgress(100);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [user?.trialEndsAt]);

  if (isLoading || !user) return null;

  // Don't show for premium users
  if (user.isPremium && user.subscriptionStatus === 'active') {
    return null;
  }

  // Trial expired
  if (user.subscriptionStatus === 'trial_expired' || (user.trialEndsAt && new Date() > new Date(user.trialEndsAt))) {
    return (
      <Card className="border-red-200 bg-red-50 mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            Trial Expired
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-red-600">
            Your 14-day free trial has ended. Upgrade to continue accessing all features of Mind My Money.
          </p>
          <div className="flex gap-3">
            <Link href="/subscribe">
              <Button className="bg-red-600 hover:bg-red-700 text-white">
                <CreditCard className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Active trial
  if (user.hasStartedTrial && user.trialEndsAt) {
    const isLowTime = timeRemaining.days <= 2;
    const borderColor = isLowTime ? 'border-orange-200' : 'border-blue-200';
    const bgColor = isLowTime ? 'bg-orange-50' : 'bg-blue-50';
    const textColor = isLowTime ? 'text-orange-700' : 'text-blue-700';
    const progressColor = isLowTime ? 'bg-orange-500' : 'bg-blue-500';

    return (
      <Card className={`${borderColor} ${bgColor} mb-6`}>
        <CardHeader className="pb-3">
          <CardTitle className={`flex items-center gap-2 ${textColor}`}>
            <Clock className="w-5 h-5" />
            Free Trial Active
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className={textColor}>Trial Progress</span>
              <span className={textColor}>
                {timeRemaining.days > 0 && `${timeRemaining.days}d `}
                {timeRemaining.hours}h {timeRemaining.minutes}m remaining
              </span>
            </div>
            <Progress value={trialProgress} className="h-2" />
          </div>
          
          <p className={`${textColor} text-sm`}>
            {timeRemaining.days > 2 
              ? `You have ${timeRemaining.days} days left to explore all features.`
              : timeRemaining.days > 0 
                ? `Only ${timeRemaining.days} days left! Consider upgrading to keep your financial data.`
                : `Less than 24 hours remaining! Upgrade now to avoid losing access.`
            }
          </p>

          <div className="flex gap-3">
            <Link href="/subscribe">
              <Button 
                variant={isLowTime ? "default" : "outline"} 
                className={isLowTime ? "bg-orange-600 hover:bg-orange-700 text-white" : ""}
              >
                <Star className="w-4 h-4 mr-2" />
                Upgrade to Premium
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}