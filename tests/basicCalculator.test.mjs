import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_CALCULATOR_STATE,
  evaluateExpression,
  evaluateLiveExpression,
  reduceCalculatorState,
} from '../src/utils/calculators/basic.js';

test('basic calculator respects operator precedence', () => {
  assert.equal(evaluateExpression('2 + 3 * 4').value, 14);
  assert.equal(evaluateExpression('(2 + 3) * 4').value, 20);
  assert.equal(evaluateExpression('100 ÷ 4 × 2').value, 50);
});

test('basic calculator handles decimals and percentages cleanly', () => {
  assert.equal(evaluateExpression('0.1 + 0.2').value, 0.3);
  assert.equal(evaluateExpression('50%').value, 0.5);
  assert.equal(evaluateExpression('200 * 15%').value, 30);
});

test('basic calculator handles negative numbers', () => {
  assert.equal(evaluateExpression('-5 + 12').value, 7);
  assert.equal(evaluateExpression('10 * -2').value, -20);
});

test('basic calculator rejects division by zero and invalid expressions', () => {
  const divZero = evaluateExpression('10 / 0');
  assert.equal(divZero.ok, false);
  assert.match(divZero.error, /divide by zero/i);

  assert.equal(evaluateExpression('').ok, false);
  assert.equal(evaluateExpression('5 + ').ok, false);
});

test('basic calculator reducer handles rapid consecutive taps and repeated operators', () => {
  const keys = ['1', '2', '3', '+', '−', '2', '3', '='];
  const state = keys.reduce(reduceCalculatorState, INITIAL_CALCULATOR_STATE);
  assert.equal(state.expression, '123−23');
  assert.equal(state.resultText, '100');
  assert.equal(state.justEvaluated, true);

  // Continuing with an operator after '=' uses previous result
  const continued = ['×', '2', '='].reduce(reduceCalculatorState, state);
  assert.equal(continued.resultText, '200');

  // Typing a new digit after '=' starts a fresh expression
  const fresh = ['5', '+', '5', '='].reduce(reduceCalculatorState, continued);
  assert.equal(fresh.resultText, '10');
});

test('basic calculator reducer handles decimals, +/-, BACK, and AC', () => {
  const dec = ['.', '5', '.', '2', '+', '1', '.', '5', '='].reduce(
    reduceCalculatorState,
    INITIAL_CALCULATOR_STATE
  );
  assert.equal(dec.resultText, '2.02');

  const neg = ['9', '+/-', '+', '1', '0', '='].reduce(
    reduceCalculatorState,
    INITIAL_CALCULATOR_STATE
  );
  assert.equal(neg.resultText, '1');

  const back = ['1', '2', 'BACK'].reduce(reduceCalculatorState, INITIAL_CALCULATOR_STATE);
  assert.equal(back.expression, '1');

  const cleared = reduceCalculatorState(back, 'AC');
  assert.deepEqual(cleared, INITIAL_CALCULATOR_STATE);
});

test('basic calculator updates live result without pressing equals', () => {
  let state = INITIAL_CALCULATOR_STATE;
  for (const k of ['1', '0', '0']) {
    state = reduceCalculatorState(state, k);
  }
  assert.equal(state.resultText, '100');
  assert.equal(state.hasMeaningfulResult, false);

  state = reduceCalculatorState(state, '+');
  assert.equal(state.resultText, '100');
  assert.equal(state.error, '');

  for (const k of ['5', '0']) {
    state = reduceCalculatorState(state, k);
  }
  assert.equal(state.resultText, '150');
  assert.equal(state.hasMeaningfulResult, true);

  for (const k of ['×', '2']) {
    state = reduceCalculatorState(state, k);
  }
  assert.equal(state.resultText, '200');
  assert.equal(evaluateLiveExpression('100+50×2').value, 200);
});
