import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Star, TrendingUp, Brain, Shield } from 'lucide-react';

interface TrialGateProps {
  feature: string;
  children: React.ReactNode;
  hasStartedTrial: boolean;
}

export default function TrialGate({ feature, children, hasStartedTrial }: TrialGateProps) {
  const [, setLocation] = useLocation();

  if (hasStartedTrial) {
    return <>{children}</>;
  }

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-xl text-gray-900">
          Start Your Free Trial to Access {feature}
        </CardTitle>
        <p className="text-gray-600 mt-2">
          Unlock all premium features with our 30-day free trial
        </p>
        <Badge className="mx-auto mt-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white">
          No Credit Card Required
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="flex items-center space-x-2 text-sm">
            <Brain className="w-4 h-4 text-teal-600" />
            <span>AI Financial Coach</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            <span>Smart Analytics</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Star className="w-4 h-4 text-teal-600" />
            <span>Goal Tracking</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Shield className="w-4 h-4 text-teal-600" />
            <span>Bank Integration</span>
          </div>
        </div>

        <Button 
          className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-medium py-3"
          onClick={() => setLocation('/subscribe')}
        >
          Start Free Trial
        </Button>
        
        <p className="text-xs text-center text-gray-500 mt-3">
          Full access for 30 days • Cancel anytime • No commitments
        </p>
      </CardContent>
    </Card>
  );
}