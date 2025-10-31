import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface TrialStatusData {
  isPremium: boolean;
  isOnFreeTrial: boolean;
  trialDaysLeft: number;
  trialEndsAt: string | null;
  hasStartedTrial: boolean;
}

export const TrialStatus: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [trialStatus, setTrialStatus] = useState<TrialStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrialStatus = async () => {
      try {
        const response = await apiRequest('GET', '/api/subscription/status');
        if (response.ok) {
          const data = await response.json();
          setTrialStatus(data);
        }
      } catch (error) {
        console.error('Error fetching trial status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchTrialStatus();
    }
  }, [user]);

  // Don't show if loading or no user
  if (isLoading || !user || !trialStatus) return null;

  // Don't show if user is already premium (includes demo users and paid subscribers)
  if (trialStatus.isPremium) return null;

  // For users on trial, only show banner when trial is ending soon (7 days or less)
  if (trialStatus.isOnFreeTrial && trialStatus.trialDaysLeft > 7) {
    return null;
  }

  // Don't show if user has started trial but it's not currently active
  if (trialStatus.hasStartedTrial && !trialStatus.isOnFreeTrial) {
    return null;
  }

  // Don't show subscription banner for users who haven't started trial
  if (!trialStatus.hasStartedTrial && !trialStatus.isOnFreeTrial) {
    return null;
  }

  const handleUpgrade = () => {
    navigation.navigate('Subscribe' as never);
  };

  const handleStartTrial = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('POST', '/api/start-free-trial', { 
        planType: 'standard' 
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.checkoutUrl) {
          // This would open a web browser for Stripe checkout
          // In a real app, you'd use a WebView or redirect
          Alert.alert(
            'Trial Setup',
            'You will be redirected to complete your trial setup.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Continue', onPress: () => {
                // TODO: Open WebView with data.checkoutUrl
                console.log('Would open:', data.checkoutUrl);
              }}
            ]
          );
        } else if (data.redirectToManage) {
          navigation.navigate('Subscribe' as never);
        } else {
          Alert.alert('Error', data.message || 'Unable to start free trial. Please try again.');
        }
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to start trial');
      }
    } catch (error) {
      console.error('Start trial error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#14B8A6', '#10B981']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {trialStatus.isOnFreeTrial 
              ? `Your free trial ends in ${trialStatus.trialDaysLeft} days` 
              : "Start your 14-day free trial of Mind My Money!"}
          </Text>
          <Text style={styles.subtitle}>
            {trialStatus.isOnFreeTrial 
              ? "Continue with your Standard subscription after your trial ends." 
              : "Full access to all features - no credit card required."}
          </Text>
        </View>
        
        <View style={styles.buttonContainer}>
          {trialStatus.isOnFreeTrial ? (
            <>
              <TouchableOpacity 
                style={styles.upgradeButton}
                onPress={handleUpgrade}
              >
                <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => navigation.navigate('CancelTrial' as never)}
              >
                <Text style={styles.cancelButtonText}>Cancel Trial</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={handleStartTrial}
              disabled={isLoading}
            >
              <Text style={styles.upgradeButtonText}>
                {isLoading ? 'Starting...' : 'Start Free Trial'}
              </Text>
              <Icon name="arrow-forward" size={16} color="#14B8A6" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  upgradeButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#14B8A6',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});