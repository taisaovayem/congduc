import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStoredDeviceId } from '@/shared/storage/device-session';
import type { PkMode } from '@/shared/api/types';
import { createPkRoom, fetchPkRooms, joinPkByCode, quickJoinPk } from '../api/pk-api';

export const pkRoomsQueryKey = ['pk', 'rooms'] as const;

export function usePkRooms(enabled: boolean) {
  return useQuery({
    queryKey: pkRoomsQueryKey,
    queryFn: () => fetchPkRooms(),
    enabled,
    refetchInterval: 4000,
  });
}

export function useCreatePkRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name?: string;
      password?: string;
      teamSize?: number;
      mode?: PkMode;
      stakeAmount?: string;
      durationMinutes?: number;
    }) => {
      const deviceId = getStoredDeviceId();
      if (!deviceId) {
        throw new Error('Chưa có phiên thiết bị');
      }
      return createPkRoom(deviceId, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pkRoomsQueryKey });
    },
  });
}

export function useJoinPkByCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { roomCode: string; password?: string }) => {
      const deviceId = getStoredDeviceId();
      if (!deviceId) {
        throw new Error('Chưa có phiên thiết bị');
      }
      return joinPkByCode(deviceId, input.roomCode, input.password);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pkRoomsQueryKey });
    },
  });
}

export function useQuickJoinPk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      const deviceId = getStoredDeviceId();
      if (!deviceId) {
        throw new Error('Chưa có phiên thiết bị');
      }
      return quickJoinPk(deviceId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pkRoomsQueryKey });
    },
  });
}
