import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowUpDown } from 'lucide-react-native';
import { CategoryChip, InputField } from '../../ui';
import { CalculatorLayout } from '../CalculatorLayout';
import { ResultCard } from '../ResultCard';
import { useTheme } from '../../../context/ThemeContext';

export function UnitConverterScreen({
  calculator,
  units,
  defaultFrom,
  defaultTo,
  convertFn,
  allowNegative = false,
  isFavorite = false,
  onToggleFavorite = null,
  onRecordHistory = null,
  formatNumber = (v) => String(v),
}) {
  const { theme } = useTheme();
  const [value, setValue] = useState('');
  const [fromUnit, setFromUnit] = useState(defaultFrom);
  const [toUnit, setToUnit] = useState(defaultTo);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleCalculate = () => {
    setError('');
    const res = convertFn(value, fromUnit, toUnit);
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
        inputSummary: `${value} ${res.fromUnit.id} → ${res.toUnit.id}`,
        resultSummary: `${formatNumber(res.value)} ${res.toUnit.id}`,
      });
    }
  };

  const handleSwap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setResult(null);
    setError('');
  };

  const handleReset = () => {
    setValue('');
    setFromUnit(defaultFrom);
    setToUnit(defaultTo);
    setResult(null);
    setError('');
  };

  return (
    <CalculatorLayout
      title={calculator.name}
      description={calculator.description}
      onCalculate={handleCalculate}
      onReset={handleReset}
      calculateLabel="Convert"
      error={error}
      isFavorite={isFavorite}
      onToggleFavorite={onToggleFavorite}
      result={
        result ? (
          <ResultCard
            title="Conversion Result"
            primaryLabel={`${value} ${result.fromUnit.label} =`}
            primaryValue={`${formatNumber(result.value)} ${result.toUnit.id}`}
            rows={result.breakdown
              .filter((b) => b.id !== result.toUnit.id)
              .map((b) => ({
                label: b.label,
                value: `${formatNumber(b.value)} ${b.id}`,
              }))}
          />
        ) : null
      }
    >
      <InputField
        label="Value to Convert"
        value={value}
        onChangeText={setValue}
        placeholder="e.g. 100"
        keyboardType={allowNegative ? 'numbers-and-punctuation' : 'decimal-pad'}
      />

      <Text style={[theme.typography.label, { color: theme.colors.textSecondary, marginBottom: 8 }]}>
        From Unit
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitRow}>
        {units.map((u) => (
          <CategoryChip
            key={u.id}
            label={u.id}
            selected={fromUnit === u.id}
            onPress={() => {
              setFromUnit(u.id);
              setResult(null);
            }}
          />
        ))}
      </ScrollView>

      <View style={styles.swapRow}>
        <Pressable
          onPress={handleSwap}
          style={[
            styles.swapBtn,
            {
              backgroundColor: theme.colors.surfaceSecondary,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.full,
            },
          ]}
        >
          <ArrowUpDown size={16} color={theme.colors.primary} />
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.primary, fontWeight: '600', marginLeft: 6 },
            ]}
          >
            Swap Units
          </Text>
        </Pressable>
      </View>

      <Text style={[theme.typography.label, { color: theme.colors.textSecondary, marginBottom: 8 }]}>
        To Unit
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {units.map((u) => (
          <CategoryChip
            key={u.id}
            label={u.id}
            selected={toUnit === u.id}
            onPress={() => {
              setToUnit(u.id);
              setResult(null);
            }}
          />
        ))}
      </ScrollView>
    </CalculatorLayout>
  );
}

const styles = StyleSheet.create({
  unitRow: {
    marginBottom: 12,
  },
  swapRow: {
    alignItems: 'center',
    marginVertical: 6,
  },
  swapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
});
