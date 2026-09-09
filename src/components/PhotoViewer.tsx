'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { fullUrl } from '@/lib/images';
import type { PhotoItem } from './PhotoGrid';
import styles from './PhotoViewer.module.css';

/** 1 means "the whole picture, fitted to the window". */
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 8;
const STEP = 1.4;
/** Movement beyond this counts as a drag, so it does not also close the viewer. */
const DRAG_SLOP = 5;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * Opens a picture over the page it was clicked on.
 *
 * Modelled on a PDF reader, because that is the thing people already know and
 * because half of what this site shows is a poster or a page of the newsletter
 * that has to be read rather than glanced at:
 *
 *   - the picture is sized in real pixels, so the panel gets true scrollbars.
 *     A scrollbar is the only control that *tells* you there is more below;
 *     drag-to-pan gives no hint at all, which is how you get stranded.
 *   - the wheel scrolls, as it does everywhere else. Ctrl (or ⌘) with the wheel
 *     zooms, again as it does everywhere else.
 *   - zoom goes below 100%, so the whole page can be pushed back into view.
 *
 * Dragging still pans, but it is now a convenience rather than the only way out.
 */
export function PhotoViewer({
  items,
  index,
  onClose,
  onIndexChange,
}: {
  items: PhotoItem[];
  index: number;
  onClose: () => void;
  onIndexChange: (next: number) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const [zoom, setZoom] = useState(1);
  const [stage, setStage] = useState({ w: 0, h: 0 });

  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const moved = useRef(0);

  const current = items[index];

  // Measure the panel so the picture can be given an explicit pixel size.
  // Relying on max-width/max-height inside a grid row was what let a tall page
  // overflow and become unreachable.
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      // The content box, not the padding box: counting the padding as usable
      // space leaves the fitted picture a few pixels too tall and raises a
      // scrollbar over a page that is already fully visible.
      const cs = getComputedStyle(el);
      const px = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const py = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      setStage({ w: el.clientWidth - px, h: el.clientHeight - py });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const go = useCallback(
    (delta: number) => {
      const next = index + delta;
      if (next >= 0 && next < items.length) {
        onIndexChange(next);
        setZoom(1);
        stageRef.current?.scrollTo({ top: 0, left: 0 });
      }
    },
    [index, items.length, onIndexChange],
  );

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === '+' || e.key === '=') setZoom((z) => clamp(z * STEP, MIN_ZOOM, MAX_ZOOM));
      else if (e.key === '-') setZoom((z) => clamp(z / STEP, MIN_ZOOM, MAX_ZOOM));
      else if (e.key === '0') setZoom(1);
    };
    document.addEventListener('keydown', onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [go, onClose]);

  // Only Ctrl/⌘ + wheel zooms; a plain wheel is left alone so the panel scrolls.
  // The listener must be non-passive to be allowed to cancel the browser's own
  // pinch-zoom, which React's onWheel prop cannot do.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom((z) => clamp(z * Math.exp(-e.deltaY * 0.0022), MIN_ZOOM, MAX_ZOOM));
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  if (!current) return null;

  const { image } = current;
  const caption = [current.title, current.artist && `by ${current.artist}`]
    .filter(Boolean)
    .join(' ');

  // At zoom 1 the whole picture fits; it is never blown up past its real size
  // just to fill the panel.
  const fit =
    stage.w > 0 && stage.h > 0
      ? Math.min(stage.w / image.width, stage.h / image.height, 1)
      : 0;
  const displayWidth = fit > 0 ? Math.round(image.width * fit * zoom) : undefined;

  const onPointerDown = (e: React.PointerEvent) => {
    const el = stageRef.current;
    if (!el || e.button !== 0) return;
    moved.current = 0;
    drag.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop };
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const el = stageRef.current;
    if (!el || !drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    moved.current = Math.max(moved.current, Math.hypot(dx, dy));
    if (moved.current > DRAG_SLOP) {
      el.scrollLeft = drag.current.left - dx;
      el.scrollTop = drag.current.top - dy;
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    stageRef.current?.releasePointerCapture?.(e.pointerId);
    const wasDrag = moved.current > DRAG_SLOP;
    drag.current = null;
    // A click, not the end of a drag: close, as asked.
    if (!wasDrag) onClose();
  };

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label={caption || 'Picture'}>
      <div className={styles.bar}>
        <div className={styles.zoomGroup}>
          <button
            type="button"
            className={styles.btn}
            onClick={() => setZoom((z) => clamp(z / STEP, MIN_ZOOM, MAX_ZOOM))}
            disabled={zoom <= MIN_ZOOM}
            aria-label="Zoom out"
          >
            <span aria-hidden="true">－</span>
          </button>
          <span className={styles.percent} aria-live="polite">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            className={styles.btn}
            onClick={() => setZoom((z) => clamp(z * STEP, MIN_ZOOM, MAX_ZOOM))}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Zoom in"
          >
            <span aria-hidden="true">＋</span>
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.wide}`}
            onClick={() => setZoom(1)}
            disabled={zoom === 1}
          >
            Whole page
          </button>
        </div>

        <button ref={closeRef} type="button" className={`${styles.btn} ${styles.wide}`} onClick={onClose}>
          <span aria-hidden="true">✕</span> Close
        </button>
      </div>

      <div
        ref={stageRef}
        className={styles.stage}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => setZoom((z) => (z === 1 ? 2.5 : 1))}
      >
        <img
          className={styles.img}
          style={{ width: displayWidth, cursor: zoom > 1 ? 'grab' : 'zoom-in' }}
          src={fullUrl(image)}
          alt={image.alt || caption || ''}
          width={image.width}
          height={image.height}
          draggable={false}
        />
      </div>

      {items.length > 1 ? (
        <>
          <button
            type="button"
            className={`${styles.btn} ${styles.nav} ${styles.prev}`}
            onClick={() => go(-1)}
            disabled={index === 0}
            aria-label="Previous picture"
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.nav} ${styles.next}`}
            onClick={() => go(1)}
            disabled={index === items.length - 1}
            aria-label="Next picture"
          >
            <span aria-hidden="true">›</span>
          </button>
        </>
      ) : null}

      <div className={styles.footer}>
        {caption ? <p className={styles.caption}>{caption}</p> : null}
        <p className={styles.hint}>
          Scroll to move down the page · Use ＋ and － to zoom · Click the picture to close
          {items.length > 1 ? ` · Picture ${index + 1} of ${items.length}` : ''}
        </p>
      </div>
    </div>
  );
}
