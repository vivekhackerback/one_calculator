import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CALCULATORS,
  CATEGORIES,
  getCalculatorById,
  filterCalculators,
} from '../src/constants/calculators.js';

test('registry contains exactly 15 unique calculators', () => {
  assert.equal(CALCULATORS.length, 15);
  const ids = new Set(CALCULATORS.map((c) => c.id));
  assert.equal(ids.size, 15);
});

test('all calculators belong to valid non-all categories', () => {
  const validCategories = new Set(CATEGORIES.filter((c) => c.id !== 'all').map((c) => c.id));
  for (const calc of CALCULATORS) {
    assert.ok(validCategories.has(calc.category), `Invalid category for ${calc.id}`);
    assert.ok(calc.name.length > 0);
    assert.ok(calc.description.length > 0);
    assert.ok(calc.icon.length > 0);
  }
});

test('getCalculatorById and filterCalculators work accurately', () => {
  assert.equal(getCalculatorById('emi')?.name, 'EMI Calculator');
  assert.equal(getCalculatorById('unknown'), null);
  assert.equal(filterCalculators({ category: 'everyday' }).length, 4);
  assert.equal(filterCalculators({ category: 'financial' }).length, 4);
  assert.equal(filterCalculators({ category: 'business' }).length, 2);
  assert.equal(filterCalculators({ category: 'conversion' }).length, 3);
  assert.equal(filterCalculators({ category: 'health' }).length, 2);
  assert.ok(filterCalculators({ query: 'gst' }).some((c) => c.id === 'gst'));
});
