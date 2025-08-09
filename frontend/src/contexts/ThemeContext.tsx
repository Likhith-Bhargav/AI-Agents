import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>('system');
  const [isMounted, setIsMounted] = useState(false);

  // Set theme on initial load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setThemeState(savedTheme);
    } else if (systemDark) {
      setThemeState('dark');
    } else {
      setThemeState('light');
    }
    
    setIsMounted(true);
  }, []);

  // Apply theme class to document element
  useEffect(() => {
    if (!isMounted) return;

    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    
    localStorage.setItem('theme', theme);
  }, [theme, isMounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  // Only render the theme provider after we've determined the theme
  if (!isMounted) {
    return null;
  }

  const isDark = theme === 'system'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
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
