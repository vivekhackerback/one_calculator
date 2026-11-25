export const COMPOUND_FREQUENCIES = [
  { label: 'Annually', value: 1 },
  { label: 'Semi-Annual', value: 2 },
  { label: 'Quarterly', value: 4 },
  { label: 'Monthly', value: 12 },
];

export function calculateInterest(
  rawPrincipal,
  rawRate,
  rawYears,
  type = 'compound',
  frequency = 1
) {
  const principal = Number(rawPrincipal);
  const rate = Number(rawRate);
  const years = Number(rawYears);

  if (!Number.isFinite(principal) || principal <= 0) {
    return { ok: false, error: 'Principal amount must be greater than 0.' };
  }
  if (rawRate === '' || !Number.isFinite(rate) || rate < 0) {
    return { ok: false, error: 'Annual interest rate must be 0 or greater.' };
  }
  if (!Number.isFinite(years) || years <= 0) {
    return { ok: false, error: 'Time period (years) must be greater than 0.' };
  }

  let totalAmount;
  let interest;

  if (type === 'simple') {
    interest = principal * (rate / 100) * years;
    totalAmount = principal + interest;
  } else if (type === 'compound') {
    const n = Number(frequency) || 1;
    totalAmount = principal * Math.pow(1 + rate / 100 / n, n * years);
    interest = totalAmount - principal;
  } else {
    return { ok: false, error: 'Unsupported interest type.' };
  }

  return {
    ok: true,
    principal,
    interest,
    totalAmount,
    type,
    frequency,
  };
}
