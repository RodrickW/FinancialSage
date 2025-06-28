import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';
import BottomNavigation from '@/components/BottomNavigation';
import TrialGate from '@/components/TrialGate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { UserProfile } from '@/types';
import { Loader2, MessageCircle, Target, TrendingUp } from 'lucide-react';
import { mockUserProfile } from '@/lib/utils/mockData';

export default function FinancialCoach() {
  const [selectedTab, setSelectedTab] = useState('budget');
  const [aiQuestion, setAiQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const [showPersonalizedPlan, setShowPersonalizedPlan] = useState(false);
  const [interviewResponses, setInterviewResponses] = useState<any>(null);

  // Get the user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/users/profile']
  });

  // Get budget recommendations
  const { data: budgetData, isLoading: budgetLoading } = useQuery({
    queryKey: ['/api/ai/budget-recommendations'],
    enabled: selectedTab === 'budget'
  });

  // Get credit score analysis
  const { data: creditData, isLoading: creditLoading } = useQuery({
    queryKey: ['/api/ai/credit-score-analysis'],
    enabled: selectedTab === 'credit'
  });

  // Get comprehensive financial health report
  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['/api/ai/financial-health'],
    enabled: selectedTab === 'health'
  });

  const user = userData || mockUserProfile;

  // Check if we should show personalized plan from interview
  useEffect(() => {
    const shouldShowPlan = localStorage.getItem('showPersonalizedPlan') === 'true';
    const storedResponses = localStorage.getItem('interviewResponses');
    
    if (shouldShowPlan && storedResponses) {
      setShowPersonalizedPlan(true);
      setInterviewResponses(JSON.parse(storedResponses));
      // Clear the flags after showing
      localStorage.removeItem('showPersonalizedPlan');
      localStorage.removeItem('interviewResponses');
    }
  }, []);

  const handleAskQuestion = async () => {
    if (!aiQuestion.trim()) return;
    
    setIsAsking(true);
    setAnswer(null);
    
    try {
      const response = await fetch('/api/ai/coaching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: aiQuestion }),
      });
      
      const data = await response.json();
      setAnswer(data.answer);
    } catch (error) {
      console.error('Error asking question:', error);
      setAnswer('Sorry, I encountered an error while processing your question. Please try again later.');
    } finally {
      setIsAsking(false);
    }
  };

  const renderBudgetTab = () => {
    if (budgetLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-4" />
          <p>Analyzing your spending patterns and generating budget recommendations...</p>
        </div>
      );
    }

    if (!budgetData || !budgetData.recommendations) {
      return (
        <div className="p-6 text-center">
          <p>No budget data available. Try connecting your accounts first.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-4">
              <span className="text-white text-lg font-bold">MM</span>
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Money Mind's Budget Analysis</h3>
              <p className="text-sm text-neutral-600">Personalized budget recommendations</p>
            </div>
          </div>
          <p className="text-neutral-700">{budgetData.summary}</p>
          {budgetData.savingsRecommendation && (
            <div className="mt-3">
              <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Savings Tip</Badge>
              <p className="mt-1 text-sm text-neutral-600">{budgetData.savingsRecommendation}</p>
            </div>
          )}
        </div>

        <h3 className="text-lg font-medium">Category Recommendations</h3>
        <div className="space-y-4">
          {budgetData.recommendations.map((rec: any, i: number) => (
            <Card key={i} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="p-4 md:p-6 flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{rec.category}</h4>
                    <Badge
                      className={
                        rec.currentSpending > rec.recommendedBudget
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }
                    >
                      {rec.percentOfIncome}% of Income
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current: ${rec.currentSpending.toFixed(2)}</span>
                      <span>Recommended: ${rec.recommendedBudget.toFixed(2)}</span>
                    </div>
                    <Progress 
                      value={(rec.currentSpending / rec.recommendedBudget) * 100} 
                      className={
                        rec.currentSpending > rec.recommendedBudget
                          ? 'bg-red-100'
                          : 'bg-green-100'
                      }
                    />
                  </div>
                  <p className="mt-3 text-sm text-neutral-600">{rec.reasoning}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderCreditTab = () => {
    if (creditLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-4" />
          <p>Analyzing your credit score and generating improvement recommendations...</p>
        </div>
      );
    }

    if (!creditData || !creditData.currentScore) {
      return (
        <div className="p-6 text-center">
          <p>No credit score data available. Please connect your accounts to import your credit score.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="col-span-1 md:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-lg font-bold">MM</span>
                </div>
                <div>
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Money Mind's Credit Analysis</CardTitle>
                  <p className="text-sm text-neutral-600">Smart insights to boost your credit score</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-2">
                <div className="text-4xl font-bold mr-3">{creditData.currentScore.score}</div>
                <Badge className="text-white bg-primary-500">{creditData.currentScore.rating}</Badge>
              </div>
              <p className="text-neutral-700">{creditData.analysis}</p>
              <div className="mt-3">
                <div className="text-sm text-neutral-500">Target Score</div>
                <div className="flex items-center">
                  <span className="text-lg font-medium mr-2">{creditData.targetScore.score}</span>
                  <span className="text-sm text-neutral-600">
                    Estimated time: {creditData.targetScore.timeEstimate}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Impact Factors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {creditData.improvementSteps.slice(0, 3).map((step: any, i: number) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{step.title}</span>
                    <Badge
                      className={
                        step.impactLevel === 'high'
                          ? 'bg-red-100 text-red-700'
                          : step.impactLevel === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-blue-100 text-blue-700'
                      }
                    >
                      {step.impactLevel} impact
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <h3 className="text-lg font-medium mt-6">Improvement Steps</h3>
        <div className="space-y-4">
          {creditData.improvementSteps.map((step: any, i: number) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center mr-3 mt-1">
                    {i + 1}
                  </div>
                  <div>
                    <div className="flex items-center mb-1">
                      <h4 className="font-medium mr-2">{step.title}</h4>
                      <Badge
                        className={
                          step.timeFrame === 'immediate'
                            ? 'bg-green-100 text-green-700'
                            : step.timeFrame === 'short-term'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }
                      >
                        {step.timeFrame}
                      </Badge>
                    </div>
                    <p className="text-neutral-600">{step.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderHealthTab = () => {
    if (healthLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-4" />
          <p>Analyzing your overall financial health...</p>
        </div>
      );
    }

    if (!healthData || !healthData.overallHealth) {
      return (
        <div className="p-6 text-center">
          <p>No financial health data available. Try connecting your accounts first.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">Financial Health Score</h3>
                <div className="flex items-center">
                  <div className="text-4xl font-bold mr-3">{healthData.overallHealth.score}/100</div>
                  <Badge className="text-white bg-primary-500">{healthData.overallHealth.rating}</Badge>
                </div>
              </div>
              <div className="mt-4 md:mt-0 md:ml-4 p-4 bg-white rounded-lg">
                <h4 className="text-sm font-medium text-neutral-500 mb-1">Long-term Outlook</h4>
                <p className="text-neutral-700">{healthData.longTermOutlook}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Strengths</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {healthData.strengths.map((strength: string, i: number) => (
                  <li key={i} className="flex items-center">
                    <span className="mr-2 text-green-500">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Areas for Improvement</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {healthData.weaknesses.map((weakness: string, i: number) => (
                  <li key={i} className="flex items-center">
                    <span className="mr-2 text-red-500">!</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <h3 className="text-lg font-medium mt-6">Personalized Recommendations</h3>
        <div className="space-y-4">
          {healthData.recommendations.map((rec: any, i: number) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-1 ${
                      rec.priority === 'high' 
                        ? 'bg-red-100 text-red-700' 
                        : rec.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {rec.priority === 'high' ? '!' : rec.priority === 'medium' ? '>' : 'i'}
                  </div>
                  <div>
                    <div className="flex items-center mb-1">
                      <h4 className="font-medium mr-2">{rec.area}</h4>
                      <Badge
                        className={
                          rec.priority === 'high'
                            ? 'bg-red-100 text-red-700'
                            : rec.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }
                      >
                        {rec.priority} priority
                      </Badge>
                    </div>
                    <p className="text-neutral-600">{rec.recommendation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderAskTab = () => {
    return (
      <div className="space-y-6">
        {/* Interview Starter Card */}
        <Card className="bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-200">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center mr-4">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">Get Your Personalized Financial Plan</h3>
                <p className="text-sm text-gray-600">Let Money Mind understand your unique goals</p>
              </div>
            </div>
            <p className="text-gray-700 mb-4">
              Ready to transform your financial future? Take our quick 5-minute interview to get personalized recommendations tailored just for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Target className="w-4 h-4 mr-2 text-teal-500" />
                Personalized goal setting
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <TrendingUp className="w-4 h-4 mr-2 text-teal-500" />
                Custom budget recommendations
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MessageCircle className="w-4 h-4 mr-2 text-teal-500" />
                AI-powered insights
              </div>
            </div>
            <Button 
              onClick={() => setLocation('/coach/interview')}
              className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white"
            >
              Start Financial Interview
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-4">
                <span className="text-white text-lg font-bold">MM</span>
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Ask Money Mind</h3>
                <p className="text-sm text-neutral-600">Get instant answers to your financial questions</p>
              </div>
            </div>
            <p className="text-neutral-600 mb-4">
              Have a specific financial question? I'm here to help with personalized advice based on your unique situation.
            </p>
            <div className="flex items-start">
              <textarea
                className="flex-1 p-3 border border-neutral-200 rounded-lg min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="For example: How can I save more money each month? Should I pay off my credit card debt or build an emergency fund first? How much should I budget for groceries?"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
              ></textarea>
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                onClick={handleAskQuestion}
                disabled={isAsking || !aiQuestion.trim()}
                className="bg-primary-500 hover:bg-primary-600"
              >
                {isAsking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Thinking...
                  </>
                ) : (
                  'Get Advice'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {answer && (
          <Card>
            <CardHeader>
              <CardTitle>AI Financial Coach Response</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-line">{answer}</div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Suggested Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "How can I improve my credit score?",
                "Should I pay off debt or invest first?",
                "How much should I save for emergencies?",
                "How can I reduce my monthly expenses?",
                "Is it better to rent or buy a home?",
                "How do I start investing with little money?"
              ].map((question, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="justify-start h-auto py-3 overflow-hidden"
                  onClick={() => setAiQuestion(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-neutral-50">
      <Sidebar user={user} />
      
      <main className="flex-1 overflow-x-hidden pb-16 md:pb-0">
        <BottomNavigation user={user} />
        <TopNav title="Financial Coach" />
        
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">AI Financial Coach</h1>
            <p className="text-neutral-600">
              Get personalized financial advice, budget recommendations, and credit improvement strategies based on your data.
            </p>
          </div>
          
          <TrialGate feature="AI Financial Coach" hasStartedTrial={user?.hasStartedTrial || user?.isPremium || !userData}>
            <Tabs 
              defaultValue="budget" 
              value={selectedTab} 
              onValueChange={setSelectedTab}
              className="space-y-6"
            >
              <TabsList className="mb-2">
                <TabsTrigger value="budget">Budget Analysis</TabsTrigger>
                <TabsTrigger value="credit">Credit Score</TabsTrigger>
                <TabsTrigger value="health">Financial Health</TabsTrigger>
                <TabsTrigger value="ask">Ask Coach</TabsTrigger>
              </TabsList>
              
              <div className="p-1">
                <TabsContent value="budget" className="mt-0">
                  {renderBudgetTab()}
                </TabsContent>
                
                <TabsContent value="credit" className="mt-0">
                  {renderCreditTab()}
                </TabsContent>
                
                <TabsContent value="health" className="mt-0">
                  {renderHealthTab()}
                </TabsContent>
                
                <TabsContent value="ask" className="mt-0">
                  {renderAskTab()}
                </TabsContent>
              </div>
            </Tabs>
          </TrialGate>
        </div>
      </main>
    </div>
  );
}