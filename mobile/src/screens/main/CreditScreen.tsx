import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  TextInput,
  ProgressBar,
  Chip,
  Surface,
  IconButton,
  Divider,
} from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../../theme/theme';
import { apiRequest } from '../../services/api';

const { width } = Dimensions.get('window');

interface CreditAssessment {
  id: string;
  currentScore: number;
  goalScore: number;
  paymentHistory: string;
  creditUtilization: number;
  creditHistoryLength: number;
  creditMix: string;
  newCreditInquiries: number;
  improvementPlan: {
    priority: string;
    timeframe: string;
    recommendations: string[];
    actionItems: Array<{
      month: number;
      actions: string[];
    }>;
    warnings?: string[];
  };
  createdAt: string;
}

const CreditScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'assessment' | 'factors' | 'plan' | 'tracking'>('assessment');
  const [formData, setFormData] = useState({
    currentScore: '',
    goalScore: '',
    paymentHistory: '',
    creditUtilization: '',
    creditHistoryLength: '',
    creditMix: '',
    newCreditInquiries: '',
  });

  const queryClient = useQueryClient();

  // Fetch existing credit assessment
  const { data: creditAssessment, isLoading } = useQuery({
    queryKey: ['creditAssessment'],
    queryFn: () => apiRequest('GET', '/api/credit/assessment'),
  });

  // Create new assessment mutation
  const createAssessmentMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/credit/assessment', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditAssessment'] });
      setActiveTab('factors');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create assessment');
    },
  });

  useEffect(() => {
    if (creditAssessment) {
      setActiveTab('factors');
    }
  }, [creditAssessment]);

  const handleSubmitAssessment = () => {
    const numericData = {
      currentScore: parseInt(formData.currentScore),
      goalScore: parseInt(formData.goalScore),
      paymentHistory: formData.paymentHistory,
      creditUtilization: parseFloat(formData.creditUtilization),
      creditHistoryLength: parseInt(formData.creditHistoryLength),
      creditMix: formData.creditMix,
      newCreditInquiries: parseInt(formData.newCreditInquiries),
    };

    createAssessmentMutation.mutate(numericData);
  };

  const resetAssessment = () => {
    setFormData({
      currentScore: '',
      goalScore: '',
      paymentHistory: '',
      creditUtilization: '',
      creditHistoryLength: '',
      creditMix: '',
      newCreditInquiries: '',
    });
    setActiveTab('assessment');
  };

  const getCreditScoreColor = (score: number): string => {
    if (score >= 800) return '#10B981'; // Excellent - Green
    if (score >= 740) return '#3B82F6'; // Very Good - Blue
    if (score >= 670) return '#F59E0B'; // Good - Amber
    if (score >= 580) return '#F97316'; // Fair - Orange
    return '#EF4444'; // Poor - Red
  };

  const getCreditScoreLabel = (score: number): string => {
    if (score >= 800) return 'Excellent';
    if (score >= 740) return 'Very Good';
    if (score >= 670) return 'Good';
    if (score >= 580) return 'Fair';
    return 'Poor';
  };

  const getUtilizationColor = (utilization: number): string => {
    if (utilization <= 10) return '#10B981'; // Excellent
    if (utilization <= 30) return '#3B82F6'; // Good
    if (utilization <= 50) return '#F59E0B'; // Fair
    return '#EF4444'; // Poor
  };

  const renderAssessmentForm = () => (
    <ScrollView style={styles.tabContent}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Credit Score Assessment</Text>
          <Text style={styles.cardDescription}>
            Tell us about your current credit situation to get personalized improvement recommendations
          </Text>
          
          <View style={styles.formField}>
            <Text style={styles.label}>Current Credit Score *</Text>
            <TextInput
              mode="outlined"
              value={formData.currentScore}
              onChangeText={(value) => setFormData({ ...formData, currentScore: value })}
              placeholder="e.g., 650"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Goal Credit Score *</Text>
            <TextInput
              mode="outlined"
              value={formData.goalScore}
              onChangeText={(value) => setFormData({ ...formData, goalScore: value })}
              placeholder="e.g., 750"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Payment History *</Text>
            <Picker
              selectedValue={formData.paymentHistory}
              onValueChange={(value) => setFormData({ ...formData, paymentHistory: value })}
              style={styles.picker}
            >
              <Picker.Item label="Select payment history" value="" />
              <Picker.Item label="Excellent (No missed payments)" value="excellent" />
              <Picker.Item label="Good (1-2 late payments)" value="good" />
              <Picker.Item label="Fair (3-5 late payments)" value="fair" />
              <Picker.Item label="Poor (6+ late payments or defaults)" value="poor" />
            </Picker>
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Credit Utilization % *</Text>
            <TextInput
              mode="outlined"
              value={formData.creditUtilization}
              onChangeText={(value) => setFormData({ ...formData, creditUtilization: value })}
              placeholder="e.g., 25"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Credit History Length (months) *</Text>
            <TextInput
              mode="outlined"
              value={formData.creditHistoryLength}
              onChangeText={(value) => setFormData({ ...formData, creditHistoryLength: value })}
              placeholder="e.g., 60"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Credit Mix *</Text>
            <Picker
              selectedValue={formData.creditMix}
              onValueChange={(value) => setFormData({ ...formData, creditMix: value })}
              style={styles.picker}
            >
              <Picker.Item label="Select credit mix" value="" />
              <Picker.Item label="Excellent (Multiple types)" value="excellent" />
              <Picker.Item label="Good (Few types)" value="good" />
              <Picker.Item label="Limited (One type only)" value="limited" />
            </Picker>
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>New Credit Inquiries (last 12 months) *</Text>
            <TextInput
              mode="outlined"
              value={formData.newCreditInquiries}
              onChangeText={(value) => setFormData({ ...formData, newCreditInquiries: value })}
              placeholder="e.g., 2"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          <Button
            mode="contained"
            onPress={handleSubmitAssessment}
            loading={createAssessmentMutation.isPending}
            disabled={!formData.currentScore || !formData.goalScore}
            style={styles.submitButton}
          >
            Get AI Credit Analysis
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const renderCreditFactors = () => (
    <ScrollView style={styles.tabContent}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Credit Score Factors</Text>
          <Text style={styles.cardDescription}>
            Understanding the 5 factors that determine your FICO score
          </Text>
        </Card.Content>
      </Card>

      {/* Payment History - 35% */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.factorHeader}>
            <Text style={styles.factorTitle}>Payment History</Text>
            <Chip mode="flat" style={[styles.percentageChip, { backgroundColor: '#FEE2E2' }]}>
              35%
            </Chip>
          </View>
          <ProgressBar progress={0.35} color="#EF4444" style={styles.progressBar} />
          <Text style={styles.factorDescription}>
            Your track record of making payments on time. This is the most important factor.
          </Text>
          {creditAssessment && (
            <View style={styles.currentStatus}>
              <Text style={styles.statusLabel}>Your Status:</Text>
              <Text style={[styles.statusValue, { color: creditAssessment.paymentHistory === 'excellent' ? '#10B981' : '#F59E0B' }]}>
                {creditAssessment.paymentHistory.charAt(0).toUpperCase() + creditAssessment.paymentHistory.slice(1)}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Credit Utilization - 30% */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.factorHeader}>
            <Text style={styles.factorTitle}>Credit Utilization</Text>
            <Chip mode="flat" style={[styles.percentageChip, { backgroundColor: '#DBEAFE' }]}>
              30%
            </Chip>
          </View>
          <ProgressBar progress={0.30} color="#3B82F6" style={styles.progressBar} />
          <Text style={styles.factorDescription}>
            How much of your available credit you're using. Keep it under 30%, ideally under 10%.
          </Text>
          {creditAssessment && (
            <View style={styles.currentStatus}>
              <Text style={styles.statusLabel}>Your Status:</Text>
              <Text style={[styles.statusValue, { color: getUtilizationColor(creditAssessment.creditUtilization) }]}>
                {creditAssessment.creditUtilization}%
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Credit History Length - 15% */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.factorHeader}>
            <Text style={styles.factorTitle}>Credit History Length</Text>
            <Chip mode="flat" style={[styles.percentageChip, { backgroundColor: '#F3E8FF' }]}>
              15%
            </Chip>
          </View>
          <ProgressBar progress={0.15} color="#8B5CF6" style={styles.progressBar} />
          <Text style={styles.factorDescription}>
            How long you've had credit accounts. Longer credit history is better.
          </Text>
          {creditAssessment && (
            <View style={styles.currentStatus}>
              <Text style={styles.statusLabel}>Your Status:</Text>
              <Text style={styles.statusValue}>
                {Math.floor(creditAssessment.creditHistoryLength / 12)} years, {creditAssessment.creditHistoryLength % 12} months
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Credit Mix - 10% */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.factorHeader}>
            <Text style={styles.factorTitle}>Credit Mix</Text>
            <Chip mode="flat" style={[styles.percentageChip, { backgroundColor: '#FEF3C7' }]}>
              10%
            </Chip>
          </View>
          <ProgressBar progress={0.10} color="#F59E0B" style={styles.progressBar} />
          <Text style={styles.factorDescription}>
            The variety of credit accounts you have (credit cards, auto loans, mortgages, etc.).
          </Text>
          {creditAssessment && (
            <View style={styles.currentStatus}>
              <Text style={styles.statusLabel}>Your Status:</Text>
              <Text style={styles.statusValue}>
                {creditAssessment.creditMix.charAt(0).toUpperCase() + creditAssessment.creditMix.slice(1)}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* New Credit Inquiries - 10% */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.factorHeader}>
            <Text style={styles.factorTitle}>New Credit Inquiries</Text>
            <Chip mode="flat" style={[styles.percentageChip, { backgroundColor: '#ECFDF5' }]}>
              10%
            </Chip>
          </View>
          <ProgressBar progress={0.10} color="#10B981" style={styles.progressBar} />
          <Text style={styles.factorDescription}>
            Recent applications for new credit. Too many inquiries can lower your score.
          </Text>
          {creditAssessment && (
            <View style={styles.currentStatus}>
              <Text style={styles.statusLabel}>Your Status:</Text>
              <Text style={[styles.statusValue, { color: creditAssessment.newCreditInquiries <= 2 ? '#10B981' : '#EF4444' }]}>
                {creditAssessment.newCreditInquiries} inquiries
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const renderActionPlan = () => (
    <ScrollView style={styles.tabContent}>
      {creditAssessment?.improvementPlan && (
        <>
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>AI-Generated Improvement Plan</Text>
              <View style={styles.planHeader}>
                <Chip mode="flat" style={styles.priorityChip}>
                  {creditAssessment.improvementPlan.priority} Priority
                </Chip>
                <Text style={styles.timeframe}>
                  Timeframe: {creditAssessment.improvementPlan.timeframe}
                </Text>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Recommendations</Text>
              {creditAssessment.improvementPlan.recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <Icon name="check-circle" size={20} color="#10B981" />
                  <Text style={styles.recommendationText}>{rec}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Monthly Action Plan</Text>
              {creditAssessment.improvementPlan.actionItems.map((item, index) => (
                <View key={index} style={styles.monthlyItem}>
                  <Text style={styles.monthLabel}>Month {item.month}</Text>
                  {item.actions.map((action, actionIndex) => (
                    <View key={actionIndex} style={styles.actionItem}>
                      <Icon name="arrow-forward" size={16} color="#3B82F6" />
                      <Text style={styles.actionText}>{action}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </Card.Content>
          </Card>

          {creditAssessment.improvementPlan.warnings && (
            <Card style={[styles.card, styles.warningCard]}>
              <Card.Content>
                <Text style={styles.warningTitle}>Important Warnings</Text>
                {creditAssessment.improvementPlan.warnings.map((warning, index) => (
                  <View key={index} style={styles.warningItem}>
                    <Icon name="warning" size={20} color="#F59E0B" />
                    <Text style={styles.warningText}>{warning}</Text>
                  </View>
                ))}
              </Card.Content>
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );

  const renderProgressTracking = () => (
    <ScrollView style={styles.tabContent}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Progress Tracking</Text>
          <Text style={styles.cardDescription}>
            Monitor your credit improvement journey
          </Text>
        </Card.Content>
      </Card>

      {creditAssessment && (
        <>
          {/* Progress Summary */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Current Progress</Text>
              <View style={styles.progressSummary}>
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreLabel}>Current Score</Text>
                  <Text style={[styles.scoreValue, { color: getCreditScoreColor(creditAssessment.currentScore) }]}>
                    {creditAssessment.currentScore}
                  </Text>
                  <Text style={styles.scoreCategory}>
                    {getCreditScoreLabel(creditAssessment.currentScore)}
                  </Text>
                </View>
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreLabel}>Goal Score</Text>
                  <Text style={[styles.scoreValue, { color: getCreditScoreColor(creditAssessment.goalScore) }]}>
                    {creditAssessment.goalScore}
                  </Text>
                  <Text style={styles.scoreCategory}>
                    {getCreditScoreLabel(creditAssessment.goalScore)}
                  </Text>
                </View>
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreLabel}>Points to Go</Text>
                  <Text style={[styles.scoreValue, { color: theme.colors.primary }]}>
                    +{creditAssessment.goalScore - creditAssessment.currentScore}
                  </Text>
                  <Text style={styles.scoreCategory}>Improvement</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Assessment Date */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.assessmentDate}>
                <Icon name="calendar-today" size={20} color="#64748B" />
                <Text style={styles.dateLabel}>Last Assessment:</Text>
                <Text style={styles.dateValue}>
                  {new Date(creditAssessment.createdAt).toLocaleDateString()}
                </Text>
                <Chip mode="flat" style={styles.daysAgoChip}>
                  {Math.floor((new Date().getTime() - new Date(creditAssessment.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
                </Chip>
              </View>
            </Card.Content>
          </Card>

          {/* Update Actions */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Update Your Progress</Text>
              <View style={styles.updateActions}>
                <Button
                  mode="outlined"
                  onPress={resetAssessment}
                  style={styles.updateButton}
                  icon="refresh"
                >
                  Retake Assessment
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => setActiveTab('plan')}
                  style={styles.updateButton}
                  icon="assignment"
                >
                  View Action Plan
                </Button>
              </View>
            </Card.Content>
          </Card>

          {/* Key Metrics */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Key Metrics to Monitor</Text>
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Icon name="credit-card" size={24} color="#3B82F6" />
                  <Text style={styles.metricLabel}>Credit Utilization</Text>
                  <Text style={[styles.metricValue, { color: getUtilizationColor(creditAssessment.creditUtilization) }]}>
                    {creditAssessment.creditUtilization}%
                  </Text>
                  <Text style={styles.metricTarget}>Keep under 30%</Text>
                </View>
                
                <View style={styles.metricItem}>
                  <Icon name="history" size={24} color="#10B981" />
                  <Text style={styles.metricLabel}>Payment History</Text>
                  <Text style={styles.metricValue}>
                    {creditAssessment.paymentHistory.charAt(0).toUpperCase() + creditAssessment.paymentHistory.slice(1)}
                  </Text>
                  <Text style={styles.metricTarget}>Keep excellent</Text>
                </View>

                <View style={styles.metricItem}>
                  <Icon name="timeline" size={24} color="#8B5CF6" />
                  <Text style={styles.metricLabel}>Credit Age</Text>
                  <Text style={styles.metricValue}>
                    {Math.floor(creditAssessment.creditHistoryLength / 12)} years
                  </Text>
                  <Text style={styles.metricTarget}>Longer is better</Text>
                </View>

                <View style={styles.metricItem}>
                  <Icon name="search" size={24} color="#F59E0B" />
                  <Text style={styles.metricLabel}>Hard Inquiries</Text>
                  <Text style={styles.metricValue}>{creditAssessment.newCreditInquiries}</Text>
                  <Text style={styles.metricTarget}>Keep minimal</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </>
      )}
    </ScrollView>
  );

  const renderTabBar = () => (
    <Surface style={styles.tabBar}>
      <Button
        mode={activeTab === 'assessment' ? 'contained' : 'text'}
        onPress={() => setActiveTab('assessment')}
        style={styles.tabButton}
        compact
      >
        Assessment
      </Button>
      <Button
        mode={activeTab === 'factors' ? 'contained' : 'text'}
        onPress={() => setActiveTab('factors')}
        style={styles.tabButton}
        compact
        disabled={!creditAssessment}
      >
        Factors
      </Button>
      <Button
        mode={activeTab === 'plan' ? 'contained' : 'text'}
        onPress={() => setActiveTab('plan')}
        style={styles.tabButton}
        compact
        disabled={!creditAssessment}
      >
        Plan
      </Button>
      <Button
        mode={activeTab === 'tracking' ? 'contained' : 'text'}
        onPress={() => setActiveTab('tracking')}
        style={styles.tabButton}
        compact
        disabled={!creditAssessment}
      >
        Progress
      </Button>
    </Surface>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderTabBar()}
      {activeTab === 'assessment' && renderAssessmentForm()}
      {activeTab === 'factors' && renderCreditFactors()}
      {activeTab === 'plan' && renderActionPlan()}
      {activeTab === 'tracking' && renderProgressTracking()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 2,
  },
  tabContent: {
    flex: 1,
    padding: theme.spacing.md,
  },
  card: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  cardTitle: {
    ...theme.typography.titleLarge,
    marginBottom: theme.spacing.sm,
  },
  cardDescription: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.md,
  },
  formField: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.bodyMedium,
    marginBottom: theme.spacing.sm,
    fontWeight: '500',
  },
  input: {
    backgroundColor: theme.colors.surface,
  },
  picker: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
  },
  submitButton: {
    marginTop: theme.spacing.lg,
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  factorTitle: {
    ...theme.typography.titleMedium,
  },
  percentageChip: {
    height: 28,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: theme.spacing.sm,
  },
  factorDescription: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.sm,
  },
  currentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    ...theme.typography.bodyMedium,
    fontWeight: '500',
    marginRight: theme.spacing.sm,
  },
  statusValue: {
    ...theme.typography.bodyMedium,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityChip: {
    backgroundColor: '#FEE2E2',
  },
  timeframe: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
  },
  sectionTitle: {
    ...theme.typography.titleMedium,
    marginBottom: theme.spacing.md,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  recommendationText: {
    ...theme.typography.bodyMedium,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  monthlyItem: {
    marginBottom: theme.spacing.lg,
  },
  monthLabel: {
    ...theme.typography.titleSmall,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
    marginLeft: theme.spacing.md,
  },
  actionText: {
    ...theme.typography.bodyMedium,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  warningCard: {
    backgroundColor: '#FEF3C7',
  },
  warningTitle: {
    ...theme.typography.titleMedium,
    color: '#92400E',
    marginBottom: theme.spacing.md,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  warningText: {
    ...theme.typography.bodyMedium,
    color: '#92400E',
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  progressSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreBox: {
    alignItems: 'center',
    flex: 1,
  },
  scoreLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  scoreValue: {
    ...theme.typography.headingMedium,
    fontWeight: 'bold',
  },
  scoreCategory: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
  },
  assessmentDate: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dateLabel: {
    ...theme.typography.bodyMedium,
    fontWeight: '500',
    marginLeft: theme.spacing.sm,
  },
  dateValue: {
    ...theme.typography.bodyMedium,
    marginLeft: theme.spacing.sm,
  },
  daysAgoChip: {
    marginLeft: theme.spacing.sm,
    height: 24,
  },
  updateActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  updateButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: (width - theme.spacing.md * 3) / 2,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  metricLabel: {
    ...theme.typography.bodySmall,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  metricValue: {
    ...theme.typography.titleMedium,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  metricTarget: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});

export default CreditScreen;