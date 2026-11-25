const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Parse a YYYY-MM-DD string into a UTC Date at midnight, validating calendar accuracy.
 */
export function parseISODate(dateStr) {
  if (typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function formatISODate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function diffDatesYMD(startDate, endDate) {
  let years = endDate.getUTCFullYear() - startDate.getUTCFullYear();
  let months = endDate.getUTCMonth() - startDate.getUTCMonth();
  let days = endDate.getUTCDate() - startDate.getUTCDate();

  if (days < 0) {
    const prevMonthLastDay = new Date(
      Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), 0)
    ).getUTCDate();
    months -= 1;
    days += prevMonthLastDay;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / MS_PER_DAY);
  return { years, months, days, totalDays };
}

export function countWeekdays(startDate, endDate) {
  let count = 0;
  const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / MS_PER_DAY);
  const startDay = startDate.getUTCDay();
  const fullWeeks = Math.floor((totalDays + 1) / 7);
  count += fullWeeks * 5;
  const remainder = (totalDays + 1) % 7;
  for (let i = 0; i < remainder; i += 1) {
    const dayOfWeek = (startDay + i) % 7;
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count += 1;
    }
  }
  return count;
}
