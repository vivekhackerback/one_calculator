import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { InputField, SegmentedControl } from '../../ui';
import { CalculatorLayout } from '../CalculatorLayout';
import { ResultCard } from '../ResultCard';
import { calculateBMI } from '../../../utils/calculators/bmi';
import { useTheme } from '../../../context/ThemeContext';

const UNIT_SYSTEMS = [
  { label: 'Metric (kg / cm)', value: 'metric' },
  { label: 'Imperial (lb / ft)', value: 'imperial' },
];

export function BmiCalculatorScreen({
  calculator,
  isFavorite = false,
  onToggleFavorite = null,
  onRecordHistory = null,
}) {
  const { theme } = useTheme();
  const [unitSystem, setUnitSystem] = useState('metric');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightLb, setWeightLb] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleCalculate = () => {
    setError('');
    const res = calculateBMI({
      unitSystem,
      weightKg,
      heightCm,
      weightLb,
      heightFt,
      heightIn,
    });
    if (!res.ok) {
      setResult(null);
      setError(res.error);
      return;
    }
    setResult(res);
    if (onRecordHistory) {
      const inputSummary =
        unitSystem === 'metric'
          ? `${weightKg} kg, ${heightCm} cm`
          : `${weightLb} lb, ${heightFt}ft ${heightIn || 0}in`;
      onRecordHistory({
        calculatorId: calculator.id,
        calculatorName: calculator.name,
        inputSummary,
        resultSummary: `BMI: ${res.bmi.toFixed(1)} (${res.category.label})`,
      });
    }
  };

  const handleReset = () => {
    setWeightKg('');
    setHeightCm('');
    setWeightLb('');
    setHeightFt('');
    setHeightIn('');
    setResult(null);
    setError('');
  };

  const badgeColor =
    result?.category.tone === 'success'
      ? theme.colors.success
      : result?.category.tone === 'danger'
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
            title="BMI Estimate"
            primaryLabel="Body Mass Index"
            primaryValue={result.bmi.toFixed(1)}
            badgeText={result.category.label}
            badgeColor={badgeColor}
            rows={[
              {
                label: 'Healthy Weight Range',
                value: `${result.minHealthy.toFixed(1)} – ${result.maxHealthy.toFixed(1)} ${result.weightUnit}`,
              },
            ]}
            disclaimer={result.disclaimer}
          />
        ) : null
      }
    >
      <SegmentedControl
        options={UNIT_SYSTEMS}
        value={unitSystem}
        onChange={(u) => {
          setUnitSystem(u);
          setResult(null);
          setError('');
        }}
        style={{ marginBottom: 16 }}
      />

      {unitSystem === 'metric' ? (
        <>
          <InputField
            label="Weight"
            value={weightKg}
            onChangeText={setWeightKg}
            placeholder="e.g. 70"
            suffix="kg"
          />
          <InputField
            label="Height"
            value={heightCm}
            onChangeText={setHeightCm}
            placeholder="e.g. 175"
            suffix="cm"
          />
        </>
      ) : (
        <>
          <InputField
            label="Weight"
            value={weightLb}
            onChangeText={setWeightLb}
            placeholder="e.g. 154"
            suffix="lb"
          />
          <View style={styles.row}>
            <InputField
              label="Height (Feet)"
              value={heightFt}
              onChangeText={setHeightFt}
              placeholder="e.g. 5"
              suffix="ft"
              style={styles.half}
            />
            <InputField
              label="Height (Inches)"
              value={heightIn}
              onChangeText={setHeightIn}
              placeholder="e.g. 9"
              suffix="in"
              style={styles.half}
            />
          </View>
        </>
      )}
    </CalculatorLayout>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  half: {
    flex: 1,
  },
});
