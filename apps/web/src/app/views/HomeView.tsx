import { useCallback, useRef } from 'react';
import { IncensePanel } from '@/modules/incense/components/IncensePanel';
import { HomeMokPanel } from '@/modules/mok/components/HomeMokPanel';
import { useRealtimeSocket } from '@/modules/realtime/hooks/use-realtime-socket';

interface HomeViewProps {
  sessionReady: boolean;
}

export function HomeView({ sessionReady }: HomeViewProps) {
  const incenseMeritPopRef = useRef<((amount: number) => void) | null>(null);
  const onIncenseMeritCredited = useCallback((amount: number) => {
    incenseMeritPopRef.current?.(amount);
  }, []);
  const registerMeritPop = useCallback((spawn: (amount: number) => void) => {
    incenseMeritPopRef.current = spawn;
  }, []);
  const { connected, hitMok, syncIncense } = useRealtimeSocket(sessionReady, {
    onIncenseMeritCredited,
  });

  return (
    <div className="mt-auto flex translate-y-2 flex-col gap-2 md:translate-y-0 md:gap-5">
      <IncensePanel
        sessionReady={sessionReady}
        syncIncense={syncIncense}
        registerMeritPop={registerMeritPop}
      />
      <HomeMokPanel socketConnected={connected} onHit={hitMok} />
    </div>
  );
}
