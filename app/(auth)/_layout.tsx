import { useAuth } from '@clerk/clerk-expo';
import { Stack, useRouter, usePathname } from 'expo-router';
import React from 'react';
import { View, ActivityIndicator, BackHandler } from 'react-native';

export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/(app)');
    }
  }, [isLoaded, isSignedIn]);

  // Handle back button press
  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // If we're on sign-in or sign-up, exit the app instead of going back
      if (pathname === '/(auth)/sign-in' || pathname === '/(auth)/sign-up') {
        BackHandler.exitApp();
        return true;
      }
      return false;
    });

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
      <Stack.Screen 
        name="sign-in" 
        options={{ 
          title: 'Sign In',
          gestureEnabled: false // Disable gesture navigation
        }} 
      />
      <Stack.Screen 
        name="sign-up" 
        options={{ 
          title: 'Sign Up',
          gestureEnabled: false // Disable gesture navigation
        }} 
      />
      <Stack.Screen name="reset-password" options={{ title: 'Reset Password' }} />
    </Stack>
  );
}
