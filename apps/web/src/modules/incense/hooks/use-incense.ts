import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AccountProfile, ActiveIncense, IncenseRealtimeState } from '@/shared/api/types';
import { getStoredDeviceId } from '@/shared/storage/device-session';
import { accountQueryKey } from '@/modules/account/hooks/use-account-session';
import { startIncense } from '../api/incense-api';

export const activeIncenseQueryKey = ['incense', 'active'] as const;

const idleIncenseState: IncenseRealtimeState = {
  active: false,
  remainingSeconds: 0,
  meritPoints: '0',
};

export function activeIncenseToRealtime(
  view: ActiveIncense,
  meritPoints: string,
): IncenseRealtimeState {
  return {
    active: view.remainingSeconds > 0,
    remainingSeconds: view.remainingSeconds,
    meritPoints,
    startedAt: view.startedAt,
    endsAt: view.endsAt,
  };
}

/** Cache cập nhật qua socket `incense:update` và sau POST thắp nhang. */
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
    onSuccess: (view) => {
      const account = queryClient.getQueryData<AccountProfile>(accountQueryKey);
      const meritPoints = account?.meritPoints ?? '0';
      queryClient.setQueryData(
        activeIncenseQueryKey,
        activeIncenseToRealtime(view, meritPoints),
      );
    },
  });
}
