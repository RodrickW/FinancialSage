import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

const { width, height } = Dimensions.get('window');

interface LandingScreenProps {
  navigation: NavigationProp<any>;
}

export function LandingScreen({ navigation }: LandingScreenProps) {
  const features = [
    {
      title: "AI Coaching",
      description: "Personalized advice from Money Mind AI that learns your habits and goals.",
      icon: "🧠"
    },
    {
      title: "Smart Analytics", 
      description: "Track spending patterns and discover insights to optimize your finances.",
      icon: "📊"
    },
    {
      title: "Goal Tracking",
      description: "Set financial goals and get recommendations to achieve them faster.", 
      icon: "🎯"
    },
    {
      title: "Auto Budgeting",
      description: "AI-powered budgets that adapt to your lifestyle automatically.",
      icon: "💰"
    },
    {
      title: "Quick Setup",
      description: "Connect accounts securely and get insights in minutes.",
      icon: "⚡"
    },
    {
      title: "Secure",
      description: "Bank-level encryption protects your financial data.",
      icon: "🔒"
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
      name: "Lisa Rodriguez",
      role: "Teacher",
      content: "The budgeting features are amazing. I finally feel in control of my finances!",
      rating: 5
    }
  ];

  const pricingPlans = [
    {
      name: "Monthly Plan",
      price: "$9.99",
      period: "month", 
      description: "Complete financial management with AI coaching",
      planType: "monthly",
      popular: false
    },
    {
      name: "Annual Plan",
      price: "$95.99",
      originalPrice: "$119.88",
      period: "year",
      savings: "Save $23.89",
      description: "Complete financial management with AI coaching - Best Value!",
      planType: "annual", 
      popular: true
    }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: rating }, (_, i) => (
      <Text key={i} style={styles.star}>⭐</Text>
    ));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor="#0d9488" />
      
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroContent}>
          <View style={styles.logoContainer}>
            <Logo size={60} showText={false} />
          </View>
          
          <Text style={styles.heroTitle}>Mind My Money</Text>
          <Text style={styles.heroSubtitle}>
            Your AI-Powered Financial Coach
          </Text>
          <Text style={styles.heroDescription}>
            Transform your relationship with money through personalized AI insights, smart budgeting, and goal tracking.
          </Text>
          
          <View style={styles.heroButtons}>
            <Button
              title="Login/See Demo"
              onPress={() => navigation.navigate('Login')}
              style={[styles.primaryButton, styles.heroButton]}
              textStyle={styles.primaryButtonText}
            />
            <Button
              title="Get Started"
              onPress={() => navigation.navigate('Register')}
              style={[styles.secondaryButton, styles.heroButton]}  
              textStyle={styles.secondaryButtonText}
            />
          </View>
          
          <View style={styles.trialInfo}>
            <Text style={styles.trialText}>✓ 30-day free trial</Text>
            <Text style={styles.trialText}>✓ Cancel anytime</Text>
            <Text style={styles.trialText}>✓ Credit card required</Text>
          </View>
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Choose Mind My Money?</Text>
        <Text style={styles.sectionSubtitle}>
          Everything you need to take control of your finances
        </Text>
        
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <Card key={index} style={styles.featureCard}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </Card>
          ))}
        </View>
      </View>

      {/* How It Works Section */}
      <View style={[styles.section, styles.howItWorksSection]}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        
        <View style={styles.stepsContainer}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Connect Your Accounts</Text>
            <Text style={styles.stepDescription}>
              Securely link your bank accounts and credit cards in seconds
            </Text>
          </View>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepTitle}>AI Analysis</Text>
            <Text style={styles.stepDescription}>
              Our AI analyzes your spending patterns and financial habits
            </Text>
          </View>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepTitle}>Get Personalized Insights</Text>
            <Text style={styles.stepDescription}>
              Receive custom recommendations and coaching to reach your goals
            </Text>
          </View>
        </View>
      </View>

      {/* Testimonials Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What Our Users Say</Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.testimonialsScroll}
        >
          {testimonials.map((testimonial, index) => (
            <Card key={index} style={styles.testimonialCard}>
              <View style={styles.testimonialRating}>
                {renderStars(testimonial.rating)}
              </View>
              <Text style={styles.testimonialContent}>"{testimonial.content}"</Text>
              <Text style={styles.testimonialName}>{testimonial.name}</Text>
              <Text style={styles.testimonialRole}>{testimonial.role}</Text>
            </Card>
          ))}
        </ScrollView>
      </View>

      {/* Pricing Section */}
      <View style={[styles.section, styles.pricingSection]}>
        <Text style={styles.sectionTitle}>Simple Pricing</Text>
        <Text style={styles.sectionSubtitle}>Choose monthly or annual - both include 30-day free trial</Text>
        
        <View style={styles.pricingContainer}>
          {pricingPlans.map((plan, index) => (
            <Card key={index} style={[
              styles.pricingCard,
              plan.popular && styles.popularPricingCard
            ]}>
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Best Value</Text>
                </View>
              )}
              
              <Text style={styles.planName}>{plan.name}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <Text style={styles.planPeriod}>/{plan.period}</Text>
              </View>
              
              {plan.originalPrice && (
                <View style={styles.savingsContainer}>
                  <Text style={styles.originalPrice}>{plan.originalPrice}</Text>
                  <Text style={styles.savings}>{plan.savings}</Text>
                </View>
              )}
              
              {plan.period === "year" && (
                <Text style={styles.monthlyEquivalent}>
                  Only $8.00/month when paid annually
                </Text>
              )}
              
              <Text style={styles.planDescription}>{plan.description}</Text>
              
              <Button
                title="Start Free Trial"
                onPress={() => navigation.navigate('Register')}
                style={[
                  styles.planButton,
                  plan.popular && styles.popularPlanButton
                ]}
                textStyle={[
                  styles.planButtonText,
                  plan.popular && styles.popularPlanButtonText
                ]}
              />
            </Card>
          ))}
        </View>
        
        <Text style={styles.pricingNote}>
          A payment method is required to start your trial. You'll be charged according to your selected plan after 30 days unless you cancel.
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <Logo size={40} showText={false} />
          <Text style={styles.footerTitle}>Mind My Money</Text>
          <Text style={styles.footerDescription}>
            Your AI-powered financial companion
          </Text>
          
          <View style={styles.footerButtons}>
            <Button
              title="Get Started"
              onPress={() => navigation.navigate('Register')}
              style={styles.footerButton}
              textStyle={styles.footerButtonText}
            />
          </View>
          
          <Text style={styles.copyright}>
            © 2025 Mind My Money. All rights reserved.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  heroSection: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    backgroundColor: '#0d9488',
  },
  heroContent: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 20,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.9,
  },
  heroDescription: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    opacity: 0.9,
    paddingHorizontal: 20,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  heroButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  primaryButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#0d9488',
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  trialInfo: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  trialText: {
    color: '#ffffff',
    fontSize: 14,
    opacity: 0.9,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#374151',
  },
  sectionSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 32,
    lineHeight: 24,
  },
  featuresGrid: {
    gap: 16,
  },
  featureCard: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    color: '#374151',
  },
  featureDescription: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6b7280',
    lineHeight: 20,
  },
  howItWorksSection: {
    backgroundColor: '#f9fafb',
  },
  stepsContainer: {
    gap: 24,
  },
  step: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0d9488',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    color: '#374151',
  },
  stepDescription: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6b7280',
    lineHeight: 20,
  },
  testimonialsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  testimonialCard: {
    width: width * 0.8,
    padding: 20,
    marginRight: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testimonialRating: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  star: {
    fontSize: 16,
  },
  testimonialContent: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 16,
    color: '#374151',
    lineHeight: 24,
  },
  testimonialName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#374151',
  },
  testimonialRole: {
    fontSize: 14,
    color: '#6b7280',
  },
  pricingSection: {
    backgroundColor: '#f0fdfa',
  },
  pricingContainer: {
    gap: 16,
  },
  pricingCard: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  popularPricingCard: {
    borderColor: '#0d9488',
    transform: [{ scale: 1.02 }],
  },
  popularBadge: {
    backgroundColor: '#0d9488',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'center',
    marginBottom: 16,
  },
  popularBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#374151',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#374151',
  },
  planPeriod: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 4,
  },
  savingsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 16,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  savings: {
    fontSize: 14,
    color: '#059669',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontWeight: '600',
  },
  monthlyEquivalent: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  planButton: {
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 12,
  },
  planButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  popularPlanButton: {
    backgroundColor: '#0d9488',
  },
  popularPlanButtonText: {
    color: '#ffffff',
  },
  pricingNote: {
    fontSize: 12,
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 24,
    lineHeight: 18,
  },
  footer: {
    backgroundColor: '#f9fafb',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  footerContent: {
    alignItems: 'center',
  },
  footerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    color: '#374151',
  },
  footerDescription: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 24,
  },
  footerButtons: {
    marginBottom: 24,
  },
  footerButton: {
    backgroundColor: '#0d9488',
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  footerButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  copyright: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});