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
  if (typeof entitlements['premium'] !== 'undefined') return 'plus';
  return null;
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [activeTier, setActiveTier] = useState<SubscriptionTier | null>(null);

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
          setHasAccess(true);
        } else {
          setShowWebView(true);
        }
      } else {
        setShowWebView(true);
      }
    } catch (error) {
      console.error('App init error:', error);
      setShowWebView(true);
    } finally {
      setIsLoading(false);
    }
  };

  const checkRevenueCatSubscription = async (): Promise<{ hasAccess: boolean; tier: SubscriptionTier | null }> => {
    try {
      const info = await Purchases.getCustomerInfo();
      const tier = getActiveTier(info.entitlements.active);
      return { hasAccess: tier !== null, tier };
    } catch (error) {
      console.error('RevenueCat check error:', error);
      return { hasAccess: false, tier: null };
    }
  };

  const handleUserAuthenticated = async (authenticatedUserId: string, hasWebSubscription?: boolean) => {
    try {
      await AsyncStorage.setItem('userId', authenticatedUserId);
      setUserId(authenticatedUserId);

      await Purchases.logIn(authenticatedUserId);

      setShowWebView(false);

      const { hasAccess: rcAccess, tier } = await checkRevenueCatSubscription();

      if (rcAccess && tier) {
        setActiveTier(tier);
        await AsyncStorage.setItem('subscriptionTier', tier);
        setHasAccess(true);
      } else if (hasWebSubscription === true) {
        setHasAccess(true);
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      console.error('Error in handleUserAuthenticated:', error);
    }
  };

  const handlePurchaseComplete = async (tier: SubscriptionTier) => {
    setActiveTier(tier);
    await AsyncStorage.setItem('subscriptionTier', tier);
    setHasAccess(true);
  };

  const handleRestorePurchases = async (): Promise<{ hasAccess: boolean; tier?: SubscriptionTier }> => {
    try {
      const info = await Purchases.restorePurchases();
      const tier = getActiveTier(info.entitlements.active);
      const hasRestoredAccess = tier !== null;

      if (hasRestoredAccess && tier) {
        setActiveTier(tier);
        await AsyncStorage.setItem('subscriptionTier', tier);
        setHasAccess(true);
        return { hasAccess: true, tier };
      }

      return { hasAccess: false };
    } catch (error) {
      console.error('Restore error:', error);
      return { hasAccess: false };
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

  const renderScreen = () => {
    if (showWebView || (!userId && !hasAccess)) {
      return (
        <MainApp
          onUserAuthenticated={handleUserAuthenticated}
          activeTier={activeTier}
        />
      );
    }

    if (hasAccess) {
      return (
        <MainApp
          onUserAuthenticated={handleUserAuthenticated}
          activeTier={activeTier}
        />
      );
    }

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
