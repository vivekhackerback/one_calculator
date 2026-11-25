import { cleanFloat } from './basic.js';

export const WEIGHT_UNITS = [
  { id: 'mg', label: 'Milligram (mg)', factor: 0.000001 },
  { id: 'g', label: 'Gram (g)', factor: 0.001 },
  { id: 'kg', label: 'Kilogram (kg)', factor: 1 },
  { id: 't', label: 'Metric Ton (t)', factor: 1000 },
  { id: 'oz', label: 'Ounce (oz)', factor: 0.028349523125 },
  { id: 'lb', label: 'Pound (lb)', factor: 0.45359237 },
  { id: 'st', label: 'Stone (st)', factor: 6.35029318 },
];

export function convertWeight(rawValue, fromId, toId) {
  const value = Number(rawValue);
  if (rawValue === '' || !Number.isFinite(value) || value < 0) {
    return { ok: false, error: 'Weight value must be 0 or greater.' };
  }

  const fromUnit = WEIGHT_UNITS.find((u) => u.id === fromId);
  const toUnit = WEIGHT_UNITS.find((u) => u.id === toId);
  if (!fromUnit || !toUnit) {
    return { ok: false, error: 'Please select valid weight units.' };
  }

  const kg = value * fromUnit.factor;
  const converted = cleanFloat(kg / toUnit.factor);

  const breakdown = WEIGHT_UNITS.map((unit) => ({
    id: unit.id,
    label: unit.label,
    value: cleanFloat(kg / unit.factor),
  }));

  return {
    ok: true,
    value: converted,
    fromUnit,
    toUnit,
    breakdown,
  };
}
