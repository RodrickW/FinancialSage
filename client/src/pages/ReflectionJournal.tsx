import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, BookOpen, Calendar, Brain, Heart, 
  Sparkles, MessageSquare, Clock, ChevronDown, ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

interface MissionReflection {
  id: number;
  day: number;
  title: string;
  missionType: string;
  reflection: string;
  completedAt: string;
  missionDate: string;
}

interface WeeklyReflectionData {
  id: number;
  weekNumber: number;
  userResponses: Record<string, string>;
  aiCoachingResponse: string;
  weeklyStats: any;
  completedAt: string;
}

interface ReflectionsData {
  missionReflections: MissionReflection[];
  weeklyReflections: WeeklyReflectionData[];
}

const missionTypeColors: Record<string, string> = {
  detox: 'bg-orange-100 text-orange-700 border-orange-200',
  habit: 'bg-blue-100 text-blue-700 border-blue-200',
  identity: 'bg-purple-100 text-purple-700 border-purple-200',
  action: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  reflection: 'bg-pink-100 text-pink-700 border-pink-200'
};

const weekNames: Record<number, string> = {
  1: 'The Mirror',
  2: 'The Detox',
  3: 'The Rewire',
  4: 'The New You'
};

export default function ReflectionJournal() {
  const [, navigate] = useLocation();
  const [expandedWeekly, setExpandedWeekly] = useState<number | null>(null);

  const { data, isLoading } = useQuery<ReflectionsData>({
    queryKey: ['/api/money-reset/reflections'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const hasReflections = (data?.missionReflections?.length || 0) > 0 || (data?.weeklyReflections?.length || 0) > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 pb-24">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/money-reset')}
          className="mb-4 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          data-testid="button-back-reset"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Challenge
        </Button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            My Reflection Journal
          </h1>
          <p className="text-gray-600">
            Your thoughts and insights from the 30-Day Money Reset
          </p>
        </div>

        {!hasReflections ? (
          <Card className="text-center py-12">
            <CardContent>
              <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No reflections yet</h3>
              <p className="text-gray-500 mb-4">
                Complete missions and share your thoughts to build your reflection journal.
              </p>
              <Button onClick={() => navigate('/money-reset')} className="bg-emerald-600 hover:bg-emerald-700">
                Go to Challenge
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="daily" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="daily" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Daily Thoughts ({data?.missionReflections?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="weekly" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Weekly Insights ({data?.weeklyReflections?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-4">
              {data?.missionReflections?.length === 0 ? (
                <Card className="text-center py-8">
                  <CardContent>
                    <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No daily reflections yet. Share your thoughts when completing missions!</p>
                  </CardContent>
                </Card>
              ) : (
                data?.missionReflections?.map((reflection) => (
                  <Card key={reflection.id} className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={missionTypeColors[reflection.missionType] || 'bg-gray-100 text-gray-700'}>
                              Day {reflection.day}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {reflection.missionType}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-gray-900">{reflection.title}</h3>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {reflection.completedAt && format(new Date(reflection.completedAt), 'MMM d')}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <p className="text-gray-700 italic">"{reflection.reflection}"</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="weekly" className="space-y-4">
              {data?.weeklyReflections?.length === 0 ? (
                <Card className="text-center py-8">
                  <CardContent>
                    <Brain className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No weekly reflections yet. Complete your weekly check-ins!</p>
                  </CardContent>
                </Card>
              ) : (
                data?.weeklyReflections?.map((reflection) => (
                  <Card key={reflection.id} className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200 mb-2">
                            Week {reflection.weekNumber}: {weekNames[reflection.weekNumber] || 'Reflection'}
                          </Badge>
                          <CardTitle className="text-lg">Weekly Reflection</CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedWeekly(expandedWeekly === reflection.id ? null : reflection.id)}
                          data-testid={`button-expand-week-${reflection.weekNumber}`}
                        >
                          {expandedWeekly === reflection.id ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    
                    {expandedWeekly === reflection.id && (
                      <CardContent className="space-y-4">
                        {reflection.userResponses && Object.entries(reflection.userResponses).map(([key, value]) => (
                          <div key={key} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <p className="text-gray-700">"{value}"</p>
                          </div>
                        ))}
                        
                        {reflection.aiCoachingResponse && (
                          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="w-4 h-4 text-emerald-600" />
                              <span className="font-semibold text-emerald-800">Money Mind's Coaching</span>
                            </div>
                            <p className="text-gray-700 text-sm whitespace-pre-line">{reflection.aiCoachingResponse}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          {reflection.completedAt && format(new Date(reflection.completedAt), 'MMMM d, yyyy')}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
