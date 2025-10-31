import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Logo } from '@/components/Logo';
import { apiService } from '@/services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CoachScreenProps {
  navigation: any;
}

export const CoachScreen: React.FC<CoachScreenProps> = ({ navigation }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm Money Mind, your personal AI financial coach. I can help you with budgeting, saving, spending analysis, and financial planning. What would you like to know about your finances today?"
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const suggestedQuestions = [
    "How much money do I have in my accounts?",
    "What's my spending pattern this month?",
    "Should I pay off debt or invest?",
    "How can I improve my budget?",
    "What's my financial health score?"
  ];

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const messageText = inputMessage.trim();
    
    // Add user message
    const userMessage: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await apiService.getFinancialCoaching(messageText);
      const aiMessage: Message = { role: 'assistant', content: response.answer };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      Alert.alert('Error', 'Failed to get a response. Please try again.');
      console.error('AI coaching error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputMessage(question);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Logo size={32} showText={false} />
        <Text style={styles.title}>Money Mind Coach</Text>
      </View>

      <ScrollView style={styles.messagesContainer}>
        {messages.map((message, index) => (
          <View
            key={index}
            style={[
              styles.messageWrapper,
              message.role === 'user' ? styles.userMessageWrapper : styles.aiMessageWrapper
            ]}
          >
            <Card style={[
              styles.messageCard,
              message.role === 'user' ? styles.userMessage : styles.aiMessage
            ]}>
              <Text style={[
                styles.messageText,
                message.role === 'user' ? styles.userMessageText : styles.aiMessageText
              ]}>
                {message.content}
              </Text>
            </Card>
          </View>
        ))}

        {isLoading && (
          <View style={styles.aiMessageWrapper}>
            <Card style={styles.aiMessage}>
              <Text style={styles.loadingText}>Money Mind is thinking...</Text>
            </Card>
          </View>
        )}

        {messages.length === 1 && (
          <Card style={styles.suggestionsCard}>
            <Text style={styles.suggestionsTitle}>Try asking:</Text>
            {suggestedQuestions.map((question, index) => (
              <Button
                key={index}
                title={question}
                onPress={() => handleSuggestedQuestion(question)}
                variant="secondary"
                size="sm"
                style={styles.suggestionButton}
              />
            ))}
          </Card>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <Input
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Ask Money Mind anything..."
          containerStyle={styles.messageInput}
          multiline
        />
        <Button
          title="Send"
          onPress={handleSendMessage}
          disabled={!inputMessage.trim() || isLoading}
          loading={isLoading}
          style={styles.sendButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  messageWrapper: {
    marginBottom: 12,
  },
  userMessageWrapper: {
    alignItems: 'flex-end',
  },
  aiMessageWrapper: {
    alignItems: 'flex-start',
  },
  messageCard: {
    maxWidth: '80%',
    padding: 12,
  },
  userMessage: {
    backgroundColor: '#10b981',
  },
  aiMessage: {
    backgroundColor: '#ffffff',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#ffffff',
  },
  aiMessageText: {
    color: '#374151',
  },
  loadingText: {
    color: '#6b7280',
    fontStyle: 'italic',
    fontSize: 16,
  },
  suggestionsCard: {
    marginTop: 20,
    backgroundColor: '#f3f4f6',
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  suggestionButton: {
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  messageInput: {
    flex: 1,
    marginBottom: 0,
  },
  sendButton: {
    alignSelf: 'flex-end',
  },
});