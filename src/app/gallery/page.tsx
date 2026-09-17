import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { PhotoGrid } from '@/components/PhotoGrid';
import { groupByYear, listArtists, listArtworks } from '@/db/queries';
import { site } from '@/lib/site';
import styles from './gallery.module.css';

// D1 is only reachable at request time, never during the build, so these pages
// render per request. They are cheap queries on a Worker, and it means the
// committee sees a new post the moment they publish it.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gallery',
  description: `Paintings and other work by member artists of ${site.name}, ${site.address.town}, from recent challenges and exhibitions.`,
  // Filtering by artist or loading more is the same gallery, not a different page.
  alternates: { canonical: '/gallery' },
};

/** How many pictures a page shows before offering to load more. */
const PAGE_SIZE = 24;

/** Heading for the pieces listed without a year — mostly the old site's work. */
const UNDATED_HEADING = 'Earlier work';

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ artist?: string; show?: string }>;
}) {
  const { artist, show } = await searchParams;
  const limit = Math.max(PAGE_SIZE, Math.min(500, Number(show) || PAGE_SIZE));

  // One extra row tells us whether there is more to load, without a count query.
  const [rows, artists] = await Promise.all([
    listArtworks({ artist, byYear: true, limit: limit + 1 }),
    listArtists(),
  ]);
  const hasMore = rows.length > limit;
  const artworks = hasMore ? rows.slice(0, limit) : rows;
  const groups = groupByYear(artworks);

  const galleryHref = (opts: { artist?: string; show?: number }) => {
    const params = new URLSearchParams();
    if (opts.artist) params.set('artist', opts.artist);
    if (opts.show) params.set('show', String(opts.show));
    const qs = params.toString();
    return qs ? `/gallery?${qs}` : '/gallery';
  };

  return (
    <>
      <PageHeader
        title="Gallery"
        lede="Work by artists of the Rosebank Art Centre. Choose any picture to see it larger."
      />

      <div className="wrap">
        {artists.length > 0 ? (
          <nav className={styles.artists} aria-label="Filter by artist">
            <Link
              href="/gallery"
              className={`${styles.chip} ${!artist ? styles.active : ''}`}
              aria-current={!artist ? 'page' : undefined}
            >
              All artists
            </Link>
            {artists.map((name) => (
              <Link
                key={name}
                href={galleryHref({ artist: name })}
                className={`${styles.chip} ${artist === name ? styles.active : ''}`}
                aria-current={artist === name ? 'page' : undefined}
              >
                {name}
              </Link>
            ))}
          </nav>
        ) : null}

        {groups.length === 0 ? (
          <div className={styles.grid}>
            <PhotoGrid
              items={[]}
              emptyMessage={
                artist ? `No work listed for ${artist} yet.` : 'Artwork will appear here soon.'
              }
            />
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.year ?? 'earlier'} className={styles.year}>
              <div className={styles.yearHead}>
                <h2>{group.year ?? UNDATED_HEADING}</h2>
              </div>
              <PhotoGrid
                items={group.items.map((a) => ({ image: a.image, title: a.title, artist: a.artist }))}
              />
            </section>
          ))
        )}

        {hasMore ? (
          <div className={styles.more}>
            {/* A plain link, so it works without JavaScript and can be opened
                in a tab. scroll={false} keeps the reader where they were. */}
            <Link
              className={styles.moreLink}
              href={galleryHref({ artist, show: limit + PAGE_SIZE })}
              scroll={false}
            >
              Load more
            </Link>
          </div>
        ) : null}
      </div>
    </>
  );
}
