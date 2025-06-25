import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthInput, AuthButton, AuthError } from '@/components/AuthComponents';
import { AlertModal } from '@/components/AlertModal';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, error, clearError, isLoading } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('Registration Error');
  const [alertType, setAlertType] = useState<'error' | 'success' | 'warning' | 'info'>('error');

  const validateForm = () => {
    if (!name || !email || !password || !confirmPassword) {
      setValidationError('All fields are required');
      return false;
    }
    
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return false;
    }
    
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return false;
    }
    
    setValidationError(null);
    return true;
  };
  
  const handleRegister = async () => {
    if (!validateForm()) return;
    
    try {
      const response = await register(name, email, password);
      
      console.log("Registration response:", response);
      
      if (response && response.success) {
        setAlertTitle('Registration Success');
        setAlertMessage(`Account created successfully! A verification code has been sent to ${email}`);
        setAlertType('success');
        setAlertVisible(true);
      } else {
        throw new Error(response.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.log('Register error:', error);
      
      // Show error in alert modal
      setAlertTitle('Registration Error');
      setAlertMessage(`${error instanceof Error ? error.message : 'Something went wrong'}. Please try again.`);
      setAlertType('error');
      setAlertVisible(true);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView>
          <ThemedView style={styles.container}>
            <View style={styles.header}>
              <ThemedText type="title">Create Account</ThemedText>
              <ThemedText style={styles.subtitle}>Sign up to get started</ThemedText>
            </View>

            <View style={styles.form}>
              {(error || validationError) && (
                <AuthError message={error || validationError} />
              )}

              <AuthInput
                placeholder="Full Name"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  clearError();
                  setValidationError(null);
                }}
                autoCapitalize="words"
              />

              <AuthInput
                placeholder="Email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  clearError();
                  setValidationError(null);
                }}
                keyboardType="email-address"
              />

              <AuthInput
                placeholder="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  clearError();
                  setValidationError(null);
                }}
                secureTextEntry
              />

              <AuthInput
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  clearError();
                  setValidationError(null);
                }}
                secureTextEntry
              />

              <AuthButton
                title="Register"
                onPress={handleRegister}
                isLoading={isLoading}
                disabled={!name || !email || !password || !confirmPassword}
              />

              <View style={styles.loginContainer}>
                <ThemedText>Already have an account? </ThemedText>
                <TouchableOpacity onPress={() => router.push('/auth/login')}>
                  <ThemedText style={styles.loginText}>Login</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Alert Modal for displaying messages */}
      <AlertModal
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => {
          setAlertVisible(false);
          clearError();
          
          // Only navigate to verification on success
          if (alertType === 'success') {
            router.replace({
              pathname: '/auth/verify-email',
              params: { email }
            });
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ 
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  header: {
    marginTop: 40,
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 5,
  },
  form: {
    width: '100%',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  loginText: {
    color: '#0a7ea4',
    fontWeight: 'bold',
  },
});