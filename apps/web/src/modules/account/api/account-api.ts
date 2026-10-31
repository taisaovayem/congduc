import { apiFetch } from '@/shared/api/http-client';
import type { AccountProfile, SessionResponse } from '@/shared/api/types';

export function ensureSession(deviceId: string | null) {
  return apiFetch<SessionResponse>('/accounts/session', {
    method: 'POST',
    body: JSON.stringify(deviceId ? { deviceId } : {}),
  });
}

export function fetchAccountProfile(deviceId: string) {
  return apiFetch<AccountProfile>('/accounts/me', { deviceId });
}

export function updateAccountNickname(deviceId: string, nickname: string) {
  return apiFetch<AccountProfile>('/accounts/me/nickname', {
    method: 'PATCH',
    deviceId,
    body: JSON.stringify({ nickname }),
  });
}
