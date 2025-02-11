import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIRST_TIME_KEY = 'hasLaunchedBefore';

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem(FIRST_TIME_KEY);
        if (hasLaunched === null) {
          await AsyncStorage.setItem(FIRST_TIME_KEY, 'true');
          setIsFirstLaunch(true);
        } else {
          setIsFirstLaunch(false);
        }
      } catch (error) {
        console.error('Error checking first launch:', error);
        setIsFirstLaunch(false);
      }
    };

    checkFirstLaunch();
  }, []);

  useEffect(() => {
    if (isLoaded && isFirstLaunch !== null) {
      if (isSignedIn) {
        router.replace('/(app)');
      } else if (isFirstLaunch) {
        router.replace('/get-started');
      } else {
        router.replace('/(auth)/sign-in');
      }
    }
  }, [isLoaded, isSignedIn, isFirstLaunch]);

  if (!isLoaded || isFirstLaunch === null) {
    return (
      <View className="flex-1 items-center justify-center bg-[#343541]">
        <ActivityIndicator size="large" color="#10a37f" />
      </View>
    );
  }

  return null;
}
