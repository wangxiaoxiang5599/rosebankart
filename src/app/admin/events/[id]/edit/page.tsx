import { notFound, redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getEventForAdmin } from '@/db/queries';
import { PageHeader } from '@/components/PageHeader';
import { thumbUrl } from '@/lib/images';
import { EditEventForm } from './EditEventForm';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Change an event' };

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect('/admin');

  const { id } = await params;
  const event = await getEventForAdmin(id);
  if (!event) notFound();

  return (
    <>
      <PageHeader
        title="Change an event"
        lede="Correct anything that is wrong, then press Save."
      />
      <div className="wrap">
        <EditEventForm
          event={{
            id: event.id,
            title: event.title,
            kind: event.kind,
            startsOn: event.startsOn ?? '',
            endsOn: event.endsOn ?? '',
            location: event.location ?? '',
            summary: event.summary,
            slug: event.slug,
          }}
          // No filename for pictures that are already on the event — the
          // position label above each one already says which is which.
          photos={event.images.map((image) => ({
            id: image.id,
            name: '',
            preview: thumbUrl(image),
          }))}
        />
      </div>
    </>
  );
}
