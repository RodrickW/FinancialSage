import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, ActivityIndicator, View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Purchases from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import MainApp from './components/MainApp';
import PaywallScreen from './screens/PaywallScreen';

// RevenueCat iOS API key from app.json extra config
const REVENUECAT_API_KEY = Constants.expoConfig?.extra?.revenueCatApiKey || '';
const WEB_APP_URL = 'https://www.mindmymoneyapp.com';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<any>(null);
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
        
        // Check RevenueCat subscription only (web check will happen in WebView)
        const info = await Purchases.getCustomerInfo();
        const hasRevenueCatAccess = typeof info.entitlements.active['premium'] !== 'undefined';
        
        if (hasRevenueCatAccess) {
          // User has RevenueCat subscription - grant access immediately
          setHasAccess(true);
          console.log('✅ User has RevenueCat subscription');
        } else {
          // No RevenueCat subscription - need to check web subscription via WebView
          console.log('ℹ️ No RevenueCat subscription - checking web subscription via WebView');
          setShowWebView(true);
        }
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

  const checkRevenueCatOnly = async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      
      // Check if user has active RevenueCat entitlement
      const hasRevenueCatAccess = 
        typeof info.entitlements.active['premium'] !== 'undefined';
      
      // NOTE: We do NOT check Stripe from native code (cookies don't work)
      // Stripe subscription check happens in WebView and is passed via message
      
      setHasAccess(hasRevenueCatAccess);
      
      if (!hasRevenueCatAccess) {
        console.log('ℹ️ No RevenueCat subscription');
      }
    } catch (error) {
      console.error('Error checking RevenueCat:', error);
    }
  };

  const handleUserAuthenticated = async (authenticatedUserId: string, hasWebSubscription?: boolean) => {
    try {
      // Store user ID
      await AsyncStorage.setItem('userId', authenticatedUserId);
      setUserId(authenticatedUserId);
      
      // Identify user to RevenueCat
      await Purchases.logIn(authenticatedUserId);
      console.log(`✅ User ${authenticatedUserId} identified to RevenueCat`);
      
      // Hide WebView now that we have user ID
      setShowWebView(false);
      
      // Check RevenueCat subscription
      const info = await Purchases.getCustomerInfo();
      const hasRevenueCatAccess = typeof info.entitlements.active['premium'] !== 'undefined';
      
      // MULTIPLATFORM: Grant access if user has EITHER RevenueCat OR web subscription
      const totalAccess = hasRevenueCatAccess || (hasWebSubscription === true);
      setHasAccess(totalAccess);
      
      if (hasRevenueCatAccess) {
        console.log('✅ User has RevenueCat subscription - granting access');
      } else if (hasWebSubscription) {
        console.log('✅ User has web subscription - granting mobile access');
      } else {
        console.log('ℹ️ User has no active subscription - will show paywall');
      }
    } catch (error) {
      console.error('Error identifying user:', error);
    }
  };

  const handlePurchaseComplete = async () => {
    try {
      await checkRevenueCatOnly();
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
          <ActivityIndicator size="large" color="#059669" />
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
        onContinueToLogin={() => setShowWebView(true)}
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
