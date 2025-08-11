import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Card,
  Text,
  TextInput,
  Button,
  Surface,
  ActivityIndicator,
} from 'react-native-paper';
import { useMutation, useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../../theme/theme';
import { apiRequest } from '../../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const CoachScreen: React.FC = () => {
  const [inputMessage, setInputMessage] = useState('');
  
  const { data: chatHistory, refetch } = useQuery({
    queryKey: ['coach', 'history'],
    queryFn: () => apiRequest('GET', '/api/coach/history'),
  });

  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => 
      apiRequest('POST', '/api/coach/message', { message }),
    onSuccess: () => {
      setInputMessage('');
      refetch();
    },
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    sendMessageMutation.mutate(inputMessage);
  };

  const renderMessage = (message: Message) => (
    <View 
      key={message.id} 
      style={[
        styles.messageContainer,
        message.role === 'user' ? styles.userMessage : styles.assistantMessage
      ]}
    >
      <View style={styles.messageHeader}>
        <Icon 
          name={message.role === 'user' ? 'person' : 'psychology'} 
          size={20} 
          color={message.role === 'user' ? theme.colors.primary : theme.colors.secondary}
        />
        <Text style={styles.messageRole}>
          {message.role === 'user' ? 'You' : 'Money Mind'}
        </Text>
        <Text style={styles.messageTime}>
          {new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
      <Text style={styles.messageContent}>{message.content}</Text>
    </View>
  );

  const renderQuickActions = () => (
    <Card style={styles.quickActionsCard}>
      <Card.Content>
        <Text style={styles.quickActionsTitle}>Quick Questions</Text>
        <View style={styles.quickActionsList}>
          {[
            "How can I improve my credit score?",
            "What's my spending pattern this month?",
            "Help me create a budget",
            "Should I pay off debt or save?",
            "Investment advice for beginners"
          ].map((question, index) => (
            <Button
              key={index}
              mode="outlined"
              style={styles.quickActionButton}
              onPress={() => setInputMessage(question)}
              compact
            >
              {question}
            </Button>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  const renderWelcomeMessage = () => (
    <Card style={styles.welcomeCard}>
      <Card.Content>
        <View style={styles.welcomeHeader}>
          <Icon name="psychology" size={40} color={theme.colors.secondary} />
          <Text style={styles.welcomeTitle}>Meet Money Mind</Text>
        </View>
        <Text style={styles.welcomeDescription}>
          Your AI financial coach is here to help you make better money decisions. 
          Ask me anything about budgeting, saving, investing, or debt management.
        </Text>
        <View style={styles.welcomeFeatures}>
          <View style={styles.featureItem}>
            <Icon name="insights" size={20} color={theme.colors.primary} />
            <Text style={styles.featureText}>Personalized advice based on your data</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="trending-up" size={20} color={theme.colors.primary} />
            <Text style={styles.featureText}>Investment and savings strategies</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="security" size={20} color={theme.colors.primary} />
            <Text style={styles.featureText}>Debt management guidance</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.chatContainer}>
        {!chatHistory || chatHistory.length === 0 ? (
          <>
            {renderWelcomeMessage()}
            {renderQuickActions()}
          </>
        ) : (
          <View style={styles.messagesList}>
            {chatHistory.map(renderMessage)}
          </View>
        )}
        
        {sendMessageMutation.isPending && (
          <View style={styles.loadingMessage}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Money Mind is thinking...</Text>
          </View>
        )}
      </ScrollView>
      
      <Surface style={styles.inputContainer}>
        <TextInput
          mode="outlined"
          placeholder="Ask Money Mind anything..."
          value={inputMessage}
          onChangeText={setInputMessage}
          multiline
          maxLength={500}
          style={styles.messageInput}
          right={
            <TextInput.Icon
              icon="send"
              onPress={handleSendMessage}
              disabled={!inputMessage.trim() || sendMessageMutation.isPending}
            />
          }
        />
      </Surface>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  chatContainer: {
    flex: 1,
    padding: theme.spacing.md,
  },
  welcomeCard: {
    marginBottom: theme.spacing.lg,
    elevation: 2,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  welcomeTitle: {
    ...theme.typography.headingMedium,
    marginLeft: theme.spacing.md,
    color: theme.colors.secondary,
  },
  welcomeDescription: {
    ...theme.typography.bodyLarge,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  welcomeFeatures: {
    gap: theme.spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    ...theme.typography.bodyMedium,
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  quickActionsCard: {
    marginBottom: theme.spacing.lg,
    elevation: 2,
  },
  quickActionsTitle: {
    ...theme.typography.titleMedium,
    marginBottom: theme.spacing.md,
  },
  quickActionsList: {
    gap: theme.spacing.sm,
  },
  quickActionButton: {
    alignSelf: 'flex-start',
  },
  messagesList: {
    gap: theme.spacing.md,
  },
  messageContainer: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    maxWidth: '85%',
  },
  userMessage: {
    backgroundColor: theme.colors.primaryContainer,
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    backgroundColor: theme.colors.surface,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  messageRole: {
    ...theme.typography.bodyMedium,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  messageTime: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
  },
  messageContent: {
    ...theme.typography.bodyMedium,
    lineHeight: 20,
  },
  loadingMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  loadingText: {
    ...theme.typography.bodyMedium,
    marginLeft: theme.spacing.sm,
    color: theme.colors.onSurfaceVariant,
  },
  inputContainer: {
    padding: theme.spacing.md,
    elevation: 4,
  },
  messageInput: {
    backgroundColor: theme.colors.surface,
    maxHeight: 120,
  },
});

export default CoachScreen;