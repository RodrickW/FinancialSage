import React from "react";
import TopNav from "@/components/TopNav";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { UserProfile } from "@/types";

export default function SimpleGoals() {
  // Get user profile for sidebar
  const { data: user } = useQuery<UserProfile>({
    queryKey: ["/api/users/profile"],
  });

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <TopNav title="Savings Goals" />

      <div className="flex flex-1 overflow-hidden">
        {user && <Sidebar user={user} />}

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 bg-white rounded-lg shadow p-4 md:p-6">
              <h2 className="text-xl font-semibold mb-4">Your Savings Goals</h2>

              <div className="space-y-4">
                {/* Emergency Fund */}
                <div className="border rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="font-medium">Emergency Fund</h3>
                        <p className="text-sm text-gray-600">$2,500 of $10,000</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">25%</span>
                      <div className="flex space-x-2 mt-1">
                        <Button size="sm" variant="outline" className="h-8 px-2 text-xs">Edit</Button>
                        <Button size="sm" variant="outline" className="h-8 px-2 text-xs text-red-500 hover:text-red-600">Delete</Button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>

                {/* Vacation */}
                <div className="border rounded-lg p-4 bg-green-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-palm-tree">
                          <path d="M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h2l1-1 1 1h4" />
                          <path d="M13 7.14A5.82 5.82 0 0 1 16.5 6c3.04 0 5.5 2.24 5.5 5h-3l-1-1-1 1h-3" />
                          <path d="M5.89 9.71c-2.15 2.15-2.3 5.47-.35 7.43l4.24-4.25.7-.7.71-.71 2.12-2.12c-1.95-1.96-5.27-1.8-7.42.35z" />
                          <path d="M11 15.5c.5 2.5-.17 4.5-1 6.5h4c2-5.5-.5-12-1-14" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="font-medium">Vacation</h3>
                        <p className="text-sm text-gray-600">$1,200 of $3,000</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">40%</span>
                      <div className="flex space-x-2 mt-1">
                        <Button size="sm" variant="outline" className="h-8 px-2 text-xs">Edit</Button>
                        <Button size="sm" variant="outline" className="h-8 px-2 text-xs text-red-500 hover:text-red-600">Delete</Button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 bg-gray-200 rounded-full h-2.5">
                    <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                </div>

                {/* Down Payment */}
                <div className="border rounded-lg p-4 bg-purple-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-home">
                          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="font-medium">Down Payment</h3>
                        <p className="text-sm text-gray-600">$15,000 of $50,000</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">30%</span>
                      <div className="flex space-x-2 mt-1">
                        <Button size="sm" variant="outline" className="h-8 px-2 text-xs">Edit</Button>
                        <Button size="sm" variant="outline" className="h-8 px-2 text-xs text-red-500 hover:text-red-600">Delete</Button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 bg-gray-200 rounded-full h-2.5">
                    <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                </div>
              </div>

              <Button className="mt-6 w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
                Add New Goal
              </Button>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-4 md:p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-white text-lg font-bold">MM</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Money Mind Says</h3>
                  <p className="text-sm text-neutral-600">Your financial planning assistant</p>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-blue-100 bg-white mb-4">
                <p className="text-neutral-700">
                  Based on your spending habits, I recommend creating a <strong>Vacation Fund</strong> goal
                  of $3,000 over the next 12 months. This would require setting aside about $250 per month.
                  Your recent decrease in dining out expenses makes this very achievable!
                </p>
              </div>

              <div className="p-4 rounded-lg border border-blue-100 bg-white">
                <p className="text-neutral-700">
                  Your Emergency Fund is making great progress! To reach your $10,000 goal faster, consider
                  increasing your automatic transfers by $50 per week. At that rate, you'll complete
                  this goal in just 9 more months.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}