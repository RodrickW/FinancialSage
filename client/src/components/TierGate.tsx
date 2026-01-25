import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Sparkles, TrendingUp, Target, MessageCircle } from 'lucide-react';

type SubscriptionTier = 'free' | 'plus' | 'pro';

interface TierGateProps {
  feature: string;
  requiredTier: 'plus' | 'pro';
  currentTier: SubscriptionTier;
  children: React.ReactNode;
}

const tierFeatures = {
  plus: [
    { icon: Sparkles, label: 'AI Financial Interview' },
    { icon: TrendingUp, label: 'AI-Generated Budget' },
    { icon: Target, label: '30-Day Money Reset' },
    { icon: MessageCircle, label: '20 AI Coach Messages/month' },
  ],
  pro: [
    { icon: MessageCircle, label: 'Unlimited AI Coaching' },
    { icon: TrendingUp, label: 'Advanced Insights' },
    { icon: Target, label: 'Goal Optimization' },
    { icon: Sparkles, label: 'Priority Support' },
  ],
};

const tierPricing = {
  plus: { monthly: '$5.99', annual: '$49/year' },
  pro: { monthly: '$9.99', annual: '$89/year' },
};

export default function TierGate({ feature, requiredTier, currentTier, children }: TierGateProps) {
  const [, setLocation] = useLocation();

  const tierOrder = { free: 0, plus: 1, pro: 2 };
  const hasAccess = tierOrder[currentTier] >= tierOrder[requiredTier];

  if (hasAccess) {
    return <>{children}</>;
  }

  const features = tierFeatures[requiredTier];
  const pricing = tierPricing[requiredTier];
  const tierName = requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1);

  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-xl text-gray-900">
          Upgrade to {tierName} to Unlock {feature}
        </CardTitle>
        <p className="text-gray-600 mt-2">
          Get access to powerful features that transform your finances
        </p>
        <div className="flex justify-center gap-2 mt-3">
          <Badge className="bg-emerald-100 text-emerald-800">
            {pricing.monthly}/month
          </Badge>
          <Badge variant="outline" className="border-emerald-300 text-emerald-700">
            or {pricing.annual}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 mb-6">
          {features.map((item, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <item.icon className="w-4 h-4 text-emerald-600" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <Button 
          className="w-full bg-gradient-to-r from-emerald-700 to-emerald-500 hover:from-emerald-800 hover:to-emerald-700 text-white font-medium py-3"
          onClick={() => setLocation('/pricing')}
        >
          Upgrade to {tierName}
        </Button>
        
        <p className="text-xs text-center text-gray-500 mt-3">
          Instant access • Cancel anytime
        </p>
      </CardContent>
    </Card>
  );
}

interface LockedFeatureCardProps {
  title: string;
  description: string;
  requiredTier: 'plus' | 'pro';
  icon: React.ReactNode;
}

export function LockedFeatureCard({ title, description, requiredTier, icon }: LockedFeatureCardProps) {
  const [, setLocation] = useLocation();
  const tierName = requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1);
  
  return (
    <Card className="border-gray-200 bg-gray-50 opacity-80 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setLocation('/pricing')}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center relative">
            {icon}
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
              <Lock className="w-3 h-3 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-700">{title}</h4>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
          <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700">
            {tierName}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
