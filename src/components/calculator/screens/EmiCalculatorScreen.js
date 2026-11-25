import { useState } from 'react';
import { InputField, SegmentedControl } from '../../ui';
import { CalculatorLayout } from '../CalculatorLayout';
import { ResultCard } from '../ResultCard';
import { calculateEMI } from '../../../utils/calculators/emi';

const TENURE_UNITS = [
  { label: 'Years', value: 'years' },
  { label: 'Months', value: 'months' },
];

export function EmiCalculatorScreen({
  calculator,
  isFavorite = false,
  onToggleFavorite = null,
  onRecordHistory = null,
  formatNumber = (v) => v.toFixed(2),
}) {
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [tenure, setTenure] = useState('');
  const [tenureUnit, setTenureUnit] = useState('years');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleCalculate = () => {
    setError('');
    const res = calculateEMI(principal, rate, tenure, tenureUnit);
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
        inputSummary: `Loan: ${principal}, Rate: ${rate}%, Tenure: ${tenure} ${tenureUnit}`,
        resultSummary: `EMI: ${formatNumber(res.emi)} / mo`,
      });
    }
  };

  const handleReset = () => {
    setPrincipal('');
    setRate('');
    setTenure('');
    setTenureUnit('years');
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
            title="EMI Breakdown"
            primaryLabel="Monthly EMI"
            primaryValue={formatNumber(result.emi)}
            rows={[
              { label: 'Principal Amount', value: formatNumber(result.principal) },
              { label: 'Total Interest', value: formatNumber(result.totalInterest) },
              { label: 'Total Payment', value: formatNumber(result.totalPayment) },
              { label: 'Total Months', value: `${result.months} months` },
            ]}
          />
        ) : null
      }
    >
      <InputField
        label="Loan Amount"
        value={principal}
        onChangeText={setPrincipal}
        placeholder="e.g. 500000"
      />
      <InputField
        label="Annual Interest Rate"
        value={rate}
        onChangeText={setRate}
        placeholder="e.g. 8.5"
        suffix="% p.a."
      />
      <InputField
        label="Loan Tenure"
        value={tenure}
        onChangeText={setTenure}
        placeholder={tenureUnit === 'years' ? 'e.g. 5' : 'e.g. 60'}
        suffix={tenureUnit}
      />
      <SegmentedControl
        options={TENURE_UNITS}
        value={tenureUnit}
        onChange={setTenureUnit}
      />
    </CalculatorLayout>
  );
}
