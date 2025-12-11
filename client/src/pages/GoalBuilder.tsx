import React, { useState } from "react";
import { useLocation } from "wouter";
import TopNav from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { UserProfile } from "@/types";
import BottomNavigation from "@/components/BottomNavigation";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Goal {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  color: string;
}

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export default function GoalBuilder() {
  const [, setLocation] = useLocation();
  const [activeStep, setActiveStep] = useState(1);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi there! I'm Money Mind, your financial goal advisor. I can help you create meaningful savings goals that fit your financial situation. What type of goal would you like to set today?"
    }
  ]);
  const [userInput, setUserInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [suggestedGoals, setSuggestedGoals] = useState<Goal[]>([
    {
      id: 1,
      name: "Emergency Fund",
      targetAmount: 10000,
      currentAmount: 2500,
      targetDate: "2024-12-31",
      category: "emergency",
      color: "blue",
    },
    {
      id: 2,
      name: "Vacation",
      targetAmount: 3000,
      currentAmount: 1200,
      targetDate: "2024-09-30",
      category: "travel",
      color: "green",
    },
    {
      id: 3,
      name: "Down Payment",
      targetAmount: 50000,
      currentAmount: 15000,
      targetDate: "2026-06-30",
      category: "housing",
      color: "purple",
    }
  ]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Get user profile for sidebar
  const { data: user } = useQuery<UserProfile>({
    queryKey: ["/api/users/profile"],
  });

  const sendMessage = async () => {
    if (!userInput.trim()) return;
    
    const newUserMessage: ChatMessage = { role: 'user', content: userInput };
    setChatHistory([...chatHistory, newUserMessage]);
    setUserInput("");
    setIsThinking(true);
    
    // Simulate AI response with a delay
    setTimeout(() => {
      let response: ChatMessage;
      
      if (chatHistory.length === 1) {
        // First user message - provide guidance on goal setting
        response = {
          role: 'assistant',
          content: "Great! Based on your financial profile, I'd recommend focusing on building an emergency fund first. Experts suggest having 3-6 months of expenses saved.\n\nWould you like me to help you set up an emergency fund goal, or did you have something else in mind?"
        };
      } else if (chatHistory.length === 3) {
        // After user confirms emergency fund
        response = {
          role: 'assistant',
          content: "Perfect! I've analyzed your spending patterns and income. Based on your monthly expenses of approximately $3,500, an ideal emergency fund would be around $10,000-$21,000.\n\nHow much would you like to save for your emergency fund? I can recommend a timeline based on your saving capacity."
        };
      } else if (chatHistory.length === 5) {
        // After user specifies amount
        response = {
          role: 'assistant',
          content: "I've created a savings goal of $10,000 for your Emergency Fund. Based on your current saving capacity, you could reach this goal in about 12 months by setting aside $625 per month.\n\nI've also suggested a few other goals that might align with your financial priorities. Would you like to view all your recommended goals?"
        };
        // Move to goal selection stage
        setActiveStep(2);
      } else {
        // Generic responses for further interactions
        const responses = [
          "I've adjusted your goal based on your feedback. Would you like to make any other changes?",
          "That's a great point. I'll incorporate that into your financial plan. Is there anything else you'd like to discuss?",
          "I've updated your goals. Would you like to see your current progress or add another goal?",
          "Based on your input, I've refined your financial roadmap. Would you like me to explain any part in more detail?"
        ];
        response = {
          role: 'assistant',
          content: responses[Math.floor(Math.random() * responses.length)]
        };
      }
      
      setChatHistory(prev => [...prev, response]);
      setIsThinking(false);
    }, 1500);
  };

  const selectGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsGoalModalOpen(true);
  };

  const confirmGoal = () => {
    setIsGoalModalOpen(false);
    setIsSuccessModalOpen(true);
  };

  const finishSetup = () => {
    setIsSuccessModalOpen(false);
    setLocation('/');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'emergency':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-700">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
          </svg>
        );
      case 'travel':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
            <path d="M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h2l1-1 1 1h4" />
            <path d="M13 7.14A5.82 5.82 0 0 1 16.5 6c3.04 0 5.5 2.24 5.5 5h-3l-1-1-1 1h-3" />
            <path d="M5.89 9.71c-2.15 2.15-2.3 5.47-.35 7.43l4.24-4.25.7-.7.71-.71 2.12-2.12c-1.95-1.96-5.27-1.8-7.42.35z" />
            <path d="M11 15.5c.5 2.5-.17 4.5-1 6.5h4c2-5.5-.5-12-1-14" />
          </svg>
        );
      case 'housing':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="m16 16-4-4-4 4" />
            <path d="m8 8 4 4 4-4" />
          </svg>
        );
    }
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-emerald-50 border-emerald-200';
      case 'green': return 'bg-green-50 border-green-200';
      case 'purple': return 'bg-purple-50 border-purple-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <BottomNavigation user={user} />
      <TopNav title="Goal Builder" />

      <div className="flex flex-1 overflow-hidden pb-16">
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-4 flex items-center gap-2">
              <Badge variant="outline" className="text-sm py-1 px-3">
                {activeStep === 1 ? "Step 1: Discuss with Money Mind" : "Step 2: Select & Customize Goals"}
              </Badge>
            </div>

            {activeStep === 1 && (
              <div className="bg-white rounded-lg shadow p-4 md:p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-indigo-600 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-white text-lg font-bold">MM</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-indigo-600 bg-clip-text text-transparent">Money Mind</h3>
                    <p className="text-sm text-neutral-600">Your personal financial advisor</p>
                  </div>
                </div>

                <div className="h-96 overflow-y-auto border rounded-lg p-4 mb-4">
                  {chatHistory.map((message, index) => (
                    <div 
                      key={index} 
                      className={`mb-4 ${message.role === 'user' ? 'text-right' : ''}`}
                    >
                      <div 
                        className={`inline-block rounded-lg p-3 max-w-[80%] ${
                          message.role === 'user' 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {message.content.split('\n').map((text, i) => (
                          <React.Fragment key={i}>
                            {text}
                            {i < message.content.split('\n').length - 1 && <br />}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                  {isThinking && (
                    <div className="mb-4">
                      <div className="inline-block rounded-lg p-3 bg-gray-100 text-gray-800">
                        <div className="flex space-x-2">
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Input
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Ask Money Mind about your financial goals..."
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} disabled={!userInput.trim() || isThinking}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="m22 2-7 20-4-9-9-4Z" />
                      <path d="M22 2 11 13" />
                    </svg>
                    Send
                  </Button>
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-4">Recommended Goals</h2>
                  <p className="text-neutral-600 mb-4">
                    Money Mind has analyzed your finances and suggested these goals based on your situation.
                    Select a goal to view details or customize it.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestedGoals.map((goal) => (
                    <Card key={goal.id} className={`border transition-all hover:shadow-md ${getColorClass(goal.color)}`}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(goal.category)}
                            <CardTitle>{goal.name}</CardTitle>
                          </div>
                          <Badge variant="outline">
                            {Math.round((goal.currentAmount / goal.targetAmount) * 100)}%
                          </Badge>
                        </div>
                        <CardDescription>
                          Target Date: {new Date(goal.targetDate).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="mt-2 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress:</span>
                            <span className="font-medium">
                              ${goal.currentAmount.toLocaleString()} of ${goal.targetAmount.toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${
                                goal.color === 'blue' ? 'bg-emerald-700' : 
                                goal.color === 'green' ? 'bg-green-600' : 
                                'bg-purple-600'
                              }`}
                              style={{ width: `${(goal.currentAmount / goal.targetAmount) * 100}%` }}
                            />
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="outline"
                          className="w-full" 
                          onClick={() => selectGoal(goal)}
                        >
                          Select & Customize
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>

                <div className="mt-8 flex justify-end">
                  <Button 
                    variant="outline" 
                    className="mr-2"
                    onClick={() => setActiveStep(1)}
                  >
                    Back to Chat
                  </Button>
                  <Button onClick={() => setLocation('/')}>
                    Save & Return to Dashboard
                  </Button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Goal customization modal */}
      <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Customize Your Goal</DialogTitle>
            <DialogDescription>
              Adjust the details of your savings goal to match your financial plan.
            </DialogDescription>
          </DialogHeader>
          
          {selectedGoal && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Goal Name</label>
                <Input defaultValue={selectedGoal.name} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Amount ($)</label>
                  <Input type="number" defaultValue={selectedGoal.targetAmount} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Amount ($)</label>
                  <Input type="number" defaultValue={selectedGoal.currentAmount} />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Date</label>
                <Input type="date" defaultValue={selectedGoal.targetDate} />
              </div>
              
              <div className="rounded-lg border p-4 bg-emerald-50">
                <h4 className="font-medium mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-emerald-700">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                  Money Mind Recommendation
                </h4>
                <p className="text-sm">
                  To reach your target of ${selectedGoal.targetAmount.toLocaleString()} by {new Date(selectedGoal.targetDate).toLocaleDateString()}, 
                  you'll need to save approximately $
                  {Math.round((selectedGoal.targetAmount - selectedGoal.currentAmount) / 
                    (Math.max(1, Math.round((new Date(selectedGoal.targetDate).getTime() - new Date().getTime()) / (30 * 24 * 60 * 60 * 1000)))))
                  } per month.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter className="sm:justify-end">
            <Button variant="outline" onClick={() => setIsGoalModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmGoal}>
              Save Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success modal */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Goal Successfully Added!</DialogTitle>
            <DialogDescription>
              Your savings goal has been added to your financial plan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <p className="text-center">
              Money Mind will track your progress and provide personalized suggestions to help you reach your goal on time.
            </p>
            
            <div className="mt-4 bg-gradient-to-r from-emerald-50 to-indigo-50 p-4 rounded-lg border border-emerald-100 w-full">
              <p className="text-sm italic">
                "Setting clear financial goals is the first step toward financial freedom. I'll be here to help you every step of the way!"
              </p>
              <p className="text-sm text-right font-medium mt-2">- Money Mind</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={finishSetup} className="w-full">
              Return to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}