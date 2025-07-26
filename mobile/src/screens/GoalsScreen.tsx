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

  // Fetch savings tracking data
  const { data: trackingData } = useQuery<SavingsTrackingData>({
    queryKey: ['savingsTracker'],
    queryFn: () => apiService.getSavingsTracker(),
  });

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
        <Button
          title="Create New Goal"
          onPress={() => setShowModal(true)}
          style={styles.createButton}
        />
      </View>

      {/* Savings Tracking Summary */}
      {trackingData && (
        <View style={styles.trackingContainer}>
          <Card style={[styles.trackingCard, styles.monthlyCard]}>
            <Text style={styles.trackingLabel}>This Month ({trackingData.monthlyStats.monthName})</Text>
            <Text style={styles.trackingAmount}>${trackingData.monthlyStats.current.toFixed(2)}</Text>
            {trackingData.monthlyStats.nextMilestone && (
              <Text style={styles.milestoneText}>
                Next milestone: ${trackingData.monthlyStats.nextMilestone}
              </Text>
            )}
          </Card>
          
          <Card style={[styles.trackingCard, styles.yearlyCard]}>
            <Text style={styles.trackingLabel}>Year-to-Date ({trackingData.yearlyStats.year})</Text>
            <Text style={styles.trackingAmount}>${trackingData.yearlyStats.current.toFixed(2)}</Text>
            {trackingData.yearlyStats.nextMilestone && (
              <Text style={styles.milestoneText}>
                Next milestone: ${trackingData.yearlyStats.nextMilestone}
              </Text>
            )}
          </Card>
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
                  style={[styles.colorButton, { backgroundColor: color.value }]}
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
  trackingContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  trackingCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  monthlyCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  yearlyCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  trackingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  trackingAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  milestoneText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
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