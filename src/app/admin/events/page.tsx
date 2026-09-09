import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { listEventsForAdmin } from '@/db/queries';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { thumbUrl } from '@/lib/images';
import { formatDateRange } from '@/lib/format';
import { EVENT_KINDS, type EventKind } from '@/lib/site';
import { setEventVisibilityAction } from '../actions';
import { VisibilityButton } from '../VisibilityButton';
import styles from '../admin.module.css';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'All events' };

export default async function ManageEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/admin');

  const { page: rawPage } = await searchParams;
  const page = Math.max(1, Number(rawPage) || 1);
  const { items, pageCount, total } = await listEventsForAdmin(page);

  return (
    <>
      <PageHeader
        title="All events"
        lede="Everything that has been posted. Choose Change to edit one, or Remove to take it off the website."
      />

      <div className="wrap">
        <div className={styles.toolbar}>
          <p className={styles.count}>
            {total} {total === 1 ? 'event' : 'events'}
            {pageCount > 1 ? ` — page ${page} of ${pageCount}` : ''}
          </p>
          <Link className={styles.secondary} href="/admin/events/new">
            Post a new event
          </Link>
        </div>

        <ul className={styles.rows}>
          {items.map((event) => {
            const hidden = event.status !== 'published';
            const kind = EVENT_KINDS[event.kind as EventKind];
            const when = formatDateRange(event.startsOn, event.endsOn);
            return (
              <li key={event.id} className={`${styles.row} ${hidden ? styles.rowHidden : ''}`}>
                {event.cover ? (
                  <img className={styles.rowThumb} src={thumbUrl(event.cover)} alt="" />
                ) : (
                  <div className={styles.rowThumb} aria-hidden="true" />
                )}

                <div className={styles.rowBody}>
                  <p className={styles.rowTitle}>{event.title}</p>
                  <p className={styles.rowMeta}>
                    <span className={`${styles.badge} ${hidden ? styles.badgeHidden : ''}`}>
                      {hidden ? 'Not on the website' : (kind?.label ?? 'Event')}
                    </span>
                    {when ? `${when} · ` : ''}
                    {event.photoCount} {event.photoCount === 1 ? 'photo' : 'photos'}
                  </p>
                </div>

                <div className={styles.rowActions}>
                  {!hidden ? (
                    <Link className={styles.rowBtn} href={`/events/${event.slug}`}>
                      View
                    </Link>
                  ) : null}
                  <Link className={styles.rowBtn} href={`/admin/events/${event.id}/edit`}>
                    Change
                  </Link>
                  <VisibilityButton
                    hidden={hidden}
                    name={event.title}
                    action={setEventVisibilityAction.bind(null, event.id)}
                  />
                </div>
              </li>
            );
          })}
        </ul>

        <Pagination page={page} pageCount={pageCount} basePath="/admin/events" />

        <p>
          <Link href="/admin">← Back to the admin</Link>
        </p>
      </div>
    </>
  );
}
