import { randomInt } from 'crypto';

export const PK_BLOCK_MS = 5_000;
export const PK_TEAM_BONUS_RATE = 0.2;

export const RANDOM_PK_ROOM_NAMES = [
  'Đấu đế',
  'Song đấu',
  'Hội võ',
  'Tỷ võ',
  'Đối chiến',
  'Song phương',
  'Hồng lam',
  'Tranh tài',
  'Đua công đức',
  'Song hùng',
] as const;

export function pickRandomPkRoomName(): string {
  const index = randomInt(RANDOM_PK_ROOM_NAMES.length);
  return RANDOM_PK_ROOM_NAMES[index]!;
}
