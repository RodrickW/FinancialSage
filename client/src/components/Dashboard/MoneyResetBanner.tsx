import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Flame, Target, ArrowRight, Play } from 'lucide-react';

interface ChallengeStatus {
  enrolled: boolean;
  enrollment: {
    currentDay: number;
    status: string;
  } | null;
  streak: {
    currentStreak: number;
  } | null;
  todayMission: {
    title: string;
    isCompleted: boolean;
  } | null;
  completedMissions: number;
}

export default function MoneyResetBanner() {
  const { data: challengeData, isLoading } = useQuery<ChallengeStatus>({
    queryKey: ['/api/money-reset'],
  });

  if (isLoading) {
    return null;
  }

  // Not enrolled - show enrollment CTA
  if (!challengeData?.enrolled) {
    return (
      <Card className="mb-6 overflow-hidden border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 shadow-lg">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row items-center">
            {/* Left decorative section */}
            <div className="w-full md:w-1/4 bg-gradient-to-br from-emerald-600 to-teal-600 p-6 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <span className="text-white font-bold text-lg">30 Days</span>
              </div>
            </div>
            
            {/* Content section */}
            <div className="flex-1 p-6">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                  NEW CHALLENGE
                </Badge>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                The 30-Day Money Reset
              </h3>
              <p className="text-gray-600 mb-4">
                Transform your relationship with money through daily missions, spending detox, and identity shifts. Powered by AI.
              </p>
              <Link href="/money-reset">
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700" data-testid="button-start-money-reset">
                  <Play className="w-4 h-4 mr-2" />
                  Start My Reset
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Enrolled - show progress banner
  const { enrollment, streak, todayMission, completedMissions } = challengeData;
  const progressPercent = ((enrollment?.currentDay || 1) / 30) * 100;

  return (
    <Card className="mb-6 overflow-hidden border-2 border-primary/30 shadow-lg">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row items-stretch">
          {/* Progress section */}
          <div className="w-full md:w-1/4 bg-gradient-to-br from-primary to-primary/80 p-4 flex flex-col items-center justify-center text-white">
            <div className="text-center">
              <span className="text-3xl font-bold">Day {enrollment?.currentDay}</span>
              <div className="text-sm opacity-80">of 30</div>
              <div className="flex items-center gap-1 mt-2">
                <Flame className="w-4 h-4 text-orange-300" />
                <span className="text-sm">{streak?.currentStreak || 0} day streak</span>
              </div>
            </div>
          </div>
          
          {/* Mission section */}
          <div className="flex-1 p-4">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="text-xs">
                30-Day Money Reset
              </Badge>
              {todayMission?.isCompleted && (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                  Today Complete ✓
                </Badge>
              )}
            </div>
            
            <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              {todayMission?.title || 'Loading mission...'}
            </h4>
            
            <div className="flex items-center gap-4 mt-3">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{completedMissions} missions completed</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
              
              <Link href="/money-reset">
                <Button size="sm" className="bg-primary hover:bg-primary/90" data-testid="button-continue-reset">
                  Continue
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
