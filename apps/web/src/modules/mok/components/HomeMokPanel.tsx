import { MeritPopOverlay } from '@/shared/components/MeritPopOverlay';
import { useMeritPops } from '@/shared/hooks/use-merit-pops';
import { useMokSound } from '../hooks/use-mok-sound';
import { MokDrumButton } from './MokDrumButton';

interface HomeMokPanelProps {
  /** Socket `/realtime` — chỉ dùng ở trang chủ. */
  socketConnected: boolean;
  onHit: () => void;
}

export function HomeMokPanel({ socketConnected, onHit }: HomeMokPanelProps) {
  const playMoSound = useMokSound();
  const { pops, spawn } = useMeritPops();

  const handleHit = () => {
    if (!socketConnected) {
      return;
    }
    playMoSound();
    onHit();
    spawn();
  };

  return (
    <div className="relative mx-auto w-fit">
      <MeritPopOverlay pops={pops} anchor="mok" />
      <MokDrumButton disabled={!socketConnected} onClick={handleHit} ariaLabel="Gõ mõ trang chủ" />
    </div>
  );
}
