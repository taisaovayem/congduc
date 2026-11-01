import clsx from 'clsx';
import luHuongImage from '@/assets/images/lu-huong.png';
import { MeritPopOverlay } from '@/shared/components/MeritPopOverlay';
import type { MeritPopItem } from '@/shared/hooks/use-merit-pops';
import { useIncenseBurnProgress } from '../hooks/use-incense-burn-progress';

interface IncenseBurnerVisualProps {
  burning: boolean;
  startedAt?: string;
  endsAt?: string;
  pops?: MeritPopItem[];
  onStart?: () => void;
  startDisabled?: boolean;
}

const MAX_BODY_PX = 160;

const SMOKE_WISPS = [
  'h-[68px] animate-smoke-a [animation-delay:0s]',
  'h-20 w-[7px] -ml-[3px] animate-smoke-b [animation-delay:0.9s]',
  'h-[76px] animate-smoke-c [animation-delay:1.8s]',
  'h-[84px] w-2 animate-smoke-b [animation-delay:2.6s] [animation-direction:reverse]',
  'h-[90px] w-1.5 animate-smoke-a [animation-delay:3.4s] [animation-direction:reverse]',
] as const;

export function IncenseBurnerVisual({
  burning,
  startedAt,
  endsAt,
  pops = [],
  onStart,
  startDisabled = false,
}: IncenseBurnerVisualProps) {
  const bodyRatio = useIncenseBurnProgress(burning, startedAt, endsAt);

  const bodyHeight = Math.round(MAX_BODY_PX * bodyRatio);
  const showStick = burning && bodyRatio > 0.01;

  const idleButtonClass =
    'relative mx-auto mb-1 block w-full max-w-[220px] cursor-pointer rounded-xl border-0 bg-transparent p-0 leading-none outline-none transition-[transform,opacity] duration-75 select-none [-webkit-tap-highlight-color:transparent] hover:enabled:scale-[1.02] active:enabled:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 focus:outline-none focus-visible:outline-none focus-visible:shadow-none md:mb-4';

  const inner = (
    <>
      <MeritPopOverlay pops={pops} anchor="incense" />
      <svg className="absolute h-0 w-0 overflow-hidden" aria-hidden focusable="false">
        <defs>
          <filter
            id="incense-body-grain"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.75 0.08"
              numOctaves="4"
              seed="11"
              stitchTiles="stitch"
              result="noise"
            />
            <feColorMatrix
              in="noise"
              type="matrix"
              values="0 0 0 0 0.45  0 0 0 0 0.28  0 0 0 0 0.05  0 0 0 0.28 0"
              result="grain"
            />
            <feBlend in="SourceGraphic" in2="grain" mode="multiply" />
          </filter>
        </defs>
      </svg>

      <img
        src={luHuongImage}
        alt=""
        className="pointer-events-none block h-auto w-full select-none"
        draggable={false}
      />

      {showStick ? (
        <div className="absolute bottom-[56%] left-1/2 z-[2] flex -translate-x-1/2 flex-col items-center justify-center md:bottom-[64%]">
          <div className="pointer-events-none relative z-[4] mb-[-8px] h-[132px] w-16 overflow-visible">
            {SMOKE_WISPS.map((className, index) => (
              <span key={index} className={clsx('incense-smoke-wisp', className)} />
            ))}
          </div>

          <div className="incense-flame" />

          <div className="incense-body" style={{ height: `${bodyHeight}px` }}>
            <span className="incense-body-grain" />
          </div>

          <div className="incense-foot">
            <span className="incense-foot-grain" />
          </div>
        </div>
      ) : null}
    </>
  );

  if (burning) {
    return (
      <div className="relative mx-auto mb-1 w-full max-w-[220px] md:mb-4" aria-hidden>
        {inner}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={idleButtonClass}
      onClick={onStart}
      disabled={startDisabled || !onStart}
      aria-label="Thắp hương"
    >
      {inner}
    </button>
  );
}
