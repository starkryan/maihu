import { useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

export const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      try {
        void WebBrowser.warmUpAsync();
        return () => {
          try {
            void WebBrowser.coolDownAsync();
          } catch (error) {
            console.error('Error cooling down browser:', error);
          }
        };
      } catch (error) {
        console.error('Error warming up browser:', error);
      }
    }
  }, []);
};