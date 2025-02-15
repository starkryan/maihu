import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';

interface AudioWaveProps {
  isRecording: boolean;
  color?: string;
}

const AudioWave = ({ isRecording, color = '#10a37f' }: AudioWaveProps) => {
  // Create refs for multiple bars
  const barCount = 6;
  const barRefs = useRef(Array.from({ length: barCount }, () => new Animated.Value(0)));

  useEffect(() => {
    if (isRecording) {
      // Animate each bar with different timing
      barRefs.current.forEach((bar, index) => {
        const createAnimation = () => {
          Animated.sequence([
            Animated.timing(bar, {
              toValue: 1,
              duration: 500 + (index * 100), // Stagger the animations
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(bar, {
              toValue: 0.3,
              duration: 500 + (index * 100),
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]).start(() => {
            if (isRecording) {
              createAnimation(); // Loop while recording
            }
          });
        };
        
        // Start with slight delay for each bar
        setTimeout(() => createAnimation(), index * 100);
      });
    } else {
      // Reset all bars when not recording
      barRefs.current.forEach(bar => {
        Animated.timing(bar, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [isRecording]);

  return (
    <View className="flex-row items-center justify-center gap-1 h-8">
      {barRefs.current.map((bar, index) => (
        <Animated.View
          key={index}
          style={{
            width: 3,
            height: 24,
            backgroundColor: color,
            borderRadius: 2,
            opacity: bar,
            transform: [{
              scaleY: bar.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              }),
            }],
          }}
        />
      ))}
    </View>
  );
};

export default AudioWave;