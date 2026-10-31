import { apiFetch } from '@/shared/api/http-client';
import type { PkRoomListItem, PkRoomView } from '@/shared/api/types';
import { getStoredDeviceId } from '@/shared/storage/device-session';

export function fetchPkRooms() {
  const deviceId = getStoredDeviceId();
  return apiFetch<PkRoomListItem[]>('/pk/rooms', { deviceId });
}

export function createPkRoom(
  deviceId: string,
  input: {
    name?: string;
    password?: string;
    teamSize?: number;
    mode?: string;
    stakeAmount?: string;
    durationMinutes?: number;
  },
) {
  return apiFetch<PkRoomView>('/pk/rooms', {
    method: 'POST',
    deviceId,
    body: JSON.stringify(input),
  });
}

export function joinPkByCode(deviceId: string, roomCode: string, password?: string) {
  return apiFetch<PkRoomView>('/pk/rooms/join', {
    method: 'POST',
    deviceId,
    body: JSON.stringify({ roomCode, password }),
  });
}

export function quickJoinPk(deviceId: string) {
  return apiFetch<PkRoomView>('/pk/rooms/quick-join', {
    method: 'POST',
    deviceId,
  });
}

export function joinPkById(deviceId: string, roomId: string, password?: string) {
  return apiFetch<PkRoomView>(`/pk/rooms/${roomId}/join`, {
    method: 'POST',
    deviceId,
    body: JSON.stringify({ password }),
  });
}

export function leavePkRoom(deviceId: string, roomId: string) {
  return apiFetch<{ dissolved: boolean }>(`/pk/rooms/${roomId}/leave`, {
    method: 'POST',
    deviceId,
  });
}
