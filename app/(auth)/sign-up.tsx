import { useSignUp } from '@clerk/clerk-expo';

import { Link, useRouter } from 'expo-router';
import * as React from 'react';
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
  Image,
  Pressable,
  GestureResponderEvent,
  LayoutAnimation,
  SafeAreaView,
  Animated,
  Easing,
  BackHandler,
} from 'react-native';

import { useToast } from '../Toast/components/ToastManager';

import { OtpInput } from "react-native-otp-entry";

import { ArrowLeft, Eye, EyeOff, Lock, Mail, CheckCircle2, Circle, X } from 'lucide-react-native';

import { useOAuthFlow } from '../../utils/oauth';

import * as Haptics from 'expo-haptics';

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

const GoogleIcon = () => (
  <Image
    source={require('../../assets/images/google.png')}
    style={{ width: 24, height: 24 }}
  />
);

const SignUpScreen: React.FC = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const handleOAuth = useOAuthFlow();
  const { info, success, warning, error: toastError } = useToast();
  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [isPasswordValid, setIsPasswordValid] = React.useState(true);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  // Add email validation
  const [isEmailValid, setIsEmailValid] = React.useState(true);
  const [isSubmitAttempted, setIsSubmitAttempted] = React.useState(false);

  // Add new state for email existence check
  const [isCheckingEmail, setIsCheckingEmail] = React.useState(false);
  const [emailExists, setEmailExists] = React.useState(false);
  const emailCheckTimeoutRef = React.useRef<NodeJS.Timeout>();

  // Add new states for password
  const [passwordStrength, setPasswordStrength] = React.useState({
    score: 0,
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false
    }
  });

  // Add ref for email input
  const emailInputRef = React.useRef<TextInput>(null);
  const passwordInputRef = React.useRef<TextInput>(null);
  const codeInputRef = React.useRef<TextInput>(null);

  // Add resend verification code functionality
  const [canResendCode, setCanResendCode] = React.useState(false);
  const [resendTimer, setResendTimer] = React.useState(30);

  // Add new states for resend attempts
  const [resendAttempts, setResendAttempts] = React.useState(0);
  const MAX_RESEND_ATTEMPTS = 3;
  const LONG_COOLDOWN_MINUTES = 30;

  // Add new state for verification errors
  const [verificationError, setVerificationError] = React.useState('');

  // Add new state for timestamps
  const [lastResendTimestamp, setLastResendTimestamp] = React.useState<number>(0);

  // Add ref at the top of the SignUpScreen component
  const otpRef = React.useRef<{
    clear: () => void;
    focus: () => void;
    setValue: (value: string) => void;
  }>(null);

  // Add loading state for Google OAuth
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

  // Add debounced password validation
  const passwordDebounceRef = React.useRef<NodeJS.Timeout>();

  // Add new state for OTP attempts
  const [otpAttempts, setOtpAttempts] = React.useState(0);
  const MAX_OTP_ATTEMPTS = 3;

  // Add keyboard height state for Android
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);

  // Add new state for form animation
  const [formOpacity] = React.useState(new Animated.Value(0));
  const [formTranslateY] = React.useState(new Animated.Value(20));

  // Remove showOTPModal state since we're not using modals anymore
  const [currentStep, setCurrentStep] = React.useState<'form' | 'otp'>('form');

  // Add new state for OTP validation
  const [isOTPValid, setIsOTPValid] = React.useState(true);

  // Add new animated value for shake animation
  const shakeAnimation = React.useRef(new Animated.Value(0)).current;

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

  // Add error handling wrapper
  const safeExecute = async (operation: () => Promise<void>, errorMessage: string) => {
    try {
      await operation();
    } catch (err: any) {
      console.error(`${errorMessage}:`, err);
      toastError(err.errors?.[0]?.message || errorMessage);
    }
  };

  // Improve email validation with better regex
  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  };

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

  // Improve password input with better visual feedback
  const renderPasswordInput = () => (
    <View className="mb-2">
      <Text className="mb-2.5 font-medium text-gray-300">Password</Text>
      <View className="relative mb-1">
        <TextInput
          ref={passwordInputRef}
          className={`w-full rounded-xl border-2 bg-transparent p-4 pl-12 pr-12 text-white text-base 
            ${!isPasswordValid && password.length > 0 ? 'border-red-500' : 
              passwordStrength.score >= 4 ? 'border-green-500' : 'border-gray-600'}`}
          value={password}
          placeholder="Enter password"
          placeholderTextColor="#9ca3af"
          secureTextEntry={!showPassword}
          onChangeText={onPasswordChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable 
          className="absolute left-4 top-4"
          hitSlop={10}
        >
          <Lock size={20} color={passwordStrength.score >= 4 ? '#10b981' : '#9ca3af'} />
        </Pressable>
        <Pressable
          className="absolute right-4 top-4 p-1"
          onPress={() => setShowPassword(!showPassword)}
          hitSlop={10}>
          {showPassword ? (
            <EyeOff size={20} color="#9ca3af" />
          ) : (
            <Eye size={20} color="#9ca3af" />
          )}
        </Pressable>
      </View>
    </View>
  );

  // Improve Google sign-in button
  const renderGoogleButton = () => (
    <TouchableOpacity
      onPress={onSelectOAuth}
      disabled={isGoogleLoading || isLoading}
      className={`w-full flex-row items-center justify-center space-x-3 rounded-xl border-2 
        ${isGoogleLoading ? 'border-gray-500 bg-gray-700/50' : 'border-gray-600 bg-transparent'} 
        px-4 py-4 active:bg-gray-700/30`}>
      {isGoogleLoading ? (
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
  );

  // Update timer effect to properly handle initialization and reset
  React.useEffect(() => {
    let interval: NodeJS.Timeout;

    const updateTimer = () => {
      const now = Date.now();
      const timeSinceLastResend = now - lastResendTimestamp;
      const requiredCooldown = resendAttempts >= MAX_RESEND_ATTEMPTS
        ? LONG_COOLDOWN_MINUTES * 60 * 1000
        : 30 * 1000;

      if (timeSinceLastResend >= requiredCooldown) {
        setCanResendCode(true);
        setResendTimer(0);
        clearInterval(interval);
      } else {
        const remainingTime = Math.ceil((requiredCooldown - timeSinceLastResend) / 1000);
        setResendTimer(remainingTime);
        setCanResendCode(false);
      }
    };

    // Only start timer if we have a last resend timestamp
    if (lastResendTimestamp > 0) {
      updateTimer(); // Initial update
      interval = setInterval(updateTimer, 1000);
    } else {
      // If no resend has happened yet, allow resending
      setCanResendCode(true);
      setResendTimer(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [lastResendTimestamp, resendAttempts]);

  // Update resendVerificationCode function to properly reset timer
  const resendVerificationCode = async () => {
    if (!isLoaded || isLoading || !canResendCode) return;

    if (resendAttempts >= MAX_RESEND_ATTEMPTS) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toastError(`Maximum resend attempts reached. Please wait ${LONG_COOLDOWN_MINUTES} minutes.`);
      return;
    }

    setIsLoading(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Reset verification state
      setCode('');
      otpRef.current?.clear();
      setOtpAttempts(0);
      setVerificationError('');
      
      // Update resend attempts and timer
      const newAttempts = resendAttempts + 1;
      setResendAttempts(newAttempts);
      setLastResendTimestamp(Date.now());
      setCanResendCode(false);
      
      const remainingAttempts = MAX_RESEND_ATTEMPTS - newAttempts;
      success(
        `Verification code resent successfully. ${remainingAttempts} ${
          remainingAttempts === 1 ? 'attempt' : 'attempts'
        } remaining`
      );
      
    } catch (err: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Error resending verification code:', err);
      toastError('Failed to resend verification code. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format time
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${remainingSeconds}s`;
  };

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    setIsSubmitAttempted(true);
    
    if (!validateEmail(emailAddress)) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toastError('Please enter a valid email address');
      emailInputRef.current?.focus();
      return;
    }

    if (emailExists) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toastError('Email already exists. Please sign in instead.');
      return;
    }

    if (!validatePassword(password)) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toastError('Please enter a valid password');
      passwordInputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    try {
      await signUp.create({
        emailAddress,
        password,
      });

      // Send email verification code
      await sendVerificationCode();
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep('otp');
      
    } catch (err: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Error during sign up:', err);
      let errorMessage = 'Sign up failed. Please try again.';
      if (err.errors?.[0]?.message) {
        errorMessage = err.errors[0].message;
      }
      toastError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Add new function to handle verification code sending
  const sendVerificationCode = async () => {
    try {
      if (!signUp) throw new Error("Sign up not initialized");
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
      setResendAttempts(0); // Reset resend attempts
      setLastResendTimestamp(Date.now());
      setCanResendCode(false);
      setResendTimer(30);
      success('Verification code sent to your email');

    } catch (err: any) {
      console.error('Error sending verification code:', err);
      toastError('Failed to send verification code. Please try again.');
      throw err; // Re-throw to be handled by the caller
    }

  };

  // Add back button handler
  const handleBack = () => {
    if (currentStep === 'otp') {
      // If on OTP step, go back to form step
      setCurrentStep('form');
      setCode('');
      setPendingVerification(false);
      if (otpRef.current?.clear) {
        otpRef.current.clear();
      }
    } else if (Platform.OS === 'ios') {
      // On iOS, allow navigation back to get-started
      router.back();
    } else {
      // On Android, exit the app when on the main sign-up screen
      BackHandler.exitApp();
    }
  };

  // Add auto-focus handling
  React.useEffect(() => {
    if (pendingVerification) {
      // Add slight delay for iOS to ensure proper focus
      setTimeout(() => {
        otpRef.current?.focus();
        if (Platform.OS === 'android') {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
      }, 100);
    }
  }, [pendingVerification]);

  // Render password strength indicator with color feedback
  const renderPasswordStrength = () => {
    const getStrengthColor = (score: number) => {
      if (score <= 1) return 'bg-red-500';
      if (score <= 3) return 'bg-yellow-500';
      if (score <= 4) return 'bg-blue-500';
      return 'bg-green-500';
    };

    const getTextColor = (score: number) => {
      if (score <= 1) return 'text-red-500';
      if (score <= 3) return 'text-yellow-500';
      if (score <= 4) return 'text-blue-500';
      return 'text-green-500';
    };

    const getStrengthText = (score: number) => {
      if (score <= 1) return 'Very Weak';
      if (score <= 3) return 'Weak';
      if (score <= 4) return 'Good';
      return 'Strong';
    };

    return (
      <View className="mt-1.5">
        <View className="flex-row space-x-1">
          {[1, 2, 3, 4, 5].map((index) => (
            <View
              key={index}
              className={`h-1.5 flex-1 rounded-full ${index <= passwordStrength.score
                  ? getStrengthColor(passwordStrength.score)
                  : 'bg-gray-600'
                }`}
            />
          ))}
        </View>
        {password.length > 0 && (
          <View className="mt-2">
            <Text className={`text-xs font-medium mb-1 ${getTextColor(passwordStrength.score)}`}>
              {getStrengthText(passwordStrength.score)} Password
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {Object.entries(passwordStrength.requirements).map(([key, met]) => (
                <View key={key} className="flex-row items-center">
                  {met ? (
                    <CheckCircle2 size={12} color="#10a37f" />
                  ) : (
                    <Circle size={12} color="#4b5563" />
                  )}
                  <Text className={`text-xs ml-1 ${met ? 'text-green-500' : 'text-gray-400'}`}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  // Update email input with ref and keyboard handling
  const renderEmailInput = () => (
    <View>
      <Text className="mb-2.5 font-medium text-gray-300">Email address</Text>
      <View className="relative">
        <TextInput
          ref={emailInputRef}
          className={`w-full rounded-xl border-2 bg-transparent p-4 pl-12 text-white text-base ${
            (!isEmailValid && isSubmitAttempted) || emailExists 
            ? 'border-red-500' : 'border-gray-600'
          }`}
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Enter email"
          placeholderTextColor="#9ca3af"
          onChangeText={onEmailChange}
          keyboardType="email-address"
          returnKeyType="next"
          onSubmitEditing={() => passwordInputRef.current?.focus()}
        />
        <View className="absolute left-4 top-[17px]">
          <Mail size={20} color="#9ca3af" />
        </View>
        {isCheckingEmail && (
          <View className="absolute right-4 top-4">
            <ActivityIndicator size="small" color="#10a37f" />
          </View>
        )}
      </View>
      {!isEmailValid && isSubmitAttempted && (
        <Text className="mt-2 text-sm text-red-500">
          Please enter a valid email address
        </Text>
      )}
      {emailExists && (
        <Text className="mt-2 text-sm text-red-500">
          This email is already registered. Please sign in instead.
        </Text>
      )}
    </View>
  );

  // Enhanced password validation with detailed feedback
  const validatePassword = (pass: string) => {
    const requirements = {
      length: pass.length >= 8,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[^A-Za-z0-9]/.test(pass) // More inclusive special character check
    };

    const score = Object.values(requirements).filter(Boolean).length;

    setPasswordStrength({
      score,
      requirements
    });

    return score === 5;
  };

  // Enhanced password validation with debounce
  const onPasswordChange = (pass: string) => {
    setPassword(pass);
    
    // Clear previous timeout
    if (passwordDebounceRef.current) {
      clearTimeout(passwordDebounceRef.current);
    }

    // Debounce password validation to reduce UI jank
    passwordDebounceRef.current = setTimeout(() => {
      const isValid = validatePassword(pass);
      setIsPasswordValid(isValid);
    }, 300);
  };

  // Enhanced OAuth handling with loading state
  const onSelectOAuth = React.useCallback(async (e: GestureResponderEvent) => {
    if (isGoogleLoading) return;
    
    setIsGoogleLoading(true);
    try {
      await handleOAuth();
    } catch (err) {
      toastError('Google sign-up failed. Please try again.');
      console.error('OAuth error:', err);
    } finally {
      setIsGoogleLoading(false);
    }

  }, [handleOAuth, isGoogleLoading]);

  // Update onVerifyPress with haptics
  const onVerifyPress = async () => {
    if (!isLoaded) return;

    setIsLoading(true);
    setVerificationError('');

    try {
      if (!code || code.length !== 6) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        throw new Error('Please enter a complete verification code');
      }

      const signUpAttempt = await signUp.attemptEmailAddressVerification({ code });
      
      if (signUpAttempt.status === 'complete') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace('/(app)');
      }
    } catch (err: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMessage = err.errors?.[0]?.message || err.message;
      setVerificationError('Incorrect verification code');
      setIsOTPValid(false);
      
      // Trigger shake animation and vibration
      shakeError();
      if (Platform.OS === 'android') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      
      // Clear invalid code
      setCode('');
      otpRef.current?.clear();
      otpRef.current?.focus();

      // Increment OTP attempts
      const newAttempts = otpAttempts + 1;
      setOtpAttempts(newAttempts);
      
      if (newAttempts >= MAX_OTP_ATTEMPTS) {
        toastError('Too many incorrect attempts. Please request a new code.');
        setCurrentStep('form');
        setPendingVerification(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update the navigation to sign-in with toast
  const navigateToSignIn = () => {
    setEmailAddress('');
    setPassword('');
    router.replace('/(auth)/sign-in');
  };

  // Update email validation function to include existence check
  const checkEmailExists = async (email: string) => {
    if (!validateEmail(email)) return;

    setIsCheckingEmail(true);
    try {
      // Temporary password should meet minimum requirements
      const response = await signUp?.create({
        emailAddress: email,
        password: 'TempPass123!', // More secure temporary password
      });
      setEmailExists(false);
    } catch (err: any) {
      if (err.errors?.[0]?.message?.toLowerCase().includes('already exists')) {
        setEmailExists(true);
        emailInputRef.current?.focus(); // Focus email field when duplicate found
      }
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Enhanced email validation with immediate feedback
  const onEmailChange = (email: string) => {
    setEmailAddress(email);
    setIsEmailValid(validateEmail(email));

    // Clear previous timeout
    if (emailCheckTimeoutRef.current) {
      clearTimeout(emailCheckTimeoutRef.current);
    }

    // Only check email existence if it's valid
    if (validateEmail(email)) {
      setIsCheckingEmail(true);
      emailCheckTimeoutRef.current = setTimeout(() => {
        checkEmailExists(email);
      }, 300); // Reduced debounce time for better responsiveness
    }
  };

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-[#343541]">
        <ActivityIndicator size="large" color="#10a37f" />
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
                    {currentStep === 'form' ? 'Create Account' : 'Verify Your Email'}
                  </Text>
                  <Text className="text-center text-sm text-gray-300">
                    {currentStep === 'form' ? 'Get started with Lemi' : 
                     `Enter the verification code sent to ${emailAddress}`}
                  </Text>
                </View>

                {currentStep === 'form' ? (
                  <>
                    {/* Google Sign In Button */}
                    <View className="mb-6 px-6">
                      <TouchableOpacity
                        onPress={onSelectOAuth}
                        disabled={isGoogleLoading}
                        className="w-full flex-row items-center justify-center space-x-3 rounded-xl border-2 border-gray-600 bg-transparent px-4 py-4">
                        {isGoogleLoading ? (
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
                      {/* Email Input */}
                      <View>
                        <Text className="mb-2.5 font-medium text-gray-300">Email address</Text>
                        <View className="relative">
                          <TextInput
                            ref={emailInputRef}
                            className={`w-full rounded-xl border-2 bg-transparent p-4 pl-12 text-white text-base ${
                              (!isEmailValid && isSubmitAttempted) || emailExists 
                              ? 'border-red-500' : 'border-gray-600'
                            }`}
                            autoCapitalize="none"
                            value={emailAddress}
                            placeholder="Enter email"
                            placeholderTextColor="#9ca3af"
                            onChangeText={onEmailChange}
                            keyboardType="email-address"
                            returnKeyType="next"
                            onSubmitEditing={() => passwordInputRef.current?.focus()}
                          />
                          <View className="absolute left-4 top-[17px]">
                            <Mail size={20} color="#9ca3af" />
                          </View>
                        </View>
                        {(!isEmailValid && isSubmitAttempted) && (
                          <Text className="mt-2 text-sm text-red-500">
                            Please enter a valid email address
                          </Text>
                        )}
                        {emailExists && (
                          <Text className="mt-2 text-sm text-red-500">
                            This email is already registered. Please sign in instead.
                          </Text>
                        )}
                      </View>

                      {/* Password Input */}
                      <View>
                        <Text className="mb-2.5 font-medium text-gray-300">Password</Text>
                        <View className="relative">
                          <TextInput
                            ref={passwordInputRef}
                            className={`w-full rounded-xl border-2 bg-transparent p-4 pl-12 pr-12 text-white text-base ${
                              !isPasswordValid && password.length > 0 ? 'border-red-500' : 
                              passwordStrength.score >= 4 ? 'border-green-500' : 'border-gray-600'
                            }`}
                            value={password}
                            placeholder="Enter password"
                            placeholderTextColor="#9ca3af"
                            secureTextEntry={!showPassword}
                            onChangeText={onPasswordChange}
                            autoCapitalize="none"
                            autoCorrect={false}
                          />
                          <View className="absolute left-4 top-[17px]">
                            <Lock size={20} color={passwordStrength.score >= 4 ? '#10b981' : '#9ca3af'} />
                          </View>
                          <Pressable
                            className="absolute right-4 top-[17px]"
                            onPress={() => setShowPassword(!showPassword)}>
                            {showPassword ? (
                              <EyeOff size={20} color="#9ca3af" />
                            ) : (
                              <Eye size={20} color="#9ca3af" />
                            )}
                          </Pressable>
                        </View>
                        {renderPasswordStrength()}
                      </View>
                    </View>
                  </>
                ) : (
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
                        {verificationError && (
                          <Text className="mt-2 text-sm text-red-500 text-center">
                            {verificationError}
                          </Text>
                        )}
                    </View>

                    <View className="mt-4 flex-row justify-center items-center">
                      {resendTimer > 0 ? (
                        <Text className="text-gray-400">
                          Resend code in {resendTimer}s
                        </Text>
                      ) : (
                        <TouchableOpacity onPress={resendVerificationCode}>
                          <Text className="text-[#10a37f]">
                            Didn't receive code? Resend
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}

                {/* Sign Up/Verify Button */}
                <View className="mt-6 px-6">
                  <TouchableOpacity
                    className={`w-full rounded-xl bg-[#10a37f] p-4 shadow-sm ${
                      isLoading ? 'opacity-80' : 'active:bg-[#0e906f]'
                    }`}
                    onPress={currentStep === 'form' ? onSignUpPress : onVerifyPress}
                    disabled={isLoading}>
                    {isLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-center text-base font-semibold text-white">
                        {currentStep === 'form' ? 'Create Account' : 'Verify Email'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Sign In Link */}
                {currentStep === 'form' && (
                  <View className="mt-4 flex-row justify-center">
                    <Text className="text-gray-300">Already have an account? </Text>
                    <Pressable onPress={navigateToSignIn}>
                      <Text className="font-semibold text-[#10a37f]">Sign in</Text>
                    </Pressable>
                  </View>
                )}
              </Animated.View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ErrorBoundary>
  );
};

export default SignUpScreen;

