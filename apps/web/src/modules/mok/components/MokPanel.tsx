import moImage from '@/assets/images/mo.png';
import { useMokSound } from '../hooks/use-mok-sound';

interface MokPanelProps {
  connected: boolean;
  hitMok: () => void;
}

export function MokPanel({ connected, hitMok }: MokPanelProps) {
  const playMoSound = useMokSound();

  const handleHit = () => {
    playMoSound();
    hitMok();
  };

  return (
    <button
      type="button"
      className="mx-auto block cursor-pointer rounded-xl border-0 bg-transparent p-0 leading-none outline-none transition-[transform,opacity] duration-75 select-none [-webkit-tap-highlight-color:transparent] hover:enabled:scale-[1.03] active:enabled:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-45 focus:outline-none focus-visible:outline-none focus-visible:shadow-none"
      onClick={handleHit}
      disabled={!connected}
      aria-label="Gõ mõ"
    >
      <img
        src={moImage}
        alt=""
        className="pointer-events-none block h-auto w-[140px] max-w-full select-none object-contain"
        draggable={false}
      />
    </button>
  );
}
