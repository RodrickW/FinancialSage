import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import Purchases, { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

interface PaywallScreenProps {
  onPurchaseComplete: (tier: 'plus' | 'pro') => void;
  onRestorePurchases: () => Promise<{ hasAccess: boolean; tier?: 'plus' | 'pro' }>;
  onContinueToLogin: () => void;
  userId: string | null;
}

type TierKey = 'plus' | 'pro';
type BillingPeriod = 'monthly' | 'annual';

const TIER_FEATURES: Record<TierKey, string[]> = {
  plus: [
    'Connect bank accounts via Plaid',
    'AI Financial Coach — 20 messages/month',
    'AI-generated budget plans',
    '30-Day Money Reset Challenge',
    'Daily Money Check-In',
    'What-If Financial Simulator',
    'Debt Payoff Planner',
    'Monthly Money Story Recap',
    'Faith-Based Mode (optional)',
  ],
  pro: [
    'Everything in Plus',
    'Unlimited AI coaching messages',
    'Advanced spending analytics',
    'Goal optimization insights',
    'Priority support',
  ],
};

const TIER_LABELS: Record<TierKey, string> = {
  plus: 'Plus',
  pro: 'Pro',
};

const FALLBACK_PRICES: Record<TierKey, Record<BillingPeriod, string>> = {
  plus: { monthly: '$5.99/mo', annual: '$49/yr' },
  pro:  { monthly: '$9.99/mo', annual: '$89/yr' },
};

export default function PaywallScreen({
  onPurchaseComplete,
  onRestorePurchases,
  onContinueToLogin,
  userId,
}: PaywallScreenProps) {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [offeringsError, setOfferingsError] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedTier, setSelectedTier] = useState<TierKey>('plus');
  const [isAnnual, setIsAnnual] = useState(true);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async (silent = false): Promise<PurchasesPackage[]> => {
    if (!silent) setIsLoading(true);
    setOfferingsError(false);
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const offerings = await Purchases.getOfferings();
        const all: PurchasesPackage[] = [];
        if (offerings.current) {
          all.push(...offerings.current.availablePackages);
        }
        Object.values(offerings.all).forEach((off: PurchasesOffering) => {
          off.availablePackages.forEach((pkg) => {
            if (!all.find((p) => p.identifier === pkg.identifier)) {
              all.push(pkg);
            }
          });
        });
        console.log('[RevenueCat] Loaded offerings:', JSON.stringify({
          currentOffering: offerings.current?.identifier,
          allOfferings: Object.keys(offerings.all),
          packages: all.map(p => ({
            id: p.identifier,
            type: p.packageType,
            offering: p.offeringIdentifier,
            price: p.product?.priceString,
          })),
        }));
        setPackages(all);
        if (!silent) setIsLoading(false);
        return all;
      } catch (error: any) {
        console.error(`Error loading offerings (attempt ${attempt}/${maxAttempts}):`, error?.message);
        if (attempt < maxAttempts) {
          await new Promise(r => setTimeout(r, attempt * 1500));
        } else {
          setOfferingsError(true);
        }
      }
    }
    if (!silent) setIsLoading(false);
    return [];
  };

  const getPackageForSelection = (): PurchasesPackage | null => {
    return selectBestPackage(packages, selectedTier, isAnnual);
  };

  const getDisplayPrice = (): string => {
    const pkg = getPackageForSelection();
    if (pkg) return pkg.product.priceString + (isAnnual ? '/yr' : '/mo');
    return FALLBACK_PRICES[selectedTier][isAnnual ? 'annual' : 'monthly'];
  };

  const selectBestPackage = (pkgList: PurchasesPackage[], tier: TierKey, annual: boolean): PurchasesPackage | null => {
    if (pkgList.length === 0) return null;
    const annualTypes = ['ANNUAL', 'TWO_MONTH', 'THREE_MONTH', 'SIX_MONTH'];
    const monthlyTypes = ['MONTHLY', 'WEEKLY'];
    const targetTypes = annual ? annualTypes : monthlyTypes;

    if (tier === 'pro') {
      // 1. Explicit 'pro' identifier + correct period type
      const a = pkgList.find(p => p.identifier.toLowerCase().includes('pro') && targetTypes.includes((p.packageType ?? '').toUpperCase()));
      if (a) return a;
      // 2. Explicit 'pro' identifier, any period
      const b = pkgList.find(p => p.identifier.toLowerCase().includes('pro'));
      if (b) return b;
      // 3. Non-default, non-plus identifier + correct type (catches identifiers like 'Monthly_' for Pro)
      const c = pkgList.find(p => !p.identifier.startsWith('$rc_') && !p.identifier.toLowerCase().includes('plus') && targetTypes.includes((p.packageType ?? '').toUpperCase()));
      if (c) return c;
    } else {
      // Plus tier — RC defaults ($rc_annual, $rc_monthly) are Plus packages
      // 1. Explicit 'plus' in identifier + correct type
      const a = pkgList.find(p => p.identifier.toLowerCase().includes('plus') && targetTypes.includes((p.packageType ?? '').toUpperCase()));
      if (a) return a;
      // 2. RC default identifier ($rc_annual / $rc_monthly) + correct type
      const b = pkgList.find(p => p.identifier.startsWith('$rc_') && targetTypes.includes((p.packageType ?? '').toUpperCase()));
      if (b) return b;
      // 3. Any non-pro identifier + correct type
      const c = pkgList.find(p => !p.identifier.toLowerCase().includes('pro') && targetTypes.includes((p.packageType ?? '').toUpperCase()));
      if (c) return c;
    }

    // Period-only fallback
    const byType = pkgList.find(p => targetTypes.includes((p.packageType ?? '').toUpperCase()));
    if (byType) return byType;

    return pkgList[0] ?? null;
  };

  const findBestPackage = (pkgList: PurchasesPackage[]): PurchasesPackage | null => {
    return selectBestPackage(pkgList, selectedTier, isAnnual);
  };

  const handlePurchase = async () => {
    let pkg = getPackageForSelection();

    // Offerings haven't loaded — try one more time before giving up
    if (!pkg) {
      setIsPurchasing(true);
      const freshPackages = await loadOfferings(true);
      pkg = findBestPackage(freshPackages);

      if (!pkg) {
        setIsPurchasing(false);
        Alert.alert(
          'Plans Unavailable',
          'Subscription plans could not be loaded from the App Store. Please check your connection and try again.',
          [
            { text: 'Retry', onPress: () => loadOfferings() },
            { text: 'Cancel', style: 'cancel' },
          ],
        );
        return;
      }
    }

    setIsPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const active = customerInfo.entitlements.active;

      const hasPro =
        typeof active['pro'] !== 'undefined' ||
        (typeof active['premium'] !== 'undefined' &&
          pkg.identifier.toLowerCase().includes('pro'));
      const hasPlus =
        typeof active['plus'] !== 'undefined' ||
        typeof active['premium'] !== 'undefined';

      const grantedTier: TierKey = hasPro ? 'pro' : hasPlus ? 'plus' : 'plus';

      // Apple App Store guideline 5.1.1(i) / 5.1.2(i): obtain explicit consent before
      // sharing any personal data with a third-party AI service.
      Alert.alert(
        'AI Data Sharing — Your Permission Required',
        'Mind My Money uses OpenAI to power your AI Financial Coach.\n\n' +
        '📊 What is sent: Account balances, spending categories, transaction totals, and budget amounts.\n\n' +
        '🏢 Who receives it: OpenAI (openai.com) processes your data to generate coaching advice. OpenAI does not use your data to train its models.\n\n' +
        '🔒 How it is used: Your data is used solely to generate your coaching response and is never sold or shared with advertisers.\n\n' +
        'You can revoke this permission at any time in Settings.',
        [
          {
            text: 'Allow AI Features',
            onPress: () => {
              Alert.alert(
                'Welcome to Mind My Money!',
                `Your ${TIER_LABELS[grantedTier]} subscription is now active. Your AI Coach is ready!`,
                [{ text: 'Get Started', onPress: () => onPurchaseComplete(grantedTier) }],
              );
            },
          },
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => onPurchaseComplete(grantedTier),
          },
        ],
      );
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert(
          'Purchase Failed',
          error.message || 'Unable to complete purchase. Please try again.',
        );
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const result = await onRestorePurchases();
      if (result.hasAccess) {
        Alert.alert('Purchases Restored', 'Your subscription has been restored!');
      } else {
        Alert.alert('Nothing Found', 'No previous purchases were found for this Apple ID.');
      }
    } catch {
      Alert.alert('Restore Failed', 'Unable to restore purchases. Please try again.');
    } finally {
      setIsRestoring(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading plans...</Text>
      </View>
    );
  }

  const selectedPkg = getPackageForSelection();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>💰</Text>
        </View>
        <Text style={styles.appName}>Mind My Money</Text>
        <Text style={styles.tagline}>Your Financial Transformation System</Text>
      </View>

      {/* Billing toggle */}
      <View style={styles.billingToggle}>
        <Text style={[styles.billingLabel, !isAnnual && styles.billingLabelActive]}>Monthly</Text>
        <Switch
          value={isAnnual}
          onValueChange={setIsAnnual}
          thumbColor="#FFFFFF"
          trackColor={{ false: '#D1D5DB', true: '#059669' }}
          style={styles.switch}
        />
        <Text style={[styles.billingLabel, isAnnual && styles.billingLabelActive]}>Annual</Text>
        {isAnnual && (
          <View style={styles.saveBadge}>
            <Text style={styles.saveBadgeText}>SAVE ~30%</Text>
          </View>
        )}
      </View>

      {/* Tier tabs */}
      <View style={styles.tierTabs}>
        {(['plus', 'pro'] as TierKey[]).map((tier) => (
          <TouchableOpacity
            key={tier}
            style={[styles.tierTab, selectedTier === tier && styles.tierTabActive]}
            onPress={() => setSelectedTier(tier)}
          >
            <Text style={[styles.tierTabText, selectedTier === tier && styles.tierTabTextActive]}>
              {tier === 'plus' ? '⚡ Plus' : '🚀 Pro'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Price card */}
      <View style={styles.priceCard}>
        <Text style={styles.tierName}>{TIER_LABELS[selectedTier]}</Text>
        <Text style={styles.tierPrice}>{getDisplayPrice()}</Text>
        {isAnnual && (
          <Text style={styles.annualBreakdown}>
            {selectedTier === 'plus' ? 'Just $4.08/month billed annually' : 'Just $7.42/month billed annually'}
          </Text>
        )}
      </View>

      {/* Features */}
      <View style={styles.featuresContainer}>
        {TIER_FEATURES[selectedTier].map((feature, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={styles.featureCheck}>✓</Text>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {/* Compare note */}
      {selectedTier === 'plus' && (
        <TouchableOpacity onPress={() => setSelectedTier('pro')}>
          <Text style={styles.compareLink}>See what's in Pro →</Text>
        </TouchableOpacity>
      )}

      {/* Offerings error notice */}
      {offeringsError && packages.length === 0 && (
        <View style={styles.offeringsErrorBanner}>
          <Text style={styles.offeringsErrorText}>
            Could not load App Store pricing. Tap the button below to try — it will automatically retry connecting to the App Store.
          </Text>
          <TouchableOpacity onPress={() => loadOfferings()} style={styles.offeringsRetryButton}>
            <Text style={styles.offeringsRetryText}>Reload Pricing</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Purchase CTA */}
      <TouchableOpacity
        style={[styles.purchaseButton, isPurchasing && styles.purchaseButtonDisabled]}
        onPress={handlePurchase}
        disabled={isPurchasing}
      >
        {isPurchasing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.purchaseButtonText}>
              Start {TIER_LABELS[selectedTier]} — {getDisplayPrice()}
            </Text>
            <Text style={styles.purchaseButtonSub}>Cancel anytime in App Store settings</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Restore */}
      <TouchableOpacity style={styles.restoreButton} onPress={handleRestore} disabled={isRestoring}>
        {isRestoring ? (
          <ActivityIndicator size="small" color="#059669" />
        ) : (
          <Text style={styles.restoreText}>Restore Purchases</Text>
        )}
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Web subscriber section */}
      <View style={styles.webSection}>
        <Text style={styles.webSectionText}>Already subscribed on the web?</Text>
        <TouchableOpacity style={styles.loginButton} onPress={onContinueToLogin}>
          <Text style={styles.loginButtonText}>Back to App — Log In</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        Subscription automatically renews unless cancelled at least 24 hours before the end of the
        current period. Subscriptions may be managed by the user and auto-renewal may be turned off
        by going to Account Settings in the App Store after purchase.
      </Text>

      {/* Legal links */}
      <View style={styles.legalLinks}>
        <TouchableOpacity
          onPress={() =>
            Alert.alert('Privacy Policy', 'View our privacy policy at mindmymoneyapp.com/privacy')
          }
        >
          <Text style={styles.legalLink}>Privacy Policy</Text>
        </TouchableOpacity>
        <Text style={styles.legalSep}>·</Text>
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              'Terms of Use',
              'View our terms of use at mindmymoneyapp.com/terms',
            )
          }
        >
          <Text style={styles.legalLink}>Terms of Use</Text>
        </TouchableOpacity>
        <Text style={styles.legalSep}>·</Text>
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              'Delete Account',
              'Log in and go to Settings → Delete Account, or visit mindmymoneyapp.com/settings.',
            )
          }
        >
          <Text style={styles.legalLink}>Delete Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 24, paddingBottom: 48 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  loadingText: { marginTop: 12, fontSize: 15, color: '#6B7280' },

  header: { alignItems: 'center', marginBottom: 28 },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoEmoji: { fontSize: 36 },
  appName: { fontSize: 28, fontWeight: 'bold', color: '#059669' },
  tagline: { marginTop: 4, fontSize: 14, color: '#6B7280', textAlign: 'center' },

  billingToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  billingLabel: { fontSize: 14, color: '#9CA3AF', fontWeight: '500' },
  billingLabelActive: { color: '#111827', fontWeight: '600' },
  switch: { marginHorizontal: 4 },
  saveBadge: {
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  saveBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },

  tierTabs: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tierTab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tierTabActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tierTabText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  tierTabTextActive: { color: '#059669' },

  priceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#059669',
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#059669',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tierName: { fontSize: 16, fontWeight: '600', color: '#059669', marginBottom: 4 },
  tierPrice: { fontSize: 32, fontWeight: 'bold', color: '#111827' },
  annualBreakdown: { marginTop: 4, fontSize: 13, color: '#6B7280' },

  featuresContainer: { marginBottom: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  featureCheck: { fontSize: 16, color: '#059669', fontWeight: 'bold', marginRight: 10, marginTop: 1 },
  featureText: { flex: 1, fontSize: 15, color: '#374151', lineHeight: 22 },

  compareLink: { textAlign: 'center', color: '#059669', fontSize: 14, fontWeight: '600', marginBottom: 20 },

  purchaseButton: {
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#059669',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  purchaseButtonDisabled: { opacity: 0.7 },
  purchaseButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: 'bold' },
  purchaseButtonSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 3 },

  restoreButton: { alignItems: 'center', paddingVertical: 12, marginBottom: 20 },
  restoreText: { color: '#059669', fontSize: 15, fontWeight: '500' },

  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { marginHorizontal: 12, fontSize: 13, color: '#9CA3AF' },

  webSection: { alignItems: 'center', marginBottom: 24 },
  webSectionText: { fontSize: 14, color: '#6B7280', marginBottom: 10 },
  loginButton: {
    borderWidth: 1.5,
    borderColor: '#059669',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  loginButtonText: { color: '#059669', fontSize: 15, fontWeight: '600' },

  footer: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', lineHeight: 17, marginBottom: 16 },
  legalLinks: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 4 },
  legalLink: { fontSize: 12, color: '#6B7280', textDecorationLine: 'underline' },
  legalSep: { fontSize: 12, color: '#9CA3AF' },

  offeringsErrorBanner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  offeringsErrorText: {
    fontSize: 13,
    color: '#92400E',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 10,
  },
  offeringsRetryButton: {
    backgroundColor: '#D97706',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  offeringsRetryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});
