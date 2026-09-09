import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { LoginForm } from './LoginForm';
import { signOutAction } from './actions';
import { PageHeader } from '@/components/PageHeader';
import styles from './admin.module.css';

export const metadata = { title: 'Committee login' };

/**
 * One page: the sign-in box when signed out, and two big choices when signed
 * in. There is deliberately no dashboard of counts and charts — the committee
 * comes here to put something on the website, and nothing else.
 */
export default async function AdminPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <>
        <PageHeader
          title="Committee login"
          lede="For Rosebank Art Centre committee members. If you have not been given a login, please ask on the committee."
        />
        <div className="wrap">
          <div className={styles.login}>
            <LoginForm />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={styles.topline}>
        <div className={styles.toplineInner}>
          <span className={styles.who}>
            Signed in as <strong>{user.name}</strong>
          </span>
          <form action={signOutAction}>
            <button type="submit" className={styles.signOut}>
              Sign out
            </button>
          </form>
        </div>
      </div>

      <PageHeader title="What would you like to do?" />

      <div className="wrap">
        <div className={styles.choices}>
          <Link href="/admin/events/new" className={styles.choice}>
            <span className={styles.choiceTitle}>Post an event</span>
            <p className={styles.choiceNote}>
              An exhibition or a workshop. Add a poster or some photos, and it appears
              on the Events page.
            </p>
          </Link>

          <Link href="/admin/artworks/new" className={styles.choice}>
            <span className={styles.choiceTitle}>Add artwork</span>
            <p className={styles.choiceNote}>
              Put pictures of members&rsquo; work into the Gallery, with the name of the
              piece and the artist.
            </p>
          </Link>
        </div>

        {/* Posting is the common errand, so it keeps the two big cards. Fixing
            something already up is rarer and sits below, out of the way. */}
        <h2 className={styles.manageHeading}>Or change something already on the website</h2>
        <div className={styles.manageLinks}>
          <Link className={styles.secondary} href="/admin/events">
            All events
          </Link>
          <Link className={styles.secondary} href="/admin/artworks">
            All artwork
          </Link>
        </div>

        <p className={styles.manageNote}>
          Nothing is ever really deleted. Removing something takes it off the website but
          leaves it here, so it can be put back.
        </p>

        <p>
          <Link href="/">← Back to the website</Link>
        </p>
      </div>
    </>
  );
}
