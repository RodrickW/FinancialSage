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
    title: 'Welcome to Your Financial Transformation! 🚀',
    description: 'Mind My Money isn\'t just another budgeting app. It\'s a complete system designed to transform your relationship with money. Let me show you how it works.',
    target: '',
    position: 'top'
  },
  {
    id: 'money-mind-interview',
    title: 'Step 1: Discover Your Money Personality 🧠',
    description: 'Start with the Money Mind Interview to uncover your unique money personality, emotional triggers, and hidden patterns. This creates your personalized Money Playbook.',
    target: '[data-tour="money-mind-interview"]',
    position: 'bottom',
    spotlight: true
  },
  {
    id: 'connect-account',
    title: 'Step 2: Connect Your Accounts 🏦',
    description: 'Securely link your bank accounts to get real-time insights. We use bank-level encryption through Plaid to keep your data safe.',
    target: '[data-tour="connect-account"]',
    position: 'bottom',
    spotlight: true
  },
  {
    id: 'daily-checkin',
    title: 'Step 3: Build Daily Money Habits ✅',
    description: 'The Daily Check-In takes just 60 seconds but builds powerful money awareness habits. Track your streak and watch your relationship with money transform.',
    target: '[data-tour="daily-checkin"]',
    position: 'bottom',
    spotlight: true
  },
  {
    id: 'money-reset',
    title: 'Step 4: The 30-Day Money Reset 💪',
    description: 'Our signature challenge! 30 days of AI-powered missions designed to rewire your money habits. Daily challenges, weekly reflections, and real transformation.',
    target: '[data-tour="money-reset"]',
    position: 'bottom',
    spotlight: true
  },
  {
    id: 'ai-coach',
    title: 'Your Personal AI Coach 💬',
    description: 'Money Mind is your 24/7 financial coach. Ask any question about budgeting, saving, debt - get personalized advice based on YOUR financial data.',
    target: '[data-tour="ai-coach"]',
    position: 'top',
    spotlight: true
  },
  {
    id: 'faith-mode',
    title: 'Faith-Based Mode ✝️',
    description: 'Optional: Toggle on Faith Mode for biblical stewardship guidance. Get scripture-based insights and frame your finances through the lens of faithful stewardship.',
    target: '[data-tour="faith-mode"]',
    position: 'bottom',
    spotlight: true
  },
  {
    id: 'complete',
    title: 'Ready to Transform Your Finances? ✨',
    description: 'Start with the Money Mind Interview to get your personalized plan. Your financial transformation journey begins now!',
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