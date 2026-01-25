import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import TierGate from '@/components/TierGate';
import TopNav from '@/components/TopNav';
import BottomNavigation from '@/components/BottomNavigation';
import { 
  Flame, Target, Trophy, Sparkles, CheckCircle2, Lock, 
  ArrowRight, ArrowLeft, Share2, Calendar, Zap, Brain, Heart, 
  Coffee, ShoppingBag, Utensils, Play, RefreshCw,
  ChevronRight, Star, Award, Crown, Loader2
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, SubscriptionTier } from '@/types';

interface ChallengeData {
  enrolled: boolean;
  enrollment: {
    id: number;
    currentDay: number;
    status: string;
    totalMissionsCompleted: number;
    startDate: string;
  } | null;
  todayMission: {
    id: number;
    day: number;
    missionType: string;
    title: string;
    description: string;
    actionPrompt: string;
    detoxCategory?: string;
    detoxTarget?: number;
    identityShift?: string;
    isCompleted: boolean;
  } | null;
  streak: {
    currentStreak: number;
    longestStreak: number;
    badges: string[];
    totalDetoxDaysCompleted: number;
    totalHabitDaysCompleted: number;
  } | null;
  completedMissions: number;
  totalMissions: number;
  isReflectionDay: boolean;
  weeklyReflection: any;
  weekNumber: number;
}

const missionTypeIcons: Record<string, typeof Target> = {
  detox: Coffee,
  habit: RefreshCw,
  identity: Brain,
  action: Zap,
  reflection: Heart
};

const missionTypeColors: Record<string, string> = {
  detox: 'bg-orange-500',
  habit: 'bg-blue-500',
  identity: 'bg-purple-500',
  action: 'bg-emerald-500',
  reflection: 'bg-pink-500'
};

const badgeInfo: Record<string, { label: string; icon: typeof Star }> = {
  week_one: { label: 'Week One Champion', icon: Star },
  two_weeks: { label: 'Two Week Warrior', icon: Award },
  three_weeks: { label: 'Almost There', icon: Trophy },
  champion: { label: '30-Day Champion', icon: Crown }
};

