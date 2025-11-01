import React, { useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, View, TouchableOpacity, Text, Alert, Linking, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import Icon from 'react-native-vector-icons/MaterialIcons';

const WEB_APP_URL = 'https://www.mindmymoneyapp.com';

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(WEB_APP_URL);

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
    setCurrentUrl(navState.url);
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    // Handle Stripe checkout - open in Safari for payment
    if (request.url.includes('checkout.stripe.com')) {
      Linking.openURL(request.url);
      return false; // Don't load in WebView
    }

    // Handle external links
    if (request.url.startsWith('mailto:') || 
        request.url.startsWith('tel:') ||
        request.url.startsWith('sms:')) {
      Linking.openURL(request.url);
      return false;
    }

    // Allow all other requests
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
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
        source={{ uri: WEB_APP_URL }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        onError={handleError}
        
        // Enable JavaScript
        javaScriptEnabled={true}
        
        // Enable DOM storage for session/local storage
        domStorageEnabled={true}
        
        // Enable cookies for authentication
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        
        // Cache settings
        cacheEnabled={true}
        cacheMode="LOAD_CACHE_ELSE_NETWORK"
        
        // Allow file access
        allowFileAccess={true}
        
        // Media playback
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        
        // Zoom settings
        scalesPageToFit={true}
        
        // Pull to refresh
        pullToRefreshEnabled={true}
        
        // User agent
        userAgent={`Mind My Money Mobile App/${Platform.OS}`}
        
        // Loading indicator
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <Icon name="account-balance-wallet" size={64} color="#1877F2" />
            <Text style={styles.loadingText}>Loading Mind My Money...</Text>
          </View>
        )}
      />
    </SafeAreaView>
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
