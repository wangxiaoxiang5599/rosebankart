import { notFound, redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getArtworkForAdmin } from '@/db/queries';
import { PageHeader } from '@/components/PageHeader';
import { thumbUrl } from '@/lib/images';
import { EditArtworkForm } from './EditArtworkForm';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Change a picture' };

export default async function EditArtworkPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect('/admin');

  const { id } = await params;
  const artwork = await getArtworkForAdmin(id);
  if (!artwork) notFound();

  return (
    <>
      <PageHeader title="Change a picture" lede="Correct the name of the piece or the artist." />
      <div className="wrap">
        <EditArtworkForm
          artwork={{
            id: artwork.id,
            title: artwork.title,
            artist: artwork.artist,
            year: artwork.year ?? '',
            thumb: thumbUrl(artwork.image),
          }}
        />
      </div>
    </>
  );
}
