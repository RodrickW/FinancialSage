import React from 'react';
import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';

export default function SimpleGoals() {
  return (
    <div className="flex flex-col min-h-screen">
      <TopNav title="Savings Goals" />
      
      <div className="flex flex-1">
        <Sidebar user={{
          id: 2,
          username: 'demo',
          firstName: 'Demo',
          lastName: 'User',
          email: 'demo@example.com'
        }} />
        
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold mb-6">Savings Goals</h1>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Your Savings Goals</h2>
            
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-blue-50">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="material-icons">health_and_safety</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium">Emergency Fund</h3>
                    <p className="text-sm text-gray-600">$2,500 of $10,000</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-sm font-medium">25%</span>
                  </div>
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full w-1/4"></div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 bg-green-50">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="material-icons">beach_access</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium">Vacation</h3>
                    <p className="text-sm text-gray-600">$1,200 of $3,000</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-sm font-medium">40%</span>
                  </div>
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2.5">
                  <div className="bg-green-600 h-2.5 rounded-full w-2/5"></div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 bg-purple-50">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="material-icons">home</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium">Down Payment</h3>
                    <p className="text-sm text-gray-600">$15,000 of $50,000</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-sm font-medium">30%</span>
                  </div>
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2.5">
                  <div className="bg-purple-600 h-2.5 rounded-full w-1/3"></div>
                </div>
              </div>
            </div>
            
            <button className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-lg flex items-center">
              <span className="material-icons mr-2">add</span>
              Add New Goal
            </button>
          </div>
          
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6">
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
          </div>
        </main>
      </div>
    </div>
  );
}