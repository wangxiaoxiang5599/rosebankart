import { site } from '@/lib/site';
import styles from './Hero.module.css';

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-name">
      <div className={styles.frame}>
        <picture>
          <source
            type="image/webp"
            srcSet="/hero-800.webp 800w, /hero-1200.webp 1200w, /hero-2000.webp 2000w"
            sizes="100vw"
          />
          <img
            src="/hero-1200.jpg"
            srcSet="/hero-800.jpg 800w, /hero-1200.jpg 1200w, /hero-2000.jpg 2000w"
            sizes="100vw"
            alt="The Rosebank Art Centre villa on Churchill Street, Te Awamutu"
            width={2000}
            height={1333}
            fetchPriority="high"
          />
        </picture>
      </div>

      <div className={styles.badge}>
        <div>
          <h1 id="hero-name" className={styles.name}>
            {site.name}
          </h1>
          <div className={styles.rule} />
          <p className={styles.tag}>{site.tagline}</p>
        </div>
      </div>
    </section>
  );
}