export default function MoneyReset() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [missionReflection, setMissionReflection] = useState('');
  const [reflectionAnswers, setReflectionAnswers] = useState<Record<number, string>>({});

  // Get user profile for tier checking
  const { data: userData, isLoading: userLoading } = useQuery<UserProfile>({
    queryKey: ['/api/users/profile'],
  });
  const user = userData as UserProfile;

  // Check tier access - 30-Day Money Reset requires Plus or higher
  const currentTier = (user?.subscriptionTier as SubscriptionTier) || 'free';
  const hasLegacyAccess = user?.hasStartedTrial || user?.isPremium;
  const hasTierAccess = currentTier === 'plus' || currentTier === 'pro';
  const hasAccess = hasLegacyAccess || hasTierAccess;

  // Only fetch challenge data if user has access
  const { data: challengeData, isLoading } = useQuery<ChallengeData>({
    queryKey: ['/api/money-reset'],
    enabled: hasAccess && !userLoading,
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/money-reset/enroll');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/money-reset'] });
      toast({ title: 'Welcome to the 30-Day Money Reset!', description: 'Your transformation journey begins today.' });
    },
    onError: (error: any) => {
      if (error.message?.includes('Money Mind Interview')) {
        toast({ 
          title: 'Complete Your Money Playbook First', 
          description: 'Take the Money Mind Interview to get your personalized challenge.',
          variant: 'destructive'
        });
        navigate('/money-playbook');
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    }
  });

  const completeMissionMutation = useMutation({
    mutationFn: async (data: { missionId: number; reflection: string }) => {
      const res = await apiRequest('POST', '/api/money-reset/complete-mission', data);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/money-reset'] });
      setMissionReflection('');
      toast({ title: 'Mission Complete!', description: data.message });
      if (data.transformationMoment) {
        toast({ title: 'Transformation Moment Unlocked!', description: 'Check out your shareable moment.' });
      }
    }
  });

  const nextDayMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/money-reset/next-day');
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/money-reset'] });
      if (data.completed) {
        toast({ title: 'Congratulations!', description: 'You completed the 30-Day Money Reset!' });
      } else {
        toast({ title: `Day ${data.day} Unlocked`, description: 'New mission available!' });
      }
    }
  });

  const submitReflectionMutation = useMutation({
    mutationFn: async (data: { reflectionId: number; responses: Record<number, string> }) => {
      const res = await apiRequest('POST', '/api/money-reset/submit-reflection', data);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/money-reset'] });
      setReflectionAnswers({});
      toast({ title: 'Reflection Submitted', description: 'Check out your personalized coaching!' });
    }
  });

  if (isLoading || userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 pb-16">
        <BottomNavigation user={user} />
        <TopNav title="30-Day Money Reset" />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <TierGate 
            feature="30-Day Money Reset" 
            requiredTier="plus" 
            currentTier={currentTier}
          >
            <div />
          </TierGate>
        </main>
      </div>
    );
  }

  // Not enrolled - show enrollment page
  if (!challengeData?.enrolled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              The 30-Day Money Reset
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Transform your relationship with money in just 30 days
            </p>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
              AI-Powered Challenge
            </Badge>
          </div>

          {/* What You'll Get */}
          <Card className="mb-6 border-emerald-100 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600" />
                What You'll Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Coffee className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Spending Detox</h3>
                  <p className="text-sm text-gray-600">Break free from mindless spending habits</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Habit Rewiring</h3>
                  <p className="text-sm text-gray-600">Build lasting positive money habits</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Brain className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Identity Shifts</h3>
                  <p className="text-sm text-gray-600">Transform how you see yourself with money</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Weekly Reflections</h3>
                  <p className="text-sm text-gray-600">Deep insights with AI coaching</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* The Journey */}
          <Card className="mb-6 border-emerald-100 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Your 30-Day Journey
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <span className="text-2xl">👀</span>
                  <div>
                    <span className="font-semibold text-yellow-800">Week 1: The Mirror</span>
                    <p className="text-xs text-yellow-700">See your spending clearly</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <span className="text-2xl">🧹</span>
                  <div>
                    <span className="font-semibold text-orange-800">Week 2: The Detox</span>
                    <p className="text-xs text-orange-700">Break the chains of impulse</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-2xl">🔄</span>
                  <div>
                    <span className="font-semibold text-blue-800">Week 3: The Rewire</span>
                    <p className="text-xs text-blue-700">Build new neural pathways</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-2xl">✨</span>
                  <div>
                    <span className="font-semibold text-emerald-800">Week 4: The New You</span>
                    <p className="text-xs text-emerald-700">Celebrate your transformation</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Button 
            onClick={() => enrollMutation.mutate()}
            disabled={enrollMutation.isPending}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-6 text-lg font-semibold rounded-xl shadow-lg"
            data-testid="button-start-reset"
          >
            {enrollMutation.isPending ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Starting Your Journey...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Start My 30-Day Reset
              </span>
            )}
          </Button>
          <p className="text-center text-sm text-gray-500 mt-3">
            Personalized based on your Money Playbook
          </p>
        </div>
      </div>
    );
  }

  // Enrolled - show challenge hub
  const { enrollment, todayMission, streak, completedMissions, isReflectionDay, weeklyReflection, weekNumber } = challengeData;
  const progressPercent = ((enrollment?.currentDay || 1) / 30) * 100;
  const MissionIcon = todayMission ? missionTypeIcons[todayMission.missionType] || Target : Target;
  const missionColor = todayMission ? missionTypeColors[todayMission.missionType] : 'bg-emerald-500';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 pb-24">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-4 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          data-testid="button-back-dashboard"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Header with Progress Ring */}
        <div className="text-center mb-6">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="#E5E7EB"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="url(#gradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${progressPercent * 3.52} 352`}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#0D9488" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-900">Day {enrollment?.currentDay}</span>
              <span className="text-sm text-gray-500">of 30</span>
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">30-Day Money Reset</h1>
          <p className="text-sm text-gray-600">
            {enrollment?.currentDay && enrollment.currentDay <= 7 && 'Week 1: The Mirror'}
            {enrollment?.currentDay && enrollment.currentDay > 7 && enrollment.currentDay <= 14 && 'Week 2: The Detox'}
            {enrollment?.currentDay && enrollment.currentDay > 14 && enrollment.currentDay <= 21 && 'Week 3: The Rewire'}
            {enrollment?.currentDay && enrollment.currentDay > 21 && 'Week 4: The New You'}
          </p>
        </div>

        {/* Streak & Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4 text-center">
              <Flame className="w-6 h-6 text-orange-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-orange-600">{streak?.currentStreak || 0}</div>
              <div className="text-xs text-orange-700">Day Streak</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-emerald-600">{completedMissions}</div>
              <div className="text-xs text-emerald-700">Completed</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4 text-center">
              <Trophy className="w-6 h-6 text-purple-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-purple-600">{(streak?.badges as string[])?.length || 0}</div>
              <div className="text-xs text-purple-700">Badges</div>
            </CardContent>
          </Card>
        </div>

        {/* Badges Display */}
        {streak?.badges && (streak.badges as string[]).length > 0 && (
          <Card className="mb-6 border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-yellow-800">Your Badges</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(streak.badges as string[]).map((badge) => {
                  const info = badgeInfo[badge];
                  if (!info) return null;
                  const BadgeIcon = info.icon;
                  return (
                    <Badge key={badge} className="bg-yellow-100 text-yellow-800 border-yellow-300 flex items-center gap-1">
                      <BadgeIcon className="w-3 h-3" />
                      {info.label}
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Mission Card */}
        {todayMission && (
          <Card className={`mb-6 border-2 ${todayMission.isCompleted ? 'border-emerald-300 bg-emerald-50' : 'border-primary/30'} shadow-lg`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 ${missionColor} rounded-full flex items-center justify-center`}>
                    <MissionIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <Badge variant="outline" className="text-xs capitalize mb-1">
                      {todayMission.missionType} Mission
                    </Badge>
                    <CardTitle className="text-lg">{todayMission.title}</CardTitle>
                  </div>
                </div>
                {todayMission.isCompleted && (
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{todayMission.description}</p>
              
              {/* Action Prompt */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                <div className="flex items-start gap-2">
                  <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Today's Action:</span>
                    <p className="text-sm text-gray-800 mt-1">{todayMission.actionPrompt}</p>
                  </div>
                </div>
              </div>

              {/* Identity Shift */}
              {todayMission.identityShift && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mb-4 border border-purple-200">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-sm font-semibold text-purple-700">Identity Shift:</span>
                      <p className="text-sm text-purple-800 mt-1 italic">"{todayMission.identityShift}"</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Detox Target */}
              {todayMission.detoxCategory && todayMission.detoxTarget && (
                <div className="bg-orange-50 rounded-lg p-4 mb-4 border border-orange-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-orange-700">
                      {todayMission.detoxCategory.charAt(0).toUpperCase() + todayMission.detoxCategory.slice(1)} Limit:
                    </span>
                    <span className="text-lg font-bold text-orange-600">${todayMission.detoxTarget}</span>
                  </div>
                </div>
              )}

              {/* Complete Mission */}
              {!todayMission.isCompleted && (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Optional: Share how it went or what you learned..."
                    value={missionReflection}
                    onChange={(e) => setMissionReflection(e.target.value)}
                    className="resize-none"
                    rows={2}
                    data-testid="input-mission-reflection"
                  />
                  <Button
                    onClick={() => completeMissionMutation.mutate({ 
                      missionId: todayMission.id, 
                      reflection: missionReflection 
                    })}
                    disabled={completeMissionMutation.isPending}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    data-testid="button-complete-mission"
                  >
                    {completeMissionMutation.isPending ? 'Completing...' : 'Complete Mission'}
                  </Button>
                </div>
              )}

              {/* Next Day Button */}
              {todayMission.isCompleted && enrollment?.currentDay && enrollment.currentDay < 30 && (
                <Button
                  onClick={() => nextDayMutation.mutate()}
                  disabled={nextDayMutation.isPending}
                  className="w-full bg-gradient-to-r from-primary to-primary/80"
                  data-testid="button-next-day"
                >
                  {nextDayMutation.isPending ? 'Loading...' : (
                    <span className="flex items-center gap-2">
                      Continue to Day {enrollment.currentDay + 1}
                      <ChevronRight className="w-5 h-5" />
                    </span>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Weekly Reflection (if applicable) */}
        {isReflectionDay && weeklyReflection && !weeklyReflection.isCompleted && (
          <Card className="mb-6 border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-pink-800">
                <Heart className="w-5 h-5 text-pink-500" />
                Week {weekNumber} Reflection
              </CardTitle>
              <p className="text-sm text-pink-700">{weeklyReflection.identityShiftMessage}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {(weeklyReflection.promptQuestions as string[] || []).map((question: string, idx: number) => (
                <div key={idx}>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">{question}</label>
                  <Textarea
                    value={reflectionAnswers[idx] || ''}
                    onChange={(e) => setReflectionAnswers({ ...reflectionAnswers, [idx]: e.target.value })}
                    placeholder="Take your time to reflect..."
                    className="resize-none"
                    rows={2}
                    data-testid={`input-reflection-${idx}`}
                  />
                </div>
              ))}
              <Button
                onClick={() => submitReflectionMutation.mutate({
                  reflectionId: weeklyReflection.id,
                  responses: reflectionAnswers
                })}
                disabled={submitReflectionMutation.isPending}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                data-testid="button-submit-reflection"
              >
                {submitReflectionMutation.isPending ? 'Submitting...' : 'Submit Reflection'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Completed Reflection with Coaching */}
        {weeklyReflection?.isCompleted && weeklyReflection.aiCoachingResponse && (
          <Card className="mb-6 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-800">
                <Brain className="w-5 h-5 text-emerald-500" />
                Money Mind Coaching
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-line">{weeklyReflection.aiCoachingResponse}</p>
            </CardContent>
          </Card>
        )}

        {/* Share Button */}
        <Button
          variant="outline"
          className="w-full border-primary text-primary hover:bg-primary/5"
          onClick={() => navigate('/money-reset/moments')}
          data-testid="button-view-moments"
        >
          <Share2 className="w-4 h-4 mr-2" />
          View Shareable Moments
        </Button>
      </div>
    </div>
  );
}
