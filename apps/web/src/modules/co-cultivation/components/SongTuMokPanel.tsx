import { MokDrumButton } from '@/modules/mok/components/MokDrumButton';
import { useMokSound } from '@/modules/mok/hooks/use-mok-sound';

interface SongTuMokPanelProps {
  /** Socket `/co-cultivation` trong phòng. */
  socketConnected: boolean;
  /** Chỉ gõ được khi phòng đang song tu. */
  practiceActive: boolean;
  onHit: () => void;
}

export function SongTuMokPanel({
  socketConnected,
  practiceActive,
  onHit,
}: SongTuMokPanelProps) {
  const playMoSound = useMokSound();
  const canHit = socketConnected && practiceActive;

  const handleHit = () => {
    if (!canHit) {
      return;
    }
    playMoSound();
    onHit();
  };

  return (
    <div className="relative mx-auto w-fit">
      <MokDrumButton
        disabled={!canHit}
        onClick={handleHit}
        ariaLabel="Gõ mõ song tu"
      />
    </div>
  );
}
