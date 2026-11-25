export function calculateProfitLoss(rawCostPrice, rawSellingPrice) {
  const costPrice = Number(rawCostPrice);
  const sellingPrice = Number(rawSellingPrice);

  if (!Number.isFinite(costPrice) || costPrice <= 0) {
    return { ok: false, error: 'Cost price must be greater than 0.' };
  }
  if (rawSellingPrice === '' || !Number.isFinite(sellingPrice) || sellingPrice < 0) {
    return { ok: false, error: 'Selling price must be 0 or greater.' };
  }

  const diff = sellingPrice - costPrice;
  const amount = Math.abs(diff);
  const percentage = (amount / costPrice) * 100;
  const marginPercent = sellingPrice > 0 ? (diff / sellingPrice) * 100 : 0;
  const status = diff > 0 ? 'Profit' : diff < 0 ? 'Loss' : 'Break-Even';

  return {
    ok: true,
    costPrice,
    sellingPrice,
    diff,
    amount,
    percentage,
    marginPercent,
    status,
  };
}
