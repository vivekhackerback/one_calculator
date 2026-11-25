import { useState } from 'react';
import { InputField } from '../../ui';
import { CalculatorLayout } from '../CalculatorLayout';
import { ResultCard } from '../ResultCard';
import { calculateProfitLoss } from '../../../utils/calculators/profitLoss';
import { useTheme } from '../../../context/ThemeContext';

export function ProfitLossCalculatorScreen({
  calculator,
  isFavorite = false,
  onToggleFavorite = null,
  onRecordHistory = null,
  formatNumber = (v) => v.toFixed(2),
}) {
  const { theme } = useTheme();
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleCalculate = () => {
    setError('');
    const res = calculateProfitLoss(costPrice, sellingPrice);
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
        inputSummary: `CP: ${costPrice}, SP: ${sellingPrice}`,
        resultSummary: `${res.status}: ${formatNumber(res.amount)} (${formatNumber(res.percentage)}%)`,
      });
    }
  };

  const handleReset = () => {
    setCostPrice('');
    setSellingPrice('');
    setResult(null);
    setError('');
  };

  const statusColor =
    result?.status === 'Profit'
      ? theme.colors.success
      : result?.status === 'Loss'
      ? theme.colors.danger
      : theme.colors.warning;

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
            title="Profit & Loss Summary"
            primaryLabel={result.status === 'Break-Even' ? 'Result' : `${result.status} Amount`}
            primaryValue={formatNumber(result.amount)}
            badgeText={`${result.status} (${formatNumber(result.percentage)}%)`}
            badgeColor={statusColor}
            rows={[
              { label: 'Cost Price', value: formatNumber(result.costPrice) },
              { label: 'Selling Price', value: formatNumber(result.sellingPrice) },
              {
                label: `${result.status} Percentage`,
                value: `${formatNumber(result.percentage)}%`,
                color: statusColor,
              },
              {
                label: 'Profit Margin (on SP)',
                value: `${formatNumber(result.marginPercent)}%`,
              },
            ]}
          />
        ) : null
      }
    >
      <InputField
        label="Cost Price (CP)"
        value={costPrice}
        onChangeText={setCostPrice}
        placeholder="e.g. 500"
      />
      <InputField
        label="Selling Price (SP)"
        value={sellingPrice}
        onChangeText={setSellingPrice}
        placeholder="e.g. 650"
      />
    </CalculatorLayout>
  );
}
