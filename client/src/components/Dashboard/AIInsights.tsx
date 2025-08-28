import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Brain, TrendingUp, TrendingDown, AlertTriangle, Target, Star } from 'lucide-react';
import { UserProfile } from '@/types';

interface AIInsightsProps {
  user: UserProfile;
}

interface AIInsight {
  type: 'alert' | 'opportunity' | 'achievement' | 'warning';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  action: string;
  icon: 'trending_up' | 'trending_down' | 'savings' | 'warning' | 'celebration';
}

interface AIInsightsResponse {
  insights: AIInsight[];
  summary: string;
}

export default function AIInsights({ user }: AIInsightsProps) {
  const { data: aiInsights, isLoading, error } = useQuery<AIInsightsResponse>({
    queryKey: ['/api/ai/proactive-insights'],
    retry: false,
  });

  const getIconForInsight = (iconName: string) => {
    switch (iconName) {
      case 'trending_up':
        return <TrendingUp className="w-5 h-5" />;
      case 'trending_down':
        return <TrendingDown className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'celebration':
        return <Star className="w-5 h-5" />;
      case 'savings':
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  const getColorForType = (type: string, priority: string) => {
    switch (type) {
      case 'warning':
        return priority === 'high' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-orange-50 border-orange-200 text-orange-800';
      case 'opportunity':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'achievement':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'alert':
        return priority === 'high' ? 'bg-purple-50 border-purple-200 text-purple-800' : 'bg-gray-50 border-gray-200 text-gray-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            Money Mind Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
            <span className="ml-2 text-gray-600">Analyzing your financial data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !aiInsights?.insights?.length) {
    return (
      <Card className="bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            Money Mind Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">
              Connect your bank accounts to receive personalized AI insights about your spending patterns and financial opportunities.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Money Mind Insights
            </span>
          </div>
          <Badge variant="secondary" className="bg-white/50 text-teal-700 border-teal-200">
            {aiInsights.insights.length} insights
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* AI Summary */}
        {aiInsights.summary && (
          <div className="mb-6 p-4 bg-white/60 rounded-lg border border-teal-100">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                <span className="text-white text-xs font-bold">MM</span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                {aiInsights.summary}
              </p>
            </div>
          </div>
        )}

        {/* AI Insights */}
        <div className="space-y-3">
          {aiInsights.insights.map((insight, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getColorForType(insight.type, insight.priority)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${getColorForType(insight.type, insight.priority)} bg-opacity-20`}>
                    {getIconForInsight(insight.icon)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs px-2 py-0 ${
                          insight.priority === 'high' 
                            ? 'bg-red-100 text-red-700' 
                            : insight.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {insight.priority}
                      </Badge>
                    </div>
                    <p className="text-sm mb-2 opacity-90">
                      {insight.message}
                    </p>
                    {insight.action && (
                      <p className="text-xs font-medium">
                        💡 {insight.action}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
