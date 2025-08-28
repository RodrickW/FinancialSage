import { useState, useEffect } from 'react';
import { UserProfile } from '@/types';
import TopNav from '@/components/TopNav';
import BottomNavigation from '@/components/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/queryClient';
import { 
  Home, 
  Car, 
  Utensils, 
  ShoppingCart,
  Zap,
  Phone,
  Wifi,
  Heart,
  GraduationCap,
  PiggyBank,
  Gift,
  Coffee,
  Gamepad2,
  Plane,
  DollarSign,
  CreditCard,
  FileText,
  Shield,
  Wrench,
  Baby,
  TrendingUp,
  Banknote,
  Plus,
  Edit3,
  Target,
  Wallet
} from 'lucide-react';

// Comprehensive budget category structure based on Dave Ramsey's EveryDollar
interface BudgetGroup {
  name: string;
  categories: BudgetCategory[];
}

interface BudgetCategory {
  id: string;
  name: string;
  icon: JSX.Element;
  plannedAmount: number;
  actualSpent: number;
  remaining: number;
}

interface SpendingAnalysis {
  categoryId: string;
  amount: number;
}

export default function Budget() {
  const [currentMonth, setCurrentMonth] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [budgetData, setBudgetData] = useState<BudgetGroup[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user profile
  const { data: user } = useQuery<UserProfile>({
    queryKey: ['/api/users/profile']
  });

  // Get user's actual spending data
  const { data: transactions = [] } = useQuery<any[]>({
    queryKey: ['/api/transactions']
  });

  // Get user's saved budget data from database
  const { data: savedBudgets = [], isLoading: budgetsLoading } = useQuery<any[]>({
    queryKey: ['/api/budgets']
  });

  // Define comprehensive budget categories - all start with $0 
  const defaultBudgetGroups: BudgetGroup[] = [
    {
      name: "Giving",
      categories: [
        { id: "tithe", name: "Tithe", icon: <Heart className="w-4 h-4" />, plannedAmount: 0, actualSpent: 0, remaining: 0 },
        { id: "charitable_giving", name: "Charitable Giving", icon: <Gift className="w-4 h-4" />, plannedAmount: 0, actualSpent: 0, remaining: 0 }
      ]
    },
    {
      name: "Saving",
      categories: [
        { id: "emergency_fund", name: "Emergency Fund", icon: <Shield className="w-4 h-4" />, plannedAmount: 0, actualSpent: 0, remaining: 0 },
        { id: "retirement", name: "Retirement", icon: <TrendingUp className="w-4 h-4" />, plannedAmount: 0, actualSpent: 0, remaining: 0 },
        { id: "college_fund", name: "College Fund", icon: <GraduationCap className="w-4 h-4" />, plannedAmount: 0, actualSpent: 0, remaining: 0 }
      ]
    },
    {
      name: "Housing",
      categories: [
        { id: "mortgage_rent", name: "Mortgage/Rent", icon: <Home className="w-4 h-4" />, plannedAmount: 0, actualSpent: 0, remaining: 0 },
        { id: "utilities", name: "Utilities", icon: <Zap className="w-4 h-4" />, plannedAmount: 0, actualSpent: 0, remaining: 0 },
        { id: "phone", name: "Phone", icon: <Phone className="w-4 h-4" />, plannedAmount: 0, actualSpent: 0, remaining: 0 },
        { id: "internet", name: "Internet", icon: <Wifi className="w-4 h-4" />, plannedAmount: 0, actualSpent: 0, remaining: 0 },
        { id: "cable", name: "Cable/Streaming", icon: <Gamepad2 className="w-4 h-4" />, plannedAmount: 0, actualSpent: 0, remaining: 0 }
      ]
    },
    {
      name: "Transportation",
      categories: [
        { id: "car_payment", name: "Car Payment", icon: <Car className="w-4 h-4" />, plannedAmount: 0, actualSpent: 0, remaining: 0 },
        { id: "auto_insurance", name: "Auto Insurance", icon: <Shield className="w-4 h-4" />, plannedAmount: 0, actualSpent: 0, remaining: 0 },
        { id: "gas", name: "Gas & Fuel", icon: <Zap className="w-4 h-4" />, plannedAmount: 0, actualSpent: 0, remaining: 0 },
        { id: "maintenance", name: "Maintenance & Repairs", icon: <Wrench className="w-4 h-4" />, plannedAmount: 0, actualSpent: 0, remaining: 0 }
      ]
    },
    {
      name: "Food",
      categories: [
        { id: "groceries", name: "Groceries", icon: <ShoppingCart className="w-4 h-4" />, plannedAmount: 0, actualSpent: 0, remaining: 0 },
        { id: "restaurants", name: "Restaurants", icon: <Utensils className="w-4 h-4" />, plannedAmount: 0, actualSpent: 0, remaining: 0 }
      ]
    },
    {
      name: "Personal",
      categories: [
        { id: "clothing", name: "Clothing", icon: <ShoppingCart className="w-4 h-4" />, plannedAmount: 0, actualSpent: 0, remaining: 0 },
        { id: "personal_care", name: "Personal Care", icon: <Heart className="w-4 h-4" />, plannedAmount: 0, actualSpent: 0, remaining: 0 },
        { id: "health_fitness", name: "Health & Fitness", icon: <Heart className="w-4 h-4" />, plannedAmount: 0, actualSpent: 0, remaining: 0 }
      ]
    },
    {
      name: "Lifestyle",
      categories: [
        { id: "entertainment", name: "Entertainment", icon: <Gamepad2 className="w-4 h-4" />, plannedAmount: 0, actualSpent: 0, remaining: 0 },
        { id: "miscellaneous", name: "Miscellaneous", icon: <DollarSign className="w-4 h-4" />, plannedAmount: 0, actualSpent: 0, remaining: 0 },
        { id: "travel", name: "Travel", icon: <Plane className="w-4 h-4" />, plannedAmount: 0, actualSpent: 0, remaining: 0 }
      ]
    },
    {
      name: "Debt",
      categories: [
        { id: "credit_cards", name: "Credit Cards", icon: <CreditCard className="w-4 h-4" />, plannedAmount: 0, actualSpent: 0, remaining: 0 },
        { id: "student_loans", name: "Student Loans", icon: <GraduationCap className="w-4 h-4" />, plannedAmount: 0, actualSpent: 0, remaining: 0 },
        { id: "other_debt", name: "Other Debt", icon: <FileText className="w-4 h-4" />, plannedAmount: 0, actualSpent: 0, remaining: 0 }
      ]
    }
  ];

  // AI mutation to analyze spending and categorize transactions
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      try {
        const currentMonthTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.date);
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          return transactionDate.getMonth() === currentMonth && 
                 transactionDate.getFullYear() === currentYear;
        });
        
        console.log(`Analyzing ${currentMonthTransactions.length} current month transactions`);
        
        const response = await apiRequest("POST", "/api/ai/analyze-spending", {
          transactions: currentMonthTransactions
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Analysis failed: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Analysis result:', result);
        
        if (!result || !result.categorizedSpending) {
          throw new Error('Invalid response format from analysis API');
        }
        
        return result;
      } catch (error) {
        console.error('Mutation error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Success callback triggered with data:', data);
      if (data && data.categorizedSpending) {
        updateBudgetWithAnalysis(data.categorizedSpending);
        // Refresh budget data from database
        queryClient.invalidateQueries({ queryKey: ['/api/budgets'] });
        toast({
          title: "Spending Analysis Complete",
          description: "Your budget has been updated with your actual spending patterns and saved."
        });
      } else {
        toast({
          title: "Analysis Warning",
          description: "Analysis completed but no spending data was returned.",
          variant: "default"
        });
      }
      setIsAnalyzing(false);
    },
    onError: (error) => {
      console.error('Spending analysis error:', error);
      toast({
        title: "Analysis Failed", 
        description: error?.message || "Unable to analyze your spending patterns. Please try again.",
        variant: "destructive"
      });
      setIsAnalyzing(false);
    }
  });

  // Update budget categories with analyzed spending
  const updateBudgetWithAnalysis = (analysis: SpendingAnalysis[]) => {
    if (!analysis || !Array.isArray(analysis)) {
      console.error('Invalid analysis data:', analysis);
      return;
    }
    
    console.log('Updating budget with analysis:', analysis);
    const updatedGroups = defaultBudgetGroups.map(group => ({
      ...group,
      categories: group.categories.map(category => {
        const spending = analysis.find(a => a.categoryId === category.id);
        const actualSpent = spending ? Math.abs(spending.amount) : 0;
        console.log(`Category ${category.id}: ${spending ? `found spending of $${actualSpent}` : 'no spending found'}`);
        return {
          ...category,
          actualSpent,
          remaining: category.plannedAmount - actualSpent
        };
      })
    }));
    console.log('Updated budget groups:', updatedGroups);
    setBudgetData(updatedGroups);
  };

  // Handle category amount editing
  const handleEditCategory = (categoryId: string, currentAmount: number) => {
    setEditingCategory(categoryId);
    setEditAmount(currentAmount.toString());
    setIsEditDialogOpen(true);
  };

  const handleSaveAmount = () => {
    if (!editingCategory) return;
    
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount < 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive number.",
        variant: "destructive"
      });
      return;
    }

    const updatedGroups = budgetData.map(group => ({
      ...group,
      categories: group.categories.map(category => {
        if (category.id === editingCategory) {
          return {
            ...category,
            plannedAmount: amount,
            remaining: amount - category.actualSpent
          };
        }
        return category;
      })
    }));

    setBudgetData(updatedGroups);
    setIsEditDialogOpen(false);
    setEditingCategory(null);
    setEditAmount('');

    toast({
      title: "Budget Updated",
      description: "Category amount has been updated successfully."
    });
  };

  // Initialize budget data with saved data from database merged with defaults
  useEffect(() => {
    if (!budgetsLoading && budgetData.length === 0) {
      // Merge saved budget data with default categories
      const mergedGroups = defaultBudgetGroups.map(group => ({
        ...group,
        categories: group.categories.map(category => {
          const savedBudget = savedBudgets.find((b: any) => b.category === category.id);
          if (savedBudget) {
            return {
              ...category,
              plannedAmount: savedBudget.amount,
              actualSpent: savedBudget.spent,
              remaining: savedBudget.remaining || (savedBudget.amount - savedBudget.spent)
            };
          }
          return category;
        })
      }));
      setBudgetData(mergedGroups);
    }
  }, [savedBudgets, budgetsLoading]);

  // Set current month
  useEffect(() => {
    const now = new Date();
    setCurrentMonth(now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
  }, []);

  // Calculate totals
  const totalPlanned = budgetData.reduce((total, group) => 
    total + group.categories.reduce((groupTotal, category) => groupTotal + category.plannedAmount, 0), 0
  );

  const totalSpent = budgetData.reduce((total, group) => 
    total + group.categories.reduce((groupTotal, category) => groupTotal + category.actualSpent, 0), 0
  );

  const totalRemaining = totalPlanned - totalSpent;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopNav title="Mind My Money" />
      
      <main className="flex-1 overflow-x-hidden pb-16">
        {user && <BottomNavigation user={user} />}
        
        <div className="p-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-black">Budget Tracker</h1>
              <p className="text-gray-600">{currentMonth} • Real Spending Analysis</p>
            </div>
          </div>

          {/* Budget Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Planned</p>
                    <p className="text-2xl font-bold text-green-600">${totalPlanned.toLocaleString()}</p>
                  </div>
                  <Target className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Spent</p>
                    <p className="text-2xl font-bold text-red-600">${totalSpent.toLocaleString()}</p>
                  </div>
                  <Wallet className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Remaining</p>
                    <p className={`text-2xl font-bold`} style={{color: totalRemaining >= 0 ? '#2563eb' : '#dc2626'}}>
                      ${totalRemaining.toLocaleString()}
                    </p>
                  </div>
                  <PiggyBank className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Prominent Analyze Spending Button */}
          <div className="flex justify-center mb-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Ready to see where your money went?</h3>
              <Button 
                onClick={() => {
                  setIsAnalyzing(true);
                  analyzeMutation.mutate();
                }}
                disabled={isAnalyzing || transactions.length === 0}
                className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3" />
                    Analyzing Your Spending...
                  </>
                ) : (
                  <>
                    <Target className="w-5 h-5 mr-3" />
                    Analyze My Spending
                  </>
                )}
              </Button>
              {transactions.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">Connect your bank account to analyze spending</p>
              )}
            </div>
          </div>

          {/* Budget Categories - Only show categories with actual spending */}
          <div className="space-y-6">
            {budgetData
              .map((group) => ({
                ...group,
                categories: group.categories.filter(category => category.actualSpent > 0)
              }))
              .filter((group) => group.categories.length > 0)
              .map((group, groupIndex) => (
              <Card key={group.name}>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-800">
                    {group.name}
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({group.categories.length} categories with spending)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {group.categories.map((category) => {
                      const progressPercentage = category.plannedAmount > 0 
                        ? Math.min((category.actualSpent / category.plannedAmount) * 100, 100)
                        : 0;
                      
                      const isOverBudget = category.actualSpent > category.plannedAmount && category.plannedAmount > 0;
                      
                      return (
                        <div key={category.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="text-gray-600">
                              {category.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-800">{category.name}</span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm">
                                    <span style={{color: '#dc2626', fontWeight: '600'}}>${category.actualSpent.toLocaleString()}</span>
                                    <span className="text-gray-400"> / </span>
                                    <span className="text-gray-600">${category.plannedAmount.toLocaleString()}</span>
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditCategory(category.id, category.plannedAmount)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              {category.plannedAmount > 0 && (
                                <div className="space-y-1">
                                  <Progress 
                                    value={progressPercentage}
                                    className={`h-2 ${isOverBudget ? 'bg-red-100' : 'bg-gray-200'}`}
                                  />
                                  <div className="flex justify-between text-xs">
                                    <span className={isOverBudget ? 'text-red-600' : 'text-gray-500'}>
                                      {progressPercentage.toFixed(0)}% used
                                    </span>
                                    <span style={{color: category.remaining >= 0 ? '#2563eb' : '#dc2626', fontWeight: '500'}}>
                                      ${Math.abs(category.remaining).toLocaleString()} {category.remaining >= 0 ? 'left' : 'over'}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Information Card */}
          <Card className="mt-8 bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <Target className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-800 mb-2">How This Works</h3>
                  <ul className="space-y-1 text-sm text-blue-700">
                    <li>• Set your planned amounts for each category</li>
                    <li>• Click "Analyze My Spending" to automatically populate actual spending</li>
                    <li>• AI categorizes your real transactions into budget categories</li>
                    <li>• Track your progress and see where you're over or under budget</li>
                    <li>• Visit the Coach section for personalized financial recommendations</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Edit Category Amount Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Budget Amount</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Planned Amount</Label>
              <Input
                id="amount"
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAmount}>
              Save Amount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}