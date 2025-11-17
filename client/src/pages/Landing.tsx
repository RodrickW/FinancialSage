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
  Globe
} from 'lucide-react';
import { MoneyMindLogo } from '@/components/Logo';

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
      title: "Want to build credit?",
      description: "Unlock tools to boost your score over time."
    }
  ];

  const plans = [
    {
      name: "Monthly Plan",
      price: "$9.99",
      period: "month",
      originalPrice: null,
      savings: null,
      description: "Perfect for getting started with AI-powered financial management",
      features: [
        "AI Financial Coach",
        "Bank Account Integration", 
        "Smart Budget Creation",
        "Spending Analytics",
        "Savings Goal Tracking",
        "Credit Score Monitoring"
      ],
      cta: "Start Free Trial",
      popular: false
    },
    {
      name: "Annual Plan", 
      price: "$95.99",
      period: "year",
      originalPrice: "$119.88",
      savings: "Save $23.89",
      description: "Best value! Save 20% with annual billing",
      features: [
        "Everything in Monthly",
        "20% Annual Savings",
        "Priority Support",
        "Advanced Analytics",
        "Export Features",
        "Early Access to New Features"
      ],
      cta: "Start Free Trial",
      popular: true
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Marketing Manager",
      content: "Mind My Money helped me save $3,000 in just 6 months! The AI coaching is incredibly insightful.",
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

  const mainPlan = {
    name: "Mind My Money",
    price: "$9.99",
    period: "month",
    annualPrice: "$95.99",
    annualSavings: "Save $23.89 yearly",
    description: "Complete AI-powered financial management system",
    features: [
      "Unlimited bank connections",
      "Money Mind AI coaching",
      "Advanced spending analytics",
      "Smart budget tracking",
      "Goal setting & tracking",
      "Real-time transaction sync",
      "Personalized insights",
      "Priority email support"
    ],
    cta: "Start Your 14-Day Free Trial",
    available: true
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <ChessCrownLogo className="w-8 h-8" color="text-blue-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                Mind My Money
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors">How It Works</a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</a>
              <Button 
                variant="outline" 
                onClick={() => setLocation('/login')}
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                Sign In
              </Button>
              <Button 
                onClick={handleNavigateToRegister}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          {/* Large Logo */}
          <div className="flex justify-center mb-8">
            <MoneyMindLogo className="w-32 h-32 md:w-40 md:h-40" />
          </div>
          
          <Badge className="mb-6 bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium">
            ✨ Start your free 14-day trial today. No credit card required. ✨
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-transparent leading-tight">
            Master your money. Live with purpose.
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            More than budgeting — Mind My Money helps you align your finances with your goals and values.
          </p>
          
          <div className="flex flex-col gap-4 justify-center mb-12 max-w-md mx-auto">
            <Button 
              size="lg" 
              onClick={handleNavigateToRegister}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-lg px-8 py-4 shadow-lg"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => setLocation('/login')}
              className="w-full border-2 border-blue-200 text-blue-600 hover:bg-blue-50 text-lg px-8 py-4"
            >
              Login/See Demo
            </Button>
          </div>
          
          {/* Trust Signals */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-sm text-gray-600 max-w-2xl mx-auto">
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-2 text-green-500" />
              <span>Bank-level security with Plaid</span>
            </div>
            <div className="flex items-center">
              <Zap className="w-4 h-4 mr-2 text-green-500" />
              <span>Cancel anytime, no hidden fees</span>
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2 text-green-500" />
              <span>Trusted by everyday people who want to master their money</span>
            </div>
          </div>
          

        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              We Get It. Money Stress Is Real.
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Here's how we help you take back control
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {painPointFeatures.map((feature, index) => (
              <Card key={index} className="border-blue-100 hover:border-blue-200 transition-colors group hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:from-blue-200 group-hover:to-blue-200 transition-colors">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in minutes
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-blue-200">
                    <span className="text-sm font-bold text-blue-600">{step.step}</span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
          

        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              User Reviews
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-blue-100 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - Dual Cards */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Simple Pricing
            </h2>
            <p className="text-xl text-gray-600">Try free for 14 days, then choose monthly or annual</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative border-2 transition-all duration-300 hover:shadow-xl ${
                plan.popular 
                  ? 'border-blue-300 shadow-xl scale-105' 
                  : 'border-blue-200 hover:border-blue-300'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-1">
                      🏆 Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-center">
                        <span className="text-4xl font-bold">{plan.price}</span>
                        <span className="text-gray-500 ml-2">/{plan.period}</span>
                      </div>
                      {plan.savings && (
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-sm text-gray-400 line-through">{plan.originalPrice}</span>
                          <span className="text-sm text-green-600 font-semibold">{plan.savings}</span>
                        </div>
                      )}
                      {plan.period === 'year' && (
                        <div className="text-sm text-gray-600">
                          Just $7.99/month when billed annually
                        </div>
                      )}
                    </div>
                    
                    <p className="text-gray-600">{plan.description}</p>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0 text-green-500" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full text-lg py-4 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white'
                        : 'border-2 border-blue-500 text-blue-600 hover:bg-blue-50'
                    }`}
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={handleNavigateToRegister}
                  >
                    {plan.cta}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              🎉 14-day free trial for both plans • No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <ChessCrownLogo className="w-8 h-8" color="text-blue-400" />
                <span className="text-xl font-bold text-white">Mind My Money</span>
              </div>
              <p className="text-gray-400">
                AI-powered financial coaching to help you achieve your money goals.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-blue-400 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-blue-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Security</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-blue-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Careers</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Contact</a></li>
                <li><a href="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 Mind My Money. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      
      {/* Install prompt for mobile users */}
      <InstallPrompt />
    </div>
  );
}