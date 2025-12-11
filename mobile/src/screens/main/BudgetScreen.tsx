import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { apiRequest } from '../../services/api';

interface BudgetCategory {
  id: number;
  userId: number;
  category: string;
  amount: number;
  period: string;
  spent: number;
  remaining: number;
  icon?: string;
}

const BudgetScreen: React.FC = () => {
  const [budgets, setBudgets] = useState<BudgetCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  const fetchBudgets = async () => {
    try {
      const response = await apiRequest('GET', '/api/budgets');
      if (response.ok) {
        const data = await response.json();
        setBudgets(data);
        
        // Calculate totals
        const budget = data.reduce((sum: number, b: BudgetCategory) => sum + (b.amount || 0), 0);
        const spent = data.reduce((sum: number, b: BudgetCategory) => sum + (b.spent || 0), 0);
        setTotalBudget(budget);
        setTotalSpent(spent);
      }
    } catch (error) {
      console.error('Budget fetch error:', error);
      Alert.alert('Error', 'Failed to load budgets');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBudgets();
  };

  const handleCreateAIBudget = async () => {
    Alert.alert(
      'Create AI Budget',
      'Would you like me to analyze your spending and create a personalized budget?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Create',
          onPress: async () => {
            try {
              const response = await apiRequest('POST', '/api/ai/create-budget', {});
              if (response.ok) {
                Alert.alert('Success', 'AI budget created! Refreshing...');
                fetchBudgets();
              } else {
                Alert.alert('Error', 'Failed to create AI budget');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to create AI budget');
            }
          },
        },
      ]
    );
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: string } = {
      'Food & Dining': 'restaurant',
      'Shopping': 'shopping-bag',
      'Transportation': 'directions-car',
      'Entertainment': 'movie',
      'Bills & Utilities': 'receipt',
      'Health': 'local-hospital',
      'Housing': 'home',
      'Savings': 'savings',
      'Income': 'attach-money',
    };
    return iconMap[category] || 'category';
  };

  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      'Food & Dining': '#F59E0B',
      'Shopping': '#EC4899',
      'Transportation': '#8B5CF6',
      'Entertainment': '#06B6D4',
      'Bills & Utilities': '#EF4444',
      'Health': '#10B981',
      'Housing': '#059669',
      'Savings': '#22C55E',
      'Income': '#14B8A6',
    };
    return colorMap[category] || '#6366F1';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getProgressPercentage = (spent: number, budget: number) => {
    if (budget === 0) return 0;
    return Math.min((spent / budget) * 100, 100);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#059669', '#0D5DBF']}
          style={styles.loadingGradient}
        >
          <Icon name="pie-chart" size={64} color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading your budget...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#059669', '#0D5DBF']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Budget Planner</Text>
        <Text style={styles.headerSubtitle}>Track your spending</Text>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
        }
      >
        {/* Overall Budget Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Budget</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(totalBudget)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={[styles.summaryAmount, { color: '#EF4444' }]}>
              {formatCurrency(totalSpent)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Remaining</Text>
            <Text style={[styles.summaryAmount, { color: '#10B981' }]}>
              {formatCurrency(totalBudget - totalSpent)}
            </Text>
          </View>
        </View>

        {/* Budget Categories */}
        {budgets.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget Categories</Text>
            {budgets.map((budget) => {
              const budgetAmount = budget.amount || 0;
              const budgetSpent = budget.spent || 0;
              const progress = getProgressPercentage(budgetSpent, budgetAmount);
              const color = getCategoryColor(budget.category);
              const isOverBudget = budgetSpent > budgetAmount;

              return (
                <View key={budget.id} style={styles.budgetCard}>
                  <View style={styles.budgetHeader}>
                    <View style={styles.budgetTitleRow}>
                      <View style={[styles.categoryIcon, { backgroundColor: `${color}20` }]}>
                        <Icon
                          name={getCategoryIcon(budget.category)}
                          size={20}
                          color={color}
                        />
                      </View>
                      <Text style={styles.budgetCategory}>{budget.category}</Text>
                    </View>
                    <Text style={[styles.budgetAmount, isOverBudget && { color: '#EF4444' }]}>
                      {formatCurrency(budgetAmount)}
                    </Text>
                  </View>

                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${progress}%`,
                            backgroundColor: isOverBudget ? '#EF4444' : color,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={styles.budgetFooter}>
                    <Text style={styles.budgetSpent}>
                      Spent: {formatCurrency(budgetSpent)}
                    </Text>
                    <Text
                      style={[
                        styles.budgetRemaining,
                        isOverBudget ? { color: '#EF4444' } : { color: '#10B981' },
                      ]}
                    >
                      {isOverBudget ? 'Over by: ' : 'Left: '}
                      {formatCurrency(Math.abs(budget.remaining || 0))}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="pie-chart" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Budget Yet</Text>
            <Text style={styles.emptyText}>
              Create a budget to start tracking your spending and reach your financial goals
            </Text>
            <Text style={styles.emptyHint}>
              Use AI to create a budget below, or manage budgets on the web app at www.mindmymoneyapp.com
            </Text>
            <TouchableOpacity style={styles.aiButton} onPress={handleCreateAIBudget}>
              <Icon name="auto-awesome" size={20} color="#FFFFFF" />
              <Text style={styles.aiButtonText}>Create AI Budget</Text>
            </TouchableOpacity>
          </View>
        )}

        {budgets.length > 0 && (
          <TouchableOpacity style={styles.aiBudgetButton} onPress={handleCreateAIBudget}>
            <Icon name="auto-awesome" size={20} color="#059669" />
            <Text style={styles.aiBudgetButtonText}>Recreate with AI</Text>
          </TouchableOpacity>
        )}

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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B',
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  budgetCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  budgetAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetSpent: {
    fontSize: 13,
    color: '#64748B',
  },
  budgetRemaining: {
    fontSize: 13,
    fontWeight: '600',
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
  emptyText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyHint: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
  },
  aiButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  aiBudgetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: '#059669',
  },
  aiBudgetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
});

export default BudgetScreen;
