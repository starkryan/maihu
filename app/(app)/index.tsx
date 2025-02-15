import { useAuth } from '@clerk/clerk-expo';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { 
  Sparkles, 
  Lightbulb,
  X,
  Copy,
  Share2,
  Youtube,
  Film,
  Camera,
  Mic,
  MicOff,
  ChevronRight,
  SlidersHorizontal,
  Plus,
  BarChart2,
  Play,
  Pause} from 'lucide-react-native';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Share,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  RefreshControl,
  Modal} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useToast } from '../Toast/components/ToastManager';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import * as SecureStore from 'expo-secure-store';

import { Audio } from 'expo-av';
import { useLocalSearchParams } from 'expo-router';

import { useScriptStore, languageFlags, optionIcons, optionMetadata } from '@/store/scriptStore';
import AudioWave from '@/app/components/AudioWave';


// Environment configuration (should use actual environment variables in production)
const CONFIG = {
  GEMINI_API_KEY: Constants.expoConfig?.extra?.GOOGLE_GEMINI_API_KEY || 'AIzaSyAs4vFUhoajF79bzBdpP1fgVNgPa8whAEU',
  COLORS: {
    primary: '#10a37f',
    secondary: '#0e906f',
    background: '#1e1f25',    // Darker background for Android
    surface: '#2a2b32',       // Adjusted surface color
    inputBg: '#2a2b32',
    border: '#383942',        // More visible borders for Android
    text: {
      primary: '#ffffff',
      secondary: '#9ca3af',
    },
    error: '#ef4444',
  },
  SPEECH_RECOGNITION: {
    lang: 'en-US',
    androidIntentOptions: {
      EXTRA_LANGUAGE_MODEL: "free_form",           // Better for Android speech
      EXTRA_MAX_RESULTS: 1,                        // Limit results for better accuracy
      EXTRA_PARTIAL_RESULTS: true,                 // Enable partial results
      EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 0, // No minimum length
      EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 1500, // Shorter silence detection
      EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 1000,
    },
    MAX_DURATION: 30000,
  },
} as const;

