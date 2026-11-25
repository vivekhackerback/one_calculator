import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateExpression } from '../src/utils/calculators/basic.js';

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
