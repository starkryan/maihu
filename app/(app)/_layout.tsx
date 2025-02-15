import { useAuth, useClerk } from '@clerk/clerk-expo';
import { Redirect, Stack, useRouter } from 'expo-router';
import { PenSquare, AlignLeft } from 'lucide-react-native';
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import Modal from 'react-native-modal';
import Sidebar from '../components/Sidebar';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

const LayoutGroup = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut, redirectToSignIn } = useClerk();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-280)).current;

  if (!isLoaded) {
    return null; // Keeps splash screen visible until auth loads
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);

    Animated.timing(slideAnim, {
      toValue: newState ? 0 : -280,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const confirmSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      redirectToSignIn();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#343541]">
      <StatusBar style="light" />

      {/* Header */}
      <View className="h-14 flex-row items-center justify-between px-4 bg-[#343541] border-b border-gray-600">
        <TouchableOpacity
          onPress={toggleSidebar}
          activeOpacity={0.7}
          className="w-10 h-10 items-center justify-center rounded-full bg-gray-600/30"
        >
          <AlignLeft size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          className="w-10 h-10 items-center justify-center rounded-full bg-gray-600/30"
        >
          <PenSquare size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* Stack Navigator */}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#343541' },
          animation: 'none',
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Home' }} />
        <Stack.Screen name="profile" options={{ title: 'Profile' }} />
      </Stack>

      {/* Sidebar Component */}
      <Sidebar
        slideAnim={slideAnim}
        toggleSidebar={toggleSidebar}
        onSignOutPress={() => setShowModal(true)}
      />

      {/* Modal */}
      <Modal
        isVisible={showModal}
        onBackdropPress={() => setShowModal(false)}
        backdropOpacity={0.7}
        animationIn="fadeIn"
        animationOut="fadeOut"
        style={{ margin: 20, justifyContent: 'center', alignItems: 'center',  }}
      >
        <View className="w-full max-w-sm rounded-2xl bg-[#40414F] p-6 border-2 border-gray-600 items-center">
          <Text className="text-2xl font-bold text-white text-center mb-4">
            Sign Out
          </Text>
          <Text className="text-gray-300 text-center text-base mb-6">
            Are you sure you want to sign out?
          </Text>
          <View className="flex-row w-full justify-between">
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              activeOpacity={0.7}
              className="flex-1 px-6 py-3.5 rounded-xl border-2 border-gray-600 bg-transparent mr-2"
            >
              <Text className="text-white text-base font-medium text-center">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={confirmSignOut}
              disabled={loading}
              activeOpacity={0.7}
              className={`flex-1 px-6 py-3.5 rounded-xl bg-[#ff1111] active:bg-[#ff4f4f] ${loading ? 'opacity-50' : ''}`}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-base font-medium text-center">
                  Confirm
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default LayoutGroup;
