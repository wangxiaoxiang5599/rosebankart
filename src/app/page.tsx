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
 * three newest events and eight recent works, and sends people onward.
 */
export default async function HomePage() {
  const [allEvents, artworks] = await Promise.all([
    listEvents({ limit: 40 }),
    listArtworks({ limit: 8 }),
  ]);

  const { upcoming, past } = partitionByDate(allEvents);
  const featured = [...upcoming, ...past].slice(0, 3);
  const hasUpcoming = upcoming.length > 0;

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

      <section className={styles.section}>
        <div className="wrap">
          <div className={styles.head}>
            <h2>{hasUpcoming ? "What's on" : 'Recent events'}</h2>
            <Link href="/events" className={styles.more}>
              See all events →
            </Link>
          </div>

          {featured.length > 0 ? (
            <div className={styles.cards}>
              {featured.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <p className={styles.empty}>Nothing posted yet — please check back soon.</p>
          )}
        </div>
      </section>

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
