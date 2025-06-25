import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthInput, AuthButton, AuthError } from '@/components/AuthComponents';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/api/authApi';
import storage from '@/utils/storage';
import { AlertModal } from '@/components/AlertModal';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, verifyEmail, error, clearError, isLoading, isAuthenticated } = useAuth();
  
  const [otp, setOtp] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [emailToVerify, setEmailToVerify] = useState<string | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('');
  const [alertType, setAlertType] = useState<'error' | 'success' | 'warning' | 'info'>('info');

  // Get email either from user object, params, or secure storage
  useEffect(() => {
    console.log("Verification screen mounted", params);
    
    const loadEmail = async () => {
      let email = null;
      
      // Try to get email from params
      if (params.email && typeof params.email === 'string') {
        email = params.email;
        console.log("Found email in params:", email);
      }
      
      // If not in params, try from user context
      if (!email && user?.email) {
        email = user.email;
        console.log("Found email in user context:", email);
      }
      
      // If still not found, try from secure storage
      if (!email) {
        const storedEmail = await storage.getEmailToVerify();
        if (storedEmail) {
          email = storedEmail;
          console.log("Found email in secure storage:", email);
        }
      }
      
      if (email) {
        setEmailToVerify(email);
        console.log("Email set for verification:", email);
        
        // Save email to secure storage as backup
        await storage.saveEmailToVerify(email);
      }
      
      // Redirect if user is already verified
      if (user && user.isVerified) {
        setAlertTitle('Already Verified');
        setAlertMessage('Your email is already verified. Redirecting to home.');
        setAlertType('success');
        setAlertVisible(true);
      }
    };
    
    loadEmail();
  }, [user, params]);

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
      setAlertTitle('Validation Error');
      setAlertMessage('Please enter the verification code');
      setAlertType('warning');
      setAlertVisible(true);
      return;
    }

    if (!emailToVerify) {
      setAlertTitle('Error');
      setAlertMessage('No email found. Please try logging in again.');
      setAlertType('error');
      setAlertVisible(true);
      return;
    }

    try {
      const response = await verifyEmail(emailToVerify, otp);
      
      if (response && response.success) {
        setAlertTitle('Success');
        setAlertMessage('Email verification successful! You can now use all features.');
        setAlertType('success');
        setAlertVisible(true);
      } else {
        throw new Error(response.message || 'Verification failed. Please try again with a valid code.');
      }
    } catch (error) {
      console.log('Verification error:', error);
      setAlertTitle('Verification Error');
      setAlertMessage(`${error instanceof Error ? error.message : 'Invalid verification code'}. Please try again.`);
      setAlertType('error');
      setAlertVisible(true);
    }
  };

  const handleResendOTP = async () => {
    if (!emailToVerify) {
      setAlertTitle('Error');
      setAlertMessage('No email found. Please try logging in again.');
      setAlertType('error');
      setAlertVisible(true);
      return;
    }
    
    setResendLoading(true);
    try {
      const response = await authApi.forgotPassword(emailToVerify);
      
      if (response && response.success) {
        setAlertTitle('Code Sent');
        setAlertMessage('A new verification code has been sent to your email');
        setAlertType('success');
        setAlertVisible(true);
      } else {
        throw new Error(response.message || 'Failed to send code. Please try again later.');
      }
    } catch (error) {
      setAlertTitle('Error');
      setAlertMessage(`Failed to resend verification code: ${error instanceof Error ? error.message : 'Server error'}`);
      setAlertType('error');
      setAlertVisible(true);
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
            {error && <AuthError message={error} />}

            <AuthInput
              placeholder="Enter Verification Code"
              value={otp}
              onChangeText={(text) => {
                setOtp(text);
                clearError();
              }}
              keyboardType="numeric"
            />

            <AuthButton
              title="Verify Email"
              onPress={handleVerify}
              isLoading={isLoading}
              disabled={!otp}
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

      {/* Alert Modal */}
      <AlertModal
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => {
          setAlertVisible(false);
          clearError();
          
          if (alertType === 'success' && alertTitle === 'Success') {
            // Navigate to home on successful verification
            router.replace('/(tabs)');
          } else if (alertType === 'success' && alertTitle === 'Already Verified') {
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
  resendContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    color: '#0a7ea4',
    fontWeight: '500',
  },
});