import { cleanFloat } from './basic.js';

export const TEMPERATURE_UNITS = [
  { id: '°C', label: 'Celsius (°C)' },
  { id: '°F', label: 'Fahrenheit (°F)' },
  { id: 'K', label: 'Kelvin (K)' },
];

export function convertTemperature(rawValue, fromId, toId) {
  const value = Number(rawValue);
  if (rawValue === '' || !Number.isFinite(value)) {
    return { ok: false, error: 'Please enter a valid temperature.' };
  }

  const fromUnit = TEMPERATURE_UNITS.find((u) => u.id === fromId);
  const toUnit = TEMPERATURE_UNITS.find((u) => u.id === toId);
  if (!fromUnit || !toUnit) {
    return { ok: false, error: 'Please select valid temperature units.' };
  }

  let celsius;
  if (fromId === '°C') celsius = value;
  else if (fromId === '°F') celsius = ((value - 32) * 5) / 9;
  else celsius = value - 273.15;

  if (celsius < -273.15 - 1e-9) {
    return {
      ok: false,
      error: 'Temperature cannot be below absolute zero (-273.15°C / -459.67°F / 0K).',
    };
  }

  const toFahrenheit = cleanFloat((celsius * 9) / 5 + 32);
  const toKelvin = cleanFloat(celsius + 273.15);
  const toCelsius = cleanFloat(celsius);

  const map = {
    '°C': toCelsius,
    '°F': toFahrenheit,
    K: toKelvin,
  };

  return {
    ok: true,
    value: map[toId],
    fromUnit,
    toUnit,
    breakdown: TEMPERATURE_UNITS.map((u) => ({
      id: u.id,
      label: u.label,
      value: map[u.id],
    })),
  };
}
