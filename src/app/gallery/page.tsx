import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { PhotoGrid } from '@/components/PhotoGrid';
import { listArtists, listArtworks } from '@/db/queries';
import styles from './gallery.module.css';

// D1 is only reachable at request time, never during the build, so these pages
// render per request. They are cheap queries on a Worker, and it means the
// committee sees a new post the moment they publish it.
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Gallery' };

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ artist?: string }>;
}) {
  const { artist } = await searchParams;
  const [artworks, artists] = await Promise.all([
    listArtworks(artist ? { artist } : {}),
    listArtists(),
  ]);

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
                href={`/gallery?artist=${encodeURIComponent(name)}`}
                className={`${styles.chip} ${artist === name ? styles.active : ''}`}
                aria-current={artist === name ? 'page' : undefined}
              >
                {name}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className={styles.grid}>
          <PhotoGrid
            items={artworks.map((a) => ({ image: a.image, title: a.title, artist: a.artist }))}
            emptyMessage={
              artist ? `No work listed for ${artist} yet.` : 'Artwork will appear here soon.'
            }
          />
        </div>
      </div>
    </>
  );
}
