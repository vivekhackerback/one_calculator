import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  AppState,
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
import { buildBasicHistoryPayload } from '../../../utils/historyHelpers';
import { getAppStateValue, setAppStateValue } from '../../../db/database';
import { CalculatorKey } from '../CalculatorKey';

const GAP = 10;
const HISTORY_DEBOUNCE_MS = 350;
const BASIC_SESSION_KEY = 'basic_active_session';

export function BasicCalculatorScreen({
  calculator,
  isFavorite = false,
  onToggleFavorite = null,
  onRecordHistory = null,
  onAutoSaveHistory = null,
  onDiscardDraft = null,
  onToggleCalcStar = null,
  restoreExpression = '',
  restoreHistoryId = null,
  initialCalcStarred = false,
}) {
  const { theme, isDark } = useTheme();
  const { triggerHaptic } = usePreferences();
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();

  const [state, dispatch] = useReducer(
    reduceCalculatorState,
    restoreExpression,
    (expr) =>
      expr
        ? reduceCalculatorState(INITIAL_CALCULATOR_STATE, {
            type: 'RESTORE',
            expression: expr,
          })
        : INITIAL_CALCULATOR_STATE
  );
  const [copied, setCopied] = useState(false);
  const [keypadHeight, setKeypadHeight] = useState(0);
  const [keypadWidth, setKeypadWidth] = useState(0);
  const [displayWidth, setDisplayWidth] = useState(0);
  const [equalsHighlighted, setEqualsHighlighted] = useState(false);
  const [isCalcStarred, setIsCalcStarred] = useState(Boolean(initialCalcStarred));

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const recordHistoryRef = useRef(onRecordHistory);
  useEffect(() => {
    recordHistoryRef.current = onRecordHistory;
  }, [onRecordHistory]);

  const autoSaveHistoryRef = useRef(onAutoSaveHistory);
  useEffect(() => {
    autoSaveHistoryRef.current = onAutoSaveHistory;
  }, [onAutoSaveHistory]);

  const calculatorRef = useRef(calculator);
  useEffect(() => {
    calculatorRef.current = calculator;
  }, [calculator]);

  const lastSavedKeyRef = useRef('');
  const activeHistoryIdRef = useRef(null);
  const restoredExprRef = useRef('');
  const sessionLoadedRef = useRef(false);
  const userInteractedRef = useRef(false);
  const historyTimerRef = useRef(null);

  const persistSessionSnapshot = useCallback((expr, status = 'draft') => {
    const payload =
      status === 'draft' && expr
        ? {
            expression: expr,
            activeHistoryId: activeHistoryIdRef.current,
            status: 'draft',
            updatedAt: new Date().toISOString(),
          }
        : {
            expression: '',
            activeHistoryId: null,
            status: 'cleared',
            updatedAt: new Date().toISOString(),
          };
    setAppStateValue(BASIC_SESSION_KEY, payload).catch(() => {
      // Preserve in-memory input if storage write fails
    });
  }, []);

  const saveCalculationNow = useCallback(
    async (expr, { isStarred = 0, finalized = false } = {}) => {
      const payload = buildBasicHistoryPayload(expr, { finalized });
      if (!payload) return null;

      // Do not duplicate an unchanged reopened history entry unless starring
      if (
        restoredExprRef.current &&
        expr === restoredExprRef.current &&
        !activeHistoryIdRef.current &&
        !isStarred
      ) {
        return null;
      }

      const dedupKey = `${activeHistoryIdRef.current || 'new'}::${payload.expression}::${payload.resultSummary}::${payload.status}`;
      if (lastSavedKeyRef.current === dedupKey && !isStarred) return null;
      lastSavedKeyRef.current = dedupKey;

      if (autoSaveHistoryRef.current) {
        const saved = await autoSaveHistoryRef.current({
          id: activeHistoryIdRef.current,
          calculatorId: calculatorRef.current.id,
          calculatorName: calculatorRef.current.name,
          inputSummary: payload.inputSummary,
          resultSummary: payload.resultSummary,
          expression: payload.expression,
          rawResult: payload.rawResult,
          status: payload.status,
          isStarred,
        });
        if (saved?.id) {
          activeHistoryIdRef.current = saved.id;
        }
        return saved;
      }

      if (recordHistoryRef.current) {
        recordHistoryRef.current({
          calculatorId: calculatorRef.current.id,
          calculatorName: calculatorRef.current.name,
          inputSummary: payload.inputSummary,
          resultSummary: payload.resultSummary,
          expression: payload.expression,
          rawResult: payload.rawResult,
          status: payload.status,
          isStarred,
        });
      }
      return null;
    },
    []
  );

  // Restore either a reopened history entry or the latest unfinished draft only
  useEffect(() => {
    let active = true;
    if (restoreExpression) {
      restoredExprRef.current = restoreExpression;
      activeHistoryIdRef.current = null;
      lastSavedKeyRef.current = '';
      sessionLoadedRef.current = true;
      dispatch({ type: 'RESTORE', expression: restoreExpression });
      return () => {
        active = false;
      };
    }

    (async () => {
      try {
        const savedSession = await getAppStateValue(BASIC_SESSION_KEY);
        if (
          active &&
          !userInteractedRef.current &&
          savedSession?.status === 'draft' &&
          savedSession?.expression
        ) {
          activeHistoryIdRef.current = savedSession.activeHistoryId || null;
          dispatch({ type: 'RESTORE', expression: savedSession.expression });
        }
      } catch {
        // Ignore restore errors
      } finally {
        if (active) {
          sessionLoadedRef.current = true;
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [restoreExpression]);

  // Automatic debounced SQLite auto-save for unfinished drafts
  useEffect(() => {
    if (!sessionLoadedRef.current) return;

    if (historyTimerRef.current) {
      clearTimeout(historyTimerRef.current);
      historyTimerRef.current = null;
    }

    // Never persist a completed calculation as an active draft session
    if (state.justEvaluated) {
      persistSessionSnapshot('', 'completed');
      return;
    }

    persistSessionSnapshot(state.expression, 'draft');

    if (state.expression) {
      const exprSnapshot = state.expression;
      historyTimerRef.current = setTimeout(() => {
        saveCalculationNow(exprSnapshot, { finalized: false });
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
    state.justEvaluated,
    saveCalculationNow,
    persistSessionSnapshot,
  ]);

  // Flush pending draft immediately when app moves to background or screen unmounts
  useEffect(() => {
    const flushDraft = () => {
      const latest = stateRef.current;
      if (latest.justEvaluated || !latest.expression) {
        persistSessionSnapshot('', 'completed');
        return;
      }
      persistSessionSnapshot(latest.expression, 'draft');
      saveCalculationNow(latest.expression, { finalized: false });
    };

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        if (historyTimerRef.current) {
          clearTimeout(historyTimerRef.current);
          historyTimerRef.current = null;
        }
        flushDraft();
      }
    });

    return () => {
      subscription.remove();
      flushDraft();
    };
  }, [saveCalculationNow, persistSessionSnapshot]);

  const handleEqualsPressIn = useCallback(() => {
    userInteractedRef.current = true;
    if (stateRef.current.expression) {
      setEqualsHighlighted(true);
    }
  }, []);

  const pressKey = useCallback(
    (key) => {
      userInteractedRef.current = true;

      if (key === 'AC' || key === 'C') {
        if (historyTimerRef.current) {
          clearTimeout(historyTimerRef.current);
          historyTimerRef.current = null;
        }
        const draftIdToClear = activeHistoryIdRef.current;
        activeHistoryIdRef.current = null;
        restoredExprRef.current = '';
        lastSavedKeyRef.current = '';
        setEqualsHighlighted(false);
        setIsCalcStarred(false);
        persistSessionSnapshot('', 'cleared');
        if (draftIdToClear && onDiscardDraft) {
          onDiscardDraft(draftIdToClear);
        }
        dispatch(key);
        return;
      }

      if (key === '=') {
        if (historyTimerRef.current) {
          clearTimeout(historyTimerRef.current);
          historyTimerRef.current = null;
        }
        const current = stateRef.current;
        if (current.expression) {
          const evaluated = evaluateExpression(current.expression);
          if (evaluated.ok) {
            setEqualsHighlighted(true);
            const exprSnapshot = current.expression;
            persistSessionSnapshot('', 'completed');
            // Save completed calculation asynchronously so SQLite never delays UI feedback
            setTimeout(() => {
              saveCalculationNow(exprSnapshot, { finalized: true });
            }, 0);
          } else {
            setEqualsHighlighted(false);
          }
        }
      } else {
        setEqualsHighlighted(false);
        // If user starts a fresh expression after pressing '=', create a new draft record
        if (stateRef.current.justEvaluated) {
          activeHistoryIdRef.current = null;
          lastSavedKeyRef.current = '';
          setIsCalcStarred(false);
        }
        // If user edits a reopened entry, preserve original and save as a new record
        if (restoredExprRef.current) {
          restoredExprRef.current = '';
          setIsCalcStarred(false);
        }
      }
      dispatch(key);
    },
    [saveCalculationNow, persistSessionSnapshot, onDiscardDraft]
  );

  const hapticNumber = useCallback(() => triggerHaptic('number'), [triggerHaptic]);
  const hapticOperator = useCallback(() => triggerHaptic('operator'), [triggerHaptic]);
  const hapticDecimal = useCallback(() => triggerHaptic('decimal'), [triggerHaptic]);
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

  const handleToggleCalculationStar = useCallback(async () => {
    const expr = stateRef.current.expression;
    if (!expr) return;

    triggerHaptic('selection');
    const nextStarred = !isCalcStarred;
    setIsCalcStarred(nextStarred);

    const existingId =
      activeHistoryIdRef.current ||
      (restoredExprRef.current === expr ? restoreHistoryId : null);

    if (existingId && onToggleCalcStar) {
      await onToggleCalcStar(existingId, nextStarred);
      return;
    }

    const saved = await saveCalculationNow(expr, {
      isStarred: nextStarred ? 1 : 0,
    });
    if (saved?.id && onToggleCalcStar) {
      await onToggleCalcStar(saved.id, nextStarred);
    }
  }, [
    isCalcStarred,
    restoreHistoryId,
    onToggleCalcStar,
    saveCalculationNow,
    triggerHaptic,
  ]);

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
    const { height: h, width: w } = e.nativeEvent.layout;
    if (h > 0) {
      setKeypadHeight((prev) => (Math.abs(prev - h) > 1 ? h : prev));
    }
    if (w > 0) {
      setKeypadWidth((prev) => (Math.abs(prev - w) > 1 ? w : prev));
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
    () => Math.round(Math.min(224, Math.max(184, windowHeight * 0.255))),
    [windowHeight]
  );
  // Reserve 44px for vertical padding (20px) + top bar (22px) + 2px spacing
  const innerDisplayHeight = displayCardHeight - 44;
  const expressionRegionHeight = Math.round(innerDisplayHeight * 0.29);
  const resultRegionHeight = Math.round(innerDisplayHeight * 0.49);
  const wordsRegionHeight =
    innerDisplayHeight - expressionRegionHeight - resultRegionHeight;

  // Ensure max font size always leaves >= 32% vertical headroom inside its region
  const maxExpressionFontSize = Math.min(
    22,
    Math.floor(expressionRegionHeight / 1.45)
  );
  const maxResultFontSize = Math.min(46, Math.floor(resultRegionHeight / 1.48));

  const expressionFontMetrics = useMemo(
    () =>
      calculateDynamicFontSize({
        text: formattedExpression || ' ',
        availableWidth: effectiveDisplayWidth,
        maxFontSize: maxExpressionFontSize,
        minFontSize: 13,
      }),
    [formattedExpression, effectiveDisplayWidth, maxExpressionFontSize]
  );

  const resultFontMetrics = useMemo(
    () =>
      calculateDynamicFontSize({
        text: formattedResult,
        availableWidth: effectiveDisplayWidth,
        maxFontSize: maxResultFontSize,
        minFontSize: 16,
      }),
    [formattedResult, effectiveDisplayWidth, maxResultFontSize]
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
    keypadHeight > 0 ? keypadHeight : Math.max(280, windowHeight * 0.56);
  const effectiveKeypadWidth =
    keypadWidth > 0 ? keypadWidth : Math.max(240, windowWidth - 24);
  const colWidth = (effectiveKeypadWidth - GAP * 3) / 4;
  const leftThreeWidth = colWidth * 3 + GAP * 2;
  const rowHeight = Math.max(48, Math.floor((effectiveKeypadHeight - GAP * 4) / 5));
  const tallPlusHeight = rowHeight * 2 + GAP;
  const keyFontSize = Math.min(30, Math.max(20, Math.round(rowHeight * 0.36)));
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

  const isResultHighlighted = equalsHighlighted || state.justEvaluated;
  const resultTextColor = isResultHighlighted
    ? theme.colors.resultHighlight
    : theme.colors.text;

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
            <Pressable
              onPress={handleToggleCalculationStar}
              disabled={!state.expression}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={
                isCalcStarred ? 'Unstar calculation' : 'Star calculation'
              }
              style={[
                styles.miniAction,
                { opacity: state.expression ? 1 : 0.4 },
              ]}
            >
              <Star
                size={15}
                color={isCalcStarred ? '#F59E0B' : theme.colors.textMuted}
                fill={isCalcStarred ? '#F59E0B' : 'transparent'}
              />
              <Text
                style={[
                  theme.typography.small,
                  {
                    color: isCalcStarred ? '#F59E0B' : theme.colors.textMuted,
                    marginLeft: 4,
                  },
                ]}
              >
                {isCalcStarred ? 'Starred' : 'Star'}
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
                  lineHeight: Math.ceil(expressionFontMetrics.fontSize * 1.28),
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
                  color: resultTextColor,
                  fontSize: resultFontMetrics.fontSize,
                  lineHeight: Math.ceil(resultFontMetrics.fontSize * 1.32),
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

        {/* Rows 4 & 5: Left 3 cols (1 2 3 / 0 . =) + Right col tall '+' */}
        <View style={[styles.splitRows, { height: tallPlusHeight }]}>
          <View style={[styles.leftThreeCols, { width: leftThreeWidth }]}>
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
                onPressInHaptic={hapticDecimal}
                onPressKey={pressKey}
              />
              <CalculatorKey
                keyId="="
                label="="
                accessibilityLabel="Equals"
                backgroundColor={eqBg}
                pressedBackgroundColor={eqPressed}
                textColor="#FFFFFF"
                borderRadius={keyRadius}
                fontSize={keyFontSize * 1.15}
                elevation={4}
                onPressInKey={handleEqualsPressIn}
                onPressInHaptic={hapticEquals}
                onPressKey={pressKey}
              />
            </View>
          </View>

          <View style={[styles.rightPlusCol, { width: colWidth }]}>
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
    includeFontPadding: false,
    paddingVertical: 1,
  },
  resultText: {
    width: '100%',
    fontSize: 46,
    fontWeight: '700',
    textAlign: 'right',
    textAlignVertical: 'center',
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
    paddingVertical: 2,
  },
  wordsText: {
    width: '100%',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    textAlign: 'right',
    includeFontPadding: false,
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
    gap: GAP,
  },
  rightPlusCol: {
  },
});
