import { useCallback, useRef, useState } from 'react';

export const MERIT_POP_DURATION_MS = 1_050;

export interface MeritPopItem {
  id: number;
  driftPx: number;
  amount: number;
}

export function useMeritPops() {
  const nextIdRef = useRef(0);
  const [pops, setPops] = useState<MeritPopItem[]>([]);

  const spawn = useCallback((amount = 1) => {
    const id = nextIdRef.current + 1;
    nextIdRef.current = id;
    const driftPx = (id % 5) - 2;

    setPops((prev) => [...prev, { id, driftPx, amount }]);

    window.setTimeout(() => {
      setPops((prev) => prev.filter((pop) => pop.id !== id));
    }, MERIT_POP_DURATION_MS);
  }, []);

  return { pops, spawn };
}
