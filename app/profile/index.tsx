import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { AuthInput, AuthButton, AuthError } from '@/components/AuthComponents';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateProfile, logout, error, clearError, isLoading, isAuthenticated } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [isSuccess, setIsSuccess] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, isLoading]);

  const handleUpdateProfile = async () => {
    if (!name) return;
    
    try {
      await updateProfile({ name });
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      // Error handled by auth context
      console.log('Update profile error');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView>
          <ThemedView style={styles.container}>
            <View style={styles.header}>
              <ThemedText type="title">Your Profile</ThemedText>
            </View>

            <View style={styles.profileContainer}>
              <View style={styles.avatarContainer}>
                {user.profilePicture ? (
                  <Image
                    source={{ uri: user.profilePicture }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <ThemedText style={styles.avatarInitial}>
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </ThemedText>
                  </View>
                )}
              </View>

              <ThemedText style={styles.email}>{user.email}</ThemedText>
            </View>

            <View style={styles.form}>
              {error && <AuthError message={error} />}
              {isSuccess && (
                <View style={styles.successMessage}>
                  <ThemedText style={styles.successText}>Profile updated successfully!</ThemedText>
                </View>
              )}

              <ThemedText style={styles.fieldLabel}>Full Name</ThemedText>
              <AuthInput
                placeholder="Full Name"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  clearError();
                }}
                autoCapitalize="words"
              />

              <AuthButton
                title="Update Profile"
                onPress={handleUpdateProfile}
                isLoading={isLoading}
                disabled={!name}
              />

              <View style={styles.divider} />

              <AuthButton
                title="Logout"
                onPress={handleLogout}
                type="secondary"
              />
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
    padding: 20,
    minHeight: '100%',
  },
  header: {
    marginTop: 30,
    marginBottom: 20,
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  email: {
    fontSize: 16,
    opacity: 0.7,
  },
  form: {
    width: '100%',
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  successMessage: {
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
  divider: {
    height: 1,
    backgroundColor: '#E1E1E1',
    marginVertical: 20,
  },
});
