import { useEffect } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { getCalculatorById } from '../../constants/calculators';
import { useTheme } from '../../context/ThemeContext';
import { useAppData } from '../../context/AppDataContext';
import { usePreferences } from '../../context/PreferencesContext';
import { Button } from '../../components/ui';
import { BasicCalculatorScreen } from '../../components/calculator/screens/BasicCalculatorScreen';
import { AgeCalculatorScreen } from '../../components/calculator/screens/AgeCalculatorScreen';
import { PercentageCalculatorScreen } from '../../components/calculator/screens/PercentageCalculatorScreen';
import { DateDiffCalculatorScreen } from '../../components/calculator/screens/DateDiffCalculatorScreen';
import { EmiCalculatorScreen } from '../../components/calculator/screens/EmiCalculatorScreen';
import { GstCalculatorScreen } from '../../components/calculator/screens/GstCalculatorScreen';
import { InterestCalculatorScreen } from '../../components/calculator/screens/InterestCalculatorScreen';
import { SipCalculatorScreen } from '../../components/calculator/screens/SipCalculatorScreen';
import { DiscountCalculatorScreen } from '../../components/calculator/screens/DiscountCalculatorScreen';
import { ProfitLossCalculatorScreen } from '../../components/calculator/screens/ProfitLossCalculatorScreen';
import { UnitConverterScreen } from '../../components/calculator/screens/UnitConverterScreen';
import { LENGTH_UNITS, convertLength } from '../../utils/calculators/length';
import { WEIGHT_UNITS, convertWeight } from '../../utils/calculators/weight';
import { TEMPERATURE_UNITS, convertTemperature } from '../../utils/calculators/temperature';
import { BmiCalculatorScreen } from '../../components/calculator/screens/BmiCalculatorScreen';
import { BmrCalculatorScreen } from '../../components/calculator/screens/BmrCalculatorScreen';

export default function CalculatorScreen() {
  const { id, restoreExpr, restoreId } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const {
    history,
    isCalculatorFavorite,
    toggleFavoriteCalculator,
    addHistoryEntry,
    upsertAutoHistoryEntry,
    discardDraftHistoryEntry,
    toggleStarHistoryEntry,
    markCalculatorUsed,
  } = useAppData();
  const { formatNumber, triggerHaptic } = usePreferences();

  const calculator = getCalculatorById(typeof id === 'string' ? id : '');

  useEffect(() => {
    if (calculator?.id) {
      markCalculatorUsed(calculator.id);
    }
  }, [calculator?.id, markCalculatorUsed]);

  if (!calculator) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen options={{ title: 'Not Found' }} />
        <Text style={[theme.typography.h1, { color: theme.colors.text, marginBottom: 8 }]}>
          Calculator not found
        </Text>
        <Text style={[theme.typography.body, { color: theme.colors.textMuted, marginBottom: 20 }]}>
          The requested calculator does not exist.
        </Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  const sharedProps = {
    calculator,
    isFavorite: isCalculatorFavorite(calculator.id),
    onToggleFavorite: () => {
      triggerHaptic('selection');
      toggleFavoriteCalculator(calculator.id);
    },
    onRecordHistory: (entry) => {
      addHistoryEntry(entry);
    },
    formatNumber,
  };

  const parsedRestoreId =
    typeof restoreId === 'string' && restoreId ? Number(restoreId) : null;
  const restoredItem = parsedRestoreId
    ? history.find((item) => item.id === parsedRestoreId)
    : null;

  switch (calculator.id) {
    case 'basic':
      return (
        <BasicCalculatorScreen
          {...sharedProps}
          restoreExpression={typeof restoreExpr === 'string' ? restoreExpr : ''}
          restoreHistoryId={parsedRestoreId}
          initialCalcStarred={Boolean(restoredItem?.is_starred)}
          onAutoSaveHistory={upsertAutoHistoryEntry}
          onDiscardDraft={discardDraftHistoryEntry}
          onToggleCalcStar={toggleStarHistoryEntry}
        />
      );
    case 'age':
      return <AgeCalculatorScreen {...sharedProps} />;
    case 'percentage':
      return <PercentageCalculatorScreen {...sharedProps} />;
    case 'date-diff':
      return <DateDiffCalculatorScreen {...sharedProps} />;
    case 'emi':
      return <EmiCalculatorScreen {...sharedProps} />;
    case 'gst':
      return <GstCalculatorScreen {...sharedProps} />;
    case 'interest':
      return <InterestCalculatorScreen {...sharedProps} />;
    case 'sip':
      return <SipCalculatorScreen {...sharedProps} />;
    case 'discount':
      return <DiscountCalculatorScreen {...sharedProps} />;
    case 'profit-loss':
      return <ProfitLossCalculatorScreen {...sharedProps} />;
    case 'length':
      return (
        <UnitConverterScreen
          {...sharedProps}
          units={LENGTH_UNITS}
          defaultFrom="m"
          defaultTo="ft"
          convertFn={convertLength}
        />
      );
    case 'weight':
      return (
        <UnitConverterScreen
          {...sharedProps}
          units={WEIGHT_UNITS}
          defaultFrom="kg"
          defaultTo="lb"
          convertFn={convertWeight}
        />
      );
    case 'temperature':
      return (
        <UnitConverterScreen
          {...sharedProps}
          units={TEMPERATURE_UNITS}
          defaultFrom="°C"
          defaultTo="°F"
          convertFn={convertTemperature}
          allowNegative
        />
      );
    case 'bmi':
      return <BmiCalculatorScreen {...sharedProps} />;
    case 'bmr':
      return <BmrCalculatorScreen {...sharedProps} />;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
