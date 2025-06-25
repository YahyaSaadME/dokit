import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthInput, AuthButton, AuthError } from '@/components/AuthComponents';
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
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateForm = () => {
    if (!name || !email || !password || !confirmPassword) {
      setLocalError('All fields are required');
      return false;
    }
    
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return false;
    }
    
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return false;
    }
    
    setLocalError(null);
    return true;
  };
  
  const handleRegister = async () => {
    if (!validateForm()) return;
    
    try {
      const response = await register(name, email, password);
      
      if (response && response.success) {
        setSuccessMessage(`Account created successfully! A verification code has been sent to ${email}`);
        
        // Redirect to verification page after a short delay
        setTimeout(() => {
          router.replace({
            pathname: '/auth/verify-email',
            params: { email }
          });
        }, 2000);
      } else {
        setLocalError(response.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    }
  };

  // Reset error and success state when screen loses focus
  useFocusEffect(
    useCallback(() => {
      // When screen comes into focus
      
      return () => {
        // When screen loses focus
        setLocalError(null);
        setSuccessMessage(null);
        clearError();
      };
    }, [clearError])
  );

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
              {/* Show success message */}
              {successMessage && (
                <View style={styles.successContainer}>
                  <ThemedText style={styles.successText}>{successMessage}</ThemedText>
                </View>
              )}

              {/* Show error message */}
              {(error || localError) && <AuthError message={error || localError} />}

              <AuthInput
                placeholder="Full Name"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  clearError();
                  setLocalError(null);
                }}
                autoCapitalize="words"
              />

              <AuthInput
                placeholder="Email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  clearError();
                  setLocalError(null);
                }}
                keyboardType="email-address"
              />

              <AuthInput
                placeholder="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  clearError();
                  setLocalError(null);
                }}
                secureTextEntry
              />

              <AuthInput
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  clearError();
                  setLocalError(null);
                }}
                secureTextEntry
              />

              <AuthButton
                title="Register"
                onPress={handleRegister}
                isLoading={isLoading}
                disabled={!name || !email || !password || !confirmPassword || isLoading}
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
  successContainer: {
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: {
    color: '#2E7D32',
    fontSize: 14,
    textAlign: 'center',
  },
});