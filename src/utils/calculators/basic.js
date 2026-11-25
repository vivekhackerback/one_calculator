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

const KEY_OPERATORS = new Set(['+', '−', '×', '÷']);
const TRAILING_OP_REGEX = /[+\−×÷*/-]$/;
const HAS_OPERATOR_REGEX = /[+\−×÷*/%]/;

export const INITIAL_CALCULATOR_STATE = {
  expression: '',
  resultText: '0',
  error: '',
  justEvaluated: false,
  hasMeaningfulResult: false,
};

/**
 * Evaluate a potentially incomplete expression for live preview.
 * Trailing operators (e.g. "100 +") evaluate the prefix ("100") without error.
 */
export function evaluateLiveExpression(expression) {
  if (!expression) {
    return { ok: true, value: 0, formatted: '0', isComplete: true, hasOperator: false };
  }

  // Strip trailing unary/binary operator if user is mid-expression
  let exprToEval = expression;
  let isComplete = true;
  if (TRAILING_OP_REGEX.test(exprToEval)) {
    exprToEval = exprToEval.replace(/[+\−×÷*/-]+$/, '');
    isComplete = false;
  }

  if (!exprToEval || exprToEval === '-') {
    return { ok: true, value: 0, formatted: '0', isComplete: false, hasOperator: false };
  }

  const res = evaluateExpression(exprToEval);
  if (!res.ok) {
    return res;
  }

  return {
    ...res,
    isComplete,
    hasOperator: HAS_OPERATOR_REGEX.test(exprToEval),
  };
}

/**
 * Pure state reducer for Basic Calculator key presses with live evaluation.
 * Safe for rapid consecutive taps with zero stale-closure issues.
 */
export function reduceCalculatorState(state, key) {
  if (key && typeof key === 'object' && key.type === 'RESTORE') {
    const expr = typeof key.expression === 'string' ? key.expression.trim() : '';
    if (!expr) return INITIAL_CALCULATOR_STATE;
    const live = evaluateLiveExpression(expr);
    return {
      expression: expr,
      resultText: live.ok ? live.formatted : '0',
      error: live.ok ? '' : live.error || '',
      justEvaluated: false,
      hasMeaningfulResult: Boolean(live.ok && live.isComplete && live.hasOperator),
    };
  }

  if (key === 'AC' || key === 'C') {
    return INITIAL_CALCULATOR_STATE;
  }

  if (key === '=') {
    if (!state.expression) return state;
    const evaluated = evaluateExpression(state.expression);
    if (!evaluated.ok) {
      return {
        ...state,
        error: evaluated.error,
      };
    }
    return {
      ...state,
      resultText: evaluated.formatted,
      error: '',
      justEvaluated: true,
      hasMeaningfulResult: HAS_OPERATOR_REGEX.test(state.expression),
    };
  }

  let nextExpression = state.expression;

  if (key === 'BACK') {
    nextExpression = state.expression.slice(0, -1);
  } else if (key === '+/-') {
    if (!state.expression) {
      nextExpression = '-';
    } else {
      const match = state.expression.match(/(.*?)(-?\d*\.?\d+)$/);
      if (!match) return state;
      const [, prefix, num] = match;
      const toggled = num.startsWith('-') ? num.slice(1) : `-${num}`;
      nextExpression = `${prefix}${toggled}`;
    }
  } else if (KEY_OPERATORS.has(key)) {
    if (!state.expression) {
      if (state.resultText !== '0') {
        nextExpression = `${state.resultText}${key}`;
      } else {
        return state;
      }
    } else if (state.justEvaluated) {
      nextExpression = `${state.resultText}${key}`;
    } else {
      const lastChar = state.expression.slice(-1);
      if (KEY_OPERATORS.has(lastChar)) {
        nextExpression = `${state.expression.slice(0, -1)}${key}`;
      } else {
        nextExpression = `${state.expression}${key}`;
      }
    }
  } else if (key === '.') {
    const baseExpr = state.justEvaluated ? '' : state.expression;
    const lastToken = baseExpr.split(/[+\−×÷]/).pop() || '';
    if (lastToken.includes('.')) return state;
    const prefix = lastToken === '' ? '0.' : '.';
    nextExpression = `${baseExpr}${prefix}`;
  } else {
    // Digits and '%'
    const baseExpr =
      state.justEvaluated && key !== '%'
        ? ''
        : state.justEvaluated
        ? state.resultText
        : state.expression;
    nextExpression = `${baseExpr}${key}`;
  }

  const live = evaluateLiveExpression(nextExpression);
  if (!live.ok) {
    return {
      ...state,
      expression: nextExpression,
      error: live.error,
      justEvaluated: false,
      hasMeaningfulResult: false,
    };
  }

  return {
    expression: nextExpression,
    resultText: live.formatted,
    error: '',
    justEvaluated: false,
    hasMeaningfulResult: live.isComplete && live.hasOperator,
  };
}

