'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { PhotoPicker, type PickedPhoto } from '@/components/PhotoPicker';
import { updateEventAction, type FormState } from '../../../actions';
import styles from '../../../admin.module.css';

const initial: FormState = {};

type EditableEvent = {
  id: string;
  title: string;
  kind: string;
  startsOn: string;
  endsOn: string;
  location: string;
  summary: string;
  slug: string;
};

export function EditEventForm({
  event,
  photos: initialPhotos,
}: {
  event: EditableEvent;
  photos: PickedPhoto[];
}) {
  const [state, action, pending] = useActionState(updateEventAction, initial);
  // The pictures already on the event are seeded into the same picker used when
  // posting, so removing, reordering and adding all work the same way here.
  const [photos, setPhotos] = useState<PickedPhoto[]>(initialPhotos);

  if (state.ok) {
    return (
      <div className={styles.form}>
        <p className={styles.success} role="status">
          <strong>Saved ✓</strong>
          {state.ok}
        </p>
        <div className={styles.actions}>
          <Link className={styles.secondary} href={`/events/${state.slug ?? event.slug}`}>
            See it on the website
          </Link>
          <Link className={styles.secondary} href="/admin/events">
            Back to all events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className={styles.form} action={action}>
      <input type="hidden" name="id" value={event.id} />

      {state.error ? (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      ) : null}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="title">
          Name of the event
        </label>
        <input
          className={styles.input}
          id="title"
          name="title"
          type="text"
          defaultValue={event.title}
          required
        />
      </div>

      <div className={styles.field}>
        <span className={styles.label}>What kind of event is it?</span>
        <div className={styles.kinds}>
          <label className={styles.kind}>
            <input
              type="radio"
              name="kind"
              value="exhibition"
              defaultChecked={event.kind === 'exhibition'}
            />
            Exhibition
          </label>
          <label className={styles.kind}>
            <input
              type="radio"
              name="kind"
              value="workshop"
              defaultChecked={event.kind === 'workshop'}
            />
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
            <input
              className={styles.input}
              id="startsOn"
              name="startsOn"
              type="date"
              defaultValue={event.startsOn}
            />
          </div>
          <div>
            <label className={styles.hint} htmlFor="endsOn">
              Finishes
            </label>
            <input
              className={styles.input}
              id="endsOn"
              name="endsOn"
              type="date"
              defaultValue={event.endsOn}
            />
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
          defaultValue={event.location}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="summary">
          Anything you would like to say about it
        </label>
        <span className={styles.hint}>This is optional — you can leave it empty.</span>
        <textarea
          className={styles.textarea}
          id="summary"
          name="summary"
          defaultValue={event.summary}
        />
      </div>

      <div className={styles.field}>
        <PhotoPicker
          photos={photos}
          onChange={setPhotos}
          hint="The first photo is the one people see on the Events page. Use the arrows to change the order, or Remove to take one out."
        />
      </div>

      <div className={styles.actions}>
        <button className={styles.primary} type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save'}
        </button>
        <Link className={styles.secondary} href="/admin/events">
          Cancel
        </Link>
      </div>
    </form>
  );
}
