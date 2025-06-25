import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function ProfileLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  // Protect the profile route - only for authenticated users
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, isLoading]);

  // Return null during loading or if not authenticated
  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
