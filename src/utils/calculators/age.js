import { diffDatesYMD, formatISODate, parseISODate } from './dateUtils.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function calculateAge(dobStr, targetStr = formatISODate()) {
  const dob = parseISODate(dobStr);
  if (!dob) {
    return { ok: false, error: 'Enter a valid Date of Birth (YYYY-MM-DD).' };
  }

  const target = parseISODate(targetStr);
  if (!target) {
    return { ok: false, error: 'Enter a valid Target Date (YYYY-MM-DD).' };
  }

  if (dob.getTime() > target.getTime()) {
    return { ok: false, error: 'Date of Birth cannot be after the Target Date.' };
  }

  const { years, months, days, totalDays } = diffDatesYMD(dob, target);
  const totalMonths = years * 12 + months;
  const totalWeeks = Math.floor(totalDays / 7);

  // Next birthday calculation
  const birthMonth = dob.getUTCMonth();
  const birthDay = dob.getUTCDate();
  let nextBdayYear = target.getUTCFullYear();

  const makeBday = (y) => {
    // Handle Feb 29 on non-leap years as Feb 28
    const candidate = new Date(Date.UTC(y, birthMonth, birthDay));
    if (birthMonth === 1 && birthDay === 29 && candidate.getUTCMonth() !== 1) {
      return new Date(Date.UTC(y, 1, 28));
    }
    return candidate;
  };

  let nextBirthday = makeBday(nextBdayYear);
  const isBirthdayToday =
    nextBirthday.getUTCMonth() === target.getUTCMonth() &&
    nextBirthday.getUTCDate() === target.getUTCDate();

  if (nextBirthday.getTime() <= target.getTime()) {
    nextBdayYear += 1;
    nextBirthday = makeBday(nextBdayYear);
  }

  const daysUntilNextBirthday = Math.round(
    (nextBirthday.getTime() - target.getTime()) / MS_PER_DAY
  );

  return {
    ok: true,
    years,
    months,
    days,
    totalMonths,
    totalWeeks,
    totalDays,
    daysUntilNextBirthday,
    isBirthdayToday,
  };
}
