import { MD3DarkTheme, MD3LightTheme, adaptNavigationTheme } from 'react-native-paper';
import { DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

const baseFont = {
  fontFamily: 'System',
  letterSpacing: 0,
  fontWeight: 'normal' as const,
};

const fonts = {
  displayLarge: { ...baseFont },
  displayMedium: { ...baseFont },
  displaySmall: { ...baseFont },
  headlineLarge: { ...baseFont },
  headlineMedium: { ...baseFont },
  headlineSmall: { ...baseFont },
  titleLarge: { ...baseFont },
  titleMedium: { ...baseFont },
  titleSmall: { ...baseFont },
  labelLarge: { ...baseFont },
  labelMedium: { ...baseFont },
  labelSmall: { ...baseFont },
  bodyLarge: { ...baseFont },
  bodyMedium: { ...baseFont },
  bodySmall: { ...baseFont },
};

const lightTheme = {
  ...MD3LightTheme,
  ...LightTheme,
  fonts,
  colors: {
    ...MD3LightTheme.colors,
    ...LightTheme.colors,
    primary: '#2196F3',
    secondary: '#03DAC6',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#000000',
    textSecondary: '#666666',
    border: '#E0E0E0',
    error: '#B00020',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  ...DarkTheme,
  fonts,
  colors: {
    ...MD3DarkTheme.colors,
    ...DarkTheme.colors,
    primary: '#90CAF9',
    secondary: '#03DAC6',
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    border: '#2C2C2C',
    error: '#CF6679',
  },
};

type Theme = typeof lightTheme;

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  isDarkMode: false,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('isDarkMode');
      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme));
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('isDarkMode', JSON.stringify(newMode));
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}; 