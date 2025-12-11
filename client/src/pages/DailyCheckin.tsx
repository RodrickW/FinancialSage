import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Check, Flame, Brain, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'wouter';

interface DailyCheckinData {
  checkin: {
    id: number;
    moneyMindScore: number;
    habitCompleted: boolean;
    habitText: string;
    aiInsight: string;
    streak: number;
  };
  streak: number;
  isNew: boolean;
}

export default function DailyCheckin() {
  const [showCelebration, setShowCelebration] = useState(false);

  const { data, isLoading, error } = useQuery<DailyCheckinData>({
    queryKey: ['/api/daily-checkin']
  });

  const completeHabitMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/daily-checkin/complete-habit');
    },
    onSuccess: () => {
      setShowCelebration(true);
      queryClient.invalidateQueries({ queryKey: ['/api/daily-checkin'] });
      setTimeout(() => setShowCelebration(false), 2000);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-gray-600">Loading your daily check-in...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !data) {
    const errorMessage = (error as any)?.message || 'Something went wrong';
    const needsInterview = errorMessage.includes('Interview');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {needsInterview ? 'Complete Your Interview First' : 'Check-In Unavailable'}
            </h2>
            <p className="text-gray-600 mb-4">
              {needsInterview 
                ? 'Take the Money Mind Interview to unlock personalized daily check-ins.'
                : 'Unable to load your daily check-in. Please try again.'}
            </p>
            {needsInterview && (
              <Link href="/coach/interview">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Start Interview <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const { checkin, streak } = data;
  const scoreColor = checkin.moneyMindScore >= 80 
    ? 'text-emerald-600' 
    : checkin.moneyMindScore >= 60 
      ? 'text-yellow-600' 
      : 'text-orange-600';

  const scoreGradient = checkin.moneyMindScore >= 80
    ? 'from-emerald-500 to-teal-600'
    : checkin.moneyMindScore >= 60
      ? 'from-yellow-500 to-orange-500'
      : 'from-orange-500 to-red-500';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 pb-24" data-testid="daily-checkin-page">
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-emerald-500/20 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="bg-white rounded-2xl p-8 shadow-2xl text-center"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: 2, duration: 0.3 }}
              >
                <Check className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900">Habit Complete!</h3>
              <p className="text-gray-600 mt-2">Keep building momentum 💪</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-lg mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-4"
        >
          <p className="text-gray-500 text-sm uppercase tracking-wide">Daily Check-In</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className={`bg-gradient-to-br ${scoreGradient} p-6 text-white text-center`}>
              <p className="text-sm opacity-90 mb-1">Your Money Mind Score</p>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="text-6xl font-bold"
              >
                {checkin.moneyMindScore}
              </motion.div>
              <p className="text-sm opacity-75 mt-1">out of 100</p>
            </div>
            <CardContent className="p-4 bg-white">
              {streak > 1 && (
                <div className="flex items-center justify-center gap-2 text-orange-500 mb-2">
                  <Flame className="w-5 h-5" />
                  <span className="font-semibold">{streak} day streak!</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-md">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Today's Insight</p>
                  <p className="text-gray-800 font-medium leading-relaxed">
                    {checkin.aiInsight}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className={`border-2 ${checkin.habitCompleted ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'} shadow-md`}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  checkin.habitCompleted 
                    ? 'bg-emerald-500' 
                    : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                }`}>
                  {checkin.habitCompleted ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <Brain className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Today's Habit</p>
                  <p className={`font-medium leading-relaxed ${checkin.habitCompleted ? 'text-emerald-700 line-through' : 'text-gray-800'}`}>
                    {checkin.habitText}
                  </p>
                  
                  {!checkin.habitCompleted && (
                    <Button 
                      onClick={() => completeHabitMutation.mutate()}
                      disabled={completeHabitMutation.isPending}
                      className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700"
                      data-testid="button-complete-habit"
                    >
                      {completeHabitMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Mark as Done
                    </Button>
                  )}
                  
                  {checkin.habitCompleted && (
                    <p className="text-sm text-emerald-600 mt-2 font-medium">
                      ✓ Completed today!
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center pt-4"
        >
          <Link href="/money-playbook">
            <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              View Full Playbook <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}