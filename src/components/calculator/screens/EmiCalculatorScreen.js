import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Card, RangeSlider, SegmentedControl } from '../../ui';
import { CalculatorLayout } from '../CalculatorLayout';
import { ResultCard } from '../ResultCard';
import { useTheme } from '../../../context/ThemeContext';
import { calculateEMI } from '../../../utils/calculators/emi';
import { formatIndianNumber } from '../../../utils/indianFormat';

const TENURE_UNITS = [
  { label: 'Years', value: 'years' },
  { label: 'Months', value: 'months' },
];

const DEFAULT_PRINCIPAL = '500000';
const DEFAULT_RATE = '8.5';
const DEFAULT_TENURE = '5';

export function EmiCalculatorScreen({
  calculator,
  isFavorite = false,
  onToggleFavorite = null,
  onRecordHistory = null,
  formatNumber = (v) => v.toFixed(2),
}) {
  const { theme } = useTheme();
  const [principal, setPrincipal] = useState(DEFAULT_PRINCIPAL);
  const [rate, setRate] = useState(DEFAULT_RATE);
  const [tenure, setTenure] = useState(DEFAULT_TENURE);
  const [tenureUnit, setTenureUnit] = useState('years');
  const [error, setError] = useState('');

  const liveResult = useMemo(() => {
    const res = calculateEMI(principal, rate, tenure, tenureUnit);
    return res.ok ? res : null;
  }, [principal, rate, tenure, tenureUnit]);

  const handleTenureUnitChange = (nextUnit) => {
    if (nextUnit === tenureUnit) return;
    const currentNum = Number(tenure);
    if (Number.isFinite(currentNum) && currentNum > 0) {
      if (nextUnit === 'months') {
        setTenure(String(Math.round(currentNum * 12)));
      } else {
        setTenure(String(Math.max(1, Math.round(currentNum / 12))));
      }
    }
    setTenureUnit(nextUnit);
  };

  const handleCalculate = () => {
    setError('');
    const res = calculateEMI(principal, rate, tenure, tenureUnit);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (onRecordHistory) {
      onRecordHistory({
        calculatorId: calculator.id,
        calculatorName: calculator.name,
        inputSummary: `Loan: ₹${formatIndianNumber(principal)}, Rate: ${rate}%, Tenure: ${tenure} ${tenureUnit}`,
        resultSummary: `EMI: ₹${formatIndianNumber(formatNumber(res.emi))} / mo`,
      });
    }
  };

  const handleReset = () => {
    setPrincipal(DEFAULT_PRINCIPAL);
    setRate(DEFAULT_RATE);
    setTenure(DEFAULT_TENURE);
    setTenureUnit('years');
    setError('');
  };

  const principalRatio = useMemo(() => {
    if (!liveResult || liveResult.totalPayment <= 0) return 100;
    return Math.round((liveResult.principal / liveResult.totalPayment) * 1000) / 10;
  }, [liveResult]);

  const interestRatio = Math.max(0, Math.round((100 - principalRatio) * 10) / 10);

  return (
    <CalculatorLayout
      title={calculator.name}
      description={calculator.description}
      onCalculate={handleCalculate}
      onReset={handleReset}
      calculateLabel="Save to History"
      error={error}
      isFavorite={isFavorite}
      onToggleFavorite={onToggleFavorite}
      result={
        liveResult ? (
          <View style={styles.resultStack}>
            <ResultCard
              title="EMI Breakdown"
              primaryLabel="Monthly EMI"
              primaryValue={`₹${formatIndianNumber(formatNumber(liveResult.emi))}`}
              badgeText={`${liveResult.months} mos`}
              rows={[
                {
                  label: 'Principal Amount',
                  value: `₹${formatIndianNumber(formatNumber(liveResult.principal))}`,
                },
                {
                  label: 'Total Interest',
                  value: `₹${formatIndianNumber(formatNumber(liveResult.totalInterest))}`,
                },
                {
                  label: 'Total Payment',
                  value: `₹${formatIndianNumber(formatNumber(liveResult.totalPayment))}`,
                },
              ]}
            />

            {/* Visual Principal vs Interest Ratio */}
            <Card style={styles.ratioCard}>
              <Text
                style={[
                  theme.typography.label,
                  { color: theme.colors.text, marginBottom: 10 },
                ]}
              >
                Payment Split
              </Text>
              <View
                style={[
                  styles.ratioBar,
                  { backgroundColor: theme.colors.border },
                ]}
              >
                <View
                  style={[
                    styles.ratioPrincipal,
                    {
                      width: `${principalRatio}%`,
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.ratioInterest,
                    {
                      width: `${interestRatio}%`,
                      backgroundColor: '#F59E0B',
                    },
                  ]}
                />
              </View>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  />
                  <Text
                    style={[
                      theme.typography.small,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Principal ({principalRatio}%)
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: '#F59E0B' }]}
                  />
                  <Text
                    style={[
                      theme.typography.small,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Interest ({interestRatio}%)
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        ) : null
      }
    >
      {/* Loan Amount + Slider */}
      <View style={styles.sliderHeader}>
        <Text style={[theme.typography.label, { color: theme.colors.text }]}>
          Loan Amount
        </Text>
        <View
          style={[
            styles.valuePill,
            {
              backgroundColor: theme.colors.surfaceSecondary,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[theme.typography.small, { color: theme.colors.textMuted }]}>
            ₹
          </Text>
          <TextInput
            value={principal}
            onChangeText={(t) => setPrincipal(t.replace(/[^0-9.]/g, ''))}
            keyboardType="numeric"
            style={[
              styles.pillInput,
              { color: theme.colors.primary },
            ]}
          />
        </View>
      </View>
      <RangeSlider
        value={Number(principal) || 0}
        min={10000}
        max={10000000}
        step={10000}
        onValueChange={(v) => setPrincipal(String(v))}
        minLabel="₹10K"
        maxLabel="₹1 Cr"
      />

      {/* Annual Interest Rate + Slider */}
      <View style={styles.sliderHeader}>
        <Text style={[theme.typography.label, { color: theme.colors.text }]}>
          Interest Rate (p.a.)
        </Text>
        <View
          style={[
            styles.valuePill,
            {
              backgroundColor: theme.colors.surfaceSecondary,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <TextInput
            value={rate}
            onChangeText={(t) => setRate(t.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            style={[
              styles.pillInput,
              { color: theme.colors.primary },
            ]}
          />
          <Text style={[theme.typography.small, { color: theme.colors.textMuted }]}>
            %
          </Text>
        </View>
      </View>
      <RangeSlider
        value={Number(rate) || 0}
        min={1}
        max={24}
        step={0.1}
        onValueChange={(v) => setRate(String(v))}
        minLabel="1%"
        maxLabel="24%"
        accentColor="#F59E0B"
      />

      {/* Loan Tenure + Slider */}
      <View style={styles.sliderHeader}>
        <Text style={[theme.typography.label, { color: theme.colors.text }]}>
          Loan Tenure
        </Text>
        <View
          style={[
            styles.valuePill,
            {
              backgroundColor: theme.colors.surfaceSecondary,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <TextInput
            value={tenure}
            onChangeText={(t) => setTenure(t.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            style={[
              styles.pillInput,
              { color: theme.colors.primary },
            ]}
          />
          <Text style={[theme.typography.small, { color: theme.colors.textMuted }]}>
            {tenureUnit === 'years' ? 'Yr' : 'Mo'}
          </Text>
        </View>
      </View>
      <RangeSlider
        value={Number(tenure) || 1}
        min={tenureUnit === 'years' ? 1 : 6}
        max={tenureUnit === 'years' ? 30 : 360}
        step={tenureUnit === 'years' ? 1 : 6}
        onValueChange={(v) => setTenure(String(v))}
        minLabel={tenureUnit === 'years' ? '1 Yr' : '6 Mos'}
        maxLabel={tenureUnit === 'years' ? '30 Yrs' : '360 Mos'}
      />

      <SegmentedControl
        options={TENURE_UNITS}
        value={tenureUnit}
        onChange={handleTenureUnitChange}
      />
    </CalculatorLayout>
  );
}

const styles = StyleSheet.create({
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  valuePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 96,
    justifyContent: 'flex-end',
    gap: 4,
  },
  pillInput: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
    minWidth: 54,
    padding: 0,
  },
  resultStack: {
    gap: 12,
  },
  ratioCard: {
    padding: 14,
  },
  ratioBar: {
    height: 10,
    borderRadius: 999,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  ratioPrincipal: {
    height: '100%',
  },
  ratioInterest: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
});
