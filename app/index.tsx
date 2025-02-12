import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from 'expo-router';
import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        router.replace('/(app)');
      } else {
        router.replace('/get-started');
      }
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-[#343541]">
        <ActivityIndicator size="large" color="#10a37f" />
      </View>
    );
  }

  return null;
}
