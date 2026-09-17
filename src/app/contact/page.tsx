import { PageHeader } from '@/components/PageHeader';
import { site } from '@/lib/site';
import styles from './contact.module.css';

export const metadata = {
  title: 'Contact',
  description: `Find ${site.name} at ${site.address.street}, ${site.address.town}, or get in touch by email or Facebook about joining, exhibiting or visiting.`,
  alternates: { canonical: '/contact' },
};

const mapQuery = encodeURIComponent(
  `${site.address.street}, ${site.address.town} ${site.address.postcode}, ${site.address.country}`,
);

/**
 * No message form. The old one was a non-functioning placeholder, and a form
 * that quietly drops enquiries is worse than none — email and Facebook are
 * where this committee already reads its messages.
 */
export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="Contact us"
        lede="We would love to hear from you — about joining, exhibiting, or visiting."
      />

      <div className="wrap">
        <div className={styles.layout}>
          <div className={styles.details}>
            <section className={styles.block}>
              <h2 className={styles.label}>Email</h2>
              <a className={styles.big} href={`mailto:${site.email}`}>
                {site.email}
              </a>
            </section>

            <section className={styles.block}>
              <h2 className={styles.label}>Find us</h2>
              <address className={styles.address}>
                {site.address.street}
                <br />
                {site.address.town} {site.address.postcode}
                <br />
                {site.address.country}
              </address>
              <a
                className={styles.linkBtn}
                href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                Open in Google Maps
              </a>
            </section>

            <section className={styles.block}>
              <h2 className={styles.label}>Facebook</h2>
              <a
                className={styles.linkBtn}
                href={site.facebook}
                target="_blank"
                rel="noreferrer noopener"
              >
                Rosebank Art Centre on Facebook
              </a>
            </section>
          </div>

          <div className={styles.mapWrap}>
            <iframe
              className={styles.map}
              title={`Map showing ${site.address.street}, ${site.address.town}`}
              src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </>
  );
}
