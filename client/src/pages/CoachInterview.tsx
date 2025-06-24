import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';
import BottomNavigation from '@/components/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { UserProfile } from '@/types';
import { Loader2, MessageCircle, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { mockUserProfile } from '@/lib/utils/mockData';

interface InterviewQuestion {
  id: string;
  type: 'multiple-choice' | 'text' | 'number' | 'range' | 'multi-select';
  question: string;
  description?: string;
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  required: boolean;
}

interface InterviewResponse {
  questionId: string;
  answer: string | string[] | number;
}

const interviewQuestions: InterviewQuestion[] = [
  {
    id: 'financial-goals',
    type: 'multi-select',
    question: "What are your main financial goals?",
    description: "Select all that apply - this helps me understand what matters most to you.",
    options: [
      'Build an emergency fund',
      'Pay off debt',
      'Save for a house',
      'Plan for retirement',
      'Invest in the stock market',
      'Start a business',
      'Save for vacation',
      'Improve credit score',
      'Budget better',
      'Other'
    ],
    required: true
  },
  {
    id: 'current-situation',
    type: 'multiple-choice',
    question: "How would you describe your current financial situation?",
    description: "Be honest - I'm here to help, not judge!",
    options: [
      'Living paycheck to paycheck',
      'Breaking even most months',
      'Saving a little each month',
      'Saving consistently',
      'Investing regularly',
      'Financially comfortable'
    ],
    required: true
  },
  {
    id: 'monthly-income',
    type: 'range',
    question: "What's your approximate monthly take-home income?",
    description: "This helps me give you realistic advice.",
    min: 1000,
    max: 20000,
    step: 500,
    required: true
  },
  {
    id: 'biggest-challenge',
    type: 'multiple-choice',
    question: "What's your biggest financial challenge right now?",
    options: [
      'Not enough income',
      'Overspending',
      'High debt payments',
      'No emergency fund',
      'Don\'t know where money goes',
      'Irregular income',
      'Expensive lifestyle',
      'Investment confusion',
      'Planning for the future'
    ],
    required: true
  },
  {
    id: 'debt-situation',
    type: 'multiple-choice',
    question: "How much debt are you currently carrying?",
    description: "Include credit cards, student loans, car payments, etc.",
    options: [
      'No debt',
      'Less than $5,000',
      '$5,000 - $15,000',
      '$15,000 - $50,000',
      '$50,000 - $100,000',
      'More than $100,000'
    ],
    required: true
  },
  {
    id: 'emergency-fund',
    type: 'multiple-choice',
    question: "How many months of expenses could you cover with your emergency fund?",
    options: [
      'No emergency fund',
      'Less than 1 month',
      '1-2 months',
      '3-5 months',
      '6+ months'
    ],
    required: true
  },
  {
    id: 'investment-experience',
    type: 'multiple-choice',
    question: "What's your experience with investing?",
    options: [
      'Complete beginner',
      'Know the basics',
      'Some experience',
      'Experienced investor',
      'Very experienced'
    ],
    required: true
  },
  {
    id: 'risk-tolerance',
    type: 'multiple-choice',
    question: "How do you feel about investment risk?",
    description: "There's no wrong answer - everyone has different comfort levels.",
    options: [
      'Very conservative - avoid all risk',
      'Conservative - minimal risk',
      'Moderate - balanced approach',
      'Aggressive - comfortable with risk',
      'Very aggressive - high risk for high reward'
    ],
    required: true
  },
  {
    id: 'time-horizon',
    type: 'multiple-choice',
    question: "When do you need to achieve your main financial goal?",
    options: [
      'Within 1 year',
      '1-3 years',
      '3-5 years',
      '5-10 years',
      '10+ years'
    ],
    required: true
  },
  {
    id: 'additional-info',
    type: 'text',
    question: "Is there anything else you'd like me to know about your financial situation?",
    description: "Share any specific concerns, questions, or goals I should know about.",
    placeholder: "Optional: Tell me more about your unique situation...",
    required: false
  }
];

export default function CoachInterview() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get the user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/users/profile']
  });

  const user: UserProfile = userData || mockUserProfile;

  // Save interview responses
  const saveInterviewMutation = useMutation({
    mutationFn: async (interviewData: any) => {
      return apiRequest('POST', '/api/ai/interview', interviewData);
    },
    onSuccess: () => {
      toast({
        title: "Interview Complete!",
        description: "Money Mind is now analyzing your responses to create your personalized financial plan.",
      });
      setIsComplete(true);
    },
    onError: (error) => {
      toast({
        title: "Error Saving Interview",
        description: "There was a problem saving your responses. Please try again.",
        variant: "destructive",
      });
    }
  });

  const question = interviewQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / interviewQuestions.length) * 100;

  const handleResponse = (value: any) => {
    setResponses(prev => ({
      ...prev,
      [question.id]: value
    }));
  };

  const handleNext = () => {
    if (question.required && !responses[question.id]) {
      toast({
        title: "Response Required",
        description: "Please answer this question before continuing.",
        variant: "destructive",
      });
      return;
    }

    if (currentQuestion < interviewQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Complete the interview
      saveInterviewMutation.mutate({
        responses,
        completedAt: new Date().toISOString()
      });
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    // Store flag to show personalized plan
    localStorage.setItem('showPersonalizedPlan', 'true');
    localStorage.setItem('interviewResponses', JSON.stringify(responses));
    setLocation('/coach');
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderQuestion = () => {
    const currentValue = responses[question.id];

    switch (question.type) {
      case 'multiple-choice':
        return (
          <RadioGroup
            value={currentValue || ''}
            onValueChange={handleResponse}
            className="space-y-3"
          >
            {question.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={option} />
                <Label htmlFor={option} className="cursor-pointer flex-1 py-2">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'multi-select':
        const selectedOptions = currentValue || [];
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={option}
                  checked={selectedOptions.includes(option)}
                  onChange={(e) => {
                    const newSelection = e.target.checked
                      ? [...selectedOptions, option]
                      : selectedOptions.filter((item: string) => item !== option);
                    handleResponse(newSelection);
                  }}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor={option} className="cursor-pointer flex-1 py-2">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'range':
        return (
          <div className="space-y-4">
            <input
              type="range"
              min={question.min}
              max={question.max}
              step={question.step}
              value={currentValue || question.min}
              onChange={(e) => handleResponse(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="text-center">
              <span className="text-2xl font-bold text-primary">
                ${(currentValue || question.min).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>${question.min?.toLocaleString()}</span>
              <span>${question.max?.toLocaleString()}+</span>
            </div>
          </div>
        );

      case 'text':
        return (
          <Textarea
            value={currentValue || ''}
            onChange={(e) => handleResponse(e.target.value)}
            placeholder={question.placeholder}
            className="min-h-24"
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={currentValue || ''}
            onChange={(e) => handleResponse(Number(e.target.value))}
            placeholder={question.placeholder}
            min={question.min}
            max={question.max}
            step={question.step}
          />
        );

      default:
        return null;
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="lg:flex">
          <div className="hidden lg:block lg:w-64 lg:fixed lg:inset-y-0">
            <Sidebar user={user} />
          </div>
          
          <div className="lg:pl-64 flex-1">
            <TopNav title="Money Mind Interview" />
            
            <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Card className="text-center bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-200">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                  
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-4">
                    Interview Complete! 🎉
                  </h2>
                  
                  <p className="text-gray-600 mb-6">
                    Thanks for sharing your financial journey with me! I'm now analyzing your responses 
                    to create a personalized financial plan just for you.
                  </p>
                  
                  <div className="bg-white p-4 rounded-lg mb-6 border border-teal-200">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-bold">MM</span>
                      </div>
                      <span className="font-medium">Money Mind</span>
                    </div>
                    <p className="text-sm text-gray-600 italic">
                      "Based on your responses, I'm excited to help you {responses['financial-goals']?.[0]?.toLowerCase() || 'achieve your financial goals'}. 
                      Let's build a plan that works for your {responses['current-situation']?.toLowerCase() || 'unique situation'}!"
                    </p>
                  </div>
                  
                  <Button onClick={handleFinish} className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white">
                    See My Personalized Plan
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </main>
          </div>
        </div>
        
        <div className="lg:hidden">
          <BottomNavigation user={user} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50">
      <div className="lg:flex">
        <div className="hidden lg:block lg:w-64 lg:fixed lg:inset-y-0">
          <Sidebar user={user} />
        </div>
        
        <div className="lg:pl-64 flex-1">
          <TopNav title="Money Mind Interview" />
          
          <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Progress Header */}
            <Card className="mb-6 bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-200">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center mr-4">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                      Money Mind Interview
                    </h1>
                    <p className="text-sm text-gray-600">Let's get to know your financial goals</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Question {currentQuestion + 1} of {interviewQuestions.length}</span>
                    <span>{Math.round(progress)}% Complete</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Question Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">
                  {question.question}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </CardTitle>
                {question.description && (
                  <p className="text-sm text-gray-600">{question.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {renderQuestion()}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between mb-20 lg:mb-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className="flex items-center z-10 relative"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={saveInterviewMutation.isPending}
                className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white flex items-center z-10 relative"
              >
                {saveInterviewMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : currentQuestion === interviewQuestions.length - 1 ? (
                  <>
                    Complete Interview
                    <Check className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>

            {/* Helpful Tips */}
            <Card className="mt-6 bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                    <span className="text-white text-xs font-bold">MM</span>
                  </div>
                  <div>
                    <p className="text-sm text-blue-800">
                      <strong>💡 Tip:</strong> The more honest and detailed your answers, the better I can help you create a personalized financial plan that actually works for your life!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
      
      <div className="lg:hidden">
        <BottomNavigation user={user} />
      </div>
    </div>
  );
}