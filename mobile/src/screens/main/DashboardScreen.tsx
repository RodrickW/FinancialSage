import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Surface,
  IconButton,
  ProgressBar,
  Chip,
} from 'react-native-paper';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart } from 'react-native-chart-kit';
import { format, subDays } from 'date-fns';
import { theme } from '../../theme/theme';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  lastUpdated: string;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
}

interface Budget {
  id: string;
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
}

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
}

const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch dashboard data
  const { data: accounts, isLoading: accountsLoading, refetch: refetchAccounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => apiRequest('GET', '/api/accounts'),
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', 'recent'],
    queryFn: () => apiRequest('GET', '/api/transactions?limit=5'),
  });

  const { data: budgets, isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => apiRequest('GET', '/api/budgets'),
  });

  const { data: goals, isLoading: goalsLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => apiRequest('GET', '/api/goals'),
  });

  const { data: spendingData } = useQuery({
    queryKey: ['spending', 'chart'],
    queryFn: () => apiRequest('GET', '/api/analytics/spending-trend'),
  });

  const isLoading = accountsLoading || transactionsLoading || budgetsLoading || goalsLoading;

  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    queryClient.invalidateQueries({ queryKey: ['spending'] });
  };

  const getTotalBalance = () => {
    if (!accounts) return 0;
    return accounts.reduce((total: number, account: Account) => total + account.balance, 0);
  };

  const getTotalBudgetUtilization = () => {
    if (!budgets || budgets.length === 0) return 0;
    const totalBudgeted = budgets.reduce((total: number, budget: Budget) => total + budget.budgeted, 0);
    const totalSpent = budgets.reduce((total: number, budget: Budget) => total + budget.spent, 0);
    return totalBudgeted > 0 ? (totalSpent / totalBudgeted) : 0;
  };

  const getSpendingChartData = () => {
    if (!spendingData) {
      // Fallback chart data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return {
          date: format(date, 'MM/dd'),
          amount: Math.random() * 100,
        };
      });
      return last7Days;
    }
    return spendingData;
  };

  const chartData = getSpendingChartData();

  const renderAccountCard = () => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>Total Balance</Text>
            <Text style={styles.balanceAmount}>
              ${getTotalBalance().toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <IconButton
            icon="refresh"
            onPress={refetchAccounts}
            mode="outlined"
            size={20}
          />
        </View>
        
        {accounts && accounts.length > 0 ? (
          <View style={styles.accountsList}>
            {accounts.slice(0, 3).map((account: Account) => (
              <View key={account.id} style={styles.accountItem}>
                <View style={styles.accountInfo}>
                  <Icon 
                    name={account.type === 'checking' ? 'account-balance' : 'savings'} 
                    size={20} 
                    color={theme.colors.primary} 
                  />
                  <Text style={styles.accountName}>{account.name}</Text>
                </View>
                <Text style={styles.accountBalance}>
                  ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="account-balance-wallet" size={40} color={theme.colors.outline} />
            <Text style={styles.emptyStateText}>No accounts connected</Text>
            <Button mode="outlined" compact>Connect Account</Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderSpendingChart = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.cardTitle}>Spending Trend (Last 7 Days)</Text>
        <LineChart
          data={{
            labels: chartData.map(item => item.date),
            datasets: [{
              data: chartData.map(item => item.amount),
              strokeWidth: 3,
            }],
          }}
          width={width - 64}
          height={200}
          chartConfig={{
            backgroundColor: theme.colors.surface,
            backgroundGradientFrom: theme.colors.surface,
            backgroundGradientTo: theme.colors.surface,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: "4",
              strokeWidth: "2",
              stroke: theme.colors.primary,
            },
          }}
          bezier
          style={styles.chart}
        />
      </Card.Content>
    </Card>
  );

  const renderRecentTransactions = () => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Recent Transactions</Text>
          <Button mode="text" compact>View All</Button>
        </View>
        
        {transactions && transactions.length > 0 ? (
          <View style={styles.transactionsList}>
            {transactions.map((transaction: Transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <Icon 
                    name={transaction.amount > 0 ? 'arrow-downward' : 'arrow-upward'} 
                    size={20} 
                    color={transaction.amount > 0 ? theme.colors.secondary : theme.colors.error}
                  />
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionDescription}>{transaction.description}</Text>
                    <Text style={styles.transactionCategory}>{transaction.category}</Text>
                  </View>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  { color: transaction.amount > 0 ? theme.colors.secondary : theme.colors.error }
                ]}>
                  {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="receipt-long" size={40} color={theme.colors.outline} />
            <Text style={styles.emptyStateText}>No recent transactions</Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderBudgetOverview = () => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Budget Overview</Text>
          <Chip mode="flat" style={styles.utilizationChip}>
            {Math.round(getTotalBudgetUtilization() * 100)}% Used
          </Chip>
        </View>
        
        {budgets && budgets.length > 0 ? (
          <View style={styles.budgetsList}>
            {budgets.slice(0, 3).map((budget: Budget) => {
              const utilization = budget.budgeted > 0 ? budget.spent / budget.budgeted : 0;
              const isOverBudget = utilization > 1;
              
              return (
                <View key={budget.id} style={styles.budgetItem}>
                  <View style={styles.budgetHeader}>
                    <Text style={styles.budgetCategory}>{budget.category}</Text>
                    <Text style={[
                      styles.budgetAmount,
                      { color: isOverBudget ? theme.colors.error : theme.colors.onSurface }
                    ]}>
                      ${budget.spent.toFixed(0)} / ${budget.budgeted.toFixed(0)}
                    </Text>
                  </View>
                  <ProgressBar 
                    progress={Math.min(utilization, 1)} 
                    color={isOverBudget ? theme.colors.error : theme.colors.primary}
                    style={styles.budgetProgress}
                  />
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="pie-chart" size={40} color={theme.colors.outline} />
            <Text style={styles.emptyStateText}>No budgets created</Text>
            <Button mode="outlined" compact>Create Budget</Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderGoalsPreview = () => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Savings Goals</Text>
          <Button mode="text" compact>View All</Button>
        </View>
        
        {goals && goals.length > 0 ? (
          <View style={styles.goalsList}>
            {goals.slice(0, 2).map((goal: Goal) => {
              const progress = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;
              
              return (
                <View key={goal.id} style={styles.goalItem}>
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalName}>{goal.name}</Text>
                    <Text style={styles.goalProgress}>
                      {Math.round(progress * 100)}%
                    </Text>
                  </View>
                  <ProgressBar 
                    progress={progress} 
                    color={theme.colors.secondary}
                    style={styles.goalProgressBar}
                  />
                  <Text style={styles.goalAmount}>
                    ${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="flag" size={40} color={theme.colors.outline} />
            <Text style={styles.emptyStateText}>No savings goals</Text>
            <Button mode="outlined" compact>Create Goal</Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderQuickActions = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <Button 
            mode="outlined" 
            style={styles.quickActionButton}
            icon="psychology"
            compact
          >
            Ask Money Mind
          </Button>
          <Button 
            mode="outlined" 
            style={styles.quickActionButton}
            icon="credit-score"
            compact
          >
            Check Credit
          </Button>
          <Button 
            mode="outlined" 
            style={styles.quickActionButton}
            icon="add"
            compact
          >
            Add Goal
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.firstName || user?.username}!
        </Text>
        <Text style={styles.subtitle}>Here's your financial overview</Text>
      </View>

      {renderAccountCard()}
      {renderSpendingChart()}
      {renderRecentTransactions()}
      {renderBudgetOverview()}
      {renderGoalsPreview()}
      {renderQuickActions()}
      
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  greeting: {
    ...theme.typography.headingMedium,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.bodyLarge,
    color: theme.colors.onSurfaceVariant,
  },
  card: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    ...theme.typography.titleMedium,
    fontWeight: '600',
  },
  balanceAmount: {
    ...theme.typography.headingLarge,
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginTop: theme.spacing.xs,
  },
  accountsList: {
    gap: theme.spacing.sm,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountName: {
    ...theme.typography.bodyMedium,
    marginLeft: theme.spacing.sm,
  },
  accountBalance: {
    ...theme.typography.bodyMedium,
    fontWeight: '600',
  },
  chart: {
    marginVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  transactionsList: {
    gap: theme.spacing.sm,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionInfo: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  transactionDescription: {
    ...theme.typography.bodyMedium,
    fontWeight: '500',
  },
  transactionCategory: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
  },
  transactionAmount: {
    ...theme.typography.bodyMedium,
    fontWeight: '600',
  },
  utilizationChip: {
    height: 28,
  },
  budgetsList: {
    gap: theme.spacing.md,
  },
  budgetItem: {
    gap: theme.spacing.sm,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetCategory: {
    ...theme.typography.bodyMedium,
    fontWeight: '500',
  },
  budgetAmount: {
    ...theme.typography.bodyMedium,
    fontWeight: '600',
  },
  budgetProgress: {
    height: 6,
    borderRadius: 3,
  },
  goalsList: {
    gap: theme.spacing.lg,
  },
  goalItem: {
    gap: theme.spacing.sm,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalName: {
    ...theme.typography.bodyMedium,
    fontWeight: '500',
  },
  goalProgress: {
    ...theme.typography.bodyMedium,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  goalProgressBar: {
    height: 8,
    borderRadius: 4,
  },
  goalAmount: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  quickActionButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  emptyStateText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  bottomPadding: {
    height: theme.spacing.lg,
  },
});

export default DashboardScreen;