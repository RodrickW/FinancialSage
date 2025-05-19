import React, { useState } from 'react';
import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';
import { useQuery } from '@tanstack/react-query';
import { UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

// Define the Goal type
interface Goal {
  id: number;
  name: string;
  currentAmount: number;
  targetAmount: number;
  deadline: string;
  color: string;
}

export default function SimpleGoals() {
  // State for goals
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: 1,
      name: "Emergency Fund",
      currentAmount: 2500,
      targetAmount: 10000,
      deadline: "2024-12-31",
      color: "blue"
    },
    {
      id: 2,
      name: "Vacation",
      currentAmount: 1200,
      targetAmount: 3000,
      deadline: "2024-09-30",
      color: "green"
    },
    {
      id: 3,
      name: "Down Payment",
      currentAmount: 15000,
      targetAmount: 50000,
      deadline: "2026-06-30",
      color: "purple"
    }
  ]);

  // Dialog states
  const [showDialog, setShowDialog] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalAmount, setNewGoalAmount] = useState("");
  const [newGoalDate, setNewGoalDate] = useState("");
  
  // MoneyMind dialog states
  const [showMMDialog, setShowMMDialog] = useState(false);
  const [mmStep, setMMStep] = useState(1);
  const [mmMessage, setMMMessage] = useState(
    "I'm Money Mind, your financial advisor. I can help you set meaningful savings goals. What kind of goal would you like to create today?"
  );
  const [userInput, setUserInput] = useState("");

  // Get user profile
  const { data: user } = useQuery<UserProfile>({
    queryKey: ['/api/users/profile']
  });

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get color for progress bar
  const getProgressColor = (color: string): string => {
    switch (color) {
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      case 'purple': return 'bg-purple-500';
      default: return 'bg-blue-500';
    }
  };

  // Handle create goal submit
  const handleCreateGoal = () => {
    if (!newGoalName || !newGoalAmount || !newGoalDate) return;
    
    const newGoal: Goal = {
      id: goals.length + 1,
      name: newGoalName,
      currentAmount: 0,
      targetAmount: parseFloat(newGoalAmount),
      deadline: newGoalDate,
      color: 'blue'
    };
    
    setGoals([...goals, newGoal]);
    setShowDialog(false);
    
    // Reset form
    setNewGoalName("");
    setNewGoalAmount("");
    setNewGoalDate("");
  };
  
  // Handle Money Mind chat
  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    
    // Progress through Money Mind's guided goal creation
    if (mmStep === 1) {
      // First response - user sent goal type
      setMMMessage(`Great! A ${userInput} is an excellent financial goal. Based on typical savings strategies, how much would you like to save for this goal?`);
      setNewGoalName(userInput);
      setMMStep(2);
    } else if (mmStep === 2) {
      // Second response - user sent amount
      const amount = parseFloat(userInput.replace(/\$|,/g, ''));
      if (!isNaN(amount)) {
        setNewGoalAmount(amount.toString());
        setMMMessage(`Setting a target of $${amount.toLocaleString()} is a good choice. When would you like to reach this goal? For example, "in 6 months" or "by next year".`);
        setMMStep(3);
      } else {
        setMMMessage("I'm not sure I caught a specific amount. Could you please enter a numeric amount, like $5,000?");
      }
    } else if (mmStep === 3) {
      // Third response - user sent timeline
      const today = new Date();
      let targetDate = new Date();
      
      // Attempt to parse the timeframe
      if (userInput.includes('month')) {
        const months = parseInt(userInput.match(/\d+/)?.[0] || '6');
        targetDate.setMonth(today.getMonth() + months);
      } else if (userInput.includes('year')) {
        const years = parseInt(userInput.match(/\d+/)?.[0] || '1');
        targetDate.setFullYear(today.getFullYear() + years);
      } else {
        // Default to 1 year
        targetDate.setFullYear(today.getFullYear() + 1);
      }
      
      const dateString = targetDate.toISOString().split('T')[0];
      setNewGoalDate(dateString);
      
      // Calculate monthly saving amount
      const totalAmount = parseFloat(newGoalAmount);
      const months = Math.max(1, Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)));
      const monthlySaving = totalAmount / months;
      
      setMMMessage(`Excellent! I've set up your "${newGoalName}" goal of $${parseFloat(newGoalAmount).toLocaleString()} by ${formatDate(dateString)}. To reach this goal, I recommend saving approximately $${monthlySaving.toFixed(2)} per month. Would you like me to add this goal to your dashboard?`);
      setMMStep(4);
    } else if (mmStep === 4) {
      // Fourth response - confirm goal creation
      if (userInput.toLowerCase().includes('yes') || userInput.toLowerCase().includes('ok')) {
        // Create the goal
        const newGoal: Goal = {
          id: goals.length + 1,
          name: newGoalName,
          currentAmount: 0,
          targetAmount: parseFloat(newGoalAmount),
          deadline: newGoalDate,
          color: 'blue'
        };
        
        setGoals([...goals, newGoal]);
        setMMMessage(`I've added your "${newGoalName}" goal to your dashboard. Is there anything else I can help you with today?`);
        setMMStep(5);
      } else {
        setMMMessage("No problem! Let's adjust the goal. What would you like to change?");
        setMMStep(2);
      }
    } else {
      // Reset to beginning after completion
      setShowMMDialog(false);
      setMMStep(1);
      setMMMessage("I'm Money Mind, your financial advisor. I can help you set meaningful savings goals. What kind of goal would you like to create today?");
    }
    
    setUserInput("");
  };

  // Handle delete goal
  const handleDeleteGoal = (id: number) => {
    setGoals(goals.filter(goal => goal.id !== id));
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {user && <Sidebar user={user} />}
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav title="Savings Goals" />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">Your Savings Goals</h1>
                <p className="text-neutral-500 mt-1">Track and manage your financial progress</p>
              </div>
              
              <div className="mt-4 md:mt-0 flex space-x-3">
                <Button 
                  onClick={() => setShowMMDialog(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600"
                >
                  <div className="mr-2 w-5 h-5 rounded-full bg-white text-blue-600 flex items-center justify-center">
                    <span className="text-xs font-bold">MM</span>
                  </div>
                  Money Mind Goal Builder
                </Button>
                
                <Button
                  onClick={() => setShowDialog(true)}
                  variant="outline"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                  Add Goal Manually
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map((goal) => {
                const percentComplete = Math.round((goal.currentAmount / goal.targetAmount) * 100);
                
                return (
                  <div key={goal.id} className="bg-white rounded-lg shadow-sm p-5">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-medium">{goal.name}</h3>
                      <span className="inline-block bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-sm font-medium">
                        {percentComplete}%
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500">Target</span>
                        <span className="font-medium">${goal.targetAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500">Current</span>
                        <span className="font-medium">${goal.currentAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500">Deadline</span>
                        <span className="font-medium">{formatDate(goal.deadline)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500">Progress</span>
                        <span className="font-medium">${goal.currentAmount.toLocaleString()} of ${goal.targetAmount.toLocaleString()}</span>
                      </div>
                      <div className="h-2 w-full bg-gray-200 rounded-full">
                        <div
                          className={`h-2 rounded-full ${getProgressColor(goal.color)}`}
                          style={{ width: `${percentComplete}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-between">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-500"
                        onClick={() => handleDeleteGoal(goal.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
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
      </div>
      
      {/* Add Goal Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Goal</DialogTitle>
            <DialogDescription>
              Set up a new savings goal to track your progress.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Goal Name</label>
              <Input 
                placeholder="e.g., Emergency Fund" 
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Amount ($)</label>
              <Input 
                type="number" 
                placeholder="e.g., 10000"
                value={newGoalAmount} 
                onChange={(e) => setNewGoalAmount(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Date</label>
              <Input 
                type="date" 
                value={newGoalDate}
                onChange={(e) => setNewGoalDate(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateGoal}>Create Goal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Money Mind Dialog */}
      <Dialog open={showMMDialog} onOpenChange={setShowMMDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-sm font-bold">MM</span>
              </div>
              Money Mind Goal Builder
            </DialogTitle>
            <DialogDescription>
              Let's work together to create a personalized savings goal for you.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 bg-white border rounded-lg mb-4">
            <p className="text-neutral-700">{mmMessage}</p>
          </div>
          
          <div className="flex gap-2">
            <Input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type your response..."
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button onClick={handleSendMessage}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
              Send
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}