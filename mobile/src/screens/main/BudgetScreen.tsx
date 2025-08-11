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
  ProgressBar,
  Chip,
  FAB,
} from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../../theme/theme';
import { apiRequest } from '../../services/api';

interface Budget {
  id: string;
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
  period: string;
}

const BudgetScreen: React.FC = () => {
  const { data: budgets, isLoading, refetch } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => apiRequest('GET', '/api/budgets'),
  });

  const getTotalBudget = () => {
    if (!budgets) return { budgeted: 0, spent: 0, remaining: 0 };
    return budgets.reduce(
      (acc: any, budget: Budget) => ({
        budgeted: acc.budgeted + budget.budgeted,
        spent: acc.spent + budget.spent,
        remaining: acc.remaining + budget.remaining,
      }),
      { budgeted: 0, spent: 0, remaining: 0 }
    );
  };

  const renderBudgetSummary = () => {
    const totals = getTotalBudget();
    const utilization = totals.budgeted > 0 ? totals.spent / totals.budgeted : 0;
    
    return (
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Text style={styles.summaryTitle}>Monthly Budget Overview</Text>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Budgeted</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
                ${totals.budgeted.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Spent</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.error }]}>
                ${totals.spent.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Remaining</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.secondary }]}>
                ${totals.remaining.toLocaleString()}
              </Text>
            </View>
          </View>
          
          <View style={styles.utilizationSection}>
            <View style={styles.utilizationHeader}>
              <Text style={styles.utilizationLabel}>Overall Progress</Text>
              <Chip mode="flat" style={styles.utilizationChip}>
                {Math.round(utilization * 100)}% Used
              </Chip>
            </View>
            <ProgressBar 
              progress={utilization} 
              color={utilization > 1 ? theme.colors.error : theme.colors.primary}
              style={styles.utilizationBar}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderBudgetCard = (budget: Budget) => {
    const utilization = budget.budgeted > 0 ? budget.spent / budget.budgeted : 0;
    const isOverBudget = utilization > 1;
    const isNearLimit = utilization > 0.8 && !isOverBudget;
    
    return (
      <Card key={budget.id} style={styles.budgetCard}>
        <Card.Content>
          <View style={styles.budgetHeader}>
            <View style={styles.budgetInfo}>
              <Icon 
                name={getCategoryIcon(budget.category)} 
                size={24} 
                color={getCategoryColor(budget.category)} 
              />
              <View style={styles.budgetDetails}>
                <Text style={styles.budgetCategory}>{budget.category}</Text>
                <Text style={styles.budgetPeriod}>{budget.period}</Text>
              </View>
            </View>
            {(isOverBudget || isNearLimit) && (
              <Chip 
                mode="flat" 
                style={[
                  styles.statusChip,
                  { backgroundColor: isOverBudget ? '#FEE2E2' : '#FEF3C7' }
                ]}
                textStyle={{ 
                  color: isOverBudget ? theme.colors.error : '#92400E' 
                }}
              >
                {isOverBudget ? 'Over Budget' : 'Near Limit'}
              </Chip>
            )}
          </View>
          
          <View style={styles.budgetAmounts}>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Spent</Text>
              <Text style={[styles.amountValue, { color: theme.colors.error }]}>
                ${budget.spent.toFixed(0)}
              </Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Budget</Text>
              <Text style={styles.amountValue}>
                ${budget.budgeted.toFixed(0)}
              </Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Remaining</Text>
              <Text style={[
                styles.amountValue,
                { color: budget.remaining >= 0 ? theme.colors.secondary : theme.colors.error }
              ]}>
                ${budget.remaining.toFixed(0)}
              </Text>
            </View>
          </View>
          
          <ProgressBar 
            progress={Math.min(utilization, 1)} 
            color={isOverBudget ? theme.colors.error : theme.colors.primary}
            style={styles.budgetProgress}
          />
          
          <View style={styles.budgetActions}>
            <Button mode="outlined" style={styles.budgetActionButton} compact>
              Edit
            </Button>
            <Button mode="outlined" style={styles.budgetActionButton} compact>
              View Details
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Food & Dining': 'restaurant',
      'Shopping': 'shopping-cart',
      'Transportation': 'directions-car',
      'Entertainment': 'movie',
      'Bills & Utilities': 'receipt',
      'Healthcare': 'local-hospital',
      'Travel': 'flight',
      'Education': 'school',
      'Personal Care': 'spa',
      'Gifts & Donations': 'card-giftcard',
    };
    return icons[category] || 'category';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Food & Dining': '#F59E0B',
      'Shopping': '#EC4899',
      'Transportation': '#3B82F6',
      'Entertainment': '#8B5CF6',
      'Bills & Utilities': '#EF4444',
      'Healthcare': '#10B981',
      'Travel': '#06B6D4',
      'Education': '#6366F1',
      'Personal Care': '#F97316',
      'Gifts & Donations': '#84CC16',
    };
    return colors[category] || theme.colors.outline;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="pie-chart" size={80} color={theme.colors.outline} />
      <Text style={styles.emptyTitle}>No Budgets Created</Text>
      <Text style={styles.emptyDescription}>
        Create budgets to track your spending and stay on top of your finances
      </Text>
      <Button 
        mode="contained" 
        style={styles.createBudgetButton}
        icon="add"
      >
        Create Budget
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
        {budgets && budgets.length > 0 ? (
          <>
            {renderBudgetSummary()}
            <View style={styles.budgetsList}>
              {budgets.map(renderBudgetCard)}
            </View>
          </>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
      
      <FAB
        icon="add"
        style={styles.fab}
        onPress={() => {/* Open budget creation flow */}}
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
  summaryCard: {
    marginBottom: theme.spacing.lg,
    elevation: 2,
  },
  summaryTitle: {
    ...theme.typography.titleLarge,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xs,
  },
  summaryValue: {
    ...theme.typography.titleLarge,
    fontWeight: 'bold',
  },
  utilizationSection: {
    gap: theme.spacing.sm,
  },
  utilizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  utilizationLabel: {
    ...theme.typography.bodyMedium,
    fontWeight: '500',
  },
  utilizationChip: {
    height: 28,
  },
  utilizationBar: {
    height: 8,
    borderRadius: 4,
  },
  budgetsList: {
    gap: theme.spacing.md,
  },
  budgetCard: {
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  budgetDetails: {
    marginLeft: theme.spacing.md,
  },
  budgetCategory: {
    ...theme.typography.titleMedium,
    marginBottom: theme.spacing.xs,
  },
  budgetPeriod: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
  },
  statusChip: {
    height: 28,
  },
  budgetAmounts: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
  },
  amountValue: {
    ...theme.typography.bodyMedium,
    fontWeight: '600',
  },
  budgetProgress: {
    height: 8,
    borderRadius: 4,
    marginBottom: theme.spacing.md,
  },
  budgetActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  budgetActionButton: {
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
  createBudgetButton: {
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

export default BudgetScreen;