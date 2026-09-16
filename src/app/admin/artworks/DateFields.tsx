import { MONTH_OPTIONS, splitPartialDate } from '@/lib/format';
import styles from '../admin.module.css';
import own from './new/artwork-form.module.css';

/**
 * Year, month and day as three separate boxes rather than one date picker: a
 * date picker insists on all three, and for most pieces only the year is
 * known. The month and day are optional and the server puts the parts back
 * together — see `parsePartialDate`.
 */
export function DateFields({
  prefix,
  defaultValue,
  values,
}: {
  prefix: string;
  /** The stored date, when editing. */
  defaultValue?: string | null;
  /** What was typed last time, handed back with an error. Wins over `defaultValue`. */
  values?: Record<string, string>;
}) {
  const id = (part: string) => `${prefix}-${part}`;
  const parts =
    values && id('year') in values
      ? { year: values[id('year')], month: values[id('month')] ?? '', day: values[id('day')] ?? '' }
      : splitPartialDate(defaultValue);

  return (
    <fieldset className={own.dateFields}>
      <legend className={own.small}>When was it made?</legend>
      <span className={styles.hint}>
        This year is filled in for you — change it for older work. The month and day are
        optional. Leave all three empty and the piece goes under &ldquo;Earlier work&rdquo;.
      </span>
      <div className={own.dateRow}>
        <div>
          <label className={own.tiny} htmlFor={id('year')}>
            Year
          </label>
          <input
            className={styles.input}
            id={id('year')}
            name={id('year')}
            type="text"
            inputMode="numeric"
            maxLength={4}
            defaultValue={parts.year}
          />
        </div>
        <div>
          <label className={own.tiny} htmlFor={id('month')}>
            Month
          </label>
          <select
            className={styles.select}
            id={id('month')}
            name={id('month')}
            defaultValue={parts.month}
          >
            <option value="">—</option>
            {MONTH_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={own.tiny} htmlFor={id('day')}>
            Day
          </label>
          <input
            className={styles.input}
            id={id('day')}
            name={id('day')}
            type="text"
            inputMode="numeric"
            maxLength={2}
            defaultValue={parts.day}
          />
        </div>
      </div>
    </fieldset>
  );
}
