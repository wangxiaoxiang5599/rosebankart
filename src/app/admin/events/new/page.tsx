import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { EventForm } from './EventForm';

export const metadata = { title: 'Post an event' };

export default async function NewEventPage() {
  const user = await getSessionUser();
  if (!user) redirect('/admin');

  return (
    <>
      <PageHeader
        title="Post an event"
        lede="Fill in the name, choose Exhibition or Workshop, add your photos, and press Publish."
      />
      <div className="wrap">
        <EventForm />
      </div>
    </>
  );
}
