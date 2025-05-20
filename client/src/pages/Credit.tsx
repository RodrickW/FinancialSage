import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Info, Award, TrendingUp, AlertTriangle, Lock, Eye, Calendar, Loader2 } from 'lucide-react';
import TopNav from '@/components/TopNav';
import BottomNavigation from '@/components/BottomNavigation';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface CreditFactor {
  name: string;
  impact: 'High' | 'Medium' | 'Low';
  status: string;
  score?: number;
}

interface CreditHistory {
  date: string;
  score: number;
}

interface CreditImprovement {
  title: string;
  description: string;
  impactLevel: 'high' | 'medium' | 'low';
  timeFrame: 'immediate' | 'short-term' | 'long-term';
}

interface CreditDetails {
  currentScore: {
    score: number;
    rating: string;
  };
  analysis: string;
  improvementSteps: CreditImprovement[];
  targetScore: {
    score: number;
    timeEstimate: string;
  };
  history?: CreditHistory[];
  factors?: CreditFactor[];
}

export default function Credit() {
  const { toast } = useToast();
  
  const { data: creditData, isLoading, refetch } = useQuery({
    queryKey: ['/api/ai/credit-score-analysis'],
    retry: false
  });

  const handleRefreshCredit = () => {
    toast({
      title: "Refreshing Credit Data",
      description: "Connecting to credit bureaus to get your latest score..."
    });
    refetch();
  };

  // Fallback data for demonstration purposes
  const fallbackUser = {
    id: 1,
    username: 'demo_user',
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo@example.com'
  };

  // Helper function to get color based on credit score
  const getCreditScoreColor = (score: number) => {
    if (score >= 750) return 'text-green-600';
    if (score >= 670) return 'text-blue-600';
    if (score >= 580) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Helper function to get background color based on credit score
  const getCreditScoreBgColor = (score: number) => {
    if (score >= 750) return 'bg-green-100';
    if (score >= 670) return 'bg-blue-100';
    if (score >= 580) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getImpactColor = (impact: string) => {
    if (impact === 'high' || impact === 'High') return 'bg-red-100 text-red-700';
    if (impact === 'medium' || impact === 'Medium') return 'bg-yellow-100 text-yellow-700';
    return 'bg-blue-100 text-blue-700';
  };

  const getTimeFrameColor = (timeFrame: string) => {
    if (timeFrame === 'immediate') return 'bg-green-100 text-green-700';
    if (timeFrame === 'short-term') return 'bg-blue-100 text-blue-700';
    return 'bg-purple-100 text-purple-700';
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-16">
      <TopNav title="Credit Score" />
      
      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary-600 mb-4" />
            <p className="text-neutral-600">Loading your credit information...</p>
          </div>
        ) : !creditData ? (
          <Card className="bg-white p-6 rounded-lg shadow-sm text-center">
            <div className="flex flex-col items-center justify-center py-8">
              <Lock className="h-12 w-12 text-neutral-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Credit Data Available</h3>
              <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                We need your permission to access your credit score information.
              </p>
              <Button onClick={() => refetch()} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                Connect Credit Account
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Credit Score Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="col-span-1 md:col-span-2 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Your Credit Score</h2>
                      <p className="text-blue-100">Last updated: {new Date().toLocaleDateString()}</p>
                    </div>
                    <Badge variant="outline" className="text-white border-white/30 bg-white/10">
                      {creditData.currentScore.rating}
                    </Badge>
                  </div>
                  
                  <div className="mt-6 flex items-end gap-3">
                    <div className="text-5xl font-bold">{creditData.currentScore.score}</div>
                    <div className="text-sm pb-1 text-blue-100">out of 850</div>
                  </div>
                  
                  <div className="mt-4">
                    <Progress value={(creditData.currentScore.score / 850) * 100} className="h-2 bg-white/20" />
                    <div className="flex justify-between mt-1 text-xs">
                      <span>Poor</span>
                      <span>Fair</span>
                      <span>Good</span>
                      <span>Very Good</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <h3 className="font-medium mb-2">Analysis</h3>
                  <p className="text-neutral-700">{creditData.analysis}</p>
                  
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm text-neutral-500">Target Score</h4>
                        <div className="flex items-center">
                          <span className="text-xl font-medium mr-2">{creditData.targetScore.score}</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {creditData.targetScore.timeEstimate}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="text-primary-600">
                        <Eye className="h-4 w-4 mr-1" /> Credit Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Award className="h-5 w-5 mr-2 text-primary-500" />
                    Impact Factors
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(creditData.factors || []).map((factor, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{factor.name}</span>
                        <Badge className={getImpactColor(factor.impact)}>
                          {factor.impact} impact
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-600">{factor.status}</span>
                        {factor.score && <span className={getCreditScoreColor(factor.score)}>{factor.score}</span>}
                      </div>
                      <Separator className="mt-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            
            {/* Improvement Steps */}
            <Tabs defaultValue="improvements" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="improvements">Improvement Steps</TabsTrigger>
                <TabsTrigger value="history">Score History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="improvements" className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-primary-500" />
                  Recommended Actions
                </h3>
                
                {creditData.improvementSteps.map((step, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                          {i + 1}
                        </div>
                        <div>
                          <div className="flex items-center flex-wrap gap-2 mb-1">
                            <h4 className="font-medium">{step.title}</h4>
                            <div className="flex gap-1">
                              <Badge className={getImpactColor(step.impactLevel)}>
                                {step.impactLevel} impact
                              </Badge>
                              <Badge className={getTimeFrameColor(step.timeFrame)}>
                                {step.timeFrame}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-neutral-600">{step.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-primary-500" />
                      Score Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(creditData.history && creditData.history.length > 0) ? (
                      <div className="space-y-4">
                        {creditData.history.map((item, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-neutral-600">{item.date}</span>
                            <div className="flex items-center">
                              <span className={`font-medium ${getCreditScoreColor(item.score)}`}>{item.score}</span>
                              <div className={`ml-2 w-3 h-3 rounded-full ${getCreditScoreBgColor(item.score)}`}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
                        <h4 className="font-medium mb-1">No History Available</h4>
                        <p className="text-neutral-500 text-sm">Score history will appear here once we have sufficient data.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            {/* Educational Section */}
            <Card className="bg-gradient-to-r from-indigo-50 to-blue-50">
              <CardContent className="p-6">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-primary-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium mb-1">Understanding Your Credit Score</h3>
                    <p className="text-neutral-700 text-sm">
                      Your credit score is a number that represents your creditworthiness. It's based on your credit history and helps lenders determine the risk of lending money to you. Scores typically range from 300 to 850, with higher scores indicating better credit.
                    </p>
                    <Button variant="link" className="text-primary-600 p-0 h-auto mt-2">
                      Learn more about credit scores
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      
      <BottomNavigation user={fallbackUser} />
    </div>
  );
}