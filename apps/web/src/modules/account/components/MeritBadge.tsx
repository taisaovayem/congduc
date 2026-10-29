import styles from './MeritBadge.module.scss';

interface MeritBadgeProps {
  meritPoints: string;
}

export function MeritBadge({ meritPoints }: MeritBadgeProps) {
  return (
    <div className={styles.badge}>
      <span className={styles.label}>Công đức</span>
      <strong className={styles.value}>{meritPoints}</strong>
    </div>
  );
}
