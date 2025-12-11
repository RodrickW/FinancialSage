import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import TopNav from '@/components/TopNav';
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
// Removed mock data import - using real API data only

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
  // SECTION 1: Financial Goals & Situation
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
  // SECTION 2: Emotional Relationship with Money
  {
    id: 'money-childhood',
    type: 'multiple-choice',
    question: "How was money talked about in your childhood?",
    description: "Our early experiences shape how we handle money today.",
    options: [
      'Money was a source of stress and conflict',
      'We never talked about money',
      'Money was always tight - we had to be careful',
      'We lived comfortably but were taught to save',
      'Money was abundant and not a concern',
      'I learned good money habits from my parents'
    ],
    required: true
  },
  {
    id: 'money-feeling',
    type: 'multiple-choice',
    question: "When you think about your finances, what's the first emotion that comes up?",
    description: "Be honest - there's no wrong answer.",
    options: [
      'Anxiety or stress',
      'Guilt or shame',
      'Confusion or overwhelm',
      'Hope but uncertainty',
      'Neutral - I try not to think about it',
      'Confident and in control',
      'Motivated to do better'
    ],
    required: true
  },
  {
    id: 'money-avoidance',
    type: 'multiple-choice',
    question: "How often do you avoid looking at your bank account or bills?",
    options: [
      'Almost always - I hate checking',
      'Often - especially when I know it\'s bad',
      'Sometimes - depends on my mood',
      'Rarely - I check pretty regularly',
      'Never - I monitor my finances closely'
    ],
    required: true
  },
  // SECTION 3: Spending Triggers & Patterns
  {
    id: 'spending-triggers',
    type: 'multi-select',
    question: "What emotions or situations trigger you to spend money?",
    description: "Select all that apply - understanding your triggers is key to change.",
    options: [
      'Stress or anxiety',
      'Boredom',
      'Sadness or depression',
      'Celebrating good news',
      'Social pressure (keeping up with friends)',
      'Sales or "good deals"',
      'Feeling like I deserve it',
      'Retail therapy after a bad day',
      'FOMO (fear of missing out)',
      'Convenience (too tired to cook/plan)',
      'None - I rarely impulse spend'
    ],
    required: true
  },
  {
    id: 'impulse-behavior',
    type: 'multiple-choice',
    question: "After an impulse purchase, how do you typically feel?",
    options: [
      'Immediate regret and guilt',
      'Fine at first, then regret later',
      'Justified - I can explain why I needed it',
      'Happy and satisfied',
      'I don\'t really think about it',
      'I rarely make impulse purchases'
    ],
    required: true
  },
  {
    id: 'spending-weakness',
    type: 'multi-select',
    question: "Where does your money seem to disappear?",
    description: "Select all categories where you tend to overspend.",
    options: [
      'Dining out and food delivery',
      'Online shopping',
      'Subscriptions I forget about',
      'Entertainment and streaming',
      'Clothes and fashion',
      'Technology and gadgets',
      'Travel and experiences',
      'Gifts for others',
      'Self-care and beauty',
      'Hobbies',
      'Convenience items',
      'I\'m not sure - it just disappears'
    ],
    required: true
  },
  // SECTION 4: Saving Habits & Money Mindset
  {
    id: 'saving-frequency',
    type: 'multiple-choice',
    question: "How consistently do you save money?",
    options: [
      'Never - there\'s nothing left to save',
      'Rarely - only when I have extra',
      'Sometimes - I try but often fail',
      'Usually - most months I save something',
      'Always - I save automatically before spending'
    ],
    required: true
  },
  {
    id: 'saving-barrier',
    type: 'multiple-choice',
    question: "What's the biggest barrier to saving more money?",
    options: [
      'I genuinely don\'t have enough income',
      'I spend too much on wants vs needs',
      'Unexpected expenses keep coming up',
      'I don\'t know how much I should save',
      'I prioritize enjoying life now',
      'Debt payments take up my money',
      'I\'m actually saving fine - no major barriers'
    ],
    required: true
  },
  {
    id: 'money-belief',
    type: 'multiple-choice',
    question: "Which statement best describes your money mindset?",
    description: "Choose the one that feels most true for you.",
    options: [
      'Money is stressful and I\'ll never have enough',
      'I\'m bad with money and always will be',
      'Money is confusing and I don\'t understand it',
      'I could be good with money if I tried harder',
      'I\'m learning and getting better with money',
      'I\'m confident in my ability to manage money'
    ],
    required: true
  },
  // SECTION 5: Financial Context
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
  // SECTION 6: Personal Values & Motivation
  {
    id: 'money-why',
    type: 'text',
    question: "Why do you want to be better with money?",
    description: "What would financial freedom allow you to do or feel?",
    placeholder: "Example: I want to stop worrying about bills and be able to take my family on vacation...",
    required: true
  },
  {
    id: 'biggest-fear',
    type: 'multiple-choice',
    question: "What's your biggest financial fear?",
    options: [
      'Never getting out of debt',
      'Not being able to retire',
      'Being a burden to my family',
      'Losing my job and not having savings',
      'Never being able to afford a home',
      'Always living paycheck to paycheck',
      'Not being able to provide for my kids',
      'Unexpected medical expenses'
    ],
    required: true
  },
  {
    id: 'additional-info',
    type: 'text',
    question: "Is there anything else you'd like me to know about your relationship with money?",
    description: "Share any specific patterns, challenges, or goals I should know about.",
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

  const user: UserProfile = userData as any;

  // Save interview responses
  const saveInterviewMutation = useMutation({
    mutationFn: async (interviewData: any) => {
      const response = await apiRequest('POST', '/api/ai/interview', interviewData);
      return response.json();
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
    // Navigate to Money Playbook to see results
    setLocation('/money-playbook');
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
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 pb-16">
        <BottomNavigation user={user} />
        <TopNav title="Money Mind Interview" />
        
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-4">
                Interview Complete! 🎉
              </h2>
              
              <p className="text-gray-600 mb-6">
                Thanks for sharing your financial journey with me! I'm now analyzing your responses 
                to create a personalized financial plan just for you.
              </p>
              
              <div className="bg-white p-4 rounded-lg mb-6 border border-primary/20">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-sm font-bold">MM</span>
                  </div>
                  <span className="font-medium">Money Mind</span>
                </div>
                <p className="text-sm text-gray-600 italic">
                  "Based on your responses, I'm excited to help you {responses['financial-goals']?.[0]?.toLowerCase() || 'achieve your financial goals'}. 
                  Let's build a plan that works for your {responses['current-situation']?.toLowerCase() || 'unique situation'}!"
                </p>
              </div>
              
              <Button onClick={handleFinish} className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white">
                See My Personalized Plan
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 pb-16">
      <BottomNavigation user={user} />
      <TopNav title="Money Mind Interview" />
          
          <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Progress Header */}
            <Card className="mb-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mr-4">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
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
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white flex items-center z-10 relative"
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
            <Card className="mt-6 bg-emerald-50 border-emerald-200">
              <CardContent className="p-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
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
  );
}