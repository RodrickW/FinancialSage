import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  spotlight?: boolean;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Mind My Money! 🎉',
    description: 'Let\'s take a quick tour to show you how to manage your finances like a pro. This will only take 2 minutes.',
    target: '',
    position: 'top'
  },
  {
    id: 'connect-account',
    title: 'Connect Your Bank Account',
    description: 'Start by connecting your bank account to get real-time transaction data and insights.',
    target: '[data-tour="connect-account"]',
    position: 'bottom',
    spotlight: true
  },
  {
    id: 'financial-overview',
    title: 'Your Financial Dashboard',
    description: 'These cards show your spending patterns - daily, weekly, monthly, and total balance at a glance.',
    target: '[data-tour="financial-overview"]',
    position: 'bottom',
    spotlight: true
  },
  {
    id: 'spending-trends',
    title: 'Spending Analysis',
    description: 'Track your spending by category and see monthly trends to understand where your money goes.',
    target: '[data-tour="spending-trends"]',
    position: 'top',
    spotlight: true
  },
  {
    id: 'transactions',
    title: 'Recent Transactions',
    description: 'View and categorize your recent transactions. All data is automatically synced from your connected accounts.',
    target: '[data-tour="transactions"]',
    position: 'top',
    spotlight: true
  },
  {
    id: 'credit-score',
    title: 'Credit Score Monitoring',
    description: 'Keep track of your credit score and get recommendations for improvement.',
    target: '[data-tour="credit-score"]',
    position: 'left',
    spotlight: true
  },
  {
    id: 'ai-coach',
    title: 'AI Financial Coach',
    description: 'Meet your personal AI coach! Ask questions about budgeting, saving, or get personalized financial advice.',
    target: '[data-tour="ai-coach"]',
    position: 'top',
    spotlight: true
  },
  {
    id: 'complete',
    title: 'You\'re All Set! ✨',
    description: 'You\'re ready to take control of your finances. Start by connecting your first account and explore the features.',
    target: '',
    position: 'top'
  }
];

interface OnboardingTourProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export default function OnboardingTour({ isOpen, onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Add spotlight effect
      document.body.classList.add('tour-active');
    } else {
      setIsVisible(false);
      document.body.classList.remove('tour-active');
    }

    return () => {
      document.body.classList.remove('tour-active');
    };
  }, [isOpen]);

  useEffect(() => {
    if (isVisible && currentStep < tourSteps.length) {
      const step = tourSteps[currentStep];
      if (step.target) {
        const element = document.querySelector(step.target);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          if (step.spotlight) {
            // Add spotlight effect
            element.classList.add('tour-spotlight');
            setTimeout(() => element.classList.remove('tour-spotlight'), 3000);
          }
        }
      }
    }
  }, [currentStep, isVisible]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip();
  };

  if (!isVisible) return null;

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 tour-overlay" />
      
      {/* Tour Card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 fade-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">{currentStep + 1}</span>
              </div>
              <span className="text-sm text-gray-500">
                Step {currentStep + 1} of {tourSteps.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div 
              className="bg-black h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Content */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-black mb-2">{step.title}</h2>
            <p className="text-gray-600 leading-relaxed">{step.description}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="flex items-center space-x-1 btn-animate"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Previous</span>
                </Button>
              )}
            </div>

            <div className="flex space-x-2">
              {currentStep < tourSteps.length - 1 ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Skip Tour
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="bg-black text-white hover:bg-gray-800 flex items-center space-x-1 btn-animate"
                  >
                    <span>Next</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleComplete}
                  className="bg-black text-white hover:bg-gray-800 flex items-center space-x-1 btn-animate"
                >
                  <Check className="h-4 w-4" />
                  <span>Get Started</span>
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}