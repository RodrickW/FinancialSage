import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Logo } from '@/components/Logo';
import { apiService } from '@/services/api';

interface SubscribeScreenProps {
  navigation: any;
}

export const SubscribeScreen: React.FC<SubscribeScreenProps> = ({ navigation }) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');

  const { data: subscriptionStatus, isLoading } = useQuery({
    queryKey: ['subscriptionStatus'],
    queryFn: () => apiService.getSubscriptionStatus(),
  });

  const startTrialMutation = useMutation({
    mutationFn: (planType: 'monthly' | 'annual') => apiService.startFreeTrial(planType),
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        Linking.openURL(data.checkoutUrl).catch(() => {
          Alert.alert('Error', 'Unable to open subscription page');
        });
      }
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.message || 'Failed to start trial');
    },
  });

  const handleStartTrial = () => {
    startTrialMutation.mutate(selectedPlan);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading subscription info...</Text>
      </View>
    );
  }

  if (subscriptionStatus?.isPremium) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Logo size={40} showText={true} />
          <Text style={styles.title}>You're all set!</Text>
          <Text style={styles.subtitle}>
            You have access to all premium features
          </Text>
        </View>

        <Card style={styles.activeCard}>
          <Text style={styles.activeTitle}>Premium Active</Text>
          <Text style={styles.activeDescription}>
            Enjoy unlimited access to AI coaching, advanced analytics, and all premium features.
          </Text>
          <Button
            title="Back to Dashboard"
            onPress={() => navigation.navigate('Dashboard')}
            style={styles.button}
          />
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Logo size={40} showText={true} />
        <Text style={styles.title}>Choose Your Plan</Text>
        <Text style={styles.subtitle}>
          Start your 30-day free trial today
        </Text>
      </View>

      {/* Monthly Plan */}
      <Card 
        style={[
          styles.planCard,
          selectedPlan === 'monthly' && styles.selectedPlan
        ]}
      >
        <View style={styles.planHeader}>
          <Text style={styles.planName}>Monthly</Text>
          <Text style={styles.planPrice}>$9.99/month</Text>
        </View>
        <Text style={styles.planDescription}>
          Perfect for getting started with AI-powered financial management
        </Text>
        <View style={styles.features}>
          <Text style={styles.feature}>✓ AI Financial Coach</Text>
          <Text style={styles.feature}>✓ Advanced Analytics</Text>
          <Text style={styles.feature}>✓ Budget Optimization</Text>
          <Text style={styles.feature}>✓ Savings Goal Tracking</Text>
          <Text style={styles.feature}>✓ Credit Score Monitoring</Text>
        </View>
        <Button
          title={selectedPlan === 'monthly' ? 'Selected' : 'Select Monthly'}
          onPress={() => setSelectedPlan('monthly')}
          variant={selectedPlan === 'monthly' ? 'primary' : 'outline'}
          style={styles.selectButton}
        />
      </Card>

      {/* Annual Plan */}
      <Card 
        style={[
          styles.planCard,
          selectedPlan === 'annual' && styles.selectedPlan
        ]}
      >
        <View style={styles.planHeader}>
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>Save $23.89</Text>
          </View>
          <Text style={styles.planName}>Annual</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.planPrice}>$95.99/year</Text>
            <Text style={styles.planPriceNote}>($7.99/month)</Text>
          </View>
        </View>
        <Text style={styles.planDescription}>
          Best value! Save 20% with annual billing
        </Text>
        <View style={styles.features}>
          <Text style={styles.feature}>✓ Everything in Monthly</Text>
          <Text style={styles.feature}>✓ 20% Savings</Text>
          <Text style={styles.feature}>✓ Priority Support</Text>
          <Text style={styles.feature}>✓ Advanced Reporting</Text>
          <Text style={styles.feature}>✓ Export Features</Text>
        </View>
        <Button
          title={selectedPlan === 'annual' ? 'Selected' : 'Select Annual'}
          onPress={() => setSelectedPlan('annual')}
          variant={selectedPlan === 'annual' ? 'primary' : 'outline'}
          style={styles.selectButton}
        />
      </Card>

      {/* Start Trial Button */}
      <Button
        title={`Start 30-Day Free Trial (${selectedPlan === 'monthly' ? 'Monthly' : 'Annual'})`}
        onPress={handleStartTrial}
        loading={startTrialMutation.isPending}
        style={styles.trialButton}
        size="lg"
      />

      <Text style={styles.disclaimer}>
        Free trial for 30 days. Cancel anytime. No charges until trial ends.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  planCard: {
    marginBottom: 16,
    padding: 20,
  },
  selectedPlan: {
    borderColor: '#10b981',
    borderWidth: 2,
  },
  planHeader: {
    marginBottom: 12,
  },
  savingsBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  savingsText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '600',
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '600',
    color: '#10b981',
  },
  planPriceNote: {
    fontSize: 14,
    color: '#6b7280',
  },
  planDescription: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  features: {
    marginBottom: 20,
  },
  feature: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  selectButton: {
    marginTop: 8,
  },
  trialButton: {
    marginTop: 24,
    marginBottom: 16,
  },
  disclaimer: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  activeCard: {
    alignItems: 'center',
    padding: 32,
  },
  activeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 12,
  },
  activeDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    minWidth: 200,
  },
});