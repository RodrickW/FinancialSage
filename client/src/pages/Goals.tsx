import React from 'react';
import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

// Define demo goals
const demoGoals = [
  {
    id: 1,
    name: 'Emergency Fund',
    currentAmount: 2500,
    targetAmount: 10000,
    deadline: null,
    icon: 'health_and_safety'
  },
  {
    id: 2,
    name: 'Vacation',
    currentAmount: 1200,
    targetAmount: 3000,
    deadline: new Date(new Date().setMonth(new Date().getMonth() + 6)),
    icon: 'beach_access'
  },
  {
    id: 3,
    name: 'Down Payment',
    currentAmount: 15000,
    targetAmount: 50000,
    deadline: new Date(new Date().setFullYear(new Date().getFullYear() + 2)),
    icon: 'home'
  }
];

export default function Goals() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };
  
  const formatDeadline = (date: Date | null) => {
    if (!date) return 'No deadline';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  const getTimeRemaining = (date: Date | null) => {
    if (!date) return 'No deadline';
    
    const diffTime = date.getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 30) return `${diffDays} days left`;
    
    const diffMonths = Math.floor(diffDays / 30);
    return diffMonths === 1 ? '1 month left' : `${diffMonths} months left`;
  };
  
  const getBackgroundColor = (percentage: number) => {
    if (percentage < 25) return 'bg-red-100';
    if (percentage < 50) return 'bg-orange-100';
    if (percentage < 75) return 'bg-yellow-100';
    return 'bg-green-100';
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopNav title="Savings Goals" />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar user={{
          id: 2,
          username: 'demo',
          firstName: 'Demo',
          lastName: 'User',
          email: 'demo@example.com'
        }} />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Savings Goals</h1>
            <Button 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
            >
              <span className="material-icons mr-2">add</span>
              Add Goal
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demoGoals.map(goal => {
              const progressPercentage = getProgressPercentage(goal.currentAmount, goal.targetAmount);
              const bgColor = getBackgroundColor(progressPercentage);
              
              return (
                <Card key={goal.id} className={`${bgColor} border-none shadow-sm`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-3">
                        <span className="material-icons">{goal.icon}</span>
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
          
          <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-lg font-bold">MM</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Money Mind Says</h3>
                  <p className="text-sm text-neutral-600">Personalized goal recommendations</p>
                </div>
              </div>
              
              <p className="text-neutral-700">
                Soon, Money Mind will analyze your spending patterns and financial habits to suggest personalized savings goals. I'll recommend target amounts and timelines to help you reach your financial dreams sooner.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}