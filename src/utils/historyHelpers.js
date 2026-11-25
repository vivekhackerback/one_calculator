import { evaluateExpression } from './calculators/basic.js';
import { formatIndianExpression, formatIndianNumber } from './indianFormat.js';

const TRAILING_OP_REGEX = /[+\−×÷*/-]$/;

/**
 * Classify a Basic Calculator expression into a persistent history payload.
 * Returns null when the expression is empty.
 * - finalized = false -> always 'draft' (unfinished calculation, restorable)
 * - finalized = true (Equals pressed) -> 'completed' when evaluation succeeds
 * Incomplete expressions (e.g. "500+") are saved as 'draft' with empty result.
 */
export function buildBasicHistoryPayload(expression, { finalized = false } = {}) {
  if (typeof expression !== 'string' || !expression.trim()) {
    return null;
  }

  const trimmed = expression.trim();
  const formattedExpression = formatIndianExpression(trimmed);

  // Incomplete trailing operator (e.g. "100+" or "-")
  if (TRAILING_OP_REGEX.test(trimmed)) {
    return {
      expression: trimmed,
      inputSummary: formattedExpression,
      rawResult: '',
      resultSummary: '',
      status: 'draft',
    };
  }

  const evaluated = evaluateExpression(trimmed);

  if (!evaluated.ok) {
    return {
      expression: trimmed,
      inputSummary: formattedExpression,
      rawResult: '',
      resultSummary: '',
      status: 'draft',
    };
  }

  return {
    expression: trimmed,
    inputSummary: formattedExpression,
    rawResult: evaluated.formatted,
    resultSummary: formatIndianNumber(evaluated.formatted),
    status: finalized ? 'completed' : 'draft',
  };
}

/**
 * Filter and sort history rows for 'all' or 'starred' views.
 */
export function filterAndSortHistory(items, filter = 'all') {
  if (!Array.isArray(items)) return [];

  if (filter === 'starred') {
    return items
      .filter((item) => Boolean(item.is_starred))
      .slice()
      .sort((a, b) => {
        const aKey = a.starred_at || a.updated_at || a.created_at || '';
        const bKey = b.starred_at || b.updated_at || b.created_at || '';
        if (bKey !== aKey) return bKey.localeCompare(aKey);
        return (b.id || 0) - (a.id || 0);
      });
  }

  return items.slice().sort((a, b) => {
    const aKey = a.updated_at || a.created_at || '';
    const bKey = b.updated_at || b.created_at || '';
    if (bKey !== aKey) return bKey.localeCompare(aKey);
    return (b.id || 0) - (a.id || 0);
  });
}
