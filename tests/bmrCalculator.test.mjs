import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBMR } from '../src/utils/calculators/bmr.js';

test('BMR calculator computes Mifflin-St Jeor for male and female', () => {
  // Male: 10*70 + 6.25*175 - 5*25 + 5 = 700 + 1093.75 - 125 + 5 = 1673.75 -> 1674
  const male = calculateBMR({
    gender: 'male',
    age: '25',
    unitSystem: 'metric',
    weightKg: '70',
    heightCm: '175',
  });
  assert.equal(male.ok, true);
  assert.equal(male.bmr, 1674);
  assert.equal(male.activityBreakdown.length, 5);
  assert.match(male.disclaimer, /not a medical diagnosis/i);

  // Female: 10*60 + 6.25*165 - 5*30 - 161 = 600 + 1031.25 - 150 - 161 = 1320.25 -> 1320
  const female = calculateBMR({
    gender: 'female',
    age: '30',
    unitSystem: 'metric',
    weightKg: '60',
    heightCm: '165',
  });
  assert.equal(female.ok, true);
  assert.equal(female.bmr, 1320);
});

test('BMR calculator validates invalid age and measurements', () => {
  assert.equal(calculateBMR({ age: '0', weightKg: '70', heightCm: '175' }).ok, false);
  assert.equal(calculateBMR({ age: '25', weightKg: '-10', heightCm: '175' }).ok, false);
});
