import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CategoryChip, InputField, SegmentedControl } from '../../ui';
import { CalculatorLayout } from '../CalculatorLayout';
import { ResultCard } from '../ResultCard';
import {
  calculateInterest,
  COMPOUND_FREQUENCIES,
} from '../../../utils/calculators/interest';
import { useTheme } from '../../../context/ThemeContext';

const TYPES = [
  { label: 'Compound Interest', value: 'compound' },
  { label: 'Simple Interest', value: 'simple' },
];

export function InterestCalculatorScreen({
  calculator,
  isFavorite = false,
  onToggleFavorite = null,
  onRecordHistory = null,
  formatNumber = (v) => v.toFixed(2),
}) {
  const { theme } = useTheme();
  const [type, setType] = useState('compound');
  const [frequency, setFrequency] = useState(1);
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [years, setYears] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleCalculate = () => {
    setError('');
    const res = calculateInterest(principal, rate, years, type, frequency);
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
        inputSummary: `P: ${principal}, R: ${rate}%, T: ${years}y (${type})`,
        resultSummary: `Total: ${formatNumber(res.totalAmount)} (Int: ${formatNumber(res.interest)})`,
      });
    }
  };

  const handleReset = () => {
    setPrincipal('');
    setRate('');
    setYears('');
    setType('compound');
    setFrequency(1);
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
            title={result.type === 'compound' ? 'Compound Interest' : 'Simple Interest'}
            primaryLabel="Total Maturity Value"
            primaryValue={formatNumber(result.totalAmount)}
            rows={[
              { label: 'Principal Amount', value: formatNumber(result.principal) },
              { label: 'Interest Earned', value: formatNumber(result.interest) },
            ]}
          />
        ) : null
      }
    >
      <SegmentedControl
        options={TYPES}
        value={type}
        onChange={(t) => {
          setType(t);
          setResult(null);
        }}
        style={{ marginBottom: 16 }}
      />
      <InputField
        label="Principal Amount"
        value={principal}
        onChangeText={setPrincipal}
        placeholder="e.g. 50000"
      />
      <InputField
        label="Annual Interest Rate"
        value={rate}
        onChangeText={setRate}
        placeholder="e.g. 7.5"
        suffix="% p.a."
      />
      <InputField
        label="Time Period"
        value={years}
        onChangeText={setYears}
        placeholder="e.g. 3"
        suffix="Years"
      />

      {type === 'compound' ? (
        <View>
          <Text style={[theme.typography.caption, { color: theme.colors.textMuted, marginBottom: 8 }]}>
            Compounding Frequency
          </Text>
          <View style={styles.chips}>
            {COMPOUND_FREQUENCIES.map((freq) => (
              <CategoryChip
                key={freq.value}
                label={freq.label}
                selected={frequency === freq.value}
                onPress={() => setFrequency(freq.value)}
              />
            ))}
          </View>
        </View>
      ) : null}
    </CalculatorLayout>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
});
