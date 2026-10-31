import moImage from '@/assets/images/mo.png';
import clsx from 'clsx';
import { useCallback, useRef, useState } from 'react';
import { useMokSpaceKey } from '../hooks/use-mok-space-key';

interface MokDrumButtonProps {
  disabled?: boolean;
  onClick: () => void;
  ariaLabel?: string;
}

const PRESS_VISUAL_MS = 75;

export function MokDrumButton({
  disabled = false,
  onClick,
  ariaLabel = 'Gõ mõ',
}: MokDrumButtonProps) {
  const pressReleaseTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [spacePressed, setSpacePressed] = useState(false);

  const flashPressVisual = useCallback(() => {
    setSpacePressed(true);
    if (pressReleaseTimerRef.current) {
      clearTimeout(pressReleaseTimerRef.current);
    }
    pressReleaseTimerRef.current = setTimeout(() => {
      setSpacePressed(false);
    }, PRESS_VISUAL_MS);
  }, []);

  const handleSpaceHit = useCallback(() => {
    flashPressVisual();
    onClick();
  }, [flashPressVisual, onClick]);

  useMokSpaceKey(handleSpaceHit, !disabled);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled || event.button !== 0) {
      return;
    }
    event.preventDefault();
    onClick();
  };

  return (
    <button
      type="button"
      className={clsx(
        'mx-auto block cursor-pointer rounded-xl border-0 bg-transparent p-0 leading-none outline-none transition-[transform,opacity] duration-75 select-none touch-none [-webkit-tap-highlight-color:transparent] hover:enabled:scale-[1.03] active:enabled:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-45 focus:outline-none focus-visible:outline-none focus-visible:shadow-none',
        spacePressed && 'scale-[0.96]',
      )}
      onPointerDown={handlePointerDown}
      onKeyDown={(event) => {
        if (event.code === 'Space') {
          event.preventDefault();
        }
      }}
      disabled={disabled}
      aria-label={ariaLabel}
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
