import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, ActivityIndicator, View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Purchases from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import MainApp from './components/MainApp';
import PaywallScreen from './screens/PaywallScreen';

type SubscriptionTier = 'plus' | 'pro';

const getRevenueCatApiKey = (): string => {
  if (Constants.expoConfig?.extra?.revenueCatApiKey) {
    return Constants.expoConfig.extra.revenueCatApiKey;
  }
  if ((Constants as any).manifest?.extra?.revenueCatApiKey) {
    return (Constants as any).manifest.extra.revenueCatApiKey;
  }
  if ((Constants as any).manifest2?.extra?.expoClient?.extra?.revenueCatApiKey) {
    return (Constants as any).manifest2.extra.expoClient.extra.revenueCatApiKey;
  }
  return 'appl_OVsddqTxRwXTeuxMmsKmlcgwvhi';
};

const REVENUECAT_API_KEY = getRevenueCatApiKey();

function getActiveTier(entitlements: Record<string, any>): SubscriptionTier | null {
  if (typeof entitlements['pro'] !== 'undefined') return 'pro';
  if (typeof entitlements['plus'] !== 'undefined') return 'plus';
  // Legacy fallback: old 'premium' entitlement maps to 'plus'
  if (typeof entitlements['premium'] !== 'undefined') return 'plus';
  return null;
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTier, setActiveTier] = useState<SubscriptionTier | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  // Controls whether the native paywall is shown over the WebView
  const [showNativePaywall, setShowNativePaywall] = useState(false);
  // After a purchase, open /coach so the AI consent modal is the first thing the user sees
  const [postPurchasePath, setPostPurchasePath] = useState<string | undefined>(undefined);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY });

      const storedUserId = await AsyncStorage.getItem('userId');
      if (storedUserId) {
        setUserId(storedUserId);
        await Purchases.logIn(storedUserId);

        const info = await Purchases.getCustomerInfo();
        const tier = getActiveTier(info.entitlements.active);
        if (tier) {
          setActiveTier(tier);
          await AsyncStorage.setItem('subscriptionTier', tier);
        }
      }
    } catch (error) {
      console.error('App init error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserAuthenticated = async (
    authenticatedUserId: string,
    hasWebSubscription?: boolean,
  ) => {
    try {
      await AsyncStorage.setItem('userId', authenticatedUserId);
      setUserId(authenticatedUserId);

      await Purchases.logIn(authenticatedUserId);

      const info = await Purchases.getCustomerInfo();
      const tier = getActiveTier(info.entitlements.active);

      if (tier) {
        setActiveTier(tier);
        await AsyncStorage.setItem('subscriptionTier', tier);
      }
      // No action needed if no IAP subscription — free tier or web subscriber
    } catch (error) {
      console.error('Error in handleUserAuthenticated:', error);
    }
  };

  const handleShowNativePaywall = () => {
    setShowNativePaywall(true);
  };

  const handlePurchaseComplete = async (tier: SubscriptionTier) => {
    setActiveTier(tier);
    await AsyncStorage.setItem('subscriptionTier', tier);
    // After purchase, open the Coach page so the AI consent modal is immediately visible
    setPostPurchasePath('/coach');
    // Dismiss paywall — WebView will re-mount with the updated tier and navigate to /coach
    setShowNativePaywall(false);
  };

  const handleRestorePurchases = async (): Promise<{ hasAccess: boolean; tier?: SubscriptionTier }> => {
    try {
      const info = await Purchases.restorePurchases();
      const tier = getActiveTier(info.entitlements.active);

      if (tier) {
        setActiveTier(tier);
        await AsyncStorage.setItem('subscriptionTier', tier);
        setShowNativePaywall(false);
        return { hasAccess: true, tier };
      }

      return { hasAccess: false };
    } catch (error) {
      console.error('Restore error:', error);
      return { hasAccess: false };
    }
  };

  const handleDismissPaywall = () => {
    setShowNativePaywall(false);
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* The WebView is always mounted — free tier users browse normally.
          key changes when activeTier changes so the WebView reloads with the
          updated injected mobileSubscriptionTier after a successful purchase. */}
      <View style={[styles.flex, showNativePaywall && styles.hidden]}>
        <MainApp
          key={activeTier || 'free'}
          onUserAuthenticated={handleUserAuthenticated}
          onShowPaywall={handleShowNativePaywall}
          activeTier={activeTier}
          initialPath={postPurchasePath}
        />
      </View>

      {/* Native paywall appears on top when the web app requests an upgrade */}
      {showNativePaywall && (
        <View style={styles.flex}>
          <PaywallScreen
            onPurchaseComplete={handlePurchaseComplete}
            onRestorePurchases={handleRestorePurchases}
            onContinueToLogin={handleDismissPaywall}
            userId={userId}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  hidden: {
    display: 'none',
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
