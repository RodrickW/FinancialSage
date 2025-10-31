import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { apiRequest } from '../../services/api';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address').min(1, 'Email is required'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/forgot-password', {
        email: data.email,
      });

      if (response.ok) {
        setEmailSent(true);
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <View style={styles.successContainer}>
        <LinearGradient
          colors={['#1565C0', '#1877F2']}
          style={styles.successHeader}
        >
          <View style={styles.successIconContainer}>
            <Icon name="mail-outline" size={60} color="#FFFFFF" />
          </View>
          <Text style={styles.successTitle}>Check Your Email</Text>
          <Text style={styles.successSubtitle}>
            We've sent password reset instructions to your email address
          </Text>
        </LinearGradient>

        <View style={styles.successContent}>
          <Text style={styles.successText}>
            Click the link in the email to reset your password. The link will expire in 1 hour.
          </Text>
          
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('Login' as never)}
          >
            <Text style={styles.backButtonText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={['#1565C0', '#1877F2']}
          style={styles.header}
        >
          <TouchableOpacity 
            style={styles.backIcon}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <Icon name="lock-reset" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you instructions to reset your password
          </Text>
        </LinearGradient>

        <View style={styles.formContainer}>
          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Email Address"
                  mode="outlined"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={!!errors.email}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  theme={{ colors: { primary: '#1877F2' } }}
                  left={<TextInput.Icon icon="email" />}
                />
              )}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email.message}</Text>
            )}

            <TouchableOpacity 
              style={[styles.submitButton, isLoading && styles.disabledButton]}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#1877F2', '#1877F2']}
                style={styles.buttonGradient}
              >
                {isLoading ? (
                  <Text style={styles.buttonText}>Sending...</Text>
                ) : (
                  <>
                    <Text style={styles.buttonText}>Send Reset Email</Text>
                    <Icon name="send" size={20} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.helpSection}>
              <Text style={styles.helpText}>
                Remember your password?
              </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Login' as never)}
                style={styles.helpLink}
              >
                <Text style={styles.helpLinkText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
  },
  backIcon: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#F0FDFA',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  form: {
    flex: 1,
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 16,
    marginLeft: 4,
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  helpSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  helpText: {
    fontSize: 16,
    color: '#6B7280',
    marginRight: 8,
  },
  helpLink: {
    paddingVertical: 4,
  },
  helpLinkText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1877F2',
  },
  // Success screen styles
  successContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  successHeader: {
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#F0FDFA',
    textAlign: 'center',
    lineHeight: 22,
  },
  successContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
    alignItems: 'center',
  },
  successText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  backButton: {
    backgroundColor: '#1877F2',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;