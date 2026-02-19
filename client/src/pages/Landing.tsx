import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChessCrownLogo } from '@/components/Logo';
import { InstallPrompt } from '@/components/InstallPrompt';
import { 
  TrendingUp, 
  Shield, 
  Target, 
  Zap, 
  Users, 
  Star, 
  CheckCircle, 
  ArrowRight,
  CreditCard,
  PiggyBank,
  BarChart3,
  MessageCircle,
  Smartphone,
  Globe,
  Sparkles,
  Check
} from 'lucide-react';

export default function Landing() {
  const [, setLocation] = useLocation();
  
  const handleNavigateToRegister = () => {
    try {
      console.log('Navigating to register page...');
      setLocation('/register');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const painPointFeatures = [
    {
      icon: TrendingUp,
      title: "Tired of wondering where your money goes?",
      description: "Instantly track every dollar."
    },
    {
      icon: PiggyBank,
      title: "Struggling to save?",
      description: "Set goals and watch your progress grow automatically."
    },
    {
      icon: CreditCard,
      title: "Worried about debt?",
      description: "Get clarity on your balances and a plan to crush it."
    },
    {
      icon: BarChart3,
      title: "Ready for a fresh start?",
      description: "Join the 30-Day Money Reset and transform your habits."
    }
  ];

  const plans = [
    {
      tier: "free",
      name: "Basic",
      price: "Free",
      period: "forever",
      description: "Get started with essential money tracking",
      features: [
        "Bank account linking (Plaid)",
        "Weekly & monthly spending snapshot",
        "Top 3 spending categories",
        "Daily check-in (encouragement)",
        "Basic financial dashboard"
      ],
      cta: "Start Free",
      popular: false
    },
    {
      tier: "plus",
      name: "Plus",
      price: "$5.99",
      period: "month",
      annualPrice: "$49",
      annualSavings: "Save $22.88/year",
      description: "Transform your money habits",
      features: [
        "Everything in Basic",
        "AI Financial Interview",
        "AI-Generated Budget",
        "30-Day Money Reset Challenge",
        "Weekly AI Insights",
        "AI-Assisted Goals",
        "20 AI coach messages/month"
      ],
      cta: "Get Plus",
      popular: true
    },
    {
      tier: "pro",
      name: "Pro",
      price: "$9.99",
      period: "month",
      annualPrice: "$89",
      annualSavings: "Save $30.88/year",
      description: "Complete financial transformation",
      features: [
        "Everything in Plus",
        "Unlimited AI Money Coach",
        "Advanced AI Insights & Projections",
        "Goal Optimization & Rebalancing",
        "Priority support"
      ],
      cta: "Get Pro",
      popular: false
    }
  ];

  const testimonials = [
    {
      name: "Jacqueline Evans",
      role: "Salesforce Implementation Specialist",
      content: "The AI components, goals and gamification feature to celebrate the achievements of goals, interview to determine their financial personality to customize their 30-day ACTION plan is top tier!!! This app WILL change lives!!!",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Software Engineer",
      content: "Finally, a financial app that actually understands my goals. The personalized recommendations are spot-on.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Teacher",
      content: "I've tried many budgeting apps, but Money Mind's AI coach makes financial planning actually enjoyable.",
      rating: 5
    }
  ];


  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-2">
              <ChessCrownLogo className="w-7 h-7" color="text-emerald-600" />
              <span className="text-lg font-bold text-gray-900">
                Mind My Money
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">Features</a>
              <a href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">How It Works</a>
              <a href="#pricing" className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">Pricing</a>
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/login')}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Sign In
              </Button>
              <Button 
                onClick={handleNavigateToRegister}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 font-medium text-sm px-4 py-1.5">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Basic plan free forever
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-5 leading-[1.1]">
            Your Financial
            <br />
            <span className="text-emerald-600">Transformation System</span>
          </h1>
          
          <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
            More than budgeting — Mind My Money helps you align your finances with your goals and values.
          </p>
          
          <div className="flex justify-center mb-14">
            <Button 
              size="lg" 
              onClick={handleNavigateToRegister}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-base font-semibold px-8 py-3 h-12 rounded-lg"
            >
              Create Free Account
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button 
              variant="outline"
              onClick={() => setLocation('/login')}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 text-base font-medium px-8 py-3 h-12 rounded-lg"
            >
              Log In
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-sm text-gray-400">
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-2 text-emerald-500" />
              <span>Bank-level security with Plaid</span>
            </div>
            <div className="flex items-center">
              <Zap className="w-4 h-4 mr-2 text-emerald-500" />
              <span>Cancel anytime, no hidden fees</span>
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2 text-emerald-500" />
              <span>Trusted by everyday people who want to master their money</span>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-3">
              Master Your Money. Live With Purpose.
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Here's how we help you take back control
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {painPointFeatures.map((feature, index) => (
              <Card key={index} className="rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
                <CardContent className="p-6">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-3">
              How It Works
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Get started in minutes
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-4xl mx-auto">
            {[
              {
                step: 1,
                icon: Smartphone,
                title: "Connect Accounts",
                description: "Securely link your banks and cards."
              },
              {
                step: 2,
                icon: MessageCircle,
                title: "Meet Money Mind",
                description: "AI learns your goals and habits."
              },
              {
                step: 3,
                icon: BarChart3,
                title: "Get Insights",
                description: "Receive personalized recommendations."
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-5 text-lg font-bold">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-3">
              User Reviews
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-5 text-sm leading-relaxed">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{testimonial.name}</p>
                    <p className="text-xs text-gray-400">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-3">
              Choose Your Plan
            </h2>
            <p className="text-lg text-gray-500">Start free, upgrade when you're ready to transform</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative rounded-2xl transition-shadow ${
                plan.popular 
                  ? 'border-2 border-emerald-500 shadow-md' 
                  : 'border border-gray-200 shadow-sm hover:shadow-md'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-emerald-600 text-white text-xs font-semibold px-3 py-0.5">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                    <p className="text-gray-500 text-sm mb-4">{plan.description}</p>
                    
                    <div className="mb-2">
                      <div className="flex items-baseline justify-center">
                        <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                        {plan.period !== 'forever' && (
                          <span className="text-gray-400 ml-1 text-sm">/{plan.period}</span>
                        )}
                      </div>
                      {plan.annualPrice && (
                        <div className="text-xs text-emerald-600 font-medium mt-1">
                          or {plan.annualPrice}/year · {plan.annualSavings}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="w-4 h-4 mr-2.5 flex-shrink-0 text-emerald-500 mt-0.5" />
                        <span className="text-gray-600 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${
                      plan.popular
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={handleNavigateToRegister}
                  >
                    {plan.cta}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <p className="text-sm text-gray-400">
              Basic plan is free forever · Upgrade anytime · Cancel anytime
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-300 py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <ChessCrownLogo className="w-7 h-7" color="text-emerald-400" />
                <span className="text-lg font-bold text-white">Mind My Money</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                AI-powered financial coaching to help you achieve your money goals.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white text-sm mb-4">Product</h4>
              <ul className="space-y-2.5">
                <li><a href="#features" className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">Security</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white text-sm mb-4">Company</h4>
              <ul className="space-y-2.5">
                <li><a href="#" className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">About</a></li>
                <li><a href="#" className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">Blog</a></li>
                <li><a href="#" className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">Careers</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white text-sm mb-4">Support</h4>
              <ul className="space-y-2.5">
                <li><a href="#" className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">Contact</a></li>
                <li><a href="/privacy" className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-10 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              © 2026 Mind My Money. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      
      <InstallPrompt />
    </div>
  );
}