import React, { useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Alert, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialIcons';

const WEB_APP_URL = 'https://www.mindmymoneyapp.com';

interface MainAppProps {
  onUserAuthenticated: (userId: string) => void;
}

export default function MainApp({ onUserAuthenticated }: MainAppProps) {
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
    // Block Stripe checkout in mobile app - users must use Apple IAP
    if (request.url.includes('checkout.stripe.com') || request.url.includes('/subscribe')) {
      Alert.alert(
        'Subscribe via App Store',
        'To subscribe on mobile, please use the subscription options in this app. Web subscriptions are not available in the mobile app.',
        [{ text: 'OK' }]
      );
      return false;
    }

    // Handle external links
    if (request.url.startsWith('mailto:') || 
        request.url.startsWith('tel:') ||
        request.url.startsWith('sms:')) {
      Linking.openURL(request.url);
      return false;
    }

    return true;
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    Alert.alert(
      'Connection Error',
      'Unable to load Mind My Money. Please check your internet connection and try again.',
      [{ text: 'Retry', onPress: handleRefresh }]
    );
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'USER_AUTHENTICATED' && data.userId) {
        console.log('User authenticated from WebView:', data.userId);
        onUserAuthenticated(data.userId.toString());
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  // Inject JavaScript to communicate user ID and hide subscription buttons
  const injectedJavaScript = `
    (function() {
      // Hide web subscription buttons in mobile app
      const hideWebSubscriptions = function() {
        try {
          // Hide Stripe checkout buttons
          const subscribeButtons = document.querySelectorAll('[href*="subscribe"], [data-testid*="subscribe"], button:contains("Subscribe")');
          subscribeButtons.forEach(function(btn) {
            if (btn) btn.style.display = 'none';
          });
          
          // Add CSS to hide subscription-related elements
          const style = document.createElement('style');
          style.textContent = \`
            [href*="/subscribe"],
            [data-testid*="subscribe-button"],
            [data-testid*="upgrade-button"] {
              display: none !important;
            }
          \`;
          document.head.appendChild(style);
        } catch (e) {
          console.log('Error hiding web subscriptions:', e);
        }
      };
      
      // Run on load and periodically
      hideWebSubscriptions();
      setInterval(hideWebSubscriptions, 2000);
      
      // Check if user is logged in and send user ID to native app
      const checkAuthInterval = setInterval(function() {
        try {
          // Try to get user data from various possible locations
          const userElement = document.querySelector('[data-user-id]');
          if (userElement) {
            const userId = userElement.getAttribute('data-user-id');
            if (userId) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'USER_AUTHENTICATED',
                userId: userId
              }));
              clearInterval(checkAuthInterval);
            }
          }
          
          // Check sessionStorage/localStorage as fallback
          const storedUserId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
          if (storedUserId) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'USER_AUTHENTICATED',
              userId: storedUserId
            }));
            clearInterval(checkAuthInterval);
          }
        } catch (e) {
          console.log('Auth check error:', e);
        }
      }, 1000);
      
      // Stop checking after 30 seconds
      setTimeout(function() {
        clearInterval(checkAuthInterval);
      }, 30000);
    })();
    true;
  `;

  return (
    <View style={styles.container}>
      {/* Navigation Bar */}
      <View style={styles.navigationBar}>
        <View style={styles.navButtons}>
          <TouchableOpacity
            style={[styles.navButton, !canGoBack && styles.navButtonDisabled]}
            onPress={handleGoBack}
            disabled={!canGoBack}
          >
            <Icon 
              name="arrow-back" 
              size={24} 
              color={canGoBack ? '#1877F2' : '#CBD5E1'} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, !canGoForward && styles.navButtonDisabled]}
            onPress={handleGoForward}
            disabled={!canGoForward}
          >
            <Icon 
              name="arrow-forward" 
              size={24} 
              color={canGoForward ? '#1877F2' : '#CBD5E1'} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={handleRefresh}
          >
            <Icon name="refresh" size={24} color="#1877F2" />
          </TouchableOpacity>
        </View>

        <View style={styles.appInfo}>
          <Icon name="account-balance-wallet" size={20} color="#1877F2" />
          <Text style={styles.appTitle}>Mind My Money</Text>
        </View>
      </View>

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ 
          uri: WEB_APP_URL,
          headers: {
            'X-Mobile-App': 'true',
            'X-Platform': 'ios'
          }
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
        cacheMode="LOAD_CACHE_ELSE_NETWORK"
        allowFileAccess={true}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        scalesPageToFit={true}
        pullToRefreshEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <Icon name="account-balance-wallet" size={64} color="#1877F2" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  navButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    padding: 8,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
