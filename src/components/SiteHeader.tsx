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

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} onClick={() => setOpen(false)}>
          <span className={styles.brandName}>{site.name}</span>
          <br />
          <span className={styles.brandTag}>{site.tagline}</span>
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
