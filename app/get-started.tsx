import { useState, useRef, useEffect } from 'react';
import { Animated, View, Text, Image, Pressable, ScrollView, SafeAreaView } from "react-native";
import Modal from "react-native-modal";
import { Youtube, X } from "lucide-react-native";
import { Link } from "expo-router";

const WelcomeScreen = () => {
  const [isPrivacyModalVisible, setPrivacyModalVisible] = useState(false);
  const creativeImageAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(creativeImageAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const renderImage = (source: any, className: string, accessibilityLabel: string) => (
    <Image
      source={source}
      className={className}
      accessibilityLabel={accessibilityLabel}
      accessible={true}
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-[#343541]">
      <View className="flex-1 justify-between">
        <Animated.View 
          className="w-full h-40 items-center justify-center mt-8"
          style={{
            opacity: creativeImageAnim,
            transform: [
              { 
                scale: creativeImageAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                  extrapolate: 'clamp'
                })
              },
              { 
                translateY: creativeImageAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                  extrapolate: 'clamp'
                })
              }
            ]
          }}
        >
          <Image
            source={require("../assets/images/creative.png")}
            className="w-40 h-16 resize-contain"
            accessibilityLabel="Creative illustration"
            accessible={true}
          />
        </Animated.View>

        <View className="flex-1 justify-center items-center px-8 my-8">
          <Image
            source={require("../assets/images/logo.png")}
            className="w-32 h-12 resize-contain"
            accessibilityLabel="App icon"
            accessible={true}
          />

          <Text className="mt-6 text-center text-3xl font-bold text-white mb-4">
            Welcome to Lemi
          </Text>

          <Text className="text-center text-xl text-gray-300 px-4 leading-8">
            <Text>Your AI-powered </Text>
            <Youtube size={28} color="red" />
            <Text>script writing assistant. Create engaging </Text>
            <Text className="text-white font-semibold">content effortlessly.</Text>
          </Text>
        </View>

        <View className="gap-6 px-8 pb-12 mb-8">
          <Link href="/(auth)/sign-up" asChild>
            <Pressable 
              className="w-full rounded-xl bg-[#10a37f] py-4 shadow-lg" 
              android_ripple={{ color: 'rgba(255, 255, 255, 0.3)' }}
              style={({ pressed }) => [
                {
                  backgroundColor: pressed ? '#1ab391' : '#10a37f',
                },
              ]}
            >
              <Text className="text-center text-lg font-bold text-white">
                Get Started
              </Text>
            </Pressable>
          </Link>

          <Link href="/(auth)/sign-in" asChild>
            <Pressable className="w-full rounded-xl border-2 border-gray-600 bg-transparent py-4" android_ripple={{ color: 'rgba(255, 255, 255, 0.3)' }}>
              <Text className="text-center text-lg font-bold text-white">
                I already have an account
              </Text>
            </Pressable>
          </Link>

          <Text className="text-center text-sm text-gray-400">
            By continuing, you agree to our{' '}
            <Text 
              className="text-[#10a37f]" 
              onPress={() => setPrivacyModalVisible(true)}
            >
              Privacy Policy
            </Text>
          </Text>
        </View>
      </View>

      <Modal
        isVisible={isPrivacyModalVisible}
        onBackdropPress={() => setPrivacyModalVisible(false)}
        onBackButtonPress={() => setPrivacyModalVisible(false)}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        backdropOpacity={0.5}
        backdropTransitionOutTiming={0}
        hideModalContentWhileAnimating={true}
        accessible={true}
        accessibilityLabel="Privacy Policy"
        accessibilityRole="alert"
        useNativeDriver={true}
      >
        <View className="bg-[#343541] rounded-2xl p-6" style={{ maxHeight: '80%' }}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-white">Terms & Privacy Policy</Text>
            <Pressable onPress={() => setPrivacyModalVisible(false)}>
              <X size={24} color="#9ca3af" />
            </Pressable>
          </View>
          
          <ScrollView 
            className="flex-grow"
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <Text className="text-gray-300 leading-6">
              Welcome to Lemi! By using our app, you agree to these terms:

              {'\n\n'}1. Data Collection: We collect necessary information to improve your experience.
              
              {'\n\n'}2. Content Creation: You're responsible for the content you create.
              
              {'\n\n'}3. AI Usage: Our AI assists in content creation but final results depend on your input.
              
              {'\n\n'}4. Privacy: We protect your personal information and don't share it with third parties.
              
              {'\n\n'}5. Updates: Terms may be updated, and continued use means acceptance of changes.
              
              {'\n\n'}For questions, contact support@lemi.ai
            </Text>
          </ScrollView>
          
          <Pressable
            className="w-full rounded-xl bg-[#10a37f] p-4 mt-4 shadow-sm active:bg-[#0e906f]"
            onPress={() => setPrivacyModalVisible(false)}
          >
            <Text className="text-center text-lg font-semibold text-white">I Understand</Text>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default WelcomeScreen;