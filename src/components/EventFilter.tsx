import Link from 'next/link';
import { EVENT_KINDS, type EventKind } from '@/lib/site';
import styles from './EventFilter.module.css';

/**
 * Three plain links, styled as tabs. Written as words rather than icons, and
 * large enough to hit comfortably.
 */
export function EventFilter({ active }: { active?: EventKind }) {
  const tabs: { href: string; label: string; on: boolean }[] = [
    { href: '/events', label: 'All', on: !active },
    ...Object.entries(EVENT_KINDS).map(([key, meta]) => ({
      href: `/events?kind=${key}`,
      label: meta.plural,
      on: active === key,
    })),
  ];

  return (
    <nav className={styles.filter} aria-label="Filter events">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`${styles.tab} ${tab.on ? styles.active : ''}`}
          aria-current={tab.on ? 'page' : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
