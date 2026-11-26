import { useState } from 'react';
import { DateWheelPicker, InputField } from '../../ui';
import { CalculatorLayout } from '../CalculatorLayout';
import { ResultCard } from '../ResultCard';
import { calculateAge } from '../../../utils/calculators/age';
import { formatDMYDate, formatISOToDMY } from '../../../utils/calculators/dateUtils';

const DEFAULT_DOB = '2000-01-01';

export function AgeCalculatorScreen({
  calculator,
  isFavorite = false,
  onToggleFavorite = null,
  onRecordHistory = null,
}) {
  const [dob, setDob] = useState(DEFAULT_DOB);
  const [targetDate, setTargetDate] = useState(() => formatDMYDate());
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
        inputSummary: `DOB: ${formatISOToDMY(dob)} | As of: ${targetDate}`,
        resultSummary: `${res.years} yrs, ${res.months} mos, ${res.days} days`,
      });
    }
  };

  const handleReset = () => {
    setDob(DEFAULT_DOB);
    setTargetDate(formatDMYDate());
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
      <DateWheelPicker
        label="Date of Birth"
        value={dob}
        onChange={setDob}
        helperText="Scroll or tap Day, Month, and Year"
      />
      <InputField
        label="Calculate Age As Of"
        value={targetDate}
        onChangeText={setTargetDate}
        placeholder="DD-MM-YYYY"
        keyboardType="numbers-and-punctuation"
        helperText="Format: DD-MM-YYYY (defaults to today)"
      />
    </CalculatorLayout>
  );
}
