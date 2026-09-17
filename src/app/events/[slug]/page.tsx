import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PhotoGrid } from '@/components/PhotoGrid';
import { getEventBySlug } from '@/db/queries';
import { formatDateRange } from '@/lib/format';
import { fullUrl } from '@/lib/images';
import { EVENT_KINDS, site, type EventKind } from '@/lib/site';
import styles from './event.module.css';

// D1 is only reachable at request time, never during the build, so these pages
// render per request. They are cheap queries on a Worker, and it means the
// committee sees a new post the moment they publish it.
export const dynamic = 'force-dynamic';

/**
 * A search snippet or Facebook card for one event. Many posts are just a
 * poster with no summary, so the description falls back to the kind, date and
 * place — enough for the snippet to still say what and when.
 */
function describe(event: NonNullable<Awaited<ReturnType<typeof getEventBySlug>>>) {
  if (event.summary) return event.summary;
  const kind = EVENT_KINDS[event.kind as EventKind]?.label ?? 'Event';
  const when = formatDateRange(event.startsOn, event.endsOn);
  const where = event.location || `${site.name}, ${site.address.town}`;
  return [`${kind} at ${where}`, when].filter(Boolean).join(', ') + '.';
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: 'Not found' };

  const picture = event.cover ?? event.images[0];
  return {
    title: event.title,
    description: describe(event),
    alternates: { canonical: `/events/${slug}` },
    openGraph: {
      title: event.title,
      description: describe(event),
      type: 'article',
      // The poster, if there is one; otherwise the site-wide villa photograph applies.
      ...(picture && {
        images: [{ url: fullUrl(picture), width: picture.width, height: picture.height, alt: picture.alt }],
      }),
    },
  };
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

  // Lets a search result show the dates and venue beside the title. Only
  // dated events qualify; the undated archive posts are just pages.
  const picture = event.cover ?? event.images[0];
  const structured = event.startsOn && {
    '@context': 'https://schema.org',
    '@type': event.kind === 'workshop' ? 'EducationEvent' : 'ExhibitionEvent',
    name: event.title,
    description: describe(event),
    url: `${site.url}/events/${event.slug}`,
    startDate: event.startsOn,
    endDate: event.endsOn ?? event.startsOn,
    ...(picture && { image: `${site.url}${fullUrl(picture)}` }),
    location: {
      '@type': 'Place',
      name: event.location || site.name,
      address: event.location || `${site.address.street}, ${site.address.town} ${site.address.postcode}, ${site.address.country}`,
    },
    organizer: { '@type': 'Organization', name: site.name, url: site.url },
  };

  return (
    <article>
      {structured ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structured) }}
        />
      ) : null}
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
