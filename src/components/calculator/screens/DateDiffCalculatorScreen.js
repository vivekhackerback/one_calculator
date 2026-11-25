import { useState } from 'react';
import { InputField } from '../../ui';
import { CalculatorLayout } from '../CalculatorLayout';
import { ResultCard } from '../ResultCard';
import { calculateDateDifference } from '../../../utils/calculators/dateDiff';
import { formatISODate } from '../../../utils/calculators/dateUtils';

export function DateDiffCalculatorScreen({
  calculator,
  isFavorite = false,
  onToggleFavorite = null,
  onRecordHistory = null,
}) {
  const [startDate, setStartDate] = useState(() => formatISODate());
  const [endDate, setEndDate] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleCalculate = () => {
    setError('');
    const res = calculateDateDifference(startDate, endDate);
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
        inputSummary: `${startDate} to ${endDate}`,
        resultSummary: `${res.totalDays} days (${res.years}y ${res.months}m ${res.days}d)`,
      });
    }
  };

  const handleReset = () => {
    setStartDate(formatISODate());
    setEndDate('');
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
            title="Date Difference"
            primaryLabel="Duration"
            primaryValue={`${result.years}y ${result.months}m ${result.days}d`}
            badgeText={result.isReversed ? 'Reversed Range' : undefined}
            rows={[
              { label: 'Total Days', value: result.totalDays.toLocaleString() },
              {
                label: 'Weeks & Days',
                value: `${result.totalWeeks} wks, ${result.remainingDays} days`,
              },
              {
                label: 'Weekdays (Mon–Fri, inclusive)',
                value: result.weekdays.toLocaleString(),
              },
            ]}
          />
        ) : null
      }
    >
      <InputField
        label="Start Date"
        value={startDate}
        onChangeText={setStartDate}
        placeholder="YYYY-MM-DD"
        keyboardType="numbers-and-punctuation"
        helperText="Format: YYYY-MM-DD"
      />
      <InputField
        label="End Date"
        value={endDate}
        onChangeText={setEndDate}
        placeholder="YYYY-MM-DD (e.g. 2026-12-31)"
        keyboardType="numbers-and-punctuation"
        helperText="Format: YYYY-MM-DD"
      />
    </CalculatorLayout>
  );
}
