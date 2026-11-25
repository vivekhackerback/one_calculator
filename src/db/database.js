import * as SQLite from 'expo-sqlite';

let dbPromise = null;

async function runMigrations(db) {
  await db.withTransactionAsync(async () => {
    const columns = await db.getAllAsync('PRAGMA table_info(history)');
    const existingNames = new Set(columns.map((c) => c.name));

    const migrations = [
      ['expression', "TEXT NOT NULL DEFAULT ''"],
      ['raw_result', "TEXT NOT NULL DEFAULT ''"],
      ['status', "TEXT NOT NULL DEFAULT 'completed'"],
      ['is_starred', 'INTEGER NOT NULL DEFAULT 0'],
      ['updated_at', "TEXT NOT NULL DEFAULT ''"],
      ['starred_at', 'TEXT'],
    ];

    for (const [colName, colDef] of migrations) {
      if (!existingNames.has(colName)) {
        await db.execAsync(`ALTER TABLE history ADD COLUMN ${colName} ${colDef};`);
      }
    }

    // Backfill legacy rows safely without deleting or overwriting existing history
    await db.execAsync(`
      UPDATE history
      SET
        expression = CASE WHEN expression = '' THEN input_summary ELSE expression END,
        raw_result = CASE WHEN raw_result = '' THEN result_summary ELSE raw_result END,
        updated_at = CASE WHEN updated_at = '' THEN created_at ELSE updated_at END
      WHERE updated_at = '' OR expression = '' OR raw_result = '';
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_history_updated_at ON history(updated_at DESC, id DESC);
      CREATE INDEX IF NOT EXISTS idx_history_is_starred ON history(is_starred, starred_at DESC, updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_history_status ON history(status);
    `);
  });
}

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
        CREATE TABLE IF NOT EXISTS app_state (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
      await runMigrations(db);
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
  expression = '',
  rawResult = '',
  status = 'completed',
  isStarred = 0,
}) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const expr = expression || inputSummary;
  const raw = rawResult || resultSummary;
  const starredVal = isStarred ? 1 : 0;
  const starredAt = starredVal ? now : null;

  const res = await db.runAsync(
    `INSERT INTO history (
      calculator_id, calculator_name, input_summary, result_summary,
      expression, raw_result, status, is_starred, created_at, updated_at, starred_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      calculatorId,
      calculatorName,
      inputSummary,
      resultSummary,
      expr,
      raw,
      status,
      starredVal,
      now,
      now,
      starredAt,
    ]
  );

  return {
    id: res.lastInsertRowId,
    calculator_id: calculatorId,
    calculator_name: calculatorName,
    input_summary: inputSummary,
    result_summary: resultSummary,
    expression: expr,
    raw_result: raw,
    status,
    is_starred: starredVal,
    created_at: now,
    updated_at: now,
    starred_at: starredAt,
  };
}

/**
 * Insert or update an active Basic Calculator auto-save entry in SQLite.
 * Updates the existing row when existingId is provided, preventing duplicate spam
 * as the user types digits/operators in the same calculation.
 */
export async function upsertHistoryEntry({
  id = null,
  calculatorId,
  calculatorName,
  inputSummary,
  resultSummary,
  expression,
  rawResult,
  status,
  isStarred = 0,
}) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  if (id) {
    const existing = await db.getFirstAsync(
      'SELECT * FROM history WHERE id = ? LIMIT 1',
      [id]
    );
    if (existing) {
      await db.runAsync(
        `UPDATE history
         SET input_summary = ?, result_summary = ?, expression = ?, raw_result = ?, status = ?, updated_at = ?
         WHERE id = ?`,
        [inputSummary, resultSummary, expression, rawResult, status, now, id]
      );
      return {
        ...existing,
        input_summary: inputSummary,
        result_summary: resultSummary,
        expression,
        raw_result: rawResult,
        status,
        updated_at: now,
      };
    }
  }

  return addHistory({
    calculatorId,
    calculatorName,
    inputSummary,
    resultSummary,
    expression,
    rawResult,
    status,
    isStarred,
  });
}

export async function toggleHistoryStar(id, forcedState = null) {
  const db = await getDatabase();
  const row = await db.getFirstAsync(
    'SELECT id, is_starred FROM history WHERE id = ? LIMIT 1',
    [id]
  );
  if (!row) return null;

  const nextStarred =
    forcedState === null ? (row.is_starred ? 0 : 1) : forcedState ? 1 : 0;
  const now = new Date().toISOString();
  const starredAt = nextStarred ? now : null;

  await db.runAsync(
    'UPDATE history SET is_starred = ?, starred_at = ? WHERE id = ?',
    [nextStarred, starredAt, id]
  );

  return { id, is_starred: nextStarred, starred_at: starredAt };
}

export async function getHistory(limit = 60, offset = 0) {
  const db = await getDatabase();
  return db.getAllAsync(
    "SELECT * FROM history ORDER BY COALESCE(NULLIF(updated_at, ''), created_at) DESC, id DESC LIMIT ? OFFSET ?",
    [limit, offset]
  );
}

export async function deleteHistoryItem(id) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM history WHERE id = ?', [id]);
}

export async function deleteUnstarredDraftById(id) {
  if (!id) return false;
  const db = await getDatabase();
  const res = await db.runAsync(
    "DELETE FROM history WHERE id = ? AND status = 'draft' AND COALESCE(is_starred, 0) = 0",
    [id]
  );
  return (res?.changes || 0) > 0;
}

export async function clearHistory({ includeStarred = false } = {}) {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    if (includeStarred) {
      await db.runAsync('DELETE FROM history');
    } else {
      await db.runAsync('DELETE FROM history WHERE COALESCE(is_starred, 0) = 0');
    }
  });
}

export async function setAppStateValue(key, value) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT OR REPLACE INTO app_state (key, value, updated_at) VALUES (?, ?, ?)',
    [key, JSON.stringify(value), now]
  );
}

export async function getAppStateValue(key) {
  const db = await getDatabase();
  const row = await db.getFirstAsync(
    'SELECT value FROM app_state WHERE key = ? LIMIT 1',
    [key]
  );
  if (!row) return null;
  try {
    return JSON.parse(row.value);
  } catch {
    return null;
  }
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
