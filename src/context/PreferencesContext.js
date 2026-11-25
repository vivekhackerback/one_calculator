import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useTheme } from './ThemeContext';
import { formatWithPrecision } from '../utils/formatters';

const STORAGE_KEY = '@one_calculator_preferences_v1';

const DEFAULT_PREFS = {
  themeMode: 'system',
  decimalPrecision: 2,
  hapticEnabled: true,
};

const PreferencesContext = createContext({
  ...DEFAULT_PREFS,
  setThemePreference: async () => {},
  setDecimalPrecision: async () => {},
  setHapticEnabled: async () => {},
  formatNumber: (v) => formatWithPrecision(v, 2),
  triggerHaptic: () => {},
});

export function PreferencesProvider({ children }) {
  const { setThemeMode } = useTheme();
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && active) {
          const parsed = JSON.parse(raw);
          const merged = { ...DEFAULT_PREFS, ...parsed };
          setPrefs(merged);
          setThemeMode(merged.themeMode);
        }
      } catch {
        // Use defaults
      }
    })();
    return () => {
      active = false;
    };
  }, [setThemeMode]);

  const persistPrefs = useCallback(async (next) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage error
    }
  }, []);

  const setThemePreference = useCallback(
    async (mode) => {
      setThemeMode(mode);
      setPrefs((prev) => {
        const next = { ...prev, themeMode: mode };
        persistPrefs(next);
        return next;
      });
    },
    [setThemeMode, persistPrefs]
  );

  const setDecimalPrecision = useCallback(
    async (precision) => {
      const clamped = Math.max(0, Math.min(6, Number(precision) || 0));
      setPrefs((prev) => {
        const next = { ...prev, decimalPrecision: clamped };
        persistPrefs(next);
        return next;
      });
    },
    [persistPrefs]
  );

  const setHapticEnabled = useCallback(
    async (enabled) => {
      setPrefs((prev) => {
        const next = { ...prev, hapticEnabled: Boolean(enabled) };
        persistPrefs(next);
        return next;
      });
    },
    [persistPrefs]
  );

  const formatNumber = useCallback(
    (value) => formatWithPrecision(value, prefs.decimalPrecision),
    [prefs.decimalPrecision]
  );

  const triggerHaptic = useCallback(
    (style = 'light') => {
      if (!prefs.hapticEnabled) return;
      try {
        if (style === 'selection') {
          Haptics.selectionAsync();
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } catch {
        // Ignore on unsupported devices
      }
    },
    [prefs.hapticEnabled]
  );

  const value = useMemo(
    () => ({
      themeMode: prefs.themeMode,
      decimalPrecision: prefs.decimalPrecision,
      hapticEnabled: prefs.hapticEnabled,
      setThemePreference,
      setDecimalPrecision,
      setHapticEnabled,
      formatNumber,
      triggerHaptic,
    }),
    [
      prefs.themeMode,
      prefs.decimalPrecision,
      prefs.hapticEnabled,
      setThemePreference,
      setDecimalPrecision,
      setHapticEnabled,
      formatNumber,
      triggerHaptic,
    ]
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
