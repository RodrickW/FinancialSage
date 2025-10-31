import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { apiRequest } from '../../services/api';

interface SavingsGoal {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  description: string;
}

const GoalsScreen: React.FC = () => {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGoals = async () => {
    try {
      const response = await apiRequest('GET', '/api/savings-goals');
      if (response.ok) {
        const data = await response.json();
        setGoals(data);
      }
    } catch (error) {
      console.error('Goals fetch error:', error);
      Alert.alert('Error', 'Failed to load goals');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchGoals();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProgressPercentage = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const formatDeadline = (deadlineStr: string) => {
    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return '1 day left';
    if (diffDays < 30) return `${diffDays} days left`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months left`;
    return `${Math.floor(diffDays / 365)} years left`;
  };

  const getGoalIcon = (name: string) => {
    const lowercaseName = name.toLowerCase();
    if (lowercaseName.includes('vacation') || lowercaseName.includes('travel')) return 'flight';
    if (lowercaseName.includes('car') || lowercaseName.includes('vehicle')) return 'directions-car';
    if (lowercaseName.includes('house') || lowercaseName.includes('home')) return 'home';
    if (lowercaseName.includes('emergency')) return 'shield';
    if (lowercaseName.includes('education') || lowercaseName.includes('college')) return 'school';
    if (lowercaseName.includes('retirement')) return 'trending-up';
    return 'flag';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#1877F2', '#0D5DBF']}
          style={styles.loadingGradient}
        >
          <Icon name="flag" size={64} color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading your goals...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1877F2', '#0D5DBF']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Savings Goals</Text>
        <Text style={styles.headerSubtitle}>Track your financial milestones</Text>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1877F2" />
        }
      >
        {goals.length > 0 ? (
          <View style={styles.section}>
            {goals.map((goal) => {
              const progress = getProgressPercentage(goal.currentAmount, goal.targetAmount);
              const isComplete = progress >= 100;

              return (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalIconContainer}>
                      <Icon name={getGoalIcon(goal.name)} size={24} color="#1877F2" />
                    </View>
                    <View style={styles.goalHeaderText}>
                      <Text style={styles.goalName}>{goal.name}</Text>
                      <Text style={styles.goalDeadline}>{formatDeadline(goal.deadline)}</Text>
                    </View>
                    {isComplete && (
                      <View style={styles.completeBadge}>
                        <Icon name="check-circle" size={24} color="#10B981" />
                      </View>
                    )}
                  </View>

                  {goal.description && (
                    <Text style={styles.goalDescription}>{goal.description}</Text>
                  )}

                  <View style={styles.amountRow}>
                    <View>
                      <Text style={styles.amountLabel}>Current</Text>
                      <Text style={styles.currentAmount}>
                        {formatCurrency(goal.currentAmount)}
                      </Text>
                    </View>
                    <View style={styles.separator} />
                    <View>
                      <Text style={styles.amountLabel}>Goal</Text>
                      <Text style={styles.targetAmount}>
                        {formatCurrency(goal.targetAmount)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.progressSection}>
                    <View style={styles.progressLabelRow}>
                      <Text style={styles.progressLabel}>Progress</Text>
                      <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
                    </View>
                    <View style={styles.progressBar}>
                      <LinearGradient
                        colors={isComplete ? ['#10B981', '#22C55E'] : ['#1877F2', '#60A5FA']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressFill, { width: `${progress}%` }]}
                      />
                    </View>
                    <Text style={styles.remainingAmount}>
                      {isComplete
                        ? 'Goal achieved! 🎉'
                        : `${formatCurrency(goal.targetAmount - goal.currentAmount)} to go`}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="flag" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Goals Yet</Text>
            <Text style={styles.emptyText}>
              Set savings goals and track your progress toward financial milestones
            </Text>
            <Text style={styles.emptyHint}>
              Create your first goal on the web app to get started
            </Text>
          </View>
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
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalHeaderText: {
    flex: 1,
  },
  goalName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  goalDeadline: {
    fontSize: 13,
    color: '#64748B',
  },
  completeBadge: {
    marginLeft: 8,
  },
  goalDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  separator: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 4,
    textAlign: 'center',
  },
  currentAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1877F2',
    textAlign: 'center',
  },
  targetAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  progressSection: {
    marginTop: 4,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  progressPercentage: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1877F2',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  remainingAmount: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
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
    marginBottom: 16,
  },
  emptyHint: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default GoalsScreen;
