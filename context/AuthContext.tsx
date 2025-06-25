import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { authApi, setAuthToken } from '../api/authApi';
import storage from '../utils/storage';
import { AuthResponse, GeneralResponse, ProfileResponse, UserData } from '../types/api';

// Register for native redirects
if (Platform.OS !== 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

// Create a custom auth session result type that matches our needs
interface CustomAuthSession {
  accessToken: string;
  expiresIn: number;
  issuedAt: number;
}

interface AuthContextProps {
  user: UserData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (name: string, email: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  verifyEmail: (email: string, otp: string) => Promise<AuthResponse>;
  forgotPassword: (email: string) => Promise<GeneralResponse>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<GeneralResponse>;
  updateProfile: (data: { name?: string; profilePicture?: string }) => Promise<ProfileResponse>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextProps>({} as AuthContextProps);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [authSession, setAuthSession] = useState<CustomAuthSession | null>(null);
  // Add a state to track if we're in an error state
  const [isErrorState, setIsErrorState] = useState(false);

  // Check if the user is authenticated on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);
        const token = await storage.getToken();
        const userData = await storage.getUser();

        if (token && userData) {
          setAuthToken(token);
          setUser(userData);
          
          // Create a custom auth session object
          setAuthSession({
            accessToken: token,
            expiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
            issuedAt: Date.now(),
          });

          try {
            await authApi.getProfile();
          } catch (err) {
            console.log('Token expired or invalid, logging out');
            await handleLogout();
          }
        }
      } catch (error) {
        console.error('Loading user error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Handle session expiry
  useEffect(() => {
    if (!authSession) return;
    
    const expirationTime = authSession.issuedAt + (authSession.expiresIn * 1000);
    const now = Date.now();
    const expiryTime = expirationTime - now;
    
    if (expiryTime <= 0) {
      // Session already expired
      handleLogout();
      return;
    }
    
    // Set a timer to logout when the session expires
    const timer = setTimeout(() => {
      handleLogout();
    }, expiryTime);
    
    return () => clearTimeout(timer);
  }, [authSession]);

  // Improved error handling
  const handleError = useCallback((err: any, defaultMsg: string) => {
    let errorMessage = defaultMsg;
    if (typeof err === 'object' && err !== null && 'message' in err) {
      errorMessage = String(err.message);
    } else if (typeof err === 'string') {
      errorMessage = err;
    }
    setError(errorMessage);
    setIsErrorState(true);
    return errorMessage;
  }, []);

  // Clear both error and error state
  const clearError = useCallback(() => {
    setError(null);
    setIsErrorState(false);
  }, []);

  const handleLogout = async () => {
    await storage.clearAll();
    setAuthToken(null);
    setUser(null);
    setAuthSession(null);
  };

  // Simplified login function
  const login = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    setIsLoading(true);
    
    try {
      const response = await authApi.login(email, password);
      
      // If successful, update auth state
      if (response.success) {
        // Save token
        await storage.saveToken(response.token || '');
        
        // Save user data
        if (response.user) {
          setUser(response.user);
          await storage.saveUser(response.user);
        }
        
        // Set auth token for API calls
        if (response.token) {
          setAuthToken(response.token);
          
          setAuthSession({
            accessToken: response.token,
            expiresIn: 30 * 24 * 60 * 60,
            issuedAt: Date.now(),
          });
        }
      }
      
      return response;
    } catch (error) {
      // Handle error and return formatted response
      console.log('Login error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed'
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register a new user - improve error handling
  const register = useCallback(async (name: string, email: string, password: string): Promise<AuthResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      // Generate a session state for security
      const state = await storage.generateSessionState();
      
      const response = await authApi.register(name, email, password);
      
      if (!response || !response.user) {
        throw new Error('Invalid response from server');
      }
      
      const userData = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        isVerified: response.user.isVerified,
      };
      
      setUser(userData);
      await storage.saveUser(userData);
      
      // Save email specifically for verification
      await storage.saveEmailToVerify(email);
      
      return response;
    } catch (err) {
      // Improved error message handling
      const errorMessage = handleError(err, 'Registration failed. Please try again.');
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // Verify email with OTP
  const verifyEmail = useCallback(async (email: string, otp: string): Promise<AuthResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.verifyEmail(email, otp);
      
      if (response && response.success) {
        if (response.token) {
          await storage.saveToken(response.token);
          setAuthToken(response.token);
        }
        
        if (response.user) {
          await storage.saveUser(response.user);
          setUser(response.user);
        }
        
        await storage.removeEmailToVerify(); // Clean up email from storage
        
        // Create a custom auth session object
        if (response.token) {
          setAuthSession({
            accessToken: response.token,
            expiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
            issuedAt: Date.now(),
          });
        }
      }
      
      return response;
    } catch (err) {
      // Improved error message handling
      const errorMessage = handleError(err, 'Email verification failed. Please try again.');
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // Forgot password
  const forgotPassword = useCallback(async (email: string): Promise<GeneralResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.forgotPassword(email);
      return response;
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : 'Failed to request password reset. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string, otp: string, newPassword: string): Promise<GeneralResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.resetPassword(email, otp, newPassword);
      return response;
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : 'Password reset failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (data: { name?: string; profilePicture?: string }): Promise<ProfileResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.updateProfile(data);
      
      // Update user in storage and state
      if (response.user) {
        await storage.saveUser(response.user);
        setUser(response.user);
      }
      
      return response;
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : 'Failed to update profile. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout user
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await handleLogout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user && !!authSession,
    isErrorState,
    login,
    register,
    logout,
    verifyEmail,
    forgotPassword,
    resetPassword,
    updateProfile,
    error,
    clearError,
  }), [
    user, 
    isLoading,
    authSession,
    isErrorState,
    login, 
    register, 
    logout, 
    verifyEmail, 
    forgotPassword, 
    resetPassword, 
    updateProfile, 
    error, 
    clearError
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};