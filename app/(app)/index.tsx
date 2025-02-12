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
  ChevronRight,
  SlidersHorizontal,
  Globe,
  Clock,
  Users,
  Palette,
  User,
  Monitor,
  Smile
} from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
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

import { useScriptStore, languageFlags, optionIcons, optionMetadata } from '@/store/scriptStore';


// Environment configuration (should use actual environment variables in production)
const CONFIG = {
  GEMINI_API_KEY:
    Constants.expoConfig?.extra?.GOOGLE_GEMINI_API_KEY || 'AIzaSyAs4vFUhoajF79bzBdpP1fgVNgPa8whAEU',
  COLORS: {
    primary: '#10a37f',      // Updated to match green theme
    secondary: '#0e906f',    // Darker green for active states
    background: '#343541',   // Updated background color
    surface: '#40414f',      // Updated surface color
    inputBg: '#40414f',      // Updated input background
    border: '#565869',       // Updated border color
    text: {
      primary: '#ffffff',    // White text
      secondary: '#9ca3af',  // Gray text
    },
    error: '#ef4444',        // Error red
  },
};

interface OptionButtonProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

const OptionButton: React.FC<OptionButtonProps> = ({ label, isSelected, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={{
      minWidth: 80,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: isSelected ? '#10a37f' : '#343541',
      borderWidth: 1,
      borderColor: isSelected ? '#10a37f' : '#565869',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
    <Text 
      style={{
        color: isSelected ? '#ffffff' : '#9ca3af',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
      }}>
      {label}
    </Text>
  </TouchableOpacity>
);

// Update the OptionSection component to show icons and emojis
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
    <View style={{ marginBottom: 20 }}>
      <View className="flex-row items-center gap-2 mb-3">
        <Text className="text-[#10a37f] text-lg">{icon?.emoji}</Text>
        <Text className="text-[#9ca3af] text-base font-medium">
          {title}
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
          // Get the corresponding emoji for this option if available
          const optionEmoji = metadata?.icons?.[index] || '';
          
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
              {optionEmoji && (
                <Text className="text-base">{optionEmoji}</Text>
              )}
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
    onRequestClose={closeOptions}>
    <View className="flex-1 bg-black/50">
      <View className="mt-auto h-[75%] bg-[#343541] rounded-t-3xl">
        <View className="px-4 mb-4 flex-row items-center justify-between border-b border-[#565869]/30 py-4">
          <Text className="text-xl font-bold text-white">Script Settings</Text>
          <TouchableOpacity 
            className="p-1 active:opacity-70"
            onPress={closeOptions}>
            <X size={26} color="#9ca3af" />
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

// Update the GeneratingAnimation component to accept and use the stopGeneration prop
const GeneratingAnimation = ({ onCancel }: { onCancel?: () => void }) => {
  const [dots, setDots] = useState(0);
  const icons = [
    { icon: <Sparkles size={24} color="#10a37f" />, label: "Crafting ideas" },
    { icon: <Globe size={24} color="#10a37f" />, label: "Researching" },
    { icon: <Clock size={24} color="#10a37f" />, label: "Structuring" },
    { icon: <Users size={24} color="#10a37f" />, label: "Personalizing" },
    { icon: <Palette size={24} color="#10a37f" />, label: "Styling" },
    { icon: <User size={24} color="#10a37f" />, label: "Reviewing" },
    { icon: <Monitor size={24} color="#10a37f" />, label: "Optimizing" },
    { icon: <Smile size={24} color="#10a37f" />, label: "Finalizing" },
  ];

  const [currentIconIndex, setCurrentIconIndex] = useState(0);

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev + 1) % 4);
    }, 500);

    const iconInterval = setInterval(() => {
      setCurrentIconIndex((prev) => (prev + 1) % icons.length);
    }, 2000);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(iconInterval);
    };
  }, []);

  return (
    <View className="items-center p-6 rounded-2xl bg-[#444654] mx-4 border border-[#565869]/50">
      {/* Animated Icon Container */}
      <View className="w-16 h-16 mb-4 items-center justify-center bg-[#10a37f]/10 rounded-full">
        <View className="animate-pulse">
          {icons[currentIconIndex].icon}
        </View>
      </View>

      {/* Progress Bar */}
      <View className="w-48 h-1.5 bg-[#565869]/30 rounded-full mb-4 overflow-hidden">
        <View 
          className="h-full bg-[#10a37f] rounded-full"
          style={{
            width: `${((currentIconIndex + 1) / icons.length) * 100}%`,
          }}
        />
      </View>

      {/* Status Text */}
      <View className="items-center">
        <Text className="text-[#10a37f] text-lg font-semibold mb-1">
          {icons[currentIconIndex].label}
        </Text>
        <Text className="text-[#9ca3af] text-base">
          {`Please wait${'.'.repeat(dots)}`}
        </Text>
      </View>

      {/* Tips Carousel */}
      <View className="mt-6 p-4 bg-[#343541] rounded-xl border border-[#565869]/20">
        <Text className="text-[#ececf1] text-sm text-center italic">
          💡 Tip: {[
            "Scripts are optimized for maximum engagement",
            "Each section is carefully structured for flow",
            "Adding visual cues for better retention",
            "Incorporating proven storytelling techniques",
          ][currentIconIndex % 4]}
        </Text>
      </View>

      {/* Update Cancel Button */}
      {onCancel && (
        <TouchableOpacity
          className="mt-4 px-6 py-2.5 rounded-full border border-[#10a37f]/30 bg-[#10a37f]/10 active:bg-[#10a37f]/20"
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
const EmptyState = () => (
  <View className="items-center justify-center py-8">
    <View className="bg-[#40414f] p-6 rounded-full mb-4">
      <Sparkles size={32} color="#10a37f" />
    </View>
    <Text className="text-[#ececf1] text-xl font-bold mb-2">Ready to Create</Text>
    <Text className="text-[#9ca3af] text-center px-6">
      Enter your topic above and let AI craft your perfect script
    </Text>
  </View>
);

const MainPage = () => {
  const { info, success, warning, error: showError } = useToast();
  
  const {
    topic,
    script,
    loading,
    error: scriptError,
    showOptions,
    scriptOptions,
    setTopic,
    setScript,
    setLoading,
    setError,
    setShowOptions,
    updateScriptOption,
  } = useScriptStore();

  const { isLoaded, isSignedIn } = useAuth();

  // Add state for controlling generation  };

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
    { text: 'Finalizing your script... ��', color: '#8e8ea0' },
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

  // Enhance generate script with haptics and animations
  const generateScript = async (isRegenerate: boolean = false) => {
    if (!topic.trim()) {
      triggerHaptic();
      showError('Please enter a topic before generating');
      return;
    }

    triggerHaptic();
    if (isRegenerate) {
      setScript('');
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

      if (!CONFIG.GEMINI_API_KEY) {
        throw new Error('Missing API key configuration');
      }

      const result = await model.generateContent(prompt);
      const generatedText = await result.response.text();
      
      // Check if aborted before updating state
      if (!newController.signal.aborted) {
        setScript(generatedText);
        success('Script generated successfully!');
      }
    } catch (error: any) {
      // Handle abort case first
      if (error.name === 'AbortError' || error.message?.includes('Aborted')) {
        return; // Exit early without showing error
      }
      
      // Handle other errors
      console.error('Generation error:', error);
      const errorMessage = error.message || 'Failed to generate script. Please check your connection and try again.';
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
        showError('Storage permission required to share files');
        return;
      }

      const fileName = `script-${Date.now()}.md`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, script);
      await Share.share({
        title: `YouTube Script: ${topic}`,
        url: fileUri,
        message: script,
      });
    } catch (err) {
      console.error('Share error:', err);
      showError('Failed to save or share the script');
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
  
  // Add pull-to-refresh feedback
  const onRefresh = React.useCallback(() => {
    setIsRefreshing(true);
    triggerHaptic();
    setError('');
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  // Update topic suggestions UI
  const topicSuggestions = [
    { 
      icon: <Youtube size={24} color="#10a37f" />, 
      text: 'Tech Review',
      description: 'Create engaging product reviews',
      bg: 'bg-[#10a37f15]',
      border: 'border-[#10a37f40]'
    },
    { 
      icon: <Film size={24} color="#10a37f" />, 
      text: 'Film Analysis',
      description: 'Break down movies and shows',
      bg: 'bg-[#10a37f15]',
      border: 'border-[#10a37f40]'
    },
    { 
      icon: <Camera size={20} color="#10a37f" />, 
      text: 'Photography tutorial',
      bg: 'bg-[#10a37f10]',
      border: 'border-[#10a37f]'
    },
    { 
      icon: <Mic size={20} color="#10a37f" />, 
      text: 'Podcast episode',
      bg: 'bg-[#10a37f10]',
      border: 'border-[#10a37f]'
    },
    { 
      icon: <Sparkles size={20} color="#10a37f" />, 
      text: 'Viral challenge idea',
      bg: 'bg-[#10a37f10]',
      border: 'border-[#10a37f]'
    }
  ];

  // Remove bottomSheet ref and snapPoints
  // Add modal visibility state
  const [modalVisible, setModalVisible] = useState(false);

  // Update open/close handlers
  const openOptions = () => setModalVisible(true);
  const closeOptions = () => setModalVisible(false);

  // Enhance topic suggestions with haptics
  const handleTopicSelect = (topic: string) => {
    triggerHaptic();
    setTopic(topic);
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

  const renderInput = () => (
    <TextInput
      placeholder="What's your video about?"
      placeholderTextColor="#9ca3af"
      value={topic}
      onChangeText={setTopic}
      className="flex-1 rounded-xl bg-[#40414f] px-4 py-4 text-white text-base border-2 border-[#565869] focus:border-[#10a37f]"
      onFocus={triggerHaptic}
    />
  );

  const renderGenerateButton = () => (
    <TouchableOpacity
      className={`rounded-xl p-4 ${
        loading ? 'bg-[#10a37f]/80' : 'bg-[#10a37f] active:bg-[#0e906f]'
      }`}
      onPress={() => generateScript(false)}
      disabled={loading}>
      {loading ? (
        <GeneratingAnimation onCancel={stopGeneration} />
      ) : (
        <Sparkles color="white" size={24} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#343541]">
      {/* Modern Header
      <View className="px-4 py-4 border-b border-[#565869]/30 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Sparkles size={24} color="#10a37f" />
          <Text className="text-white text-xl font-bold">Script AI</Text>
        </View>
        <TouchableOpacity 
          className="p-2.5 rounded-full bg-[#40414f] active:bg-[#565869]"
          onPress={openOptions}>
          <Settings size={22} color="#10a37f" />
        </TouchableOpacity>
      </View> */}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ 
            padding: 16,
            paddingBottom: Platform.select({ ios: 120, android: 140 }) 
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#10a37f"
              colors={['#10a37f']}
              progressBackgroundColor="#343541"
            />
          }>

          {/* Show empty state when no script and not loading */}
          {!script && !loading && <EmptyState />}

          {/* Enhanced topic suggestions with better feedback */}
          {!script && !loading && (
            <View className="mb-6">
              <View className="flex-row items-center gap-2 mb-4">
                <Lightbulb size={22} color="#10a37f" />
                <Text className="text-[#F8FAFC] text-lg font-semibold">Quick Templates</Text>
              </View>
              <View className="gap-3">
                {topicSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    className="flex-row items-center gap-4 rounded-2xl p-4 bg-[#282A36] border border-[#383A59] active:bg-[#2D2D3D]"
                    onPress={() => handleTopicSelect(suggestion.text)}>
                    <View className="p-2.5 bg-[#10a37f]/10 rounded-xl">
                      {React.cloneElement(suggestion.icon, { color: '#10a37f' })}
                    </View>
                    <View className="flex-1">
                      <Text className="text-[#F8FAFC] text-base font-semibold">
                        {suggestion.text}
                      </Text>
                      {suggestion.description && (
                        <Text className="text-[#94A3B8] text-sm mt-0.5">
                          {suggestion.description}
                        </Text>
                      )}
                    </View>
                    <ChevronRight size={20} color="#10a37f" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Enhanced script display with animations */}
          {script && (
            <View className="rounded-3xl bg-[#282A36] overflow-hidden border border-[#383A59] animate-fadeIn">
              <View className="flex-row items-center justify-between p-4 bg-[#40414f]">
                <Text className="text-[#ececf1] text-lg font-bold">Your Script</Text>
                <View className="flex-row gap-4">
                  <TouchableOpacity 
                    className="p-2 rounded-lg bg-[#343541] active:opacity-80"
                    onPress={handleCopyToClipboard}>
                    <Copy size={20} color="#10a37f" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className="p-2 rounded-lg bg-[#343541] active:opacity-80"
                    onPress={handleFileShare}>
                    <Share2 size={20} color="#10a37f" />
                  </TouchableOpacity>
                </View>
              </View>
              <View className="p-4">
                <MarkdownContent content={script} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Enhanced input bar with visual feedback */}
        <View className="w-full border-t border-[#565869]/30 bg-[#343541] px-4 py-4">
          <View className="flex-row items-center gap-3">
            <TextInput
              placeholder="What's your video about?"
              placeholderTextColor="#9ca3af"
              value={topic}
              onChangeText={setTopic}
              className="flex-1 rounded-xl bg-[#40414f] px-4 py-4 text-white text-base border-2 border-[#565869] focus:border-[#10a37f]"
              onFocus={triggerHaptic}
            />
            <TouchableOpacity
              className={`rounded-xl p-4 ${
                loading ? 'bg-[#10a37f]/80' : 'bg-[#10a37f] active:bg-[#0e906f]'
              }`}
              onPress={() => generateScript(false)}
              disabled={loading}>
              {loading ? (
                <GeneratingAnimation onCancel={stopGeneration} />
              ) : (
                <Sparkles color="white" size={24} />
              )}
            </TouchableOpacity>
          </View>
          
          {/* Enhanced settings button */}
          <TouchableOpacity 
            onPress={() => {
              triggerHaptic();
              openOptions();
            }}
            className="mt-3 flex-row items-center justify-center py-3 px-4 rounded-xl bg-[#40414f] active:bg-[#565869]">
            <SlidersHorizontal size={16} color="#10a37f" />
            <Text className="ml-2 text-[#94A3B8] text-sm font-medium">
              Customize Script Settings
            </Text>
          </TouchableOpacity>
        </View>

        {/* Replace BottomSheet with ModalSettings */}
        <ModalSettings
          visible={modalVisible}
          scriptOptions={scriptOptions}
          updateScriptOption={updateScriptOption}
          closeOptions={closeOptions}
        />

        {/* Update Loading Overlay */}
        {loading && (
          <View className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center bg-[#343541]/95">
            <GeneratingAnimation onCancel={stopGeneration} />
          </View>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default MainPage;
