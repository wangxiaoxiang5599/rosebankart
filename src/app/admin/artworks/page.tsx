import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { listArtworksForAdmin } from '@/db/queries';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { formatPartialDate } from '@/lib/format';
import { thumbUrl } from '@/lib/images';
import { setArtworkVisibilityAction } from '../actions';
import { VisibilityButton } from '../VisibilityButton';
import styles from '../admin.module.css';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'All artwork' };

export default async function ManageArtworksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/admin');

  const { page: rawPage } = await searchParams;
  const page = Math.max(1, Number(rawPage) || 1);
  const { items, pageCount, total } = await listArtworksForAdmin(page);

  return (
    <>
      <PageHeader
        title="All artwork"
        lede="Everything in the Gallery. Choose Change to correct a name, or Remove to take a picture off the website."
      />

      <div className="wrap">
        <div className={styles.toolbar}>
          <p className={styles.count}>
            {total} {total === 1 ? 'picture' : 'pictures'}
            {pageCount > 1 ? ` — page ${page} of ${pageCount}` : ''}
          </p>
          <Link className={styles.secondary} href="/admin/artworks/new">
            Add more artwork
          </Link>
        </div>

        <ul className={styles.rows}>
          {items.map((artwork) => {
            const hidden = artwork.status !== 'published';
            const name = artwork.title || artwork.artist || 'this picture';
            return (
              <li key={artwork.id} className={`${styles.row} ${hidden ? styles.rowHidden : ''}`}>
                <img className={styles.rowThumb} src={thumbUrl(artwork.image)} alt="" />

                <div className={styles.rowBody}>
                  <p className={styles.rowTitle}>{artwork.title || 'Untitled'}</p>
                  <p className={styles.rowMeta}>
                    {hidden ? (
                      <span className={`${styles.badge} ${styles.badgeHidden}`}>
                        Not on the website
                      </span>
                    ) : null}
                    {artwork.artist ? `by ${artwork.artist}` : 'No artist recorded'}
                    {artwork.year ? ` · ${formatPartialDate(artwork.year)}` : ''}
                  </p>
                </div>

                <div className={styles.rowActions}>
                  <Link className={styles.rowBtn} href={`/admin/artworks/${artwork.id}/edit`}>
                    Change
                  </Link>
                  <VisibilityButton
                    hidden={hidden}
                    name={name}
                    action={setArtworkVisibilityAction.bind(null, artwork.id)}
                  />
                </div>
              </li>
            );
          })}
        </ul>

        <Pagination page={page} pageCount={pageCount} basePath="/admin/artworks" />

        <p>
          <Link href="/admin">← Back to the admin</Link>
        </p>
      </div>
    </>
  );
}
