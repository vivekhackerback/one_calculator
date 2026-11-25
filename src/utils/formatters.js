export function formatWithPrecision(value, precision = 2) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  const clamped = Math.max(0, Math.min(6, Math.round(precision)));
  try {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: clamped,
    }).format(num);
  } catch {
    return num.toFixed(clamped);
  }
}
