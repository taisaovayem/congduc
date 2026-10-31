import { randomInt } from 'crypto';

export const SONG_TU_BLOCK_MS = 5_000;
export const SONG_TU_BONUS_RATE = 0.2;

export const RANDOM_ROOM_NAMES = [
  'Niệm Phật',
  'Quán Tự Tại',
  'Tùy duyên',
  'An lạc',
  'Giác ngộ',
  'Từ bi',
  'Trí tuệ',
  'Bát chánh đạo',
  'Vô thường',
  'Nhân quả',
  'Tinh tấn',
  'Thiền định',
  'Giải thoát',
  'Pháp hoa',
  'Kim cang',
  'A Di Đà',
  'Diệu Pháp',
  'Thanh tịnh',
  'Hộ trì tam bảo',
  'Phát tâm vô thượng',
] as const;

export function pickRandomRoomName(): string {
  const index = randomInt(RANDOM_ROOM_NAMES.length);
  return RANDOM_ROOM_NAMES[index]!;
}
