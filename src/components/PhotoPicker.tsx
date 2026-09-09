'use client';

import { useId, useRef, useState } from 'react';
import styles from './PhotoPicker.module.css';

const FULL_EDGE = 2400;
const THUMB_EDGE = 600;

export type PickedPhoto = {
  id: string;
  name: string;
  preview: string;
};

type Pending = { name: string; done: number; total: number };

/**
 * Shrink in the browser before uploading. A phone photo is often 4–6 MB; the
 * centre is on rural broadband, and Workers cannot resize images without a paid
 * add-on. Doing it here makes the upload quick and costs nothing.
 */
async function resize(file: File, maxEdge: number, quality: number) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not read that photo');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', quality),
  );
  if (!blob) throw new Error('Could not prepare that photo');
  return { blob, width, height };
}

export function PhotoPicker({
  photos,
  onChange,
  label = 'Photos',
  hint = 'You can choose more than one. They appear in the order shown below.',
}: {
  photos: PickedPhoto[];
  onChange: (next: PickedPhoto[]) => void;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [error, setError] = useState('');
  const inputId = useId();

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setError('');

    const added: PickedPhoto[] = [];
    for (const [i, file] of files.entries()) {
      setPending({ name: file.name, done: i, total: files.length });
      try {
        const [full, thumb] = await Promise.all([
          resize(file, FULL_EDGE, 0.82),
          resize(file, THUMB_EDGE, 0.8),
        ]);

        const body = new FormData();
        body.append('full', new File([full.blob], 'full.webp', { type: 'image/webp' }));
        body.append('thumb', new File([thumb.blob], 'thumb.webp', { type: 'image/webp' }));
        body.append('width', String(full.width));
        body.append('height', String(full.height));

        const response = await fetch('/api/upload', { method: 'POST', body });
        if (!response.ok) {
          const detail = await response.json().catch(() => ({ error: '' }));
          throw new Error(detail.error || 'The photo could not be saved.');
        }
        const saved = (await response.json()) as { id: string };
        added.push({
          id: saved.id,
          name: file.name,
          preview: URL.createObjectURL(thumb.blob),
        });
      } catch (cause) {
        setError(
          `${file.name} could not be added. ${cause instanceof Error ? cause.message : ''}`.trim(),
        );
      }
    }

    setPending(null);
    if (inputRef.current) inputRef.current.value = '';
    if (added.length > 0) onChange([...photos, ...added]);
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= photos.length) return;
    const next = [...photos];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const remove = (index: number) => {
    URL.revokeObjectURL(photos[index].preview);
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <span className={styles.hint}>{hint}</span>

      {/* A styled label rather than a bare file input: the browser default is
          small, unlabelled and easy to miss. */}
      <label className={styles.chooser} htmlFor={inputId}>
        <span aria-hidden="true">＋</span>
        {photos.length > 0 ? 'Add more photos' : 'Choose photos'}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        className="visually-hidden"
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
      />

      {pending ? (
        <p className={styles.progress} role="status">
          Adding photo {pending.done + 1} of {pending.total} — please wait…
        </p>
      ) : null}

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {photos.length > 0 ? (
        <ol className={styles.list}>
          {photos.map((photo, i) => (
            <li key={photo.id} className={styles.item}>
              <img className={styles.preview} src={photo.preview} alt="" />
              <div className={styles.itemBody}>
                <span className={styles.position}>
                  {i === 0 ? 'Main photo' : `Photo ${i + 1}`}
                </span>
                {photo.name ? <span className={styles.filename}>{photo.name}</span> : null}
              </div>
              {/* Arrows, not drag-and-drop. Dragging accurately is hard for
                  anyone with a tremor or an unfamiliar trackpad. */}
              <div className={styles.itemActions}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => move(i, i - 1)}
                  disabled={i === 0}
                  aria-label={`Move ${photo.name || `photo ${i + 1}`} earlier`}
                >
                  <span aria-hidden="true">↑</span>
                </button>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => move(i, i + 1)}
                  disabled={i === photos.length - 1}
                  aria-label={`Move ${photo.name || `photo ${i + 1}`} later`}
                >
                  <span aria-hidden="true">↓</span>
                </button>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => remove(i)}
                  aria-label={`Remove ${photo.name || `photo ${i + 1}`}`}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ol>
      ) : null}

      <input type="hidden" name="imageIds" value={photos.map((p) => p.id).join(',')} />
    </div>
  );
}
