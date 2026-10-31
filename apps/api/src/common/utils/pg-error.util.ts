import { QueryFailedError } from 'typeorm';

export function isCoCultivationRoomMissingError(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) {
    return false;
  }
  const driver = error.driverError as { code?: string; constraint?: string };
  return (
    driver?.code === '23503' &&
    driver?.constraint === 'FK_co_cultivation_room_members_room'
  );
}
