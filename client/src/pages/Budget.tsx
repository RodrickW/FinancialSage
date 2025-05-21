import { useState, useEffect } from 'react';
import { UserProfile } from '@/types';
import TopNav from '@/components/TopNav';
import BottomNavigation from '@/components/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CircleDollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShoppingCart, 
  Home, 
  Car, 
  Utensils, 
  Gift, 
  PiggyBank, 
  Wrench, 
  Wifi 
} from 'lucide-react';

// Budget category interface
interface BudgetCategory {
  id: number;
  name: string;
  icon: JSX.Element;
  color: string;
  allocated: number;
  spent: number;
  remaining: number;
  percentUsed: number;
}

export default function Budget() {
  const [currentMonth, setCurrentMonth] = useState('');
  const { toast } = useToast();
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null);
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  
  // Format the current month
  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      year: 'numeric',
    };
    setCurrentMonth(new Date().toLocaleDateString('en-US', options));
  }, []);
  
  // Get user data
  const { data: userData } = useQuery({
    queryKey: ['/api/users/profile'],
  });
  
  // Fetch budget recommendations from AI
  const { data: budgetRecommendations, isLoading: budgetLoading } = useQuery({
    queryKey: ['/api/ai/budget-recommendations'],
  });
  
  // Set a fallback user if data isn't available yet
  const fallbackUser: UserProfile = {
    id: 1,
    username: 'demo_user',
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo@example.com',
  };
  
  const user = userData || fallbackUser;
  
  // Calculate total budget
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalRemaining, setTotalRemaining] = useState(0);
  
  // Set up sample budget categories (these will be replaced by AI recommendations)
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([
    {
      id: 1,
      name: 'Housing',
      icon: <Home className="h-5 w-5" />,
      color: 'bg-blue-500',
      allocated: 1500,
      spent: 1500,
      remaining: 0,
      percentUsed: 100,
    },
    {
      id: 2,
      name: 'Food & Dining',
      icon: <Utensils className="h-5 w-5" />,
      color: 'bg-green-500',
      allocated: 600,
      spent: 432.75,
      remaining: 167.25,
      percentUsed: 72,
    },
    {
      id: 3,
      name: 'Transportation',
      icon: <Car className="h-5 w-5" />,
      color: 'bg-yellow-500',
      allocated: 350,
      spent: 278.50,
      remaining: 71.50,
      percentUsed: 80,
    },
    {
      id: 4,
      name: 'Shopping',
      icon: <ShoppingCart className="h-5 w-5" />,
      color: 'bg-purple-500',
      allocated: 200,
      spent: 156.23,
      remaining: 43.77,
      percentUsed: 78,
    },
    {
      id: 5,
      name: 'Entertainment',
      icon: <Gift className="h-5 w-5" />,
      color: 'bg-pink-500',
      allocated: 150,
      spent: 97.45,
      remaining: 52.55,
      percentUsed: 65,
    },
    {
      id: 6,
      name: 'Savings',
      icon: <PiggyBank className="h-5 w-5" />,
      color: 'bg-indigo-500',
      allocated: 500,
      spent: 500,
      remaining: 0,
      percentUsed: 100,
    },
    {
      id: 7,
      name: 'Utilities',
      icon: <Wifi className="h-5 w-5" />,
      color: 'bg-red-500',
      allocated: 200,
      spent: 187.34,
      remaining: 12.66,
      percentUsed: 94,
    },
    {
      id: 8,
      name: 'Home Maintenance',
      icon: <Wrench className="h-5 w-5" />,
      color: 'bg-teal-500',
      allocated: 100,
      spent: 0,
      remaining: 100,
      percentUsed: 0,
    },
  ]);
  
  // Update totals whenever budget categories change
  useEffect(() => {
    const allocated = budgetCategories.reduce((sum, category) => sum + category.allocated, 0);
    const spent = budgetCategories.reduce((sum, category) => sum + category.spent, 0);
    
    setTotalBudget(allocated);
    setTotalSpent(spent);
    setTotalRemaining(allocated - spent);
  }, [budgetCategories]);
  
  // Handle adjusting a budget category
  const handleAdjustBudget = (category: BudgetCategory) => {
    setSelectedCategory(category);
    setNewBudgetAmount(category.allocated.toString());
    setAdjustDialogOpen(true);
  };
  
  // Save budget adjustment
  const saveBudgetAdjustment = () => {
    if (!selectedCategory) return;
    
    const amount = parseFloat(newBudgetAmount);
    if (isNaN(amount) || amount < 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive amount.",
        variant: "destructive"
      });
      return;
    }

    // Update the budget category
    const updatedCategories = budgetCategories.map(cat => {
      if (cat.id === selectedCategory.id) {
        const newRemaining = amount - cat.spent;
        const newPercentUsed = cat.spent > 0 ? (cat.spent / amount) * 100 : 0;
        
        return {
          ...cat,
          allocated: amount,
          remaining: newRemaining,
          percentUsed: newPercentUsed
        };
      }
      return cat;
    });
    
    setBudgetCategories(updatedCategories);
    setAdjustDialogOpen(false);
    
    toast({
      title: "Budget Updated",
      description: `${selectedCategory.name} budget updated to $${amount.toLocaleString()}`,
    });
    
    // Here we would also save to the backend
    // apiRequest(`/api/budget/${selectedCategory.id}`, {
    //   method: 'PATCH',
    //   data: { allocated: amount }
    // });
  };
  
  // Function to determine progress bar color
  const getProgressColor = (percentUsed: number): string => {
    if (percentUsed >= 100) return '[&>div]:bg-red-500';
    if (percentUsed >= 85) return '[&>div]:bg-yellow-500';
    return '[&>div]:bg-blue-500';
  };
  
  // Function to load AI budget recommendations
  useEffect(() => {
    if (budgetRecommendations) {
      try {
        // This is where we would update budgetCategories with AI recommendations
        // For now, we'll just use the sample data
        console.log("Budget recommendations received:", budgetRecommendations);
        
        // Here we would map the AI recommendations to our budget categories
        // Example:
        // const recommendedBudgets = budgetRecommendations.categories.map(cat => ({
        //   id: cat.id,
        //   name: cat.name,
        //   icon: getCategoryIcon(cat.name),
        //   color: getCategoryColor(cat.name),
        //   allocated: cat.recommended,
        //   spent: cat.spent || 0,
        //   remaining: cat.recommended - (cat.spent || 0),
        //   percentUsed: cat.spent ? (cat.spent / cat.recommended) * 100 : 0,
        // }));
        // setBudgetCategories(recommendedBudgets);
      } catch (error) {
        console.error("Error processing budget recommendations:", error);
      }
    }
  }, [budgetRecommendations]);
  
  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <TopNav title="Mind My Money" />
      
      <main className="flex-1 overflow-x-hidden pb-16">
        <BottomNavigation user={fallbackUser} />
        
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Budget</h1>
            <p className="text-neutral-500">Manage your spending for {currentMonth}</p>
          </div>
          
          {/* Overall Budget Summary */}
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold flex items-center">
                    <CircleDollarSign className="mr-2 h-5 w-5 text-blue-500" />
                    Total Budget
                  </h2>
                  <p className="text-3xl font-bold mt-1">${totalBudget.toLocaleString()}</p>
                </div>
                
                <div className="flex space-x-6">
                  <div>
                    <p className="text-sm text-neutral-500">Spent</p>
                    <p className="text-lg font-medium flex items-center text-red-500">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      ${totalSpent.toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-neutral-500">Remaining</p>
                    <p className="text-lg font-medium flex items-center text-green-500">
                      <ArrowDownRight className="h-4 w-4 mr-1" />
                      ${totalRemaining.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <Progress 
                value={(totalSpent / totalBudget) * 100} 
                className="h-2 bg-blue-100"
              />
              
              <div className="flex justify-between mt-1 text-xs text-neutral-500">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </CardContent>
          </Card>
          
          {/* AI Budget Message */}
          <div className="bg-gradient-to-r from-indigo-500 to-blue-600 p-4 rounded-lg mb-6 text-white">
            <div className="flex">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                <span className="material-icons text-2xl">psychology</span>
              </div>
              <div>
                <h3 className="font-medium text-lg">Money Mind's Budget Recommendations</h3>
                <p className="text-indigo-100 mt-1">
                  Based on your spending patterns, I've created personalized budget categories for you.
                  These recommendations will help you reach your financial goals faster.
                </p>
                <p className="text-xs mt-2 text-indigo-200">
                  Note: Connect your bank account to get more accurate recommendations.
                </p>
              </div>
            </div>
          </div>
          
          {/* Budget Categories */}
          <h2 className="text-xl font-semibold mb-4">Budget Categories</h2>
          
          {budgetLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {budgetCategories.map((category) => (
                <Card key={category.id} className="overflow-hidden">
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${category.color} text-white`}>
                        {category.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base">{category.name}</CardTitle>
                        <p className="text-sm text-neutral-500">${category.allocated.toLocaleString()} allocated</p>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAdjustBudget(category)}
                      className="h-8 px-2"
                    >
                      Adjust
                    </Button>
                  </CardHeader>
                  
                  <CardContent className="p-4 pt-0">
                    <div className="mt-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">${category.spent.toFixed(2)} spent</span>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={category.percentUsed >= 100 ? "destructive" : "outline"}
                            className={category.percentUsed >= 100 ? "" : 
                                      category.percentUsed >= 85 ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" : 
                                      "bg-blue-100 text-blue-800 hover:bg-blue-100"}
                          >
                            {category.percentUsed}%
                          </Badge>
                          <span className="text-sm text-right">${category.remaining.toFixed(2)} left</span>
                        </div>
                      </div>
                      
                      <Progress 
                        value={category.percentUsed} 
                        className={`h-2 bg-neutral-100 ${getProgressColor(category.percentUsed)}`}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-center mt-8">
            <Button className="mx-2 bg-gradient-to-r from-blue-600 to-indigo-600">
              <span className="material-icons mr-2 text-sm">add</span>
              Add Category
            </Button>
            <Button variant="outline" className="mx-2">
              <span className="material-icons mr-2 text-sm">auto_awesome</span>
              Get AI Recommendations
            </Button>
          </div>
        </div>
      </main>

      {/* Budget Adjustment Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <span className="material-icons mr-2 text-blue-500">edit</span>
              Adjust Budget
            </DialogTitle>
            <DialogDescription>
              Update your monthly budget allocation for {selectedCategory?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Current Allocation:</span>
                <span className="text-lg">${selectedCategory?.allocated.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Current Spending:</span>
                <span className="text-lg text-red-500">${selectedCategory?.spent.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Remaining:</span>
                <span className={`text-lg ${(selectedCategory?.remaining || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ${selectedCategory?.remaining.toLocaleString()}
                </span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="budgetAmount">New Budget Amount ($)</Label>
                <Input
                  id="budgetAmount"
                  type="number"
                  value={newBudgetAmount}
                  onChange={(e) => setNewBudgetAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="0"
                  step="10"
                  className="w-full"
                />
              </div>
              
              {parseFloat(newBudgetAmount) < (selectedCategory?.spent || 0) && (
                <div className="p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm">
                  <span className="material-icons align-bottom mr-1 text-sm">warning</span>
                  The new budget amount is less than your current spending. You may need to reduce spending in this category.
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={saveBudgetAdjustment}
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}