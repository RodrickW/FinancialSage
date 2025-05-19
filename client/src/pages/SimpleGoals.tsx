import React, { useState } from 'react';
import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';
import { useQuery } from '@tanstack/react-query';
import { UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface Goal {
  id: number;
  name: string;
  currentAmount: number;
  targetAmount: number;
  deadline: string;
  category: string;
  color: string;
}

export default function SimpleGoals() {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: 1,
      name: "Emergency Fund",
      currentAmount: 2500,
      targetAmount: 10000,
      deadline: "2024-12-31",
      category: "emergency",
      color: "blue"
    },
    {
      id: 2,
      name: "Vacation",
      currentAmount: 1200,
      targetAmount: 3000,
      deadline: "2024-09-30",
      category: "travel",
      color: "green"
    },
    {
      id: 3,
      name: "Down Payment",
      currentAmount: 15000,
      targetAmount: 50000,
      deadline: "2026-06-30",
      category: "housing",
      color: "purple"
    }
  ]);

  // Get user profile for sidebar
  const { data: user } = useQuery<UserProfile>({
    queryKey: ['/api/users/profile']
  });

  // Money Mind dialog states
  const [showMoneyMindDialog, setShowMoneyMindDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [moneyMindResponse, setMoneyMindResponse] = useState("I'd be happy to help you set up a new financial goal! What type of goal are you interested in creating? Common options include emergency fund, vacation, down payment for a home, education, or retirement.");
  const [userInput, setUserInput] = useState("");
  
  // New goal dialog states
  const [showNewGoalDialog, setShowNewGoalDialog] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalAmount, setNewGoalAmount] = useState("");
  const [newGoalDate, setNewGoalDate] = useState("");
  const [newGoalCategory, setNewGoalCategory] = useState("emergency");
  
  // Success dialog state
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [newGoalDetails, setNewGoalDetails] = useState<Goal | null>(null);

  const getProgressColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      case 'purple': return 'bg-purple-500';
      default: return 'bg-blue-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Get color based on category
  const getCategoryColor = (category: string): string => {
    const categoryColors: Record<string, string> = {
      emergency: 'blue',
      travel: 'green',
      housing: 'purple',
      education: 'indigo',
      retirement: 'amber',
      other: 'gray'
    };
    
    return categoryColors[category] || 'blue';
  };
  
  // Handle Money Mind chat interaction
  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    
    // Progress to next step based on current step
    if (currentStep === 1) {
      // First user message - determine goal type
      setMoneyMindResponse(`Great! A ${userInput.toLowerCase()} is an important goal. Based on typical expenses and saving patterns, I'd recommend a target amount between $5,000 and $15,000. How much would you like to save for this goal?`);
      setCurrentStep(2);
      setNewGoalCategory(determineCategory(userInput));
      setNewGoalName(userInput);
    } else if (currentStep === 2) {
      // Second user message - determine amount
      const amount = parseFloat(userInput.replace(/\$|,/g, ''));
      if (!isNaN(amount)) {
        setNewGoalAmount(amount.toString());
        setMoneyMindResponse(`Excellent! Setting a goal of $${amount.toLocaleString()} is a solid target. When would you like to achieve this goal? I can suggest a timeline based on your saving capacity.`);
        setCurrentStep(3);
      } else {
        setMoneyMindResponse("I didn't catch a specific amount. Please enter a numeric amount, like $5,000.");
      }
    } else if (currentStep === 3) {
      // Third user message - determine timeline
      const today = new Date();
      let targetDate = new Date();
      
      // Try to parse the user input for timeframe
      if (userInput.includes('month')) {
        const months = parseInt(userInput.match(/\d+/)?.[0] || '6');
        targetDate.setMonth(today.getMonth() + months);
      } else if (userInput.includes('year')) {
        const years = parseInt(userInput.match(/\d+/)?.[0] || '1');
        targetDate.setFullYear(today.getFullYear() + years);
      } else {
        // Default to 1 year if we can't determine
        targetDate.setFullYear(today.getFullYear() + 1);
      }
      
      const formattedDate = targetDate.toISOString().split('T')[0];
      setNewGoalDate(formattedDate);
      
      // Calculate monthly saving amount
      const totalAmount = parseFloat(newGoalAmount);
      const months = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30));
      const monthlySaving = totalAmount / months;
      
      setMoneyMindResponse(`Perfect! I've created your "${newGoalName}" goal for $${parseFloat(newGoalAmount).toLocaleString()} to be completed by ${formatDate(formattedDate)}. To reach this goal, you'll need to save approximately $${monthlySaving.toFixed(2)} per month. Would you like to add this goal to your dashboard?`);
      setCurrentStep(4);
    } else if (currentStep === 4) {
      // Fourth user message - confirm goal creation
      if (userInput.toLowerCase().includes('yes') || userInput.toLowerCase().includes('sure') || userInput.toLowerCase().includes('ok')) {
        // Create the new goal
        const newGoal: Goal = {
          id: goals.length + 1,
          name: newGoalName,
          currentAmount: 0,
          targetAmount: parseFloat(newGoalAmount),
          deadline: newGoalDate,
          category: newGoalCategory,
          color: getCategoryColor(newGoalCategory)
        };
        
        setGoals([...goals, newGoal]);
        setNewGoalDetails(newGoal);
        setShowMoneyMindDialog(false);
        setShowSuccessDialog(true);
        
        // Reset states
        setCurrentStep(1);
        setUserInput("");
      } else {
        setMoneyMindResponse("No problem! We can adjust the goal. What would you like to change about it?");
        setCurrentStep(2); // Go back to adjusting the amount
      }
    }
    
    setUserInput("");
  };
  
  // Determine category from user input
  const determineCategory = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('emergency') || lowerInput.includes('fund') || lowerInput.includes('safety')) {
      return 'emergency';
    } else if (lowerInput.includes('vacation') || lowerInput.includes('trip') || lowerInput.includes('travel')) {
      return 'travel';
    } else if (lowerInput.includes('house') || lowerInput.includes('home') || lowerInput.includes('down payment') || lowerInput.includes('apartment')) {
      return 'housing';
    } else if (lowerInput.includes('school') || lowerInput.includes('college') || lowerInput.includes('education') || lowerInput.includes('university')) {
      return 'education';
    } else if (lowerInput.includes('retire') || lowerInput.includes('pension')) {
      return 'retirement';
    } else {
      return 'other';
    }
  };
  
  // Handle creating a goal manually
  const handleCreateGoal = () => {
    if (!newGoalName || !newGoalAmount || !newGoalDate) return;
    
    const newGoal: Goal = {
      id: goals.length + 1,
      name: newGoalName,
      currentAmount: 0,
      targetAmount: parseFloat(newGoalAmount),
      deadline: newGoalDate,
      category: newGoalCategory,
      color: getCategoryColor(newGoalCategory)
    };
    
    setGoals([...goals, newGoal]);
    setNewGoalDetails(newGoal);
    setShowNewGoalDialog(false);
    setShowSuccessDialog(true);
    
    // Reset form fields
    setNewGoalName("");
    setNewGoalAmount("");
    setNewGoalDate("");
    setNewGoalCategory("emergency");
  };
  
  // Handle deleting a goal
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
                  onClick={() => setShowMoneyMindDialog(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600"
                >
                  <div className="mr-2 w-5 h-5 rounded-full bg-white text-blue-600 flex items-center justify-center">
                    <span className="text-xs font-bold">MM</span>
                  </div>
                  Money Mind Goal Builder
                </Button>
                
                <Button
                  onClick={() => setShowNewGoalDialog(true)}
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
            
            {goals.length > 0 ? (
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
            ) : (
              <div className="bg-white rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                    <path d="M12.5 8.8c6.7-3.1 10.5 2.4 7.7 7.3-1.7 3-5 4.3-7.7 3m0-10.3c-6.7-3.1-10.5 2.4-7.7 7.3 1.7 3 5 4.3 7.7 3"/>
                    <path d="M12.5 2v20"/>
                  </svg>
                </div>
                <h3 className="text-xl font-medium mb-2">No Goals Yet</h3>
                <p className="text-neutral-500 mb-6">Start planning your financial future by creating your first savings goal.</p>
                <Button 
                  onClick={() => setShowMoneyMindDialog(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600"
                >
                  <div className="mr-2 w-5 h-5 rounded-full bg-white text-blue-600 flex items-center justify-center">
                    <span className="text-xs font-bold">MM</span>
                  </div>
                  Create Your First Goal with Money Mind
                </Button>
              </div>
            )}
            
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
      
      {/* Money Mind Dialog */}
      <Dialog open={showMoneyMindDialog} onOpenChange={setShowMoneyMindDialog}>
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
            <p className="text-neutral-700">{moneyMindResponse}</p>
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
      
      {/* Manual Goal Creation Dialog */}
      <Dialog open={showNewGoalDialog} onOpenChange={setShowNewGoalDialog}>
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
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select 
                value={newGoalCategory} 
                onValueChange={setNewGoalCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emergency">Emergency Fund</SelectItem>
                  <SelectItem value="travel">Travel/Vacation</SelectItem>
                  <SelectItem value="housing">Housing</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="retirement">Retirement</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewGoalDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateGoal}>Create Goal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Goal Created Successfully!</DialogTitle>
          </DialogHeader>
          
          {newGoalDetails && (
            <div className="py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              
              <p className="text-center text-lg font-medium mb-2">{newGoalDetails.name}</p>
              <p className="text-center text-neutral-500 mb-5">
                ${newGoalDetails.targetAmount.toLocaleString()} by {formatDate(newGoalDetails.deadline)}
              </p>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-4">
                <p className="text-sm text-neutral-700">
                  <span className="font-medium">Money Mind Tip:</span> To achieve this goal, you should save approximately 
                  ${Math.round(newGoalDetails.targetAmount / calculateMonths(newGoalDetails.deadline))} per month.
                </p>
              </div>
            </div>
          )}
          
          <Button onClick={() => setShowSuccessDialog(false)} className="w-full">
            Continue
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function to calculate months between now and a target date
function calculateMonths(targetDate: string): number {
  const now = new Date();
  const target = new Date(targetDate);
  const months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  return Math.max(1, months);
}