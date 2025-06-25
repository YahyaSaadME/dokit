import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Random from 'expo-random';
import { UserData } from '../types/api';

// Keys for storage
const AUTH_TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';
const EMAIL_TO_VERIFY_KEY = 'email_to_verify';
const SESSION_STATE_KEY = 'auth_session_state';

// Use SecureStore on native platforms, AsyncStorage as fallback for web
const storage = {
  // Save auth token securely
  saveToken: async (token: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      } else {
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
      }
    } catch (error) {
      console.error('Error saving auth token:', error);
    }
  },

  // Get auth token
  getToken: async (): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      } else {
        return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  },

  // Generate and save a random state for auth session
  generateSessionState: async (): Promise<string> => {
    try {
      const randomBytes = await Random.getRandomBytesAsync(16);
      const state = Array.from(randomBytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
      
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(SESSION_STATE_KEY, state);
      } else {
        await SecureStore.setItemAsync(SESSION_STATE_KEY, state);
      }
      return state;
    } catch (error) {
      console.error('Error generating session state:', error);
      // Fallback to simple random string
      const fallbackState = Math.random().toString(36).substring(2);
      return fallbackState;
    }
  },
  
  // Get session state
  getSessionState: async (): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(SESSION_STATE_KEY);
      } else {
        return await SecureStore.getItemAsync(SESSION_STATE_KEY);
      }
    } catch (error) {
      console.error('Error getting session state:', error);
      return null;
    }
  },

  // Save user data
  saveUser: async (user: UserData): Promise<void> => {
    try {
      const userString = JSON.stringify(user);
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(USER_KEY, userString);
      } else {
        await SecureStore.setItemAsync(USER_KEY, userString);
      }
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  },

  // Get user data
  getUser: async (): Promise<UserData | null> => {
    try {
      let userString;
      if (Platform.OS === 'web') {
        userString = await AsyncStorage.getItem(USER_KEY);
      } else {
        userString = await SecureStore.getItemAsync(USER_KEY);
      }
      
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  // Remove auth token
  removeToken: async (): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      }
    } catch (error) {
      console.error('Error removing auth token:', error);
    }
  },

  // Remove user data
  removeUser: async (): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(USER_KEY);
      } else {
        await SecureStore.deleteItemAsync(USER_KEY);
      }
    } catch (error) {
      console.error('Error removing user data:', error);
    }
  },

  // Save email to verify
  saveEmailToVerify: async (email: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(EMAIL_TO_VERIFY_KEY, email);
      } else {
        await SecureStore.setItemAsync(EMAIL_TO_VERIFY_KEY, email);
      }
    } catch (error) {
      console.error('Error saving email to verify:', error);
    }
  },

  // Get email to verify
  getEmailToVerify: async (): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(EMAIL_TO_VERIFY_KEY);
      } else {
        return await SecureStore.getItemAsync(EMAIL_TO_VERIFY_KEY);
      }
    } catch (error) {
      console.error('Error getting email to verify:', error);
      return null;
    }
  },

  // Remove email to verify
  removeEmailToVerify: async (): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(EMAIL_TO_VERIFY_KEY);
      } else {
        await SecureStore.deleteItemAsync(EMAIL_TO_VERIFY_KEY);
      }
    } catch (error) {
      console.error('Error removing email to verify:', error);
    }
  },

  // Clear all auth data
  clearAll: async (): Promise<void> => {
    await storage.removeToken();
    await storage.removeUser();
    await storage.removeEmailToVerify();
    
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(SESSION_STATE_KEY);
      } else {
        await SecureStore.deleteItemAsync(SESSION_STATE_KEY);
      }
    } catch (error) {
      console.error('Error clearing session state:', error);
    }
  }
};

export default storage;
