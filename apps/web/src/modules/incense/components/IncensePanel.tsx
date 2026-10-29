import { useCallback } from "react";
import { IncenseBurnerVisual } from "./IncenseBurnerVisual";
import { useIncenseCountdown } from "../hooks/use-incense-countdown";
import { useIncenseState, useStartIncense } from "../hooks/use-incense";

interface IncensePanelProps {
  sessionReady: boolean;
  syncIncense: () => void;
}

export function IncensePanel({ sessionReady, syncIncense }: IncensePanelProps) {
  const { data: incenseState } = useIncenseState(sessionReady);
  const startIncense = useStartIncense();

  const onBurnedOut = useCallback(() => {
    syncIncense();
  }, [syncIncense]);

  const { burning, remainingSeconds: remaining } = useIncenseCountdown(
    incenseState,
    onBurnedOut,
  );

  const active = burning;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="relative">
      <IncenseBurnerVisual
        burning={active}
        startedAt={incenseState?.startedAt}
        endsAt={incenseState?.endsAt}
        onStart={() => startIncense.mutate()}
        startDisabled={!sessionReady || startIncense.isPending}
      />
      {active ? (
        <p className="text-center text-white absilute bottom-0 text-sm">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </p>
      ) : null}
    </div>
  );
}
