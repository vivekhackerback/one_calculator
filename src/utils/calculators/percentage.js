import { cleanFloat } from './basic.js';

export function calculatePercentage(mode, rawA, rawB) {
  const a = Number(rawA);
  const b = Number(rawB);

  if (rawA === '' || rawB === '' || !Number.isFinite(a) || !Number.isFinite(b)) {
    return { ok: false, error: 'Please enter valid numbers for both fields.' };
  }

  if (mode === 'of') {
    const result = cleanFloat((a / 100) * b);
    return {
      ok: true,
      value: result,
      label: `${a}% of ${b}`,
      formatted: String(result),
      suffix: '',
    };
  }

  if (mode === 'whatPercent') {
    if (b === 0) {
      return { ok: false, error: 'Total value (Y) cannot be zero.' };
    }
    const result = cleanFloat((a / b) * 100);
    return {
      ok: true,
      value: result,
      label: `${a} out of ${b}`,
      formatted: `${result}%`,
      suffix: '%',
    };
  }

  if (mode === 'change') {
    if (a === 0) {
      return { ok: false, error: 'Initial value (From) cannot be zero.' };
    }
    const diff = cleanFloat(b - a);
    const result = cleanFloat((diff / Math.abs(a)) * 100);
    const direction = diff > 0 ? 'Increase' : diff < 0 ? 'Decrease' : 'No Change';
    return {
      ok: true,
      value: result,
      diff,
      direction,
      label: `Change from ${a} to ${b}`,
      formatted: `${result > 0 ? '+' : ''}${result}%`,
      suffix: '%',
    };
  }

  return { ok: false, error: 'Unsupported percentage calculation mode.' };
}
