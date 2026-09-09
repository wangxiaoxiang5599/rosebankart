import Link from 'next/link';
import { EVENT_KINDS, type EventKind } from '@/lib/site';
import { formatDateRange } from '@/lib/format';
import { thumbUrl } from '@/lib/images';
import type { EventWithCover } from '@/db/queries';
import styles from './EventCard.module.css';

export function EventCard({ event }: { event: EventWithCover }) {
  const kind = EVENT_KINDS[event.kind as EventKind];
  const when = formatDateRange(event.startsOn, event.endsOn);

  /**
   * Roughly half of what the centre posts is an upright poster, flyer or page
   * of the newsletter — something with writing on it. Cropping those to a
   * landscape card cuts the words off, so they are shown whole instead.
   * Ordinary photographs still fill the frame.
   */
  const isUpright = !!event.cover && event.cover.height > event.cover.width * 1.15;

  return (
    <article className={styles.card}>
      <div className={`${styles.frame} ${isUpright ? styles.frameUpright : ''}`}>
        {event.cover ? (
          <img
            src={thumbUrl(event.cover)}
            alt={event.cover.alt || ''}
            width={event.cover.width}
            height={event.cover.height}
            loading="lazy"
          />
        ) : (
          // Nothing to show: a quiet mark, not the word "Workshop" repeated
          // directly above the badge that already says it.
          <div className={styles.placeholder} aria-hidden="true">
            <span className={styles.mark} />
          </div>
        )}
      </div>

      <div className={styles.body}>
        <span className={styles.kind}>{kind?.label ?? 'Event'}</span>
        <h3 className={styles.title}>
          <Link href={`/events/${event.slug}`}>{event.title}</Link>
        </h3>
        {when ? <p className={styles.meta}>{when}</p> : null}
        {/* No summary here on purpose. Most events do not have one — 9 of the
            14 migrated events are bare — so showing it left most cards with a
            block of empty space beside the few that had text. The summary is
            on the event's own page, where there is room for it. */}
      </div>
    </article>
  );
}
