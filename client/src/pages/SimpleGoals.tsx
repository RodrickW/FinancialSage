import React, { useState } from 'react';
import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';
import { useQuery } from '@tanstack/react-query';
import { UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface Goal {
  id: number;
  name: string;
  currentAmount: number;
  targetAmount: number;
  deadline: string;
  color: string;
}

export default function SimpleGoals() {
  const [goals] = useState<Goal[]>([
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

  // Get user profile for sidebar
  const { data: user } = useQuery<UserProfile>({
    queryKey: ['/api/users/profile']
  });

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

  return (
    <div className="flex h-screen bg-gray-50">
      {user && <Sidebar user={user} />}
      
      <div className="flex-1 flex flex-col">
        <TopNav title="Savings Goals" />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">Your Savings Goals</h1>
                <p className="text-neutral-500 mt-1">Track your financial progress</p>
              </div>
              
              <div className="mt-4 md:mt-0">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                  New Goal
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
                      <Button variant="outline" size="sm" className="text-red-500">Delete</Button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm p-6">
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
      </div>
    </div>
  );
}