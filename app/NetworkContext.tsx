import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useToast } from './Toast/components/ToastManager';

interface NetworkContextType {
  isConnected: boolean;
}

const NetworkContext = createContext<NetworkContextType>({ isConnected: true });

export const useNetworkContext = () => useContext(NetworkContext);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const { success, warning } = useToast();
  const previousState = useRef(true);

  useEffect(() => {
    // Initial network check
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected ?? true);
      previousState.current = state.isConnected ?? true;
    });

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      const newConnectionState = state.isConnected ?? true;
      
      if (newConnectionState !== previousState.current) {
        setIsConnected(newConnectionState);
        previousState.current = newConnectionState;

        if (newConnectionState) {
          success('Back Online, Internet connection restored');
        } else {
          warning('Offline, No internet connection available');
        }
      }
    });

    return unsubscribe;
  }, []);

  return (
    <NetworkContext.Provider value={{ isConnected }}>
      {children}
    </NetworkContext.Provider>
  );
};

export default NetworkProvider;
