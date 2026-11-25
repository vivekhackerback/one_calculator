import { useState } from 'react';
import { InputField, SegmentedControl } from '../../ui';
import { CalculatorLayout } from '../CalculatorLayout';
import { ResultCard } from '../ResultCard';
import { calculatePercentage } from '../../../utils/calculators/percentage';

const MODES = [
  { label: 'X% of Y', value: 'of' },
  { label: 'X is % of Y', value: 'whatPercent' },
  { label: '% Change', value: 'change' },
];

export function PercentageCalculatorScreen({
  calculator,
  isFavorite = false,
  onToggleFavorite = null,
  onRecordHistory = null,
}) {
  const [mode, setMode] = useState('of');
  const [valA, setValA] = useState('');
  const [valB, setValB] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const labels = {
    of: { a: 'Percentage (X)', suffixA: '%', b: 'Of Value (Y)', suffixB: '' },
    whatPercent: { a: 'Part Value (X)', suffixA: '', b: 'Total Value (Y)', suffixB: '' },
    change: { a: 'Initial Value (From)', suffixA: '', b: 'New Value (To)', suffixB: '' },
  }[mode];

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setResult(null);
    setError('');
  };

  const handleCalculate = () => {
    setError('');
    const res = calculatePercentage(mode, valA, valB);
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
        inputSummary: res.label,
        resultSummary: res.formatted,
      });
    }
  };

  const handleReset = () => {
    setValA('');
    setValB('');
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
            title="Percentage Result"
            primaryLabel={result.label}
            primaryValue={result.formatted}
            badgeText={result.direction || undefined}
            rows={
              mode === 'change'
                ? [{ label: 'Absolute Difference', value: String(result.diff) }]
                : []
            }
          />
        ) : null
      }
    >
      <SegmentedControl
        options={MODES}
        value={mode}
        onChange={handleModeChange}
        style={{ marginBottom: 16 }}
      />
      <InputField
        label={labels.a}
        value={valA}
        onChangeText={setValA}
        placeholder="0"
        suffix={labels.suffixA}
      />
      <InputField
        label={labels.b}
        value={valB}
        onChangeText={setValB}
        placeholder="0"
        suffix={labels.suffixB}
      />
    </CalculatorLayout>
  );
}
