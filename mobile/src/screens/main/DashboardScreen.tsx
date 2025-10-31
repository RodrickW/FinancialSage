import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { Card } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { TrialStatus } from '../../components/TrialStatus';

const { width } = Dimensions.get('window');

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  lastRefreshed: string;
}

interface FinancialOverview {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savings: number;
}

interface RecentTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
}

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [overview, setOverview] = useState<FinancialOverview | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [overviewRes, accountsRes, transactionsRes] = await Promise.all([
        apiRequest('GET', '/api/dashboard/overview'),
        apiRequest('GET', '/api/accounts'),
        apiRequest('GET', '/api/transactions/recent?limit=5'),
      ]);

      if (overviewRes.ok) {
        const overviewData = await overviewRes.json();
        setOverview(overviewData);
      }

      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        setAccounts(accountsData);
      }

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        setRecentTransactions(transactionsData);
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
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
    });
  };

  const OverviewCard = ({ title, amount, icon, color, onPress }: {
    title: string;
    amount: number;
    icon: string;
    color: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity style={styles.overviewCard} onPress={onPress}>
      <Card style={[styles.card, { borderLeftColor: color, borderLeftWidth: 4 }]}>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Icon name={icon} size={24} color={color} />
            <Text style={styles.cardTitle}>{title}</Text>
          </View>
          <Text style={[styles.cardAmount, { color }]}>
            {formatCurrency(amount)}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const AccountCard = ({ account }: { account: Account }) => (
    <TouchableOpacity 
      style={styles.accountCard}
      onPress={() => navigation.navigate('Accounts' as never)}
    >
      <Card style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.accountHeader}>
            <View>
              <Text style={styles.accountName}>{account.name}</Text>
              <Text style={styles.accountType}>{account.type}</Text>
            </View>
            <Text style={styles.accountBalance}>
              {formatCurrency(account.balance)}
            </Text>
          </View>
          <Text style={styles.lastRefreshed}>
            Last updated: {formatDate(account.lastRefreshed)}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const TransactionItem = ({ transaction }: { transaction: RecentTransaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDescription} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={styles.transactionCategory}>{transaction.category}</Text>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[
          styles.transactionAmount,
          { color: transaction.amount < 0 ? '#EF4444' : '#10B981' }
        ]}>
          {formatCurrency(Math.abs(transaction.amount))}
        </Text>
        <Text style={styles.transactionDate}>
          {formatDate(transaction.date)}
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your financial overview...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <TrialStatus />
      
      <LinearGradient
        colors={['#0F766E', '#14B8A6']}
        style={styles.header}
      >
        <Text style={styles.welcomeText}>Welcome back, {user?.username}!</Text>
        <Text style={styles.headerSubtitle}>Here's your financial overview</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Financial Overview */}
        {overview && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Financial Overview</Text>
            <View style={styles.overviewGrid}>
              <OverviewCard
                title="Total Balance"
                amount={overview.totalBalance}
                icon="account-balance-wallet"
                color="#14B8A6"
                onPress={() => navigation.navigate('Accounts' as never)}
              />
              <OverviewCard
                title="Monthly Income"
                amount={overview.monthlyIncome}
                icon="trending-up"
                color="#10B981"
              />
              <OverviewCard
                title="Monthly Expenses"
                amount={overview.monthlyExpenses}
                icon="trending-down"
                color="#EF4444"
                onPress={() => navigation.navigate('Budget' as never)}
              />
              <OverviewCard
                title="Savings"
                amount={overview.savings}
                icon="savings"
                color="#8B5CF6"
                onPress={() => navigation.navigate('Goals' as never)}
              />
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Coach' as never)}
            >
              <LinearGradient
                colors={['#8B5CF6', '#A855F7']}
                style={styles.actionGradient}
              >
                <Icon name="psychology" size={32} color="#FFFFFF" />
                <Text style={styles.actionText}>AI Coach</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Budget' as never)}
            >
              <LinearGradient
                colors={['#F59E0B', '#FBBF24']}
                style={styles.actionGradient}
              >
                <Icon name="pie-chart" size={32} color="#FFFFFF" />
                <Text style={styles.actionText}>Budget</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Goals' as never)}
            >
              <LinearGradient
                colors={['#06B6D4', '#0891B2']}
                style={styles.actionGradient}
              >
                <Icon name="flag" size={32} color="#FFFFFF" />
                <Text style={styles.actionText}>Goals</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Credit' as never)}
            >
              <LinearGradient
                colors={['#EC4899', '#F472B6']}
                style={styles.actionGradient}
              >
                <Icon name="credit-score" size={32} color="#FFFFFF" />
                <Text style={styles.actionText}>Credit</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Transactions' as never)}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <Card style={styles.transactionsCard}>
              {recentTransactions.map((transaction, index) => (
                <View key={transaction.id}>
                  <TransactionItem transaction={transaction} />
                  {index < recentTransactions.length - 1 && (
                    <View style={styles.transactionDivider} />
                  )}
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Connected Accounts */}
        {accounts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Accounts</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Accounts' as never)}>
                <Text style={styles.seeAllText}>Manage</Text>
              </TouchableOpacity>
            </View>
            {accounts.slice(0, 3).map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </View>
        )}

        {/* Connect Account CTA */}
        {accounts.length === 0 && (
          <View style={styles.section}>
            <Card style={styles.ctaCard}>
              <LinearGradient
                colors={['#0F766E', '#14B8A6']}
                style={styles.ctaGradient}
              >
                <Icon name="account-balance" size={48} color="#FFFFFF" />
                <Text style={styles.ctaTitle}>Connect Your Bank Account</Text>
                <Text style={styles.ctaSubtitle}>
                  Get started by connecting your bank account to see your financial overview
                </Text>
                <TouchableOpacity 
                  style={styles.ctaButton}
                  onPress={() => navigation.navigate('Accounts' as never)}
                >
                  <Text style={styles.ctaButtonText}>Connect Account</Text>
                  <Icon name="arrow-forward" size={20} color="#14B8A6" />
                </TouchableOpacity>
              </LinearGradient>
            </Card>
          </View>
        )}
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
  welcomeText: {
    fontSize: 24,
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
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  seeAllText: {
    fontSize: 14,
    color: '#14B8A6',
    fontWeight: '600',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  overviewCard: {
    width: (width - 60) / 2,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    fontWeight: '500',
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (width - 80) / 2,
    marginBottom: 16,
  },
  actionGradient: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  transactionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  transactionInfo: {
    flex: 1,
    marginRight: 16,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 14,
    color: '#6B7280',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: -16,
  },
  accountCard: {
    marginBottom: 12,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  accountType: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  accountBalance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#14B8A6',
  },
  lastRefreshed: {
    fontSize: 12,
    color: '#6B7280',
  },
  ctaCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  ctaGradient: {
    padding: 24,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: 16,
    color: '#F0FDFA',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  ctaButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ctaButtonText: {
    color: '#14B8A6',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default DashboardScreen;