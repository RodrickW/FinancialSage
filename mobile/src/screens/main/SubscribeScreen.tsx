import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Card } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

interface Plan {
  name: string;
  price: string;
  period: string;
  originalPrice?: string;
  savings?: string;
  description: string;
  features: string[];
  popular?: boolean;
  available?: boolean;
  priceId?: string;
}

const SubscribeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const plans: Plan[] = [
    {
      name: "Monthly Plan",
      price: "$9.99",
      period: "month",
      description: "Perfect for getting started with AI-powered financial management",
      features: [
        "AI Financial Coach",
        "Bank Account Integration", 
        "Smart Budget Creation",
        "Spending Analytics",
        "Savings Goal Tracking",
        "Credit Score Monitoring",
        "Email Support",
        "Mobile Access"
      ],
      available: true,
      priceId: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_monthly'
    },
    {
      name: "Annual Plan",
      price: "$99.99",
      period: "year",
      originalPrice: "$119.88",
      savings: "Save $20",
      description: "Best value for serious money managers who want to save",
      features: [
        "Everything in Monthly Plan",
        "Priority Customer Support",
        "Advanced Analytics Dashboard",
        "Custom Financial Reports",
        "Goal Achievement Insights",
        "Investment Portfolio Tracking",
        "Tax Planning Tools",
        "Financial Health Score"
      ],
      popular: true,
      available: true,
      priceId: process.env.STRIPE_ANNUAL_PRICE_ID || 'price_annual'
    }
  ];

  const handleSelectPlan = async (plan: Plan) => {
    if (!plan.available) {
      Alert.alert('Coming Soon', 'This plan will be available soon!');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/create-subscription', {
        priceId: plan.priceId,
        planType: plan.period === 'month' ? 'monthly' : 'annual'
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.checkoutUrl) {
          // In a real React Native app, you would use a WebView or redirect
          // For now, we'll show an alert
          Alert.alert(
            'Redirect to Payment',
            'You will be redirected to complete your subscription setup.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Continue', onPress: () => {
                // TODO: Open WebView with data.checkoutUrl
                console.log('Would open checkout URL:', data.checkoutUrl);
                // For demo, navigate to success screen
                navigation.navigate('SubscriptionSuccess' as never);
              }}
            ]
          );
        } else {
          Alert.alert('Success', 'Subscription created successfully!');
          navigation.navigate('Dashboard' as never);
        }
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to create subscription');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const PlanCard = ({ plan }: { plan: Plan }) => (
    <View style={[styles.planCard, plan.popular && styles.popularPlan]}>
      <Card style={styles.card}>
        {plan.popular && plan.available && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>Best Value - {plan.savings}</Text>
          </View>
        )}
        {plan.popular && !plan.available && (
          <View style={[styles.popularBadge, styles.comingSoonBadge]}>
            <Text style={styles.popularBadgeText}>Coming Soon</Text>
          </View>
        )}
        
        <View style={styles.cardContent}>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planDescription}>{plan.description}</Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.planPrice}>{plan.price}</Text>
            {plan.price !== "Coming Soon" && (
              <Text style={styles.planPeriod}>/{plan.period}</Text>
            )}
          </View>
          
          {plan.originalPrice && (
            <View style={styles.savingsContainer}>
              <Text style={styles.originalPrice}>{plan.originalPrice}</Text>
              <Text style={styles.savings}>{plan.savings}</Text>
            </View>
          )}

          <View style={styles.featuresContainer}>
            {plan.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Icon name="check-circle" size={20} color="#10B981" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity 
            style={[
              styles.selectButton,
              plan.popular && plan.available && styles.popularSelectButton,
              !plan.available && styles.disabledButton
            ]}
            onPress={() => handleSelectPlan(plan)}
            disabled={isLoading || !plan.available}
          >
            {plan.popular && plan.available ? (
              <LinearGradient
                colors={['#14B8A6', '#10B981']}
                style={styles.buttonGradient}
              >
                <Text style={styles.popularSelectButtonText}>
                  {isLoading ? 'Processing...' : 'Start Free Trial'}
                </Text>
                <Icon name="arrow-forward" size={20} color="#FFFFFF" />
              </LinearGradient>
            ) : (
              <View style={styles.buttonContent}>
                <Text style={[
                  styles.selectButtonText,
                  !plan.available && styles.disabledButtonText
                ]}>
                  {!plan.available ? 'Coming Soon' : isLoading ? 'Processing...' : 'Start Free Trial'}
                </Text>
                {plan.available && (
                  <Icon name="arrow-forward" size={20} color="#14B8A6" />
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Card>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#0F766E', '#14B8A6']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <Icon name="attach-money" size={40} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Unlock Your Financial Potential</Text>
        <Text style={styles.subtitle}>
          Start your 14-day free trial with complete financial management
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.trialBanner}>
          <Icon name="celebration" size={24} color="#10B981" />
          <View style={styles.trialInfo}>
            <Text style={styles.trialTitle}>14-Day Free Trial</Text>
            <Text style={styles.trialDescription}>
              No credit card required • Full access to all features
            </Text>
          </View>
        </View>

        <View style={styles.plansContainer}>
          {plans.map((plan, index) => (
            <PlanCard key={index} plan={plan} />
          ))}
        </View>

        <View style={styles.trialInfoSection}>
          <Text style={styles.trialInfoTitle}>
            🎉 14-day free trial for both plans • No credit card required • Cancel anytime
          </Text>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.featuresSectionTitle}>What's included in your free trial:</Text>
          <View style={styles.includedFeatures}>
            <View style={styles.includedFeatureItem}>
              <Icon name="psychology" size={24} color="#8B5CF6" />
              <View style={styles.includedFeatureText}>
                <Text style={styles.includedFeatureTitle}>AI Financial Coach</Text>
                <Text style={styles.includedFeatureDescription}>
                  Get personalized financial advice based on your spending patterns
                </Text>
              </View>
            </View>
            
            <View style={styles.includedFeatureItem}>
              <Icon name="account-balance" size={24} color="#14B8A6" />
              <View style={styles.includedFeatureText}>
                <Text style={styles.includedFeatureTitle}>Bank Integration</Text>
                <Text style={styles.includedFeatureDescription}>
                  Securely connect all your accounts for a complete financial picture
                </Text>
              </View>
            </View>
            
            <View style={styles.includedFeatureItem}>
              <Icon name="insights" size={24} color="#F59E0B" />
              <View style={styles.includedFeatureText}>
                <Text style={styles.includedFeatureTitle}>Smart Analytics</Text>
                <Text style={styles.includedFeatureDescription}>
                  Understand your spending with intelligent categorization
                </Text>
              </View>
            </View>
            
            <View style={styles.includedFeatureItem}>
              <Icon name="flag" size={24} color="#06B6D4" />
              <View style={styles.includedFeatureText}>
                <Text style={styles.includedFeatureTitle}>Goal Tracking</Text>
                <Text style={styles.includedFeatureDescription}>
                  Set and achieve savings goals with progress monitoring
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.supportSection}>
          <Text style={styles.supportText}>
            Need help choosing? Contact our support team for personalized recommendations.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#F0FDFA',
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  trialInfo: {
    marginLeft: 12,
    flex: 1,
  },
  trialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 4,
  },
  trialDescription: {
    fontSize: 14,
    color: '#047857',
  },
  plansContainer: {
    marginBottom: 24,
  },
  planCard: {
    marginBottom: 20,
    position: 'relative',
  },
  popularPlan: {
    transform: [{ scale: 1.02 }],
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -75 }],
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 1,
  },
  comingSoonBadge: {
    backgroundColor: '#6B7280',
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: 24,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1F2937',
  },
  planDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 22,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  planPeriod: {
    fontSize: 18,
    color: '#6B7280',
    marginLeft: 4,
  },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  originalPrice: {
    fontSize: 16,
    color: '#6B7280',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  savings: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 12,
    flex: 1,
  },
  selectButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  popularSelectButton: {
    // Styling will be handled by LinearGradient
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#14B8A6',
    borderRadius: 12,
  },
  selectButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#14B8A6',
    marginRight: 8,
  },
  popularSelectButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  disabledButtonText: {
    color: '#6B7280',
  },
  trialInfoSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  trialInfoTitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  featuresSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  featuresSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  includedFeatures: {
    gap: 16,
  },
  includedFeatureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  includedFeatureText: {
    marginLeft: 12,
    flex: 1,
  },
  includedFeatureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  includedFeatureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  supportSection: {
    padding: 16,
    alignItems: 'center',
  },
  supportText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SubscribeScreen;