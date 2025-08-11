import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';
import BottomNavigation from '@/components/BottomNavigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { UserProfile } from '@/types';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, TrendingDown, Target, Clock, CheckCircle, AlertTriangle, DollarSign, Calendar, CreditCard, Shield, BarChart3, Search } from 'lucide-react';

const creditInterviewSchema = z.object({
  currentScore: z.string().min(1, "Current score is required"),
  goalScore: z.string().min(1, "Goal score is required"),
  paymentHistory: z.string().min(1, "Payment history is required"),
  creditUtilization: z.string().min(1, "Credit utilization is required"),
  creditHistoryLength: z.string().min(1, "Credit history length is required"),
  creditMix: z.string().min(1, "Credit mix is required"),
  newCreditInquiries: z.string().min(1, "Number of inquiries is required"),
  totalCreditLimit: z.string().min(1, "Total credit limit is required"),
  totalCreditBalance: z.string().min(1, "Total credit balance is required"),
  monthlyIncome: z.string().min(1, "Monthly income is required"),
  hasCollections: z.boolean().default(false),
  hasBankruptcy: z.boolean().default(false),
  hasForeclosure: z.boolean().default(false)
});

type CreditInterviewFormData = z.infer<typeof creditInterviewSchema>;

interface CreditAssessment {
  id: number;
  currentScore: number;
  goalScore: number;
  paymentHistory: string;
  creditUtilization: number;
  creditHistoryLength: number;
  creditMix: string;
  newCreditInquiries: number;
  totalCreditLimit: number;
  totalCreditBalance: number;
  monthlyIncome: number;
  hasCollections: boolean;
  hasBankruptcy: boolean;
  hasForeclosure: boolean;
  improvementPlan?: any;
  createdAt: string;
}

