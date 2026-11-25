const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const TENS = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

const DIGIT_WORDS = [
  'Zero',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
];

function twoDigitsToWords(n) {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o ? `${TENS[t]} ${ONES[o]}` : TENS[t];
}

function threeDigitsToWords(n) {
  if (n === 0) return '';
  const h = Math.floor(n / 100);
  const rem = n % 100;
  const parts = [];
  if (h > 0) parts.push(`${ONES[h]} Hundred`);
  if (rem > 0) parts.push(twoDigitsToWords(rem));
  return parts.join(' ');
}

function integerToIndianWords(num) {
  if (num === 0) return 'Zero';
  if (!Number.isSafeInteger(num) || num > 9999999999999) {
    return 'Value too large to display in words';
  }

  const parts = [];
  let rem = num;

  // Crore (10^7) - supports up to 99,999 Crore cleanly
  const crore = Math.floor(rem / 10000000);
  if (crore > 0) {
    parts.push(`${crore >= 100 ? integerToIndianWords(crore) : twoDigitsToWords(crore)} Crore`);
    rem %= 10000000;
  }

  // Lakh (10^5)
  const lakh = Math.floor(rem / 100000);
  if (lakh > 0) {
    parts.push(`${twoDigitsToWords(lakh)} Lakh`);
    rem %= 100000;
  }

  // Thousand (10^3)
  const thousand = Math.floor(rem / 1000);
  if (thousand > 0) {
    parts.push(`${twoDigitsToWords(thousand)} Thousand`);
    rem %= 1000;
  }

  // Hundreds & remainder
  if (rem > 0) {
    parts.push(threeDigitsToWords(rem));
  }

  return parts.join(' ');
}

/**
 * Format a numeric string or number using Indian numbering commas (e.g. 1,00,000).
 * Preserves negative sign, decimals, and trailing decimal point while typing.
 */
export function formatIndianNumber(input) {
  if (input === null || input === undefined || input === '') return '';
  const str = String(input).trim();
  if (!str) return '';
  if (str === '-') return '-';

  // Preserve scientific notation if extremely large/small
  if (/[eE]/.test(str)) return str;

  const isNegative = str.startsWith('-');
  const unsigned = isNegative ? str.slice(1) : str;
  const dotIndex = unsigned.indexOf('.');
  const intPart = dotIndex === -1 ? unsigned : unsigned.slice(0, dotIndex);
  const decPart = dotIndex === -1 ? '' : unsigned.slice(dotIndex);

  if (!/^\d+$/.test(intPart)) {
    return str;
  }

  let formattedInt = intPart;
  if (intPart.length > 3) {
    const lastThree = intPart.slice(-3);
    const rest = intPart.slice(0, -3);
    const groupedRest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    formattedInt = `${groupedRest},${lastThree}`;
  }

  return `${isNegative ? '-' : ''}${formattedInt}${decPart}`;
}

/**
 * Format all numeric tokens inside a math expression using Indian commas
 * and add clean spacing around operators for readability.
 */
export function formatIndianExpression(expression) {
  if (!expression) return '';
  return expression.replace(/(\d+(?:\.\d*)?)/g, (numToken) =>
    formatIndianNumber(numToken)
  ).replace(/([+−×÷])/g, ' $1 ').replace(/\s+/g, ' ').trim();
}

/**
 * Convert a number or numeric string into English words using Indian units (Thousand, Lakh, Crore).
 */
export function numberToIndianWords(input) {
  if (input === null || input === undefined || input === '') return '';
  const num = Number(input);
  if (!Number.isFinite(num)) {
    return 'Invalid number';
  }

  const str = String(input).trim();
  if (/[eE]/.test(str)) {
    return 'Value too large to display in words';
  }

  const isNegative = num < 0 || str.startsWith('-');
  const unsignedStr = str.startsWith('-') ? str.slice(1) : str;
  const [intStr, decStr] = unsignedStr.split('.');

  const intNum = Number(intStr || '0');
  if (!Number.isSafeInteger(intNum) || intNum > 9999999999999) {
    return 'Value too large to display in words';
  }

  const parts = [];
  if (isNegative && (intNum > 0 || (decStr && Number(decStr) > 0))) {
    parts.push('Minus');
  }

  parts.push(integerToIndianWords(intNum));

  if (decStr && decStr.length > 0 && /[1-9]/.test(decStr)) {
    parts.push('Point');
    for (const ch of decStr) {
      const d = Number(ch);
      if (Number.isInteger(d) && d >= 0 && d <= 9) {
        parts.push(DIGIT_WORDS[d]);
      }
    }
  }

  return parts.join(' ');
}
