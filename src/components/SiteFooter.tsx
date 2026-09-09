import Link from 'next/link';
import { nav, site } from '@/lib/site';
import styles from './SiteFooter.module.css';

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className="wrap">
        <div className={styles.grid}>
          <div>
            <h2 className={styles.heading}>Visit us</h2>
            <address>
              {site.address.street}
              <br />
              {site.address.town} {site.address.postcode}
              <br />
              {site.address.country}
            </address>
          </div>

          <div>
            <h2 className={styles.heading}>Get in touch</h2>
            <div className={styles.links}>
              <a href={`mailto:${site.email}`}>{site.email}</a>
              <a href={site.facebook} target="_blank" rel="noreferrer noopener">
                Find us on Facebook
              </a>
            </div>
          </div>

          <div>
            <h2 className={styles.heading}>Pages</h2>
            <div className={styles.links}>
              {nav.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.base}>
          <span>
            © {new Date().getFullYear()} {site.name} — {site.tagline}
          </span>
          <Link href="/admin">Committee login</Link>
        </div>
      </div>
    </footer>
  );
}
