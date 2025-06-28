import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../../components/CustomAlert';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info',
    onConfirm: () => {},
    showCancel: false,
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info', onConfirm?: () => void, showCancel = false) => {
    setAlertConfig({
      title,
      message,
      type,
      onConfirm: onConfirm || (() => setAlertVisible(false)),
      showCancel,
    });
    setAlertVisible(true);
  };

  const handleLogout = () => {
    showAlert(
      'Logout',
      'Are you sure you want to logout?',
      'info',
      () => {
        setAlertVisible(false);
        logout();
      },
      true
    );
  };

  const menuItems = [
    {
      id: 'preferences',
      title: 'Preferences',
      icon: 'settings-outline',
      onPress: () => {
        showAlert('Coming Soon', 'Preferences screen will be available soon!', 'info');
      },
    },
    {
      id: 'bookmarks',
      title: 'Bookmarks',
      icon: 'bookmark-outline',
      onPress: () => {
        router.push('/(tabs)/explore');
      },
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'notifications-outline',
      onPress: () => {
        showAlert('Coming Soon', 'Notifications settings will be available soon!', 'info');
      },
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: 'help-circle-outline',
      onPress: () => {
        showAlert('Help & Support', 'Contact us at support@dokit.com', 'info');
      },
    },
    {
      id: 'about',
      title: 'About',
      icon: 'information-circle-outline',
      onPress: () => {
        showAlert('About Dokit', 'Version 1.0.0\nYour personalized news companion', 'info');
      },
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* User Info */}
        <View style={styles.userSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#fff" />
            </View>
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.verificationBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.verificationText}>Verified Account</Text>
          </View>
        </View>

        {/* User Preferences Summary */}
        {user?.language && (
          <View style={styles.preferencesSection}>
            <Text style={styles.sectionTitle}>Your Preferences</Text>
            <View style={styles.preferencesGrid}>
              <View style={styles.preferenceItem}>
                <Ionicons name="language-outline" size={20} color="#007AFF" />
                <Text style={styles.preferenceText}>
                  Language: {user.language.toUpperCase()}
                </Text>
              </View>
              {user?.categories && user.categories.length > 0 && (
                <View style={styles.preferenceItem}>
                  <Ionicons name="list-outline" size={20} color="#007AFF" />
                  <Text style={styles.preferenceText}>
                    {user.categories.length} Categor{user.categories.length > 1 ? 'ies' : 'y'}
                  </Text>
                </View>
              )}
              {user?.locations && user.locations.length > 0 && (
                <View style={styles.preferenceItem}>
                  <Ionicons name="location-outline" size={20} color="#007AFF" />
                  <Text style={styles.preferenceText}>
                    {user.locations.length} Location{user.locations.length > 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon as any} size={24} color="#666" />
                <Text style={styles.menuItemTitle}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#ff6b6b" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertVisible(false)}
        onConfirm={alertConfig.onConfirm}
        showCancel={alertConfig.showCancel}
        confirmText={alertConfig.showCancel ? 'Logout' : 'OK'}
        cancelText="Cancel"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  userSection: {
    backgroundColor: '#fff',
    paddingVertical: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verificationText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },
  preferencesSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  preferencesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  preferenceItem: {
    alignItems: 'center',
    flex: 1,
  },
  preferenceText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  menuSection: {
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemTitle: {
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  logoutSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 16,
    color: '#ff6b6b',
    fontWeight: '600',
    marginLeft: 8,
  },
});