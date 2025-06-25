import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { AuthInput, AuthButton, AuthError } from '@/components/AuthComponents';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { AlertModal } from '@/components/AlertModal';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function ProfileTab() {
  const router = useRouter();
  const { user, updateProfile, logout, error, clearError, isLoading } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('');
  const [alertType, setAlertType] = useState<'error' | 'success' | 'warning' | 'info'>('info');

  const handleUpdateProfile = async () => {
    if (!name) {
      setAlertTitle('Validation Error');
      setAlertMessage('Name cannot be empty');
      setAlertType('warning');
      setAlertVisible(true);
      return;
    }
    
    try {
      const response = await updateProfile({ name });
      
      if (response && response.success) {
        setAlertTitle('Success');
        setAlertMessage('Profile updated successfully!');
        setAlertType('success');
        setAlertVisible(true);
        setIsEditing(false);
      } else {
        throw new Error(response.message || 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.log('Update profile error:', error);
      setAlertTitle('Update Error');
      setAlertMessage(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setAlertType('error');
      setAlertVisible(true);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          }
        }
      ]
    );
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
              <TouchableOpacity 
                style={styles.logoutButton} 
                onPress={handleLogout}
              >
                <IconSymbol name="rectangle.portrait.and.arrow.right" color="#D32F2F" size={24} />
              </TouchableOpacity>
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

              <ThemedText style={styles.userName}>{user.name}</ThemedText>
              <ThemedText style={styles.email}>{user.email}</ThemedText>
            </View>

            <View style={styles.form}>
              {error && <AuthError message={error} />}

              {isEditing ? (
                <>
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

                  <View style={styles.buttonRow}>
                    <AuthButton
                      title="Cancel"
                      onPress={() => {
                        setName(user.name || '');
                        setIsEditing(false);
                      }}
                      type="secondary"
                    />
                    <AuthButton
                      title="Save Changes"
                      onPress={handleUpdateProfile}
                      isLoading={isLoading}
                      disabled={!name || name === user.name}
                    />
                  </View>
                </>
              ) : (
                <AuthButton
                  title="Edit Profile"
                  onPress={() => setIsEditing(true)}
                  type="secondary"
                />
              )}

              <View style={styles.infoSection}>
                <ThemedText style={styles.sectionTitle}>Account Information</ThemedText>
                
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Email:</ThemedText>
                  <ThemedText style={styles.infoValue}>{user.email}</ThemedText>
                </View>
                
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Status:</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {user.isVerified ? 'Verified ✓' : 'Not Verified'}
                  </ThemedText>
                </View>
              </View>
            </View>
          </ThemedView>
        </ScrollView>
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
        }}
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoutButton: {
    padding: 8,
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
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 5,
  },
  form: {
    width: '100%',
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  infoSection: {
    marginTop: 30,
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  infoValue: {
    flex: 2,
    fontSize: 16,
  },
});
