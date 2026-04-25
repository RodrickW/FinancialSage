import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import TopNav from '@/components/TopNav';
import BottomNavigation from '@/components/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Brain, Target, AlertTriangle, Sparkles, CheckCircle, Calendar, TrendingUp, Heart, Zap, ArrowRight, RefreshCw } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface MoneyPlaybook {
  moneyPersonalityType: string;
  moneyPersonalityDescription: string;
  strengths: string[];
  weaknesses: string[];
  emotionalPatterns: string[];
  behavioralPatterns: string[];
  spendingTriggers: string[];
  coreMoneyValues: string[];
  thirtyDayPlan: {
    week1: string[];
    week2: string[];
    week3: string[];
    week4: string[];
  };
  dailyHabit: string;
  purposeStatement: string;
  rootMoneyInsight: string;
  scores: {
    savingHabitScore: number;
    financialAwarenessScore: number;
    spendingTriggerIntensity: number;
  };
  weeklyFocus: string;
  encouragement: string;
}

interface InterviewData {
  hasInterview: boolean;
  interview?: {
    id: number;
    completedAt: string;
    responses: Record<string, any>;
    moneyPlaybook: MoneyPlaybook;
  };
}

const personalityIcons: Record<string, string> = {
  'The Saver': '💰',
  'The Spender': '🛍️',
  'The Avoider': '🙈',
  'The Overthinker': '🤔',
  'The Dreamer': '✨',
  'The Hustler': '💪',
  'The People-Pleaser': '🤝',
  'The Impulse Buyer': '⚡',
  'The Planner': '📋',
  'The Survivor': '🦁'
};

