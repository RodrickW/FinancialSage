import React, { useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialIcons';

const WEB_APP_URL = 'https://www.mindmymoneyapp.com';

interface MainAppProps {
  onUserAuthenticated: (userId: string, hasSubscription?: boolean) => void;
  onShowPaywall: () => void;
  activeTier?: 'plus' | 'pro' | null;
}

export default function MainApp({ onUserAuthenticated, onShowPaywall, activeTier }: MainAppProps) {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  const handleGoBack = () => {
    if (webViewRef.current && canGoBack) {
      webViewRef.current.goBack();
    }
  };

  const handleGoForward = () => {
    if (webViewRef.current && canGoForward) {
      webViewRef.current.goForward();
    }
  };

  const handleRefresh = () => {
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    // Block ONLY the Stripe hosted checkout page — mobile users pay via Apple IAP.
    // The /subscribe page itself is allowed to load so upgrade prompts appear,
    // then the web app posts SHOW_PAYWALL to transition to native IAP.
    if (request.url.includes('checkout.stripe.com')) {
      // Instead of opening Stripe checkout, route to native paywall
      onShowPaywall();
      return false;
    }

    // Open mailto/tel/sms links natively
    if (
      request.url.startsWith('mailto:') ||
      request.url.startsWith('tel:') ||
      request.url.startsWith('sms:')
    ) {
      Linking.openURL(request.url);
      return false;
    }

    return true;
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      // Web app detected an authenticated user
      if (data.type === 'USER_AUTHENTICATED' && data.userId) {
        onUserAuthenticated(data.userId.toString(), data.hasSubscription);
      }

      // Web app is requesting the native upgrade/paywall flow
      if (data.type === 'SHOW_PAYWALL') {
        onShowPaywall();
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const tierStr = activeTier ? `'${activeTier}'` : 'null';

  const injectedJavaScript = `
    (function() {
      // Mark session as mobile app
      localStorage.setItem('isMobileApp', 'true');
      sessionStorage.setItem('isMobileApp', 'true');
      window.isMobileApp = true;
      window.mobileSubscriptionTier = ${tierStr};

      // Inject CSS helpers
      if (!document.getElementById('mmm-mobile-styles')) {
        var style = document.createElement('style');
        style.id = 'mmm-mobile-styles';
        style.textContent = [
          '.mobile-only { display: block !important; }',
          '.web-subscription-only { display: none !important; }',
          '.mobile-delete-account-banner {',
          '  display: block !important;',
          '  background: #FEE2E2 !important;',
          '  border: 2px solid #EF4444 !important;',
          '  padding: 16px !important;',
          '  margin: 16px 0 !important;',
          '  border-radius: 8px !important; }'
        ].join('');
        document.head.appendChild(style);
      }

      // Intercept any click that would go to checkout.stripe.com and trigger native paywall
      document.addEventListener('click', function(e) {
        var target = e.target;
        while (target && target !== document) {
          if (target.tagName === 'A' && target.href && target.href.includes('checkout.stripe.com')) {
            e.preventDefault();
            e.stopPropagation();
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SHOW_PAYWALL' }));
            return;
          }
          target = target.parentElement;
        }
      }, true);

      // Report authenticated user to native layer
      var authCheckCount = 0;
      var checkAuth = setInterval(function() {
        authCheckCount++;
        if (authCheckCount > 30) { clearInterval(checkAuth); return; }

        try {
          var storedId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
          var userEl = document.querySelector('[data-user-id]');
          var userId = (userEl && userEl.getAttribute('data-user-id')) || storedId;

          if (userId) {
            fetch('/api/mobile/access', {
              credentials: 'include',
              headers: { 'X-Mobile-App': 'true', 'X-Platform': 'ios' }
            })
            .then(function(r) { return r.json(); })
            .then(function(d) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'USER_AUTHENTICATED',
                userId: userId,
                hasSubscription: d.hasAccess === true,
                subscriptionTier: d.subscriptionTier || null
              }));
            })
            .catch(function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'USER_AUTHENTICATED',
                userId: userId,
                hasSubscription: false
              }));
            });
            clearInterval(checkAuth);
          }
        } catch(e) {}
      }, 1000);
    })();
    true;
  `;

  return (
    <View style={styles.container}>
      <View style={styles.navigationBar}>
        <View style={styles.navButtons}>
          <TouchableOpacity
            style={[styles.navButton, !canGoBack && styles.navButtonDisabled]}
            onPress={handleGoBack}
            disabled={!canGoBack}
          >
            <Icon name="arrow-back" size={24} color={canGoBack ? '#059669' : '#CBD5E1'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, !canGoForward && styles.navButtonDisabled]}
            onPress={handleGoForward}
            disabled={!canGoForward}
          >
            <Icon name="arrow-forward" size={24} color={canGoForward ? '#059669' : '#CBD5E1'} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navButton} onPress={handleRefresh}>
            <Icon name="refresh" size={24} color="#059669" />
          </TouchableOpacity>
        </View>

        <View style={styles.appInfo}>
          <Icon name="account-balance-wallet" size={20} color="#059669" />
          <Text style={styles.appTitle}>Mind My Money</Text>
        </View>

        {/* Show upgrade button when user has no active IAP subscription */}
        {!activeTier && (
          <TouchableOpacity style={styles.upgradeButton} onPress={onShowPaywall}>
            <Icon name="star" size={14} color="#FFFFFF" />
            <Text style={styles.upgradeButtonText}>Get Plus</Text>
          </TouchableOpacity>
        )}
      </View>

      <WebView
        ref={webViewRef}
        source={{
          uri: WEB_APP_URL,
          headers: { 'X-Mobile-App': 'true', 'X-Platform': 'ios' },
        }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        onError={handleError}
        onMessage={handleMessage}
        injectedJavaScript={injectedJavaScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        cacheEnabled={true}
        allowFileAccess={true}
        allowsInlineMediaPlayback={true}
        pullToRefreshEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <Icon name="account-balance-wallet" size={64} color="#059669" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  navButtons: { flexDirection: 'row', gap: 4 },
  navButton: { padding: 8 },
  navButtonDisabled: { opacity: 0.35 },
  appInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  appTitle: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  upgradeButtonText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  webview: { flex: 1 },
  loadingContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: { marginTop: 16, fontSize: 16, fontWeight: '600', color: '#6B7280' },
});
