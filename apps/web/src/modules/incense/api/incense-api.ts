import { apiFetch } from '@/shared/api/http-client';
import type { ActiveIncense } from '@/shared/api/types';

export function startIncense(deviceId: string) {
  return apiFetch<ActiveIncense>('/incense/start', {
    method: 'POST',
    deviceId,
  });
}

export function fetchActiveIncense(deviceId: string) {
  return apiFetch<ActiveIncense | null>('/incense/active', { deviceId });
}