const personalityColors: Record<string, string> = {
  'The Saver': 'from-emerald-500 to-green-600',
  'The Spender': 'from-pink-500 to-rose-600',
  'The Avoider': 'from-gray-500 to-slate-600',
  'The Overthinker': 'from-purple-500 to-violet-600',
  'The Dreamer': 'from-sky-500 to-emerald-700',
  'The Hustler': 'from-orange-500 to-amber-600',
  'The People-Pleaser': 'from-teal-500 to-cyan-600',
  'The Impulse Buyer': 'from-red-500 to-rose-600',
  'The Planner': 'from-indigo-500 to-emerald-700',
  'The Survivor': 'from-yellow-500 to-amber-600'
};

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold">{score}/100</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${color} transition-all duration-1000`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export default function MoneyPlaybook() {
  const [, setLocation] = useLocation();
  const [showRetakeDialog, setShowRetakeDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userData } = useQuery({
    queryKey: ['/api/users/profile']
  });

  const { data: interviewData, isLoading } = useQuery<InterviewData>({
    queryKey: ['/api/ai/interview/latest']
  });

  const user = userData as any;
  const currentTier = user?.subscriptionTier || 'free';
  const hasLegacyAccess = user?.hasStartedTrial || user?.isPremium;
  const canGeneratePlaybook = currentTier === 'plus' || currentTier === 'pro' || hasLegacyAccess;

  const generatePlaybookMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/ai/interview/regenerate', {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/interview/latest'] });
      toast({ title: 'Your Money Playbook is ready!', description: 'Scroll down to see your personalized plan.' });
    },
    onError: () => {
      toast({ title: 'Generation failed', description: 'Please try again in a moment.', variant: 'destructive' });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  // User completed the interview but has no AI plan yet (upgraded after completing as free user)
  const interviewDoneButNoPlaybook = interviewData?.hasInterview && !interviewData.interview?.moneyPlaybook;

  if (!interviewData?.hasInterview || !interviewData.interview?.moneyPlaybook) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24">
        <TopNav title="My Money Playbook" />
        <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">

          {/* CTA Header */}
          <div className="text-center pt-2 pb-1">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Brain className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Your Money Playbook</h2>

            {interviewDoneButNoPlaybook && canGeneratePlaybook ? (
              <>
                <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
                  Your interview responses are saved. Generate your personalized AI plan now!
                </p>
                <Button
                  onClick={() => generatePlaybookMutation.mutate()}
                  disabled={generatePlaybookMutation.isPending}
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-7 h-11 rounded-xl shadow-sm"
                >
                  {generatePlaybookMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating your plan...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" />Generate My Playbook</>
                  )}
                </Button>
              </>
            ) : (
              <>
                <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
                  Complete the 5-minute Money Mind Interview to unlock your personalized money personality type and 30-day action plan.
                </p>
                <Button
                  onClick={() => setLocation('/coach/interview')}
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-7 h-11 rounded-xl shadow-sm"
                  data-testid="button-start-interview"
                >
                  Start the Interview
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}
          </div>

          {/* Blurred Preview */}
          <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            {/* Blur overlay */}
            <div className="absolute inset-0 z-10 backdrop-blur-sm bg-white/60 flex flex-col items-center justify-center gap-3">
              <div className="bg-white rounded-2xl shadow-md px-6 py-4 text-center max-w-xs">
                <Sparkles className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-gray-900 text-sm">Preview locked</p>
                <p className="text-xs text-gray-500 mt-1">Complete the interview to reveal your full Playbook</p>
              </div>
            </div>

            {/* Sample blurred content */}
            <div className="p-5 space-y-4 select-none pointer-events-none">
              {/* Personality card preview */}
              <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-5 text-white">
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-100 mb-1">Your Money Personality</div>
                <div className="text-2xl font-bold mb-1">The Planner</div>
                <div className="text-sm text-white/80">You approach finances with structure and foresight, but sometimes analysis paralysis can hold you back from acting.</div>
              </div>

              {/* Scores preview */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                <div className="font-semibold text-gray-800 text-sm">Your Financial Scores</div>
                {[
                  { label: 'Saving Habits', val: 72, color: 'bg-emerald-500' },
                  { label: 'Financial Awareness', val: 85, color: 'bg-emerald-400' },
                  { label: 'Spending Trigger Intensity', val: 48, color: 'bg-orange-400' },
                ].map((s, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{s.label}</span><span>{s.val}/100</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* 30-day plan preview */}
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="font-semibold text-gray-800 text-sm mb-3">Your 30-Day Action Plan</div>
                {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((w, i) => (
                  <div key={i} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{i+1}</div>
                    <div className="h-3 bg-gray-200 rounded-full flex-1" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
        <BottomNavigation user={user} />
      </div>
    );
  }

  const playbook = interviewData.interview.moneyPlaybook;
  const personalityIcon = personalityIcons[playbook.moneyPersonalityType] || '🧠';
  const personalityColor = personalityColors[playbook.moneyPersonalityType] || 'from-gray-500 to-slate-600';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24">
      <TopNav title="My Money Playbook" />
      
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Money Personality Type Hero */}
        <Card className={`bg-gradient-to-br ${personalityColor} text-white border-0 shadow-lg overflow-hidden`}>
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 text-8xl opacity-20 -mt-4 -mr-4">
              {personalityIcon}
            </div>
            <div className="relative z-10">
              <Badge className="bg-white/20 text-white hover:bg-white/30 mb-3">
                Your Money Personality
              </Badge>
              <h1 className="text-3xl font-bold mb-2">{playbook.moneyPersonalityType}</h1>
              <p className="text-white/90 text-sm leading-relaxed">
                {playbook.moneyPersonalityDescription}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Scores */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-black" />
              Your Financial Scores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScoreBar 
              label="Saving Habits" 
              score={playbook.scores?.savingHabitScore || 50} 
              color="bg-gradient-to-r from-emerald-400 to-green-500"
            />
            <ScoreBar 
              label="Financial Awareness" 
              score={playbook.scores?.financialAwarenessScore || 50} 
              color="bg-gradient-to-r from-emerald-400 to-indigo-500"
            />
            <ScoreBar 
              label="Spending Trigger Intensity" 
              score={playbook.scores?.spendingTriggerIntensity || 50} 
              color="bg-gradient-to-r from-orange-400 to-red-500"
            />
          </CardContent>
        </Card>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                <Sparkles className="w-5 h-5" />
                Your Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {playbook.strengths?.map((strength, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-green-900">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-5 h-5" />
                Your Weaknesses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {playbook.weaknesses?.map((weakness, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-200 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <span className="text-red-600 text-xs font-bold">{i + 1}</span>
                    </div>
                    <span className="text-sm text-red-900">{weakness}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Spending Triggers */}
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-orange-800">
              <Zap className="w-5 h-5" />
              Your Spending Triggers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {playbook.spendingTriggers?.map((trigger, i) => (
                <Badge key={i} variant="outline" className="bg-white border-orange-300 text-orange-800">
                  {trigger}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Core Money Values */}
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-purple-800">
              <Heart className="w-5 h-5" />
              Your Core Money Values
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {playbook.coreMoneyValues?.map((value, i) => (
                <Badge key={i} className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                  {value}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Root Money Insight */}
        <Card className="border-2 border-black">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Your Root Money Insight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed italic">
              "{playbook.rootMoneyInsight}"
            </p>
          </CardContent>
        </Card>

        {/* Purpose Statement */}
        <Card className="bg-gradient-to-br from-emerald-500 to-indigo-600 text-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <Target className="w-5 h-5" />
              Your Purpose Statement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/90 leading-relaxed">
              {playbook.purposeStatement}
            </p>
          </CardContent>
        </Card>

        {/* 30-Day Action Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-black" />
              Your 30-Day Action Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(playbook.thirtyDayPlan || {}).map(([week, tasks], weekIndex) => (
              <div key={week} className="space-y-2">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center">
                    {weekIndex + 1}
                  </span>
                  Week {weekIndex + 1}
                </h4>
                <ul className="space-y-2 ml-8">
                  {(tasks as string[])?.map((task, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-300 mt-2 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{task}</span>
                    </li>
                  ))}
                </ul>
                {weekIndex < 3 && <Separator className="my-3" />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Daily Habit */}
        <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <RefreshCw className="w-5 h-5" />
              Your Daily Habit (Next 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white text-lg font-medium">
              {playbook.dailyHabit}
            </p>
          </CardContent>
        </Card>

        {/* Weekly Focus */}
        <Card className="border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">This Week's Focus</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{playbook.weeklyFocus}</p>
          </CardContent>
        </Card>

        {/* Encouragement */}
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-lg">💪</span>
            </div>
            <p className="text-gray-700 italic">"{playbook.encouragement}"</p>
            <p className="text-sm text-gray-500 mt-2">— Money Mind</p>
          </CardContent>
        </Card>

        {/* Retake Interview */}
        <div className="text-center pt-4">
          <Button 
            variant="outline"
            onClick={() => setShowRetakeDialog(true)}
            className="border-gray-300"
            data-testid="button-retake-interview"
          >
            Retake Interview
          </Button>
          <p className="text-sm text-gray-500 mt-2">
            Life changes. Retake the interview anytime to update your playbook.
          </p>
        </div>
      </main>

      {/* Retake confirmation dialog */}
      <Dialog open={showRetakeDialog} onOpenChange={setShowRetakeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Retake the Interview?
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm text-gray-700">
              Retaking the interview will permanently replace your current Money Playbook and all of your previous responses. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowRetakeDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowRetakeDialog(false);
                setLocation('/coach/interview?confirmed=true');
              }}
            >
              Yes, Retake Interview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNavigation user={user} />
    </div>
  );
}
