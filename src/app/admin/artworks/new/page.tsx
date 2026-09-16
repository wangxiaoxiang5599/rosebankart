import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { todayInNZ } from '@/lib/format';
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
        {/* Most of what gets added is from a show that has just finished, so
            the year starts filled in. Worked out here, on the server, in NZ
            time, rather than from whatever clock the browser has. */}
        <ArtworkForm currentYear={todayInNZ().slice(0, 4)} />
      </div>
    </>
  );
}
