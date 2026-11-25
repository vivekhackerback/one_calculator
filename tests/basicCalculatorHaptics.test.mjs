import test from 'node:test';
import assert from 'node:assert/strict';
import { getHapticSpec } from '../src/services/hapticTypes.js';
import {
  INITIAL_CALCULATOR_STATE,
  reduceCalculatorState,
} from '../src/utils/calculators/basic.js';
import { lightTheme, darkTheme } from '../src/constants/theme.js';

test('haptic service maps numbers, operators, and decimals to light impact and actions to medium impact', () => {
  for (const action of ['number', 'operator', 'decimal', 'selection']) {
    const spec = getHapticSpec(action);
    assert.equal(spec.intensity, 'light');
    assert.equal(spec.androidType, 'keyboard-tap');
  }

  for (const action of ['delete', 'clear', 'equals']) {
    const spec = getHapticSpec(action);
    assert.equal(spec.intensity, 'medium');
    assert.equal(spec.androidType, 'virtual-key');
  }
});

test('equals highlight state activates on equals and resets on subsequent input', () => {
  let state = ['1', '0', '0', '+', '5', '0'].reduce(
    reduceCalculatorState,
    INITIAL_CALCULATOR_STATE
  );
  assert.equal(state.justEvaluated, false);

  state = reduceCalculatorState(state, '=');
  assert.equal(state.resultText, '150');
  assert.equal(state.justEvaluated, true);

  // Pressing another operator resets highlight
  const afterOp = reduceCalculatorState(state, '+');
  assert.equal(afterOp.justEvaluated, false);

  // Pressing equals again highlights again
  const afterSecondEq = ['2', '5', '='].reduce(reduceCalculatorState, afterOp);
  assert.equal(afterSecondEq.resultText, '175');
  assert.equal(afterSecondEq.justEvaluated, true);

  // Pressing a new number resets highlight
  const afterDigit = reduceCalculatorState(afterSecondEq, '9');
  assert.equal(afterDigit.justEvaluated, false);

  // Pressing backspace or AC resets highlight
  const afterBack = reduceCalculatorState(afterSecondEq, 'BACK');
  assert.equal(afterBack.justEvaluated, false);
  const afterClear = reduceCalculatorState(afterSecondEq, 'AC');
  assert.equal(afterClear.justEvaluated, false);
});

test('light and dark themes define distinct resultHighlight colors', () => {
  assert.equal(lightTheme.colors.resultHighlight, '#2563EB');
  assert.equal(darkTheme.colors.resultHighlight, '#60A5FA');
});
