import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { apiRequest } from '../../services/api';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  institutionName: string;
  lastRefreshed: string;
}

const AccountsScreen: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const fetchAccounts = async () => {
    try {
      const response = await apiRequest('GET', '/api/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      } else {
        Alert.alert('Error', 'Failed to load accounts');
      }
    } catch (error) {
      console.error('Accounts fetch error:', error);
      Alert.alert('Error', 'Failed to load accounts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleConnectAccount = async () => {
    Alert.alert(
      'Connect Account',
      'To connect a bank account, please use the web app. Accounts you connect will automatically sync to the mobile app.',
      [{ text: 'Got it', style: 'default' }]
    );
  };

  const handleDisconnectAccount = async (accountId: string, accountName: string) => {
    Alert.alert(
      'Disconnect Account',
      `Are you sure you want to disconnect ${accountName}? This will remove all transaction data for this account.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiRequest('DELETE', `/api/accounts/${accountId}`);
              if (response.ok) {
                Alert.alert('Success', 'Account disconnected successfully!');
                fetchAccounts();
              } else {
                Alert.alert('Error', 'Failed to disconnect account');
              }
            } catch (error) {
              console.error('Disconnect account error:', error);
              Alert.alert('Error', 'Failed to disconnect account');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAccountIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'checking':
        return 'account-balance';
      case 'savings':
        return 'savings';
      case 'credit':
        return 'credit-card';
      case 'investment':
        return 'trending-up';
      default:
        return 'account-balance-wallet';
    }
  };

  const getAccountColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'checking':
        return '#1877F2';
      case 'savings':
        return '#1565C0';
      case 'credit':
        return '#EF4444';
      case 'investment':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#1877F2', '#0D5DBF']} style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading your accounts...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1877F2', '#0D5DBF']} style={styles.header}>
        <Text style={styles.headerTitle}>Your Accounts</Text>
        <Text style={styles.headerSubtitle}>Manage your connected bank accounts</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {accounts.length > 0 ? (
            <>
              <View style={styles.accountsSection}>
                <Text style={styles.sectionTitle}>Connected Accounts ({accounts.length})</Text>
                {accounts.map((account) => (
                  <View key={account.id} style={styles.accountCard}>
                    <View style={styles.accountHeader}>
                      <View style={styles.accountInfo}>
                        <View
                          style={[
                            styles.accountIcon,
                            { backgroundColor: getAccountColor(account.type) + '20' },
                          ]}
                        >
                          <Icon
                            name={getAccountIcon(account.type)}
                            size={24}
                            color={getAccountColor(account.type)}
                          />
                        </View>
                        <View style={styles.accountDetails}>
                          <Text style={styles.accountName}>{account.name}</Text>
                          <Text style={styles.institutionName}>{account.institutionName}</Text>
                          <Text style={styles.accountType}>{account.type}</Text>
                        </View>
                      </View>
                      <View style={styles.balanceContainer}>
                        <Text style={[styles.balance, { color: getAccountColor(account.type) }]}>
                          {formatCurrency(account.balance)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.accountFooter}>
                      <Text style={styles.lastRefreshed}>
                        Last updated: {formatDate(account.lastRefreshed)}
                      </Text>
                      <TouchableOpacity
                        style={styles.disconnectButton}
                        onPress={() => handleDisconnectAccount(account.id, account.name)}
                      >
                        <Icon name="link-off" size={18} color="#EF4444" />
                        <Text style={styles.disconnectText}>Disconnect</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.rateLimitInfo}>
                <Icon name="info" size={20} color="#1877F2" />
                <Text style={styles.rateLimitText}>
                  Account balances refresh automatically when you log in.
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="account-balance" size={64} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Accounts Connected</Text>
              <Text style={styles.emptyDescription}>
                Connect your bank accounts to start tracking your finances with AI-powered insights.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.connectButton, isConnecting && { opacity: 0.5 }]}
            onPress={handleConnectAccount}
            disabled={isConnecting}
          >
            <LinearGradient colors={['#1877F2', '#0D5DBF']} style={styles.buttonGradient}>
              <Icon name="add" size={24} color="#FFFFFF" />
              <Text style={styles.connectButtonText}>
                {isConnecting ? 'Connecting...' : 'Connect New Account'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.securityInfo}>
            <Icon name="security" size={24} color="#10B981" />
            <View style={styles.securityTextContainer}>
              <Text style={styles.securityTitle}>Bank-Level Security</Text>
              <Text style={styles.securityDescription}>
                Your data is protected with 256-bit encryption and we never store your banking
                credentials.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    padding: 16,
  },
  accountsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  accountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  institutionName: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  accountType: {
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'capitalize',
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balance: {
    fontSize: 20,
    fontWeight: '700',
  },
  accountFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  lastRefreshed: {
    fontSize: 12,
    color: '#64748B',
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  disconnectText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#EF4444',
  },
  rateLimitInfo: {
    flexDirection: 'row',
    backgroundColor: '#DBEAFE',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  rateLimitText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  connectButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  securityInfo: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  securityTextContainer: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 4,
  },
  securityDescription: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 18,
  },
});

export default AccountsScreen;
