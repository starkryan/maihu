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
import { NetworkProvider } from './NetworkContext';


if (!global.crypto) {
  global.crypto = {
    getRandomValues: expoCryptoGetRandomValues,
  } as Crypto;
}

// Retrieve Clerk publishable key
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
if (!publishableKey) {
  throw new Error("Missing Clerk Publishable Key. Make sure it's set in your .env file.");
}

// Move constants outside of the component
const BACKGROUND_COLOR = '#343541';
const LOADING_COLOR = '#10a37f';

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await SplashScreen.preventAutoHideAsync();
        setAppIsReady(true);
      } catch (e) {
        console.error("Error during app preparation:", e);
      } finally {
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  if (!appIsReady) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: BACKGROUND_COLOR }}>
        <ActivityIndicator size="large" color={LOADING_COLOR} />
      </View>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey!} tokenCache={tokenCache}>
      <NetworkProvider>
        <SafeAreaProvider>
          <View className="flex-1" style={{ backgroundColor: BACKGROUND_COLOR }}>
            <StatusBar style="light" backgroundColor={BACKGROUND_COLOR} />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: BACKGROUND_COLOR },
                animation: 'fade',
              }}
            >
              <Stack.Screen name="index" />         
              <Stack.Screen name="get-started" />   
              <Stack.Screen name="(auth)" />       
              <Stack.Screen name="(app)" />        
            </Stack>
            <ToastManager />
          </View>
        </SafeAreaProvider>
      </NetworkProvider>
    </ClerkProvider>
  );
}
