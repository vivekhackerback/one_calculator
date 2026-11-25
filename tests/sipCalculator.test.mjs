import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSIP } from '../src/utils/calculators/sip.js';

test('SIP calculator computes maturity value accurately', () => {
  // 5000/mo at 12% p.a. for 10 years (120 months) => invested 600,000, FV ~ 1,161,695.38
  const res = calculateSIP('5000', '12', '10');
  assert.equal(res.ok, true);
  assert.equal(res.investedAmount, 600000);
  assert.ok(Math.abs(res.totalValue - 1161695.38) < 1);
  assert.ok(res.estimatedReturns > 560000);
});

test('SIP calculator handles 0% return', () => {
  const res = calculateSIP('1000', '0', '2');
  assert.equal(res.ok, true);
  assert.equal(res.investedAmount, 24000);
  assert.equal(res.estimatedReturns, 0);
  assert.equal(res.totalValue, 24000);
});

test('SIP calculator validates invalid inputs', () => {
  assert.equal(calculateSIP('0', '12', '5').ok, false);
  assert.equal(calculateSIP('5000', '-2', '5').ok, false);
  assert.equal(calculateSIP('5000', '12', '0').ok, false);
});
