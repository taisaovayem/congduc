interface MeritBadgeProps {
  meritPoints: string;
}

export function MeritBadge({ meritPoints }: MeritBadgeProps) {
  return (
    <div className="inline-flex flex-col items-end gap-0.5 rounded-lg bg-temple-ink px-3 py-2 text-[#f5e6c8]">
      <span className="text-xs opacity-85">Công đức</span>
      <strong className="text-[22px] leading-tight">{meritPoints}</strong>
    </div>
  );
}
