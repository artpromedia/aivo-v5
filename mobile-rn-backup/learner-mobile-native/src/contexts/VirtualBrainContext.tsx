import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {VirtualBrainState} from '../types';

interface VirtualBrainContextType {
  currentState: VirtualBrainState | null;
  isActive: boolean;
  updateState: (state: VirtualBrainState) => void;
}

const VirtualBrainContext = createContext<VirtualBrainContextType | undefined>(undefined);

export const VirtualBrainProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const [currentState, setCurrentState] = useState<VirtualBrainState | null>(null);
  const [isActive, setIsActive] = useState(false);

  const updateState = (state: VirtualBrainState) => {
    setCurrentState(state);
    setIsActive(true);
  };

  return (
    <VirtualBrainContext.Provider
      value={{
        currentState,
        isActive,
        updateState,
      }}>
      {children}
    </VirtualBrainContext.Provider>
  );
};

export const useVirtualBrainContext = () => {
  const context = useContext(VirtualBrainContext);
  if (!context) {
    throw new Error('useVirtualBrainContext must be used within VirtualBrainProvider');
  }
  return context;
};
