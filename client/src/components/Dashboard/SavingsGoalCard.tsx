import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SavingsGoal {
  id: number;
  name: string;
  currentAmount: number;
  targetAmount: number;
  progress: number;
  color: string;
}

interface SavingsGoalCardProps {
  goals?: SavingsGoal[];
}

export default function SavingsGoalCard({ goals = [] }: SavingsGoalCardProps) {
  // Only use real goals from the database
  const displayGoals = goals;
  const displayCount = Math.min(displayGoals.length, 2); // Only show up to 2 goals on dashboard

  const getProgressColorClass = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      case 'purple': return 'bg-purple-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Savings Goals</CardTitle>
          <Link href="/goals">
            <Button variant="ghost" size="sm" className="text-sm text-primary-600 hover:text-primary-700">
              Manage Goals
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {displayGoals.length > 0 ? (
          <div className="space-y-4">
            {displayGoals.slice(0, displayCount).map((goal) => (
              <div key={goal.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{goal.name}</span>
                  <span>${goal.currentAmount.toLocaleString()} of ${goal.targetAmount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${getProgressColorClass(goal.color)} h-2 rounded-full`}
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-neutral-500 mb-2">No savings goals yet</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4">
        <div className="w-full">
          <Link href="/goals">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M12.5 8.8c6.7-3.1 10.5 2.4 7.7 7.3-1.7 3-5 4.3-7.7 3m0-10.3c-6.7-3.1-10.5 2.4-7.7 7.3 1.7 3 5 4.3 7.7 3"/>
                <path d="M12.5 2v20"/>
              </svg>
              Set Financial Goals with Money Mind
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}