'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { PhotoPicker, type PickedPhoto } from '@/components/PhotoPicker';
import { createEventAction, type FormState } from '../../actions';
import { site } from '@/lib/site';
import styles from '../../admin.module.css';

const initial: FormState = {};

export function EventForm() {
  const [state, action, pending] = useActionState(createEventAction, initial);
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);

  // Once it is published, show the result rather than the form again — the
  // most common mistake with a form that resets is posting the same thing twice.
  if (state.ok) {
    return (
      <div className={styles.form}>
        <p className={styles.success} role="status">
          <strong>Done ✓</strong>
          {state.ok}
        </p>
        <div className={styles.actions}>
          {state.slug ? (
            <Link className={styles.secondary} href={`/events/${state.slug}`}>
              See it on the website
            </Link>
          ) : null}
          <Link className={styles.secondary} href="/admin/events/new">
            Post another event
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
        <label className={styles.label} htmlFor="title">
          Name of the event
        </label>
        <span className={styles.hint}>For example: Spring Exhibition 2026</span>
        <input className={styles.input} id="title" name="title" type="text" required />
      </div>

      <div className={styles.field}>
        <span className={styles.label}>What kind of event is it?</span>
        <div className={styles.kinds}>
          <label className={styles.kind}>
            <input type="radio" name="kind" value="exhibition" defaultChecked />
            Exhibition
          </label>
          <label className={styles.kind}>
            <input type="radio" name="kind" value="workshop" />
            Workshop
          </label>
        </div>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>When is it?</span>
        <span className={styles.hint}>
          Leave the finish date empty if it is only on for one day.
        </span>
        <div className={styles.dates}>
          <div>
            <label className={styles.hint} htmlFor="startsOn">
              Starts
            </label>
            <input className={styles.input} id="startsOn" name="startsOn" type="date" />
          </div>
          <div>
            <label className={styles.hint} htmlFor="endsOn">
              Finishes
            </label>
            <input className={styles.input} id="endsOn" name="endsOn" type="date" />
          </div>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="location">
          Where is it?
        </label>
        <input
          className={styles.input}
          id="location"
          name="location"
          type="text"
          defaultValue={`${site.address.street}, ${site.address.town}`}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="summary">
          Anything you would like to say about it
        </label>
        <span className={styles.hint}>This is optional — you can leave it empty.</span>
        <textarea className={styles.textarea} id="summary" name="summary" />
      </div>

      <div className={styles.field}>
        <PhotoPicker
          photos={photos}
          onChange={setPhotos}
          hint="The first photo is the one people see on the Events page. Use the arrows to change the order."
        />
      </div>

      <div className={styles.field}>
        <label className={styles.kind}>
          <input type="checkbox" name="alsoGallery" />
          Also put these photos in the Gallery
        </label>
      </div>

      <div className={styles.actions}>
        <button className={styles.primary} type="submit" disabled={pending}>
          {pending ? 'Publishing…' : 'Publish'}
        </button>
        <Link className={styles.secondary} href="/admin">
          Cancel
        </Link>
      </div>
    </form>
  );
}
