import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useSystemSetting, useUpdateSystemSetting } from '@/hooks/useSystemSettings';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeStyle = 'default' | 'liquid-glass';

interface ThemeContextType {
  mode: ThemeMode;
  style: ThemeStyle;
  setMode: (mode: ThemeMode) => void;
  setStyle: (style: ThemeStyle) => void;
  isDark: boolean;
  isLiquidGlass: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [style, setStyleState] = useState<ThemeStyle>('liquid-glass');
  const [isDark, setIsDark] = useState(false);

  // Load theme style from database
  const { data: themeStyleSetting } = useSystemSetting('app_theme_style');
  const updateSystemSetting = useUpdateSystemSetting();

  // Load theme mode from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode;
    if (savedMode) {
      setModeState(savedMode);
    }
  }, []);

  // Load theme style from database
  useEffect(() => {
    if (themeStyleSetting?.value) {
      const dbStyle = themeStyleSetting.value as ThemeStyle;
      if (dbStyle === 'default' || dbStyle === 'liquid-glass') {
        setStyleState(dbStyle);
      }
    }
  }, [themeStyleSetting]);

  // Handle dark mode based on mode preference
  useEffect(() => {
    const updateDarkMode = () => {
      let shouldBeDark = false;

      if (mode === 'dark') {
        shouldBeDark = true;
      } else if (mode === 'light') {
        shouldBeDark = false;
      } else {
        // System preference
        shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      setIsDark(shouldBeDark);

      // Update document classes
      const root = document.documentElement;
      root.classList.remove('dark', 'light');
      if (shouldBeDark) {
        root.classList.add('dark');
      }
    };

    updateDarkMode();

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (mode === 'system') {
        updateDarkMode();
      }
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [mode]);

  // Handle theme style class
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-default', 'theme-liquid-glass');
    root.classList.add(`theme-${style}`);
  }, [style]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('theme-mode', newMode);
  };

  const setStyle = async (newStyle: ThemeStyle) => {
    setStyleState(newStyle);
    try {
      await updateSystemSetting.mutateAsync({
        key: 'app_theme_style',
        value: newStyle
      });
    } catch (error) {
      console.error('Failed to save theme style:', error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        style,
        setMode,
        setStyle,
        isDark,
        isLiquidGlass: style === 'liquid-glass',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Hook for components that need to know about theme without the full context
export function useThemeStyle(): ThemeStyle {
  const { data: themeStyleSetting } = useSystemSetting('app_theme_style');
  
  // Default to liquid-glass if no setting is found
  if (themeStyleSetting?.value === 'default') {
    return 'default';
  }
  return 'liquid-glass';
}
