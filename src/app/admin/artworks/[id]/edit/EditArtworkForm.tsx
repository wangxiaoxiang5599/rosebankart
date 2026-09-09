'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { updateArtworkAction, type FormState } from '../../../actions';
import styles from '../../../admin.module.css';
import own from '../../new/artwork-form.module.css';

const initial: FormState = {};

export function EditArtworkForm({
  artwork,
}: {
  artwork: { id: string; title: string; artist: string; year: string; thumb: string };
}) {
  const [state, action, pending] = useActionState(updateArtworkAction, initial);

  if (state.ok) {
    return (
      <div className={styles.form}>
        <p className={styles.success} role="status">
          <strong>Saved ✓</strong>
          {state.ok}
        </p>
        <div className={styles.actions}>
          <Link className={styles.secondary} href="/gallery">
            See the Gallery
          </Link>
          <Link className={styles.secondary} href="/admin/artworks">
            Back to all artwork
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className={styles.form} action={action}>
      <input type="hidden" name="id" value={artwork.id} />

      {state.error ? (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      ) : null}

      <div className={own.detail}>
        <img className={own.thumb} src={artwork.thumb} alt="" />
        <div className={own.fields}>
          <label className={own.small} htmlFor="title">
            Name of the piece
          </label>
          <input
            className={styles.input}
            id="title"
            name="title"
            type="text"
            defaultValue={artwork.title}
          />

          <label className={own.small} htmlFor="artist">
            Artist
          </label>
          <input
            className={styles.input}
            id="artist"
            name="artist"
            type="text"
            defaultValue={artwork.artist}
          />

          <label className={own.small} htmlFor="year">
            Year (optional)
          </label>
          <input
            className={styles.input}
            id="year"
            name="year"
            type="text"
            inputMode="numeric"
            defaultValue={artwork.year}
          />
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.primary} type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save'}
        </button>
        <Link className={styles.secondary} href="/admin/artworks">
          Cancel
        </Link>
      </div>
    </form>
  );
}
