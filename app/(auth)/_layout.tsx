import { useAuth } from '@clerk/clerk-expo';
import { Stack, useRouter, usePathname } from 'expo-router';
import React, { useEffect } from 'react';
import { View, ActivityIndicator, BackHandler } from 'react-native';

export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/(app)');
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    const handleBackPress = () => {
      if (pathname === '/(auth)/sign-in' || pathname === '/(auth)/sign-up') {
        BackHandler.exitApp();
        return true; // Prevent default back action
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [pathname]);

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-[#343541]">
        <ActivityIndicator size="large" color="#10a37f" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#343541' },
        animation: 'fade_from_bottom',
        presentation: 'modal',
        animationDuration: 200,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen name="sign-in" options={{ title: 'Sign In', gestureEnabled: false }} />
      <Stack.Screen name="sign-up" options={{ title: 'Sign Up', gestureEnabled: false }} />
      <Stack.Screen name="reset-password" options={{ title: 'Reset Password' }} />
    </Stack>
  );
}
