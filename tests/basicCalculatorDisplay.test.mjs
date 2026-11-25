import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDynamicFontSize,
  tokenizeExpressionForDisplay,
} from '../src/utils/calculators/displaySize.js';

test('calculateDynamicFontSize uses maxFontSize for short numbers and shrinks for long numbers', () => {
  const width = 320;
  const shortNum = calculateDynamicFontSize({ text: '1,250', availableWidth: width });
  const medNum = calculateDynamicFontSize({ text: '12,50,000', availableWidth: width });
  const longNum = calculateDynamicFontSize({ text: '12,34,56,789', availableWidth: width });
  const veryLongNum = calculateDynamicFontSize({
    text: '12,34,56,78,90,123',
    availableWidth: width,
  });

  assert.equal(shortNum.fontSize, 48);
  assert.equal(shortNum.overflowsSingleLine, false);
  assert.ok(medNum.fontSize <= shortNum.fontSize);
  assert.ok(longNum.fontSize < medNum.fontSize);
  assert.ok(veryLongNum.fontSize < longNum.fontSize);
  assert.ok(veryLongNum.fontSize >= 18);
});

test('calculateDynamicFontSize restores larger font size when digits are deleted', () => {
  const width = 300;
  const longSize = calculateDynamicFontSize({
    text: '12,34,56,78,90,123',
    availableWidth: width,
  });
  const shortenedSize = calculateDynamicFontSize({
    text: '12,34,567',
    availableWidth: width,
  });
  assert.ok(shortenedSize.fontSize > longSize.fontSize);
});

test('calculateDynamicFontSize clamps to minFontSize and flags overflow for extreme lengths', () => {
  const extreme = calculateDynamicFontSize({
    text: '1,23,45,67,89,01,23,45,67,89,01,234',
    availableWidth: 260,
    maxFontSize: 48,
    minFontSize: 18,
  });
  assert.equal(extreme.fontSize, 18);
  assert.equal(extreme.overflowsSingleLine, true);
});

test('tokenizeExpressionForDisplay highlights each arithmetic operator', () => {
  const segments = tokenizeExpressionForDisplay('100 + 50 − 20 × 3 ÷ 2');
  const ops = segments.filter((s) => s.operator !== null).map((s) => s.operator);
  assert.deepEqual(ops, ['+', '−', '×', '÷']);
  assert.equal(segments.map((s) => s.text).join(''), '100 + 50 − 20 × 3 ÷ 2');
});
