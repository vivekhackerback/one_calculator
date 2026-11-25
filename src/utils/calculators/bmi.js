export const HEALTH_DISCLAIMER =
  'Results are estimates for informational purposes only and not a medical diagnosis.';

export function getBMICategory(bmi) {
  if (bmi < 18.5) return { label: 'Underweight', tone: 'warning' };
  if (bmi < 25) return { label: 'Normal Weight', tone: 'success' };
  if (bmi < 30) return { label: 'Overweight', tone: 'warning' };
  return { label: 'Obese', tone: 'danger' };
}

export function calculateBMI({
  unitSystem = 'metric',
  weightKg,
  heightCm,
  weightLb,
  heightFt,
  heightIn = '0',
}) {
  let kg;
  let heightMeters;

  if (unitSystem === 'metric') {
    kg = Number(weightKg);
    const cm = Number(heightCm);
    if (!Number.isFinite(kg) || kg <= 0) {
      return { ok: false, error: 'Weight (kg) must be greater than 0.' };
    }
    if (!Number.isFinite(cm) || cm <= 0) {
      return { ok: false, error: 'Height (cm) must be greater than 0.' };
    }
    heightMeters = cm / 100;
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
    heightMeters = totalInches * 0.0254;
  } else {
    return { ok: false, error: 'Unsupported unit system.' };
  }

  const bmi = kg / (heightMeters * heightMeters);
  const category = getBMICategory(bmi);

  const minHealthyKg = 18.5 * heightMeters * heightMeters;
  const maxHealthyKg = 24.9 * heightMeters * heightMeters;
  const minHealthyDisplay = unitSystem === 'metric' ? minHealthyKg : minHealthyKg / 0.45359237;
  const maxHealthyDisplay = unitSystem === 'metric' ? maxHealthyKg : maxHealthyKg / 0.45359237;
  const weightUnit = unitSystem === 'metric' ? 'kg' : 'lb';

  return {
    ok: true,
    bmi,
    category,
    minHealthy: minHealthyDisplay,
    maxHealthy: maxHealthyDisplay,
    weightUnit,
    disclaimer: HEALTH_DISCLAIMER,
  };
}
