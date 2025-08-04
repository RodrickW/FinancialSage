import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { apiService } from '@/services/api';

interface TrialGateProps {
  feature: string;
  description?: string;
  navigation: any;
  children?: React.ReactNode;
}

export const TrialGate: React.FC<TrialGateProps> = ({
  feature,
  description,
  navigation,
  children,
}) => {
  const { data: subscriptionStatus, isLoading } = useQuery({
    queryKey: ['subscriptionStatus'],
    queryFn: () => apiService.getSubscriptionStatus(),
  });

  // Show loading state while checking subscription
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // If user has premium access, show the children content
  if (subscriptionStatus?.isPremium) {
    return <>{children}</>;
  }

  // Show upgrade prompt for non-premium users
  return (
    <View style={styles.container}>
      <Card style={styles.upgradeCard}>
        <Text style={styles.title}>Upgrade to Premium</Text>
        <Text style={styles.description}>
          {description || `Access ${feature} and all premium features with a subscription.`}
        </Text>
        
        <View style={styles.features}>
          <Text style={styles.feature}>✓ AI Financial Coach</Text>
          <Text style={styles.feature}>✓ Advanced Analytics</Text>
          <Text style={styles.feature}>✓ Budget Optimization</Text>
          <Text style={styles.feature}>✓ Unlimited Goals</Text>
        </View>

        <Button
          title="Start 30-Day Free Trial"
          onPress={() => navigation.navigate('Subscribe')}
          style={styles.upgradeButton}
          size="lg"
        />
        
        <Text style={styles.trialText}>
          Free trial for 30 days. Cancel anytime.
        </Text>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  upgradeCard: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  features: {
    marginBottom: 24,
    alignSelf: 'stretch',
  },
  feature: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  upgradeButton: {
    marginBottom: 12,
    minWidth: 200,
  },
  trialText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});