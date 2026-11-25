import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CategoryChip, InputField, SegmentedControl } from '../../ui';
import { CalculatorLayout } from '../CalculatorLayout';
import { ResultCard } from '../ResultCard';
import { calculateGST } from '../../../utils/calculators/gst';
import { useTheme } from '../../../context/ThemeContext';

const GST_MODES = [
  { label: 'Add GST (Exclusive)', value: 'exclusive' },
  { label: 'Remove GST (Inclusive)', value: 'inclusive' },
];

const RATE_PRESETS = ['5', '12', '18', '28'];

export function GstCalculatorScreen({
  calculator,
  isFavorite = false,
  onToggleFavorite = null,
  onRecordHistory = null,
  formatNumber = (v) => v.toFixed(2),
}) {
  const { theme } = useTheme();
  const [mode, setMode] = useState('exclusive');
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('18');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleCalculate = () => {
    setError('');
    const res = calculateGST(amount, rate, mode);
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
        inputSummary: `${amount} (${mode}, ${rate}% GST)`,
        resultSummary: `Total: ${formatNumber(res.totalAmount)} (GST: ${formatNumber(res.gstAmount)})`,
      });
    }
  };

  const handleReset = () => {
    setAmount('');
    setRate('18');
    setMode('exclusive');
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
            title="GST Breakdown"
            primaryLabel={mode === 'exclusive' ? 'Total Amount (Incl. GST)' : 'Base Amount (Excl. GST)'}
            primaryValue={formatNumber(
              mode === 'exclusive' ? result.totalAmount : result.baseAmount
            )}
            rows={[
              { label: 'Base Amount', value: formatNumber(result.baseAmount) },
              { label: `Total GST (${result.rate}%)`, value: formatNumber(result.gstAmount) },
              { label: `CGST (${result.rate / 2}%)`, value: formatNumber(result.cgst) },
              { label: `SGST (${result.rate / 2}%)`, value: formatNumber(result.sgst) },
              { label: 'Grand Total', value: formatNumber(result.totalAmount) },
            ]}
          />
        ) : null
      }
    >
      <SegmentedControl
        options={GST_MODES}
        value={mode}
        onChange={(m) => {
          setMode(m);
          setResult(null);
        }}
        style={{ marginBottom: 16 }}
      />
      <InputField
        label={mode === 'exclusive' ? 'Net Amount (Before GST)' : 'Gross Amount (Including GST)'}
        value={amount}
        onChangeText={setAmount}
        placeholder="e.g. 1000"
      />
      <InputField
        label="GST Rate"
        value={rate}
        onChangeText={setRate}
        placeholder="e.g. 18"
        suffix="%"
      />
      <Text style={[theme.typography.caption, { color: theme.colors.textMuted, marginBottom: 8 }]}>
        Quick Tax Slabs
      </Text>
      <View style={styles.presets}>
        {RATE_PRESETS.map((preset) => (
          <CategoryChip
            key={preset}
            label={`${preset}%`}
            selected={rate === preset}
            onPress={() => setRate(preset)}
          />
        ))}
      </View>
    </CalculatorLayout>
  );
}

const styles = StyleSheet.create({
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
