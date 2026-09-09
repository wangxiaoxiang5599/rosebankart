import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { ArtworkForm } from './ArtworkForm';

export const metadata = { title: 'Add artwork' };

export default async function NewArtworkPage() {
  const user = await getSessionUser();
  if (!user) redirect('/admin');

  return (
    <>
      <PageHeader
        title="Add artwork"
        lede="Choose your pictures, then type the name of each piece and who painted or made it."
      />
      <div className="wrap">
        <ArtworkForm />
      </div>
    </>
  );
}
