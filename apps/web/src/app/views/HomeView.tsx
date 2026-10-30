import { IncensePanel } from '@/modules/incense/components/IncensePanel';
import { MokPanel } from '@/modules/mok/components/MokPanel';
import { useRealtimeSocket } from '@/modules/realtime/hooks/use-realtime-socket';

interface HomeViewProps {
  sessionReady: boolean;
}

export function HomeView({ sessionReady }: HomeViewProps) {
  const { connected, hitMok, syncIncense } = useRealtimeSocket(sessionReady);

  return (
    <div className="mt-auto flex flex-col gap-2 md:gap-5">
      <IncensePanel sessionReady={sessionReady} syncIncense={syncIncense} />
      <MokPanel connected={connected} hitMok={hitMok} />
    </div>
  );
}
