import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChessCrownLogo } from '@/components/Logo';
import { 
  Brain, 
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

export default function Landing() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Coaching",
      description: "Get personalized financial advice from Money Mind, your intelligent AI coach that learns your spending habits and goals."
    },
    {
      icon: TrendingUp,
      title: "Smart Analytics",
      description: "Visualize your spending patterns, track trends, and discover insights to optimize your financial health."
    },
    {
      icon: Target,
      title: "Goal Tracking",
      description: "Set and achieve financial goals with intelligent recommendations and progress tracking."
    },
    {
      icon: CreditCard,
      title: "Credit Score Monitoring",
      description: "Track your credit score and get actionable tips to improve your creditworthiness."
    },
    {
      icon: PiggyBank,
      title: "Automated Budgeting",
      description: "Create and manage budgets that adapt to your lifestyle with AI-powered recommendations."
    },
    {
      icon: Shield,
      title: "Bank-Level Security",
      description: "Your financial data is protected with enterprise-grade encryption and security measures."
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

  const pricingPlans = [
    {
      name: "Standard",
      price: "$9.99",
      period: "month",
      description: "Essential financial management with AI coaching",
      features: [
        "Unlimited bank connections",
        "Money Mind AI coaching",
        "Basic spending analytics",
        "Budget tracking & planning",
        "Goal setting & tracking",
        "Email support"
      ],
      cta: "Start 7-Day Free Trial",
      popular: false
    },
    {
      name: "Premium",
      price: "$14.99",
      period: "month",
      description: "Advanced features with credit monitoring & insights",
      features: [
        "Everything in Standard",
        "Advanced AI coaching & insights",
        "Credit score monitoring",
        "Credit improvement recommendations",
        "Advanced analytics & reports",
        "Investment recommendations",
        "Priority support"
      ],
      cta: "Start 7-Day Free Trial",
      popular: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-teal-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <ChessCrownLogo className="w-8 h-8" color="text-teal-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Mind My Money
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-teal-600 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-teal-600 transition-colors">How It Works</a>
              <a href="#pricing" className="text-gray-600 hover:text-teal-600 transition-colors">Pricing</a>
              <Button 
                variant="outline" 
                onClick={() => setLocation('/login')}
                className="border-teal-200 text-teal-600 hover:bg-teal-50"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => setLocation('/register')}
                className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white"
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
          <Badge className="mb-6 bg-teal-100 text-teal-700 hover:bg-teal-200">
            🎉 New: AI-Powered Financial Coaching
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent leading-tight">
            Transform Your Financial Future with AI
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Meet Money Mind, your intelligent financial coach. Get personalized insights, 
            smart budgeting recommendations, and achieve your financial goals faster than ever.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              onClick={() => setLocation('/register')}
              className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-lg px-8 py-4"
            >
              Start Your 7-Day Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => setLocation('/login')}
              className="border-teal-200 text-teal-600 hover:bg-teal-50 text-lg px-8 py-4"
            >
              See Demo
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              No credit card required
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              7-day free trial
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Powerful Features for Smart Money Management
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to take control of your finances and build lasting wealth
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-teal-100 hover:border-teal-200 transition-colors group hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-lg flex items-center justify-center mb-4 group-hover:from-teal-200 group-hover:to-emerald-200 transition-colors">
                    <feature.icon className="w-6 h-6 text-teal-600" />
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
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              How Mind My Money Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get started in minutes and transform your financial life
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                icon: Smartphone,
                title: "Connect Your Accounts",
                description: "Securely link your bank accounts, credit cards, and investments with bank-level encryption."
              },
              {
                step: 2,
                icon: MessageCircle,
                title: "Meet Money Mind",
                description: "Complete our AI interview to help Money Mind understand your financial goals and situation."
              },
              {
                step: 3,
                icon: BarChart3,
                title: "Get Personalized Insights",
                description: "Receive custom recommendations, budgets, and coaching to achieve your financial dreams."
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-teal-200">
                    <span className="text-sm font-bold text-teal-600">{step.step}</span>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Loved by Thousands of Users
            </h2>
            <p className="text-xl text-gray-600">See what our community is saying about Mind My Money</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-teal-100 hover:shadow-lg transition-shadow">
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

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600">Start free, upgrade when you're ready</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-teal-200 shadow-lg scale-105' : 'border-gray-200'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="flex items-center justify-center mb-2">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.price !== "Free" && <span className="text-gray-500 ml-2">/{plan.period}</span>}
                    </div>
                    <p className="text-gray-600">{plan.description}</p>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${plan.popular 
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white' 
                      : 'border-teal-200 text-teal-600 hover:bg-teal-50'
                    }`}
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => setLocation('/register')}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-teal-600 to-emerald-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Financial Future?
          </h2>
          <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already achieving their financial goals with Mind My Money
          </p>
          <Button 
            size="lg"
            onClick={() => setLocation('/register')}
            className="bg-white text-teal-600 hover:bg-gray-50 text-lg px-8 py-4"
          >
            Start Your Free Trial Today
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <ChessCrownLogo className="w-8 h-8" color="text-teal-400" />
                <span className="text-xl font-bold text-white">Mind My Money</span>
              </div>
              <p className="text-gray-400">
                AI-powered financial coaching to help you achieve your money goals.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-teal-400 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-teal-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Security</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-teal-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Careers</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-teal-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-teal-400 transition-colors">Contact</a></li>
                <li><a href="/privacy" className="hover:text-teal-400 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 Mind My Money. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}