import { useEffect, useState } from 'react';

/** Tỉ lệ thân nhang còn lại (1 → 0), cập nhật mượt theo thời gian thực. */
export function useIncenseBurnProgress(
  burning: boolean,
  startedAt: string | undefined,
  endsAt: string | undefined,
) {
  const [bodyRatio, setBodyRatio] = useState(0);

  useEffect(() => {
    if (!burning || !startedAt || !endsAt) {
      setBodyRatio(0);
      return;
    }

    const startMs = new Date(startedAt).getTime();
    const endMs = new Date(endsAt).getTime();
    const durationMs = Math.max(1, endMs - startMs);

    let frame = 0;
    const tick = () => {
      const now = Date.now();
      const elapsed = Math.min(durationMs, Math.max(0, now - startMs));
      const remaining = 1 - elapsed / durationMs;
      setBodyRatio(Math.max(0, remaining));
      if (now < endMs) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [burning, startedAt, endsAt]);

  return bodyRatio;
}
