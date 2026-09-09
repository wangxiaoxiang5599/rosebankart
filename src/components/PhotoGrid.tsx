'use client';

import { useState } from 'react';
import { fullUrl, thumbUrl } from '@/lib/images';
import type { ImageRow } from '@/db/queries';
import { PhotoViewer } from './PhotoViewer';
import styles from './PhotoGrid.module.css';

export type PhotoItem = {
  image: ImageRow;
  title?: string;
  artist?: string;
};

/**
 * `tiles`   — equal square crops. Right for the Gallery, where a tidy wall of
 *             work is the point.
 * `natural` — every picture whole, at its own shape. Right for events, where
 *             roughly half of what gets posted is a poster or a newsletter page
 *             that has to stay readable. Cropping those throws away the part
 *             people came to read.
 */
export type PhotoGridLayout = 'tiles' | 'natural';

/**
 * Most pieces carry only an artist, so the pieces of the caption have to be
 * assembled into a real sentence — "the picture of by Maria Woolrich" is what
 * a screen reader would otherwise announce.
 */
function openLabel({ title, artist }: PhotoItem): string {
  if (title && artist) return `Open "${title}" by ${artist}`;
  if (title) return `Open "${title}"`;
  if (artist) return `Open the picture by ${artist}`;
  return 'Open the picture';
}

/** A plain left click, with no intent to open a tab or window of their own. */
const isPlainClick = (e: React.MouseEvent) =>
  e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

export function PhotoGrid({
  items,
  layout = 'tiles',
  columns,
  emptyMessage = 'Nothing here yet.',
}: {
  items: PhotoItem[];
  layout?: PhotoGridLayout;
  /** Column count. Defaults to something sensible for the item count. */
  columns?: number;
  emptyMessage?: string;
}) {
  const [openAt, setOpenAt] = useState<number | null>(null);

  if (items.length === 0) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  const natural = layout === 'natural';
  // One picture fills the width; a pair sits side by side; more go into columns.
  const cols = columns ?? Math.min(items.length, 3);

  return (
    <>
      <ul
        className={natural ? styles.masonry : styles.grid}
        style={natural ? ({ '--cols': cols } as React.CSSProperties) : undefined}
      >
        {items.map((item, i) => {
          const label = [item.title, item.artist && `by ${item.artist}`]
            .filter(Boolean)
            .join(' ');
          return (
            <li key={item.image.id} className={natural ? styles.naturalItem : styles.item}>
              {/* A real link to the picture, taken over by the viewer on a plain
                  click. Middle-click and ctrl-click still open a tab, and if the
                  JavaScript never arrives the picture is still reachable. */}
              <a
                className={natural ? styles.naturalTile : styles.tile}
                href={fullUrl(item.image)}
                aria-label={openLabel(item)}
                onClick={(e) => {
                  if (!isPlainClick(e)) return;
                  e.preventDefault();
                  setOpenAt(i);
                }}
              >
                {natural ? (
                  // Natural tiles are large — 540px wide for a pair, 736px for a
                  // lone poster — so the 600px thumbnail would be stretched and
                  // soft. Offer both sizes and let the browser choose: a
                  // three-across photo set still loads thumbnails, a newsletter
                  // spread loads the full scan.
                  <img
                    className={styles.naturalImg}
                    src={fullUrl(item.image)}
                    srcSet={`${thumbUrl(item.image)} 600w, ${fullUrl(item.image)} ${item.image.width}w`}
                    sizes={`(max-width: 600px) 100vw, (max-width: 900px) 50vw, ${Math.round(100 / cols)}vw`}
                    alt={item.image.alt || label || ''}
                    width={item.image.width}
                    height={item.image.height}
                    loading="lazy"
                  />
                ) : (
                  <div className={styles.frame}>
                    <img
                      src={thumbUrl(item.image)}
                      alt={item.image.alt || label || ''}
                      width={item.image.width}
                      height={item.image.height}
                      loading="lazy"
                    />
                  </div>
                )}

                {/* In the tiled Gallery the caption strip is always drawn, even
                    when a piece has no title or artist recorded. Only a third of
                    the collection carries both, so rendering it conditionally
                    left the wall a patchwork of tall and short cards. */}
                {natural ? (
                  label ? (
                    <div className={styles.label}>
                      {item.title ? <span className={styles.title}>{item.title}</span> : null}
                      {item.artist ? <span className={styles.artist}>by {item.artist}</span> : null}
                    </div>
                  ) : null
                ) : (
                  <div className={styles.label}>
                    {item.title ? <span className={styles.title}>{item.title}</span> : null}
                    {item.artist ? <span className={styles.artist}>by {item.artist}</span> : null}
                  </div>
                )}
              </a>
            </li>
          );
        })}
      </ul>

      {openAt !== null ? (
        <PhotoViewer
          items={items}
          index={openAt}
          onClose={() => setOpenAt(null)}
          onIndexChange={setOpenAt}
        />
      ) : null}
    </>
  );
}
