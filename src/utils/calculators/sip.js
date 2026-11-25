export function calculateSIP(rawMonthly, rawAnnualReturn, rawYears) {
  const monthly = Number(rawMonthly);
  const annualReturn = Number(rawAnnualReturn);
  const years = Number(rawYears);

  if (!Number.isFinite(monthly) || monthly <= 0) {
    return { ok: false, error: 'Monthly investment must be greater than 0.' };
  }
  if (rawAnnualReturn === '' || !Number.isFinite(annualReturn) || annualReturn < 0) {
    return { ok: false, error: 'Expected annual return must be 0 or greater.' };
  }
  if (!Number.isFinite(years) || years <= 0) {
    return { ok: false, error: 'Investment duration (years) must be greater than 0.' };
  }

  const months = Math.round(years * 12);
  if (months < 1) {
    return { ok: false, error: 'Duration must be at least 1 month.' };
  }

  const investedAmount = monthly * months;
  let totalValue;
  let estimatedReturns;

  if (annualReturn === 0) {
    totalValue = investedAmount;
    estimatedReturns = 0;
  } else {
    const i = annualReturn / 12 / 100;
    totalValue = monthly * ((Math.pow(1 + i, months) - 1) / i) * (1 + i);
    estimatedReturns = totalValue - investedAmount;
  }

  return {
    ok: true,
    investedAmount,
    estimatedReturns,
    totalValue,
    months,
  };
}
