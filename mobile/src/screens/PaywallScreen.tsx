import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Purchases, { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface PaywallScreenProps {
  onPurchaseComplete: () => void;
  onRestorePurchases: () => Promise<boolean>;
  onContinueToLogin: () => void;
  userId: string | null;
}

export default function PaywallScreen({ onPurchaseComplete, onRestorePurchases, onContinueToLogin, userId }: PaywallScreenProps) {
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      console.log('Loading RevenueCat offerings...');
      const offerings = await Purchases.getOfferings();
      console.log('Offerings loaded:', JSON.stringify(offerings, null, 2));
      
      if (offerings.current !== null) {
        setOffering(offerings.current);
        // Pre-select annual package if available
        const annualPackage = offerings.current.availablePackages.find(
          pkg => pkg.packageType === 'ANNUAL'
        );
        setSelectedPackage(annualPackage || offerings.current.availablePackages[0]);
        console.log('Offering set:', offerings.current.identifier);
      } else {
        console.warn('No current offering available - check RevenueCat dashboard configuration');
      }
      
      setIsLoading(false);
    } catch (error: any) {
      console.error('Error loading offerings:', error);
      console.error('Error details:', error?.message, error?.code, error?.underlyingErrorMessage);
      setIsLoading(false);
      // Don't show alert - let the error UI handle it
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    setIsPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(selectedPackage);
      
      // Check if purchase was successful
      if (typeof customerInfo.entitlements.active['premium'] !== 'undefined') {
        Alert.alert('Success!', 'Your subscription is now active. Welcome to Mind My Money!');
        onPurchaseComplete();
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert('Purchase Failed', error.message || 'Unable to complete purchase. Please try again.');
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const restored = await onRestorePurchases();
      
      if (restored) {
        Alert.alert('Success!', 'Your purchases have been restored.');
      } else {
        Alert.alert('No Purchases Found', 'We couldn\'t find any previous purchases to restore.');
      }
    } catch (error) {
      Alert.alert('Restore Failed', 'Unable to restore purchases. Please try again.');
    } finally {
      setIsRestoring(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading subscription options...</Text>
      </View>
    );
  }

  if (!offering) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Unable to load subscription options</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadOfferings}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
        
        <View style={styles.errorDivider}>
          <View style={styles.errorDividerLine} />
          <Text style={styles.errorDividerText}>or</Text>
          <View style={styles.errorDividerLine} />
        </View>
        
        <Text style={styles.errorSubtext}>Already a subscriber on the web?</Text>
        <TouchableOpacity style={styles.continueLoginButton} onPress={onContinueToLogin}>
          <Text style={styles.continueLoginButtonText}>Continue to Login</Text>
        </TouchableOpacity>
        
        {/* Account Management in error state */}
        <TouchableOpacity 
          style={styles.deleteAccountLink}
          onPress={() => {
            Alert.alert(
              'Delete Account',
              'To delete your account, please log in and go to Settings > Delete Account. Or visit mindmymoneyapp.com/settings',
              [{ text: 'OK' }]
            );
          }}
        >
          <Text style={styles.deleteAccountLinkText}>Delete Account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Icon name="account-balance-wallet" size={64} color="#059669" />
        <Text style={styles.title}>Mind My Money</Text>
        <Text style={styles.subtitle}>Your Financial Transformation System</Text>
      </View>

      {/* Features */}
      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Icon name="check-circle" size={24} color="#10B981" />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {/* Packages */}
      <View style={styles.packagesContainer}>
        {offering.availablePackages.map((pkg) => {
          const isSelected = selectedPackage?.identifier === pkg.identifier;
          const isAnnual = pkg.packageType === 'ANNUAL';
          
          return (
            <TouchableOpacity
              key={pkg.identifier}
              style={[
                styles.packageCard,
                isSelected && styles.packageCardSelected,
                isAnnual && styles.packageCardPopular,
              ]}
              onPress={() => setSelectedPackage(pkg)}
            >
              {isAnnual && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>BEST VALUE</Text>
                </View>
              )}
              
              <View style={styles.packageHeader}>
                <Text style={[styles.packageTitle, isSelected && styles.packageTitleSelected]}>
                  {pkg.product.title}
                </Text>
                <View style={styles.packagePriceContainer}>
                  <Text style={[styles.packagePrice, isSelected && styles.packagePriceSelected]}>
                    {pkg.product.priceString}
                  </Text>
                  <Text style={[styles.packagePeriod, isSelected && styles.packagePeriodSelected]}>
                    /{isAnnual ? 'year' : 'month'}
                  </Text>
                </View>
              </View>
              
              {isAnnual && (
                <Text style={[styles.savingsText, isSelected && styles.savingsTextSelected]}>
                  Save 20% with annual billing
                </Text>
              )}
              
              {isSelected && (
                <View style={styles.selectedIndicator}>
                  <Icon name="check-circle" size={20} color="#059669" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Purchase Button */}
      <TouchableOpacity
        style={[styles.purchaseButton, isPurchasing && styles.purchaseButtonDisabled]}
        onPress={handlePurchase}
        disabled={isPurchasing || !selectedPackage}
      >
        {isPurchasing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.purchaseButtonText}>Subscribe Now</Text>
        )}
      </TouchableOpacity>

      {/* Restore Button */}
      <TouchableOpacity
        style={styles.restoreButton}
        onPress={handleRestore}
        disabled={isRestoring}
      >
        {isRestoring ? (
          <ActivityIndicator size="small" color="#059669" />
        ) : (
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        )}
      </TouchableOpacity>

      {/* Existing Web Subscriber Info */}
      <View style={styles.webSubscriberInfo}>
        <Icon name="info" size={20} color="#6B7280" />
        <Text style={styles.webSubscriberText}>
          Already subscribed on the web? Just log in to access all features!
        </Text>
      </View>

      {/* Footer */}
      <Text style={styles.footerText}>
        Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.
      </Text>
      
      {/* Account Management Links */}
      <View style={styles.accountManagementContainer}>
        <TouchableOpacity 
          onPress={() => {
            Alert.alert(
              'Delete Account',
              'To delete your account, please log in and go to Settings > Delete Account. Or visit mindmymoneyapp.com/settings',
              [{ text: 'OK' }]
            );
          }}
        >
          <Text style={styles.accountManagementLink}>Delete Account</Text>
        </TouchableOpacity>
        <Text style={styles.accountManagementDivider}>|</Text>
        <TouchableOpacity 
          onPress={() => {
            Alert.alert(
              'Privacy Policy',
              'View our privacy policy at mindmymoneyapp.com/privacy',
              [{ text: 'OK' }]
            );
          }}
        >
          <Text style={styles.accountManagementLink}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const features = [
  '30-Day Money Reset Challenge',
  'Daily Money Check-In',
  'AI Financial Coach (Money Mind)',
  'Bank Account Integration',
  'Smart Budget Creation',
  'Spending Analytics',
  'Faith-Based Mode (Optional)',
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#059669',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#1F2937',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#059669',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
    width: '80%',
  },
  errorDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
  },
  errorDividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  continueLoginButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#10B981',
    borderRadius: 8,
  },
  continueLoginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    marginTop: 16,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#059669',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  packagesContainer: {
    marginBottom: 24,
  },
  packageCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    position: 'relative',
  },
  packageCardSelected: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  packageCardPopular: {
    borderColor: '#10B981',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  packageTitleSelected: {
    color: '#059669',
  },
  packagePriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  packagePriceSelected: {
    color: '#059669',
  },
  packagePeriod: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  packagePeriodSelected: {
    color: '#059669',
  },
  savingsText: {
    marginTop: 8,
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  savingsTextSelected: {
    color: '#10B981',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    color: '#059669',
  },
  freeTrialButton: {
    backgroundColor: '#10B981',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  freeTrialButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  freeTrialSubtext: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 4,
    opacity: 0.9,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  purchaseButton: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  trialInfo: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  restoreButtonText: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '600',
  },
  webSubscriberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  webSubscriberText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  accountManagementContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  accountManagementLink: {
    fontSize: 14,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
  accountManagementDivider: {
    fontSize: 14,
    color: '#9CA3AF',
    marginHorizontal: 12,
  },
  deleteAccountLink: {
    marginTop: 24,
    paddingVertical: 12,
  },
  deleteAccountLinkText: {
    fontSize: 14,
    color: '#6B7280',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});
