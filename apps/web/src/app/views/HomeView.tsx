import { IncensePanel } from '@/modules/incense/components/IncensePanel';
import { MokPanel } from '@/modules/mok/components/MokPanel';
import { useRealtimeSocket } from '@/modules/realtime/hooks/use-realtime-socket';
import styles from './HomeView.module.scss';

interface HomeViewProps {
  sessionReady: boolean;
}

export function HomeView({ sessionReady }: HomeViewProps) {
  const { connected, hitMok, syncIncense, lastBroadcast } = useRealtimeSocket(sessionReady);

  return (
    <div className={styles.stack}>
      <IncensePanel sessionReady={sessionReady} syncIncense={syncIncense} />
      <MokPanel connected={connected} hitMok={hitMok} lastBroadcast={lastBroadcast} />
    </div>
  );
}
