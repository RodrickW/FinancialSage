import { useState, useEffect } from 'react';
import { Bell, X, Clock, AlertTriangle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TrialStatus {
  daysRemaining: number;
  trialEndsAt: string;
  isOnFreeTrial: boolean;
}

export default function TrialNotificationBanner() {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    checkTrialStatus();
  }, []);

  const checkTrialStatus = async () => {
    try {
      const response = await apiRequest('GET', '/api/subscription/status');
      if (response.ok) {
        const data = await response.json();
        if (data.isOnFreeTrial && data.trialDaysLeft <= 14) {
          setTrialStatus({
            daysRemaining: data.trialDaysLeft,
            trialEndsAt: data.trialEndsAt,
            isOnFreeTrial: data.isOnFreeTrial
          });
        }
      }
    } catch (error) {
      console.error('Error checking trial status:', error);
    }
  };

  const handleCancelTrial = async () => {
    try {
      const response = await apiRequest('POST', '/api/cancel-trial');
      if (response.ok) {
        toast({
          title: 'Trial Cancelled',
          description: 'Your trial has been cancelled. You can still use the service until it expires.',
        });
        setIsVisible(false);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to cancel trial. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel trial. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getNotificationColor = (days: number) => {
    if (days <= 1) return 'bg-red-50 border-red-200';
    if (days <= 3) return 'bg-orange-50 border-orange-200';
    if (days <= 7) return 'bg-yellow-50 border-yellow-200';
    return 'bg-emerald-50 border-emerald-200';
  };

  const getIcon = (days: number) => {
    if (days <= 1) return <AlertTriangle className="w-5 h-5 text-red-600" />;
    if (days <= 3) return <Clock className="w-5 h-5 text-orange-600" />;
    return <Bell className="w-5 h-5 text-emerald-700" />;
  };

  const getUrgencyText = (days: number) => {
    if (days <= 1) return 'expires tomorrow!';
    if (days === 2) return 'expires in 2 days';
    return `expires in ${days} days`;
  };

  if (!trialStatus || !isVisible || !trialStatus.isOnFreeTrial) {
    return null;
  }

  return (
    <Card className={`mx-4 my-2 border-2 ${getNotificationColor(trialStatus.daysRemaining)}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {getIcon(trialStatus.daysRemaining)}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-gray-900">
                  Your free trial {getUrgencyText(trialStatus.daysRemaining)}
                </h3>
                <Badge 
                  variant={trialStatus.daysRemaining <= 3 ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {trialStatus.daysRemaining} day{trialStatus.daysRemaining !== 1 ? 's' : ''} left
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                {trialStatus.daysRemaining <= 1 
                  ? 'Upgrade today to maintain access to all premium features.'
                  : trialStatus.daysRemaining <= 3
                  ? 'Don\'t lose access to your financial insights and premium features.'
                  : 'Continue enjoying unlimited access to all premium features.'
                }
              </p>
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm"
                  onClick={() => setLocation('/subscribe')}
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80"
                >
                  <CreditCard className="w-4 h-4 mr-1" />
                  Upgrade Now
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setLocation('/cancel-trial')}
                  className="text-gray-600"
                >
                  Cancel Trial
                </Button>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}