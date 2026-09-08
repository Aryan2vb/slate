import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type ThemeMode = 'auto' | 'dark' | 'light';

export interface ThemeColors {
  bg: string;
  card: string;
  cardBorder: string;
  text: string;
  textMuted: string;
  textSecondary: string;
  buttonBg: string;
  buttonText: string;
  dateBoxBg: string;
  pillBg: string;
  pillBorder: string;
  inputBg: string;
  divider: string;
  barStyle: 'light-content' | 'dark-content';
}

const darkColors: ThemeColors = {
  bg: '#161719',
  card: '#202125',
  cardBorder: '#2A2C31',
  text: '#FFFFFF',
  textMuted: '#8E929B',
  textSecondary: '#D1D5DB',
  buttonBg: '#FFFFFF',
  buttonText: '#000000',
  dateBoxBg: '#2A2B30',
  pillBg: '#26272C',
  pillBorder: '#34363E',
  inputBg: '#24252A',
  divider: '#28292E',
  barStyle: 'light-content',
};

const lightColors: ThemeColors = {
  bg: '#FBFBF9',
  card: '#FFFFFF',
  cardBorder: '#EBEAE5',
  text: '#1F2421',
  textMuted: '#7E827A',
  textSecondary: '#5A6055',
  buttonBg: '#1F2421',
  buttonText: '#FFFFFF',
  dateBoxBg: '#F4F3EE',
  pillBg: '#F4F3EE',
  pillBorder: '#E5E3D8',
  inputBg: '#F4F3EE',
  divider: '#EBEAE5',
  barStyle: 'dark-content',
};

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
}

const THEME_STORAGE_KEY = 'slate_theme_mode';

const ThemeContext = createContext<ThemeContextType>({
  mode: 'auto',
  isDark: true,
  colors: darkColors,
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('auto');

  useEffect(() => {
    void (async () => {
      try {
        const saved = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
        if (saved === 'dark' || saved === 'light' || saved === 'auto') {
          setModeState(saved as ThemeMode);
        }
      } catch {
        // Fall back to auto
      }
    })();
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    void SecureStore.setItemAsync(THEME_STORAGE_KEY, newMode).catch(() => {});
  };

  const isDark = mode === 'auto' ? systemScheme !== 'light' : mode === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ mode, isDark, colors, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
