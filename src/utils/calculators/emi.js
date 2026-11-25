export function calculateEMI(rawPrincipal, rawAnnualRate, rawTenure, tenureUnit = 'years') {
  const principal = Number(rawPrincipal);
  const annualRate = Number(rawAnnualRate);
  const tenure = Number(rawTenure);

  if (!Number.isFinite(principal) || principal <= 0) {
    return { ok: false, error: 'Loan amount must be greater than 0.' };
  }
  if (rawAnnualRate === '' || !Number.isFinite(annualRate) || annualRate < 0) {
    return { ok: false, error: 'Annual interest rate must be 0 or greater.' };
  }
  if (!Number.isFinite(tenure) || tenure <= 0) {
    return { ok: false, error: 'Loan tenure must be greater than 0.' };
  }

  const months = Math.round(tenureUnit === 'years' ? tenure * 12 : tenure);
  if (months < 1) {
    return { ok: false, error: 'Tenure must be at least 1 month.' };
  }

  let emi;
  let totalPayment;
  let totalInterest;

  if (annualRate === 0) {
    emi = principal / months;
    totalPayment = principal;
    totalInterest = 0;
  } else {
    const r = annualRate / 12 / 100;
    const factor = Math.pow(1 + r, months);
    emi = (principal * r * factor) / (factor - 1);
    totalPayment = emi * months;
    totalInterest = totalPayment - principal;
  }

  return {
    ok: true,
    emi,
    totalInterest,
    totalPayment,
    principal,
    months,
  };
}
