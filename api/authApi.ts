import axios from 'axios';
import Constants from 'expo-constants';
import { AuthResponse, GeneralResponse, ProfileResponse, UserData } from '../types/api';

// Base URL for the API - use your backend URL
const API_URL = 'http://10.0.2.2:3000/api'; // For Android emulator
// const API_URL = 'http://localhost:3000/api'; // For iOS simulator or web

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to set auth token for future requests
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Auth API calls
export const authApi = {
  // Register a new user
  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/auth/register', { name, email, password });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Verify email with OTP
  verifyEmail: async (email: string, otp: string): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/auth/verify-email', { email, otp });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Login user - simplified error handling
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', { email, password });
      return response.data;
    } catch (error:any) {
      if (error.response && error.response.data) {
        // Return the server's error response
        return error.response.data;
      }
      // For network errors
      throw new Error('Network error. Please check your connection.');
    }
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<GeneralResponse> => {
    try {
      const response = await api.post<GeneralResponse>('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Reset password
  resetPassword: async (email: string, otp: string, newPassword: string): Promise<GeneralResponse> => {
    try {
      const response = await api.post<GeneralResponse>('/auth/reset-password', { email, otp, newPassword });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get user profile
  getProfile: async (): Promise<ProfileResponse> => {
    try {
      const response = await api.get<ProfileResponse>('/auth/profile');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update user profile
  updateProfile: async (data: { name?: string; profilePicture?: string }): Promise<ProfileResponse> => {
    try {
      const response = await api.put<ProfileResponse>('/auth/profile', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// Helper to handle API errors
const handleApiError = (error: any): string => {
  console.log("API Error:", error);
  
  if (error.response) {
    // Server responded with an error status
    const message = error.response.data?.message || 
                    error.response.data?.error || 
                    'An error occurred with the request.';
    
    // For debugging - log the full response
    console.log('API error response:', {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data
    });
    
    return message;
  } else if (error.request) {
    // Request was made but no response
    console.log('API no response error:', error.request);
    return 'No response received from server. Please check your internet connection.';
  } else {
    // Other errors
    console.log('API setup error:', error.message);
    return error.message || 'An unknown error occurred.';
  }
};

export default api;
