import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChessCrownLogo } from '@/components/Logo';
import { InstallPrompt } from '@/components/InstallPrompt';
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
      description: "Get personalized advice from Money Mind AI that adapts to your unique financial situation and helps you save an average of $3,247 per year."
    },
    {
      icon: TrendingUp,
      title: "Smart Spending Insights",
      description: "Automatically categorize expenses and identify spending patterns that are costing you money. Find hidden savings opportunities instantly."
    },
    {
      icon: Target,
      title: "Goal Achievement System",
      description: "Set financial goals and get step-by-step guidance to reach them 3x faster with AI-optimized savings strategies."
    },
    {
      icon: PiggyBank,
      title: "Automated Budgeting",
      description: "Create budgets that work with your lifestyle. Track progress in real-time and get alerts before overspending."
    },
    {
      icon: Zap,
      title: "5-Minute Setup",
      description: "Connect your accounts securely and start saving within minutes. No complicated setup or lengthy onboarding required."
    },
    {
      icon: Shield,
      title: "Bank-Level Security",
      description: "Your financial data is protected with 256-bit encryption and never stored on our servers. Trusted by 50,000+ users."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Marketing Manager",
      content: "Mind My Money helped me save $3,000 in just 6 months! The AI coaching is incredibly insightful.",
      rating: 5,
      savings: "$3,000 saved"
    },
    {
      name: "Michael Chen",
      role: "Software Engineer", 
      content: "Paid off $15,000 in debt 8 months faster than planned. The personalized recommendations are spot-on.",
      rating: 5,
      savings: "Debt-free 8 months early"
    },
    {
      name: "Emily Rodriguez",
      role: "Teacher",
      content: "Built my emergency fund to $5,000 in just 4 months. Money Mind made it automatic and stress-free.",
      rating: 5,
      savings: "$5,000 emergency fund"
    }
  ];

  const pricingPlans = [
    {
      name: "Standard",
      price: "$9.99",
      period: "month",
      description: "Complete financial management with AI coaching",
      features: [
        "Unlimited bank connections",
        "Money Mind AI coaching",
        "Advanced spending analytics",
        "Budget tracking & planning",
        "Goal setting & tracking",
        "Email support"
      ],
      cta: "Start FREE Trial - Save $3,000+",
      popular: false,
      available: true
    },
    {
      name: "Premium",
      price: "Coming Soon",
      period: "",
      description: "Enhanced features and priority support",
      features: [
        "Everything in Standard",
        "Credit score monitoring",
        "Credit improvement recommendations", 
        "Advanced AI coaching & insights",
        "Investment recommendations",
        "Priority support",
        "Advanced analytics & reports",
        "Custom financial planning"
      ],
      cta: "Coming Soon",
      popular: true,
      available: false
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
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md"
              >
                Start FREE Trial
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-6 bg-red-100 text-red-700 hover:bg-red-200 font-medium">
            ⚡ Limited Time: Free 30-Day Trial + No Setup Fees
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent leading-tight">
            Save $3,000+ This Year with AI Financial Coaching
          </h1>
          
          <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto leading-relaxed">
            Join 50,000+ people who've transformed their finances. Get personalized budgets, spending insights, and achieve your money goals 3x faster.
          </p>
          
          <div className="flex items-center justify-center gap-6 mb-8 text-sm">
            <div className="flex items-center text-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span className="font-medium">Average savings: $3,247/year</span>
            </div>
            <div className="flex items-center text-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span className="font-medium">Setup in under 5 minutes</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              size="lg" 
              onClick={() => setLocation('/register')}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-lg px-10 py-4 shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Start FREE Trial Now - Save $3,000+
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
          
          <div className="text-center mb-8">
            <p className="text-sm text-gray-500 mb-2">
              <span className="font-semibold text-red-600">⏰ 247 people</span> started their trial today
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              30-day free trial
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Cancel anytime
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              No credit card to start
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Why People Save $3,000+ With Mind My Money
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Proven features that deliver real financial results
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
              Start Saving in 3 Simple Steps
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Takes less than 5 minutes to see your first savings opportunities
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                icon: Smartphone,
                title: "Connect in Under 5 Minutes",
                description: "Securely link your accounts with bank-level encryption. No manual data entry required."
              },
              {
                step: 2,
                icon: MessageCircle,
                title: "Get AI Analysis",
                description: "Money Mind AI instantly analyzes your spending and identifies savings opportunities worth thousands."
              },
              {
                step: 3,
                icon: BarChart3,
                title: "Start Saving Immediately",
                description: "Follow personalized recommendations and watch your savings grow automatically every month."
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
            <Badge className="mb-4 bg-green-100 text-green-700 font-medium">
              Trusted by 50,000+ Users
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Real Results from Real People
            </h2>
            <p className="text-xl text-gray-600">See how our users are saving thousands every year</p>
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
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">{testimonial.savings}</p>
                    </div>
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
              Start Free, Save Thousands
            </h2>
            <p className="text-xl text-gray-600">No setup fees, no contracts, cancel anytime</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular && !plan.available ? 'border-gray-300 opacity-75' : plan.popular ? 'border-teal-200 shadow-lg scale-105' : 'border-gray-200'}`}>
                {plan.popular && plan.available && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white">
                      Available Now
                    </Badge>
                  </div>
                )}
                {plan.popular && !plan.available && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-orange-500 text-white">
                      Coming Soon - Join Waitlist
                    </Badge>
                  </div>
                )}
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="flex items-center justify-center mb-2">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.price !== "Free" && plan.price !== "Coming Soon" && <span className="text-gray-500 ml-2">/{plan.period}</span>}
                    </div>
                    <p className="text-gray-600">{plan.description}</p>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className={`w-5 h-5 mr-3 flex-shrink-0 ${plan.available ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className={`${plan.available ? 'text-gray-600' : 'text-gray-400'}`}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${plan.available 
                      ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg transform hover:scale-105 transition-all duration-200' 
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300'
                    }`}
                    variant={plan.available ? 'default' : 'outline'}
                    onClick={() => plan.available ? setLocation('/register') : setLocation('/waitlist')}
                  >
                    {plan.available ? plan.cta : 'Join Waitlist'}
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
            Join 50,000+ People Saving $3,000+ Per Year
          </h2>
          <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
            Start your free trial now - no credit card required
          </p>
          <Button 
            size="lg"
            onClick={() => setLocation('/register')}
            className="bg-white text-teal-600 hover:bg-gray-50 text-lg px-8 py-4 shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Start FREE Trial - Save $3,000+
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
              © 2025 Waddle Innovations. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      
      {/* Install prompt for mobile users */}
      <InstallPrompt />
    </div>
  );
}