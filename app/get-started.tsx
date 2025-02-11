import { Link, useRouter } from 'expo-router';
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { ArrowRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function GetStartedScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#343541]">
      {/* Logo and Welcome Section */}
      <View className="flex-1 items-center justify-center px-6">
        <Image
          source={require('@/assets/images/icon.png')}
          style={{ width: width * 0.4, height: width * 0.4 }}
          resizeMode="contain"
        />
        
        <Text className="mt-8 text-3xl font-bold text-white text-center">
          Welcome to Maihu
        </Text>
        
        <Text className="mt-4 text-base text-gray-400 text-center px-6">
          Your AI-powered assistant for seamless conversations and creative solutions
        </Text>
      </View>

      {/* Action Buttons */}
      <View className="px-6 pb-8">
        <TouchableOpacity
          className="bg-[#10a37f] rounded-xl p-4 mb-4"
          onPress={() => router.push('/(auth)/sign-up')}
        >
          <View className="flex-row items-center justify-center">
            <Text className="text-white text-lg font-semibold">Get Started</Text>
            <ArrowRight size={24} color="white" className="ml-2" />
          </View>
        </TouchableOpacity>

        <View className="flex-row items-center justify-center">
          <Text className="text-gray-400">Already have an account?</Text>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/sign-in')}
            className="ml-1"
          >
            <Text className="text-[#10a37f] font-semibold">Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}