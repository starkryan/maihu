import React, { createContext, useContext, useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { View, Text } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useToast } from './Toast/components/ToastManager';

interface NetworkContextType {
  isConnected: boolean;
}

const NetworkContext = createContext<NetworkContextType>({ isConnected: true });

export const useNetworkContext = () => useContext(NetworkContext);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = React.useState(true);
  const { info, success, warning, error: toastError } = useToast();
  const [previousState, setPreviousState] = React.useState(true);

  useEffect(() => {
    // Initial check
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected ?? true);
      setPreviousState(state.isConnected ?? true);
    });

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      const newConnectionState = state.isConnected ?? true;
      setIsConnected(newConnectionState);
      
      if (newConnectionState !== previousState) {
        if (newConnectionState) {
          success('Back Online, Internet connection restored');
        } else {
          warning('Offline, No internet connection available');
        }
        setPreviousState(newConnectionState);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [previousState]);

  return (
    <NetworkContext.Provider value={{ isConnected }}>
      {children}
    </NetworkContext.Provider>
  );
};
