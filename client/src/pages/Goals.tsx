import React, { useState } from 'react';
import TopNav from '@/components/TopNav';
import BottomNavigation from '@/components/BottomNavigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserProfile } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Trophy, Star, Sparkles, PiggyBank, Zap, Target, Award, Crown, TrendingUp } from 'lucide-react';
import AIGoalChat from '@/components/AIGoalChat';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

// Define the Goal types to match API response
interface SavingsGoal {
  id: number;
  name: string;
  currentAmount: number;
  targetAmount: number;
  deadline?: string;
  color: string;
  progress: number;
  type: 'savings';
}

interface DebtGoal {
  id: number;
  name: string;
  currentAmount: number;
  originalAmount: number;
  targetDate?: string;
  interestRate?: number;
  minimumPayment?: number;
  color: string;
  progress: number;
  type: 'debt';
}

type Goal = SavingsGoal | DebtGoal;

// Define tracking data interface
interface SavingsTrackingData {
  monthlyStats: {
    current: number;
    monthName: string;
    nextMilestone?: number;
    progress?: number;
  };
  yearlyStats: {
    current: number;
    year: number;
    nextMilestone?: number;
    progress?: number;
  };
}

export default function Goals() {
  // States for dialog management
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  
  // Form states
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedColor, setSelectedColor] = useState('blue');
  const [goalType, setGoalType] = useState<'savings' | 'debt'>('savings');
  const [interestRate, setInterestRate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  
  // Add money functionality states
  const [addAmounts, setAddAmounts] = useState<Record<number, string>>({});
  
  // State for savings tracking
  const [showCelebration, setShowCelebration] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get user profile
  const { data: user } = useQuery<UserProfile>({
    queryKey: ['/api/users/profile']
  });
  
  // New users should have access by default (don't show trial gates on first login)
  const hasDefaultAccess = user && (!(user as any)?.hasSeenPaywall);
  
  // Fetch both savings and debt goals from API
  const { data: savingsGoalsData = [] } = useQuery<SavingsGoal[]>({
    queryKey: ['/api/savings-goals'],
  });
  
  const { data: debtGoalsData = [] } = useQuery<DebtGoal[]>({
    queryKey: ['/api/debt-goals'],
  });
  
  // Combine and type both goal types
  const savingsGoals: SavingsGoal[] = savingsGoalsData.map(goal => ({ ...goal, type: 'savings' as const }));
  const debtGoals: DebtGoal[] = debtGoalsData.map(goal => ({ ...goal, type: 'debt' as const }));
  const allGoals: Goal[] = [...savingsGoals, ...debtGoals];
  
  // Fetch savings tracking data
  const { data: trackingData } = useQuery<SavingsTrackingData>({
    queryKey: ['/api/savings-tracker']
  });
  
  // Calculate user level based on total savings and debt payoff progress
  const totalSaved = savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalDebtPaidOff = debtGoals.reduce((sum, goal) => sum + (goal.originalAmount - goal.currentAmount), 0);
  const totalProgress = totalSaved + totalDebtPaidOff;
  
  const calculateUserLevel = (totalProgress: number) => {
    const level = Math.floor(totalProgress / 1000) + 1; // Every $1000 = 1 level
    const nextLevelTarget = level * 1000;
    const currentLevelProgress = (totalProgress % 1000) / 1000 * 100;
    return { level, nextLevelTarget, currentLevelProgress };
  };
  const { level, nextLevelTarget, currentLevelProgress } = calculateUserLevel(totalProgress);
  
  
  // Create mutation for adding savings goals
  const createGoalMutation = useMutation({
    mutationFn: async (goalData: any) => {
      return await apiRequest('POST', '/api/savings-goals', goalData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/savings-goals'] });
      toast({
        title: "Goal Created",
        description: "Your savings goal has been created successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create goal",
        variant: "destructive"
      });
    }
  });

  // Create mutation for adding debt goals
  const createDebtGoalMutation = useMutation({
    mutationFn: async (goalData: any) => {
      return await apiRequest('POST', '/api/debt-goals', goalData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/debt-goals'] });
      toast({
        title: "Debt Goal Created",
        description: "Your debt payoff goal has been created successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create debt goal",
        variant: "destructive"
      });
    }
  });
  
  // Update mutation for editing goals
  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest('PUT', `/api/savings-goals/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/savings-goals'] });
      toast({
        title: "Goal Updated",
        description: "Your savings goal has been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update goal",
        variant: "destructive"
      });
    }
  });

  // Add money mutation for quick savings updates
  const addMoneyMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: number; amount: string }) => {
      return await apiRequest('POST', `/api/savings-goals/${id}/add-money`, { amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/savings-goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/savings-tracker'] });
      toast({
        title: "Money Added",
        description: "Your savings have been updated successfully!"
      });
      // Clear the input field after successful addition
      setAddAmounts({});
      
      // Show celebration after a short delay to allow data refresh
      setTimeout(() => {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 5000);
      }, 500);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add money to goal",
        variant: "destructive"
      });
    }
  });

  // Payment mutation for debt goals
  const payDebtMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: number; amount: string }) => {
      return await apiRequest('PUT', `/api/debt-goals/${id}/payment`, { amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/debt-goals'] });
      toast({
        title: "Payment Made",
        description: "Your debt payment has been processed successfully!"
      });
      // Clear the input field after successful payment
      setAddAmounts({});
      
      // Show celebration after a short delay to allow data refresh
      setTimeout(() => {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 5000);
      }, 500);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process debt payment",
        variant: "destructive"
      });
    }
  });

  // Functions for managing goals
  const openAddGoalDialog = () => {
    // Reset form fields
    setGoalName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setSelectedDate(undefined);
    setSelectedColor('blue');
    setGoalType('savings');
    setInterestRate('');
    setMinimumPayment('');
    setIsAddDialogOpen(true);
  };
  
  const openEditGoalDialog = (goal: Goal) => {
    setSelectedGoal(goal);
    setGoalName(goal.name);
    
    // Handle different goal types
    if (goal.type === 'savings') {
      setTargetAmount(goal.targetAmount.toString());
      setCurrentAmount(goal.currentAmount.toString());
      setSelectedColor(goal.color);
      // Parse deadline string to Date object for the calendar
      try {
        if (goal.deadline) {
          // Handle different date formats
          const dateObj = new Date(goal.deadline);
          if (!isNaN(dateObj.getTime())) {
            setSelectedDate(dateObj);
          }
        }
      } catch (e) {
        console.error("Error parsing date:", e);
      }
    } else if (goal.type === 'debt') {
      setTargetAmount(goal.originalAmount.toString());
      setCurrentAmount(goal.currentAmount.toString());
      setSelectedColor(goal.color);
      // Parse targetDate string to Date object for the calendar
      try {
        if (goal.targetDate) {
          // Handle different date formats
          const dateObj = new Date(goal.targetDate);
          if (!isNaN(dateObj.getTime())) {
            setSelectedDate(dateObj);
          }
        }
      } catch (e) {
        console.error("Error parsing date:", e);
      }
    }
    
    setIsEditDialogOpen(true);
  };
  
  const openDeleteGoalDialog = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsDeleteDialogOpen(true);
  };
  
  // Helper to convert month name to number
  const getMonthNumber = (monthName: string): number => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months.findIndex(month => month.startsWith(monthName));
  };
  
  // Function to add a new goal
  const addNewGoal = () => {
    if (!goalName || !targetAmount || !selectedDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    const targetAmt = parseFloat(targetAmount);
    const currentAmt = parseFloat(currentAmount || '0');
    
    if (isNaN(targetAmt) || targetAmt <= 0) {
      toast({
        title: goalType === 'debt' ? "Invalid Debt Amount" : "Invalid Target Amount",
        description: "Please enter a valid positive number.",
        variant: "destructive"
      });
      return;
    }
    
    if (isNaN(currentAmt) || currentAmt < 0) {
      toast({
        title: "Invalid Current Amount",
        description: "Please enter a valid positive number or zero.",
        variant: "destructive"
      });
      return;
    }

    // Validate debt-specific fields if provided
    if (goalType === 'debt') {
      if (interestRate && (isNaN(parseFloat(interestRate)) || parseFloat(interestRate) < 0 || parseFloat(interestRate) > 100)) {
        toast({
          title: "Invalid Interest Rate",
          description: "Please enter a valid interest rate between 0 and 100.",
          variant: "destructive"
        });
        return;
      }
      
      if (minimumPayment && (isNaN(parseFloat(minimumPayment)) || parseFloat(minimumPayment) < 0)) {
        toast({
          title: "Invalid Minimum Payment",
          description: "Please enter a valid positive minimum payment amount.",
          variant: "destructive"
        });
        return;
      }
    }
    
    // Validation depends on goal type
    if (goalType === 'savings' && currentAmt > targetAmt) {
      toast({
        title: "Invalid Amount",
        description: "Current amount cannot exceed target amount.",
        variant: "destructive"
      });
      return;
    }
    
    if (goalType === 'debt' && currentAmt > targetAmt) {
      toast({
        title: "Invalid Amount",
        description: "Current debt cannot exceed original debt amount.",
        variant: "destructive"
      });
      return;
    }
    
    // Format the deadline date
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    
    if (goalType === 'debt') {
      // Create debt goal data for API
      const debtGoalData = {
        name: goalName,
        originalAmount: targetAmt,
        currentAmount: currentAmt,
        targetDate: formattedDate,
        interestRate: interestRate ? parseFloat(interestRate) : undefined,
        minimumPayment: minimumPayment ? parseFloat(minimumPayment) : undefined,
        color: selectedColor
      };
      
      // Submit to API
      createDebtGoalMutation.mutate(debtGoalData);
    } else {
      // Create savings goal data for API
      const savingsGoalData = {
        name: goalName,
        targetAmount: targetAmt,
        currentAmount: currentAmt,
        deadline: formattedDate,
        color: selectedColor
      };
      
      // Submit to API
      createGoalMutation.mutate(savingsGoalData);
    }
    
    setIsAddDialogOpen(false);
    
    // Clear form
    resetForm();
  };
  
  // Function to update an existing goal
  const updateGoal = () => {
    if (!selectedGoal || !goalName || !targetAmount || !selectedDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    const targetAmt = parseFloat(targetAmount);
    const currentAmt = parseFloat(currentAmount || '0');
    
    if (isNaN(targetAmt) || targetAmt <= 0) {
      toast({
        title: "Invalid Target Amount",
        description: "Please enter a valid positive number.",
        variant: "destructive"
      });
      return;
    }
    
    if (isNaN(currentAmt) || currentAmt < 0) {
      toast({
        title: "Invalid Current Amount",
        description: "Please enter a valid positive number or zero.",
        variant: "destructive"
      });
      return;
    }
    
    if (currentAmt > targetAmt) {
      toast({
        title: "Invalid Amount",
        description: "Current amount cannot exceed target amount.",
        variant: "destructive"
      });
      return;
    }
    
    // Format the deadline date
    const formattedDeadline = format(selectedDate, 'yyyy-MM-dd');
    
    // Create update data for API
    const updateData = {
      name: goalName,
      targetAmount: targetAmt,
      currentAmount: currentAmt,
      deadline: formattedDeadline,
      color: selectedColor
    };
    
    // Submit to API
    updateGoalMutation.mutate({ id: selectedGoal.id, data: updateData });
    setIsEditDialogOpen(false);
    
    // Clear form
    resetForm();
  };
  
  // Function to delete a goal
  const deleteGoal = async () => {
    if (!selectedGoal) return;
    
    try {
      // Use correct endpoint based on goal type
      const endpoint = selectedGoal.type === 'debt' 
        ? `/api/debt-goals/${selectedGoal.id}`
        : `/api/savings-goals/${selectedGoal.id}`;
      
      await apiRequest('DELETE', endpoint);
      setIsDeleteDialogOpen(false);
      
      // Refresh the appropriate goals list
      if (selectedGoal.type === 'debt') {
        queryClient.invalidateQueries({ queryKey: ['/api/debt-goals'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/savings-goals'] });
      }
      
      toast({
        title: "Goal Deleted",
        description: `Your ${selectedGoal.name} goal has been deleted.`
      });
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: "Delete Failed",
        description: "Unable to delete the goal. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Helper function to reset form
  const resetForm = () => {
    setGoalName('');
    setTargetAmount('');
    setCurrentAmount('');
    setSelectedDate(undefined);
    setSelectedColor('blue');
    setGoalType('savings');
    setInterestRate('');
    setMinimumPayment('');
  };

  // Add money to a specific goal
  const addMoneyToGoal = (goalId: number, goalType?: string) => {
    const amount = addAmounts[goalId];
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive amount.",
        variant: "destructive"
      });
      return;
    }
    
    // Use appropriate mutation based on goal type
    if (goalType === 'debt') {
      payDebtMutation.mutate({ id: goalId, amount });
    } else {
      addMoneyMutation.mutate({ id: goalId, amount });
    }
  };

  // Update add amount for specific goal
  const updateAddAmount = (goalId: number, amount: string) => {
    setAddAmounts(prev => ({
      ...prev,
      [goalId]: amount
    }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <TopNav title="Mind My Money" />
      
      <main className="flex-1 overflow-x-hidden pb-16">
        {user && <BottomNavigation user={user} />}
        
        <div className="p-6">
          {/* Gamified Header with Level System */}
          <div className="mb-8">
            <div className="bg-white/20 glass rounded-3xl p-6 backdrop-blur-lg border border-white/30">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center pulse-glow">
                      <Crown className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold px-2 py-1 rounded-full">
                      L{level}
                    </div>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Savings Master
                    </h1>
                    <p className="text-gray-700 font-medium">Total Saved: ${totalSaved.toLocaleString()}</p>
                    <div className="mt-2 w-48 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all duration-1000 xp-bar"
                        style={{ width: `${currentLevelProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      ${((level * 1000) - totalSaved).toLocaleString()} to next level
                    </p>
                  </div>
                </div>
                
                <Button 
                  className="mt-6 md:mt-0 btn-gamified px-8 py-3 rounded-2xl font-bold text-lg shadow-lg"
                  onClick={openAddGoalDialog}
                  data-testid="button-open-create-goal"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Create New Goal
                </Button>
              </div>
            </div>
          </div>


          {/* Year-to-Date and Monthly Savings Totals - Gamified Display */}
          {trackingData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Current Month Total */}
              <Card className="gamified-card bg-green-100 border-2 border-green-300 shadow-2xl rounded-3xl overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/30 rounded-full -mr-16 -mt-16" />
                <CardHeader className="pb-3 relative">
                  <CardTitle className="text-xl flex items-center text-green-800">
                    <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center mr-3">
                      <PiggyBank className="h-6 w-6 text-green-700" />
                    </div>
                    {trackingData.monthlyStats?.monthName} Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-3">
                    <div className="text-4xl font-bold text-green-900">
                      ${(trackingData.monthlyStats?.current || 0).toFixed(2)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-700" />
                      <p className="text-green-800 text-sm font-medium">
                        Monthly savings streak!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Year-to-Date Total */}
              <Card className="gamified-card bg-blue-100 border-2 border-blue-300 shadow-2xl rounded-3xl overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full -mr-16 -mt-16" />
                <CardHeader className="pb-3 relative">
                  <CardTitle className="text-xl flex items-center text-blue-800">
                    <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center mr-3">
                      <Trophy className="h-6 w-6 text-blue-700" />
                    </div>
                    {trackingData.yearlyStats?.year} Champion
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-3">
                    <div className="text-4xl font-bold text-blue-900">
                      ${(trackingData.yearlyStats?.current || 0).toFixed(2)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-yellow-600" />
                      <p className="text-blue-800 text-sm font-medium">
                        Year-to-date mastery!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Celebration Modal */}
          {showCelebration && trackingData && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-300">
              <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center animate-in zoom-in duration-300">
                <div className="mb-4">
                  <Sparkles className="h-16 w-16 text-yellow-500 mx-auto animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Congratulations! 🎉</h3>
                <p className="text-gray-600 mb-4">
                  You've made great progress on your savings journey!
                </p>
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-700">
                    Monthly savings: <span className="font-bold text-green-600">${(trackingData.monthlyStats?.current || 0).toFixed(2)}</span>
                  </p>
                  <p className="text-sm text-gray-700">
                    Yearly savings: <span className="font-bold text-blue-600">${(trackingData.yearlyStats?.current || 0).toFixed(2)}</span>
                  </p>
                </div>
                <Button 
                  onClick={() => setShowCelebration(false)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                >
                  Keep Going! 💪
                </Button>
              </div>
            </div>
          )}
          

          
          {/* Goals Grid */}
          {allGoals.length > 0 ? (
            <div className="space-y-6 mb-6">
              {/* Savings Goals Section */}
              {savingsGoals.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <PiggyBank className="h-6 w-6 mr-2 text-green-600" />
                    Savings Goals
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savingsGoals.map((goal: SavingsGoal) => (
                      <div key={goal.id} className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium text-black">{goal.name}</h3>
                    <span className="inline-block bg-black text-white px-2 py-0.5 rounded-full text-sm font-medium">
                      {goal.progress}%
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Target</span>
                      <span className="font-medium text-black">${goal.targetAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Current</span>
                      <span className="font-medium text-black">${goal.currentAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Deadline</span>
                      <span className="font-medium text-black">{goal.deadline}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500">Progress</span>
                      <span className="font-medium">${goal.currentAmount.toLocaleString()} of ${goal.targetAmount.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full">
                      <div
                        className={`h-2 rounded-full ${
                          goal.color === 'blue' ? 'bg-blue-500' :
                          goal.color === 'green' ? 'bg-green-500' :
                          goal.color === 'purple' ? 'bg-purple-500' :
                          goal.color === 'red' ? 'bg-red-500' :
                          goal.color === 'orange' ? 'bg-orange-500' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Quick Add Money Section */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        placeholder="Add amount"
                        value={addAmounts[goal.id] || ''}
                        onChange={(e) => updateAddAmount(goal.id, e.target.value)}
                        className="flex-1 text-sm"
                        min="0"
                        step="0.01"
                      />
                      <Button 
                        size="sm"
                        onClick={() => addMoneyToGoal(goal.id, 'savings')}
                        disabled={addMoneyMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white px-4"
                      >
                        {addMoneyMutation.isPending ? 'Adding...' : 'Add Money'}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditGoalDialog(goal)}
                      className="px-3 py-1"
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openDeleteGoalDialog(goal)}
                      className="px-3 py-1 text-red-500 border-red-200 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
              
              {/* Debt Goals Section */}
              {debtGoals.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="text-red-600 mr-2">💳</span>
                    Debt Payoff Goals
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {debtGoals.map((goal: DebtGoal) => (
                      <div key={goal.id} className="bg-white border border-red-200 p-5 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-lg font-medium text-black">{goal.name}</h3>
                          <span className="inline-block bg-red-600 text-white px-2 py-0.5 rounded-full text-sm font-medium">
                            {goal.progress}% paid off
                          </span>
                        </div>
                        
                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Original Debt</span>
                            <span className="font-medium text-black">${goal.originalAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Remaining</span>
                            <span className="font-medium text-red-600">${goal.currentAmount.toLocaleString()}</span>
                          </div>
                          {goal.targetDate && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Target Date</span>
                              <span className="font-medium text-black">{goal.targetDate}</span>
                            </div>
                          )}
                          {goal.interestRate && goal.interestRate > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Interest Rate</span>
                              <span className="font-medium text-black">{goal.interestRate}%</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-500">Progress</span>
                            <span className="font-medium">${(goal.originalAmount - goal.currentAmount).toLocaleString()} of ${goal.originalAmount.toLocaleString()} paid off</span>
                          </div>
                          <div className="h-2 w-full bg-gray-200 rounded-full">
                            <div
                              className="h-2 rounded-full bg-red-500"
                              style={{ width: `${goal.progress}%` }}
                            />
                          </div>
                        </div>
                        
                        {/* Quick Make Payment Section */}
                        <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              placeholder="Payment amount"
                              value={addAmounts[goal.id] || ''}
                              onChange={(e) => updateAddAmount(goal.id, e.target.value)}
                              className="flex-1 text-sm"
                              min="0"
                              step="0.01"
                            />
                            <Button 
                              size="sm"
                              onClick={() => addMoneyToGoal(goal.id, 'debt')}
                              disabled={payDebtMutation.isPending}
                              className="bg-red-600 hover:bg-red-700 text-white px-4"
                            >
                              {payDebtMutation.isPending ? 'Processing...' : 'Make Payment'}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex justify-between">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditGoalDialog(goal)}
                            className="px-3 py-1"
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openDeleteGoalDialog(goal)}
                            className="px-3 py-1 text-red-500 border-red-200 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Empty state when no goals exist
            <div className="mb-6">
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-white text-3xl">🎯</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Savings Goals Yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Start tracking your financial progress by creating your first savings goal. 
                  Set targets for emergency funds, vacations, or major purchases.
                </p>
                <Button 
                  onClick={openAddGoalDialog}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  Create Your First Goal
                </Button>
              </div>
            </div>
          )}
          
          {/* Money Mind Section */}
          <AIGoalChat user={user} />
        </div>
      </main>
      
      {/* Add Goal Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <span className="material-icons mr-2 text-blue-500">add</span>
              {goalType === 'debt' ? 'Add New Debt Payoff Goal' : 'Add New Savings Goal'}
            </DialogTitle>
            <DialogDescription>
              {goalType === 'debt' 
                ? 'Create a debt payoff goal to track your journey to becoming debt-free.'
                : 'Create a savings goal to track your financial progress.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Goal Type Selector */}
            <div className="space-y-2">
              <Label>Goal Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={goalType === 'savings' ? 'default' : 'outline'}
                  onClick={() => setGoalType('savings')}
                  className={goalType === 'savings' ? 'bg-blue-600' : ''}
                  data-testid="button-goal-type-savings"
                >
                  <PiggyBank className="mr-2 h-4 w-4" />
                  Savings
                </Button>
                <Button
                  type="button"
                  variant={goalType === 'debt' ? 'default' : 'outline'}
                  onClick={() => setGoalType('debt')}
                  className={goalType === 'debt' ? 'bg-red-600' : ''}
                  data-testid="button-goal-type-debt"
                >
                  <Target className="mr-2 h-4 w-4" />
                  Debt Payoff
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goalName">Goal Name</Label>
              <Input
                id="goalName"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder={goalType === 'debt' ? 'e.g., Credit Card, Student Loan' : 'e.g., Vacation, Emergency Fund'}
                data-testid="input-goal-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="targetAmount">
                {goalType === 'debt' ? 'Original Debt Amount ($)' : 'Target Amount ($)'}
              </Label>
              <Input
                id="targetAmount"
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                data-testid="input-target-amount"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currentAmount">
                {goalType === 'debt' ? 'Current Debt Remaining ($)' : 'Current Amount ($)'}
              </Label>
              <Input
                id="currentAmount"
                type="number"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                data-testid="input-current-amount"
              />
            </div>

            {/* Debt-specific fields */}
            {goalType === 'debt' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="interestRate">Interest Rate (%) - Optional</Label>
                  <Input
                    id="interestRate"
                    type="number"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    max="100"
                    step="0.01"
                    data-testid="input-interest-rate"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minimumPayment">Minimum Payment ($) - Optional</Label>
                  <Input
                    id="minimumPayment"
                    type="number"
                    value={minimumPayment}
                    onChange={(e) => setMinimumPayment(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    data-testid="input-minimum-payment"
                  />
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label>Target Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    data-testid="button-target-date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex space-x-2">
                {['blue', 'green', 'purple', 'red', 'orange'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full ${
                      color === 'blue' ? 'bg-blue-500' :
                      color === 'green' ? 'bg-green-500' :
                      color === 'purple' ? 'bg-purple-500' :
                      color === 'red' ? 'bg-red-500' :
                      'bg-orange-500'
                    } ${selectedColor === color ? 'ring-2 ring-offset-2 ring-blue-600' : ''}`}
                    onClick={() => setSelectedColor(color)}
                    data-testid={`button-color-${color}`}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button 
              onClick={addNewGoal} 
              className={goalType === 'debt' ? 'bg-gradient-to-r from-red-600 to-rose-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}
              data-testid="button-submit-goal"
            >
              Create Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Goal Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <span className="material-icons mr-2 text-blue-500">edit</span>
              Edit Savings Goal
            </DialogTitle>
            <DialogDescription>
              Update your savings goal details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editGoalName">Goal Name</Label>
              <Input
                id="editGoalName"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editTargetAmount">Target Amount ($)</Label>
              <Input
                id="editTargetAmount"
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                min="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editCurrentAmount">Current Amount ($)</Label>
              <Input
                id="editCurrentAmount"
                type="number"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                min="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Target Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex space-x-2">
                {['blue', 'green', 'purple', 'red', 'orange'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full ${
                      color === 'blue' ? 'bg-blue-500' :
                      color === 'green' ? 'bg-green-500' :
                      color === 'purple' ? 'bg-purple-500' :
                      color === 'red' ? 'bg-red-500' :
                      'bg-orange-500'
                    } ${selectedColor === color ? 'ring-2 ring-offset-2 ring-blue-600' : ''}`}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateGoal} className="bg-gradient-to-r from-blue-600 to-indigo-600">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Goal Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <span className="material-icons mr-2 text-red-500">delete</span>
              Delete Savings Goal
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this savings goal? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedGoal && (
            <div className="py-4">
              <div className="p-4 bg-red-50 border border-red-100 rounded-md mb-4">
                <h4 className="font-medium">{selectedGoal.name}</h4>
                {selectedGoal.type === 'savings' ? (
                  <>
                    <p className="text-sm text-neutral-600">
                      Target: ${selectedGoal.targetAmount.toLocaleString()}
                    </p>
                    <p className="text-sm text-neutral-600">
                      Current progress: ${selectedGoal.currentAmount.toLocaleString()} ({selectedGoal.progress}%)
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-neutral-600">
                      Original debt: ${selectedGoal.originalAmount.toLocaleString()}
                    </p>
                    <p className="text-sm text-neutral-600">
                      Remaining balance: ${selectedGoal.currentAmount.toLocaleString()} ({selectedGoal.progress}% paid off)
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={deleteGoal} 
              variant="destructive"
            >
              Delete Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}