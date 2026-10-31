import { useEffect, useState } from 'react';

export function usePkMatchTimer(matchEndsAt: string | null | undefined, active: boolean) {
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!active || !matchEndsAt) {
      setRemainingSeconds(0);
      return;
    }

    const tick = () => {
      const ms = new Date(matchEndsAt).getTime() - Date.now();
      setRemainingSeconds(Math.max(0, Math.ceil(ms / 1000)));
    };

    tick();
    const id = window.setInterval(tick, 500);
    return () => clearInterval(id);
  }, [active, matchEndsAt]);

  return remainingSeconds;
}

export function formatMatchTimer(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
