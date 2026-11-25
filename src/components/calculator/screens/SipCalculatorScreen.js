import { useState } from 'react';
import { InputField } from '../../ui';
import { CalculatorLayout } from '../CalculatorLayout';
import { ResultCard } from '../ResultCard';
import { calculateSIP } from '../../../utils/calculators/sip';

export function SipCalculatorScreen({
  calculator,
  isFavorite = false,
  onToggleFavorite = null,
  onRecordHistory = null,
  formatNumber = (v) => v.toFixed(2),
}) {
  const [monthly, setMonthly] = useState('');
  const [annualReturn, setAnnualReturn] = useState('');
  const [years, setYears] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleCalculate = () => {
    setError('');
    const res = calculateSIP(monthly, annualReturn, years);
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
        inputSummary: `SIP: ${monthly}/mo, ${annualReturn}% p.a., ${years} yrs`,
        resultSummary: `Value: ${formatNumber(res.totalValue)}`,
      });
    }
  };

  const handleReset = () => {
    setMonthly('');
    setAnnualReturn('');
    setYears('');
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
            title="SIP Projection"
            primaryLabel="Estimated Total Value"
            primaryValue={formatNumber(result.totalValue)}
            rows={[
              { label: 'Invested Amount', value: formatNumber(result.investedAmount) },
              { label: 'Estimated Returns', value: formatNumber(result.estimatedReturns) },
              { label: 'Total Installments', value: `${result.months} months` },
            ]}
            disclaimer="Projections assume a constant annual return rate and are for planning purposes only."
          />
        ) : null
      }
    >
      <InputField
        label="Monthly Investment"
        value={monthly}
        onChangeText={setMonthly}
        placeholder="e.g. 5000"
      />
      <InputField
        label="Expected Annual Return"
        value={annualReturn}
        onChangeText={setAnnualReturn}
        placeholder="e.g. 12"
        suffix="% p.a."
      />
      <InputField
        label="Investment Period"
        value={years}
        onChangeText={setYears}
        placeholder="e.g. 10"
        suffix="Years"
      />
    </CalculatorLayout>
  );
}
