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
  toggleHistoryStar,
  upsertHistoryEntry,
} from '../db/database';

const AppDataContext = createContext({
  history: [],
  favoriteIds: [],
  recentIds: [],
  isReady: false,
  addHistoryEntry: async () => {},
  upsertAutoHistoryEntry: async () => null,
  toggleStarHistoryEntry: async () => {},
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
      setHistory((prev) => [inserted, ...prev].slice(0, 200));
    } catch {
      // Preserve in-memory state if DB write fails
    }
  }, []);

  const upsertAutoHistoryEntry = useCallback(async (entry) => {
    try {
      const saved = await upsertHistoryEntry(entry);
      setHistory((prev) => {
        const filtered = prev.filter((item) => item.id !== saved.id);
        return [saved, ...filtered].slice(0, 200);
      });
      return saved;
    } catch {
      return null;
    }
  }, []);

  const toggleStarHistoryEntry = useCallback(async (id, forcedState = null) => {
    try {
      const updated = await toggleHistoryStar(id, forcedState);
      if (!updated) return null;
      setHistory((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                is_starred: updated.is_starred,
                starred_at: updated.starred_at,
              }
            : item
        )
      );
      return updated;
    } catch {
      return null;
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

  const clearAllHistory = useCallback(async ({ includeStarred = false } = {}) => {
    try {
      await clearHistory({ includeStarred });
      setHistory((prev) =>
        includeStarred ? [] : prev.filter((item) => Boolean(item.is_starred))
      );
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
      upsertAutoHistoryEntry,
      toggleStarHistoryEntry,
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
      upsertAutoHistoryEntry,
      toggleStarHistoryEntry,
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
