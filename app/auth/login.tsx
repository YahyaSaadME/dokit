import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthInput, AuthButton, AuthError } from '@/components/AuthComponents';
import { AlertModal } from '@/components/AlertModal';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login, error, clearError, isLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('Login Error');
  const [alertType, setAlertType] = useState<'error' | 'success' | 'warning' | 'info'>('error');

  const handleLogin = async () => {
    if (!email || !password) {
      setAlertTitle('Validation Error');
      setAlertMessage('Please enter both email and password');
      setAlertType('warning');
      setAlertVisible(true);
      return;
    }
    
    try {
      
      const response = await login(email, password);
      console.log("res:",response);
      
      if (response && response.success) {
        setAlertTitle('Login Success');
        setAlertMessage('You have successfully logged in!');
        setAlertType('success');
        setAlertVisible(true);
        
        // Wait for user to acknowledge success before navigating
        setTimeout(() => {
          if (response.user && !response.user.isVerified) {
            router.replace('/auth/verify-email');
          } else {
            router.replace('/(tabs)');
          }
        }, 1000);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      setAlertTitle('Login Error');
      setAlertMessage(`${error instanceof Error ? error.message : 'Invalid credentials'}. Please try again.`);
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
        <ThemedView style={styles.container}>
          <View style={styles.header}>
            <ThemedText type="title">Welcome Back</ThemedText>
            <ThemedText style={styles.subtitle}>Sign in to continue</ThemedText>
          </View>

          <View style={styles.form}>
            {error && <AuthError message={error} />}

            <AuthInput
              placeholder="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                clearError();
              }}
              keyboardType="email-address"
            />

            <AuthInput
              placeholder="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                clearError();
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
              disabled={!email || !password}
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

      {/* Alert Modal for displaying errors */}
      <AlertModal
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => {
          setAlertVisible(false);
          clearError();
          
          // If it was a success alert, navigate after closing
          if (alertType === 'success') {
            router.replace('/(tabs)');
          }
        }}
      />
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
