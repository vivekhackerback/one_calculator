import { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Check, Copy, Delete, Share2 } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { evaluateExpression } from '../../../utils/calculators/basic';
import { CalculatorLayout } from '../CalculatorLayout';

const KEYPAD_ROWS = [
  ['C', 'BACK', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['+/-', '0', '.', '='],
];

const OPERATORS = new Set(['+', '−', '×', '÷']);

export function BasicCalculatorScreen({
  calculator,
  isFavorite = false,
  onToggleFavorite = null,
  onRecordHistory = null,
}) {
  const { theme } = useTheme();
  const [expression, setExpression] = useState('');
  const [resultText, setResultText] = useState('0');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handlePress = (key) => {
    setError('');

    if (key === 'C') {
      setExpression('');
      setResultText('0');
      return;
    }

    if (key === 'BACK') {
      const next = expression.slice(0, -1);
      setExpression(next);
      if (!next) {
        setResultText('0');
      }
      return;
    }

    if (key === '=') {
      if (!expression) return;
      const evaluated = evaluateExpression(expression);
      if (!evaluated.ok) {
        setError(evaluated.error);
        return;
      }
      setResultText(evaluated.formatted);
      if (onRecordHistory) {
        onRecordHistory({
          calculatorId: calculator.id,
          calculatorName: calculator.name,
          inputSummary: expression,
          resultSummary: evaluated.formatted,
        });
      }
      return;
    }

    if (key === '+/-') {
      if (!expression) {
        setExpression('-');
        return;
      }
      // Toggle sign of trailing number
      const match = expression.match(/(.*?)(-?\d*\.?\d+)$/);
      if (match) {
        const [, prefix, num] = match;
        const toggled = num.startsWith('-') ? num.slice(1) : `-${num}`;
        setExpression(`${prefix}${toggled}`);
      }
      return;
    }

    if (OPERATORS.has(key)) {
      if (!expression) {
        if (resultText !== '0') {
          setExpression(`${resultText}${key}`);
        }
        return;
      }
      const lastChar = expression.slice(-1);
      if (OPERATORS.has(lastChar)) {
        setExpression(`${expression.slice(0, -1)}${key}`);
        return;
      }
      setExpression(`${expression}${key}`);
      return;
    }

    if (key === '.') {
      const lastToken = expression.split(/[+\−×÷]/).pop() || '';
      if (lastToken.includes('.')) return;
      const prefix = lastToken === '' ? '0.' : '.';
      setExpression(`${expression}${prefix}`);
      return;
    }

    setExpression(`${expression}${key}`);
  };

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(resultText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore
    }
  };

  const handleShare = async () => {
    try {
      const msg = expression
        ? `${expression} = ${resultText}`
        : `Result: ${resultText}`;
      await Share.share({ message: `${msg}\n\nCalculated with One Calculator` });
    } catch {
      // Ignore
    }
  };

  return (
    <CalculatorLayout
      title={calculator.name}
      description={calculator.description}
      error={error}
      isFavorite={isFavorite}
      onToggleFavorite={onToggleFavorite}
      hideActions
    >
      {/* Display */}
      <View
        style={[
          styles.displayBox,
          {
            backgroundColor: theme.colors.surfaceSecondary,
            borderRadius: theme.radii.md,
          },
        ]}
      >
        <Text
          numberOfLines={2}
          selectable
          style={[
            theme.typography.h3,
            { color: theme.colors.textSecondary, textAlign: 'right', minHeight: 24 },
          ]}
        >
          {expression || ' '}
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          selectable
          style={[
            styles.resultText,
            { color: theme.colors.text },
          ]}
        >
          {resultText}
        </Text>
        <View style={styles.displayActions}>
          <Pressable onPress={handleCopy} style={styles.miniAction}>
            {copied ? (
              <Check size={15} color={theme.colors.success} />
            ) : (
              <Copy size={15} color={theme.colors.textMuted} />
            )}
            <Text style={[theme.typography.small, { color: theme.colors.textMuted, marginLeft: 4 }]}>
              {copied ? 'Copied' : 'Copy'}
            </Text>
          </Pressable>
          <Pressable onPress={handleShare} style={styles.miniAction}>
            <Share2 size={15} color={theme.colors.textMuted} />
            <Text style={[theme.typography.small, { color: theme.colors.textMuted, marginLeft: 4 }]}>
              Share
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Keypad */}
      <View style={styles.keypad}>
        {KEYPAD_ROWS.map((row, rIdx) => (
          <View key={rIdx} style={styles.keyRow}>
            {row.map((key) => {
              const isEquals = key === '=';
              const isOp = OPERATORS.has(key) || key === '%';
              const isClear = key === 'C';

              let bg = theme.colors.keypadBg;
              let fg = theme.colors.text;

              if (isEquals) {
                bg = theme.colors.primary;
                fg = '#FFFFFF';
              } else if (isOp) {
                bg = theme.colors.keypadOperatorBg;
                fg = theme.colors.primary;
              } else if (isClear) {
                bg = theme.colors.dangerSoft;
                fg = theme.colors.danger;
              }

              return (
                <Pressable
                  key={key}
                  onPress={() => handlePress(key)}
                  style={({ pressed }) => [
                    styles.keyBtn,
                    {
                      backgroundColor: bg,
                      borderRadius: theme.radii.md,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  {key === 'BACK' ? (
                    <Delete size={20} color={fg} />
                  ) : (
                    <Text style={[styles.keyText, { color: fg }]}>{key}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </CalculatorLayout>
  );
}

const styles = StyleSheet.create({
  displayBox: {
    padding: 16,
    marginBottom: 16,
  },
  resultText: {
    fontSize: 38,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 6,
  },
  displayActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 10,
  },
  miniAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  keypad: {
    gap: 10,
  },
  keyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  keyBtn: {
    flex: 1,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 20,
    fontWeight: '600',
  },
});
