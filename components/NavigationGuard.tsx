import React, { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isOnboardingCompleted } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return; // Don't redirect while loading

    const inAuthGroup = segments[0] === 'auth';
    const inOnboardingGroup = segments[0] === 'onboarding';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!user) {
      // User is not authenticated, redirect to welcome
      if (!inAuthGroup) {
        router.replace('/auth/welcome');
      }
    } else if (!isOnboardingCompleted) {
      // User is authenticated but hasn't completed onboarding
      if (!inOnboardingGroup) {
        router.replace('/onboarding/language');
      }
    } else {
      // User is authenticated and has completed onboarding
      if (inAuthGroup || inOnboardingGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [user, loading, isOnboardingCompleted, segments, router]);

  return <>{children}</>;
} 