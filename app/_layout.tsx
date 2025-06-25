import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Slot, Stack, useRouter, SplashScreen, usePathname, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { View, ActivityIndicator } from 'react-native';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      // Hide the splash screen after the fonts have loaded
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style="auto" />
      <AuthenticationGuard>
        <Slot />
      </AuthenticationGuard>
    </ThemeProvider>
  );
}

// Authentication guard component
function AuthenticationGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const pathname = usePathname();
  const segments = useSegments();
  const router = useRouter();

  const isAuthGroup = segments[0] === 'auth';
  const [isNavigating, setIsNavigating] = useState(false);
  
  useEffect(() => {
    // Skip redirection if we're already in the auth group or we're loading
    if (isLoading || isNavigating) return;
    
    const isLoginPage = pathname === '/auth/login';
    
    if (isAuthenticated) {
      // If authenticated but on login page, redirect to home
      if (isLoginPage && !isNavigating) {
        setIsNavigating(true);
        router.replace('/(tabs)');
        setTimeout(() => setIsNavigating(false), 1000);
      }
    } else {
      // If not authenticated and not on an auth page, redirect to login
      if (!isAuthGroup && !isNavigating) {
        setIsNavigating(true);
        router.replace('/auth/login');
        setTimeout(() => setIsNavigating(false), 1000);
      }
    }
  }, [isAuthenticated, isLoading, pathname, isNavigating]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}