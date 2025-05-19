import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

// Define the SavingsGoal interface
interface SavingsGoal {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string; // ISO date string
  icon?: string;
}

export default function Goals() {
  const { toast } = useToast();
  const [isAddGoalDialogOpen, setIsAddGoalDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<SavingsGoal>>({
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    icon: 'savings'
  });
  
  // Get the current date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  const [deadline, setDeadline] = useState(today);
  
  // Default goals to show for demo
  const defaultGoals: SavingsGoal[] = [
    {
      id: 1,
      name: 'Emergency Fund',
      targetAmount: 10000,
      currentAmount: 2500,
      icon: 'health_and_safety'
    },
    {
      id: 2,
      name: 'Vacation',
      targetAmount: 3000,
      currentAmount: 1200,
      deadline: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString(),
      icon: 'beach_access'
    },
    {
      id: 3,
      name: 'Down Payment',
      targetAmount: 50000,
      currentAmount: 15000,
      deadline: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString(),
      icon: 'home'
    }
  ];

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format deadline date
  const formatDeadline = (dateString?: string) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Calculate time remaining
  const getTimeRemaining = (dateString?: string) => {
    if (!dateString) return 'No deadline';
    
    const deadline = new Date(dateString);
    const now = new Date();
    
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 30) return `${diffDays} days left`;
    
    const diffMonths = Math.floor(diffDays / 30);
    return diffMonths === 1 ? '1 month left' : `${diffMonths} months left`;
  };

  // Get progress percentage
  const getProgressPercentage = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  // Handle add new goal
  const handleAddGoal = async () => {
    if (!newGoal.name || !newGoal.targetAmount) {
      toast({
        title: 'Please fill in required fields',
        description: 'Goal name and target amount are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      toast({
        title: 'Goal created',
        description: 'Your new savings goal has been added',
        variant: 'default',
      });
      
      // Reset the form
      setNewGoal({
        name: '',
        targetAmount: 0,
        currentAmount: 0,
        icon: 'savings'
      });
      setDeadline(today);
      
      // Close the dialog
      setIsAddGoalDialogOpen(false);
      
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: 'Failed to create goal',
        description: 'There was an error creating your goal',
        variant: 'destructive',
      });
    }
  };

  // Get background color based on progress
  const getBackgroundColor = (percentage: number) => {
    if (percentage < 25) return 'bg-red-100';
    if (percentage < 50) return 'bg-orange-100';
    if (percentage < 75) return 'bg-yellow-100';
    return 'bg-green-100';
  };

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav title="Savings Goals" />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar user={{
          id: 1,
          username: 'demo',
          firstName: 'Demo',
          lastName: 'User',
          email: 'demo@example.com'
        }} />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Savings Goals</h1>
            <Button 
              onClick={() => setIsAddGoalDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
            >
              <span className="material-icons mr-2">add</span>
              Add Goal
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {defaultGoals.map(goal => {
              const progressPercentage = getProgressPercentage(goal.currentAmount, goal.targetAmount);
              const bgColor = getBackgroundColor(progressPercentage);
              
              return (
                <Card key={goal.id} className={`${bgColor} border-none shadow-sm`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-3">
                        <span className="material-icons">{goal.icon || 'savings'}</span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{goal.name}</CardTitle>
                        {goal.deadline && (
                          <p className="text-xs text-neutral-500">{getTimeRemaining(goal.deadline)}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{formatCurrency(goal.currentAmount)}</span>
                        <span className="font-medium">{formatCurrency(goal.targetAmount)}</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>
                    
                    <div className="mt-4 flex justify-between items-center">
                      <div>
                        <p className="text-xs text-neutral-500">
                          {progressPercentage}% complete
                        </p>
                        {goal.deadline && (
                          <p className="text-xs text-neutral-500">
                            Due {formatDeadline(goal.deadline)}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                          <span className="material-icons text-sm">edit</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                          <span className="material-icons text-sm">delete</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {/* Future feature - Money Mind AI advice */}
          <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-lg font-bold">MM</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Money Mind Says</h3>
                  <p className="text-sm text-neutral-600">Personalized goal recommendations coming soon</p>
                </div>
              </div>
              
              <p className="text-neutral-700">
                Soon, Money Mind will analyze your spending patterns and financial habits to suggest personalized savings goals just for you.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
      
      {/* Add Goal Dialog */}
      <Dialog open={isAddGoalDialogOpen} onOpenChange={setIsAddGoalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Savings Goal</DialogTitle>
            <DialogDescription>
              Create a new savings goal to track your progress
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="goalName">Goal Name *</Label>
              <Input
                id="goalName"
                placeholder="e.g., Vacation, Emergency Fund"
                value={newGoal.name}
                onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="targetAmount">Target Amount *</Label>
              <Input
                id="targetAmount"
                type="number"
                min="0"
                placeholder="e.g., 5000"
                value={newGoal.targetAmount || ''}
                onChange={(e) => setNewGoal({...newGoal, targetAmount: parseFloat(e.target.value) || 0})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currentAmount">Current Amount</Label>
              <Input
                id="currentAmount"
                type="number"
                min="0"
                placeholder="e.g., 1000"
                value={newGoal.currentAmount || ''}
                onChange={(e) => setNewGoal({...newGoal, currentAmount: parseFloat(e.target.value) || 0})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline (Optional)</Label>
              <Input
                id="deadline"
                type="date"
                min={today}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <div className="grid grid-cols-5 gap-2">
                {['savings', 'home', 'beach_access', 'directions_car', 'school', 'health_and_safety', 'devices', 'shopping_cart', 'card_travel', 'attach_money'].map((icon) => (
                  <Button
                    key={icon}
                    type="button"
                    variant={newGoal.icon === icon ? 'default' : 'outline'}
                    className="h-10 p-0 aspect-square"
                    onClick={() => setNewGoal({...newGoal, icon})}
                  >
                    <span className="material-icons text-sm">{icon}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddGoalDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddGoal}>
              Add Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}