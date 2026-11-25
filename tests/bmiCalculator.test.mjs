import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBMI } from '../src/utils/calculators/bmi.js';

test('BMI calculator computes metric BMI and category accurately', () => {
  const normal = calculateBMI({ unitSystem: 'metric', weightKg: '70', heightCm: '175' });
  assert.equal(normal.ok, true);
  assert.ok(Math.abs(normal.bmi - 22.86) < 0.05);
  assert.equal(normal.category.label, 'Normal Weight');
  assert.match(normal.disclaimer, /not a medical diagnosis/i);
});

test('BMI calculator computes imperial BMI accurately', () => {
  const imp = calculateBMI({
    unitSystem: 'imperial',
    weightLb: '154',
    heightFt: '5',
    heightIn: '9',
  });
  assert.equal(imp.ok, true);
  assert.ok(Math.abs(imp.bmi - 22.7) < 0.2);
});

test('BMI calculator validates invalid inputs', () => {
  assert.equal(calculateBMI({ unitSystem: 'metric', weightKg: '0', heightCm: '175' }).ok, false);
  assert.equal(calculateBMI({ unitSystem: 'imperial', weightLb: '150', heightFt: '0', heightIn: '0' }).ok, false);
});
