'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { nav, site } from '@/lib/site';
import styles from './SiteHeader.module.css';

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isCurrent = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  // "Centre" drops on a phone so the name keeps to one line beside the rose.
  const cut = site.name.lastIndexOf(' ');

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <Link
          href="/"
          className={styles.brand}
          aria-label={site.name}
          onClick={() => setOpen(false)}
        >
          <img src="/rose.svg" alt="" width={130} height={155} className={styles.rose} />
          <span>
            <span className={styles.brandName}>
              {site.name.slice(0, cut)}
              <span className={styles.nameTail}>{site.name.slice(cut)}</span>
            </span>
            <br />
            <span className={styles.brandTag}>{site.tagline}</span>
          </span>
        </Link>

        {/* A labelled button, not a bare icon — the audience here skews older
            and a hamburger glyph alone is not a reliable signal. */}
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden="true">{open ? '✕' : '☰'}</span>
          {open ? 'Close' : 'Menu'}
        </button>

        <nav
          id="site-nav"
          aria-label="Main"
          className={`${styles.nav} ${open ? styles.navOpen : ''}`}
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.link}
              aria-current={isCurrent(item.href) ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
