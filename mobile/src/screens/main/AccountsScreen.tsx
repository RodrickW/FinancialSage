import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  IconButton,
  Chip,
  FAB,
} from 'react-native-paper';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../../theme/theme';
import { apiRequest } from '../../services/api';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  lastUpdated: string;
  isConnected: boolean;
}

const AccountsScreen: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: accounts, isLoading, refetch } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => apiRequest('GET', '/api/accounts'),
  });

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking': return 'account-balance';
      case 'savings': return 'savings';
      case 'credit': return 'credit-card';
      case 'investment': return 'trending-up';
      default: return 'account-balance-wallet';
    }
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'checking': return theme.colors.primary;
      case 'savings': return theme.colors.secondary;
      case 'credit': return theme.colors.tertiary;
      case 'investment': return '#8B5CF6';
      default: return theme.colors.outline;
    }
  };

  const renderAccountCard = (account: Account) => (
    <Card key={account.id} style={styles.accountCard}>
      <Card.Content>
        <View style={styles.accountHeader}>
          <View style={styles.accountInfo}>
            <Icon 
              name={getAccountIcon(account.type)} 
              size={24} 
              color={getAccountTypeColor(account.type)} 
            />
            <View style={styles.accountDetails}>
              <Text style={styles.accountName}>{account.name}</Text>
              <View style={styles.accountMeta}>
                <Chip 
                  mode="flat" 
                  style={[styles.typeChip, { backgroundColor: `${getAccountTypeColor(account.type)}20` }]}
                  textStyle={{ color: getAccountTypeColor(account.type) }}
                >
                  {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                </Chip>
                <Text style={styles.lastUpdated}>
                  Updated {new Date(account.lastUpdated).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
          <IconButton
            icon="more-vert"
            size={20}
            onPress={() => {/* Open account menu */}}
          />
        </View>
        
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={[
            styles.balanceAmount,
            { color: account.balance >= 0 ? theme.colors.secondary : theme.colors.error }
          ]}>
            ${Math.abs(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
        </View>

        <View style={styles.accountActions}>
          <Button 
            mode="outlined" 
            style={styles.actionButton}
            icon="refresh"
            compact
          >
            Refresh
          </Button>
          <Button 
            mode="outlined" 
            style={styles.actionButton}
            icon="history"
            compact
          >
            Transactions
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="account-balance-wallet" size={80} color={theme.colors.outline} />
      <Text style={styles.emptyTitle}>No Accounts Connected</Text>
      <Text style={styles.emptyDescription}>
        Connect your bank accounts to get started with tracking your finances
      </Text>
      <Button 
        mode="contained" 
        style={styles.connectButton}
        icon="add"
      >
        Connect Account
      </Button>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {accounts && accounts.length > 0 ? (
          <View style={styles.accountsList}>
            {accounts.map(renderAccountCard)}
          </View>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
      
      <FAB
        icon="add"
        style={styles.fab}
        onPress={() => {/* Open account connection flow */}}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    padding: theme.spacing.md,
  },
  accountsList: {
    gap: theme.spacing.md,
  },
  accountCard: {
    elevation: 2,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  accountInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  accountDetails: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  accountName: {
    ...theme.typography.titleMedium,
    marginBottom: theme.spacing.sm,
  },
  accountMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  typeChip: {
    height: 24,
  },
  lastUpdated: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
  },
  balanceSection: {
    marginBottom: theme.spacing.lg,
  },
  balanceLabel: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xs,
  },
  balanceAmount: {
    ...theme.typography.headingLarge,
    fontWeight: 'bold',
  },
  accountActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyTitle: {
    ...theme.typography.headingMedium,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyDescription: {
    ...theme.typography.bodyLarge,
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
  },
  connectButton: {
    paddingHorizontal: theme.spacing.lg,
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default AccountsScreen;