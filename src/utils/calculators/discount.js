export function calculateDiscount(
  rawPrice,
  rawDiscount,
  rawExtraDiscount = '0',
  rawTax = '0'
) {
  const price = Number(rawPrice);
  const discount = Number(rawDiscount);
  const extraDiscount = rawExtraDiscount === '' ? 0 : Number(rawExtraDiscount);
  const tax = rawTax === '' ? 0 : Number(rawTax);

  if (rawPrice === '' || !Number.isFinite(price) || price < 0) {
    return { ok: false, error: 'Original price must be 0 or greater.' };
  }
  if (rawDiscount === '' || !Number.isFinite(discount) || discount < 0 || discount > 100) {
    return { ok: false, error: 'Discount percentage must be between 0% and 100%.' };
  }
  if (!Number.isFinite(extraDiscount) || extraDiscount < 0 || extraDiscount > 100) {
    return { ok: false, error: 'Additional discount must be between 0% and 100%.' };
  }
  if (!Number.isFinite(tax) || tax < 0 || tax > 100) {
    return { ok: false, error: 'Tax percentage must be between 0% and 100%.' };
  }

  const afterFirst = price * (1 - discount / 100);
  const discountedPrice = afterFirst * (1 - extraDiscount / 100);
  const totalSavings = price - discountedPrice;
  const taxAmount = discountedPrice * (tax / 100);
  const finalPrice = discountedPrice + taxAmount;
  const effectiveDiscountPercent = price > 0 ? (totalSavings / price) * 100 : 0;

  return {
    ok: true,
    originalPrice: price,
    discountedPrice,
    totalSavings,
    taxAmount,
    finalPrice,
    effectiveDiscountPercent,
  };
}
