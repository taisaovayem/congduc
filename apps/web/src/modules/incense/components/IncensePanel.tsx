import { useCallback, useLayoutEffect } from "react";
import { IncenseBurnerVisual } from "./IncenseBurnerVisual";
import { useIncenseCountdown } from "../hooks/use-incense-countdown";
import { useIncenseState, useStartIncense } from "../hooks/use-incense";
import { useMeritPops } from "@/shared/hooks/use-merit-pops";

interface IncensePanelProps {
  sessionReady: boolean;
  syncIncense: () => void;
  registerMeritPop?: (spawn: (amount: number) => void) => void;
}

export function IncensePanel({ sessionReady, syncIncense, registerMeritPop }: IncensePanelProps) {
  const { pops, spawn } = useMeritPops();

  useLayoutEffect(() => {
    registerMeritPop?.(spawn);
  }, [registerMeritPop, spawn]);
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
        pops={pops}
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