export default function Credit() {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  
  // Get user profile for sidebar
  const { data: user } = useQuery<UserProfile>({
    queryKey: ['/api/users/profile']
  });

  // Get existing credit assessment
  const { data: creditAssessment, isLoading: assessmentLoading } = useQuery<CreditAssessment>({
    queryKey: ['/api/credit/assessment'],
    enabled: !!user
  });

  // Get credit score factors if assessment exists
  const { data: creditFactors } = useQuery({
    queryKey: ['/api/credit/factors', creditAssessment?.id],
    enabled: !!creditAssessment?.id
  });

  const form = useForm<CreditInterviewFormData>({
    resolver: zodResolver(creditInterviewSchema),
    defaultValues: {
      currentScore: creditAssessment?.currentScore?.toString() || "",
      goalScore: creditAssessment?.goalScore?.toString() || "",
      paymentHistory: creditAssessment?.paymentHistory || "",
      creditUtilization: creditAssessment?.creditUtilization?.toString() || "",
      creditHistoryLength: creditAssessment?.creditHistoryLength?.toString() || "",
      creditMix: creditAssessment?.creditMix || "",
      newCreditInquiries: creditAssessment?.newCreditInquiries?.toString() || "",
      totalCreditLimit: creditAssessment?.totalCreditLimit?.toString() || "",
      totalCreditBalance: creditAssessment?.totalCreditBalance?.toString() || "",
      monthlyIncome: creditAssessment?.monthlyIncome?.toString() || "",
      hasCollections: creditAssessment?.hasCollections || false,
      hasBankruptcy: creditAssessment?.hasBankruptcy || false,
      hasForeclosure: creditAssessment?.hasForeclosure || false
    }
  });

  const createAssessmentMutation = useMutation({
    mutationFn: async (data: CreditInterviewFormData) => {
      const response = await apiRequest('POST', '/api/credit/assessment', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Credit Assessment Complete!",
        description: "Your personalized improvement plan has been generated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/credit/assessment'] });
      setActiveTab("plan");
    },
    onError: (error: any) => {
      toast({
        title: "Assessment Failed",
        description: error.message || "Failed to create credit assessment",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: CreditInterviewFormData) => {
    createAssessmentMutation.mutate(data);
  };

  const getScoreColor = (score: number) => {
    if (score >= 740) return "text-green-600";
    if (score >= 670) return "text-blue-600";
    if (score >= 580) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 740) return "Excellent";
    if (score >= 670) return "Good";
    if (score >= 580) return "Fair";
    return "Poor";
  };

  if (assessmentLoading) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-neutral-50">
        <Sidebar user={user} />
        <main className="flex-1 overflow-x-hidden pb-16 md:pb-0">
          <BottomNavigation user={user} />
          <TopNav title="Credit Simulator" />
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-neutral-50">
      <Sidebar user={user} />
      
      <main className="flex-1 overflow-x-hidden pb-16 md:pb-0">
        <BottomNavigation user={user} />
        <TopNav title="Credit Simulator" />
        
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            {!creditAssessment ? (
              // Credit Interview Form
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Target className="w-10 h-10 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Credit Score Simulator
                  </h1>
                  <p className="text-gray-600 mb-6">
                    Get personalized improvement plans from Money Mind, your AI credit coach
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Credit Profile Interview</CardTitle>
                    <CardDescription>
                      Tell us about your current credit situation to get a personalized improvement plan
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="currentScore"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Current Credit Score</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 650" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="goalScore"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Goal Credit Score</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 750" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="paymentHistory"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Payment History</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select payment history" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="excellent">Excellent (Never missed)</SelectItem>
                                    <SelectItem value="good">Good (1-2 late payments)</SelectItem>
                                    <SelectItem value="fair">Fair (3-5 late payments)</SelectItem>
                                    <SelectItem value="poor">Poor (Many late payments)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="creditUtilization"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Credit Utilization (%)</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 25" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="creditHistoryLength"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Credit History Length (months)</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 60" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="creditMix"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Credit Mix</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select credit mix" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="excellent">Excellent (Cards, loans, mortgage)</SelectItem>
                                    <SelectItem value="good">Good (2-3 types)</SelectItem>
                                    <SelectItem value="limited">Limited (Only credit cards)</SelectItem>
                                    <SelectItem value="poor">Poor (Very limited)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="newCreditInquiries"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Hard Inquiries (Last 12 months)</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 2" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="totalCreditLimit"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Total Credit Limit ($)</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 10000" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="totalCreditBalance"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Total Credit Balance ($)</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 2500" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="monthlyIncome"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Monthly Income ($)</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 5000" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Derogatory Marks</h3>
                          
                          <FormField
                            control={form.control}
                            name="hasCollections"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Collections on record</FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="hasBankruptcy"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Bankruptcy history</FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="hasForeclosure"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Foreclosure history</FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={createAssessmentMutation.isPending}
                        >
                          {createAssessmentMutation.isPending ? (
                            <>
                              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                              Creating Your Plan...
                            </>
                          ) : (
                            'Get My Credit Improvement Plan'
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
            ) : (
              // Credit Dashboard with Assessment Results
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="factors">Score Factors</TabsTrigger>
                  <TabsTrigger value="plan">Improvement Plan</TabsTrigger>
                  <TabsTrigger value="tracking">Progress</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Score</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${getScoreColor(creditAssessment.currentScore)}`}>
                          {creditAssessment.currentScore}
                        </div>
                        <Badge variant="secondary" className="mt-2">
                          {getScoreLabel(creditAssessment.currentScore)}
                        </Badge>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Goal Score</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${getScoreColor(creditAssessment.goalScore)}`}>
                          {creditAssessment.goalScore}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          +{creditAssessment.goalScore - creditAssessment.currentScore} points to go
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Credit Utilization</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {creditAssessment.creditUtilization}%
                        </div>
                        <Progress 
                          value={creditAssessment.creditUtilization} 
                          className="mt-2"
                          indicatorClassName={creditAssessment.creditUtilization > 30 ? "bg-red-500" : creditAssessment.creditUtilization > 10 ? "bg-yellow-500" : "bg-green-500"}
                        />
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Credit Profile Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Payment History</p>
                          <p className="text-sm capitalize">{creditAssessment.paymentHistory}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Credit History</p>
                          <p className="text-sm">{Math.floor(creditAssessment.creditHistoryLength / 12)} years</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Credit Mix</p>
                          <p className="text-sm capitalize">{creditAssessment.creditMix}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Hard Inquiries</p>
                          <p className="text-sm">{creditAssessment.newCreditInquiries} in 12mo</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="factors" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Credit Score Factors</CardTitle>
                      <CardDescription>
                        The 5 key factors that determine your FICO credit score
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Payment History - 35% */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold">Payment History</h4>
                              <p className="text-sm text-muted-foreground">On-time vs. late payments</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">35%</div>
                            <div className="text-xs text-muted-foreground">Most Important</div>
                          </div>
                        </div>
                        <Progress value={35} className="h-3" indicatorClassName="bg-blue-500" />
                        <p className="text-sm text-muted-foreground">
                          Your track record of making payments on time. Late payments, bankruptcies, and collections hurt your score.
                        </p>
                      </div>

                      {/* Credit Utilization - 30% */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <CreditCard className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold">Credit Utilization</h4>
                              <p className="text-sm text-muted-foreground">How much credit you use</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">30%</div>
                            <div className="text-xs text-muted-foreground">Very Important</div>
                          </div>
                        </div>
                        <Progress value={30} className="h-3" indicatorClassName="bg-green-500" />
                        <p className="text-sm text-muted-foreground">
                          Keep balances below 30% of credit limits. Lower is better - under 10% is excellent.
                        </p>
                      </div>

                      {/* Credit History Length - 15% */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <Clock className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold">Credit History Length</h4>
                              <p className="text-sm text-muted-foreground">Age of your accounts</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-purple-600">15%</div>
                            <div className="text-xs text-muted-foreground">Moderately Important</div>
                          </div>
                        </div>
                        <Progress value={15} className="h-3" indicatorClassName="bg-purple-500" />
                        <p className="text-sm text-muted-foreground">
                          Longer credit history is better. Keep old accounts open to maintain a longer average account age.
                        </p>
                      </div>

                      {/* Credit Mix - 10% */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                              <BarChart3 className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold">Credit Mix</h4>
                              <p className="text-sm text-muted-foreground">Types of credit accounts</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-orange-600">10%</div>
                            <div className="text-xs text-muted-foreground">Less Important</div>
                          </div>
                        </div>
                        <Progress value={10} className="h-3" indicatorClassName="bg-orange-500" />
                        <p className="text-sm text-muted-foreground">
                          Having different types of credit (cards, loans, mortgage) shows you can manage various credit types.
                        </p>
                      </div>

                      {/* New Credit Inquiries - 10% */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                              <Search className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold">New Credit Inquiries</h4>
                              <p className="text-sm text-muted-foreground">Recent credit applications</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-red-600">10%</div>
                            <div className="text-xs text-muted-foreground">Less Important</div>
                          </div>
                        </div>
                        <Progress value={10} className="h-3" indicatorClassName="bg-red-500" />
                        <p className="text-sm text-muted-foreground">
                          Too many hard inquiries in a short time can lower your score. Space out credit applications.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* User's Current Status */}
                  {creditAssessment && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Your Current Status</CardTitle>
                        <CardDescription>
                          How your profile measures against each factor
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">Payment History</span>
                              <Badge variant={creditAssessment.paymentHistory === 'excellent' ? 'default' : creditAssessment.paymentHistory === 'good' ? 'secondary' : 'destructive'}>
                                {creditAssessment.paymentHistory}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">Credit Utilization</span>
                              <Badge variant={creditAssessment.creditUtilization <= 10 ? 'default' : creditAssessment.creditUtilization <= 30 ? 'secondary' : 'destructive'}>
                                {creditAssessment.creditUtilization}%
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">Credit History</span>
                              <Badge variant={creditAssessment.creditHistoryLength >= 84 ? 'default' : creditAssessment.creditHistoryLength >= 24 ? 'secondary' : 'destructive'}>
                                {Math.floor(creditAssessment.creditHistoryLength / 12)} years
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">New Inquiries</span>
                              <Badge variant={creditAssessment.newCreditInquiries <= 1 ? 'default' : creditAssessment.newCreditInquiries <= 3 ? 'secondary' : 'destructive'}>
                                {creditAssessment.newCreditInquiries}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="plan" className="space-y-6">
                  {creditAssessment.improvementPlan && (
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle>AI Analysis & Timeline</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Overall Analysis</h4>
                            <p className="text-sm text-muted-foreground">
                              {creditAssessment.improvementPlan.overallAnalysis}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2">Current Score Analysis</h4>
                            <p className="text-sm text-muted-foreground">
                              {creditAssessment.improvementPlan.currentScoreAnalysis}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                            <Clock className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium text-blue-900">Time to Goal</p>
                              <p className="text-sm text-blue-700">{creditAssessment.improvementPlan.timeToGoal}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Prioritized Action Plan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {creditAssessment.improvementPlan.prioritizedActions?.map((action: any, index: number) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold">{action.action}</h4>
                                <Badge variant={
                                  action.impact === 'High' ? 'destructive' : 
                                  action.impact === 'Medium' ? 'default' : 'secondary'
                                }>
                                  {action.impact} Impact
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{action.description}</p>
                              <p className="text-xs text-muted-foreground">Timeline: {action.timeframe}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Monthly Tasks</CardTitle>
                          <CardDescription>Your 6-month roadmap to credit improvement</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {creditAssessment.improvementPlan.monthlyTasks?.map((month: any, index: number) => (
                              <div key={index} className="border rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <Calendar className="w-4 h-4" />
                                  <h4 className="font-semibold">Month {month.month}</h4>
                                </div>
                                <ul className="space-y-1 mb-3">
                                  {month.tasks?.map((task: string, taskIndex: number) => (
                                    <li key={taskIndex} className="text-sm flex items-start gap-2">
                                      <CheckCircle className="w-3 h-3 mt-0.5 text-green-600 flex-shrink-0" />
                                      {task}
                                    </li>
                                  ))}
                                </ul>
                                <div className="text-xs text-muted-foreground bg-green-50 p-2 rounded">
                                  <strong>Expected Progress:</strong> {month.expectedProgress}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {creditAssessment.improvementPlan.tips && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Expert Tips</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {creditAssessment.improvementPlan.tips.map((tip: string, index: number) => (
                                <li key={index} className="text-sm flex items-start gap-2">
                                  <TrendingUp className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}

                      {creditAssessment.improvementPlan.warnings && (
                        <Card className="border-yellow-200 bg-yellow-50">
                          <CardHeader>
                            <CardTitle className="text-yellow-800">Important Warnings</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {creditAssessment.improvementPlan.warnings.map((warning: string, index: number) => (
                                <li key={index} className="text-sm text-yellow-700 flex items-start gap-2">
                                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                  {warning}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="tracking" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Progress Tracking</CardTitle>
                      <CardDescription>Monitor your credit improvement journey</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Track Your Progress</h3>
                        <p className="text-muted-foreground mb-4">
                          Come back monthly to update your credit score and see your improvement
                        </p>
                        <Button onClick={() => setActiveTab("overview")}>
                          View Current Status
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}