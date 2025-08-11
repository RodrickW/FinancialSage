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

interface Goal {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  isCompleted: boolean;
}

const GoalsScreen: React.FC = () => {
  const { data: goals, isLoading, refetch } = useQuery({
    queryKey: ['goals'],
    queryFn: () => apiRequest('GET', '/api/goals'),
  });

  const renderGoalCard = (goal: Goal) => {
    const progress = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;
    const progressPercentage = Math.round(progress * 100);
    const remainingAmount = goal.targetAmount - goal.currentAmount;
    const daysRemaining = Math.ceil(
      (new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return (
      <Card key={goal.id} style={styles.goalCard}>
        <Card.Content>
          <View style={styles.goalHeader}>
            <View style={styles.goalInfo}>
              <Icon 
                name={getGoalIcon(goal.category)} 
                size={24} 
                color={getGoalColor(goal.category)} 
              />
              <View style={styles.goalDetails}>
                <Text style={styles.goalName}>{goal.name}</Text>
                <Text style={styles.goalDescription}>{goal.description}</Text>
              </View>
            </View>
            {goal.isCompleted && (
              <Chip 
                mode="flat" 
                style={styles.completedChip}
                textStyle={{ color: theme.colors.secondary }}
                icon="check-circle"
              >
                Completed
              </Chip>
            )}
          </View>
          
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
            </View>
            <ProgressBar 
              progress={Math.min(progress, 1)} 
              color={goal.isCompleted ? theme.colors.secondary : theme.colors.primary}
              style={styles.progressBar}
            />
          </View>
          
          <View style={styles.amountsSection}>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Current</Text>
              <Text style={styles.amountValue}>
                ${goal.currentAmount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Target</Text>
              <Text style={styles.amountValue}>
                ${goal.targetAmount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Remaining</Text>
              <Text style={[
                styles.amountValue,
                { color: remainingAmount <= 0 ? theme.colors.secondary : theme.colors.error }
              ]}>
                ${Math.max(remainingAmount, 0).toLocaleString()}
              </Text>
            </View>
          </View>
          
          <View style={styles.goalMeta}>
            <View style={styles.metaItem}>
              <Icon name="calendar-today" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.metaText}>
                Target: {new Date(goal.targetDate).toLocaleDateString()}
              </Text>
            </View>
            {!goal.isCompleted && (
              <View style={styles.metaItem}>
                <Icon name="schedule" size={16} color={theme.colors.onSurfaceVariant} />
                <Text style={[
                  styles.metaText,
                  { color: daysRemaining < 30 ? theme.colors.error : theme.colors.onSurfaceVariant }
                ]}>
                  {daysRemaining > 0 ? `${daysRemaining} days left` : 'Overdue'}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.goalActions}>
            <Button mode="outlined" style={styles.goalActionButton} compact>
              Add Money
            </Button>
            <Button mode="outlined" style={styles.goalActionButton} compact>
              Edit Goal
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const getGoalIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Emergency Fund': 'security',
      'Vacation': 'flight',
      'Home': 'home',
      'Car': 'directions-car',
      'Education': 'school',
      'Retirement': 'account-balance',
      'Investment': 'trending-up',
      'Debt Payoff': 'money-off',
      'Wedding': 'favorite',
      'Other': 'flag',
    };
    return icons[category] || 'flag';
  };

  const getGoalColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Emergency Fund': '#EF4444',
      'Vacation': '#06B6D4',
      'Home': '#10B981',
      'Car': '#3B82F6',
      'Education': '#6366F1',
      'Retirement': '#8B5CF6',
      'Investment': '#F59E0B',
      'Debt Payoff': '#EC4899',
      'Wedding': '#F97316',
      'Other': '#84CC16',
    };
    return colors[category] || theme.colors.outline;
  };

  const renderGoalsSummary = () => {
    if (!goals || goals.length === 0) return null;
    
    const totalTargetAmount = goals.reduce((sum: number, goal: Goal) => sum + goal.targetAmount, 0);
    const totalCurrentAmount = goals.reduce((sum: number, goal: Goal) => sum + goal.currentAmount, 0);
    const completedGoals = goals.filter((goal: Goal) => goal.isCompleted).length;
    const overallProgress = totalTargetAmount > 0 ? totalCurrentAmount / totalTargetAmount : 0;
    
    return (
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Text style={styles.summaryTitle}>Goals Summary</Text>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Target</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
                ${totalTargetAmount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Saved</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.secondary }]}>
                ${totalCurrentAmount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Completed</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.tertiary }]}>
                {completedGoals} / {goals.length}
              </Text>
            </View>
          </View>
          
          <View style={styles.overallProgress}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Overall Progress</Text>
              <Text style={styles.progressPercentage}>
                {Math.round(overallProgress * 100)}%
              </Text>
            </View>
            <ProgressBar 
              progress={overallProgress} 
              color={theme.colors.primary}
              style={styles.progressBar}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="flag" size={80} color={theme.colors.outline} />
      <Text style={styles.emptyTitle}>No Savings Goals</Text>
      <Text style={styles.emptyDescription}>
        Set financial goals and track your progress towards achieving them
      </Text>
      <Button 
        mode="contained" 
        style={styles.createGoalButton}
        icon="add"
      >
        Create Goal
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
        {goals && goals.length > 0 ? (
          <>
            {renderGoalsSummary()}
            <View style={styles.goalsList}>
              {goals.map(renderGoalCard)}
            </View>
          </>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
      
      <FAB
        icon="add"
        style={styles.fab}
        onPress={() => {/* Open goal creation flow */}}
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
  overallProgress: {
    gap: theme.spacing.sm,
  },
  goalsList: {
    gap: theme.spacing.md,
  },
  goalCard: {
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  goalInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  goalDetails: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  goalName: {
    ...theme.typography.titleMedium,
    marginBottom: theme.spacing.xs,
  },
  goalDescription: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
  },
  completedChip: {
    backgroundColor: '#ECFDF5',
    height: 28,
  },
  progressSection: {
    marginBottom: theme.spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  progressLabel: {
    ...theme.typography.bodyMedium,
    fontWeight: '500',
  },
  progressPercentage: {
    ...theme.typography.bodyMedium,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  amountsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  amountItem: {
    alignItems: 'center',
    flex: 1,
  },
  amountLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xs,
  },
  amountValue: {
    ...theme.typography.bodyMedium,
    fontWeight: '600',
  },
  goalMeta: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    marginLeft: theme.spacing.xs,
  },
  goalActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  goalActionButton: {
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
  createGoalButton: {
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

export default GoalsScreen;