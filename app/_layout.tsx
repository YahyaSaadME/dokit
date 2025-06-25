import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Slot, Stack, useRouter, SplashScreen, usePathname, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
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
  
  useEffect(() => {
    if (isLoading) return;

    // Check if we're on the verification page and extract email param
    const isVerifyEmailPage = pathname.includes('verify-email');
    const pathParts = pathname.split('?');
    const hasParams = pathParts.length > 1;
    const urlParams = hasParams ? new URLSearchParams(pathParts[1]) : null;
    const hasEmailParam = urlParams?.has('email') || false;
    
    console.log("Auth guard check:", { 
      hasEmailParam, 
      inAuthGroup: isAuthGroup,
      isAuthenticated, 
      pathname,
      userVerified: user?.isVerified || false
    });

    // Special case for verification page
    if (isVerifyEmailPage) {
      return; // Allow access to verification page regardless of auth status
    }

    if (isAuthenticated) {
      // If user is authenticated but not verified, redirect to verification
      if (user && !user.isVerified) {
        if (!isVerifyEmailPage) {
          router.replace('/auth/verify-email');
        }
      } 
      // If user is authenticated and verified but still in auth group, redirect to main app
      else if (user && user.isVerified && isAuthGroup) {
        router.replace('/(tabs)');
      }
    } else {
      // Not authenticated and not in auth group, redirect to login
      if (!isAuthGroup) {
        router.replace('/auth/login');
      }
    }
  }, [isAuthenticated, isLoading, pathname, isAuthGroup, user]);

  // Ensure the children render correctly
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}