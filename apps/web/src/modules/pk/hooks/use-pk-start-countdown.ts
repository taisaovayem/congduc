import { useEffect, useState } from 'react';

/** Đếm ngược chuẩn bị từ `matchStartedAt` (server đặt trước 3 giây so với lúc mở gõ mõ). */
export function usePkStartCountdown(
  matchStartedAt: string | null | undefined,
  active: boolean,
) {
  const [countdownSeconds, setCountdownSeconds] = useState(0);

  useEffect(() => {
    if (!active || !matchStartedAt) {
      setCountdownSeconds(0);
      return;
    }

    const startMs = new Date(matchStartedAt).getTime();

    const tick = () => {
      setCountdownSeconds(Math.max(0, Math.ceil((startMs - Date.now()) / 1000)));
    };

    tick();
    const id = window.setInterval(tick, 200);
    return () => clearInterval(id);
  }, [active, matchStartedAt]);

  const inCountdown = active && countdownSeconds > 0;
  return { inCountdown, countdownSeconds };
}
