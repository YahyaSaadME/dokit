import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthInput, AuthButton, AuthError } from '@/components/AuthComponents';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/api/authApi';
import storage from '@/utils/storage';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, verifyEmail, error, clearError, isLoading, isAuthenticated } = useAuth();
  
  const [otp, setOtp] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [emailToVerify, setEmailToVerify] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Get email either from user object, params, or secure storage
  useEffect(() => {
    const loadEmail = async () => {
      let email = null;
      
      // Try to get email from params
      if (params.email && typeof params.email === 'string') {
        email = params.email;
      }
      
      // If not in params, try from user context
      if (!email && user?.email) {
        email = user.email;
      }
      
      // If still not found, try from secure storage
      if (!email) {
        const storedEmail = await storage.getEmailToVerify();
        if (storedEmail) {
          email = storedEmail;
        }
      }
      
      if (email) {
        setEmailToVerify(email);
        await storage.saveEmailToVerify(email);
      }
      
      // Redirect if user is already verified
      if (user && user.isVerified) {
        setSuccessMessage('Your email is already verified. Redirecting to home.');
        setTimeout(() => router.replace('/(tabs)'), 2000);
      }
    };
    
    loadEmail();
  }, [user, params]);

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

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ThemedText>Loading...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  // Ensure email is available for verification
  if (!emailToVerify && !isLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ThemedView style={styles.container}>
          <ThemedText type="title">Email Verification</ThemedText>
          <ThemedText style={styles.subtitle}>No email address found for verification</ThemedText>
          
          <AuthButton
            title="Go to Login"
            onPress={() => router.replace('/auth/login')}
          />
        </ThemedView>
      </SafeAreaView>
    );
  }

  const handleVerify = async () => {
    if (!otp) {
      setLocalError('Please enter the verification code');
      return;
    }

    if (!emailToVerify) {
      setLocalError('No email found. Please try logging in again.');
      return;
    }

    setLocalError(null);
    
    try {
      const response = await verifyEmail(emailToVerify, otp);
      
      if (response && response.success) {
        setSuccessMessage('Email verification successful! You can now use all features.');
        setTimeout(() => router.replace('/(tabs)'), 2000);
      } else {
        setLocalError(response.message || 'Verification failed. Please try again.');
      }
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Invalid verification code. Please try again.');
    }
  };

  const handleResendOTP = async () => {
    if (!emailToVerify) {
      setLocalError('No email found. Please try logging in again.');
      return;
    }
    
    setResendLoading(true);
    setLocalError(null);
    
    try {
      const response = await authApi.forgotPassword(emailToVerify);
      
      if (response && response.success) {
        setSuccessMessage('A new verification code has been sent to your email');
        
        // Hide success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setLocalError(response.message || 'Failed to send code. Please try again later.');
      }
    } catch (error) {
      setLocalError(`Failed to resend verification code: ${error instanceof Error ? error.message : 'Server error'}`);
    } finally {
      setResendLoading(false);
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
            <ThemedText type="title">Verify Email</ThemedText>
            <ThemedText style={styles.subtitle}>
              Enter the verification code sent to {emailToVerify}
            </ThemedText>
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
              placeholder="Enter Verification Code"
              value={otp}
              onChangeText={(text) => {
                setOtp(text);
                clearError();
                setLocalError(null);
              }}
              keyboardType="numeric"
            />

            <AuthButton
              title="Verify Email"
              onPress={handleVerify}
              isLoading={isLoading}
              disabled={!otp || isLoading}
            />

            <TouchableOpacity 
              style={styles.resendContainer} 
              onPress={handleResendOTP}
              disabled={resendLoading}
            >
              <ThemedText style={styles.resendText}>
                {resendLoading ? 'Sending...' : "Didn't receive code? Resend"}
              </ThemedText>
            </TouchableOpacity>
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
  resendContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    color: '#0a7ea4',
    fontWeight: '500',
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