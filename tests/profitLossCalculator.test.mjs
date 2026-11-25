import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateProfitLoss } from '../src/utils/calculators/profitLoss.js';

test('profit and loss calculates profit accurately', () => {
  const res = calculateProfitLoss('500', '650');
  assert.equal(res.ok, true);
  assert.equal(res.status, 'Profit');
  assert.equal(res.amount, 150);
  assert.equal(res.percentage, 30);
});

test('profit and loss calculates loss and break-even accurately', () => {
  const loss = calculateProfitLoss('200', '150');
  assert.equal(loss.ok, true);
  assert.equal(loss.status, 'Loss');
  assert.equal(loss.amount, 50);
  assert.equal(loss.percentage, 25);

  const even = calculateProfitLoss('100', '100');
  assert.equal(even.ok, true);
  assert.equal(even.status, 'Break-Even');
  assert.equal(even.amount, 0);
});

test('profit and loss guards cost price <= 0', () => {
  assert.equal(calculateProfitLoss('0', '100').ok, false);
  assert.equal(calculateProfitLoss('-10', '100').ok, false);
});
