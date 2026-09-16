const NZ_DATE = new Intl.DateTimeFormat('en-NZ', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const NZ_DAY_MONTH = new Intl.DateTimeFormat('en-NZ', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

const parse = (iso: string) => new Date(`${iso}T00:00:00Z`);

/**
 * Human date range. Written out in full — "16 October 2020", not "16/10/20" —
 * because abbreviated and ambiguous numeric dates are exactly the kind of thing
 * that trips people up.
 */
export function formatDateRange(startsOn: string | null, endsOn: string | null): string {
  if (!startsOn) return '';
  const start = parse(startsOn);
  if (!endsOn || endsOn === startsOn) return NZ_DATE.format(start);

  const end = parse(endsOn);
  const sameMonth =
    start.getUTCFullYear() === end.getUTCFullYear() &&
    start.getUTCMonth() === end.getUTCMonth();

  return sameMonth
    ? `${start.getUTCDate()}–${NZ_DATE.format(end)}`
    : `${NZ_DAY_MONTH.format(start)} – ${NZ_DATE.format(end)}`;
}

/* -- partial dates ---------------------------------------------------------
   A gallery piece is dated with whatever is known: a year, a year and month,
   or a full date. Stored as 'yyyy', 'yyyy-mm' or 'yyyy-mm-dd'.            */

export type PartialDateParts = { year: string; month: string; day: string };

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const MONTH_OPTIONS = MONTHS.map((label, i) => ({
  value: String(i + 1).padStart(2, '0'),
  label,
}));

/**
 * Turn the three boxes on the form into one stored value, or say what is
 * wrong with them in words the committee can act on.
 */
export function parsePartialDate(
  parts: PartialDateParts,
): { ok: true; value: string | null } | { ok: false; error: string } {
  const year = parts.year.trim();
  const month = parts.month.trim();
  const day = parts.day.trim();

  if (!year && !month && !day) return { ok: true, value: null };
  if (!year) return { ok: false, error: 'Please add the year as well.' };
  if (!/^\d{4}$/.test(year) || Number(year) < 1900 || Number(year) > 2100) {
    return { ok: false, error: 'The year should be four digits, like 2025.' };
  }

  if (!month) {
    if (day) return { ok: false, error: 'Please choose the month as well as the day.' };
    return { ok: true, value: year };
  }
  const m = Number(month);
  if (!Number.isInteger(m) || m < 1 || m > 12) {
    return { ok: false, error: 'Please choose a month from the list.' };
  }
  const mm = String(m).padStart(2, '0');
  if (!day) return { ok: true, value: `${year}-${mm}` };

  const d = Number(day);
  const daysInMonth = new Date(Date.UTC(Number(year), m, 0)).getUTCDate();
  if (!Number.isInteger(d) || d < 1 || d > daysInMonth) {
    return { ok: false, error: `${MONTHS[m - 1]} ${year} does not have a day ${day || '—'}.` };
  }
  return { ok: true, value: `${year}-${mm}-${String(d).padStart(2, '0')}` };
}

/** The stored value back into the three boxes, for editing. */
export function splitPartialDate(value: string | null | undefined): PartialDateParts {
  const [year = '', month = '', day = ''] = (value ?? '').split('-');
  return { year, month, day: day ? String(Number(day)) : '' };
}

/** "2025", "March 2025" or "14 March 2025". */
export function formatPartialDate(value: string | null | undefined): string {
  if (!value) return '';
  const { year, month, day } = splitPartialDate(value);
  const name = month ? MONTHS[Number(month) - 1] : '';
  if (!name) return year;
  return day ? `${day} ${name} ${year}` : `${name} ${year}`;
}

/** Today in NZ, as yyyy-mm-dd, for deciding what is still upcoming. */
export function todayInNZ(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Pacific/Auckland',
  }).format(new Date());
}

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize('NFKD')
      // Drop combining marks so te reo Māori macrons survive as plain letters:
      // "Ngāti" becomes "ngati", not "nga-ti".
      .replace(/\p{M}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 70) || 'untitled'
  );
}
