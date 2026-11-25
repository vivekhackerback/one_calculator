export function calculateGST(rawAmount, rawRate, mode = 'exclusive') {
  const amount = Number(rawAmount);
  const rate = Number(rawRate);

  if (rawAmount === '' || !Number.isFinite(amount) || amount < 0) {
    return { ok: false, error: 'Amount must be 0 or greater.' };
  }
  if (rawRate === '' || !Number.isFinite(rate) || rate < 0 || rate > 100) {
    return { ok: false, error: 'GST rate must be between 0% and 100%.' };
  }

  let baseAmount;
  let gstAmount;
  let totalAmount;

  if (mode === 'exclusive') {
    baseAmount = amount;
    gstAmount = amount * (rate / 100);
    totalAmount = baseAmount + gstAmount;
  } else if (mode === 'inclusive') {
    totalAmount = amount;
    baseAmount = amount / (1 + rate / 100);
    gstAmount = totalAmount - baseAmount;
  } else {
    return { ok: false, error: 'Unsupported GST mode.' };
  }

  return {
    ok: true,
    baseAmount,
    gstAmount,
    cgst: gstAmount / 2,
    sgst: gstAmount / 2,
    totalAmount,
    rate,
    mode,
  };
}
