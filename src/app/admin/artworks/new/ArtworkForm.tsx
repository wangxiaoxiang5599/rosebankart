'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { PhotoPicker, type PickedPhoto } from '@/components/PhotoPicker';
import { createArtworksAction, type FormState } from '../../actions';
import styles from '../../admin.module.css';
import own from './artwork-form.module.css';

const initial: FormState = {};

export function ArtworkForm() {
  const [state, action, pending] = useActionState(createArtworksAction, initial);
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);

  if (state.ok) {
    return (
      <div className={styles.form}>
        <p className={styles.success} role="status">
          <strong>Done ✓</strong>
          {state.ok}
        </p>
        <div className={styles.actions}>
          <Link className={styles.secondary} href="/gallery">
            See the Gallery
          </Link>
          <Link className={styles.secondary} href="/admin/artworks/new">
            Add more artwork
          </Link>
          <Link className={styles.secondary} href="/admin">
            Finished
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className={styles.form} action={action}>
      {state.error ? (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      ) : null}

      <div className={styles.field}>
        <PhotoPicker
          photos={photos}
          onChange={setPhotos}
          label="Pictures of the artwork"
          hint="Choose one picture for each piece. You can add several at once."
          watermark
        />
      </div>

      {/* The details appear underneath each picture only after it has been
          added, so the page starts as one simple choice rather than a wall of
          empty boxes. */}
      {photos.length > 0 ? (
        <div className={styles.field}>
          <span className={styles.label}>Tell us about each picture</span>
          <span className={styles.hint}>
            You can leave any of these empty if you are not sure.
          </span>

          <ol className={own.details}>
            {photos.map((photo) => (
              <li key={photo.id} className={own.detail}>
                <img className={own.thumb} src={photo.preview} alt="" />
                <div className={own.fields}>
                  <label className={own.small} htmlFor={`title-${photo.id}`}>
                    Name of the piece
                  </label>
                  <input
                    className={styles.input}
                    id={`title-${photo.id}`}
                    name={`title-${photo.id}`}
                    type="text"
                  />

                  <label className={own.small} htmlFor={`artist-${photo.id}`}>
                    Artist
                  </label>
                  <input
                    className={styles.input}
                    id={`artist-${photo.id}`}
                    name={`artist-${photo.id}`}
                    type="text"
                  />

                  <label className={own.small} htmlFor={`year-${photo.id}`}>
                    Year (optional)
                  </label>
                  <input
                    className={styles.input}
                    id={`year-${photo.id}`}
                    name={`year-${photo.id}`}
                    type="text"
                    inputMode="numeric"
                  />
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className={styles.actions}>
        <button className={styles.primary} type="submit" disabled={pending || photos.length === 0}>
          {pending ? 'Saving…' : 'Save to the Gallery'}
        </button>
        <Link className={styles.secondary} href="/admin">
          Cancel
        </Link>
      </div>
    </form>
  );
}
