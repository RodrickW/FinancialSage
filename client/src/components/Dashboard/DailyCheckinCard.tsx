import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Flame, ChevronRight, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';

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

export default function DailyCheckinCard() {
  const { data, isLoading, error } = useQuery<DailyCheckinData>({
    queryKey: ['/api/daily-checkin'],
    retry: false
  });

  if (isLoading) {
    return (
      <Card className="mb-6 border-0 shadow-md overflow-hidden animate-pulse">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-48" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    const needsInterview = (error as any)?.message?.includes('Interview');
    
    if (needsInterview) {
      return (
        <Link href="/coach/interview">
          <Card className="mb-6 border-2 border-dashed border-emerald-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                  <Brain className="w-7 h-7 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Unlock Daily Check-Ins</p>
                  <p className="text-sm text-gray-500">Complete the Money Mind Interview</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>
      );
    }
    
    return null;
  }

  if (!data) return null;

  const { checkin, streak } = data;
  const scoreColor = checkin.moneyMindScore >= 80 
    ? 'from-emerald-500 to-teal-600' 
    : checkin.moneyMindScore >= 60 
      ? 'from-yellow-500 to-orange-500' 
      : 'from-orange-500 to-red-500';

  return (
    <Link href="/daily-checkin">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="mb-6 border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden" data-testid="card-daily-checkin">
          <div className={`h-1 bg-gradient-to-r ${scoreColor}`} />
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 bg-gradient-to-br ${scoreColor} rounded-full flex items-center justify-center relative`}>
                <span className="text-white font-bold text-lg">{checkin.moneyMindScore}</span>
                {streak > 1 && (
                  <div className="absolute -top-1 -right-1 bg-orange-500 rounded-full p-1">
                    <Flame className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">Daily Check-In</p>
                  {streak > 1 && (
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                      {streak} day streak
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-500 flex-shrink-0" />
                  {checkin.aiInsight}
                </p>
              </div>
              
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </div>
            
            {!checkin.habitCompleted && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Today's habit awaits: {checkin.habitText.substring(0, 50)}...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}