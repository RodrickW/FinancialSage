import React, { useState } from 'react';
import TopNav from '@/components/TopNav';
import BottomNavigation from '@/components/BottomNavigation';
import { useQuery } from '@tanstack/react-query';
import { UserProfile } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

// Define the Goal type
interface Goal {
  id: number;
  name: string;
  currentAmount: number;
  targetAmount: number;
  deadline: string;
  color: string;
  percent: number;
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
  
  const { toast } = useToast();
  
  // Get user profile
  const { data: user } = useQuery<UserProfile>({
    queryKey: ['/api/users/profile']
  });
  
  // Set up a fallback user
  const fallbackUser: UserProfile = {
    id: 1,
    username: 'demo',
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo@example.com'
  };

  // Fetch real savings goals from API
  const { data: savingsGoals = [] } = useQuery({
    queryKey: ['/api/savings-goals'],
  });
  
  // Use only real goals data
  const [goals, setGoals] = useState<Goal[]>([]);

  // Functions for managing goals
  const openAddGoalDialog = () => {
    // Reset form fields
    setGoalName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setSelectedDate(undefined);
    setSelectedColor('blue');
    setIsAddDialogOpen(true);
  };
  
  const openEditGoalDialog = (goal: Goal) => {
    setSelectedGoal(goal);
    setGoalName(goal.name);
    setTargetAmount(goal.targetAmount.toString());
    setCurrentAmount(goal.currentAmount.toString());
    setSelectedColor(goal.color);
    // Parse deadline string to Date object for the calendar
    try {
      const dateParts = goal.deadline.split(' ');
      if (dateParts.length >= 3) {
        const month = dateParts[0];
        const day = parseInt(dateParts[1].replace(',', ''));
        const year = parseInt(dateParts[2]);
        setSelectedDate(new Date(year, getMonthNumber(month), day));
      }
    } catch (e) {
      console.error("Error parsing date:", e);
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
    const formattedDeadline = format(selectedDate, 'MMMM d, yyyy');
    
    // Calculate percentage progress
    const percentComplete = Math.round((currentAmt / targetAmt) * 100);
    
    // Create new goal with a unique ID
    const newGoal: Goal = {
      id: Date.now(), // Use timestamp as a simple unique ID
      name: goalName,
      targetAmount: targetAmt,
      currentAmount: currentAmt,
      deadline: formattedDeadline,
      color: selectedColor,
      percent: percentComplete
    };
    
    // Add to goals list
    setGoals([...goals, newGoal]);
    setIsAddDialogOpen(false);
    
    toast({
      title: "Goal Created",
      description: `Your ${goalName} goal has been created successfully.`
    });
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
    const formattedDeadline = format(selectedDate, 'MMMM d, yyyy');
    
    // Calculate percentage progress
    const percentComplete = Math.round((currentAmt / targetAmt) * 100);
    
    // Update goals list
    const updatedGoals = goals.map(goal => {
      if (goal.id === selectedGoal.id) {
        return {
          ...goal,
          name: goalName,
          targetAmount: targetAmt,
          currentAmount: currentAmt,
          deadline: formattedDeadline,
          color: selectedColor,
          percent: percentComplete
        };
      }
      return goal;
    });
    
    setGoals(updatedGoals);
    setIsEditDialogOpen(false);
    
    toast({
      title: "Goal Updated",
      description: `Your ${goalName} goal has been updated successfully.`
    });
  };
  
  // Function to delete a goal
  const deleteGoal = () => {
    if (!selectedGoal) return;
    
    // Filter out the selected goal
    const filteredGoals = goals.filter(goal => goal.id !== selectedGoal.id);
    setGoals(filteredGoals);
    setIsDeleteDialogOpen(false);
    
    toast({
      title: "Goal Deleted",
      description: `Your ${selectedGoal.name} goal has been deleted.`
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopNav title="Mind My Money" />
      
      <main className="flex-1 overflow-x-hidden pb-16">
        <BottomNavigation user={user || fallbackUser} />
        
        <div className="p-6">
          {/* Page header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-black">Your Savings Goals</h1>
              <p className="text-gray-600">Track your financial progress</p>
            </div>
            
            <Button 
              className="mt-4 md:mt-0 bg-black text-white hover:bg-gray-800"
              onClick={openAddGoalDialog}
            >
              <span className="material-icons text-sm mr-1">add</span>
              Add New Goal
            </Button>
          </div>
          
          {/* Goals Grid */}
          {goals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {goals.map(goal => (
                <div key={goal.id} className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium text-black">{goal.name}</h3>
                    <span className="inline-block bg-black text-white px-2 py-0.5 rounded-full text-sm font-medium">
                      {goal.percent}%
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
                          'bg-primary-500'
                        }`}
                        style={{ width: `${goal.percent}%` }}
                      />
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
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-4">
                <span className="text-white text-lg font-bold">MM</span>
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Money Mind Tips</h3>
                <p className="text-sm text-neutral-600">Your personal financial advisor</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg border border-blue-100">
                <p className="text-neutral-700">
                  <span className="font-medium">Savings Tip:</span> To accelerate your Emergency Fund goal, consider automating your savings. 
                  Setting up a recurring transfer of $300 per week to your savings account could help you reach your goal 3 months earlier.
                </p>
              </div>
              
              <div className="p-4 bg-white rounded-lg border border-blue-100">
                <p className="text-neutral-700">
                  <span className="font-medium">Goal Recommendation:</span> Based on your spending history, you could create a "New Car" 
                  savings goal. Setting aside just $200 per month could help you build a $7,200 fund over 3 years.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Add Goal Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <span className="material-icons mr-2 text-blue-500">add</span>
              Add New Savings Goal
            </DialogTitle>
            <DialogDescription>
              Create a new savings goal to track your financial progress.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="goalName">Goal Name</Label>
              <Input
                id="goalName"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="e.g., Vacation, Emergency Fund"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="targetAmount">Target Amount ($)</Label>
              <Input
                id="targetAmount"
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0.00"
                min="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currentAmount">Current Amount ($)</Label>
              <Input
                id="currentAmount"
                type="number"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="0.00"
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
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addNewGoal} className="bg-gradient-to-r from-blue-600 to-indigo-600">
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
                <p className="text-sm text-neutral-600">
                  Target: ${selectedGoal.targetAmount.toLocaleString()}
                </p>
                <p className="text-sm text-neutral-600">
                  Current progress: ${selectedGoal.currentAmount.toLocaleString()} ({selectedGoal.percent}%)
                </p>
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