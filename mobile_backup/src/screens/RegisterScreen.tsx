import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';

interface RegisterScreenProps {
  navigation: any;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!formData.username || !formData.password || !formData.firstName || !formData.lastName || !formData.email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const result = await register({
        username: formData.username,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
      });
      
      if (result.success) {
        navigation.replace('Main');
      } else {
        Alert.alert('Error', result.message || 'Registration failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  const updateFormData = (field: keyof typeof formData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Logo size={60} showText={false} />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Mind My Money today</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="First Name"
            value={formData.firstName}
            onChangeText={updateFormData('firstName')}
            placeholder="Enter your first name"
            required
          />
          
          <Input
            label="Last Name"
            value={formData.lastName}
            onChangeText={updateFormData('lastName')}
            placeholder="Enter your last name"
            required
          />

          <Input
            label="Email"
            value={formData.email}
            onChangeText={updateFormData('email')}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            required
          />
          
          <Input
            label="Username"
            value={formData.username}
            onChangeText={updateFormData('username')}
            placeholder="Choose a username"
            autoCapitalize="none"
            required
          />
          
          <Input
            label="Password"
            value={formData.password}
            onChangeText={updateFormData('password')}
            placeholder="Create a password"
            secureTextEntry
            required
          />

          <Input
            label="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={updateFormData('confirmPassword')}
            placeholder="Confirm your password"
            secureTextEntry
            required
          />

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            style={styles.registerButton}
          />

          <Button
            title="Back to Login"
            onPress={handleBackToLogin}
            variant="secondary"
            style={styles.backButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#065f46',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
  form: {
    flex: 1,
    marginBottom: 40,
  },
  registerButton: {
    marginBottom: 16,
  },
  backButton: {
    marginBottom: 20,
  },
});