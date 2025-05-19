import React, { useState } from 'react';
import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery } from '@tanstack/react-query';
import { UserProfile } from '@/types';

interface Goal {
  id: number;
  name: string;
  description: string;
  currentAmount: number;
  targetAmount: number;
  deadline: string;
  category: string;
  color: string;
}

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: 1,
      name: "Emergency Fund",
      description: "3-6 months of essential expenses",
      currentAmount: 2500,
      targetAmount: 10000,
      deadline: "2024-12-31",
      category: "emergency",
      color: "blue"
    },
    {
      id: 2,
      name: "Vacation",
      description: "Summer trip to Europe",
      currentAmount: 1200,
      targetAmount: 3000, 
      deadline: "2024-09-30",
      category: "travel",
      color: "green"
    },
    {
      id: 3,
      name: "Down Payment",
      description: "For future home purchase",
      currentAmount: 15000,
      targetAmount: 50000,
      deadline: "2026-06-30",
      category: "housing",
      color: "purple"
    }
  ]);

  const [isNewGoalDialogOpen, setIsNewGoalDialogOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Get user profile for sidebar
  const { data: user } = useQuery<UserProfile>({
    queryKey: ['/api/users/profile']
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'emergency':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
        );
      case 'travel':
        return (
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
              <path d="M4 11a9 9 0 0 1 9 9" />
              <path d="M4 4a16 16 0 0 1 16 16" />
              <circle cx="5" cy="19" r="2" />
            </svg>
          </div>
        );
      case 'housing':
        return (
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
              <path d="M12 2v6.5l3-3" />
              <path d="M12 2v6.5l-3-3" />
              <path d="M12 22v-6.5l3 3" />
              <path d="M12 22v-6.5l-3 3" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
        );
    }
  };

  const getProgressColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      case 'purple': return 'bg-purple-500';
      default: return 'bg-primary-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCreateNewGoal = () => {
    if (!newGoalName || !newGoalAmount || !newGoalDate) return;

    const newGoal: Goal = {
      id: goals.length + 1,
      name: newGoalName,
      description: '',
      currentAmount: 0,
      targetAmount: parseFloat(newGoalAmount),
      deadline: newGoalDate,
      category: 'other',
      color: 'gray'
    };

    setGoals([...goals, newGoal]);
    setIsNewGoalDialogOpen(false);
    setNewGoalName('');
    setNewGoalAmount('');
    setNewGoalDate('');
  };

  const handleDeleteGoal = (id: number) => {
    setGoals(goals.filter(goal => goal.id !== id));
  };

  const filteredGoals = activeFilter === 'all' 
    ? goals 
    : goals.filter(goal => goal.category === activeFilter);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {user && <Sidebar user={user} />}
      
      <div className="flex-1 flex flex-col">
        <TopNav title="Savings Goals" />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">Your Savings Goals</h1>
                <p className="text-neutral-500 mt-1">Track and manage your financial progress</p>
              </div>
              
              <div className="mt-4 md:mt-0 flex space-x-2">
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600"
                  onClick={() => setIsNewGoalDialogOpen(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                  New Goal
                </Button>
              </div>
            </div>
            
            <div className="flex overflow-x-auto py-2 mb-6 gap-2">
              <Badge 
                variant={activeFilter === 'all' ? 'default' : 'outline'} 
                className="cursor-pointer px-3 py-1"
                onClick={() => setActiveFilter('all')}
              >
                All
              </Badge>
              <Badge 
                variant={activeFilter === 'emergency' ? 'default' : 'outline'} 
                className="cursor-pointer px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200"
                onClick={() => setActiveFilter('emergency')}
              >
                Emergency
              </Badge>
              <Badge 
                variant={activeFilter === 'travel' ? 'default' : 'outline'} 
                className="cursor-pointer px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 border-green-200"
                onClick={() => setActiveFilter('travel')}
              >
                Travel
              </Badge>
              <Badge 
                variant={activeFilter === 'housing' ? 'default' : 'outline'} 
                className="cursor-pointer px-3 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200"
                onClick={() => setActiveFilter('housing')}
              >
                Housing
              </Badge>
            </div>
            
            {filteredGoals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGoals.map((goal) => {
                  const percentComplete = Math.round((goal.currentAmount / goal.targetAmount) * 100);
                  
                  return (
                    <Card key={goal.id} className="relative overflow-hidden shadow-md">
                      {/* Progress Bar at the top */}
                      <div className={`h-1.5 ${getProgressColor(goal.color)}`} style={{ width: `${percentComplete}%` }} />
                      
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            {getCategoryIcon(goal.category)}
                            <div>
                              <CardTitle>{goal.name}</CardTitle>
                              <CardDescription>{goal.description}</CardDescription>
                            </div>
                          </div>
                          <Badge variant="outline" className="ml-2 min-w-[45px] text-center">
                            {percentComplete}%
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-neutral-500">Target Amount</span>
                            <span className="font-semibold">${goal.targetAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-neutral-500">Current Amount</span>
                            <span className="font-semibold">${goal.currentAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-neutral-500">Target Date</span>
                            <span className="font-semibold">{formatDate(goal.deadline)}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-neutral-500">Progress</span>
                            <span className="font-semibold">${goal.currentAmount.toLocaleString()} of ${goal.targetAmount.toLocaleString()}</span>
                          </div>
                          <Progress value={percentComplete} className="h-2" />
                        </div>
                      </CardContent>
                      
                      <CardFooter className="flex justify-between border-t pt-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">Edit</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Goal</DialogTitle>
                              <DialogDescription>Make changes to your savings goal</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Goal Name</label>
                                <Input defaultValue={goal.name} />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Target Amount ($)</label>
                                  <Input type="number" defaultValue={goal.targetAmount} />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Current Amount ($)</label>
                                  <Input type="number" defaultValue={goal.currentAmount} />
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Target Date</label>
                                <Input type="date" defaultValue={goal.deadline} />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline">Cancel</Button>
                              <Button>Save Changes</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400">
                    <path d="M12.5 8.8c6.7-3.1 10.5 2.4 7.7 7.3-1.7 3-5 4.3-7.7 3m0-10.3c-6.7-3.1-10.5 2.4-7.7 7.3 1.7 3 5 4.3 7.7 3"/>
                    <path d="M12.5 2v20"/>
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">No Goals Found</h3>
                <p className="text-neutral-500 mb-4">
                  {activeFilter === 'all' 
                    ? "You haven't created any savings goals yet." 
                    : `You don't have any ${activeFilter} goals.`}
                </p>
                <Button 
                  onClick={() => setIsNewGoalDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                  Create Your First Goal
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
                  <p className="text-sm text-neutral-600">Your AI financial advisor</p>
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
      
      {/* New Goal Dialog */}
      <Dialog open={isNewGoalDialogOpen} onOpenChange={setIsNewGoalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Goal</DialogTitle>
            <DialogDescription>Set up a new savings goal to track your progress</DialogDescription>
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
            <Button variant="outline" onClick={() => setIsNewGoalDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateNewGoal}>Create Goal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}