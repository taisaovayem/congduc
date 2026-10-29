import { useEffect, useRef, useState } from 'react';
import type { IncenseRealtimeState } from '@/shared/api/types';

/** Đếm ngược mỗi giây từ `endsAt` do server gửi — chỉ hiển thị, không thay logic ghi sổ. */
export function useIncenseCountdown(
  state: IncenseRealtimeState | undefined,
  onBurnedOut: () => void,
) {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [burning, setBurning] = useState(false);
  const burnedOutRef = useRef(false);

  useEffect(() => {
    burnedOutRef.current = false;
  }, [state?.endsAt, state?.active]);

  useEffect(() => {
    if (!state?.active || !state.endsAt) {
      setBurning(false);
      setRemainingSeconds(0);
      return;
    }

    const endsAtMs = new Date(state.endsAt).getTime();

    const tick = () => {
      const left = Math.max(0, Math.ceil((endsAtMs - Date.now()) / 1000));
      setRemainingSeconds(left);
      setBurning(left > 0);

      if (left === 0 && !burnedOutRef.current) {
        burnedOutRef.current = true;
        onBurnedOut();
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [state?.active, state?.endsAt, onBurnedOut]);

  return { burning, remainingSeconds };
}
