import { useSignIn, useClerk } from '@clerk/clerk-expo';
import { ArrowLeft, X, Lock, Mail, Eye, EyeOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { useToast } from '../Toast/components/ToastManager';
import { OtpInput } from "react-native-otp-entry";
import Modal from 'react-native-modal';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { ErrorBoundary } from 'react-error-boundary';


const ForgotPassword = () => {
  const { signIn, isLoaded } = useSignIn();
  const { signOut } = useClerk();
  const router = useRouter();
  const { error: toastError, success } = useToast();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [code, setCode] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [showOTPModal, setShowOTPModal] = React.useState(false);
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const [isValidEmail, setIsValidEmail] = React.useState(true);
  const [isValidPassword, setIsValidPassword] = React.useState(true);
  const [resendTimer, setResendTimer] = React.useState(0);
  const [canResend, setCanResend] = React.useState(true);
  const [passwordStrength, setPasswordStrength] = React.useState({
    score: 0,
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    },
  });
  const [resetAttempts, setResetAttempts] = React.useState(0);
  const [nextResetTime, setNextResetTime] = React.useState<Date | null>(null);
  const [isOTPValid, setIsOTPValid] = React.useState(true);

  React.useEffect(() => {
    if (resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  React.useEffect(() => {
    if (nextResetTime && new Date() >= nextResetTime) {
      setResetAttempts(0);
      setNextResetTime(null);
    }
  }, [nextResetTime]);

  const startResendTimer = () => {
    setResendTimer(30);
    setCanResend(false);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (pass: string) => {
    const requirements = {
      length: pass.length >= 8,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[^A-Za-z0-9]/.test(pass),
    };

    const score = Object.values(requirements).filter(Boolean).length;

    setPasswordStrength({
      score,
      requirements,
    });

    return score === 5;
  };

  const onRequestOTP = async () => {
    if (!isLoaded) return;

    if (resetAttempts >= 2) {
      if (!nextResetTime) {
        const nextHour = new Date();
        nextHour.setHours(nextHour.getHours() + 1);
        setNextResetTime(nextHour);
      }
      toastError('Too many reset attempts. Please try again in 1 hour.');
      return;
    }


    if (!validateEmail(emailAddress)) {
      setIsValidEmail(false);
      toastError('Please enter a valid email address');
      return;
    }

    setIsValidEmail(true);

    setIsLoading(true);

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: emailAddress,
      });

      setShowOTPModal(true);
      startResendTimer();
      success('OTP sent to your email');

      setResetAttempts((prev) => prev + 1);

    } catch (err: unknown) {
      if (err instanceof Error) {
        const clerkError = err as { errors?: Array<{ message: string }> };
        toastError(clerkError.errors?.[0]?.message || err.message);

      } else {
        toastError('Failed to send OTP');
      }


    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend || !isLoaded) return;

    if (resetAttempts >= 2) {
      if (!nextResetTime) {
        const nextHour = new Date();
        nextHour.setHours(nextHour.getHours() + 1);
        setNextResetTime(nextHour);
      }
      toastError('Too many reset attempts. Please try again in 1 hour.');

      return;
    }


    setIsLoading(true);
    try {
      await signIn.create({
        identifier: emailAddress,
        strategy: 'reset_password_email_code',
      });
      startResendTimer();
      success('New OTP sent to your email');


    } catch (err: unknown) {
      if (err instanceof Error) {
        toastError((err as any).errors?.[0]?.message || err.message);
      } else {
        toastError('Failed to resend OTP');


      }
    } finally {
      setIsLoading(false);
    }
  };

  const onResetPassword = async () => {
    if (!isLoaded) return;

    if (!validatePassword(password)) {
      setIsValidPassword(false);
      toastError('Password must meet all requirements');
      return;
    }

    if (!code) {
      toastError('Please enter the verification code');
      return;
    }

    setIsValidPassword(true);
    setIsLoading(true);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      });

      if (result.status === 'complete') {
        setShowOTPModal(false);
        await signOut();
        await SecureStore.deleteItemAsync('clerk-db-jwt');
        await SecureStore.deleteItemAsync('clerk-js-session-token');
        await SecureStore.deleteItemAsync('__clerk_client_jwt');

        success('Password successfully updated! Please sign in with your new password');
        setTimeout(() => {
          router.replace('/(auth)/sign-in');
        }, 100);
      }
    } catch (err: unknown) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIsOTPValid(false);
      
      if (err instanceof Error) {
        const clerkError = err as { errors?: Array<{ message: string }> };
        const errorMessage = clerkError.errors?.[0]?.message || err.message;
        
        if (errorMessage.toLowerCase().includes('code')) {
          toastError('The verification code you entered is incorrect. Please check your email and try again.');
        } else if (errorMessage.toLowerCase().includes('expired')) {
          toastError('The verification code has expired. Please request a new code.');
        } else {
          toastError(errorMessage);
        }
      } else {
        toastError('An error occurred while resetting your password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderPasswordStrength = () => {
    const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColors = ['#ff4444', '#ffa700', '#ffeb3b', '#00c853', '#00c853'];

    return (
      <View className="mt-2">
        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-300">Password Strength: </Text>
          <Text style={{ color: strengthColors[passwordStrength.score - 1] }}>
            {strengthLabels[passwordStrength.score - 1]}
          </Text>
        </View>
        <View className="flex-row space-x-1">
          {[1, 2, 3, 4, 5].map((index) => (
            <View
              key={index}
              className="flex-1 h-1 rounded-full"
              style={{
                backgroundColor:
                  passwordStrength.score >= index
                    ? strengthColors[passwordStrength.score - 1]
                    : '#4b5563',
              }}
            />
          ))}
        </View>
      </View>
    );
  };

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-[#343541]">
        <ActivityIndicator size="large" color="#10a37f" />
      </View>
    );
  }
  return (
    <ErrorBoundary fallbackRender={({ error }) => (
      <View className="flex-1 items-center justify-center bg-[#343541]">
        <Text className="text-white">Something went wrong: {error.message}</Text>
      </View>
    )}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#343541' }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}>
              <View className="pt-12 px-4 mb-2">
                <Pressable 
                  onPress={() => router.back()}
                  className="flex-row items-center p-2 rounded-full bg-gray-600/30 w-10">
                  <ArrowLeft size={16} color="#9ca3af" />
                </Pressable>
              </View>

              <View className="flex-1 justify-center py-2">
                <View className="mb-6 px-6">
                  <Text className="mb-1.5 text-center text-2xl font-bold text-white">
                    Reset Password
                  </Text>
                  <Text className="text-center text-sm text-gray-300">
                    Enter your email to receive a verification code
                  </Text>
                </View>

                <View className="space-y-4 px-6">
                  {/* Email Input */}
                  <View>
                    <Text className="mb-2.5 font-medium text-gray-300">Email address</Text>
                    <View className="relative">
                      <TextInput
                        className={`w-full rounded-xl border-2 bg-transparent p-4 pl-12 text-white text-base ${
                          isValidEmail ? 'border-gray-600' : 'border-red-500'
                        }`}
                        autoCapitalize="none"
                        value={emailAddress}
                        placeholder="Enter email"
                        placeholderTextColor="#9ca3af"
                        onChangeText={(text) => {
                          setEmailAddress(text);
                          setIsValidEmail(true);
                        }}
                        keyboardType="email-address"
                      />
                      <View className="absolute left-4 top-[17px]">
                        <Mail size={20} color="#9ca3af" />
                      </View>
                    </View>
                    {!isValidEmail && (
                      <Text className="mt-2 text-sm text-red-500">
                        Please enter a valid email address
                      </Text>
                    )}
                  </View>
                </View>

                {/* Send Code Button */}
                <View className="mt-6 px-6">
                  <TouchableOpacity
                    className={`w-full rounded-xl bg-[#10a37f] p-4 shadow-sm ${
                      isLoading ? 'opacity-80' : 'active:bg-[#0e906f]'
                    }`}
                    onPress={onRequestOTP}
                    disabled={isLoading}>
                    {isLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-center text-base font-semibold text-white">
                        Send Verification Code
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Sign In Link */}
                <View className="mt-4 flex-row justify-center">
                  <Text className="text-gray-300">Remember your password? </Text>
                  <Pressable onPress={() => router.replace('/(auth)/sign-in')}>
                    <Text className="font-semibold text-[#10a37f]">Sign in</Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>

        {/* OTP Modal */}
        <Modal
          isVisible={showOTPModal}
          statusBarTranslucent
          onBackdropPress={() => setShowOTPModal(false)}
          onBackButtonPress={() => setShowOTPModal(false)}
          useNativeDriver
          style={{ margin: 0 }}
          avoidKeyboard>
          <View className="flex-1 justify-end">
            <View className="rounded-t-3xl bg-[#343541] p-6">
              <View className="mb-6 items-end">
                <Pressable 
                  onPress={() => setShowOTPModal(false)}
                  className="p-2 rounded-full bg-gray-600/30">
                  <X size={16} color="#9ca3af" />
                </Pressable>
              </View>

              <Text className="mb-1.5 text-2xl font-bold text-white">
                Verify Your Email
              </Text>
              <Text className="mb-6 text-sm text-gray-300">
                Enter the verification code sent to {emailAddress}
              </Text>

              <View className="mb-8">
                <OtpInput
                  numberOfDigits={6}
                  onFilled={(text) => {
                    setCode(text);
                    setIsOTPValid(true);
                  }}
                  theme={{
                    pinCodeContainerStyle: {
                      backgroundColor: "#40414f",
                      borderColor: isOTPValid ? "#565869" : "#ef4444",
                      borderRadius: 12,
                      height: 52,
                      borderWidth: 2,
                    },
                    focusStickStyle: { 
                      backgroundColor: isOTPValid ? "#10a37f" : "#ef4444" 
                    },
                    focusedPinCodeContainerStyle: {
                      borderColor: isOTPValid ? "#10a37f" : "#ef4444",
                      borderWidth: 2,
                    },
                    pinCodeTextStyle: { 
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />
              </View>

              {/* New Password Input */}
              <View className="mb-6">
                <Text className="mb-2.5 font-medium text-gray-300">New Password</Text>
                <View className="relative">
                  <TextInput
                    className={`w-full rounded-xl border-2 bg-transparent p-4 pl-12 pr-12 text-white text-base ${
                      isValidPassword ? 'border-gray-600' : 'border-red-500'
                    }`}
                    secureTextEntry={!passwordVisible}
                    value={password}
                    placeholder="Enter new password"
                    placeholderTextColor="#9ca3af"
                    onChangeText={(text) => {
                      setPassword(text);
                      setIsValidPassword(true);
                    }}
                  />
                  <View className="absolute left-4 top-[17px]">
                    <Lock size={20} color="#9ca3af" />
                  </View>
                  <Pressable
                    className="absolute right-4 top-[17px]"
                    onPress={() => setPasswordVisible(!passwordVisible)}>
                    {passwordVisible ? (
                      <EyeOff size={20} color="#9ca3af" />
                    ) : (
                      <Eye size={20} color="#9ca3af" />
                    )}
                  </Pressable>
                </View>
                {password && renderPasswordStrength()}
              </View>

              {/* Reset Password Button */}
              <TouchableOpacity
                className={`w-full rounded-xl bg-[#10a37f] p-4 shadow-sm ${
                  isLoading ? 'opacity-80' : 'active:bg-[#0e906f]'
                }`}
                onPress={onResetPassword}
                disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-center text-base font-semibold text-white">
                    Reset Password
                  </Text>
                )}
              </TouchableOpacity>

              {/* Resend Code */}
              <View className="mt-4 flex-row justify-center items-center">
                {resendTimer > 0 ? (
                  <Text className="text-gray-400">
                    Resend code in {resendTimer}s
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleResendOTP}>
                    <Text className="text-[#10a37f]">
                      Didn't receive code? Resend
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ErrorBoundary>
  );
};

export default ForgotPassword;