import { useAuth } from '@/hooks/useAuth';
import { UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, Star } from 'lucide-react';
import { Link } from 'wouter';

interface TrialGateProps {
  children: React.ReactNode;
  feature: string;
  description?: string;
  demoContent?: React.ReactNode;
}

export default function TrialGate({ children, feature, description, demoContent }: TrialGateProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 rounded-lg h-32" />;
  }

  // Allow access if user has started trial or is premium
  if (user && (user as any)?.hasStartedTrial || (user as any)?.isPremium) {
    return <>{children}</>;
  }

  // Show demo content if provided, otherwise show trial gate
  if (demoContent) {
    return (
      <div className="relative">
        <div className="opacity-60 pointer-events-none">
          {demoContent}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-lg">
          <Card className="max-w-md mx-4">
            <CardHeader className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-emerald-100 rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6 text-emerald-600" />
              </div>
              <CardTitle className="flex items-center gap-2 justify-center">
                <Crown className="w-5 h-5 text-yellow-500" />
                {feature}
              </CardTitle>
              <CardDescription>
                {description || `Start your free trial to access ${feature.toLowerCase()}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Badge variant="secondary" className="mb-4">
                <Star className="w-3 h-3 mr-1" />
                30-Day Free Trial
              </Badge>
              <div className="space-y-2">
                <Link href="/subscribe">
                  <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600">
                    Start Free Trial
                  </Button>
                </Link>
                <p className="text-xs text-gray-500">
                  Full access • No commitment • Cancel anytime
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Simple trial gate without demo content
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="w-12 h-12 mx-auto mb-2 bg-emerald-100 rounded-full flex items-center justify-center">
          <Lock className="w-6 h-6 text-emerald-600" />
        </div>
        <CardTitle className="flex items-center gap-2 justify-center">
          <Crown className="w-5 h-5 text-yellow-500" />
          {feature}
        </CardTitle>
        <CardDescription>
          {description || `Start your free trial to access ${feature.toLowerCase()}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Badge variant="secondary" className="mb-4">
          <Star className="w-3 h-3 mr-1" />
          30-Day Free Trial
        </Badge>
        <div className="space-y-2">
          <Link href="/subscribe">
            <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600">
              Start Free Trial
            </Button>
          </Link>
          <p className="text-xs text-gray-500">
            Full access • Cancel anytime • Secure payment setup
          </p>
        </div>
      </CardContent>
    </Card>
  );
}