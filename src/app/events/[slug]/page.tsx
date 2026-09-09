import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PhotoGrid } from '@/components/PhotoGrid';
import { getEventBySlug } from '@/db/queries';
import { formatDateRange } from '@/lib/format';
import { EVENT_KINDS, type EventKind } from '@/lib/site';
import styles from './event.module.css';

// D1 is only reachable at request time, never during the build, so these pages
// render per request. They are cheap queries on a Worker, and it means the
// committee sees a new post the moment they publish it.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  return event ? { title: event.title, description: event.summary } : { title: 'Not found' };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const kind = EVENT_KINDS[event.kind as EventKind];
  const when = formatDateRange(event.startsOn, event.endsOn);

  /**
   * Every picture is shown the same way, at its own proportions.
   *
   * There used to be a large "cover" followed by small thumbnails, which
   * assumed one lead image plus supporting shots. That is not what gets posted:
   * six of the thirteen events are a single poster, and a two-page newsletter
   * came out as one huge page beside one tiny one. The pictures on an event are
   * peers, so they are laid out as peers.
   */
  const photos = event.images.map((image) => ({ image }));

  return (
    <article>
      <div className={styles.head}>
        <div className="wrap">
          <Link href="/events" className={styles.back}>
            ← All events
          </Link>
          <span className={styles.kind}>{kind?.label ?? 'Event'}</span>
          <h1>{event.title}</h1>
          {when ? <p className={styles.when}>{when}</p> : null}
          {event.location ? <p className={styles.where}>{event.location}</p> : null}
        </div>
      </div>

      <div className="wrap">
        {event.summary ? <p className={styles.summary}>{event.summary}</p> : null}
        {event.body ? <div className={styles.body}>{event.body}</div> : null}

        {photos.length > 0 ? (
          // A lone poster gets a comfortable reading width rather than being
          // stretched the full page.
          <div className={photos.length === 1 ? styles.single : styles.photos}>
            <PhotoGrid layout="natural" items={photos} />
          </div>
        ) : null}
      </div>
    </article>
  );
}
