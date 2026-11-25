const OPERATORS = new Set(['+', '-', '*', '/']);

/**
 * Clean floating point precision artifacts (e.g. 0.1 + 0.2 -> 0.3).
 */
export function cleanFloat(num) {
  if (!Number.isFinite(num)) return num;
  return Number(num.toPrecision(12));
}

function tokenize(expr) {
  const normalized = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/\s+/g, '');

  if (!normalized) return [];

  const tokens = [];
  let i = 0;

  while (i < normalized.length) {
    const ch = normalized[i];

    // Unary + or - at start, after '(' or after another operator
    const prev = tokens[tokens.length - 1];
    const isUnarySign =
      (ch === '-' || ch === '+') &&
      (tokens.length === 0 || prev === '(' || OPERATORS.has(prev));

    if (isUnarySign || (ch >= '0' && ch <= '9') || ch === '.') {
      let numStr = '';
      if (isUnarySign) {
        numStr += ch;
        i += 1;
      }
      let dotCount = 0;
      let digitCount = 0;
      while (i < normalized.length) {
        const c = normalized[i];
        if (c >= '0' && c <= '9') {
          numStr += c;
          digitCount += 1;
          i += 1;
        } else if (c === '.') {
          dotCount += 1;
          if (dotCount > 1) {
            throw new Error('Invalid decimal number');
          }
          numStr += c;
          i += 1;
        } else {
          break;
        }
      }
      if (digitCount === 0) {
        throw new Error('Invalid expression');
      }
      const value = Number(numStr);
      if (!Number.isFinite(value)) {
        throw new Error('Number out of range');
      }
      tokens.push(value);
      continue;
    }

    if (ch === '%') {
      tokens.push('%');
      i += 1;
      continue;
    }

    if (OPERATORS.has(ch) || ch === '(' || ch === ')') {
      tokens.push(ch);
      i += 1;
      continue;
    }

    throw new Error(`Unsupported character: ${ch}`);
  }

  return tokens;
}

/**
 * Safely evaluate a mathematical expression without eval().
 */
export function evaluateExpression(expression) {
  if (typeof expression !== 'string' || !expression.trim()) {
    return { ok: false, error: 'Enter an expression to calculate' };
  }

  try {
    const tokens = tokenize(expression);
    if (tokens.length === 0) {
      return { ok: false, error: 'Enter an expression to calculate' };
    }

    let pos = 0;
    const peek = () => tokens[pos];
    const consume = () => tokens[pos++];

    function parseExpression() {
      let left = parseTerm();
      while (peek() === '+' || peek() === '-') {
        const op = consume();
        const right = parseTerm();
        left = op === '+' ? left + right : left - right;
      }
      return left;
    }

    function parseTerm() {
      let left = parseFactor();
      while (peek() === '*' || peek() === '/') {
        const op = consume();
        const right = parseFactor();
        if (op === '/') {
          if (right === 0) {
            throw new Error('Cannot divide by zero');
          }
          left = left / right;
        } else {
          left = left * right;
        }
      }
      return left;
    }

    function parseFactor() {
      let val;
      const tok = peek();
      if (typeof tok === 'number') {
        val = consume();
      } else if (tok === '(') {
        consume();
        val = parseExpression();
        if (consume() !== ')') {
          throw new Error('Mismatched parentheses');
        }
      } else {
        throw new Error('Invalid expression');
      }

      while (peek() === '%') {
        consume();
        val = val / 100;
      }
      return val;
    }

    const result = parseExpression();
    if (pos !== tokens.length) {
      return { ok: false, error: 'Invalid expression' };
    }

    if (!Number.isFinite(result)) {
      return { ok: false, error: 'Result is out of range' };
    }

    const cleaned = cleanFloat(result);
    return {
      ok: true,
      value: cleaned,
      formatted: String(cleaned),
    };
  } catch (err) {
    return {
      ok: false,
      error: err?.message || 'Invalid expression',
    };
  }
}
