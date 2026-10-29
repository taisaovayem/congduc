import clsx from 'clsx';
import type { MeritPopItem } from '@/shared/hooks/use-merit-pops';

type MeritPopAnchor = 'mok' | 'incense';

interface MeritPopOverlayProps {
  pops: MeritPopItem[];
  anchor: MeritPopAnchor;
}

export function MeritPopOverlay({ pops, anchor }: MeritPopOverlayProps) {
  return (
    <>
      {pops.map((pop) => (
        <span
          key={pop.id}
          aria-hidden
          className={clsx('merit-pop', anchor === 'mok' ? 'merit-pop--mok' : 'merit-pop--incense')}
          style={{ ['--merit-drift' as string]: `${pop.driftPx * 10}px` }}
        >
          +{pop.amount} công đức
        </span>
      ))}
    </>
  );
}
