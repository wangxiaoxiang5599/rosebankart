import { PageHeader } from '@/components/PageHeader';
import { EventCard } from '@/components/EventCard';
import { EventFilter } from '@/components/EventFilter';
import { listEvents, partitionByDate } from '@/db/queries';
import { EVENT_KINDS, site, type EventKind } from '@/lib/site';
import styles from '@/components/Section.module.css';

// D1 is only reachable at request time, never during the build, so these pages
// render per request. They are cheap queries on a Worker, and it means the
// committee sees a new post the moment they publish it.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Events',
  description: `Exhibitions, workshops and classes at ${site.name}, ${site.address.town} — what is coming up and what has been on.`,
  // The ?kind= filter shows a subset of the same list, not a different page.
  alternates: { canonical: '/events' },
};

const isKind = (v: string | undefined): v is EventKind => !!v && v in EVENT_KINDS;

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind } = await searchParams;
  const active = isKind(kind) ? kind : undefined;

  const all = await listEvents(active ? { kind: active } : {});
  const { upcoming, past } = partitionByDate(all);

  return (
    <>
      <PageHeader
        title="Events"
        lede="Exhibitions and workshops at the centre, newest first."
      />

      <div className="wrap">
        <EventFilter active={active} />

        {upcoming.length > 0 ? (
          <section className={styles.section}>
            <div className={styles.head}>
              <h2>Coming up</h2>
            </div>
            <div className={styles.cards}>
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        ) : null}

        <section className={styles.section}>
          <div className={styles.head}>
            <h2>{upcoming.length > 0 ? 'Past events' : 'All events'}</h2>
          </div>
          {past.length > 0 ? (
            <div className={styles.cards}>
              {past.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <p className={styles.empty}>Nothing here yet.</p>
          )}
        </section>
      </div>
    </>
  );
}
