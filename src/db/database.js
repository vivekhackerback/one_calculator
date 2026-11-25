import * as SQLite from 'expo-sqlite';

let dbPromise = null;

export async function getDatabase() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('one_calculator.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          calculator_id TEXT NOT NULL,
          calculator_name TEXT NOT NULL,
          input_summary TEXT NOT NULL,
          result_summary TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS favorites (
          calculator_id TEXT PRIMARY KEY,
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS recent_tools (
          calculator_id TEXT PRIMARY KEY,
          used_at TEXT NOT NULL
        );
      `);
      return db;
    })();
  }
  return dbPromise;
}

export async function addHistory({
  calculatorId,
  calculatorName,
  inputSummary,
  resultSummary,
}) {
  const db = await getDatabase();
  const createdAt = new Date().toISOString();
  const res = await db.runAsync(
    `INSERT INTO history (calculator_id, calculator_name, input_summary, result_summary, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [calculatorId, calculatorName, inputSummary, resultSummary, createdAt]
  );
  return {
    id: res.lastInsertRowId,
    calculator_id: calculatorId,
    calculator_name: calculatorName,
    input_summary: inputSummary,
    result_summary: resultSummary,
    created_at: createdAt,
  };
}

export async function getHistory(limit = 100) {
  const db = await getDatabase();
  return db.getAllAsync(
    'SELECT * FROM history ORDER BY id DESC LIMIT ?',
    [limit]
  );
}

export async function deleteHistoryItem(id) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM history WHERE id = ?', [id]);
}

export async function clearHistory() {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM history');
}

export async function getFavorites() {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    'SELECT calculator_id FROM favorites ORDER BY created_at DESC'
  );
  return rows.map((r) => r.calculator_id);
}

export async function isFavorite(calculatorId) {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    'SELECT calculator_id FROM favorites WHERE calculator_id = ? LIMIT 1',
    [calculatorId]
  );
  return rows.length > 0;
}

export async function toggleFavorite(calculatorId) {
  const db = await getDatabase();
  const exists = await isFavorite(calculatorId);
  if (exists) {
    await db.runAsync('DELETE FROM favorites WHERE calculator_id = ?', [calculatorId]);
    return false;
  }
  await db.runAsync(
    'INSERT OR REPLACE INTO favorites (calculator_id, created_at) VALUES (?, ?)',
    [calculatorId, new Date().toISOString()]
  );
  return true;
}

export async function recordRecentTool(calculatorId) {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO recent_tools (calculator_id, used_at) VALUES (?, ?)',
    [calculatorId, new Date().toISOString()]
  );
}

export async function getRecentTools(limit = 6) {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    'SELECT calculator_id FROM recent_tools ORDER BY used_at DESC LIMIT ?',
    [limit]
  );
  return rows.map((r) => r.calculator_id);
}
