import { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from '../constants/theme';

const ThemeContext = createContext({
  theme: lightTheme,
  themeMode: 'system',
  setThemeMode: () => {},
  isDark: false,
});

export function ThemeProvider({ children, initialMode = 'system' }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState(initialMode);

  const isDark = useMemo(() => {
    if (themeMode === 'dark') return true;
    if (themeMode === 'light') return false;
    return systemColorScheme === 'dark';
  }, [themeMode, systemColorScheme]);

  const theme = isDark ? darkTheme : lightTheme;

  const value = useMemo(
    () => ({
      theme,
      themeMode,
      setThemeMode,
      isDark,
    }),
    [theme, themeMode, isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
