import { cleanFloat } from './basic.js';

export const LENGTH_UNITS = [
  { id: 'mm', label: 'Millimeter (mm)', factor: 0.001 },
  { id: 'cm', label: 'Centimeter (cm)', factor: 0.01 },
  { id: 'm', label: 'Meter (m)', factor: 1 },
  { id: 'km', label: 'Kilometer (km)', factor: 1000 },
  { id: 'in', label: 'Inch (in)', factor: 0.0254 },
  { id: 'ft', label: 'Foot (ft)', factor: 0.3048 },
  { id: 'yd', label: 'Yard (yd)', factor: 0.9144 },
  { id: 'mi', label: 'Mile (mi)', factor: 1609.344 },
];

export function convertLength(rawValue, fromId, toId) {
  const value = Number(rawValue);
  if (rawValue === '' || !Number.isFinite(value) || value < 0) {
    return { ok: false, error: 'Length value must be 0 or greater.' };
  }

  const fromUnit = LENGTH_UNITS.find((u) => u.id === fromId);
  const toUnit = LENGTH_UNITS.find((u) => u.id === toId);
  if (!fromUnit || !toUnit) {
    return { ok: false, error: 'Please select valid length units.' };
  }

  const meters = value * fromUnit.factor;
  const converted = cleanFloat(meters / toUnit.factor);

  const breakdown = LENGTH_UNITS.map((unit) => ({
    id: unit.id,
    label: unit.label,
    value: cleanFloat(meters / unit.factor),
  }));

  return {
    ok: true,
    value: converted,
    fromUnit,
    toUnit,
    breakdown,
  };
}
