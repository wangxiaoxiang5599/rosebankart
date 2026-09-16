'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { updateArtworkAction, type FormState } from '../../../actions';
import { DateFields } from '../../DateFields';
import styles from '../../../admin.module.css';
import own from '../../new/artwork-form.module.css';

const initial: FormState = {};

export function EditArtworkForm({
  artwork,
}: {
  artwork: { id: string; title: string; artist: string; year: string | null; thumb: string };
}) {
  const [state, action, pending] = useActionState(updateArtworkAction, initial);
  const typed = state.values ?? {};

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
            defaultValue={typed.title ?? artwork.title}
          />

          <label className={own.small} htmlFor="artist">
            Artist
          </label>
          <input
            className={styles.input}
            id="artist"
            name="artist"
            type="text"
            defaultValue={typed.artist ?? artwork.artist}
          />

          <DateFields prefix="date" defaultValue={artwork.year} values={state.values} />
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
