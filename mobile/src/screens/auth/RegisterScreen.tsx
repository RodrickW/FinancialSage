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
import { useAuth } from '../../context/AuthContext';

const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormData>();

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/register', {
        username: data.username,
        email: data.email,
        password: data.password,
      });

      if (response.ok) {
        const userData = await response.json();
        await login(userData);
        
        Alert.alert(
          'Welcome to Mind My Money!',
          'Your 14-day free trial has started. You now have access to all premium features.',
          [{ text: 'Get Started', onPress: () => navigation.navigate('Dashboard' as never) }]
        );
      } else {
        const errorData = await response.json();
        Alert.alert('Registration Failed', errorData.message || 'An error occurred during registration');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Registration Failed', 'Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
          colors={['#0D5DBF', '#1877F2']}
          style={styles.header}
        >
          <View style={styles.logoContainer}>
            <Icon name="attach-money" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Join Mind My Money</Text>
          <Text style={styles.subtitle}>
            Start your 14-day free trial and take control of your finances
          </Text>
        </LinearGradient>

        <View style={styles.formContainer}>
          <View style={styles.trialBanner}>
            <Icon name="celebration" size={24} color="#1877F2" />
            <View style={styles.trialInfo}>
              <Text style={styles.trialTitle}>14-Day Free Trial</Text>
              <Text style={styles.trialDescription}>
                No credit card required • Full access to all features
              </Text>
            </View>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Username"
                  mode="outlined"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={!!errors.username}
                  style={styles.input}
                  theme={{ colors: { primary: '#1877F2' } }}
                  left={<TextInput.Icon icon="account" />}
                />
              )}
            />
            {errors.username && (
              <Text style={styles.errorText}>{errors.username.message}</Text>
            )}

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Email"
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

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Password"
                  mode="outlined"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={!!errors.password}
                  style={styles.input}
                  secureTextEntry={!showPassword}
                  theme={{ colors: { primary: '#1877F2' } }}
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon 
                      icon={showPassword ? "eye-off" : "eye"} 
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                />
              )}
            />
            {errors.password && (
              <Text style={styles.errorText}>{errors.password.message}</Text>
            )}

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Confirm Password"
                  mode="outlined"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={!!errors.confirmPassword}
                  style={styles.input}
                  secureTextEntry={!showConfirmPassword}
                  theme={{ colors: { primary: '#1877F2' } }}
                  left={<TextInput.Icon icon="lock-check" />}
                  right={
                    <TextInput.Icon 
                      icon={showConfirmPassword ? "eye-off" : "eye"} 
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                  }
                />
              )}
            />
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
            )}

            <TouchableOpacity 
              style={[styles.registerButton, isLoading && styles.disabledButton]}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#1877F2', '#1877F2']}
                style={styles.buttonGradient}
              >
                {isLoading ? (
                  <Text style={styles.buttonText}>Creating Account...</Text>
                ) : (
                  <>
                    <Text style={styles.buttonText}>Start Free Trial</Text>
                    <Icon name="arrow-forward" size={20} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.features}>
              <Text style={styles.featuresTitle}>What's included in your free trial:</Text>
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Icon name="check-circle" size={20} color="#1877F2" />
                  <Text style={styles.featureText}>AI Financial Coach</Text>
                </View>
                <View style={styles.featureItem}>
                  <Icon name="check-circle" size={20} color="#1877F2" />
                  <Text style={styles.featureText}>Bank Account Integration</Text>
                </View>
                <View style={styles.featureItem}>
                  <Icon name="check-circle" size={20} color="#1877F2" />
                  <Text style={styles.featureText}>Smart Budget Creation</Text>
                </View>
                <View style={styles.featureItem}>
                  <Icon name="check-circle" size={20} color="#1877F2" />
                  <Text style={styles.featureText}>Credit Score Monitoring</Text>
                </View>
              </View>
            </View>

            <View style={styles.loginSection}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Login' as never)}
                style={styles.loginLink}
              >
                <Text style={styles.loginLinkText}>Sign In</Text>
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
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#1877F2',
  },
  trialInfo: {
    marginLeft: 12,
    flex: 1,
  },
  trialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 4,
  },
  trialDescription: {
    fontSize: 14,
    color: '#047857',
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
  registerButton: {
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
  features: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  loginText: {
    fontSize: 16,
    color: '#6B7280',
    marginRight: 8,
  },
  loginLink: {
    paddingVertical: 4,
  },
  loginLinkText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1877F2',
  },
});

export default RegisterScreen;