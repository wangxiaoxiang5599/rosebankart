import { PageHeader } from '@/components/PageHeader';
import { site } from '@/lib/site';
import styles from './about.module.css';

export const metadata = {
  title: 'About',
  description: `Who runs ${site.name}, how to become a member, and what the centre on ${site.address.street}, ${site.address.town} offers local artists.`,
  alternates: { canonical: '/about' },
};

/**
 * Merges the old About page with the old "Info" page, which held the committee
 * list, membership fees and donation note. Info was a catch-all with no reason
 * to exist on its own.
 */
export default function AboutPage() {
  return (
    <>
      <PageHeader title="About us" lede={site.intro} />

      <div className="wrap">
        <div className={styles.layout}>
          <section className={styles.main}>
            <h2>Who we are</h2>
            <p>
              Rosebank Art Centre is a charitable trust run by its members. We hold
              exhibitions, run workshops and classes, and provide a place for artists in
              and around Te Awamutu to work and show their art.
            </p>
            <p>
              Members meet at the centre on {site.address.street}. Everyone is welcome,
              whatever your level of experience.
            </p>

            <h2>Our committee</h2>
            <ul className={styles.people}>
              {site.committee.map((person) => (
                <li key={person.name}>
                  <span className={styles.personName}>{person.name}</span>
                  <span className={styles.personRole}>{person.role}</span>
                </li>
              ))}
            </ul>
          </section>

          <aside className={styles.side}>
            <div className={styles.card}>
              <h2 className={styles.cardHeading}>Membership</h2>
              <p className={styles.fee}>
                <strong>${site.membership.single}</strong> a year for one person
                <br />
                <strong>${site.membership.couple}</strong> a year for a couple
              </p>
              <p className={styles.cardNote}>
                New members are always welcome. Get in touch to join in on the creative
                fun.
              </p>
              <a className={styles.cardBtn} href={`mailto:${site.email}`}>
                Email us to join
              </a>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardHeading}>Donations</h2>
              <p className={styles.cardNote}>
                We are a charitable trust and welcome donations towards the running of
                the centre. Please contact us if you would like to support our work.
              </p>
              <a className={styles.cardBtnGhost} href={`mailto:${site.email}`}>
                Contact us about donating
              </a>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
