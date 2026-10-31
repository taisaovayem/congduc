import { IncensePanel } from '@/modules/incense/components/IncensePanel';
import { HomeMokPanel } from '@/modules/mok/components/HomeMokPanel';
import { useRealtimeSocket } from '@/modules/realtime/hooks/use-realtime-socket';

interface HomeViewProps {
  sessionReady: boolean;
}

export function HomeView({ sessionReady }: HomeViewProps) {
  const { connected, hitMok, syncIncense } = useRealtimeSocket(sessionReady);

  return (
    <div className="mt-auto flex translate-y-2 flex-col gap-2 md:translate-y-0 md:gap-5">
      <IncensePanel sessionReady={sessionReady} syncIncense={syncIncense} />
      <HomeMokPanel socketConnected={connected} onHit={hitMok} />
    </div>
  );
}
