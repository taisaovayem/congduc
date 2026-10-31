import { apiFetch } from '@/shared/api/http-client';
import type {
  CoCultivationRoomListItem,
  CoCultivationRoomView,
} from '@/shared/api/types';
import { getStoredDeviceId } from '@/shared/storage/device-session';

export function fetchCoCultivationRooms() {
  const deviceId = getStoredDeviceId();
  return apiFetch<CoCultivationRoomListItem[]>('/co-cultivation/rooms', { deviceId });
}

export function createCoCultivationRoom(
  deviceId: string,
  input: { name?: string; password?: string },
) {
  return apiFetch<CoCultivationRoomView>('/co-cultivation/rooms', {
    method: 'POST',
    deviceId,
    body: JSON.stringify(input),
  });
}

export function joinCoCultivationByCode(
  deviceId: string,
  roomCode: string,
  password?: string,
) {
  return apiFetch<CoCultivationRoomView>('/co-cultivation/rooms/join', {
    method: 'POST',
    deviceId,
    body: JSON.stringify({ roomCode, password }),
  });
}

export function quickJoinCoCultivation(deviceId: string) {
  return apiFetch<CoCultivationRoomView>('/co-cultivation/rooms/quick-join', {
    method: 'POST',
    deviceId,
  });
}

export function joinCoCultivationById(deviceId: string, roomId: string, password?: string) {
  return apiFetch<CoCultivationRoomView>(`/co-cultivation/rooms/${roomId}/join`, {
    method: 'POST',
    deviceId,
    body: JSON.stringify({ password }),
  });
}

export function leaveCoCultivationRoom(deviceId: string, roomId: string) {
  return apiFetch<{ dissolved: boolean }>(`/co-cultivation/rooms/${roomId}/leave`, {
    method: 'POST',
    deviceId,
  });
}

export function fetchCoCultivationRoom(deviceId: string, roomId: string) {
  return apiFetch<CoCultivationRoomView>(`/co-cultivation/rooms/${roomId}`, { deviceId });
}
