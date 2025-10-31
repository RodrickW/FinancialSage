import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { apiService } from '@/services/api';

interface BudgetScreenProps {
  navigation: any;
}

export const BudgetScreen: React.FC<BudgetScreenProps> = ({ navigation }) => {
  const { data: budgetData, isLoading, refetch } = useQuery({
    queryKey: ['budget'],
    queryFn: () => apiService.getBudget(),
  });

  const categories = budgetData?.categories || [];
  const totalPlanned = categories.reduce((sum: number, cat: any) => sum + (cat.planned || 0), 0);
  const totalSpent = categories.reduce((sum: number, cat: any) => sum + (cat.spent || 0), 0);
  const totalRemaining = totalPlanned - totalSpent;

  const getProgressColor = (spent: number, planned: number) => {
    if (planned === 0) return '#6b7280';
    const percentage = (spent / planned) * 100;
    if (percentage >= 100) return '#ef4444';
    if (percentage >= 80) return '#f59e0b';
    return '#10b981';
  };

  const getProgressWidth = (spent: number, planned: number) => {
    if (planned === 0) return '0%';
    return `${Math.min((spent / planned) * 100, 100)}%`;
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Budget Overview</Text>
      </View>

      {/* Budget Summary */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Planned</Text>
            <Text style={styles.summaryAmount}>${totalPlanned.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Spent</Text>
            <Text style={[styles.summaryAmount, { color: '#ef4444' }]}>
              ${totalSpent.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Remaining</Text>
            <Text style={[
              styles.summaryAmount,
              { color: totalRemaining >= 0 ? '#10b981' : '#ef4444' }
            ]}>
              ${totalRemaining.toFixed(2)}
            </Text>
          </View>
        </View>
        
        <View style={styles.overallProgress}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: getProgressWidth(totalSpent, totalPlanned),
                  backgroundColor: getProgressColor(totalSpent, totalPlanned)
                }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {totalPlanned > 0 ? `${((totalSpent / totalPlanned) * 100).toFixed(1)}%` : '0%'} of budget used
          </Text>
        </View>
      </Card>

      {/* Categories */}
      {categories.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Budget Data</Text>
          <Text style={styles.emptyText}>
            Connect your bank account and let our AI create a personalized budget for you.
          </Text>
          <Button
            title="Connect Account"
            onPress={() => navigation.navigate('Accounts')}
            style={styles.emptyButton}
          />
        </Card>
      ) : (
        <Card>
          <Text style={styles.sectionTitle}>Budget Categories</Text>
          {categories.map((category: any, index: number) => (
            <View key={index} style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <View style={styles.categoryAmounts}>
                  <Text style={styles.spentAmount}>
                    ${category.spent?.toFixed(2) || '0.00'}
                  </Text>
                  <Text style={styles.plannedAmount}>
                    / ${category.planned?.toFixed(2) || '0.00'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: getProgressWidth(category.spent || 0, category.planned || 0),
                      backgroundColor: getProgressColor(category.spent || 0, category.planned || 0)
                    }
                  ]}
                />
              </View>
              
              <Text style={styles.remainingAmount}>
                ${((category.planned || 0) - (category.spent || 0)).toFixed(2)} remaining
              </Text>
            </View>
          ))}
        </Card>
      )}

      {/* AI Coach Recommendations */}
      {budgetData?.recommendations && (
        <Card style={styles.recommendationsCard}>
          <Text style={styles.sectionTitle}>AI Coach Recommendations</Text>
          <Text style={styles.recommendationText}>
            {budgetData.recommendations}
          </Text>
          <Button
            title="Get More Advice"
            onPress={() => navigation.navigate('Coach')}
            variant="secondary"
            style={styles.coachButton}
          />
        </Card>
      )}
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
  },
  summaryCard: {
    backgroundColor: '#10b981',
    padding: 20,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  overallProgress: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  categoryItem: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  categoryAmounts: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  plannedAmount: {
    fontSize: 16,
    color: '#6b7280',
  },
  remainingAmount: {
    fontSize: 14,
    color: '#3b82f6',
    marginTop: 4,
  },
  recommendationsCard: {
    backgroundColor: '#f0f9ff',
    borderColor: '#3b82f6',
    borderWidth: 1,
    marginTop: 20,
    marginBottom: 40,
  },
  recommendationText: {
    fontSize: 16,
    color: '#1e40af',
    lineHeight: 24,
    marginBottom: 16,
  },
  coachButton: {
    alignSelf: 'flex-start',
  },
});