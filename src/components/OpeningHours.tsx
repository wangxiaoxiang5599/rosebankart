import { site } from '@/lib/site';
import { formatHours } from '@/lib/format';
import styles from './OpeningHours.module.css';

/**
 * The days and times the art house is open, one row each. Colour comes from
 * the surrounding text, so it sits on the cream pages and in the dark footer.
 */
export function OpeningHours({ className }: { className?: string }) {
  return (
    <dl className={className ? `${styles.hours} ${className}` : styles.hours}>
      {site.hours.map(({ day, opens, closes }) => (
        <div key={day} className={styles.row}>
          <dt>{day}</dt>
          <dd>{formatHours(opens, closes)}</dd>
        </div>
      ))}
    </dl>
  );
}
