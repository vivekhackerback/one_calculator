const NARROW_CHARS = new Set([',', '.', ' ']);
const MINUS_CHARS = new Set(['-', '−']);
const PLUS_CHARS = new Set(['+']);
const EXPONENT_CHARS = new Set(['e', 'E']);
const DISPLAY_OPERATORS = new Set(['+', '−', '×', '÷', '%']);

/**
 * Estimate relative character width units for bold tabular/sans-serif numerals
 * and scientific notation glyphs (e, +, -) so font sizing never clips.
 */
function getCharWidthFactor(ch) {
  if (NARROW_CHARS.has(ch)) return 0.34;
  if (MINUS_CHARS.has(ch)) return 0.45;
  if (PLUS_CHARS.has(ch)) return 0.62;
  if (EXPONENT_CHARS.has(ch)) return 0.6;
  return 0.65;
}

/**
 * Dynamically calculate the largest font size (within [minFontSize, maxFontSize])
 * that allows the entire formatted number to fit within availableWidth.
 *
 * Returns { fontSize, overflowsSingleLine } so extremely long numbers can wrap
 * gracefully at minFontSize instead of clipping or truncating.
 */
export function calculateDynamicFontSize({
  text,
  availableWidth,
  maxFontSize = 46,
  minFontSize = 16,
}) {
  if (!text || !availableWidth || availableWidth <= 0) {
    return { fontSize: maxFontSize, overflowsSingleLine: false };
  }

  let widthUnits = 0;
  for (let i = 0; i < text.length; i += 1) {
    widthUnits += getCharWidthFactor(text[i]);
  }

  // Add a small safety buffer for OEM font kerning / horizontal padding
  const effectiveUnits = Math.max(widthUnits + 0.5, 1);
  const idealFontSize = Math.floor((availableWidth / effectiveUnits) * 10) / 10;

  if (idealFontSize >= maxFontSize) {
    return { fontSize: maxFontSize, overflowsSingleLine: false };
  }

  if (idealFontSize < minFontSize) {
    return { fontSize: minFontSize, overflowsSingleLine: true };
  }

  return { fontSize: idealFontSize, overflowsSingleLine: false };
}

/**
 * Split a formatted expression string into segments so arithmetic operators
 * can be highlighted with their assigned colors.
 */
export function tokenizeExpressionForDisplay(formattedExpression) {
  if (!formattedExpression) return [];

  const segments = [];
  let buffer = '';

  for (let i = 0; i < formattedExpression.length; i += 1) {
    const ch = formattedExpression[i];
    if (DISPLAY_OPERATORS.has(ch)) {
      if (buffer) {
        segments.push({ text: buffer, operator: null });
        buffer = '';
      }
      segments.push({ text: ch, operator: ch });
    } else {
      buffer += ch;
    }
  }

  if (buffer) {
    segments.push({ text: buffer, operator: null });
  }

  return segments;
}
