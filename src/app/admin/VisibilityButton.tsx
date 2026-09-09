'use client';

import { useTransition } from 'react';
import styles from './admin.module.css';

/**
 * Takes something off the website, or puts it back.
 *
 * Hiding asks first and names what it is about to hide — a bare "Are you sure?"
 * tells you nothing about which row you actually clicked. Putting something
 * back asks nothing, because that direction is not the risky one.
 */
export function VisibilityButton({
  hidden,
  name,
  action,
}: {
  hidden: boolean;
  name: string;
  action: (hidden: boolean) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    if (!hidden) {
      const message = `Take "${name}" off the website?\n\nIt will not appear to visitors, but it stays here so you can put it back.`;
      if (!window.confirm(message)) return;
    }
    startTransition(() => {
      void action(!hidden);
    });
  };

  return (
    <button
      type="button"
      className={`${styles.rowBtn} ${hidden ? '' : styles.rowBtnDanger}`}
      onClick={onClick}
      disabled={pending}
    >
      {pending ? 'Working…' : hidden ? 'Put back' : 'Remove'}
    </button>
  );
}
