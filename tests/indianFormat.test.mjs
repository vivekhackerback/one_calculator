import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatIndianExpression,
  formatIndianNumber,
  numberToIndianWords,
} from '../src/utils/indianFormat.js';

test('formatIndianNumber formats numbers with Indian comma grouping', () => {
  assert.equal(formatIndianNumber(1000), '1,000');
  assert.equal(formatIndianNumber(10000), '10,000');
  assert.equal(formatIndianNumber(100000), '1,00,000');
  assert.equal(formatIndianNumber(1000000), '10,00,000');
  assert.equal(formatIndianNumber(10000000), '1,00,00,000');
  assert.equal(formatIndianNumber('-125500.75'), '-1,25,500.75');
  assert.equal(formatIndianNumber('100000.'), '1,00,000.');
});

test('formatIndianExpression formats numbers inside expressions', () => {
  assert.equal(formatIndianExpression('1250×25'), '1,250 × 25');
  assert.equal(formatIndianExpression('100000+500'), '1,00,000 + 500');
});

test('numberToIndianWords converts numbers to Indian English words offline', () => {
  assert.equal(numberToIndianWords(0), 'Zero');
  assert.equal(numberToIndianWords(150), 'One Hundred Fifty');
  assert.equal(numberToIndianWords(100000), 'One Lakh');
  assert.equal(numberToIndianWords(125500), 'One Lakh Twenty Five Thousand Five Hundred');
  assert.equal(numberToIndianWords(10000000), 'One Crore');
  assert.equal(numberToIndianWords(-250), 'Minus Two Hundred Fifty');
  assert.equal(numberToIndianWords(12.5), 'Twelve Point Five');
  assert.match(numberToIndianWords(1e20), /too large/i);
});
