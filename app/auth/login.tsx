import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthInput, AuthButton, AuthError } from '@/components/AuthComponents';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login, clearError, isLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Reset error state when screen gains/loses focus
  useFocusEffect(
    useCallback(() => {
      // When screen comes into focus
      return () => {
        // When screen loses focus
        setLocalError(null);
        clearError();
      };
    }, [clearError])
  );

  const handleLogin = async () => {
    // Simple validation
    if (!email || !password) {
      setLocalError('Please enter both email and password');
      return;
    }
    
    // Clear previous errors
    setLocalError(null);
    
    try {
      // Call login function from auth context
      const result = await login(email, password);
      
      if (result.success) {
        // Success - redirect to home page
        router.replace('/(tabs)');
      } else {
        // Error from server - show error message
        setLocalError(result.message || 'Invalid email or password');
      }
    } catch (error) {
      // Network or other error
      setLocalError(error instanceof Error ? error.message : 'Failed to connect to server');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ThemedView style={styles.container}>
          <View style={styles.header}>
            <ThemedText type="title">Welcome Back</ThemedText>
            <ThemedText style={styles.subtitle}>Sign in to continue</ThemedText>
          </View>

          <View style={styles.form}>
            {/* Display error messages directly in the UI */}
            {localError && <AuthError message={localError} />}

            <AuthInput
              placeholder="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setLocalError(null);
              }}
              keyboardType="email-address"
            />

            <AuthInput
              placeholder="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setLocalError(null);
              }}
              secureTextEntry
            />

            <TouchableOpacity
              onPress={() => router.push('/auth/forgot-password')}
              style={styles.forgotPasswordContainer}
            >
              <ThemedText style={styles.forgotPasswordText}>Forgot Password?</ThemedText>
            </TouchableOpacity>

            <AuthButton
              title="Login"
              onPress={handleLogin}
              isLoading={isLoading}
              disabled={isLoading}
            />

            <View style={styles.signupContainer}>
              <ThemedText>Don't have an account? </ThemedText>
              <TouchableOpacity onPress={() => router.push('/auth/register')}>
                <ThemedText style={styles.signupText}>Sign Up</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginTop: 50,
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
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#0a7ea4',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupText: {
    color: '#0a7ea4',
    fontWeight: 'bold',
  },
});