import React, {createContext, useContext, ReactNode} from 'react';
import {colors, typography, spacing} from '../theme/aivoTheme';

interface ThemeContextType {
  colors: typeof colors;
  typography: typeof typography;
  spacing: typeof spacing;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{children: ReactNode}> = ({children}) => {
  return (
    <ThemeContext.Provider value={{colors, typography, spacing}}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
