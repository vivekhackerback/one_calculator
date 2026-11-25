import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  addHistory,
  clearHistory,
  deleteHistoryItem,
  getFavorites,
  getHistory,
  getRecentTools,
  recordRecentTool,
  toggleFavorite,
} from '../db/database';

const AppDataContext = createContext({
  history: [],
  favoriteIds: [],
  recentIds: [],
  isReady: false,
  addHistoryEntry: async () => {},
  removeHistoryEntry: async () => {},
  clearAllHistory: async () => {},
  toggleFavoriteCalculator: async () => {},
  markCalculatorUsed: async () => {},
  isCalculatorFavorite: () => false,
});

export function AppDataProvider({ children }) {
  const [history, setHistory] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [recentIds, setRecentIds] = useState([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [hist, favs, recents] = await Promise.all([
          getHistory(),
          getFavorites(),
          getRecentTools(),
        ]);
        if (active) {
          setHistory(hist);
          setFavoriteIds(favs);
          setRecentIds(recents);
          setIsReady(true);
        }
      } catch {
        if (active) setIsReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const addHistoryEntry = useCallback(async (entry) => {
    try {
      const inserted = await addHistory(entry);
      setHistory((prev) => [inserted, ...prev].slice(0, 100));
    } catch {
      // Ignore DB write error
    }
  }, []);

  const removeHistoryEntry = useCallback(async (id) => {
    try {
      await deleteHistoryItem(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch {
      // Ignore
    }
  }, []);

  const clearAllHistory = useCallback(async () => {
    try {
      await clearHistory();
      setHistory([]);
    } catch {
      // Ignore
    }
  }, []);

  const toggleFavoriteCalculator = useCallback(async (calculatorId) => {
    try {
      const added = await toggleFavorite(calculatorId);
      setFavoriteIds((prev) =>
        added
          ? [calculatorId, ...prev.filter((id) => id !== calculatorId)]
          : prev.filter((id) => id !== calculatorId)
      );
    } catch {
      // Ignore
    }
  }, []);

  const markCalculatorUsed = useCallback(async (calculatorId) => {
    try {
      await recordRecentTool(calculatorId);
      setRecentIds((prev) =>
        [calculatorId, ...prev.filter((id) => id !== calculatorId)].slice(0, 6)
      );
    } catch {
      // Ignore
    }
  }, []);

  const isCalculatorFavorite = useCallback(
    (calculatorId) => favoriteIds.includes(calculatorId),
    [favoriteIds]
  );

  const value = useMemo(
    () => ({
      history,
      favoriteIds,
      recentIds,
      isReady,
      addHistoryEntry,
      removeHistoryEntry,
      clearAllHistory,
      toggleFavoriteCalculator,
      markCalculatorUsed,
      isCalculatorFavorite,
    }),
    [
      history,
      favoriteIds,
      recentIds,
      isReady,
      addHistoryEntry,
      removeHistoryEntry,
      clearAllHistory,
      toggleFavoriteCalculator,
      markCalculatorUsed,
      isCalculatorFavorite,
    ]
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  return useContext(AppDataContext);
}
