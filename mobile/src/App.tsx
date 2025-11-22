import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, ActivityIndicator, View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Purchases from 'react-native-purchases';
import MainApp from './components/MainApp';
import PaywallScreen from './screens/PaywallScreen';

const REVENUECAT_API_KEY = 'test_zfEOxdHFsyfAwqIMxxlBFvqHMOS';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);

  useEffect(() => {
    initializeRevenueCat();
  }, []);

  const initializeRevenueCat = async () => {
    try {
      // Initialize RevenueCat SDK
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      
      // Check current subscription status
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      
      // Check if user has active entitlement
      const hasActiveSubscription = 
        typeof info.entitlements.active['premium'] !== 'undefined';
      
      setHasAccess(hasActiveSubscription);
      setIsLoading(false);
    } catch (error) {
      console.error('RevenueCat initialization error:', error);
      setIsLoading(false);
    }
  };

  const handlePurchaseComplete = async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      
      const hasActiveSubscription = 
        typeof info.entitlements.active['premium'] !== 'undefined';
      
      setHasAccess(hasActiveSubscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      
      const hasActiveSubscription = 
        typeof info.entitlements.active['premium'] !== 'undefined';
      
      setHasAccess(hasActiveSubscription);
      
      return hasActiveSubscription;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      return false;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1877F2" />
          <Text style={styles.loadingText}>Loading Mind My Money...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      {hasAccess ? (
        <MainApp />
      ) : (
        <PaywallScreen
          onPurchaseComplete={handlePurchaseComplete}
          onRestorePurchases={handleRestorePurchases}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    fontWeight: '600',
    color: '#6B7280',
  },
});
