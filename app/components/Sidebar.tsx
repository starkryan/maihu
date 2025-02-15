import { Home, User, LogOut, X } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

type SidebarProps = {
  slideAnim: Animated.Value;
  toggleSidebar: () => void;
  onSignOutPress: () => void;
};

const navigationItems = [
  { label: 'Home', icon: Home, route: '/' },
  { label: 'Profile', icon: User, route: '/profile' },
];

const Sidebar = ({ slideAnim, toggleSidebar, onSignOutPress }: SidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = useCallback(
    (route: string) => {
      router.push(route as any);
      toggleSidebar();
    },
    [router, toggleSidebar]
  );

  return (
    <Animated.View
      className="absolute left-0 top-0 h-full w-[260px] bg-[#343541] border-r border-gray-700 shadow-lg shadow-black/50"
      style={{ transform: [{ translateX: slideAnim }] }}
    >
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-600">
          <Text className="text-lg font-semibold text-white">Menu</Text>
          <TouchableOpacity 
            onPress={toggleSidebar}
            className="p-2 rounded-full bg-gray-600/30 active:bg-gray-600/50"
            accessibilityRole="button"
          >
            <X size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Navigation Links */}
        <View className="flex-1 px-4 pt-4">
          {navigationItems.map((item) => {
            const isActive = pathname === item.route;
            return (
              <TouchableOpacity
                key={item.route}
                onPress={() => handleNavigation(item.route)}
                className={`flex-row items-center px-4 py-4 mb-3 rounded-xl ${
                  isActive 
                    ? 'bg-[#40414f] border-2 border-[#10a37f]' 
                    : 'bg-transparent active:bg-gray-700/40'
                }`}
                accessibilityRole="button"
              >
                <item.icon size={20} color={isActive ? '#10a37f' : '#9ca3af'} />
                <Text className={`ml-4 text-base font-medium ${
                  isActive ? 'text-[#10a37f]' : 'text-gray-300'
                }`}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sign Out Button */}
        <View className="px-4 py-4 border-t border-gray-600">
          <TouchableOpacity 
            className="flex-row items-center px-4 py-4 rounded-xl bg-red-500/10 active:bg-red-500/20"
            onPress={onSignOutPress}
            accessibilityRole="button"
          >
            <LogOut size={20} color="#ef4444" />
            <Text className="ml-4 text-red-500 text-base font-medium">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};

export default Sidebar;
