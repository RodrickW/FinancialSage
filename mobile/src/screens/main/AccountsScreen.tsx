import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
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
    setIsConnecting(true);
    try {
      const response = await apiRequest('POST', '/api/plaid/link-token');
      if (response.ok) {
        const data = await response.json();
        // In a real React Native app, you would use the Plaid Link SDK
        // For now, we'll show an alert
        Alert.alert(
          'Connect Account',
          'Plaid Link would open here to connect your bank account.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Demo Connect', onPress: () => {
              // For demo purposes, we'll simulate a successful connection
              Alert.alert('Success', 'Account connected successfully!');
              fetchAccounts();
            }}
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to initialize account connection');
      }
    } catch (error) {
      console.error('Connect account error:', error);
      Alert.alert('Error', 'Failed to connect account');
    } finally {
      setIsConnecting(false);
    }
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
          }
        }
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

  const AccountCard = ({ account }: { account: Account }) => (
    <Card style={styles.accountCard}>
      <View style={styles.cardContent}>
        <View style={styles.accountHeader}>
          <View style={styles.accountInfo}>
            <View style={[styles.accountIcon, { backgroundColor: getAccountColor(account.type) + '20' }]}>
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
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDisconnectAccount(account.id, account.name)}
            >
              <Icon name="link-off" size={20} color="#EF4444" />
              <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>
                Disconnect
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </Card>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your accounts...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={['#1565C0', '#1877F2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Your Accounts</Text>
        <Text style={styles.headerSubtitle}>
          Manage your connected bank accounts
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        {accounts.length > 0 ? (
          <>
            <View style={styles.accountsSection}>
              <Text style={styles.sectionTitle}>Connected Accounts ({accounts.length})</Text>
              {accounts.map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
            </View>

            <View style={styles.rateLimitInfo}>
              <Icon name="info" size={20} color="#6B7280" />
              <Text style={styles.rateLimitText}>
                Account balances are automatically refreshed when you log in to ensure you always see current data.
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="account-balance" size={64} color="#6B7280" />
            <Text style={styles.emptyTitle}>No Accounts Connected</Text>
            <Text style={styles.emptyDescription}>
              Connect your bank accounts to start tracking your finances with AI-powered insights.
            </Text>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.connectButton, isConnecting && styles.disabledButton]}
          onPress={handleConnectAccount}
          disabled={isConnecting}
        >
          <LinearGradient
            colors={['#1877F2', '#1565C0']}
            style={styles.buttonGradient}
          >
            <Icon name="add" size={24} color="#FFFFFF" />
            <Text style={styles.connectButtonText}>
              {isConnecting ? 'Connecting...' : 'Connect New Account'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.securityInfo}>
          <Icon name="security" size={24} color="#10B981" />
          <View style={styles.securityText}>
            <Text style={styles.securityTitle}>Bank-Level Security</Text>
            <Text style={styles.securityDescription}>
              Your data is protected with 256-bit encryption and we never store your banking credentials.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#F0FDFA',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  accountsSection: {
    marginTop: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  accountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: 20,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  institutionName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  accountType: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balance: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  accountFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  lastRefreshed: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    color: '#1877F2',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  connectButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  connectButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  rateLimitInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  rateLimitText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 20,
  },
  securityText: {
    marginLeft: 16,
    flex: 1,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 4,
  },
  securityDescription: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
});

export default AccountsScreen;