import React, { useEffect } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';
import NavigationGuard from '@/components/NavigationGuard';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootLayoutNav />
      </ThemeProvider>
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  return (
    <NavigationGuard>
      <StatusBar style="auto" />
      <Stack>
        {/* Authentication screens */}
        <Stack.Screen
          name="auth/welcome"
          options={{
            title: 'Welcome',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="auth/login"
          options={{
            title: 'Login',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="auth/register"
          options={{
            title: 'Register',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="auth/verify-email"
          options={{
            title: 'Verify Email',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="auth/forgot-password"
          options={{
            title: 'Forgot Password',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="auth/reset-password"
          options={{
            title: 'Reset Password',
            headerShown: false,
          }}
        />

        {/* Onboarding screens */}
        <Stack.Screen
          name="onboarding/language"
          options={{
            title: 'Select Language',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="onboarding/category"
          options={{
            title: 'Select Categories',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="onboarding/location"
          options={{
            title: 'Select Locations',
            headerShown: false,
          }}
        />

        {/* Main app screens */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </NavigationGuard>
  );
}