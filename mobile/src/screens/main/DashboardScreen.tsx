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
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { TrialStatus } from '../../components/TrialStatus';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 16;

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

  const getCategoryIcon = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'Food & Dining': 'restaurant',
      'Shopping': 'shopping-bag',
      'Transportation': 'directions-car',
      'Entertainment': 'movie',
      'Bills & Utilities': 'receipt',
      'Health': 'local-hospital',
      'Income': 'attach-money',
    };
    return categoryMap[category] || 'category';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#1877F2', '#0D5DBF']}
          style={styles.loadingGradient}
        >
          <Icon name="account-balance-wallet" size={64} color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading your financial overview...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1877F2"
          />
        }
      >
        <TrialStatus />

        {/* Hero Balance Card */}
        {overview && (
          <LinearGradient
            colors={['#1877F2', '#0D5DBF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroContent}>
              <Text style={styles.heroLabel}>Total Balance</Text>
              <Text style={styles.heroAmount}>{formatCurrency(overview.totalBalance)}</Text>
              <Text style={styles.heroSubtitle}>
                Across {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
              </Text>
            </View>
          </LinearGradient>
        )}

        {/* Quick Stats Grid */}
        {overview && (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#D1FAE5' }]}>
                <Icon name="trending-up" size={24} color="#10B981" />
              </View>
              <Text style={styles.statLabel}>Income</Text>
              <Text style={styles.statAmount}>{formatCurrency(overview.monthlyIncome)}</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FEE2E2' }]}>
                <Icon name="trending-down" size={24} color="#EF4444" />
              </View>
              <Text style={styles.statLabel}>Expenses</Text>
              <Text style={styles.statAmount}>{formatCurrency(overview.monthlyExpenses)}</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#E0E7FF' }]}>
                <Icon name="savings" size={24} color="#6366F1" />
              </View>
              <Text style={styles.statLabel}>Savings</Text>
              <Text style={styles.statAmount}>{formatCurrency(overview.savings)}</Text>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Accounts' as never)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#DBEAFE' }]}>
                <Icon name="account-balance" size={28} color="#1877F2" />
              </View>
              <Text style={styles.quickActionLabel}>Accounts</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Budget' as never)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Icon name="pie-chart" size={28} color="#F59E0B" />
              </View>
              <Text style={styles.quickActionLabel}>Budget</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Goals' as never)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#E0E7FF' }]}>
                <Icon name="flag" size={28} color="#6366F1" />
              </View>
              <Text style={styles.quickActionLabel}>Goals</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Coach' as never)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#F3E8FF' }]}>
                <Icon name="psychology" size={28} color="#A855F7" />
              </View>
              <Text style={styles.quickActionLabel}>AI Coach</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Transactions' as never)}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.transactionsCard}>
              {recentTransactions.map((transaction, index) => (
                <View key={transaction.id}>
                  <View style={styles.transactionRow}>
                    <View style={styles.transactionLeft}>
                      <View style={[
                        styles.categoryIconContainer,
                        { backgroundColor: transaction.amount < 0 ? '#FEE2E2' : '#D1FAE5' }
                      ]}>
                        <Icon
                          name={getCategoryIcon(transaction.category)}
                          size={20}
                          color={transaction.amount < 0 ? '#EF4444' : '#10B981'}
                        />
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionDescription} numberOfLines={1}>
                          {transaction.description}
                        </Text>
                        <Text style={styles.transactionCategory}>{transaction.category}</Text>
                      </View>
                    </View>
                    <View style={styles.transactionRight}>
                      <Text style={[
                        styles.transactionAmount,
                        { color: transaction.amount < 0 ? '#EF4444' : '#10B981' }
                      ]}>
                        {transaction.amount < 0 ? '-' : '+'}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {formatDate(transaction.date)}
                      </Text>
                    </View>
                  </View>
                  {index < recentTransactions.length - 1 && (
                    <View style={styles.transactionDivider} />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Your Accounts */}
        {accounts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Accounts</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Accounts' as never)}>
                <Text style={styles.viewAllText}>Manage</Text>
              </TouchableOpacity>
            </View>
            {accounts.map((account) => (
              <TouchableOpacity
                key={account.id}
                style={styles.accountCard}
                onPress={() => navigation.navigate('Accounts' as never)}
              >
                <View style={styles.accountContent}>
                  <View style={styles.accountLeft}>
                    <View style={styles.accountIconContainer}>
                      <Icon name="account-balance" size={24} color="#1877F2" />
                    </View>
                    <View>
                      <Text style={styles.accountName}>{account.name}</Text>
                      <Text style={styles.accountType}>{account.type}</Text>
                    </View>
                  </View>
                  <Text style={styles.accountBalance}>
                    {formatCurrency(account.balance)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 32 }} />
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  heroCard: {
    marginHorizontal: CARD_MARGIN,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#1877F2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: CARD_MARGIN,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 4,
  },
  statAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  section: {
    marginHorizontal: CARD_MARGIN,
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
    fontWeight: '700',
    color: '#0F172A',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1877F2',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: (width - CARD_MARGIN * 2 - 12) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  transactionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 13,
    fontWeight: '400',
    color: '#64748B',
  },
  transactionRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    fontWeight: '400',
    color: '#64748B',
  },
  transactionDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
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
  accountContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  accountType: {
    fontSize: 13,
    fontWeight: '400',
    color: '#64748B',
  },
  accountBalance: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1877F2',
  },
});

export default DashboardScreen;
