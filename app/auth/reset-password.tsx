import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthInput, AuthButton, AuthError } from '@/components/AuthComponents';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const { resetPassword, error, clearError, isLoading } = useAuth();
  
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = () => {
    if (!otp || !newPassword || !confirmPassword) {
      setValidationError('All fields are required');
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      setValidationError('Passwords do not match');
      return false;
    }
    
    if (newPassword.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return false;
    }
    
    setValidationError(null);
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateForm() || !email || typeof email !== 'string') return;
    
    try {
      await resetPassword(email, otp, newPassword);
      setIsSuccess(true);
    } catch (error) {
      // Error is handled by auth context
      console.log('Reset password error');
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
            {!isSuccess ? (
              <>
                <View style={styles.header}>
                  <ThemedText type="title">Reset Password</ThemedText>
                  <ThemedText style={styles.subtitle}>
                    Enter the reset code and your new password
                  </ThemedText>
                </View>

                <View style={styles.form}>
                  {(error || validationError) && (
                    <AuthError message={error || validationError} />
                  )}

                  <AuthInput
                    placeholder="Enter OTP"
                    value={otp}
                    onChangeText={(text) => {
                      setOtp(text);
                      clearError();
                      setValidationError(null);
                    }}
                    keyboardType="numeric"
                  />

                  <AuthInput
                    placeholder="New Password"
                    value={newPassword}
                    onChangeText={(text) => {
                      setNewPassword(text);
                      clearError();
                      setValidationError(null);
                    }}
                    secureTextEntry
                  />

                  <AuthInput
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      clearError();
                      setValidationError(null);
                    }}
                    secureTextEntry
                  />

                  <AuthButton
                    title="Reset Password"
                    onPress={handleResetPassword}
                    isLoading={isLoading}
                    disabled={!otp || !newPassword || !confirmPassword}
                  />
                </View>
              </>
            ) : (
              <View style={styles.successContainer}>
                <ThemedText type="title">Success!</ThemedText>
                <ThemedText style={styles.successText}>
                  Your password has been reset successfully.
                </ThemedText>
                <AuthButton
                  title="Login with New Password"
                  onPress={() => router.push('/auth/login')}
                />
              </View>
            )}
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    minHeight: '100%',
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
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 100,
  },
  successText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
});