// Update the OptionSection component
const OptionSection = ({
  title,
  options,
  selectedValue,
  onSelect,
}: {
  title: string;
  options: string[];
  selectedValue: number;
  onSelect: (index: number) => void;
}) => {
  const key = title.toLowerCase() as keyof typeof optionIcons;
  const icon = optionIcons[key];
  const metadata = optionMetadata[key as keyof typeof optionMetadata];

  return (
    <View className="mb-6">
      <View className="flex-row items-center gap-2.5 mb-3.5">
        <Text className="text-[#10a37f] text-lg sm:text-xl">{icon?.emoji}</Text>
        <Text className="text-[#ececf1] text-base sm:text-lg font-semibold">
          {title}
        </Text>
      </View>
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 4,
          gap: 10,
        }}>
        {options.map((option, index) => {
          const optionEmoji = metadata?.icons?.[index] || '';
          
          return (
            <TouchableOpacity
              key={option}
              onPress={() => onSelect(index)}
              activeOpacity={0.7}
              className={`
                min-w-[80px] sm:min-w-[100px] px-4 sm:px-5 py-3 sm:py-4 rounded-2xl
                flex-row items-center justify-center gap-2.5
                ${selectedValue === index ? 'bg-[#10a37f]' : 'bg-[#2a2b32]'}
                border ${selectedValue === index ? 'border-[#0e906f]' : 'border-[#383942]'}
              `}>
              {optionEmoji && (
                <Text className="text-base sm:text-lg">{optionEmoji}</Text>
              )}
              <Text 
                className={`
                  text-sm sm:text-base font-medium
                  ${selectedValue === index ? 'text-white' : 'text-[#ececf1]'}
                `}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// Special component for language selection
const LanguageSection = ({
  options,
  selectedValue,
  onSelect,
}: {
  options: Array<keyof typeof languageFlags>;
  selectedValue: number;
  onSelect: (index: number) => void;
}) => {
  return (
    <View style={{ marginBottom: 20 }}>
      <View className="flex-row items-center gap-2 mb-3">
        <Text className="text-[#10a37f] text-lg">🌐</Text>
        <Text className="text-[#9ca3af] text-base font-medium">
          Language
        </Text>
      </View>
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 4,
          gap: 8,
        }}>
        {options.map((option, index) => {
          const { flag } = languageFlags[option];
          return (
            <TouchableOpacity
              key={option}
              onPress={() => onSelect(index)}
              activeOpacity={0.7}
              className={`
                min-w-[80px] px-4 py-3 rounded-xl
                flex-row items-center justify-center gap-2
                ${selectedValue === index ? 'bg-[#10a37f]' : 'bg-[#343541]'}
                border ${selectedValue === index ? 'border-[#10a37f]' : 'border-[#565869]'}
              `}>
              <Text className="text-base">{flag}</Text>
              <Text 
                className={`
                  text-sm font-medium
                  ${selectedValue === index ? 'text-white' : 'text-[#9ca3af]'}
                `}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// Add new MarkdownContent component
const MarkdownContent = ({ content }: { content: string }) => {
  return (
    <View style={{ backgroundColor: 'transparent' }}>
      <Markdown
        style={{
          body: { color: CONFIG.COLORS.text.primary, fontSize: 16, lineHeight: 24 },
          heading1: { 
            color: CONFIG.COLORS.text.primary, 
            fontSize: 22,
            fontWeight: '700',
            marginVertical: 12
          },
          heading2: { color: CONFIG.COLORS.text.primary, fontSize: 20, fontWeight: '600' },
          paragraph: { color: CONFIG.COLORS.text.primary, fontSize: 16, lineHeight: 24 },
          link: { color: CONFIG.COLORS.primary },
          code_inline: { backgroundColor: CONFIG.COLORS.inputBg, color: CONFIG.COLORS.text.primary },
          code_block: { backgroundColor: CONFIG.COLORS.inputBg, color: CONFIG.COLORS.text.primary },
          blockquote: { backgroundColor: CONFIG.COLORS.inputBg, borderLeftColor: CONFIG.COLORS.primary },
          text: {
            color: CONFIG.COLORS.text.primary,
          },
          list_item: {
            marginVertical: 8,
            paddingLeft: 12,
            color: CONFIG.COLORS.text.primary,
          },
          bullet_list_icon: {
            marginRight: 8,
            color: CONFIG.COLORS.text.primary,
          },
          bullet_list_content: {
            flex: 1,
            borderLeftWidth: 2,
            borderLeftColor: CONFIG.COLORS.primary,
            backgroundColor: CONFIG.COLORS.inputBg,
            padding: 12,
            borderRadius: 8,
            color: CONFIG.COLORS.text.primary,
            marginLeft: 8,
          },
          em: {
            color: CONFIG.COLORS.primary,
            fontStyle: 'normal',
            fontWeight: 'bold',
          },
          strong: {
            color: CONFIG.COLORS.text.primary,
            backgroundColor: CONFIG.COLORS.primary + '20',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
          },
          bullet_list: {
            marginVertical: 12,
            color: CONFIG.COLORS.text.primary,
          },
          ordered_list: {
            marginVertical: 12,
            color: CONFIG.COLORS.text.primary,
          },
          ordered_list_icon: {
            color: CONFIG.COLORS.text.primary,
            marginRight: 8,
          },
          ordered_list_content: {
            color: CONFIG.COLORS.text.primary,
            flex: 1,
          },
          list_item_text: {
            color: CONFIG.COLORS.text.primary,
          },
          text_list_content: {
            color: CONFIG.COLORS.text.primary,
          },
          list: {
            color: CONFIG.COLORS.text.primary,
          },
          listItem: {
            color: CONFIG.COLORS.text.primary,
          },
          listItemContent: {
            color: CONFIG.COLORS.text.primary,
          },
          listItemNumber: {
            color: CONFIG.COLORS.text.primary,
          },
          listItemBullet: {
            color: CONFIG.COLORS.text.primary,
          },
          fence: {
            backgroundColor: CONFIG.COLORS.inputBg,
            padding: 12,
            borderRadius: 8,
            color: CONFIG.COLORS.text.primary,
          },
          pre: {
            backgroundColor: CONFIG.COLORS.inputBg,
            padding: 12,
            borderRadius: 8,
            color: CONFIG.COLORS.text.primary,
          },
          text_container: {
            backgroundColor: 'transparent',
          }
        }}>
        {content}
      </Markdown>
    </View>
  );
};

// Add formatTime function before the VoiceInfoBubble component
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Update the ModalSettings component to use the new sections
const ModalSettings = ({
  visible,
  scriptOptions,
  updateScriptOption,
  closeOptions
}: {
  visible: boolean;
  scriptOptions: any;
  updateScriptOption: (key: string, val: number) => void;
  closeOptions: () => void;
}) => (
  <Modal
    visible={visible}
    animationType="slide"
    transparent={true}
    statusBarTranslucent={true}  // Added for Android
    onRequestClose={closeOptions}>
    <View className="flex-1 bg-black/50">
      <View className="mt-auto h-[80%] bg-[#1e1f25] rounded-t-3xl elevation-5">
        <View className="px-4 mb-4 flex-row items-center justify-between border-b border-[#383942] py-4">
          <Text className="text-xl font-bold text-white android:font-medium">
            Script Settings
          </Text>
          <TouchableOpacity 
            className="p-2 rounded-full active:bg-[#2a2b32]"
            onPress={closeOptions}>
            <X size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 100 }}>
          <View>
            {/* Special handling for language section */}
            <LanguageSection
              options={scriptOptions.language.options}
              selectedValue={scriptOptions.language.value}
              onSelect={(val) => updateScriptOption('language', val)}
            />
            
            {/* Render other options */}
            {Object.entries(scriptOptions).map(([key, option]) => {
              if (key === 'language') return null; // Skip language as it's handled separately
              return (
                <OptionSection
                  key={key}
                  title={key.charAt(0).toUpperCase() + key.slice(1)} 
                  options={(option as {options: any[]}).options}
                  selectedValue={(option as {value: number}).value}
                  onSelect={(val) => updateScriptOption(key, val)}
                />
              );
            })}
            
            {/* Quick Tips Section */}
            <View className="mt-6 bg-[#343541] rounded-2xl p-4 border border-[#565869]/30">
              <View className="flex-row items-center gap-2 mb-4">
                <Lightbulb size={20} color="#10a37f" />
                <Text className="text-[#ececf1] text-lg font-semibold">Quick Tips</Text>
              </View>
              
              {/* Tips Cards */}
              <View className="space-y-3 gap-3">
                {[
                  {
                    icon: <Youtube size={18} color="#10a37f" />,
                    title: "Platform Optimization",
                    description: "Match your script style to your platform for better engagement"
                  },
                  {
                    icon: <Film size={18} color="#10a37f" />,
                    title: "Duration Impact",
                    description: "Shorter videos (2-5 mins) often have higher completion rates"
                  },
                  {
                    icon: <Sparkles size={18} color="#10a37f" />,
                    title: "Style Matters",
                    description: "Educational content works best with a conversational tone"
                  }
                ].map((tip, index) => (
                  <View 
                    key={index}
                    className="flex-row items-start gap-3 p-3 bg-[#40414f] rounded-xl border border-[#565869]/20">
                    <View className="p-2 bg-[#10a37f]/10 rounded-lg">
                      {tip.icon}
                    </View>
                    <View className="flex-1">
                      <Text className="text-[#ececf1] font-medium mb-1">
                        {tip.title}
                      </Text>
                      <Text className="text-[#8e8ea0] text-sm">
                        {tip.description}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
              
              {/* Pro Tip Box */}
              <View className="mt-4 p-4 bg-[#10a37f]/10 rounded-xl border border-[#10a37f]/20">
                <Text className="text-[#10a37f] font-semibold mb-2">Pro Tip 💡</Text>
                <Text className="text-[#ececf1] text-sm leading-5">
                  Combine different styles and experiment with various durations to find what works best for your audience. Track your analytics to optimize future scripts.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  </Modal>
);

// Update GeneratingAnimation component with new styling
const GeneratingAnimation = ({ onCancel }: { onCancel?: () => void }) => {
  return (
    <View className="items-center p-8 rounded-3xl bg-[#282A36]/95 border border-[#383A59] shadow-2xl">
      <View className="items-center mb-6">
        <View className="bg-[#1e1f25] p-4 rounded-2xl mb-2">
          <AudioWave isRecording={true} color="#10a37f" />
        </View>
        <Text className="text-[#10a37f] text-lg font-semibold mt-4">
          Crafting Your Script
        </Text>
        <Text className="text-[#9ca3af] text-sm mt-2 text-center">
          Using AI magic to create content
        </Text>
      </View>

      {onCancel && (
        <TouchableOpacity
          className="mt-4 px-6 py-3 rounded-xl border border-[#10a37f]/30 bg-[#10a37f]/10 active:bg-[#10a37f]/20"
          onPress={onCancel}>
          <Text className="text-[#10a37f] font-medium">
            Cancel Generation
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Add new empty state component

const MainPage = () => {
  const { info, success, warning, error: showError } = useToast();
  
  const {
    topic,
    script,
    loading,
    showOptions,
    scriptOptions,
    setTopic,
    setScript,
    setLoading,
    setError,
    updateScriptOption,
  } = useScriptStore();

  const { isLoaded, isSignedIn } = useAuth();

  // Add state for recording URI
  const [recordingUri, setRecordingUri] = useState<string | null>(null);

  // Add audio event handlers
  useSpeechRecognitionEvent("audiostart", (event) => {
    if (event.uri) {
      console.log("Recording started:", event.uri);
    }
  });

  useSpeechRecognitionEvent("audioend", (event) => {
    if (event.uri) {
      setRecordingUri(event.uri);
      console.log("Recording saved:", event.uri);
    }
  });

  // Add state for controlling generation
  const [controller, setController] = React.useState<AbortController | null>(null);

  // Add state for loading message
  const [loadingMessageIndex, setLoadingMessageIndex] = React.useState(0);

  const loadingMessages = [
    { text: 'AI is crafting something amazing... 🎥', color: '#10a37f' },
    { text: 'Brainstorming creative ideas... 💡', color: '#8e8ea0' },
    { text: 'Structuring your content... 📊', color: '#10a37f' },
    { text: 'Adding engaging hooks... ✨', color: '#8e8ea0' },
    { text: 'Polishing to perfection... ⭐', color: '#10a37f' },
    { text: 'Finalizing your script... ', color: '#8e8ea0' },
  ];

  // Add effect to rotate messages during loading
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 3000); // Change message every 3 seconds
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Add rotation animation state and useEffect
  const [rotation, setRotation] = React.useState(0);

  // Modify the rotation animation effect
  React.useEffect(() => {
    setRotation(showOptions ? 180 : 0);
  }, [showOptions]);

  // Update the stopGeneration function
  const stopGeneration = React.useCallback(async () => {
    if (controller) {
      controller.abort();
      setController(null);
      setLoading(false);
      setError('');
      info('Generation stopped');
      await triggerHaptic();
    }
  }, [controller, info]);

  // Add haptic feedback
  const triggerHaptic = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.log('Haptics not supported');
    }
  };

  // Update generateScript with enhanced feedback
  const generateScript = async (isRegenerate: boolean = false) => {
    if (!CONFIG.GEMINI_API_KEY) {
      showError('Missing API configuration');
      return;
    }
    
    if (!topic.trim()) {
      triggerHaptic();
      showError('Please enter a topic first');
      return;
    }

    triggerHaptic();
    if (isRegenerate) {
      setScript('');
      info('Regenerating your script...');
    } else {
      info('Starting to generate your script...');
    }

    setLoading(true);
    setError('');

    // Create new abort controller
    const newController = new AbortController();
    setController(newController);

    try {
      const genAI = new GoogleGenerativeAI(CONFIG.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const selectedLanguage = scriptOptions.language.options[scriptOptions.language.value];

      const prompt = `
        You are an expert YouTube script writer. Create a highly engaging script for a ${scriptOptions.duration.options[scriptOptions.duration.value]}-minute video.
        
        IMPORTANT: Write the entire script in ${selectedLanguage} language.

        Topic: ${topic.trim()}

        Content Requirements:
        - Target Audience: ${scriptOptions.audience.options[scriptOptions.audience.value]}
        - Style: ${scriptOptions.style.options[scriptOptions.style.value]}
        - Age Group: ${scriptOptions.age.options[scriptOptions.age.value]}
        - Platform: ${scriptOptions.platform.options[scriptOptions.platform.value]}
        - Meme Integration: ${scriptOptions.memes.options[scriptOptions.memes.value]}

        Script Structure:
        1. Hook (0:00-0:15):
           - Create an attention-grabbing opening
           - Use pattern interrupts
           - Tease the value viewers will get

        2. Intro (0:15-0:45):
           - Introduce yourself and establish credibility
           - Clear problem statement
           - Preview main points

        3. Main Content (0:45-${scriptOptions.duration.options[scriptOptions.duration.value]}:00):
           - 3-4 key sections with clear transitions
           - Include B-roll suggestions
           - Add camera angle variations
           - Suggest background music mood changes
           - Include timestamps for each section

        4. Conclusion:
           - Summarize key takeaways
           - Strong call-to-action
           - Engagement prompt (comment section)

        Format the output in markdown with:
        - Clear section headings (##)
        - Timestamps in bold
        - B-roll suggestions in italics
        - Camera angles in blockquotes
        - Music suggestions in code blocks

        Keep the tone ${scriptOptions.style.options[scriptOptions.style.value].toLowerCase()} and optimize for ${scriptOptions.platform.options[scriptOptions.platform.value]} audience retention.
      `.trim();

      const result = await model.generateContent(prompt);
      const generatedText = await result.response.text();
      
      // Check if aborted before updating state
      if (!newController.signal.aborted) {
        setScript(generatedText);
        success('Script generated successfully! 🎉');
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('Aborted')) {
        warning('Generation cancelled');
        return;
      }
      
      console.error('Generation error:', error);
      const errorMessage = error.message || 'Failed to generate script. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      // Only update states if not aborted
      if (!newController.signal.aborted) {
        setLoading(false);
        setController(null);
      }
    }
  };

  const handleFileShare = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        showError('Storage permission needed to share files');
        return;
      }

      info('Preparing file for sharing...');
      const fileName = `script-${Date.now()}.md`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, script);
      await Share.share({
        title: `YouTube Script: ${topic}`,
        url: fileUri,
        message: script,
      });
      success('Script shared successfully!');
    } catch (err) {
      console.error('Share error:', err);
      showError('Unable to share script. Please try again.');
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(script);
      success('Script copied to clipboard');
    } catch (error) {
      showError('Failed to copy script');
    }

  };

  // Add refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Update onRefresh with feedback
  const onRefresh = React.useCallback(() => {
    setIsRefreshing(true);
    triggerHaptic();
    setError('');
    info('Refreshing...');
    setTimeout(() => {
      setIsRefreshing(false);
      success('Refreshed successfully!');
    }, 1000);
  }, []);

  // Update topicSuggestions array
  const topicSuggestions = [
    { 
      icon: <Youtube size={24} color="#10a37f" />, 
      text: 'Tech Review',
      description: 'Product reviews',
    },
    { 
      icon: <Film size={24} color="#10a37f" />, 
      text: 'Tutorial',
      description: 'How-to guides',
    },
    { 
      icon: <Camera size={24} color="#10a37f" />, 
      text: 'Vlog',
      description: 'Daily content',
    },
    { 
      icon: <Mic size={24} color="#10a37f" />, 
      text: 'Podcast',
      description: 'Audio content',
    },
    { 
      icon: <Sparkles size={24} color="#10a37f" />, 
      text: 'Shorts',
      description: 'Quick videos',
    },
    { 
      icon: <BarChart2 size={24} color="#10a37f" />, 
      text: 'Analysis',
      description: 'Deep dives',
    },
  ];

  // Remove bottomSheet ref and snapPoints
  // Add modal visibility state
  const [modalVisible, setModalVisible] = useState(false);

  // Add new state for recording
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);

  // Add waveform animation state
  const [waveformScale, setWaveformScale] = useState(1);

  // Add speech recognition timeout reference
  const recordingTimeout = useRef<NodeJS.Timeout | null>(null);

  // Add new state for voice bubble
  const [showVoiceBubble, setShowVoiceBubble] = useState(false);
  
  // Add new state for settings bubble
  const [showSettingsBubble, setShowSettingsBubble] = useState(false);

  // Add new state for sound and playback
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Add effect to check if it's first time
  useEffect(() => {
    checkFirstTimeUser();
  }, []);

  // Add function to check first-time user
  const checkFirstTimeUser = async () => {
    try {
      const hasSeenSettings = await SecureStore.getItemAsync('hasSeenSettings');
      if (!hasSeenSettings) {
        setShowSettingsBubble(true);
      }
    } catch (error) {
      console.log('Error checking first time user:', error);
    }
  };

  // Update openOptions to handle first-time user
  const openOptions = async () => {
    if (showSettingsBubble) {
      try {
        await SecureStore.setItemAsync('hasSeenSettings', 'true');
        setShowSettingsBubble(false);
      } catch (error) {
        console.log('Error saving settings state:', error);
      }
    }
    setModalVisible(true);
  };

  // Update handleTopicSelect with feedback
  const handleTopicSelect = (topic: string) => {
    triggerHaptic();
    setTopic(topic);
    info(`Template selected: ${topic}`);
  };

  // Update handleMicPress to remove bubble logic
  const handleMicPress = () => {
    if (isRecording) {
      stopListening();
    } else {
      startListening();
    }
    triggerHaptic();
  };

  // Enhanced speech recognition handler
  useSpeechRecognitionEvent("result", (event) => {
    if (event.results) {
      const finalTranscript = event.results
        .filter(result => result.confidence > 0)
        .map(result => result.transcript)
        .join(' ');
      
      const currentInterim = event.results
        .filter(result => result.confidence === 0)
        .map(result => result.transcript)
        .join(' ');

      setTranscript(finalTranscript);
      setInterimTranscript(currentInterim);
    }
  });

  // Add waveform animation effect
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setWaveformScale(prev => prev === 1 ? 1.2 : 1);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isRecording]);

  // Add recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Update startListening to enable recording
  const startListening = async () => {
    try {
      // Check if speech recognition is available first
      const isAvailable = await ExpoSpeechRecognitionModule.isRecognitionAvailable();
      if (!isAvailable) {
        showError('Speech recognition is not available on this device');
        return;
      }

      // Request permissions
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!granted) {
        showError('Microphone access needed for voice input');
        return;
      }

      // Start recognition with improved options
      await ExpoSpeechRecognitionModule.start({
        lang: CONFIG.SPEECH_RECOGNITION.lang,
        interimResults: true,
        continuous: true,
        androidIntentOptions: {
          EXTRA_LANGUAGE_MODEL: "free_form",
          EXTRA_MAX_RESULTS: 1,
          EXTRA_PARTIAL_RESULTS: true,
          EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 0,
          EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 1500,
          EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 1000,
        },
        recordingOptions: {
          persist: true,
          outputFileName: `recording_${Date.now()}.wav`,
          outputSampleRate: 16000,
        }
      });

      setIsRecording(true);
      setTranscript('');
      setInterimTranscript('');
      setRecordingTime(0);
      
      // Set a maximum recording duration
      recordingTimeout.current = setTimeout(() => {
        if (isRecording) {
          stopListening();
          warning('Maximum recording duration reached');
        }
      }, 30000); // 30 seconds max

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      info('Listening... Speak now');
    } catch (error) {
      console.error('Speech recognition start error:', error);
      showError('Could not start voice recording');
      setIsRecording(false);
    }
  };

  // Update stopListening with better error handling
  const stopListening = async () => {
    try {
      await ExpoSpeechRecognitionModule.stop();
      setIsRecording(false);
      setWaveformScale(1);
      
      if (recordingTimeout.current) {
        clearTimeout(recordingTimeout.current);
      }

      const finalText = (transcript + ' ' + interimTranscript).trim();
      if (finalText) {
        const newTopic = (topic + ' ' + finalText).trim();
        setTopic(newTopic);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        success('Voice input added successfully!');
      } else {
        warning('No voice input detected');
      }
    } catch (error) {
      console.error('Speech recognition stop error:', error);
      showError('Could not stop recording');
    } finally {
      setIsRecording(false);
    }
  };

  // Update renderInput with enhanced UI

  

  // Update renderBottomBar with SlidersHorizontal instead of Plus
  const renderBottomBar = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      className="absolute bottom-0 left-0 right-0">
      <View className="bg-[#1e1f25] px-4 py-2 border-t border-[#383942] elevation-6">
        <View className="flex-row items-center gap-2">
          {/* Changed Plus to SlidersHorizontal */}
          <TouchableOpacity 
            onPress={openOptions}
            className="p-2 rounded-full active:bg-[#343541]">
            <SlidersHorizontal size={24} color="#ececf1" />
          </TouchableOpacity>

          {/* Input Container */}
          <View className="flex-1 flex-row items-center bg-[#2a2b32] border border-[#383942] rounded-full px-4 py-2 min-h-[44px]">
            {/* Text Input */}
            <TextInput
              placeholder={isRecording ? "Listening..." : "Message"}
              placeholderTextColor="#9ca3af"
              value={isRecording ? (transcript || 'Speak now...') : topic}
              onChangeText={isRecording ? undefined : setTopic}
              className="flex-1 text-[#ececf1] text-base android:py-1"
              multiline
              numberOfLines={1}
              maxLength={500}
              style={{
                maxHeight: 100,
                minHeight: 24,
              }}
              editable={!isRecording}
            />

            {/* Voice Input Button */}
            <TouchableOpacity 
              onPress={handleMicPress}
              className={`ml-2 p-2 rounded-full ${isRecording ? 'bg-[#10a37f]/20' : ''}`}>
              {isRecording ? (
                <View className="flex-row items-center gap-2">
                  <AudioWave isRecording={true} color="#10a37f" size={24} />
                  <TouchableOpacity 
                    onPress={stopListening}
                    className="p-1 rounded-full bg-[#ef4444]/20">
                    <MicOff size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <Mic size={24} color="#ececf1" />
              )}
            </TouchableOpacity>

            {/* Generate/Send Button */}
            <TouchableOpacity 
              onPress={() => generateScript(false)}
              disabled={loading || !topic.trim()}
              className="ml-2">
              {loading ? (
                <ActivityIndicator size="small" color="#10a37f" />
              ) : topic.trim() ? (
                <Sparkles size={24} color="#10a37f" />
              ) : (
                <View className="w-6 h-6 rounded-full border-2 border-[#565869] items-center justify-center">
                  <View className="w-3 h-3 rounded-full bg-[#565869]" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );

  // Update renderSuggestions function
  const renderSuggestions = () => (
    <View className="mb-4 sm:mb-6 px-2 sm:px-4 mt-40">
      <View className="max-w-[600px] mx-auto">
        <View className="flex-row flex-wrap justify-center gap-2 sm:gap-3">
          {topicSuggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleTopicSelect(suggestion.text)}
              className="w-[30%] max-w-[160px] p-3 sm:p-4 bg-[#2a2b32] rounded-xl border border-[#383942]">
              <View className="items-center">
                <View className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#1e1f25] items-center justify-center mb-2">
                  {suggestion.icon}
                </View>
                <Text className="text-white text-sm sm:text-base font-medium text-center mb-1">
                  {suggestion.text}
                </Text>
                {suggestion.description && (
                  <Text className="text-[#9ca3af] text-xs sm:text-sm text-center">
                    {suggestion.description}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  // Add closeOptions function
  const closeOptions = () => {
    setModalVisible(false);
    triggerHaptic();
  };

  // Add new functions for sound playback
  const playRecording = async (uri: string) => {
    try {
      // Unload any existing sound first
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setIsPlaying(true);

      // Handle playback finished
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status && 'didJustFinish' in status && status.didJustFinish) {
          setIsPlaying(false);
        }
      });

      await newSound.playAsync();
    } catch (error) {
      console.error('Error playing recording:', error);
      showError('Failed to play recording');
    }
  };

  const stopPlayback = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error stopping playback:', error);
    }
  };

  // Clean up sound when component unmounts
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Add Audio permission request in useEffect
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.error('Error setting up audio:', error);
      }
    };

    setupAudio();
  }, []);

  // Add cleanup function
  const cleanupOldRecordings = async () => {
    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (!cacheDir) return;

      const files = await FileSystem.readDirectoryAsync(cacheDir);
      
      for (const file of files) {
        if (file.startsWith('recording_') && file.endsWith('.wav')) {
          try {
            const filePath = cacheDir + file;
            const fileInfo = await FileSystem.getInfoAsync(filePath);
            
            if (fileInfo.exists && fileInfo.modificationTime) {
              const fileAge = Date.now() - fileInfo.modificationTime * 1000;
              if (fileAge > 60 * 60 * 1000) { // 1 hour
                await FileSystem.deleteAsync(filePath);
              }
            }
          } catch (error) {
            console.warn(`Failed to process file ${file}:`, error);
            continue;
          }
        }
      }
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
  };

  // Update handleCloseRecording
  const handleCloseRecording = async () => {
    setRecordingUri(null);
    setIsRecording(false);
    setRecordingTime(0);
    if (sound) {
      await stopPlayback();
    }
    // Clean up old recordings
    cleanupOldRecordings();
  };

  // Remove the router.replace call and modify the auth check
  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-[#343541]">
        <ActivityIndicator size="large" color={CONFIG.COLORS.primary} />
      </View>
    );
  }

  // Simply return null if not signed in - navigation is handled in root layout
  if (!isSignedIn) {
    return null;
  }


  // Update script display container for better readability
  const renderScriptDisplay = () => (
    script && (
      <View className="rounded-2xl sm:rounded-3xl bg-[#282A36] overflow-hidden border border-[#383A59] animate-fadeIn mb-16 sm:mb-20">
        <View className="flex-row items-center justify-between p-3 sm:p-4 bg-[#40414f] border-b border-[#383A59]">
          <Text className="text-[#ececf1] text-base sm:text-lg font-bold">Generated Script</Text>
          <View className="flex-row gap-2 sm:gap-3">
            <TouchableOpacity 
              className="p-2 sm:p-2.5 rounded-xl bg-[#343541] active:bg-[#2a2b32]"
              onPress={handleCopyToClipboard}>
              <Copy size={18} color="#10a37f" />
            </TouchableOpacity>
            <TouchableOpacity 
              className="p-2 sm:p-2.5 rounded-xl bg-[#343541] active:bg-[#2a2b32]"
              onPress={handleFileShare}>
              <Share2 size={18} color="#10a37f" />
            </TouchableOpacity>
          </View>
        </View>
        <View className="p-4 sm:p-5">
          <MarkdownContent content={script} />
        </View>
      </View>
    )
  );

  useSpeechRecognitionEvent("error", (event) => {
    setIsRecording(false); // Always reset recording state on error
    
    switch(event.error) {
      case 'not-allowed':
        showError('Microphone permission is required');
        break;
      case 'no-speech':
        warning('No speech detected');
        break;
      case 'network':
        showError('Network error - check your connection');
        break;
      case 'service-not-allowed':
        showError('Speech recognition is unavailable');
        break;
      case 'audio-capture':
        showError('Could not access microphone');
        break;
      case 'aborted':
        // Silent handling for user-initiated abort
        break;
      default:
        showError(`Recognition error: ${event.message}`);
    }
  });

  // Add volume change event handler
  useSpeechRecognitionEvent("volumechange", (event) => {
    // Value between -2 and 10, where <= 0 is inaudible
    const volume = Math.max(0, event.value);
    // Update wave animation based on volume
    setWaveformScale(1 + (volume / 20)); // Subtle scaling based on volume
  });

  // Improve audio cleanup
  useEffect(() => {
    const cleanup = async () => {
      try {
        if (sound) {
          await sound.unloadAsync();
        }
        if (isRecording) {
          await ExpoSpeechRecognitionModule.abort();
        }
        if (recordingTimeout.current) {
          clearTimeout(recordingTimeout.current);
        }
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    };

    return () => {
      cleanup();
    };
  }, [sound, isRecording]);

  const { instance } = useLocalSearchParams();
  
  // Reset state when instance changes
  useEffect(() => {
    if (instance) {
      setTopic('');
      setScript('');
      setError('');
      setLoading(false);
    }
  }, [instance]);

  return (
    <SafeAreaView className="flex-1 bg-[#1e1f25]">
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ 
            padding: 12,
            paddingBottom: Platform.select({ 
              ios: 180,  // Increased padding for iOS
              android: 160 // Increased padding for Android
            }) 
          }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#10a37f"
              colors={['#10a37f']}
              progressBackgroundColor="#1e1f25"
            />
          }>

          {!script && !loading && renderSuggestions()}
          {renderScriptDisplay()}

        </ScrollView>

        {renderBottomBar()}

        <ModalSettings
          visible={modalVisible}
          scriptOptions={scriptOptions}
          updateScriptOption={updateScriptOption}
          closeOptions={closeOptions}
        />

        {loading && (
          <View className="absolute inset-0 justify-center items-center bg-black/80">
            <GeneratingAnimation onCancel={stopGeneration} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default MainPage;