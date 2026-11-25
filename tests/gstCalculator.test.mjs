import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateGST } from '../src/utils/calculators/gst.js';

test('GST exclusive adds tax and splits CGST/SGST equally', () => {
  const res = calculateGST('1000', '18', 'exclusive');
  assert.equal(res.ok, true);
  assert.equal(res.baseAmount, 1000);
  assert.equal(res.gstAmount, 180);
  assert.equal(res.cgst, 90);
  assert.equal(res.sgst, 90);
  assert.equal(res.totalAmount, 1180);
});

test('GST inclusive extracts base amount and tax accurately', () => {
  const res = calculateGST('1180', '18', 'inclusive');
  assert.equal(res.ok, true);
  assert.ok(Math.abs(res.baseAmount - 1000) < 0.001);
  assert.ok(Math.abs(res.gstAmount - 180) < 0.001);
});

test('GST validates negative amount and out-of-range rate', () => {
  assert.equal(calculateGST('-100', '18', 'exclusive').ok, false);
  assert.equal(calculateGST('100', '120', 'exclusive').ok, false);
});
