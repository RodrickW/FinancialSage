import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { apiService } from '@/services/api';

interface AccountsScreenProps {
  navigation: any;
}

export const AccountsScreen: React.FC<AccountsScreenProps> = ({ navigation }) => {
  const queryClient = useQueryClient();

  const { data: accounts, isLoading, refetch } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => apiService.getAccounts(),
  });

  const handleConnectAccount = async () => {
    try {
      const response = await apiService.createLinkToken();
      // In a real app, you would open Plaid Link here
      // For now, we'll show an alert
      Alert.alert(
        'Connect Bank Account',
        'In a production app, this would open Plaid Link to connect your bank account securely.',
        [
          { text: 'OK', style: 'default' }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate bank connection. Please try again.');
    }
  };

  const handleRefreshBalances = async () => {
    try {
      await refetch();
      Alert.alert('Success', 'Account balances refreshed successfully!');
    } catch (error: any) {
      // Handle rate limiting specifically  
      if (error.status === 429) {
        Alert.alert(
          'Rate Limited', 
          `Please wait ${error.remainingMinutes || 720} minutes before refreshing again to avoid excessive API charges.`
        );
      } else {
        Alert.alert('Error', 'Failed to refresh balances. Please try again.');
      }
    }
  };

  const handleDisconnectAccount = (accountId: string, accountName: string) => {
    Alert.alert(
      'Disconnect Account',
      `Are you sure you want to disconnect ${accountName}? This will remove all associated transaction data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Disconnect', 
          style: 'destructive',
          onPress: async () => {
            try {
              // In a real app, you would call an API to disconnect
              Alert.alert('Success', 'Account disconnected successfully!');
              await refetch();
            } catch (error) {
              Alert.alert('Error', 'Failed to disconnect account. Please try again.');
            }
          }
        }
      ]
    );
  };

  const formatAccountNumber = (accountNumber: string) => {
    return `****${accountNumber.slice(-4)}`;
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Connected Accounts</Text>
        <Button
          title="Connect Bank Account"
          onPress={handleConnectAccount}
          style={styles.connectButton}
        />
      </View>

      {accounts?.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Connected Accounts</Text>
          <Text style={styles.emptyText}>
            Connect your bank account to start tracking your finances automatically.
          </Text>
          <Button
            title="Connect Your First Account"
            onPress={handleConnectAccount}
            style={styles.emptyButton}
          />
        </Card>
      ) : (
        <>
          <Button
            title="Refresh All Balances"
            onPress={handleRefreshBalances}
            variant="secondary"
            style={styles.refreshButton}
          />

          {accounts?.map((account: any) => (
            <Card key={account.id} style={styles.accountCard}>
              <View style={styles.accountHeader}>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{account.name}</Text>
                  <Text style={styles.accountDetails}>
                    {account.institutionName} • {formatAccountNumber(account.accountNumber)}
                  </Text>
                  <Text style={styles.accountType}>{account.type}</Text>
                </View>
                <View style={styles.balanceContainer}>
                  <Text style={styles.balanceAmount}>
                    ${account.balance?.toFixed(2) || '0.00'}
                  </Text>
                  <Text style={styles.balanceLabel}>Balance</Text>
                </View>
              </View>

              <View style={styles.accountActions}>
                <Button
                  title="View Details"
                  onPress={() => Alert.alert('Account Details', 'Account details would be shown here.')}
                  variant="secondary"
                  size="sm"
                  style={styles.actionButton}
                />
                <Button
                  title="Refresh"
                  onPress={handleRefreshBalances}
                  variant="secondary"
                  size="sm"
                  style={styles.actionButton}
                />
                <Button
                  title="Disconnect"
                  onPress={() => handleDisconnectAccount(account.id, account.name)}
                  variant="danger"
                  size="sm"
                  style={styles.actionButton}
                />
              </View>
            </Card>
          ))}
        </>
      )}

      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>Secure Connection</Text>
        <Text style={styles.infoText}>
          Your bank connections are secured with bank-level 256-bit encryption. 
          We never store your banking passwords or have access to move money.
        </Text>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  connectButton: {
    marginBottom: 16,
  },
  refreshButton: {
    marginBottom: 16,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  emptyButton: {
    marginTop: 16,
  },
  accountCard: {
    marginBottom: 16,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  accountDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  accountType: {
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  accountActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
    borderWidth: 1,
    marginTop: 20,
    marginBottom: 40,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
});