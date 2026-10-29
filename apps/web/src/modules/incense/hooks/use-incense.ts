import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IncenseRealtimeState } from '@/shared/api/types';
import { getStoredDeviceId } from '@/shared/storage/device-session';
import { startIncense } from '../api/incense-api';

export const activeIncenseQueryKey = ['incense', 'active'] as const;

const idleIncenseState: IncenseRealtimeState = {
  active: false,
  remainingSeconds: 0,
  meritPoints: '0',
};

/** Cache cập nhật qua socket `incense:update` — không poll REST. */
export function useIncenseState(sessionReady: boolean) {
  const deviceId = getStoredDeviceId();
  return useQuery({
    queryKey: activeIncenseQueryKey,
    queryFn: async () => idleIncenseState,
    enabled: sessionReady && Boolean(deviceId),
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useStartIncense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => startIncense(getStoredDeviceId()!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: activeIncenseQueryKey });
    },
  });
}
