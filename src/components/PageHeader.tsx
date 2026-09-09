import styles from './PageHeader.module.css';

export function PageHeader({ title, lede }: { title: string; lede?: string }) {
  return (
    <div className={styles.band}>
      <div className="wrap">
        <h1>{title}</h1>
        <div className={styles.rule} />
        {lede ? <p className={styles.lede}>{lede}</p> : null}
      </div>
    </div>
  );
}
