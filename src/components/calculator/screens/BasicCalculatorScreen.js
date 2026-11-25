import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Check, Copy, Delete, Plus, Share2, Star } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { usePreferences } from '../../../context/PreferencesContext';
import {
  INITIAL_CALCULATOR_STATE,
  evaluateExpression,
  reduceCalculatorState,
} from '../../../utils/calculators/basic';
import {
  formatIndianExpression,
  formatIndianNumber,
  numberToIndianWords,
} from '../../../utils/indianFormat';
import { CalculatorKey } from '../CalculatorKey';

const GAP = 10;
const HISTORY_DEBOUNCE_MS = 1200;

export function BasicCalculatorScreen({
  calculator,
  isFavorite = false,
  onToggleFavorite = null,
  onRecordHistory = null,
}) {
  const { theme, isDark } = useTheme();
  const { triggerHaptic } = usePreferences();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const [state, dispatch] = useReducer(
    reduceCalculatorState,
    INITIAL_CALCULATOR_STATE
  );
  const [copied, setCopied] = useState(false);
  const [keypadHeight, setKeypadHeight] = useState(0);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const recordHistoryRef = useRef(onRecordHistory);
  useEffect(() => {
    recordHistoryRef.current = onRecordHistory;
  }, [onRecordHistory]);

  const calculatorRef = useRef(calculator);
  useEffect(() => {
    calculatorRef.current = calculator;
  }, [calculator]);

  const lastSavedKeyRef = useRef('');
  const historyTimerRef = useRef(null);

  const saveCalculationNow = useCallback((expr, resText) => {
    if (!expr || !recordHistoryRef.current) return;
    const dedupKey = `${expr}::${resText}`;
    if (lastSavedKeyRef.current === dedupKey) return;
    lastSavedKeyRef.current = dedupKey;
    recordHistoryRef.current({
      calculatorId: calculatorRef.current.id,
      calculatorName: calculatorRef.current.name,
      inputSummary: formatIndianExpression(expr),
      resultSummary: formatIndianNumber(resText),
    });
  }, []);

  // Automatic debounced history saving for live meaningful calculations
  useEffect(() => {
    if (historyTimerRef.current) {
      clearTimeout(historyTimerRef.current);
      historyTimerRef.current = null;
    }

    if (state.hasMeaningfulResult && !state.error && state.expression) {
      const exprSnapshot = state.expression;
      const resSnapshot = state.resultText;
      historyTimerRef.current = setTimeout(() => {
        saveCalculationNow(exprSnapshot, resSnapshot);
        historyTimerRef.current = null;
      }, HISTORY_DEBOUNCE_MS);
    }

    return () => {
      if (historyTimerRef.current) {
        clearTimeout(historyTimerRef.current);
        historyTimerRef.current = null;
      }
    };
  }, [
    state.expression,
    state.resultText,
    state.hasMeaningfulResult,
    state.error,
    saveCalculationNow,
  ]);

  // Flush any unsaved meaningful calculation when leaving the screen
  useEffect(() => {
    return () => {
      const latest = stateRef.current;
      if (latest.hasMeaningfulResult && !latest.error && latest.expression) {
        saveCalculationNow(latest.expression, latest.resultText);
      }
    };
  }, [saveCalculationNow]);

  const pressKey = useCallback(
    (key) => {
      if (key === '=') {
        if (historyTimerRef.current) {
          clearTimeout(historyTimerRef.current);
          historyTimerRef.current = null;
        }
        const current = stateRef.current;
        if (current.expression) {
          const evaluated = evaluateExpression(current.expression);
          if (evaluated.ok) {
            saveCalculationNow(current.expression, evaluated.formatted);
          }
        }
      }
      dispatch(key);
    },
    [saveCalculationNow]
  );

  const hapticNumber = useCallback(() => triggerHaptic('number'), [triggerHaptic]);
  const hapticOperator = useCallback(() => triggerHaptic('operator'), [triggerHaptic]);
  const hapticClear = useCallback(() => triggerHaptic('clear'), [triggerHaptic]);
  const hapticDelete = useCallback(() => triggerHaptic('delete'), [triggerHaptic]);
  const hapticEquals = useCallback(() => triggerHaptic('equals'), [triggerHaptic]);

  const formattedExpression = useMemo(
    () => formatIndianExpression(state.expression),
    [state.expression]
  );

  const formattedResult = useMemo(
    () => formatIndianNumber(state.resultText),
    [state.resultText]
  );

  const resultInWords = useMemo(
    () => numberToIndianWords(state.resultText),
    [state.resultText]
  );

  const handleCopy = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(formattedResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Ignore
    }
  }, [formattedResult]);

  const handleShare = useCallback(async () => {
    try {
      const msg = formattedExpression
        ? `${formattedExpression} = ${formattedResult}\n(${resultInWords})`
        : `Result: ${formattedResult}`;
      await Share.share({ message: `${msg}\n\nCalculated with One Calculator` });
    } catch {
      // Ignore
    }
  }, [formattedExpression, formattedResult, resultInWords]);

  const handleKeypadLayout = useCallback((e) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0) {
      setKeypadHeight(h);
    }
  }, []);

  const effectiveKeypadHeight =
    keypadHeight > 0 ? keypadHeight : Math.max(300, windowHeight * 0.54);
  const rowHeight = Math.max(44, Math.floor((effectiveKeypadHeight - GAP * 5) / 6));
  const tallPlusHeight = rowHeight * 2 + GAP;
  const keyFontSize = Math.min(28, Math.max(20, Math.round(rowHeight * 0.36)));
  const keyRadius = Math.min(20, Math.max(12, Math.round(rowHeight * 0.24)));

  const numBg = theme.colors.keypadBg;
  const numPressed = theme.colors.keypadPressedBg;
  const numText = theme.colors.text;
  const keyBorder = isDark ? theme.colors.border : '#E2E8F0';

  const opBg = theme.colors.keypadOperatorBg;
  const opPressed = isDark ? '#1D4ED8' : '#BFDBFE';
  const opText = theme.colors.keypadOperatorText;

  const clearBg = theme.colors.dangerSoft;
  const clearPressed = isDark ? '#7F1D1D' : '#FECACA';
  const clearText = theme.colors.danger;

  const plusBg = theme.colors.keypadPlusBg;
  const plusPressed = '#0369A1';

  const eqBg = theme.colors.primary;
  const eqPressed = '#1D4ED8';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      <Stack.Screen
        options={{
          title: calculator.name,
          headerRight: onToggleFavorite
            ? () => (
                <Pressable onPress={onToggleFavorite} hitSlop={10} style={styles.favBtn}>
                  <Star
                    size={22}
                    color={isFavorite ? '#F59E0B' : theme.colors.textMuted}
                    fill={isFavorite ? '#F59E0B' : 'transparent'}
                  />
                </Pressable>
              )
            : undefined,
        }}
      />

      {/* Display Area */}
      <View
        style={[
          styles.displayCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.xl,
          },
        ]}
      >
        <View style={styles.displayTopBar}>
          <View style={styles.displayActions}>
            <Pressable onPress={handleCopy} hitSlop={8} style={styles.miniAction}>
              {copied ? (
                <Check size={15} color={theme.colors.success} />
              ) : (
                <Copy size={15} color={theme.colors.textMuted} />
              )}
              <Text
                style={[
                  theme.typography.small,
                  { color: theme.colors.textMuted, marginLeft: 4 },
                ]}
              >
                {copied ? 'Copied' : 'Copy'}
              </Text>
            </Pressable>
            <Pressable onPress={handleShare} hitSlop={8} style={styles.miniAction}>
              <Share2 size={15} color={theme.colors.textMuted} />
              <Text
                style={[
                  theme.typography.small,
                  { color: theme.colors.textMuted, marginLeft: 4 },
                ]}
              >
                Share
              </Text>
            </Pressable>
          </View>
          {state.error ? (
            <Text
              numberOfLines={1}
              style={[
                theme.typography.caption,
                { color: theme.colors.danger, fontWeight: '600' },
              ]}
            >
              {state.error}
            </Text>
          ) : null}
        </View>

        <View style={styles.displayNumbers}>
          <Text
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.55}
            selectable
            style={[styles.expressionText, { color: theme.colors.textSecondary }]}
          >
            {formattedExpression || ' '}
          </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.38}
            selectable
            style={[styles.resultText, { color: theme.colors.text }]}
          >
            {formattedResult}
          </Text>
          <Text
            numberOfLines={2}
            style={[styles.wordsText, { color: theme.colors.textMuted }]}
          >
            {resultInWords}
          </Text>
        </View>
      </View>

      {/* Full-Screen Responsive Keypad */}
      <View style={styles.keypad} onLayout={handleKeypadLayout}>
        {/* Row 1: AC | BACK | % | ÷ */}
        <View style={[styles.row, { height: rowHeight }]}>
          <CalculatorKey
            label="AC"
            backgroundColor={clearBg}
            pressedBackgroundColor={clearPressed}
            textColor={clearText}
            borderRadius={keyRadius}
            fontSize={keyFontSize * 0.88}
            onPressInHaptic={hapticClear}
            onPress={() => pressKey('AC')}
          />
          <CalculatorKey
            label="BACK"
            accessibilityLabel="Backspace"
            icon={<Delete size={Math.round(keyFontSize * 0.95)} color={opText} />}
            backgroundColor={opBg}
            pressedBackgroundColor={opPressed}
            textColor={opText}
            borderRadius={keyRadius}
            onPressInHaptic={hapticDelete}
            onPress={() => pressKey('BACK')}
          />
          <CalculatorKey
            label="%"
            backgroundColor={opBg}
            pressedBackgroundColor={opPressed}
            textColor={opText}
            borderRadius={keyRadius}
            fontSize={keyFontSize}
            onPressInHaptic={hapticOperator}
            onPress={() => pressKey('%')}
          />
          <CalculatorKey
            label="÷"
            backgroundColor={opBg}
            pressedBackgroundColor={opPressed}
            textColor={opText}
            borderRadius={keyRadius}
            fontSize={keyFontSize * 1.15}
            onPressInHaptic={hapticOperator}
            onPress={() => pressKey('÷')}
          />
        </View>

        {/* Row 2: 7 | 8 | 9 | × */}
        <View style={[styles.row, { height: rowHeight }]}>
          <CalculatorKey
            label="7"
            backgroundColor={numBg}
            pressedBackgroundColor={numPressed}
            textColor={numText}
            borderColor={keyBorder}
            borderRadius={keyRadius}
            fontSize={keyFontSize}
            onPressInHaptic={hapticNumber}
            onPress={() => pressKey('7')}
          />
          <CalculatorKey
            label="8"
            backgroundColor={numBg}
            pressedBackgroundColor={numPressed}
            textColor={numText}
            borderColor={keyBorder}
            borderRadius={keyRadius}
            fontSize={keyFontSize}
            onPressInHaptic={hapticNumber}
            onPress={() => pressKey('8')}
          />
          <CalculatorKey
            label="9"
            backgroundColor={numBg}
            pressedBackgroundColor={numPressed}
            textColor={numText}
            borderColor={keyBorder}
            borderRadius={keyRadius}
            fontSize={keyFontSize}
            onPressInHaptic={hapticNumber}
            onPress={() => pressKey('9')}
          />
          <CalculatorKey
            label="×"
            backgroundColor={opBg}
            pressedBackgroundColor={opPressed}
            textColor={opText}
            borderRadius={keyRadius}
            fontSize={keyFontSize * 1.15}
            onPressInHaptic={hapticOperator}
            onPress={() => pressKey('×')}
          />
        </View>

        {/* Row 3: 4 | 5 | 6 | − */}
        <View style={[styles.row, { height: rowHeight }]}>
          <CalculatorKey
            label="4"
            backgroundColor={numBg}
            pressedBackgroundColor={numPressed}
            textColor={numText}
            borderColor={keyBorder}
            borderRadius={keyRadius}
            fontSize={keyFontSize}
            onPressInHaptic={hapticNumber}
            onPress={() => pressKey('4')}
          />
          <CalculatorKey
            label="5"
            backgroundColor={numBg}
            pressedBackgroundColor={numPressed}
            textColor={numText}
            borderColor={keyBorder}
            borderRadius={keyRadius}
            fontSize={keyFontSize}
            onPressInHaptic={hapticNumber}
            onPress={() => pressKey('5')}
          />
          <CalculatorKey
            label="6"
            backgroundColor={numBg}
            pressedBackgroundColor={numPressed}
            textColor={numText}
            borderColor={keyBorder}
            borderRadius={keyRadius}
            fontSize={keyFontSize}
            onPressInHaptic={hapticNumber}
            onPress={() => pressKey('6')}
          />
          <CalculatorKey
            label="−"
            backgroundColor={opBg}
            pressedBackgroundColor={opPressed}
            textColor={opText}
            borderRadius={keyRadius}
            fontSize={keyFontSize * 1.15}
            onPressInHaptic={hapticOperator}
            onPress={() => pressKey('−')}
          />
        </View>

        {/* Rows 4 & 5: Left 3 cols (1 2 3 / +/- 0 .) + Right col tall '+' */}
        <View style={[styles.splitRows, { height: tallPlusHeight }]}>
          <View style={styles.leftThreeCols}>
            <View style={[styles.row, { height: rowHeight }]}>
              <CalculatorKey
                label="1"
                backgroundColor={numBg}
                pressedBackgroundColor={numPressed}
                textColor={numText}
                borderColor={keyBorder}
                borderRadius={keyRadius}
                fontSize={keyFontSize}
                onPressInHaptic={hapticNumber}
                onPress={() => pressKey('1')}
              />
              <CalculatorKey
                label="2"
                backgroundColor={numBg}
                pressedBackgroundColor={numPressed}
                textColor={numText}
                borderColor={keyBorder}
                borderRadius={keyRadius}
                fontSize={keyFontSize}
                onPressInHaptic={hapticNumber}
                onPress={() => pressKey('2')}
              />
              <CalculatorKey
                label="3"
                backgroundColor={numBg}
                pressedBackgroundColor={numPressed}
                textColor={numText}
                borderColor={keyBorder}
                borderRadius={keyRadius}
                fontSize={keyFontSize}
                onPressInHaptic={hapticNumber}
                onPress={() => pressKey('3')}
              />
            </View>

            <View style={[styles.row, { height: rowHeight }]}>
              <CalculatorKey
                label="+/-"
                backgroundColor={numBg}
                pressedBackgroundColor={numPressed}
                textColor={numText}
                borderColor={keyBorder}
                borderRadius={keyRadius}
                fontSize={keyFontSize * 0.85}
                onPressInHaptic={hapticNumber}
                onPress={() => pressKey('+/-')}
              />
              <CalculatorKey
                label="0"
                backgroundColor={numBg}
                pressedBackgroundColor={numPressed}
                textColor={numText}
                borderColor={keyBorder}
                borderRadius={keyRadius}
                fontSize={keyFontSize}
                onPressInHaptic={hapticNumber}
                onPress={() => pressKey('0')}
              />
              <CalculatorKey
                label="."
                backgroundColor={numBg}
                pressedBackgroundColor={numPressed}
                textColor={numText}
                borderColor={keyBorder}
                borderRadius={keyRadius}
                fontSize={keyFontSize * 1.15}
                onPressInHaptic={hapticNumber}
                onPress={() => pressKey('.')}
              />
            </View>
          </View>

          <View style={styles.rightPlusCol}>
            <CalculatorKey
              label="+"
              accessibilityLabel="Plus"
              icon={
                <Plus
                  size={Math.round(keyFontSize * 1.35)}
                  strokeWidth={2.75}
                  color="#FFFFFF"
                />
              }
              backgroundColor={plusBg}
              pressedBackgroundColor={plusPressed}
              textColor="#FFFFFF"
              borderRadius={keyRadius}
              style={{ height: tallPlusHeight }}
              onPressInHaptic={hapticOperator}
              onPress={() => pressKey('+')}
            />
          </View>
        </View>

        {/* Row 6: Prominent Full-Width Equals Button */}
        <View style={[styles.row, { height: rowHeight }]}>
          <CalculatorKey
            label="="
            accessibilityLabel="Equals"
            backgroundColor={eqBg}
            pressedBackgroundColor={eqPressed}
            textColor="#FFFFFF"
            borderRadius={keyRadius}
            fontSize={keyFontSize * 1.25}
            onPressInHaptic={hapticEquals}
            onPress={() => pressKey('=')}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  favBtn: {
    padding: 4,
  },
  displayCard: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    justifyContent: 'space-between',
    minHeight: 152,
  },
  displayTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  displayActions: {
    flexDirection: 'row',
    gap: 16,
  },
  miniAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  displayNumbers: {
    alignItems: 'flex-end',
  },
  expressionText: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'right',
    minHeight: 30,
  },
  resultText: {
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 2,
  },
  wordsText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'right',
    marginTop: 4,
  },
  keypad: {
    flex: 1,
    gap: GAP,
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
  },
  splitRows: {
    flexDirection: 'row',
    gap: GAP,
  },
  leftThreeCols: {
    flex: 3,
    gap: GAP,
  },
  rightPlusCol: {
    flex: 1,
  },
});
