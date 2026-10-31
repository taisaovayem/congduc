import moImage from '@/assets/images/mo.png';

interface MokDrumButtonProps {
  disabled?: boolean;
  onClick: () => void;
  ariaLabel?: string;
}

export function MokDrumButton({
  disabled = false,
  onClick,
  ariaLabel = 'Gõ mõ',
}: MokDrumButtonProps) {
  return (
    <button
      type="button"
      className="mx-auto block cursor-pointer rounded-xl border-0 bg-transparent p-0 leading-none outline-none transition-[transform,opacity] duration-75 select-none [-webkit-tap-highlight-color:transparent] hover:enabled:scale-[1.03] active:enabled:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-45 focus:outline-none focus-visible:outline-none focus-visible:shadow-none"
      onClick={onClick}
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
