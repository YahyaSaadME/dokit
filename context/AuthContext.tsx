import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../constants/Api';

interface User {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  profilePicture?: string;
  language?: string;
  categories?: string[];
  locations?: string[];
  bookmarks?: string[];
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
}

interface OnboardingData {
  language: string;
  categories: string[];
  locations: string[];
}

interface News {
  _id: string;
  headline: string;
  summary: {
    en: { audio: string, text: string },
    hi: { audio: string, text: string },
    hi_en: { audio: string, text: string }
  };
  date: string;
  country: string;
  state: string;
  city_town: string;
  genre: string;
  keywords: string;
  url: string;
  img: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isOnboardingCompleted: boolean;
  pendingEmail: string | null;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  verifyEmail: (email: string, otp: string) => Promise<AuthResponse>;
  forgotPassword: (email: string) => Promise<AuthResponse>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<AuthResponse>;
  saveOnboarding: (data: OnboardingData) => Promise<AuthResponse>;
  getOnboardingStatus: () => Promise<{ completed: boolean; data?: OnboardingData }>;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
  setPendingEmail: React.Dispatch<React.SetStateAction<string | null>>;
  getBookmarks: () => Promise<{ success: boolean; bookmarks?: News[]; message?: string }>;
  addBookmark: (newsId: string) => Promise<{ success: boolean; message?: string }>;
  removeBookmark: (newsId: string) => Promise<{ success: boolean; message?: string }>;
  isBookmarked: (newsId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      const onboardingStatus = await AsyncStorage.getItem('onboardingCompleted');
      const storedPendingEmail = await AsyncStorage.getItem('pendingEmail');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsOnboardingCompleted(onboardingStatus === 'true');
      }
      
      if (storedPendingEmail) {
        setPendingEmail(storedPendingEmail);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const makeRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
    const url = `${API_URL}/api/auth${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const data = await makeRequest('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data.success && data.token) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      };
    }
  };

  const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
    try {
      const data = await makeRequest('/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (data.success) {
        // Store the email for OTP verification
        setPendingEmail(payload.email);
        await AsyncStorage.setItem('pendingEmail', payload.email);
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  };

  const verifyEmail = async (email: string, otp: string): Promise<AuthResponse> => {
    try {
      const data = await makeRequest('/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });

      if (data.success && data.token) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        // Clear pending email after successful verification
        setPendingEmail(null);
        await AsyncStorage.removeItem('pendingEmail');
        setToken(data.token);
        setUser(data.user);
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Email verification failed',
      };
    }
  };

  const forgotPassword = async (email: string): Promise<AuthResponse> => {
    try {
      const data = await makeRequest('/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      return data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Forgot password request failed',
      };
    }
  };

  const resetPassword = async (email: string, otp: string, newPassword: string): Promise<AuthResponse> => {
    try {
      const data = await makeRequest('/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, otp, newPassword }),
      });

      return data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Password reset failed',
      };
    }
  };

  const saveOnboarding = async (data: OnboardingData): Promise<AuthResponse> => {
    try {
      const response = await makeRequest('/onboarding', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (response.success) {
        await AsyncStorage.setItem('onboardingCompleted', 'true');
        setIsOnboardingCompleted(true);
        
        // Update user data with onboarding info
        if (user) {
          const updatedUser = { ...user, ...data };
          setUser(updatedUser);
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }

      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save onboarding data',
      };
    }
  };

  const getOnboardingStatus = async (): Promise<{ completed: boolean; data?: OnboardingData }> => {
    try {
      const response = await makeRequest('/onboarding');
      return {
        completed: response.completed,
        data: response.onboarding,
      };
    } catch (error) {
      return { completed: false };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('onboardingCompleted');
      await AsyncStorage.removeItem('pendingEmail');
      setToken(null);
      setUser(null);
      setIsOnboardingCompleted(false);
      setPendingEmail(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const getBookmarks = async (): Promise<{ success: boolean; bookmarks?: News[]; message?: string }> => {
    try {
      const response = await makeRequest('/bookmarks');
      return response;
    } catch (error) {
      return { success: false };
    }
  };

  const addBookmark = async (newsId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await makeRequest('/bookmarks', {
        method: 'POST',
        body: JSON.stringify({ newsId }),
      });
      
      if (response.success && user) {
        // Update local user state to include the new bookmark
        const updatedUser = { ...user, bookmarks: [...(user.bookmarks || []), newsId] };
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return response;
    } catch (error) {
      return { success: false };
    }
  };

  const removeBookmark = async (newsId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await makeRequest(`/bookmarks/${newsId}`, {
        method: 'DELETE',
      });
      
      if (response.success && user) {
        // Update local user state to remove the bookmark
        const updatedUser = { 
          ...user, 
          bookmarks: (user.bookmarks || []).filter(id => id !== newsId) 
        };
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return response;
    } catch (error) {
      return { success: false };
    }
  };

  const isBookmarked = (newsId: string): boolean => {
    return user?.bookmarks?.includes(newsId) || false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isOnboardingCompleted,
      pendingEmail,
      login,
      register,
      verifyEmail,
      forgotPassword,
      resetPassword,
      saveOnboarding,
      getOnboardingStatus,
      logout,
      setUser,
      setToken,
      setPendingEmail,
      getBookmarks,
      addBookmark,
      removeBookmark,
      isBookmarked,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
