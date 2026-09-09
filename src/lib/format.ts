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
