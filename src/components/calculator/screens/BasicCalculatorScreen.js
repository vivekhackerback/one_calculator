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
import {
  calculateDynamicFontSize,
  tokenizeExpressionForDisplay,
} from '../../../utils/calculators/displaySize';
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
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();

  const [state, dispatch] = useReducer(
    reduceCalculatorState,
    INITIAL_CALCULATOR_STATE
  );
  const [copied, setCopied] = useState(false);
  const [keypadHeight, setKeypadHeight] = useState(0);
  const [displayWidth, setDisplayWidth] = useState(0);

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

  const handleDisplayLayout = useCallback((e) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) {
      setDisplayWidth((prev) => (Math.abs(prev - w) > 1 ? w : prev));
    }
  }, []);

  const effectiveDisplayWidth =
    displayWidth > 0 ? displayWidth : Math.max(200, windowWidth - 56);

  const displayCardHeight = useMemo(
    () => Math.round(Math.min(220, Math.max(176, windowHeight * 0.25))),
    [windowHeight]
  );
  const expressionRegionHeight = Math.round(displayCardHeight * 0.26);
  const resultRegionHeight = Math.round(displayCardHeight * 0.34);
  const wordsRegionHeight = Math.round(displayCardHeight * 0.19);

  const expressionFontMetrics = useMemo(
    () =>
      calculateDynamicFontSize({
        text: formattedExpression || ' ',
        availableWidth: effectiveDisplayWidth,
        maxFontSize: 22,
        minFontSize: 13,
      }),
    [formattedExpression, effectiveDisplayWidth]
  );

  const resultFontMetrics = useMemo(
    () =>
      calculateDynamicFontSize({
        text: formattedResult,
        availableWidth: effectiveDisplayWidth,
        maxFontSize: 48,
        minFontSize: 16,
      }),
    [formattedResult, effectiveDisplayWidth]
  );

  const expressionSegments = useMemo(
    () => tokenizeExpressionForDisplay(formattedExpression),
    [formattedExpression]
  );

  const operatorTextColors = useMemo(
    () => ({
      '+': theme.colors.opPlusText,
      '−': theme.colors.opMinusText,
      '×': theme.colors.opMultiplyText,
      '÷': theme.colors.opDivideText,
      '%': theme.colors.opPercentText,
    }),
    [theme.colors]
  );

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

  const clearBg = theme.colors.keypadClearBg;
  const clearPressed = theme.colors.keypadClearPressedBg;
  const clearText = theme.colors.keypadClearText;

  const deleteBg = theme.colors.keypadDeleteBg;
  const deletePressed = theme.colors.keypadDeletePressedBg;
  const deleteText = theme.colors.keypadDeleteText;

  const percentBg = theme.colors.keypadPercentBg;
  const percentPressed = theme.colors.keypadPercentPressedBg;

  const divideBg = theme.colors.keypadDivideBg;
  const dividePressed = theme.colors.keypadDividePressedBg;

  const multiplyBg = theme.colors.keypadMultiplyBg;
  const multiplyPressed = theme.colors.keypadMultiplyPressedBg;

  const minusBg = theme.colors.keypadMinusBg;
  const minusPressed = theme.colors.keypadMinusPressedBg;

  const plusBg = theme.colors.keypadPlusBg;
  const plusPressed = theme.colors.keypadPlusPressedBg;

  const eqBg = theme.colors.keypadEqualsBg;
  const eqPressed = theme.colors.keypadEqualsPressedBg;

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
            height: displayCardHeight,
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

        <View style={styles.displayNumbers} onLayout={handleDisplayLayout}>
          <View style={[styles.expressionRegion, { height: expressionRegionHeight }]}>
            <Text
              numberOfLines={expressionFontMetrics.overflowsSingleLine ? 2 : 1}
              selectable
              style={[
                styles.expressionText,
                {
                  color: theme.colors.textSecondary,
                  fontSize: expressionFontMetrics.fontSize,
                  lineHeight: Math.round(expressionFontMetrics.fontSize * 1.2),
                },
              ]}
            >
              {expressionSegments.length > 0
                ? expressionSegments.map((seg, idx) =>
                    seg.operator ? (
                      <Text
                        key={`${idx}-${seg.operator}`}
                        style={{
                          color: operatorTextColors[seg.operator],
                          fontWeight: '700',
                        }}
                      >
                        {seg.text}
                      </Text>
                    ) : (
                      seg.text
                    )
                  )
                : ' '}
            </Text>
          </View>
          <View style={[styles.resultRegion, { height: resultRegionHeight }]}>
            <Text
              numberOfLines={resultFontMetrics.overflowsSingleLine ? 2 : 1}
              selectable
              style={[
                styles.resultText,
                {
                  color: theme.colors.text,
                  fontSize: resultFontMetrics.fontSize,
                  lineHeight: Math.round(resultFontMetrics.fontSize * 1.15),
                },
              ]}
            >
              {formattedResult}
            </Text>
          </View>
          <View style={[styles.wordsRegion, { height: wordsRegionHeight }]}>
            <Text
              numberOfLines={2}
              style={[styles.wordsText, { color: theme.colors.textMuted }]}
            >
              {resultInWords}
            </Text>
          </View>
        </View>
      </View>

      {/* Full-Screen Responsive Keypad */}
      <View style={styles.keypad} onLayout={handleKeypadLayout}>
        {/* Row 1: AC | BACK | % | ÷ */}
        <View style={[styles.row, { height: rowHeight }]}>
          <CalculatorKey
            keyId="AC"
            label="AC"
            backgroundColor={clearBg}
            pressedBackgroundColor={clearPressed}
            textColor={clearText}
            borderRadius={keyRadius}
            fontSize={keyFontSize * 0.88}
            onPressInHaptic={hapticClear}
            onPressKey={pressKey}
          />
          <CalculatorKey
            keyId="BACK"
            label="BACK"
            accessibilityLabel="Backspace"
            icon={<Delete size={Math.round(keyFontSize * 0.95)} color={deleteText} />}
            backgroundColor={deleteBg}
            pressedBackgroundColor={deletePressed}
            textColor={deleteText}
            borderRadius={keyRadius}
            onPressInHaptic={hapticDelete}
            onPressKey={pressKey}
          />
          <CalculatorKey
            keyId="%"
            label="%"
            backgroundColor={percentBg}
            pressedBackgroundColor={percentPressed}
            textColor="#FFFFFF"
            borderRadius={keyRadius}
            fontSize={keyFontSize}
            onPressInHaptic={hapticOperator}
            onPressKey={pressKey}
          />
          <CalculatorKey
            keyId="÷"
            label="÷"
            backgroundColor={divideBg}
            pressedBackgroundColor={dividePressed}
            textColor="#FFFFFF"
            borderRadius={keyRadius}
            fontSize={keyFontSize * 1.15}
            onPressInHaptic={hapticOperator}
            onPressKey={pressKey}
          />
        </View>

        {/* Row 2: 7 | 8 | 9 | × */}
        <View style={[styles.row, { height: rowHeight }]}>
          <CalculatorKey
            keyId="7"
            label="7"
            backgroundColor={numBg}
            pressedBackgroundColor={numPressed}
            textColor={numText}
            borderColor={keyBorder}
            borderRadius={keyRadius}
            fontSize={keyFontSize}
            onPressInHaptic={hapticNumber}
            onPressKey={pressKey}
          />
          <CalculatorKey
            keyId="8"
            label="8"
            backgroundColor={numBg}
            pressedBackgroundColor={numPressed}
            textColor={numText}
            borderColor={keyBorder}
            borderRadius={keyRadius}
            fontSize={keyFontSize}
            onPressInHaptic={hapticNumber}
            onPressKey={pressKey}
          />
          <CalculatorKey
            keyId="9"
            label="9"
            backgroundColor={numBg}
            pressedBackgroundColor={numPressed}
            textColor={numText}
            borderColor={keyBorder}
            borderRadius={keyRadius}
            fontSize={keyFontSize}
            onPressInHaptic={hapticNumber}
            onPressKey={pressKey}
          />
          <CalculatorKey
            keyId="×"
            label="×"
            backgroundColor={multiplyBg}
            pressedBackgroundColor={multiplyPressed}
            textColor="#FFFFFF"
            borderRadius={keyRadius}
            fontSize={keyFontSize * 1.15}
            onPressInHaptic={hapticOperator}
            onPressKey={pressKey}
          />
        </View>

        {/* Row 3: 4 | 5 | 6 | − */}
        <View style={[styles.row, { height: rowHeight }]}>
          <CalculatorKey
            keyId="4"
            label="4"
            backgroundColor={numBg}
            pressedBackgroundColor={numPressed}
            textColor={numText}
            borderColor={keyBorder}
            borderRadius={keyRadius}
            fontSize={keyFontSize}
            onPressInHaptic={hapticNumber}
            onPressKey={pressKey}
          />
          <CalculatorKey
            keyId="5"
            label="5"
            backgroundColor={numBg}
            pressedBackgroundColor={numPressed}
            textColor={numText}
            borderColor={keyBorder}
            borderRadius={keyRadius}
            fontSize={keyFontSize}
            onPressInHaptic={hapticNumber}
            onPressKey={pressKey}
          />
          <CalculatorKey
            keyId="6"
            label="6"
            backgroundColor={numBg}
            pressedBackgroundColor={numPressed}
            textColor={numText}
            borderColor={keyBorder}
            borderRadius={keyRadius}
            fontSize={keyFontSize}
            onPressInHaptic={hapticNumber}
            onPressKey={pressKey}
          />
          <CalculatorKey
            keyId="−"
            label="−"
            backgroundColor={minusBg}
            pressedBackgroundColor={minusPressed}
            textColor="#FFFFFF"
            borderRadius={keyRadius}
            fontSize={keyFontSize * 1.15}
            onPressInHaptic={hapticOperator}
            onPressKey={pressKey}
          />
        </View>

        {/* Rows 4 & 5: Left 3 cols (1 2 3 / +/- 0 .) + Right col tall '+' */}
        <View style={[styles.splitRows, { height: tallPlusHeight }]}>
          <View style={styles.leftThreeCols}>
            <View style={[styles.row, { height: rowHeight }]}>
              <CalculatorKey
                keyId="1"
                label="1"
                backgroundColor={numBg}
                pressedBackgroundColor={numPressed}
                textColor={numText}
                borderColor={keyBorder}
                borderRadius={keyRadius}
                fontSize={keyFontSize}
                onPressInHaptic={hapticNumber}
                onPressKey={pressKey}
              />
              <CalculatorKey
                keyId="2"
                label="2"
                backgroundColor={numBg}
                pressedBackgroundColor={numPressed}
                textColor={numText}
                borderColor={keyBorder}
                borderRadius={keyRadius}
                fontSize={keyFontSize}
                onPressInHaptic={hapticNumber}
                onPressKey={pressKey}
              />
              <CalculatorKey
                keyId="3"
                label="3"
                backgroundColor={numBg}
                pressedBackgroundColor={numPressed}
                textColor={numText}
                borderColor={keyBorder}
                borderRadius={keyRadius}
                fontSize={keyFontSize}
                onPressInHaptic={hapticNumber}
                onPressKey={pressKey}
              />
            </View>

            <View style={[styles.row, { height: rowHeight }]}>
              <CalculatorKey
                keyId="+/-"
                label="+/-"
                backgroundColor={numBg}
                pressedBackgroundColor={numPressed}
                textColor={numText}
                borderColor={keyBorder}
                borderRadius={keyRadius}
                fontSize={keyFontSize * 0.85}
                onPressInHaptic={hapticNumber}
                onPressKey={pressKey}
              />
              <CalculatorKey
                keyId="0"
                label="0"
                backgroundColor={numBg}
                pressedBackgroundColor={numPressed}
                textColor={numText}
                borderColor={keyBorder}
                borderRadius={keyRadius}
                fontSize={keyFontSize}
                onPressInHaptic={hapticNumber}
                onPressKey={pressKey}
              />
              <CalculatorKey
                keyId="."
                label="."
                backgroundColor={numBg}
                pressedBackgroundColor={numPressed}
                textColor={numText}
                borderColor={keyBorder}
                borderRadius={keyRadius}
                fontSize={keyFontSize * 1.15}
                onPressInHaptic={hapticNumber}
                onPressKey={pressKey}
              />
            </View>
          </View>

          <View style={styles.rightPlusCol}>
            <CalculatorKey
              keyId="+"
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
              elevation={5}
              style={{ height: tallPlusHeight }}
              onPressInHaptic={hapticOperator}
              onPressKey={pressKey}
            />
          </View>
        </View>

        {/* Row 6: Prominent Full-Width Equals Button */}
        <View style={[styles.row, { height: rowHeight }]}>
          <CalculatorKey
            keyId="="
            label="="
            accessibilityLabel="Equals"
            backgroundColor={eqBg}
            pressedBackgroundColor={eqPressed}
            textColor="#FFFFFF"
            borderRadius={keyRadius}
            fontSize={keyFontSize * 1.25}
            elevation={5}
            onPressInHaptic={hapticEquals}
            onPressKey={pressKey}
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
    paddingVertical: 10,
    marginBottom: 12,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  displayTopBar: {
    height: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    width: '100%',
    alignItems: 'flex-end',
  },
  expressionRegion: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  resultRegion: {
    width: '100%',
    justifyContent: 'center',
  },
  wordsRegion: {
    width: '100%',
    justifyContent: 'flex-start',
  },
  expressionText: {
    width: '100%',
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  resultText: {
    width: '100%',
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  wordsText: {
    width: '100%',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    textAlign: 'right',
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
