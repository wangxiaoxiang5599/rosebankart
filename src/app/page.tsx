import Link from 'next/link';
import { Hero } from '@/components/Hero';
import { EventCard } from '@/components/EventCard';
import { PhotoGrid } from '@/components/PhotoGrid';
import { listArtworks, listEvents, partitionByDate } from '@/db/queries';
import { site } from '@/lib/site';
import styles from '@/components/Section.module.css';
import home from './home.module.css';

// D1 is only reachable at request time, never during the build, so these pages
// render per request. They are cheap queries on a Worker, and it means the
// committee sees a new post the moment they publish it.
export const dynamic = 'force-dynamic';

/**
 * The old home page rendered every event and every picture the centre had ever
 * posted — roughly twenty thousand pixels of scrolling. This one shows the
 * next three events and eight recent works, and sends people onward.
 */
export default async function HomePage() {
  // The same walk as the Gallery, so this is its first eight and "See all
  // artwork" simply carries on from here.
  const [allEvents, artworks] = await Promise.all([
    listEvents({ limit: 40 }),
    listArtworks({ limit: 8, byYear: true }),
  ]);

  // "What's on" is only for what is still to come — an event stays up through
  // its last day and drops off the morning after. When nothing is booked the
  // section goes away rather than padding itself out with old events; those
  // live on the Events page.
  const { upcoming } = partitionByDate(allEvents);
  const featured = upcoming.slice(0, 3);

  return (
    <>
      <Hero />

      <section className={home.intro}>
        <div className="wrap">
          <p className={home.introText}>{site.intro}</p>
          <p className={home.introMeta}>
            {site.address.street}, {site.address.town} · New members always welcome
          </p>
        </div>
      </section>

      {featured.length > 0 && (
        <section className={styles.section}>
          <div className="wrap">
            <div className={styles.head}>
              <h2>What&apos;s on</h2>
              <Link href="/events" className={styles.more}>
                See all events →
              </Link>
            </div>

            <div className={styles.cards}>
              {featured.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className={styles.section}>
        <div className="wrap">
          <div className={styles.head}>
            <h2>From the gallery</h2>
            <Link href="/gallery" className={styles.more}>
              See all artwork →
            </Link>
          </div>

          <PhotoGrid
            items={artworks.map((a) => ({ image: a.image, title: a.title, artist: a.artist }))}
            emptyMessage="Artwork will appear here soon."
          />
        </div>
      </section>

      <section className={home.contactStrip}>
        <div className="wrap">
          <h2 className={home.stripHeading}>Come and see us</h2>
          <p className={home.stripText}>
            {site.address.street}, {site.address.town} {site.address.postcode}
          </p>
          <div className={home.stripActions}>
            <a className={home.stripBtn} href={`mailto:${site.email}`}>
              Email us
            </a>
            <Link className={home.stripBtnGhost} href="/contact">
              Contact details
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
