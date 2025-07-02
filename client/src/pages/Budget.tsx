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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Wifi,
  Check
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
  
  // Add category dialog state
  const [addCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false);
  const [aiRecommendationsDialogOpen, setAiRecommendationsDialogOpen] = useState(false);

  // Form state for adding a new category
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('shopping');
  const [newCategoryColor, setNewCategoryColor] = useState('blue');
  const [newCategoryBudget, setNewCategoryBudget] = useState('');
  const [newCategorySpent, setNewCategorySpent] = useState('0');
  
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
  
  // Only use real user data from API
  const user = userData;
  
  // Calculate total budget
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalRemaining, setTotalRemaining] = useState(0);
  
  // Available icons and colors for selection
  const iconOptions = [
    { value: 'shopping', label: 'Shopping', icon: <ShoppingCart className="h-4 w-4" /> },
    { value: 'home', label: 'Housing', icon: <Home className="h-4 w-4" /> },
    { value: 'food', label: 'Food', icon: <Utensils className="h-4 w-4" /> },
    { value: 'car', label: 'Transportation', icon: <Car className="h-4 w-4" /> },
    { value: 'entertainment', label: 'Entertainment', icon: <Gift className="h-4 w-4" /> },
    { value: 'savings', label: 'Savings', icon: <PiggyBank className="h-4 w-4" /> },
    { value: 'utilities', label: 'Utilities', icon: <Wifi className="h-4 w-4" /> },
    { value: 'maintenance', label: 'Maintenance', icon: <Wrench className="h-4 w-4" /> },
  ];
  
  const colorOptions = [
    { value: 'black', label: 'Black', class: 'bg-black' },
    { value: 'gray', label: 'Gray', class: 'bg-gray-600' },
    { value: 'dark-gray', label: 'Dark Gray', class: 'bg-gray-800' },
    { value: 'light-gray', label: 'Light Gray', class: 'bg-gray-400' },
  ];
  
  // Use only real budget data from API
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  
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
  
  // Handle adding a new budget category
  const handleAddCategory = () => {
    if (!newCategoryName || !newCategoryBudget) {
      toast({
        title: "Missing Information",
        description: "Please provide a category name and budget amount",
        variant: "destructive"
      });
      return;
    }
    
    const budget = parseFloat(newCategoryBudget);
    const spent = parseFloat(newCategorySpent || '0');
    
    if (isNaN(budget) || budget <= 0) {
      toast({
        title: "Invalid Budget",
        description: "Please enter a valid budget amount",
        variant: "destructive"
      });
      return;
    }
    
    if (isNaN(spent) || spent < 0) {
      toast({
        title: "Invalid Spent Amount",
        description: "Please enter a valid spent amount",
        variant: "destructive"
      });
      return;
    }
    
    // Calculate the remaining and percent used
    const remaining = budget - spent;
    const percentUsed = spent > 0 ? Math.round((spent / budget) * 100) : 0;
    
    // Find the selected icon
    const selectedIconOption = iconOptions.find(option => option.value === newCategoryIcon);
    
    // Find the selected color
    const selectedColorOption = colorOptions.find(option => option.value === newCategoryColor);
    
    // Create new category
    const newCategory: BudgetCategory = {
      id: Date.now(), // Use timestamp as a simple unique ID
      name: newCategoryName,
      icon: selectedIconOption?.icon || <ShoppingCart className="h-5 w-5" />,
      color: `bg-${selectedColorOption?.value || 'blue'}-500`,
      allocated: budget,
      spent: spent,
      remaining: remaining,
      percentUsed: percentUsed
    };
    
    // Add new category to the list
    setBudgetCategories([...budgetCategories, newCategory]);
    
    // Close the dialog and reset form
    setAddCategoryDialogOpen(false);
    setNewCategoryName('');
    setNewCategoryIcon('shopping');
    setNewCategoryColor('blue');
    setNewCategoryBudget('');
    setNewCategorySpent('0');
    
    toast({
      title: "Category Added",
      description: `${newCategoryName} has been added to your budget`,
    });
  };
  
  // Handle getting AI budget recommendations based on real spending data
  const handleGetAiRecommendations = async () => {
    setAiRecommendationsLoading(true);
    
    try {
      const response = await fetch('/api/ai/create-budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to create AI budget');
      }
      
      const data = await response.json();
      
      if (data.success && data.budgetPlan) {
        // Close dialog first
        setAiRecommendationsDialogOpen(false);
        
        // Show success message
        toast({
          title: "Money Mind Created Your Budget!",
          description: data.message,
        });
        
        // Refresh the page to show new budget categories
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error('Failed to process AI budget');
      }
      
    } catch (error) {
      console.error('Error creating AI budget:', error);
      toast({
        title: "Error",
        description: "Failed to create AI budget. Please ensure you have connected accounts with transaction data.",
        variant: "destructive",
      });
    } finally {
      setAiRecommendationsLoading(false);
    }
  };

  // Function to determine progress bar color
  const getProgressColor = (percentUsed: number): string => {
    if (percentUsed >= 100) return '[&>div]:bg-red-500';
    if (percentUsed >= 85) return '[&>div]:bg-yellow-500';
    return '[&>div]:bg-blue-500';
  };

  // State for adjust dialog
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null);
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  
  // Function to save budget adjustment
  const saveBudgetAdjustment = () => {
    if (!selectedCategory) return;
    
    const amount = parseFloat(newBudgetAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Budget",
        description: "Please enter a valid budget amount",
        variant: "destructive"
      });
      return;
    }
    
    // Update the budget category
    const updatedCategories = budgetCategories.map(cat => {
      if (cat.id === selectedCategory.id) {
        const newRemaining = amount - cat.spent;
        const newPercentUsed = cat.spent > 0 ? Math.round((cat.spent / amount) * 100) : 0;
        
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
      description: `The budget for ${selectedCategory.name} has been updated.`,
    });
  };
  
  // Load AI budget recommendations (mock implementation for now)
  useEffect(() => {
    if (budgetRecommendations) {
      try {
        console.log("Budget recommendations received:", budgetRecommendations);
        // Here we would implement the real mapping from API data
      } catch (error) {
        console.error("Error processing budget recommendations:", error);
      }
    }
  }, [budgetRecommendations]);
  
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopNav title="Mind My Money" />
      
      <main className="flex-1 overflow-x-hidden pb-16">
        <BottomNavigation user={userData} />
        
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-black">Budget</h1>
            <p className="text-gray-600">Manage your spending for {currentMonth}</p>
          </div>
          
          {/* Overall Budget Summary */}
          <Card className="mb-6 bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold flex items-center text-black">
                    <CircleDollarSign className="mr-2 h-5 w-5 text-gray-600" />
                    Total Budget
                  </h2>
                  <p className="text-3xl font-bold mt-1 text-black">${totalBudget.toLocaleString()}</p>
                </div>
                
                <div className="flex space-x-6">
                  <div>
                    <p className="text-sm text-gray-600">Spent</p>
                    <p className="text-lg font-medium flex items-center text-black">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      ${totalSpent.toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Remaining</p>
                    <p className="text-lg font-medium flex items-center text-black">
                      <ArrowDownRight className="h-4 w-4 mr-1" />
                      ${totalRemaining.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <Progress 
                value={(totalSpent / totalBudget) * 100} 
                className="h-2 bg-gray-200"
              />
              
              <div className="flex justify-between mt-1 text-xs text-gray-600">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </CardContent>
          </Card>
          
          {/* AI Budget Message */}
          <div className="bg-black p-6 rounded-xl mb-6 text-white shadow-md">
            <div className="flex">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4 shadow-inner">
                <span className="material-icons text-2xl">psychology</span>
              </div>
              <div>
                <h3 className="font-medium text-lg">Money Mind's Budget Recommendations</h3>
                <p className="text-gray-200 mt-1">
                  Based on your spending patterns, I've created personalized budget categories for you.
                  These recommendations will help you reach your financial goals faster.
                </p>
                <p className="text-xs mt-2 text-gray-300">
                  Note: Connect your bank account to get more accurate recommendations.
                </p>
              </div>
            </div>
          </div>
          
          {/* Budget Categories */}
          <h2 className="text-xl font-semibold mb-4 text-black">Budget Categories</h2>
          
          {budgetLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {budgetCategories.map((category) => (
                <Card key={category.id} className="overflow-hidden bg-white shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100">
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 bg-white border border-gray-300 text-black shadow-sm">
                        {category.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base text-black">{category.name}</CardTitle>
                        <p className="text-sm text-gray-600">${category.allocated.toLocaleString()} allocated</p>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAdjustBudget(category)}
                      className="h-8 px-2 hover:bg-gray-100 hover:text-black transition-colors border-gray-300"
                    >
                      Adjust
                    </Button>
                  </CardHeader>
                  
                  <CardContent className="p-4 pt-0">
                    <div className="mt-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-black">${category.spent.toFixed(2)} spent</span>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={category.percentUsed >= 100 ? "destructive" : "outline"}
                            className={category.percentUsed >= 100 ? "bg-black text-white" : 
                                      category.percentUsed >= 85 ? "bg-gray-600 text-white" : 
                                      "bg-gray-200 text-black"}
                          >
                            {category.percentUsed}%
                          </Badge>
                          <span className="text-sm text-right text-black">${category.remaining.toFixed(2)} left</span>
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
          <div className="flex flex-col sm:flex-row justify-center mt-8 gap-4">
            <Button 
              onClick={() => setAddCategoryDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <span className="material-icons mr-2 text-sm">add</span>
              Add Category
            </Button>
            <Button 
              variant="outline" 
              onClick={handleGetAiRecommendations}
              className="border-blue-200 hover:bg-blue-50 transition-all duration-200"
            >
              <span className="material-icons mr-2 text-sm">auto_awesome</span>
              Get AI Recommendations
            </Button>
          </div>
        </div>
      </main>
      
      {/* Add Category Dialog */}
      <Dialog open={addCategoryDialogOpen} onOpenChange={setAddCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-blue-700">
              <span className="material-icons mr-2 text-blue-500">add</span>
              Add Budget Category
            </DialogTitle>
            <DialogDescription>
              Create a new budget category to track your spending.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Entertainment, Subscriptions"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Category Icon</Label>
              <Select value={newCategoryIcon} onValueChange={setNewCategoryIcon}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an icon" />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center">
                        <span className="mr-2">{option.icon}</span>
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Category Color</Label>
              <Select value={newCategoryColor} onValueChange={setNewCategoryColor}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a color" />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center">
                        <span className={`w-4 h-4 rounded-full mr-2 ${option.class}`}></span>
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="budget-amount">Budget Amount ($)</Label>
              <Input
                id="budget-amount"
                type="number"
                value={newCategoryBudget}
                onChange={(e) => setNewCategoryBudget(e.target.value)}
                placeholder="e.g., 200"
                min="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="spent-amount">Current Spent Amount ($)</Label>
              <Input
                id="spent-amount"
                type="number"
                value={newCategorySpent}
                onChange={(e) => setNewCategorySpent(e.target.value)}
                placeholder="e.g., 50"
                min="0"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddCategory}
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Budget Adjustment Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-blue-700">
              <span className="material-icons mr-2 text-blue-500">edit</span>
              Adjust Budget
            </DialogTitle>
            <DialogDescription>
              Update the budget allocation for {selectedCategory?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-blue-700">Current Allocation:</span>
                <span className="text-lg">${selectedCategory?.allocated.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium text-blue-700">Current Spending:</span>
                <span className="text-lg text-red-500">${selectedCategory?.spent.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium text-blue-700">Remaining:</span>
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
              
              {selectedCategory && parseFloat(newBudgetAmount) < selectedCategory.spent && (
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
      
      {/* AI Recommendations Dialog */}
      <Dialog open={aiRecommendationsDialogOpen} onOpenChange={setAiRecommendationsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-blue-700">
              <span className="material-icons mr-2 text-blue-500">psychology</span>
              AI Budget Recommendations
            </DialogTitle>
            <DialogDescription>
              Money Mind is analyzing your spending patterns to create personalized budget recommendations.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-8 flex flex-col items-center justify-center">
            <div className="relative w-20 h-20 mb-4">
              <div className="absolute inset-0 rounded-full border-t-4 border-b-4 border-blue-500 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-icons text-3xl text-blue-500">psychology</span>
              </div>
            </div>
            <p className="text-center text-blue-700">
              Analyzing your financial data and spending habits...
            </p>
            <div className="mt-6 space-y-2 w-full">
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <p className="text-sm text-green-700">Analyzing transaction history</p>
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <p className="text-sm text-green-700">Identifying spending patterns</p>
              </div>
              <div className="flex items-center">
                <div className="h-4 w-4 border-t border-r border-blue-500 rounded-full animate-spin mr-2"></div>
                <p className="text-sm text-blue-700">Creating optimized budget categories</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}