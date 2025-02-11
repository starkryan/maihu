import { tokenCache } from '@/utils/cache';
import '../global.css';
import 'react-native-url-polyfill/auto';
import { ClerkProvider } from '@clerk/clerk-expo';
import { getRandomValues as expoCryptoGetRandomValues } from 'expo-crypto';
import { Stack } from 'expo-router';
import * as React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import ToastManager from './Toast/components/ToastManager';

// Ensure crypto polyfill
if (!global.crypto) {
  global.crypto = {
    getRandomValues: expoCryptoGetRandomValues,
  } as Crypto;
}

// Retrieve Clerk publishable key
const publishableKey = "pk_test_Z3Jvd24td2FscnVzLTEuY2xlcmsuYWNjb3VudHMuZGV2JA";
if (!publishableKey) {
  throw new Error("Missing Clerk Publishable Key");
}

// Prevent auto-hide of SplashScreen
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <RootLayoutNav />
    </ClerkProvider>
  );
}

function RootLayoutNav() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Perform any startup logic here (like fetching user data)
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return (
      <View className="flex-1 items-center justify-center bg-[#343541]">
        <ActivityIndicator size="large" color="#10a37f" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#343541" },
        }}
      >
        <Stack.Screen name="index" />         
        <Stack.Screen name="get-started" />   
        <Stack.Screen name="(auth)" />       
        <Stack.Screen name="(app)" />        
      </Stack>
      <ToastManager />
    </SafeAreaProvider>
  );
}
