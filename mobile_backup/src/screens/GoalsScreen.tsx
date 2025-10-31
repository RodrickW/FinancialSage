import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Modal, RefreshControl } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { apiService } from '@/services/api';

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  color: string;
}

interface SavingsTrackingData {
  monthlyStats: {
    current: number;
    monthName: string;
    nextMilestone?: number;
    progress?: number;
  };
  yearlyStats: {
    current: number;
    year: number;
    nextMilestone?: number;
    progress?: number;
  };
}

interface UserLevel {
  level: number;
  totalSavings: number;
  nextLevelAmount: number;
  progress: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  date?: string;
}

interface GoalsScreenProps {
  navigation: any;
}

export const GoalsScreen: React.FC<GoalsScreenProps> = ({ navigation }) => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    deadline: '',
    color: '#10b981'
  });

  const { data: goals, isLoading, refetch } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: () => apiService.getSavingsGoals(),
  });

  // For now, create mock tracking data until API endpoint is added
  const trackingData: SavingsTrackingData | undefined = {
    monthlyStats: {
      current: goals?.reduce((sum, goal) => sum + (goal.currentAmount || 0), 0) || 0,
      monthName: new Date().toLocaleDateString('en-US', { month: 'long' })
    },
    yearlyStats: {
      current: goals?.reduce((sum, goal) => sum + (goal.currentAmount || 0), 0) || 0,
      year: new Date().getFullYear()
    }
  };

  // Calculate user level based on total savings
  const calculateUserLevel = (totalSavings: number): UserLevel => {
    const level = Math.floor(totalSavings / 1000) + 1; // Every $1000 = 1 level
    const currentLevelProgress = totalSavings % 1000;
    const nextLevelAmount = level * 1000;
    const progress = (currentLevelProgress / 1000) * 100;
    
    return {
      level,
      totalSavings,
      nextLevelAmount,
      progress
    };
  };

  // Get user achievements
  const getAchievements = (): Achievement[] => {
    const totalSavings = trackingData ? (trackingData.monthlyStats.current + trackingData.yearlyStats.current) : 0;
    const goalCount = goals?.length || 0;
    
    return [
      {
        id: 'goal_setter',
        name: 'Goal Setter',
        description: 'Created your first savings goal',
        icon: '🎯',
        unlocked: goalCount > 0
      },
      {
        id: 'first_hundred',
        name: 'Saver',
        description: 'Saved your first $100',
        icon: '💰',
        unlocked: totalSavings >= 100
      },
      {
        id: 'milestone_master',
        name: 'Milestone Master',
        description: 'Reached $1,000 in savings',
        icon: '🏆',
        unlocked: totalSavings >= 1000
      },
      {
        id: 'savings_champion',
        name: 'Savings Champion',
        description: 'Achieved $5,000 in total savings',
        icon: '👑',
        unlocked: totalSavings >= 5000
      }
    ];
  };

  const totalSavings = trackingData ? (trackingData.monthlyStats.current + trackingData.yearlyStats.current) : 0;
  const userLevel = calculateUserLevel(totalSavings);
  const achievements = getAchievements();

  const colors = [
    { value: '#10b981', name: 'Green' },
    { value: '#3b82f6', name: 'Blue' },
    { value: '#8b5cf6', name: 'Purple' },
    { value: '#ef4444', name: 'Red' },
    { value: '#f59e0b', name: 'Orange' },
  ];

  const handleCreateGoal = async () => {
    if (!newGoal.name || !newGoal.targetAmount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      // In a real app, you would call the API to create the goal
      Alert.alert('Success', 'Goal created successfully!');
      setShowModal(false);
      setNewGoal({ name: '', targetAmount: '', deadline: '', color: '#10b981' });
      await refetch();
    } catch (error) {
      Alert.alert('Error', 'Failed to create goal. Please try again.');
    }
  };

  const handleDeleteGoal = (goalId: string, goalName: string) => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goalName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              // In a real app, you would call the API to delete the goal
              Alert.alert('Success', 'Goal deleted successfully!');
              await refetch();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete goal. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Savings Goals</Text>
        
        {/* User Level Display */}
        <View style={styles.levelContainer}>
          <View style={styles.levelHeader}>
            <Text style={styles.levelTitle}>🎮 Level {userLevel.level} Saver</Text>
            <Text style={styles.totalSavingsText}>${totalSavings.toFixed(2)} Total Saved</Text>
          </View>
          <View style={styles.xpContainer}>
            <View style={styles.xpBar}>
              <View style={[styles.xpFill, { width: `${userLevel.progress}%` }]} />
            </View>
            <Text style={styles.xpText}>{Math.floor(userLevel.progress)}% to Level {userLevel.level + 1}</Text>
          </View>
        </View>

        {/* Achievement Badges */}
        <View style={styles.achievementsContainer}>
          <Text style={styles.achievementsTitle}>🏆 Achievements</Text>
          <View style={styles.badgesContainer}>
            {achievements.map((achievement) => (
              <View 
                key={achievement.id} 
                style={[
                  styles.badge,
                  achievement.unlocked ? styles.badgeUnlocked : styles.badgeLocked
                ]}
              >
                <Text style={styles.badgeIcon}>{achievement.icon}</Text>
                <Text style={styles.badgeName}>{achievement.name}</Text>
              </View>
            ))}
          </View>
        </View>
        
        <Button
          title="Create New Goal"
          onPress={() => setShowModal(true)}
          style={styles.createButton}
        />
      </View>

      {/* Gamified Savings Tracking Summary */}
      {trackingData && (
        <View style={styles.trackingContainer}>
          <View style={styles.gamifiedCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <Text style={styles.iconText}>🐷</Text>
              </View>
              <Text style={styles.cardTitle}>{trackingData.monthlyStats.monthName} Progress</Text>
            </View>
            <Text style={styles.gamifiedAmount}>${trackingData.monthlyStats.current.toFixed(2)}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardSubtext}>📈 Monthly savings streak!</Text>
            </View>
          </View>
          
          <View style={styles.gamifiedCardBlue}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconBlue}>
                <Text style={styles.iconText}>🏆</Text>
              </View>
              <Text style={styles.cardTitleBlue}>{trackingData.yearlyStats.year} Champion</Text>
            </View>
            <Text style={styles.gamifiedAmountBlue}>${trackingData.yearlyStats.current.toFixed(2)}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardSubtextBlue}>⚡ Year-to-date mastery!</Text>
            </View>
          </View>
        </View>
      )}

      {goals?.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Savings Goals</Text>
          <Text style={styles.emptyText}>
            Create your first savings goal to start building your financial future.
          </Text>
          <Button
            title="Create Your First Goal"
            onPress={() => setShowModal(true)}
            style={styles.emptyButton}
          />
        </Card>
      ) : (
        goals?.map((goal: Goal) => (
          <Card key={goal.id} style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalName}>{goal.name}</Text>
              <Button
                title="Delete"
                onPress={() => handleDeleteGoal(goal.id, goal.name)}
                variant="danger"
                size="sm"
              />
            </View>

            <View style={styles.goalAmount}>
              <Text style={styles.currentAmount}>
                ${goal.currentAmount?.toFixed(2) || '0.00'}
              </Text>
              <Text style={styles.targetAmount}>
                / ${goal.targetAmount?.toFixed(2) || '0.00'}
              </Text>
            </View>

            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${getProgressPercentage(goal.currentAmount || 0, goal.targetAmount || 0)}%`,
                    backgroundColor: goal.color || '#10b981'
                  }
                ]}
              />
            </View>

            <View style={styles.goalFooter}>
              <Text style={styles.progressText}>
                {getProgressPercentage(goal.currentAmount || 0, goal.targetAmount || 0).toFixed(1)}% complete
              </Text>
              {goal.deadline && (
                <Text style={styles.deadline}>
                  Due: {new Date(goal.deadline).toLocaleDateString()}
                </Text>
              )}
            </View>
          </Card>
        ))
      )}

      {/* Create Goal Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Goal</Text>
            <Button
              title="Cancel"
              onPress={() => setShowModal(false)}
              variant="secondary"
              size="sm"
            />
          </View>

          <ScrollView style={styles.modalContent}>
            <Input
              label="Goal Name"
              value={newGoal.name}
              onChangeText={(text) => setNewGoal({...newGoal, name: text})}
              placeholder="e.g., Emergency Fund"
              required
            />

            <Input
              label="Target Amount"
              value={newGoal.targetAmount}
              onChangeText={(text) => setNewGoal({...newGoal, targetAmount: text})}
              placeholder="1000"
              keyboardType="numeric"
              required
            />

            <Input
              label="Deadline (Optional)"
              value={newGoal.deadline}
              onChangeText={(text) => setNewGoal({...newGoal, deadline: text})}
              placeholder="YYYY-MM-DD"
            />

            <Text style={styles.colorLabel}>Color</Text>
            <View style={styles.colorOptions}>
              {colors.map((color) => (
                <Button
                  key={color.value}
                  title={color.name}
                  onPress={() => setNewGoal({...newGoal, color: color.value})}
                  variant={newGoal.color === color.value ? 'primary' : 'secondary'}
                  size="sm"
                  style={[styles.colorButton]}
                />
              ))}
            </View>

            <Button
              title="Create Goal"
              onPress={handleCreateGoal}
              style={styles.createGoalButton}
            />
          </ScrollView>
        </View>
      </Modal>
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
  createButton: {
    marginBottom: 16,
  },
  levelContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
  },
  totalSavingsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  xpContainer: {
    alignItems: 'center',
  },
  xpBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  xpText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  achievementsContainer: {
    marginBottom: 16,
  },
  achievementsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 8,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    minWidth: 60,
    borderWidth: 2,
  },
  badgeUnlocked: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  badgeLocked: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    opacity: 0.6,
  },
  badgeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    color: '#334155',
  },
  trackingContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  gamifiedCard: {
    flex: 1,
    backgroundColor: '#dcfce7',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: '#bbf7d0',
    position: 'relative',
    overflow: 'hidden',
  },
  gamifiedCardBlue: {
    flex: 1,
    backgroundColor: '#dbeafe',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: '#bfdbfe',
    position: 'relative',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#bbf7d0',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  cardIconBlue: {
    width: 32,
    height: 32,
    backgroundColor: '#bfdbfe',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  iconText: {
    fontSize: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#166534',
    flex: 1,
  },
  cardTitleBlue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    flex: 1,
  },
  gamifiedAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#14532d',
    marginBottom: 8,
  },
  gamifiedAmountBlue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16803b',
  },
  cardSubtextBlue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1d4ed8',
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
  goalCard: {
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  goalAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  targetAmount: {
    fontSize: 18,
    color: '#6b7280',
    marginLeft: 4,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
  },
  deadline: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  colorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  colorButton: {
    minWidth: 60,
  },
  createGoalButton: {
    marginTop: 20,
    marginBottom: 40,
  },
});