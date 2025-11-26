import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, ActivityIndicator, View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Purchases from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MainApp from './components/MainApp';
import PaywallScreen from './screens/PaywallScreen';

// TODO: Replace with your actual RevenueCat iOS API key from https://app.revenuecat.com
// Navigate to: Projects → [Your Project] → API Keys → Public app-specific API keys → iOS
const REVENUECAT_API_KEY = 'REPLACE_WITH_YOUR_REVENUECAT_IOS_API_KEY';
const WEB_APP_URL = 'https://www.mindmymoneyapp.com';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize RevenueCat SDK first
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      
      // Try to get stored user ID
      const storedUserId = await AsyncStorage.getItem('userId');
      
      if (storedUserId) {
        setUserId(storedUserId);
        
        // Identify user to RevenueCat
        await Purchases.logIn(storedUserId);
        console.log(`✅ Logged in to RevenueCat as user: ${storedUserId}`);
        
        // Check subscription status
        await checkSubscriptionStatus();
      } else {
        // No user ID stored - need to show WebView to capture it
        console.log('ℹ️ No stored user ID - showing WebView for login');
        setShowWebView(true);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('App initialization error:', error);
      setIsLoading(false);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      
      // Check if user has active entitlement
      const hasActiveSubscription = 
        typeof info.entitlements.active['premium'] !== 'undefined';
      
      setHasAccess(hasActiveSubscription);
      
      if (!hasActiveSubscription) {
        // No subscription - will show paywall
        console.log('ℹ️ No active subscription - showing paywall');
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const handleUserAuthenticated = async (authenticatedUserId: string) => {
    try {
      // Store user ID
      await AsyncStorage.setItem('userId', authenticatedUserId);
      setUserId(authenticatedUserId);
      
      // Identify user to RevenueCat
      await Purchases.logIn(authenticatedUserId);
      console.log(`✅ User ${authenticatedUserId} identified to RevenueCat`);
      
      // Hide WebView now that we have user ID
      setShowWebView(false);
      
      // Check subscription status - this will check RevenueCat only
      await checkSubscriptionStatus();
      
      // If user has no RevenueCat subscription, show message
      const info = await Purchases.getCustomerInfo();
      const hasRevenueCatAccess = typeof info.entitlements.active['premium'] !== 'undefined';
      
      if (!hasRevenueCatAccess) {
        console.log('ℹ️ User has no mobile subscription - will show paywall');
      }
    } catch (error) {
      console.error('Error identifying user:', error);
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

  // Determine which screen to show
  const renderScreen = () => {
    // Priority 1: Show WebView if we need to capture user ID
    if (showWebView || (!userId && !hasAccess)) {
      return <MainApp onUserAuthenticated={handleUserAuthenticated} />;
    }
    
    // Priority 2: Show main app if user has subscription
    if (hasAccess) {
      return <MainApp onUserAuthenticated={handleUserAuthenticated} />;
    }
    
    // Priority 3: Show paywall if user identified but no subscription
    return (
      <PaywallScreen
        onPurchaseComplete={handlePurchaseComplete}
        onRestorePurchases={handleRestorePurchases}
        userId={userId}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      {renderScreen()}
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
