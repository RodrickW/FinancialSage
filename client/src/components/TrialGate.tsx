import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Sparkles, TrendingUp, Target, MessageCircle } from 'lucide-react';

type SubscriptionTier = 'free' | 'plus' | 'pro';

interface TrialGateProps {
  feature: string;
  children: React.ReactNode;
  hasStartedTrial?: boolean;
  currentTier?: SubscriptionTier;
  requiredTier?: SubscriptionTier;
}

const tierOrder: Record<SubscriptionTier, number> = {
  'free': 0,
  'plus': 1, 
  'pro': 2
};

export default function TrialGate({ 
  feature, 
  children, 
  hasStartedTrial, 
  currentTier = 'free',
  requiredTier = 'plus' 
}: TrialGateProps) {
  const [, setLocation] = useLocation();

  const hasAccess = hasStartedTrial || tierOrder[currentTier] >= tierOrder[requiredTier];
  
  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-xl text-gray-900">
          Upgrade to Unlock {feature}
        </CardTitle>
        <p className="text-gray-600 mt-2">
          Get access to powerful features that transform your finances
        </p>
        <div className="flex justify-center gap-2 mt-3">
          <Badge className="bg-emerald-100 text-emerald-800">
            Plus $5.99/mo
          </Badge>
          <Badge variant="outline" className="border-emerald-300 text-emerald-700">
            Pro $9.99/mo
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="flex items-center space-x-2 text-sm">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>AI Financial Interview</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>AI-Generated Budget</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Target className="w-4 h-4 text-emerald-600" />
            <span>30-Day Money Reset</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>AI Coach Messages</span>
          </div>
        </div>

        <Button 
          className="w-full bg-gradient-to-r from-emerald-700 to-emerald-500 hover:from-emerald-800 hover:to-emerald-700 text-white font-medium py-3"
          onClick={() => setLocation('/pricing')}
        >
          View Plans
        </Button>
        
        <p className="text-xs text-center text-gray-500 mt-3">
          Instant access • Cancel anytime
        </p>
      </CardContent>
    </Card>
  );
}