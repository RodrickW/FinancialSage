import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Brain, TrendingUp, TrendingDown, AlertTriangle, Target, Star, ChevronDown, ChevronUp, Clock, Zap, Eye } from 'lucide-react';
import { UserProfile } from '@/types';

interface AIInsightsProps {
  user: UserProfile;
}

interface AIInsight {
  type: 'alert' | 'opportunity' | 'achievement' | 'warning' | 'predictive';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  action: string;
  icon: 'trending_up' | 'trending_down' | 'savings' | 'warning' | 'celebration' | 'clock' | 'zap';
}

interface AIInsightsResponse {
  insights: AIInsight[];
  summary: string;
}

export default function AIInsights({ user }: AIInsightsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
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
      case 'clock':
        return <Clock className="w-5 h-5" />;
      case 'zap':
        return <Zap className="w-5 h-5" />;
      case 'savings':
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  const getColorForType = (type: string, priority: string) => {
    switch (type) {
      case 'predictive':
        return 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300 text-purple-900 shadow-sm';
      case 'warning':
        return priority === 'high' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-orange-50 border-orange-200 text-orange-800';
      case 'opportunity':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'achievement':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'alert':
        return priority === 'high' ? 'bg-purple-50 border-purple-200 text-purple-800' : 'bg-gray-50 border-gray-200 text-gray-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  // Count predictive alerts for special badge
  const predictiveCount = aiInsights?.insights?.filter(i => i.type === 'predictive').length || 0;
  
  // Render collapsible button
  const renderButton = () => (
    <Button
      onClick={() => setIsExpanded(!isExpanded)}
      className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white font-medium py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
      size="lg"
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            {predictiveCount > 0 ? <Eye className="w-4 h-4 text-white" /> : <Brain className="w-4 h-4 text-white" />}
          </div>
          <span className="text-lg">
            {predictiveCount > 0 ? "Money Mind is Watching Your Money" : "Click Here for Personalized AI Insights"}
          </span>
          {!isLoading && predictiveCount > 0 && (
            <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 animate-pulse">
              {predictiveCount} alert{predictiveCount > 1 ? 's' : ''}
            </Badge>
          )}
          {!isLoading && predictiveCount === 0 && (aiInsights?.insights?.length ?? 0) > 0 && (
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              {aiInsights?.insights?.length ?? 0} insights
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>
    </Button>
  );

  if (isLoading) {
    return (
      <div className="mb-6">
        {renderButton()}
        {isExpanded && (
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 mt-3 animate-in slide-in-from-top-2 duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-gray-600">Analyzing your financial data...</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (error || !aiInsights?.insights?.length) {
    return (
      <div className="mb-6">
        {renderButton()}
        {isExpanded && (
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 mt-3 animate-in slide-in-from-top-2 duration-300">
            <CardContent className="pt-6">
              <div className="text-center py-4">
                <p className="text-gray-600 mb-4">
                  Connect your bank accounts to receive personalized AI insights about your spending patterns and financial opportunities.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="mb-6">
      {renderButton()}
      {isExpanded && (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 mt-3 animate-in slide-in-from-top-2 duration-300">
          <CardContent className="pt-6">
            {/* AI Summary */}
            {aiInsights.summary && (
              <div className="mb-6 p-4 bg-white/60 rounded-lg border border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
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
                  className={`p-4 rounded-lg border ${getColorForType(insight.type, insight.priority)} ${
                    insight.type === 'predictive' ? 'ring-2 ring-purple-200 ring-offset-1' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${
                        insight.type === 'predictive' 
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white' 
                          : `${getColorForType(insight.type, insight.priority)} bg-opacity-20`
                      }`}>
                        {insight.type === 'predictive' ? <Eye className="w-5 h-5" /> : getIconForInsight(insight.icon)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-semibold text-sm">{insight.title}</h4>
                          {insight.type === 'predictive' && (
                            <Badge 
                              variant="secondary" 
                              className="text-xs px-2 py-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 animate-pulse"
                            >
                              👁️ WATCHING
                            </Badge>
                          )}
                          {insight.type !== 'predictive' && (
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
                          )}
                        </div>
                        <p className="text-sm mb-2 opacity-90">
                          {insight.message}
                        </p>
                        {insight.action && (
                          <p className={`text-xs font-medium ${insight.type === 'predictive' ? 'text-purple-700' : ''}`}>
                            {insight.type === 'predictive' ? '⚡' : '💡'} {insight.action}
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
      )}
    </div>
  );
}
