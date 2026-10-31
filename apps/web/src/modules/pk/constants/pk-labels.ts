import type { PkMode } from '@/shared/api/types';

export const PK_MODE_LABELS: Record<PkMode, string> = {
  friendly: 'Giao hữu',
  winner_takes_all: 'Thắng nhận hết',
  fixed_stake: 'Cược cụ thể',
};

export function formatPkTeamSize(size: number): string {
  return `${size} vs ${size}`;
}
