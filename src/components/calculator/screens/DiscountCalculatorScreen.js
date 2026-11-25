import { useState } from 'react';
import { InputField } from '../../ui';
import { CalculatorLayout } from '../CalculatorLayout';
import { ResultCard } from '../ResultCard';
import { calculateDiscount } from '../../../utils/calculators/discount';

export function DiscountCalculatorScreen({
  calculator,
  isFavorite = false,
  onToggleFavorite = null,
  onRecordHistory = null,
  formatNumber = (v) => v.toFixed(2),
}) {
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [extraDiscount, setExtraDiscount] = useState('');
  const [tax, setTax] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleCalculate = () => {
    setError('');
    const res = calculateDiscount(price, discount, extraDiscount, tax);
    if (!res.ok) {
      setResult(null);
      setError(res.error);
      return;
    }
    setResult(res);
    if (onRecordHistory) {
      onRecordHistory({
        calculatorId: calculator.id,
        calculatorName: calculator.name,
        inputSummary: `Price: ${price}, Off: ${discount}%${extraDiscount ? ` + ${extraDiscount}%` : ''}`,
        resultSummary: `Final: ${formatNumber(res.finalPrice)} (Saved: ${formatNumber(res.totalSavings)})`,
      });
    }
  };

  const handleReset = () => {
    setPrice('');
    setDiscount('');
    setExtraDiscount('');
    setTax('');
    setResult(null);
    setError('');
  };

  return (
    <CalculatorLayout
      title={calculator.name}
      description={calculator.description}
      onCalculate={handleCalculate}
      onReset={handleReset}
      error={error}
      isFavorite={isFavorite}
      onToggleFavorite={onToggleFavorite}
      result={
        result ? (
          <ResultCard
            title="Discount Summary"
            primaryLabel="Final Price"
            primaryValue={formatNumber(result.finalPrice)}
            badgeText={`${formatNumber(result.effectiveDiscountPercent)}% OFF`}
            rows={[
              { label: 'Original Price', value: formatNumber(result.originalPrice) },
              { label: 'Total Savings', value: formatNumber(result.totalSavings) },
              { label: 'Price After Discount', value: formatNumber(result.discountedPrice) },
              ...(result.taxAmount > 0
                ? [{ label: 'Sales Tax', value: formatNumber(result.taxAmount) }]
                : []),
            ]}
          />
        ) : null
      }
    >
      <InputField
        label="Original Price"
        value={price}
        onChangeText={setPrice}
        placeholder="e.g. 1200"
      />
      <InputField
        label="Discount"
        value={discount}
        onChangeText={setDiscount}
        placeholder="e.g. 20"
        suffix="%"
      />
      <InputField
        label="Additional Discount (Optional)"
        value={extraDiscount}
        onChangeText={setExtraDiscount}
        placeholder="e.g. 10"
        suffix="%"
      />
      <InputField
        label="Tax / VAT (Optional)"
        value={tax}
        onChangeText={setTax}
        placeholder="e.g. 5"
        suffix="%"
      />
    </CalculatorLayout>
  );
}
