import { useCallback } from "react";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
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
    <>
      <IncenseBurnerVisual
        burning={active}
        startedAt={incenseState?.startedAt}
        endsAt={incenseState?.endsAt}
      />
      {active ? (
        <p className="text-center text-white">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </p>
      ) : null}
      {!active && (
        <Button
          variant="primary"
          loading={startIncense.isPending}
          disabled={Boolean(active)}
          onClick={() => startIncense.mutate()}
        >
          <Button.Label>Thắp hương</Button.Label>
        </Button>
      )}
    </>
  );
}
