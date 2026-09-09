import Link from 'next/link';
import styles from './Pagination.module.css';

/**
 * Numbered pages with Previous and Next, all of them full-size targets.
 * Plain links, so they work without JavaScript and can be opened in a tab.
 */
export function Pagination({
  page,
  pageCount,
  basePath,
  label = 'Pages',
}: {
  page: number;
  pageCount: number;
  basePath: string;
  label?: string;
}) {
  if (pageCount <= 1) return null;

  const href = (n: number) => (n === 1 ? basePath : `${basePath}?page=${n}`);
  const numbers = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <nav className={styles.pagination} aria-label={label}>
      {page > 1 ? (
        <Link className={styles.step} href={href(page - 1)} rel="prev">
          ← Previous
        </Link>
      ) : (
        <span className={`${styles.step} ${styles.disabled}`}>← Previous</span>
      )}

      <ol className={styles.numbers}>
        {numbers.map((n) => (
          <li key={n}>
            <Link
              className={`${styles.number} ${n === page ? styles.current : ''}`}
              href={href(n)}
              aria-current={n === page ? 'page' : undefined}
              aria-label={`Page ${n} of ${pageCount}`}
            >
              {n}
            </Link>
          </li>
        ))}
      </ol>

      {page < pageCount ? (
        <Link className={styles.step} href={href(page + 1)} rel="next">
          Next →
        </Link>
      ) : (
        <span className={`${styles.step} ${styles.disabled}`}>Next →</span>
      )}
    </nav>
  );
}
