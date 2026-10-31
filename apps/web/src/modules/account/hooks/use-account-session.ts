import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStoredDeviceId, setStoredDeviceId } from '@/shared/storage/device-session';
import { ensureSession, fetchAccountProfile, updateAccountNickname } from '../api/account-api';

export const accountQueryKey = ['account', 'me'] as const;

export function useEnsureSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const existing = getStoredDeviceId();
      const session = await ensureSession(existing);
      setStoredDeviceId(session.deviceId);
      return session;
    },
    onSuccess: (session) => {
      queryClient.setQueryData(accountQueryKey, session.account);
    },
  });
}

export function useAccountProfile(enabled: boolean) {
  const deviceId = getStoredDeviceId();
  return useQuery({
    queryKey: accountQueryKey,
    queryFn: () => fetchAccountProfile(deviceId!),
    enabled: enabled && Boolean(deviceId),
    refetchInterval: 5000,
  });
}

export function useUpdateNickname() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (nickname: string) => {
      const deviceId = getStoredDeviceId();
      if (!deviceId) {
        throw new Error('Chưa có phiên thiết bị');
      }
      return updateAccountNickname(deviceId, nickname);
    },
    onSuccess: (account) => {
      queryClient.setQueryData(accountQueryKey, account);
    },
  });
}
