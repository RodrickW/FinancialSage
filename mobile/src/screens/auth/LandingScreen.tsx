import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <View style={styles.featureCard}>
    <Icon name={icon} size={48} color="#14B8A6" style={styles.featureIcon} />
    <Text style={styles.featureTitle}>{title}</Text>
    <Text style={styles.featureDescription}>{description}</Text>
  </View>
);

interface PlanCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  savings?: string;
}

const PlanCard: React.FC<PlanCardProps> = ({ 
  name, 
  price, 
  period, 
  description, 
  features, 
  popular = false,
  savings 
}) => {
  const navigation = useNavigation();
  
  return (
    <View style={[styles.planCard, popular && styles.popularPlan]}>
      {popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>Best Value - {savings}</Text>
        </View>
      )}
      <Text style={styles.planName}>{name}</Text>
      <Text style={styles.planDescription}>{description}</Text>
      <View style={styles.priceContainer}>
        <Text style={styles.planPrice}>{price}</Text>
        <Text style={styles.planPeriod}>/{period}</Text>
      </View>
      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Icon name="check-circle" size={20} color="#10B981" />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity 
        style={[styles.planButton, popular && styles.popularPlanButton]}
        onPress={() => navigation.navigate('Register' as never)}
      >
        <Text style={[styles.planButtonText, popular && styles.popularPlanButtonText]}>
          Start Free Trial
        </Text>
        <Icon name="arrow-forward" size={20} color={popular ? "#FFFFFF" : "#14B8A6"} />
      </TouchableOpacity>
    </View>
  );
};

const LandingScreen: React.FC = () => {
  const navigation = useNavigation();

  const painPointFeatures = [
    {
      icon: "trending-up",
      title: "Tired of wondering where your money goes?",
      description: "Instantly track every dollar."
    },
    {
      icon: "savings",
      title: "Struggling to save?",
      description: "Set goals and watch your progress grow automatically."
    },
    {
      icon: "credit-card",
      title: "Worried about debt?",
      description: "Get clarity on your balances and a plan to crush it."
    },
    {
      icon: "bar-chart",
      title: "Want to build credit?",
      description: "Unlock tools to boost your score over time."
    }
  ];

  const plans = [
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
        "Credit Score Monitoring"
      ]
    },
    {
      name: "Annual Plan",
      price: "$99.99",
      period: "year",
      originalPrice: "$119.88",
      savings: "Save $20",
      description: "Best value for serious money managers",
      features: [
        "Everything in Monthly Plan",
        "Priority Customer Support",
        "Advanced Analytics",
        "Custom Reports",
        "Goal Achievement Insights",
        "Investment Tracking"
      ],
      popular: true
    }
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <LinearGradient
        colors={['#1565C0', '#1877F2']}
        style={styles.heroSection}
      >
        <View style={styles.heroContent}>
          <View style={styles.logoContainer}>
            <Icon name="attach-money" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.heroTitle}>Mind My Money</Text>
          <Text style={styles.heroSubtitle}>
            AI-powered financial coaching to help you achieve your money goals
          </Text>
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => navigation.navigate('Register' as never)}
          >
            <Text style={styles.ctaButtonText}>Start Your 14-Day Free Trial</Text>
            <Icon name="arrow-forward" size={20} color="#1877F2" />
          </TouchableOpacity>
          <Text style={styles.trialNote}>
            No credit card required • Cancel anytime
          </Text>
        </View>
      </LinearGradient>

      {/* Pain Points Section */}
      <View style={styles.painPointsSection}>
        <Text style={styles.sectionTitle}>Your Money Challenges, Solved</Text>
        <View style={styles.painPointsGrid}>
          {painPointFeatures.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Everything You Need to Win with Money</Text>
        <View style={styles.featuresGrid}>
          <FeatureCard
            icon="psychology"
            title="AI Financial Coach"
            description="Get personalized advice based on your spending patterns and goals"
          />
          <FeatureCard
            icon="account-balance"
            title="Bank Integration"
            description="Securely connect all your accounts for a complete financial picture"
          />
          <FeatureCard
            icon="insights"
            title="Smart Analytics"
            description="Understand your spending with intelligent categorization and trends"
          />
          <FeatureCard
            icon="flag"
            title="Goal Tracking"
            description="Set and achieve savings goals with progress monitoring"
          />
          <FeatureCard
            icon="security"
            title="Credit Monitoring"
            description="Track your credit score and get tips for improvement"
          />
          <FeatureCard
            icon="smartphone"
            title="Mobile First"
            description="Access your financial data anywhere with our mobile app"
          />
        </View>
      </View>

      {/* Pricing Section */}
      <View style={styles.pricingSection}>
        <Text style={styles.sectionTitle}>Choose Your Plan</Text>
        <View style={styles.plansContainer}>
          {plans.map((plan, index) => (
            <PlanCard
              key={index}
              name={plan.name}
              price={plan.price}
              period={plan.period}
              description={plan.description}
              features={plan.features}
              popular={plan.popular}
              savings={plan.savings}
            />
          ))}
        </View>
        <Text style={styles.trialInfo}>
          🎉 14-day free trial for both plans • No credit card required • Cancel anytime
        </Text>
      </View>

      {/* Login Section */}
      <View style={styles.loginSection}>
        <Text style={styles.loginText}>Already have an account?</Text>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login' as never)}
        >
          <Text style={styles.loginButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  heroSection: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
    maxWidth: 400,
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
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#F0FDFA',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 26,
  },
  ctaButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1877F2',
    marginRight: 8,
  },
  trialNote: {
    fontSize: 14,
    color: '#F0FDFA',
    textAlign: 'center',
  },
  painPointsSection: {
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
    color: '#1F2937',
  },
  painPointsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featuresSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: (width - 60) / 2,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  featureIcon: {
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1F2937',
  },
  featureDescription: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 20,
  },
  pricingSection: {
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  plansContainer: {
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  popularPlan: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
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
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
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
  planButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#14B8A6',
  },
  popularPlanButton: {
    backgroundColor: '#14B8A6',
    borderColor: '#14B8A6',
  },
  planButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1877F2',
    marginRight: 8,
  },
  popularPlanButtonText: {
    color: '#FFFFFF',
  },
  trialInfo: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 20,
  },
  loginSection: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loginText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
  },
  loginButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1877F2',
  },
});

export default LandingScreen;