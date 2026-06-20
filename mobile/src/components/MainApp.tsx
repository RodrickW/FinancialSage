import React, { useRef, useState, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialIcons';

const WEB_APP_URL = 'https://www.mindmymoneyapp.com';

interface MainAppProps {
  onUserAuthenticated: (userId: string, hasSubscription?: boolean) => void;
  onShowPaywall: () => void;
  activeTier?: 'plus' | 'pro' | null;
  initialPath?: string;
}

export default function MainApp({ onUserAuthenticated, onShowPaywall, activeTier, initialPath }: MainAppProps) {
  const webViewRef = useRef<WebView>(null);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const handleRetry = useCallback(() => {
    setLoadError(false);
    setRetryKey(k => k + 1);
  }, []);

  const handleShouldStartLoadWithRequest = (request: any) => {
    // On iOS, intercept Stripe checkout and show Apple IAP paywall instead
    // On Android, Stripe checkout works fine — let it through
    if (Platform.OS === 'ios' && request.url.includes('checkout.stripe.com')) {
      onShowPaywall();
      return false;
    }
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

  const handleError = () => {
    setLoadError(true);
  };

  const handleHttpError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    // Retry on 5xx server errors; ignore 4xx (those are normal auth redirects)
    if (nativeEvent.statusCode >= 500) {
      setLoadError(true);
    }
  };

  const handleLoadEnd = (syntheticEvent: any) => {
    if (!webViewRef.current) return;
    webViewRef.current.injectJavaScript(`
      (function() {
        try {
          var body = document.body && document.body.innerText;
          // Blank page — reload fresh
          if (!body || body.trim().length === 0) {
            window.location.reload();
            return;
          }
          // Raw JSON error — redirect to login
          if (body.includes('deserialize') || (body.includes('"message"') && !document.querySelector('#root'))) {
            window.location.href = '/login';
          }
        } catch(e) {}
      })();
      true;
    `);
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'USER_AUTHENTICATED' && data.userId) {
        onUserAuthenticated(data.userId.toString(), data.hasSubscription);
      }
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
      localStorage.setItem('isMobileApp', 'true');
      sessionStorage.setItem('isMobileApp', 'true');
      window.isMobileApp = true;
      window.mobileSubscriptionTier = ${tierStr};

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

      ${Platform.OS === 'ios' ? `
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
      }, true);` : ''}

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
              headers: { 'X-Mobile-App': 'true', 'X-Platform': '${Platform.OS}' }
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

  if (loadError) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="wifi-off" size={64} color="#9CA3AF" />
        <Text style={styles.errorTitle}>Connection Lost</Text>
        <Text style={styles.errorMessage}>Unable to reach Mind My Money. Check your connection and try again.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        key={retryKey}
        ref={webViewRef}
        source={{
          uri: initialPath ? `${WEB_APP_URL}${initialPath}` : WEB_APP_URL,
          headers: { 'X-Mobile-App': 'true', 'X-Platform': 'ios' },
        }}
        style={styles.webview}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        onError={handleError}
        onHttpError={handleHttpError}
        onLoadEnd={handleLoadEnd}
        onMessage={handleMessage}
        injectedJavaScript={injectedJavaScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        cacheEnabled={false}
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
  webview: { flex: 1 },
  loadingContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: { marginTop: 16, fontSize: 16, fontWeight: '600', color: '#6B7280' },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
  },
  errorTitle: { fontSize: 22, fontWeight: '700', color: '#1F2937', marginTop: 20, marginBottom: 10 },
  errorMessage: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  retryButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
