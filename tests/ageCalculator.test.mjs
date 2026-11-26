import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAge } from '../src/utils/calculators/age.js';

test('age calculator computes exact years, months, days', () => {
  const res = calculateAge('2000-01-15', '2026-11-25');
  assert.equal(res.ok, true);
  assert.equal(res.years, 26);
  assert.equal(res.months, 10);
  assert.equal(res.days, 10);
  assert.equal(res.totalMonths, 322);
});

test('age calculator handles birthday today and leap day DOB', () => {
  const todayBday = calculateAge('1995-11-25', '2026-11-25');
  assert.equal(todayBday.ok, true);
  assert.equal(todayBday.years, 31);
  assert.equal(todayBday.isBirthdayToday, true);

  const leapBday = calculateAge('2000-02-29', '2025-02-28');
  assert.equal(leapBday.ok, true);
  assert.equal(leapBday.years, 24);
});

test('age calculator rejects invalid dates and future DOB', () => {
  assert.equal(calculateAge('2000-02-30', '2026-11-25').ok, false);
  assert.equal(calculateAge('2030-01-01', '2026-11-25').ok, false);
  assert.equal(calculateAge('not-a-date', '2026-11-25').ok, false);
});

test('age calculator supports DD-MM-YYYY and DD MM YYYY formats', () => {
  const res = calculateAge('15-01-2000', '25 11 2026');
  assert.equal(res.ok, true);
  assert.equal(res.years, 26);
  assert.equal(res.months, 10);
  assert.equal(res.days, 10);
});
