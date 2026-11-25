import { HEALTH_DISCLAIMER } from './bmi.js';

const ACTIVITY_LEVELS = [
  { label: 'Sedentary (little/no exercise)', factor: 1.2 },
  { label: 'Lightly Active (1–3 days/wk)', factor: 1.375 },
  { label: 'Moderately Active (3–5 days/wk)', factor: 1.55 },
  { label: 'Very Active (6–7 days/wk)', factor: 1.725 },
  { label: 'Extra Active (intense daily)', factor: 1.9 },
];

export function calculateBMR({
  gender = 'male',
  age,
  unitSystem = 'metric',
  weightKg,
  heightCm,
  weightLb,
  heightFt,
  heightIn = '0',
}) {
  const ageNum = Number(age);
  if (!Number.isFinite(ageNum) || ageNum < 1 || ageNum > 120) {
    return { ok: false, error: 'Age must be between 1 and 120 years.' };
  }

  let kg;
  let cm;

  if (unitSystem === 'metric') {
    kg = Number(weightKg);
    cm = Number(heightCm);
    if (!Number.isFinite(kg) || kg <= 0) {
      return { ok: false, error: 'Weight (kg) must be greater than 0.' };
    }
    if (!Number.isFinite(cm) || cm <= 0) {
      return { ok: false, error: 'Height (cm) must be greater than 0.' };
    }
  } else if (unitSystem === 'imperial') {
    const lb = Number(weightLb);
    const ft = Number(heightFt);
    const inches = heightIn === '' ? 0 : Number(heightIn);
    if (!Number.isFinite(lb) || lb <= 0) {
      return { ok: false, error: 'Weight (lb) must be greater than 0.' };
    }
    if (!Number.isFinite(ft) || ft < 0 || !Number.isFinite(inches) || inches < 0) {
      return { ok: false, error: 'Enter valid feet and inches.' };
    }
    const totalInches = ft * 12 + inches;
    if (totalInches <= 0) {
      return { ok: false, error: 'Height must be greater than 0.' };
    }
    kg = lb * 0.45359237;
    cm = totalInches * 2.54;
  } else {
    return { ok: false, error: 'Unsupported unit system.' };
  }

  // Mifflin-St Jeor Equation
  const base = 10 * kg + 6.25 * cm - 5 * ageNum;
  const bmr = gender === 'female' ? base - 161 : base + 5;

  const activityBreakdown = ACTIVITY_LEVELS.map((lvl) => ({
    label: lvl.label,
    calories: Math.round(bmr * lvl.factor),
  }));

  return {
    ok: true,
    bmr: Math.round(bmr),
    activityBreakdown,
    disclaimer: HEALTH_DISCLAIMER,
  };
}
