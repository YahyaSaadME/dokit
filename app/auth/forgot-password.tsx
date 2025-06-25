import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthInput, AuthButton, AuthError } from '@/components/AuthComponents';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword, error, clearError, isLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!email) return;
    
    try {
      await forgotPassword(email);
      setIsSubmitted(true);
    } catch (error) {
      // Error is handled by auth context
      console.log('Forgot password error');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ThemedView style={styles.container}>
          {!isSubmitted ? (
            <>
              <View style={styles.header}>
                <ThemedText type="title">Reset Password</ThemedText>
                <ThemedText style={styles.subtitle}>
                  Enter your email to receive a password reset code
                </ThemedText>
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

                <AuthButton
                  title="Send Reset Code"
                  onPress={handleSubmit}
                  isLoading={isLoading}
                  disabled={!email}
                />

                <TouchableOpacity
                  style={styles.backContainer}
                  onPress={() => router.back()}
                >
                  <ThemedText style={styles.backText}>Back to Login</ThemedText>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.successContainer}>
              <ThemedText type="title">Check Your Email</ThemedText>
              <ThemedText style={styles.successText}>
                We've sent a password reset code to {email}
              </ThemedText>
              <AuthButton
                title="Enter Reset Code"
                onPress={() => router.push({
                  pathname: '/auth/reset-password',
                  params: { email }
                })}
              />
              <TouchableOpacity
                style={styles.backContainer}
                onPress={() => router.push('/auth/login')}
              >
                <ThemedText style={styles.backText}>Back to Login</ThemedText>
              </TouchableOpacity>
            </View>
          )}
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
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  backContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  backText: {
    color: '#0a7ea4',
    fontWeight: '500',
  },
});
