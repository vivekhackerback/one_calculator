import { countWeekdays, diffDatesYMD, parseISODate } from './dateUtils.js';

export function calculateDateDifference(startStr, endStr) {
  const start = parseISODate(startStr);
  if (!start) {
    return { ok: false, error: 'Enter a valid Start Date (YYYY-MM-DD).' };
  }

  const end = parseISODate(endStr);
  if (!end) {
    return { ok: false, error: 'Enter a valid End Date (YYYY-MM-DD).' };
  }

  const isReversed = start.getTime() > end.getTime();
  const earlier = isReversed ? end : start;
  const later = isReversed ? start : end;

  const { years, months, days, totalDays } = diffDatesYMD(earlier, later);
  const totalWeeks = Math.floor(totalDays / 7);
  const remainingDays = totalDays % 7;
  const weekdays = countWeekdays(earlier, later);

  return {
    ok: true,
    years,
    months,
    days,
    totalDays,
    totalWeeks,
    remainingDays,
    weekdays,
    isReversed,
  };
}
