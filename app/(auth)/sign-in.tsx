import { useSignIn } from '@clerk/clerk-expo';
import { Link, Redirect, useRouter } from 'expo-router';
import React from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Animated,
  Easing,

  Image,
  Pressable,
  SafeAreaView,
  BackHandler,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRef } from 'react';
import { debounce } from 'lodash';
import Modal from 'react-native-modal';
import * as Haptics from 'expo-haptics';

import { useOAuthFlow } from '../../utils/oauth';
import { OtpInput } from "react-native-otp-entry";
import { ArrowLeft, X, Lock, Mail } from 'lucide-react-native';
import { useToast } from '../Toast/components/ToastManager';

// Add ErrorBoundary component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-[#343541]">
          <Text className="text-white">Something went wrong. Please try again.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const handleOAuth = useOAuthFlow();
  const { info, success, warning, error: toastError } = useToast();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [code, setCode] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPasswordModal, setShowPasswordModal] = React.useState(false);
  const [showOTPModal, setShowOTPModal] = React.useState(false);
  const [isValidEmail, setIsValidEmail] = React.useState(true);
  const passwordInputRef = React.useRef<TextInput>(null);
  const codeInputRef = React.useRef<TextInput>(null);

  // Add new states for OTP handling
  const [otpAttempts, setOtpAttempts] = React.useState(0);
  const MAX_OTP_ATTEMPTS = 3;
  const otpRef = React.useRef<{
    clear: () => void;
    focus: () => void;
    setValue: (value: string) => void;
  }>(null);

  // Add new state for selection modal
  const [showLoginMethodModal, setShowLoginMethodModal] = React.useState(false);

  // Add new state for resend timer
  const [resendTimer, setResendTimer] = React.useState(0);
  const [canResend, setCanResend] = React.useState(true);

  // Add new animation states
  const [formOpacity] = React.useState(new Animated.Value(0));
  const [formTranslateY] = React.useState(new Animated.Value(20));

  // Add isOTPValid state
  const [isOTPValid, setIsOTPValid] = React.useState(true);

  // Add error state for password modal
  const [passwordError, setPasswordError] = React.useState('');

  // Add new state for OTP error
  const [otpError, setOtpError] = React.useState('');

  // Remove modal states
  const [currentStep, setCurrentStep] = React.useState<'email' | 'password' | 'otp'>('email');

  // Add new states for loading feedback
  const [loadingText, setLoadingText] = React.useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = React.useState(false);

  // Add new animated value for shake animation
  const shakeAnimation = React.useRef(new Animated.Value(0)).current;

  // Add form entrance animation
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(formTranslateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Add email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Add debounce for email validation
  const debouncedValidateEmail = React.useCallback(
    debounce((email: string) => {
      setIsValidEmail(validateEmail(email));
    }, 500),
    []
  );

  // Update email handling with better feedback
  const handleEmailChange = (text: string) => {
    const lowerText = text.toLowerCase();
    setEmailAddress(lowerText);
    debouncedValidateEmail(lowerText);
  };

  // Add keyboard visibility detection
  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Update email submit with better loading state
  const onEmailSubmit = React.useCallback(async () => {
    if (!isLoaded) return;

    if (!emailAddress || !validateEmail(emailAddress)) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toastError('Please enter a valid email address');
      setIsValidEmail(false);
      return;
    }

    setIsLoading(true);
    setLoadingText('Checking email...');

    try {
      const { supportedFirstFactors } = await signIn.create({
        identifier: emailAddress,
      });

      const passwordFactor = supportedFirstFactors?.find(
        (factor) => factor.strategy === 'password'
      );
      const emailCodeFactor = supportedFirstFactors?.find(
        (factor) => factor.strategy === 'email_code'
      );

      if (passwordFactor && emailCodeFactor) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowLoginMethodModal(true);
      } else if (passwordFactor) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCurrentStep('password');
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await signIn.create({
          identifier: emailAddress,
          strategy: 'email_code',
        });
        setCurrentStep('otp');
        startResendTimer();
        info('Verification code sent to your email');
      }
    } catch (err: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMessage = err?.errors?.[0]?.message || err?.message || 'An error occurred';
      toastError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, emailAddress]);

  // Update password submit with better feedback
  const onPasswordSubmit = React.useCallback(async () => {
    if (!isLoaded) return;

    if (!password) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPasswordError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setLoadingText('Signing in...');
    setPasswordError('');

    try {
      const attempt = await signIn.create({
        identifier: emailAddress,
        strategy: 'password',
        password,
      });

      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        router.replace('/(app)');
      } else {
        setCurrentStep('otp');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        const errorMessage = (err as any).errors?.[0]?.message || err.message;
        if (errorMessage.toLowerCase().includes('invalid password')) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setPasswordError('The password you entered is incorrect');
        } else if (errorMessage.toLowerCase().includes('too many attempts')) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setPasswordError('Too many failed attempts. Please try again later');
        } else {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setPasswordError('Unable to sign in. Please check your credentials');
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, emailAddress, password]);

  // Add shake animation function
  const shakeError = () => {
    // Reset animation value
    shakeAnimation.setValue(0);
    
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
    ]).start();
  };

  // Update OTP submit with better feedback
  const onOTPSubmit = React.useCallback(async () => {
    if (!isLoaded) return;

    if (!code || code.length !== 6) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setOtpError('Please enter a valid verification code');
      return;
    }

    setIsLoading(true);
    setLoadingText('Verifying code...');
    setOtpError('');

    try {
      const attempt = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code,
      });

      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        router.replace('/(app)');
      }
    } catch (err: unknown) {
      setIsOTPValid(false);
      // Trigger shake animation and haptics
      shakeError();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      if (err instanceof Error) {
        const errorMessage = (err as any).errors?.[0]?.message || err.message;
        if (errorMessage.toLowerCase().includes('invalid code')) {
          setOtpError('Invalid verification code. Please try again.');
        } else if (errorMessage.toLowerCase().includes('expired')) {
          setOtpError('Code has expired. Please request a new one.');
        } else {
          setOtpError('Failed to verify code. Please try again.');
        }
      }
      
      // Clear invalid code and refocus
      setCode('');
      otpRef.current?.clear();
      otpRef.current?.focus();

      // Increment OTP attempts
      const newAttempts = otpAttempts + 1;
      setOtpAttempts(newAttempts);
      
      if (newAttempts >= MAX_OTP_ATTEMPTS) {
        toastError('Too many incorrect attempts. Please request a new code.');
        setCurrentStep('email');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, code]);

  // Add this function before the renderOTPModal
  const handleOTPPaste = async () => {
    try {
      const clipboardText = await Clipboard.getStringAsync();
      if (clipboardText?.length === 6 && /^\d+$/.test(clipboardText)) {
        setCode(clipboardText);
        setTimeout(() => onOTPSubmit(), 300);
      }
    } catch (error) {
      console.log('Failed to paste OTP:', error);
    }
  };

  // Add cleanup effect
  React.useEffect(() => {
    return () => {
      setEmailAddress('');
      setPassword('');
      setCode('');
      setIsLoading(false);
      setShowPasswordModal(false);
      setShowOTPModal(false);
      setShowLoginMethodModal(false);
    };
  }, []);

  // Update the navigation to sign-up
  const navigateToSignUp = () => {
    setEmailAddress(''); // Clear state before navigation
    setPassword('');
    router.replace('/(auth)/sign-up');
  };

  // Add this near the top of your component
  const GoogleIcon = () => (
    <Image
      source={require('../../assets/images/google.png')}
      style={{ width: 24, height: 24 }} // Use style prop instead of className
    />
  );

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const result = await handleOAuth();
      if (!result) {
        toastError('Google sign-in failed');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      toastError('Google sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Add keyboard handling improvements
  const scrollViewRef = useRef<ScrollView>(null);
  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      if (Platform.OS === 'android') {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      if (Platform.OS === 'android') {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleBack = () => {
    if (currentStep === 'password' || currentStep === 'otp') {
      // If on password or OTP step, go back to email step
      setCurrentStep('email');
      setPassword('');
      setCode('');
      setPasswordError('');
      setOtpError('');
    } else if (Platform.OS === 'ios') {
      // On iOS, allow navigation back to get-started
      router.back();
    } else {
      // On Android, exit the app when on the main sign-in screen
      BackHandler.exitApp();
    }
  };

  // Add resend OTP function
  const handleResendOTP = async () => {
    if (!canResend || !isLoaded) return;

    setIsLoading(true);
    try {
      await signIn.create({
        identifier: emailAddress,
        strategy: 'email_code',
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

  // Add this function to handle the resend timer
  const startResendTimer = () => {
    setCanResend(false);
    setResendTimer(30);
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Update the loading button UI
  const renderLoadingButton = () => (
    <View className="flex-row items-center justify-center space-x-2">
      <ActivityIndicator color="white" />
      <Text className="text-white ml-2">{loadingText}</Text>
    </View>
  );

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-[#343541]">
        <ActivityIndicator size="large" color="#10a37f" />
      </View>
    );
  }

  // Add an error boundary
  if (!signIn) {
    return (
      <View className="flex-1 items-center justify-center bg-[#343541]">
        <Text className="text-white">Error loading authentication</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#343541' }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}>
              <View className="pt-12 px-4 mb-2">
                <Pressable
                  onPress={handleBack}
                  className="flex-row items-center p-2 rounded-full bg-gray-600/30 w-10">
                  <ArrowLeft size={16} color="#9ca3af" />
                </Pressable>
              </View>

              <Animated.View
                style={{
                  opacity: formOpacity,
                  transform: [{ translateY: formTranslateY }],
                }}
                className="flex-1 justify-center py-2">
                <View className="mb-6 px-6">
                  <Text className="mb-1.5 text-center text-2xl font-bold text-white">
                    {currentStep === 'email' ? 'Welcome Back' : 
                     currentStep === 'password' ? 'Enter Password' : 
                     'Verify Your Email'}
                  </Text>
                  <Text className="text-center text-sm text-gray-300">
                    {currentStep === 'email' ? 'Sign in to continue to Lemi' :
                     currentStep === 'password' ? `Signing in as ${emailAddress}` :
                     'Enter the code sent to your email'}
                  </Text>
                </View>

                {currentStep === 'email' && (
                  <>
                    {/* Google Sign In Button */}
                    <View className="mb-6 px-6">
                      <TouchableOpacity
                        onPress={handleGoogleSignIn}
                        disabled={isLoading}
                        className="w-full flex-row items-center justify-center space-x-3 rounded-xl border-2 border-gray-600 bg-transparent px-4 py-4">
                        {isLoading ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <>
                            <GoogleIcon />
                            <Text className="text-base font-medium text-white ml-2">
                              Continue with Google
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>

                    <View className="mb-6 flex-row items-center px-6">
                      <View className="h-px flex-1 bg-gray-600" />
                      <Text className="mx-3 text-gray-300 text-sm">OR</Text>
                      <View className="h-px flex-1 bg-gray-600" />
                    </View>

                    <View className="space-y-4 px-6">
                      <View>
                        <Text className="mb-2.5 font-medium text-gray-300">Email address</Text>
                        <View className="relative">
                          <TextInput
                            className={`w-full rounded-xl border-2 bg-transparent p-4 pl-12 text-white text-base ${
                              !isValidEmail && emailAddress.length > 0 ? 'border-red-500' : 'border-gray-600'
                            }`}
                            autoCapitalize="none"
                            value={emailAddress}
                            placeholder="Enter email"
                            placeholderTextColor="#9ca3af"
                            onChangeText={handleEmailChange}
                            keyboardType="email-address"
                            autoCorrect={false}
                          />
                          <View className="absolute left-4 top-[17px]">
                            <Mail size={20} color="#9ca3af" />
                          </View>
                        </View>
                      </View>
                    </View>
                  </>
                )}

                {currentStep === 'password' && (
                  <View className="px-6">
                    <View className="mb-4">
                      <Text className="mb-2.5 font-medium text-gray-300">Password</Text>
                      <View className="relative">
                        <TextInput
                          ref={passwordInputRef}
                          className={`w-full rounded-xl border-2 ${
                            passwordError ? 'border-red-500' : 'border-gray-600'
                          } bg-transparent p-4 pl-12 text-white text-base`}
                          secureTextEntry
                          value={password}
                          placeholder="Enter password"
                          placeholderTextColor="#9ca3af"
                          onChangeText={(text) => {
                            setPassword(text);
                            setPasswordError('');
                          }}
                          onSubmitEditing={onPasswordSubmit}
                        />
                        <View className="absolute left-4 top-[17px]">
                          <Lock size={20} color="#9ca3af" />
                        </View>
                      </View>
                      {passwordError ? (
                        <Text className="mt-2 text-sm text-red-500">{passwordError}</Text>
                      ) : null}
                    </View>
                  </View>
                )}

                {currentStep === 'otp' && (
                  <View className="px-6">
                    <View className="mb-8">
                      <Animated.View
                        style={{
                          transform: [{
                            translateX: shakeAnimation
                          }]
                        }}>
                        <OtpInput
                          ref={otpRef}
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
                              borderWidth: 2, // Make border more visible
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
                              fontSize: 20, // Make text more visible
                            },
                          }}
                        />
                      </Animated.View>
                      {otpError && (
                        <Text className="mt-2 text-sm text-red-500 text-center">
                          {otpError}
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={handleOTPPaste}
                      className="mb-4 w-full rounded-xl border-2 border-gray-600 p-4">
                      <Text className="text-center text-base text-white">
                        Paste from Clipboard
                      </Text>
                    </TouchableOpacity>

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
                )}

                {/* Continue/Submit Button */}
                <View className="mt-6 px-6">
                  <TouchableOpacity
                    className={`w-full rounded-xl bg-[#10a37f] p-4 shadow-sm ${
                      isLoading ? 'opacity-80' : 'active:bg-[#0e906f]'
                    }`}
                    onPress={
                      currentStep === 'email' ? onEmailSubmit :
                      currentStep === 'password' ? onPasswordSubmit :
                      onOTPSubmit
                    }
                    disabled={isLoading}>
                    {isLoading ? renderLoadingButton() : (
                      <Text className="text-center text-base font-semibold text-white">
                        {currentStep === 'email' ? 'Continue' :
                         currentStep === 'password' ? 'Sign In' :
                         'Verify Code'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Show keyboard done button on iOS */}
                {Platform.OS === 'ios' && isKeyboardVisible && (
                  <TouchableOpacity
                    onPress={Keyboard.dismiss}
                    className="absolute bottom-4 right-4 bg-gray-600/30 p-2 rounded-full">
                    <Text className="text-white">Done</Text>
                  </TouchableOpacity>
                )}

                {/* Sign Up and Forgot Password Links */}
                {currentStep === 'email' && (
                  <>
                    <View className="mt-4 flex-row justify-center">
                      <Text className="text-gray-300">Don't have an account? </Text>
                      <Pressable onPress={navigateToSignUp}>
                        <Text className="font-semibold text-[#10a37f]">Sign up</Text>
                      </Pressable>
                    </View>

                    <View className="mt-4 flex-row justify-center">
                      <Pressable onPress={() => router.push('/(auth)/reset-password')}>
                        <Text className="font-semibold text-[#10a37f]">Forgot password?</Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </Animated.View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Add Login Method Selection Modal */}
      <Modal
        isVisible={showLoginMethodModal}
        onBackdropPress={() => setShowLoginMethodModal(false)}
        onBackButtonPress={() => setShowLoginMethodModal(false)}
        statusBarTranslucent
        avoidKeyboard
        useNativeDriverForBackdrop
        className="m-0"
        style={{ justifyContent: 'flex-end', margin: 0 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="w-full">
          <View className="bg-[#343541] rounded-t-3xl p-6">
            <View className="items-center mb-6">
              <View className="w-12 h-1 bg-gray-600 rounded-full" />
            </View>
            
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-xl font-semibold">
                Choose Sign In Method
              </Text>
              <TouchableOpacity 
                onPress={() => setShowLoginMethodModal(false)}
                className="p-2">
                <X size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              className="w-full rounded-xl bg-[#10a37f] p-4 mb-3"
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowLoginMethodModal(false);
                setCurrentStep('password');
              }}>
              <Text className="text-center text-base font-semibold text-white">
                Continue with Password
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="w-full rounded-xl border-2 border-[#10a37f] p-4 mb-4"
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowLoginMethodModal(false);
                await signIn.create({
                  identifier: emailAddress,
                  strategy: 'email_code',
                });
                setCurrentStep('otp');
                startResendTimer();
                info('Verification code sent to your email');
              }}>
              <Text className="text-center text-base font-semibold text-[#10a37f]">
                Continue with Email Code
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ErrorBoundary>
  );
} 