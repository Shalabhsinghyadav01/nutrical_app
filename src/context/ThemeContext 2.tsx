import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
  colors: typeof lightColors;
}

// Light theme colors
export const lightColors = {
  primary: '#4CAF50',
  secondary: '#2196F3',
  background: '#f8f9fa',
  surface: '#FFFFFF',
  text: '#1a1a1a',
  textSecondary: '#666666',
  border: '#E0E0E0',
  error: '#FF5252',
  success: '#4CAF50',
  progressBackground: '#E8F5E9',
  cardShadow: '#000000',
  inputBackground: '#f8f9fa',
};

// Dark theme colors
export const darkColors = {
  primary: '#66BB6A',
  secondary: '#42A5F5',
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#333333',
  error: '#FF5252',
  success: '#66BB6A',
  progressBackground: '#1B5E20',
  cardShadow: '#000000',
  inputBackground: '#2C2C2C',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>(systemColorScheme || 'light');

  useEffect(() => {
    // Update theme when system color scheme changes
    if (systemColorScheme) {
      setTheme(systemColorScheme);
    }
  }, [systemColorScheme]);

  const toggleTheme = () => {
    setTheme(current => (current === 'light' ? 'dark' : 'light'));
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 