import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Share2, Download, Sparkles, Trophy, Star, Flame } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TransformationMoment {
  id: number;
  momentType: string;
  title: string;
  quote: string;
  statLabel: string;
  statValue: string;
  dayNumber: number;
  isShared: boolean;
  createdAt: string;
}

const momentIcons: Record<string, typeof Trophy> = {
  milestone: Star,
  weekly_win: Sparkles,
  streak_achievement: Flame,
  completion: Trophy
};

const momentColors: Record<string, string> = {
  milestone: 'from-blue-500 to-purple-500',
  weekly_win: 'from-emerald-500 to-teal-500',
  streak_achievement: 'from-orange-500 to-red-500',
  completion: 'from-yellow-500 to-amber-500'
};

export default function TransformationMoments() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ moments: TransformationMoment[] }>({
    queryKey: ['/api/money-reset/moments'],
  });

  const handleShare = async (moment: TransformationMoment) => {
    const shareText = `🎉 ${moment.title}\n\n"${moment.quote}"\n\n${moment.statLabel}: ${moment.statValue}\n\n#30DayMoneyReset #MindMyMoney #FinancialTransformation`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: moment.title,
          text: shareText,
        });
        toast({ title: 'Shared!', description: 'Your transformation moment has been shared.' });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard(shareText);
        }
      }
    } else {
      copyToClipboard(shareText);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Share text copied to clipboard.' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const moments = data?.moments || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 pb-24">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/money-reset')}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Transformation Moments</h1>
            <p className="text-sm text-gray-600">Your shareable wins from the 30-Day Reset</p>
          </div>
        </div>

        {moments.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No moments yet</h3>
              <p className="text-gray-500 mb-4">Complete milestones to unlock shareable transformation moments!</p>
              <Button onClick={() => navigate('/money-reset')} data-testid="button-go-to-reset">
                Continue Your Reset
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {moments.map((moment) => {
              const MomentIcon = momentIcons[moment.momentType] || Star;
              const gradientClass = momentColors[moment.momentType] || 'from-purple-500 to-pink-500';
              
              return (
                <Card 
                  key={moment.id} 
                  className="overflow-hidden shadow-lg"
                  data-testid={`card-moment-${moment.id}`}
                >
                  {/* Shareable Card Design */}
                  <div className={`bg-gradient-to-br ${gradientClass} p-6 text-white`}>
                    <div className="flex items-center gap-2 mb-4">
                      <MomentIcon className="w-6 h-6" />
                      <Badge className="bg-white/20 text-white border-white/30 capitalize">
                        {moment.momentType.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-3">{moment.title}</h3>
                    
                    <blockquote className="text-lg italic opacity-95 mb-4 border-l-2 border-white/50 pl-4">
                      "{moment.quote}"
                    </blockquote>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm opacity-80">{moment.statLabel}</span>
                        <div className="text-3xl font-bold">{moment.statValue}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm opacity-80">Day</span>
                        <div className="text-2xl font-bold">{moment.dayNumber}</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
                      <span className="text-sm opacity-80">Mind My Money</span>
                      <span className="text-sm opacity-80">#30DayMoneyReset</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <CardContent className="p-4 bg-white">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleShare(moment)}
                        className="flex-1 bg-gradient-to-r from-primary to-primary/80"
                        data-testid={`button-share-${moment.id}`}
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share to Social
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard(`"${moment.quote}" - Day ${moment.dayNumber} of my #30DayMoneyReset`)}
                        data-testid={`button-copy-${moment.id}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* TikTok Tips */}
        <Card className="mt-6 border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50">
          <CardContent className="p-4">
            <h4 className="font-semibold text-pink-800 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              TikTok Creator Tips
            </h4>
            <ul className="text-sm text-pink-700 space-y-1">
              <li>• Screenshot your moment cards for Stories</li>
              <li>• Use the quote as your video caption</li>
              <li>• Tag #30DayMoneyReset for community</li>
              <li>• Share your journey - it inspires others!</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
