import { useState } from 'react';
import { InputField } from '../../ui';
import { CalculatorLayout } from '../CalculatorLayout';
import { ResultCard } from '../ResultCard';
import { calculateAge } from '../../../utils/calculators/age';
import { formatISODate } from '../../../utils/calculators/dateUtils';

export function AgeCalculatorScreen({
  calculator,
  isFavorite = false,
  onToggleFavorite = null,
  onRecordHistory = null,
}) {
  const [dob, setDob] = useState('');
  const [targetDate, setTargetDate] = useState(() => formatISODate());
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleCalculate = () => {
    setError('');
    const res = calculateAge(dob, targetDate);
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
        inputSummary: `DOB: ${dob} | As of: ${targetDate}`,
        resultSummary: `${res.years} yrs, ${res.months} mos, ${res.days} days`,
      });
    }
  };

  const handleReset = () => {
    setDob('');
    setTargetDate(formatISODate());
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
            title="Age Summary"
            primaryLabel="Exact Age"
            primaryValue={`${result.years}y ${result.months}m ${result.days}d`}
            badgeText={result.isBirthdayToday ? 'Happy Birthday!' : undefined}
            rows={[
              { label: 'Total Months', value: result.totalMonths.toLocaleString() },
              { label: 'Total Weeks', value: result.totalWeeks.toLocaleString() },
              { label: 'Total Days', value: result.totalDays.toLocaleString() },
              {
                label: 'Next Birthday In',
                value: `${result.daysUntilNextBirthday} days`,
              },
            ]}
          />
        ) : null
      }
    >
      <InputField
        label="Date of Birth"
        value={dob}
        onChangeText={setDob}
        placeholder="YYYY-MM-DD (e.g. 1998-05-15)"
        keyboardType="numbers-and-punctuation"
        helperText="Format: YYYY-MM-DD"
      />
      <InputField
        label="Calculate Age As Of"
        value={targetDate}
        onChangeText={setTargetDate}
        placeholder="YYYY-MM-DD"
        keyboardType="numbers-and-punctuation"
        helperText="Defaults to today's date"
      />
    </CalculatorLayout>
  );
}
