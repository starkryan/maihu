import { create } from 'zustand';
import { Globe, Clock, Users, Palette, User, Monitor, Smile, MessageCircle, Layout, Gauge, Heart, PointerIcon } from 'lucide-react-native';
import { LucideIcon } from 'lucide-react-native';

// Update language flags to include both flag and icon component
export const languageFlags = {
  "English": { flag: "🇺🇸", icon: Globe },
  "Spanish": { flag: "🇪🇸", icon: Globe },
  "French": { flag: "🇫🇷", icon: Globe },
  "German": { flag: "🇩🇪", icon: Globe },
  "Italian": { flag: "🇮🇹", icon: Globe },
  "Portuguese": { flag: "🇵🇹", icon: Globe },
  "Hindi": { flag: "🇮🇳", icon: Globe },
  "Chinese": { flag: "🇨🇳", icon: Globe },
  "Japanese": { flag: "🇯🇵", icon: Globe },
  "Korean": { flag: "🇰🇷", icon: Globe }
} as const;

// Update option icons with Lucide components
export const optionIcons = {
  language: { icon: Globe, emoji: '🌐' },
  duration: { icon: Clock, emoji: '⏱️' },
  audience: { icon: Users, emoji: '👥' },
  style: { icon: Palette, emoji: '🎨' },
  age: { icon: User, emoji: '👤' },
  platform: { icon: Monitor, emoji: '🖥️' },
  memes: { icon: Smile, emoji: '😊' },
  tone: { icon: MessageCircle, emoji: '💭' },
  format: { icon: Layout, emoji: '📺' },
  pacing: { icon: Gauge, emoji: '⚡' },
  engagement: { icon: Heart, emoji: '❤️' },
  callToAction: { icon: PointerIcon, emoji: '��' }
} as const;

// Add option metadata for better organization
export const optionMetadata = {
  duration: {
    options: ['2-3 minutes', '4-5 minutes', '6-8 minutes', '9-10 minutes'],
    icons: ['⚡', '⏱️', '⏲️', '🕒']
  },
  audience: {
    options: ['General', 'Beginners', 'Intermediate', 'Advanced'],
    icons: ['👥', '🌱', '📚', '🎓']
  },
  style: {
    options: ['Educational', 'Entertainment', 'Tutorial', 'Vlog', 'Review'],
    icons: ['📚', '🎭', '📝', '🎥', '⭐']
  },
  age: {
    options: ['All Ages', 'Kids', 'Teens', 'Young Adults', 'Adults'],
    icons: ['👨‍👩‍👧‍👦', '👶', '🧑‍🦱', '👱', '🧑']
  },
  platform: {
    options: ['YouTube', 'Instagram', 'TikTok', 'Facebook', 'LinkedIn'],
    icons: ['▶️', '📸', '🎵', '👍', '💼']
  },
  memes: {
    options: ['None', 'Minimal', 'Moderate', 'Heavy'],
    icons: ['🚫', '😊', '😎', '🤣']
  },
  tone: {
    options: ['Professional', 'Casual', 'Humorous', 'Serious', 'Inspirational', 'Dramatic'],
    icons: ['👔', '😊', '😄', '😐', '✨', '🎭']
  },
  format: {
    options: ['Talking Head', 'Voice Over', 'Interview', 'Documentary', 'Animation', 'Mixed'],
    icons: ['🗣️', '🎙️', '🎤', '🎥', '🎨', '🔄']
  },
  pacing: {
    options: ['Slow', 'Moderate', 'Fast', 'Dynamic'],
    icons: ['🐢', '⚡', '🏃', '🎢']
  },
  engagement: {
    options: ['Q&A', 'Challenges', 'Polls', 'Stories', 'Tips', 'How-to'],
    icons: ['❓', '🏆', '📊', '📖', '💡', '📝']
  },
  callToAction: {
    options: ['Subscribe', 'Like & Share', 'Comment', 'Visit Website', 'Follow Social', 'Join Community'],
    icons: ['🔔', '❤️', '💬', '🌐', '📱', '👥']
  }
} as const;

interface ScriptOption {
  value: number;
  options: string[];
}

interface ScriptState {
  topic: string;
  script: string;
  loading: boolean;
  error: string;
  showOptions: boolean;
  scriptOptions: {
    language: {
      options: Array<keyof typeof languageFlags>;
      value: number;
    };
    duration: {
      options: string[];
      value: number;
    };
    audience: {
      options: string[];
      value: number;
    };
    style: {
      options: string[];
      value: number;
    };
    age: {
      options: string[];
      value: number;
    };
    platform: {
      options: string[];
      value: number;
    };
    memes: {
      options: string[];
      value: number;
    };
    tone: ScriptOption;
    format: ScriptOption;
    pacing: ScriptOption;
    engagement: ScriptOption;
    callToAction: ScriptOption;
  };
  setTopic: (topic: string) => void;
  setScript: (script: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  setShowOptions: (show: boolean) => void;
  updateScriptOption: (key: string, value: number) => void;
}

export const useScriptStore = create<ScriptState>((set) => ({
  topic: '',
  script: '',
  loading: false,
  error: '',
  showOptions: false,
  scriptOptions: {
    language: {
      options: Object.keys(languageFlags) as Array<keyof typeof languageFlags>,
      value: 0,
    },
    duration: {
      options: ['2-3 minutes', '4-5 minutes', '6-8 minutes', '9-10 minutes'],
      value: 0,
    },
    audience: {
      options: ['General', 'Beginners', 'Intermediate', 'Advanced'],
      value: 0,
    },
    style: {
      options: ['Educational', 'Entertainment', 'Tutorial', 'Vlog', 'Review'],
      value: 0,
    },
    age: {
      options: ['All Ages', 'Kids', 'Teens', 'Young Adults', 'Adults'],
      value: 0,
    },
    platform: {
      options: ['YouTube', 'Instagram', 'TikTok', 'Facebook', 'LinkedIn'],
      value: 0,
    },
    memes: {
      options: ['None', 'Minimal', 'Moderate', 'Heavy'],
      value: 0,
    },
    tone: {
      value: 0,
      options: ['Professional', 'Casual', 'Humorous', 'Serious', 'Inspirational', 'Dramatic']
    },
    format: {
      value: 0,
      options: ['Talking Head', 'Voice Over', 'Interview', 'Documentary', 'Animation', 'Mixed']
    },
    pacing: {
      value: 0,
      options: ['Slow', 'Moderate', 'Fast', 'Dynamic']
    },
    engagement: {
      value: 0,
      options: ['Q&A', 'Challenges', 'Polls', 'Stories', 'Tips', 'How-to']
    },
    callToAction: {
      value: 0,
      options: ['Subscribe', 'Like & Share', 'Comment', 'Visit Website', 'Follow Social', 'Join Community']
    }
  },
  setTopic: (topic) => set({ topic }),
  setScript: (script) => set({ script }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setShowOptions: (show) => set({ showOptions: show }),
  updateScriptOption: (key, value) =>
    set((state) => ({
      scriptOptions: {
        ...state.scriptOptions,
        [key]: {
          ...state.scriptOptions[key as keyof typeof state.scriptOptions],
          value,
        },
      },
    })),
})); 