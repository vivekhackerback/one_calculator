import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { InputField, SegmentedControl } from '../../ui';
import { CalculatorLayout } from '../CalculatorLayout';
import { ResultCard } from '../ResultCard';
import { calculateBMR } from '../../../utils/calculators/bmr';

const GENDERS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];

const UNIT_SYSTEMS = [
  { label: 'Metric (kg / cm)', value: 'metric' },
  { label: 'Imperial (lb / ft)', value: 'imperial' },
];

export function BmrCalculatorScreen({
  calculator,
  isFavorite = false,
  onToggleFavorite = null,
  onRecordHistory = null,
}) {
  const [gender, setGender] = useState('male');
  const [unitSystem, setUnitSystem] = useState('metric');
  const [age, setAge] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightLb, setWeightLb] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleCalculate = () => {
    setError('');
    const res = calculateBMR({
      gender,
      age,
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
      onRecordHistory({
        calculatorId: calculator.id,
        calculatorName: calculator.name,
        inputSummary: `${gender}, ${age}y, ${unitSystem === 'metric' ? `${weightKg}kg/${heightCm}cm` : `${weightLb}lb`}`,
        resultSummary: `BMR: ${res.bmr} kcal/day`,
      });
    }
  };

  const handleReset = () => {
    setGender('male');
    setAge('');
    setWeightKg('');
    setHeightCm('');
    setWeightLb('');
    setHeightFt('');
    setHeightIn('');
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
            title="BMR & Calorie Estimate"
            primaryLabel="Basal Metabolic Rate"
            primaryValue={`${result.bmr.toLocaleString()} kcal/day`}
            rows={result.activityBreakdown.map((item) => ({
              label: item.label,
              value: `${item.calories.toLocaleString()} kcal`,
            }))}
            disclaimer={result.disclaimer}
          />
        ) : null
      }
    >
      <SegmentedControl
        options={GENDERS}
        value={gender}
        onChange={(g) => {
          setGender(g);
          setResult(null);
        }}
        style={{ marginBottom: 12 }}
      />
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

      <InputField
        label="Age"
        value={age}
        onChangeText={setAge}
        placeholder="e.g. 28"
        keyboardType="number-pad"
        suffix="years"
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
