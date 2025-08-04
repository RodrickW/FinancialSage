import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Logo } from '@/components/Logo';
import { apiService } from '@/services/api';

interface DashboardScreenProps {
  navigation: any;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { data: userProfile, isLoading: userLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => apiService.getUserProfile(),
  });

  const { data: accounts, isLoading: accountsLoading, refetch: refetchAccounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => apiService.getAccounts(),
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => apiService.getTransactions(),
  });

  const { data: spendingTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ['spendingTrends'],
    queryFn: () => apiService.getSpendingTrends(),
  });

  const { data: savingsGoals, isLoading: goalsLoading } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: () => apiService.getSavingsGoals(),
  });

  const onRefresh = async () => {
    await refetchAccounts();
  };

  const totalBalance = accounts?.reduce((sum: number, account: any) => sum + account.balance, 0) || 0;
  const recentTransactions = transactions?.slice(0, 5) || [];

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={accountsLoading} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Logo size={32} showText={false} />
        <Text style={styles.greeting}>
          Welcome back, {userProfile?.firstName || 'User'}!
        </Text>
      </View>

      {/* Account Balance Summary */}
      <Card style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>${totalBalance.toFixed(2)}</Text>
        <Button
          title="Connect Bank Account"
          onPress={() => navigation.navigate('Accounts')}
          size="sm"
          style={styles.connectButton}
        />
      </Card>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Button
          title="Premium Features"
          onPress={() => navigation.navigate('Subscribe')}
          variant="outline"
          size="sm"
          style={styles.quickAction}
        />
        <Button
          title="AI Coach"
          onPress={() => navigation.navigate('Coach')}
          style={styles.actionButton}
        />
        <Button
          title="Budget"
          onPress={() => navigation.navigate('Budget')}
          variant="secondary"
          style={styles.actionButton}
        />
      </View>

      {/* Recent Transactions */}
      <Card>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {recentTransactions.length === 0 ? (
          <Text style={styles.emptyText}>No transactions yet. Connect your bank account to see your spending.</Text>
        ) : (
          recentTransactions.map((transaction: any, index: number) => (
            <View key={index} style={styles.transactionItem}>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionName}>{transaction.name}</Text>
                <Text style={styles.transactionDate}>{new Date(transaction.date).toLocaleDateString()}</Text>
              </View>
              <Text style={[
                styles.transactionAmount,
                transaction.amount < 0 ? styles.negative : styles.positive
              ]}>
                ${Math.abs(transaction.amount).toFixed(2)}
              </Text>
            </View>
          ))
        )}
      </Card>

      {/* Savings Goals */}
      <Card>
        <Text style={styles.sectionTitle}>Savings Goals</Text>
        {savingsGoals?.length === 0 ? (
          <Text style={styles.emptyText}>No savings goals yet. Create your first goal to start saving!</Text>
        ) : (
          savingsGoals?.slice(0, 3).map((goal: any, index: number) => (
            <View key={index} style={styles.goalItem}>
              <Text style={styles.goalName}>{goal.name}</Text>
              <Text style={styles.goalProgress}>
                ${goal.currentAmount?.toFixed(2) || '0.00'} / ${goal.targetAmount?.toFixed(2) || '0.00'}
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%` }
                  ]}
                />
              </View>
            </View>
          ))
        )}
        <Button
          title="View All Goals"
          onPress={() => navigation.navigate('Goals')}
          variant="secondary"
          size="sm"
          style={styles.viewAllButton}
        />
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
  },
  balanceCard: {
    alignItems: 'center',
    backgroundColor: '#10b981',
    padding: 24,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginVertical: 8,
  },
  connectButton: {
    backgroundColor: '#ffffff',
    marginTop: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickAction: {
    flex: 1,
  },
  actionButton: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  transactionDate: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  negative: {
    color: '#ef4444',
  },
  positive: {
    color: '#10b981',
  },
  goalItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  goalName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  goalProgress: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  viewAllButton: {
    marginTop: 12,
  },
});