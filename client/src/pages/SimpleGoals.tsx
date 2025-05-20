import React from 'react';
import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';
import BottomNavigation from '@/components/BottomNavigation';
import { useQuery } from '@tanstack/react-query';
import { UserProfile } from '@/types';

// Define a simplified Goal type
interface Goal {
  id: number;
  name: string;
  currentAmount: number;
  targetAmount: number;
  deadline: string;
  color: string;
  percent: number;
}

export default function SimpleGoals() {
  // Sample goals data
  const sampleGoals: Goal[] = [
    {
      id: 1,
      name: "Emergency Fund",
      currentAmount: 2500,
      targetAmount: 10000,
      deadline: "December 31, 2024",
      color: "blue",
      percent: 25
    },
    {
      id: 2,
      name: "Vacation",
      currentAmount: 1200,
      targetAmount: 3000,
      deadline: "September 30, 2024",
      color: "green",
      percent: 40
    },
    {
      id: 3,
      name: "Down Payment",
      currentAmount: 15000,
      targetAmount: 50000,
      deadline: "June 30, 2026",
      color: "purple",
      percent: 30
    }
  ];

  // Get user profile for sidebar
  const { data: user } = useQuery<UserProfile>({
    queryKey: ['/api/users/profile']
  });

  // Fallback user for development
  const fallbackUser: UserProfile = {
    id: 1,
    username: 'demo',
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo@example.com'
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-neutral-50">
      <Sidebar user={user || fallbackUser} />
      
      <main className="flex-1 overflow-x-hidden pb-16 md:pb-0">
        <BottomNavigation user={user || fallbackUser} />
        <TopNav title="Savings Goals" />
        
        <div className="p-6">
          {/* Page header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Your Savings Goals</h1>
              <p className="text-neutral-500">Track your financial progress</p>
            </div>
            
            <button className="mt-4 md:mt-0 px-4 py-2 bg-blue-600 text-white rounded-md flex items-center">
              <span className="mr-1">+</span>
              Add New Goal
            </button>
          </div>
          
          {/* Goals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {sampleGoals.map(goal => (
              <div key={goal.id} className="bg-white p-5 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium">{goal.name}</h3>
                  <span className="inline-block bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-sm font-medium">
                    {goal.percent}%
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
                    <span className="font-medium">{goal.deadline}</span>
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
                        'bg-blue-500'
                      }`}
                      style={{ width: `${goal.percent}%` }}
                    />
                  </div>
                </div>
                
                <div className="mt-4 flex justify-between">
                  <button className="px-3 py-1 border border-gray-300 rounded text-sm">Edit</button>
                  <button className="px-3 py-1 border border-gray-300 rounded text-sm text-red-500">Delete</button>
                </div>
              </div>
            ))}
          </div>
          
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
    </div>
  );
}